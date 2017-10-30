var config = require('./config.js');

var colors = require('colors');
var mysql = require('mysql2');

var fs = require('fs');
var SteamUser = require('steam-user');
var Steamcommunity = require('steamcommunity');
var SteamTotp = require('steam-totp');
var TradeOfferManager = require('steam-tradeoffer-manager');
var request = require('request');
var crypto = require('crypto');

var connection = mysql.createConnection({
    host: config.db.host, 
  	user: config.db.user,
    password: config.db.password,
 	database: config.db.database
});


var account = {
    accountName: config.bot.accountName, 
    password:  config.bot.password,
    shared_secret:  config.bot.shared_secret,
    identity_secret: config.bot.identity_secret
};

var steamapiio_key = '1bb8233e5582b18a1b831215d2fe4e9d';
var steamapis_key = config.steamapis_key;

var adminIds = config.admins;
var allowedAppids = [252490]; //CSGO: 730 | RUST: 252490

var minPrice = 0.01;


var settings = {
	jackpotPaused: false,
	chatPaused: false
};


var announcement = '<span class="redText"> RELEASE SOON </span>';

var playerInfo = {};

var io;
var socket_port = config.socket_port;

var currentChat = [];
var maxChatLength = 20;

var roundNumber = 1;
var gameloopInterval;

var itemsInPot = 0;
var potPlayers = [];
var dataItemsInPot = [];
var itemQueue = [];

var roundTotal = 0;

var currentHash = 'f10d97ddfad20146fdaf8b4b7f915f9ced3896d0'; 
var currentSalt = '0wbw5djl';


var waitTime = config.waitTime;
var timeLeft = waitTime;

var isPotRunning = false;
var isRolling = false; 

var lastWinner = { roundid: 0, name: 'Cristal', amount: '1337.88', percentage: '0.69', img: 'cykablyat.png', ticket: 0.691337, steamid: '12314', hash: '132141323NOSCAM', salt: '3123Kappa'};
var historyGames = [];

var userTotalBanned = [];
var userChatBanned = [];


function setup(){
	io = require('socket.io')(socket_port);
	ioSetup();
}

function clearConsole() {
	process.stdout.write("\u001b[2J\u001b[0;0H");
	console.log(colors.red('RustyPot.com')+ colors.yellow(' by') + colors.green(' CRISTAL | FABSCH'));
}

function ioSetup(){
	logInfo('Socket running on port '+socket_port);
	io.on('connection', function (socket) {
		initSocket(socket);
		socket.on('userConnection', function(user_connection_data){
			connection.query('SELECT * FROM user WHERE userHash = ?', user_connection_data.userHash, function(error, results){
				if(!error){
					if(results.length == 1){
						if(userTotalBanned.indexOf(results[0].steamid) != -1){
							notifySocket(socket, 'error', 'You are banned from the Site! ');
							notifySocket(socket, 'info', 'Please contact support if you want to appeal this ban');
						} else {
							socket.join(results[0].steamid+'');
							initLoggedInSocket(socket, results[0].steamid, results[0].steamname, results[0].avatar, results[0].avatar_small, results[0].tradelink, results[0].rank, Math.round(results[0].deposited / 5));
							if(results[0].rank == 100){
								socket.join('admin');
								initAdminSocket(socket, results[0].steamid, results[0].steamname);
							} else {
								socket.join('normal');
							}
						}
					} else {
						notifySocket(socket, 'error', 'Failed to find your Userdata.');
					}
				} else {
					notifySocket(socket, 'error', 'Error while loading your Userdata.');
				}
			});
		});
	});
}

function initSocket(socket){
	emitJackpotData(socket);

	emitChatMessages(socket);

	emitGameHistoryAll(socket);

	emitItemsInPotAll(socket);

	emitAnnouncement(socket);
}

function initLoggedInSocket(socket, steamid, name, avatar, avatar_small, tradelink, rank, level){
	notifySocket(socket, 'info', 'Authenticated as '+steamid);

	socket.on('chatMessage', function(data){
		if(typeof(data.message) == 'string'){
			if(isTimeout(steamid, 'chat')){
				notifySocket(socket, 'error', 'You are only allowed to send a chat message once every 5 Seconds!');
				return;
			} else {
				timeoutAction(steamid, 'chat', 20);
			}
			if(!settings.chatPaused){
				if(userChatBanned.indexOf(steamid) != -1){
					notifySocket(socket, 'error', 'Failed to send your message! You have been banned from participating in the Chat!');
				} else {
					logInfo('[CHAT]:  '+name+' --> '+data.message);
					data.message = safeText(data.message);
					if(data.message != false){
						newChatMessage({ name: name, avatar: avatar, message: data.message, steamid: steamid, rank: rank, level: 0});
					}
				}
			} else {
				notifySocket(socket, 'error', 'Failed to send your message! Chat is currently deactivated!');
			}
		}
	});

	socket.on('tradelink', function(data){
		if(typeof(data.url) == 'string'){
			if(isTimeout(steamid, 'tradelink')){
				notifySocket(socket, 'error', 'You are only allowed to update your Tradelink once every 5 Seconds!');
				return;
			} else {
				timeoutAction(steamid, 'tradelink', 12);
			}
			logInfo('[TRADELINK]:  '+name+' --> '+data.url);

			connection.query('UPDATE user SET `tradelink` = ? WHERE `steamid` = "'+steamid+'"', data.url, function(err){
				if(err){
					logError('Error saving the tradelink of '+name+'. Error: '+err);
					notifySocket(socket, 'error', 'Error saving your Tradelink "'+data.url+'"');
				} else {
					notifySocket(socket, 'success', 'Your tradelink was saved!');
				}
			});
		} else {
			notifySocket(socket, 'error', 'Error saving your Tradelink "'+data.url+'"');
		}
	});

	socket.on('loadInventory', function(data){
		if(isTimeout(steamid, 'loadInventory')){
			notifySocket(socket, 'error','You are only allowed to load your Inventory once every 5 Seconds!');
			return;
		} else {
			timeoutAction(steamid, 'loadInventory', 12);
		}
		loadDepositInventory(steamid, function(err, inventory){
			var html = 'Error while loading your Inventory.. Please verify that your Inventory is set to public!';
			if(!err){
				html = '';

				for(var i in inventory){
					var item = inventory[i];
					
					if(item.price > 0){
						html += "<div class='itemChoose text-center' id='assetid_"+item.assetid+"' data-price='"+item.price+"' data-name='"+item.name+"' data-assetid='"+item.assetid+"' onclick='invSelect(\""+item.assetid+"\")' data-toggle='tooltip' title='"+item.name+"'>";
						html += "<div id='assetid_"+item.assetid+"_bg'></div>";
						html += "<img src='"+item.img+"'></img>";
						html += "<p class='itemPrice'>$"+item.price+"</p>";
						html += "</div>";
					} else {
						html += "<div class='itemChoose unavailibleItemChoose' data-price='0' data-name='"+item.name+"' data-toggle='tooltip' title='"+item.name+"'>";
						html += "<img src='"+item.img+"'></img>";
						html += "<p class='itemPrice'>Unavailible</p>";
						html += "</div>";
					}
				}

				if(inventory.length == 0){
					html = 'Your inventory is empty!';
				}

				socket.emit('depositInventory', { success: true, inventoryHtml: html });
			} else {
				socket.emit('depositInventory', { success: false, inventoryHtml: html });
			}			
		});
	});

	socket.on('deposit', function(data){
		if(isTimeout(steamid, 'deposit')){
			notifySocket(socket, 'error', 'You are only allowed to deposit once every 3 Seconds!');
			return;
		} else {
			timeoutAction(steamid, 'deposit', 20);
		}
		var niceTry = false;
		if(data.hasOwnProperty('assetids')){
			if(Object.prototype.toString.call(data.assetids) === '[object Array]'){

				if(tradelink == 'null'){
					notifySocket(socket, 'error', 'You need to set your tradelink at first.');
					return;
				}

				if(data.assetids.length == 0){
					notifySocket(socket, 'error', 'You need to select Items.');
					return;
				}

				if(settings.jackpotPaused){
					notifySocket(socket, 'error', 'Jackpot is currently paused. Try again later please.');
					return;
				}

				var itemArray = [];
				for(var i in data.assetids){
					var assetid = data.assetids[i];
					itemArray.push(rustItem(assetid));
				}

				if(itemArray.length <= 20){
					logInfo('User '+name+' is trying to deposit...');

					playerInfo[steamid] = {
        				name: name,
        				avatar: avatar_small,
        				tradelink: tradelink
    				};

					sendDepositTrade(itemArray, steamid, tradelink);
				} else {
					notifySocket(socket, 'error', 'Too many Items.');
					return;
				}
							
			} else {
				niceTry = true;
			}
		} else {
			niceTry = true;
		}

		if(niceTry){
			notifySocket('info', 'Atleast you tried!');
		}
	});

	socket.emit('authenticated', {});
}

function initAdminSocket(socket, steamid, name){
	socket.on('jackpotPauseOn', function(data){
		if(!settings.jackpotPaused){
			changeSettings('jackpotPaused', true);

			logInfo('--> DEACTIVATED THE JACKPOT DEPOSITS <--');

			notifySocket(socket, 'success', 'Jackpot deposits deactivated.');
		} else {
			notifySocket(socket, 'error', 'Jackpot deposits are already deactivated.');
		}
	});

	socket.on('jackpotPauseOff', function(data){
		if(settings.jackpotPaused){
			changeSettings('jackpotPaused', false);

			logInfo('--> ACTIVATED THE JACKPOT DEPOSITS <--');

			notifySocket(socket, 'success', 'Jackpot deposits activated.');
		} else {
			notifySocket(socket, 'error', 'Jackpot deposits are already activated.');
		}
	});

	socket.on('chatPauseOn', function(data){
		if(!settings.chatPaused){
			changeSettings('chatPaused', true);

			logInfo('--> DEACTIVATED THE CHAT <--');

			notifySocket(socket, 'success', 'Chat deactivated.');
		} else {
			notifySocket(socket, 'error', 'Chat is already deactivated.');
		}
	});

	socket.on('chatPauseOff', function(data){
		if(settings.chatPaused){
			changeSettings('chatPaused', false);

			logInfo('--> ACTIVATED THE CHAT <--');

			notifySocket(socket, 'success', 'Chat activated.');
		} else {
			notifySocket(socket, 'error', 'Chat is already activated.');
		}
	});

	socket.on('changeAnnouncement', function(data){
		announcement = data.html;

		logInfo(announcement);

		var array = {
			html: announcement
		};

		connection.query('INSERT INTO announcements SET ?', array, function(err){
			if(err){
				logError('Failed to set Announcement. Error: '+err);

				notifySteamid(steamid, 'error', 'Failed to set Announcement. Error: '+err);
			} else {
				logSuccess('Saved announcement');

				notifySteamid(steamid, 'success', 'Changed & Saved the new Announcement!');
			}
		});
		
		emitToAll('announcement', { html: announcement });
	});

	socket.on('userSearch', function(data){
		if(data.userid){
			connection.query('SELECT steamid, steamname, won, deposited, tradelink, rank, chatBan, totalBan FROM user WHERE `steamid` = ? OR `steamname` = ?', [data.userid, data.userid], function(err, results){
				if(err){
					notifySocket(socket, 'error', 'Error performing the User Search. Error: '+err);
				} else if(results.length == 0){
					notifySocket(socket, 'info', '0 Results found.');
				} else {
					socket.emit('userSearchResult', results[0]);
				}
			});
		}
	});

	socket.on('userBan', function(data){
		var type = data.type;
		var userid = data.steamid;

		var proceed = true;
		if(type.toLowerCase().indexOf('total') != -1){
			if(userTotalBanned.indexOf(userid) != -1){
				proceed == false;
				notifySocket(socket, 'info', 'User '+userid+' is already banned');
			} else {
				userTotalBanned.push(userid);
			}
		} else if(type.toLowerCase().indexOf('chat') != -1){
			if(userChatBanned.indexOf(userid) != -1){
				proceed == false;
				notifySocket(socket, 'info', 'User '+userid+' is already banned');
			} else {
				userChatBanned.push(userid);
			}
		}

		if(proceed == true){
			connection.query('UPDATE user SET '+type+' = "1" WHERE steamid = ?', userid, function(err){
				if(err){
					notifySocket(socket, 'error', 'Error while performing the '+type+' Ban to '+userid+'. Error: '+err);
				} else{
					notifySocket(socket, 'success', 'User '+userid+' got '+type+' banned!');
					logSuccess('User '+userid+' got '+type+' banned!');

					if(type.toLowerCase().indexOf('total') != -1){
						emitToSteamid(userid, 'refresh', {});
					}
				}
			});
		}
	});

	socket.on('userUnban', function(data){
		var type = data.type;
		var userid = data.steamid+'';


		var proceed = true;
		if(type.toLowerCase().indexOf('total') != -1){
			if(userTotalBanned.indexOf(userid) == -1){
				proceed == false;
				notifySocket(socket, 'info', 'User '+userid+' is already unbanned');
			} else {
				userTotalBanned.splice(userTotalBanned.indexOf(userid), 1);
			}
		} else if(type.toLowerCase().indexOf('chat') != -1){
			if(userChatBanned.indexOf(userid) == -1){
				proceed == false;
				notifySocket(socket, 'info', 'User '+userid+' is already unbanned');
			} else {
				userChatBanned.splice(userChatBanned.indexOf(userid), 1);
			}
		}
		if(proceed == true){
			connection.query('UPDATE user SET '+type+' = "0" WHERE steamid = ?', userid, function(err){
				if(err){
					notifySocket(socket, 'error', 'Error while performing the '+type+' Ban to '+userid+'. Error: '+err);
				} else{
					notifySocket(socket, 'success', 'User '+userid+' got '+type+' unbanned!');

					logSuccess('User '+userid+' got '+type+' unbanned!');

					if(type.toLowerCase().indexOf('total') != -1){
						emitToSteamid(userid, 'refresh', {});
					}
				}
			});
		}

	});

	socket.on('chatClear', function(data){
		currentChat = [];

		emitToAll('clearChat', {});

		notifySocket(socket, 'success', 'Chat got cleared!');
	});
}


function gameLoopStart(){
	isPotRunning = true;
	emitToAll('timeLeft', { value: timeLeft, isPotRunning: isPotRunning });
	timeLeft++;
	var gameloop = function(){
		logInfo('Gameloop: '+colors.magenta(timeLeft)+'/'+waitTime);
			
		timeLeft--;
		if(timeLeft <= 0){
			clearInterval(gameloopInterval);
			gameRoll();
		}
	}
	gameloopInterval = setInterval(gameloop, 1000);
}


function gameLoopReset(winnerdata, items, rN){
	saveToDB(winnerdata, items);
	setTimeout(function(){
		logInfo('Gameloop reset');

		

		isRolling = false;

		timeLeft = waitTime;

		lastWinner = { roundid: rN, name: winnerdata.name, steamid: winnerdata.steamid, img: winnerdata.img, amount: winnerdata.amount, percentage: winnerdata.percentage, ticket: winnerdata.ticket, hash: winnerdata.hash, salt: winnerdata.salt, entries: winnerdata.entries };

		historyGames.push(lastWinner); 

		if(historyGames.length > 5){
			historyGames.shift();
		}

		dataItemsInPot = [];
		itemsInPot = 0;
		roundTotal = 0;
		potPlayers = [];
		
		generateSalt();
		generateHash();
	
		emitJackpotDataAll();

		setTimeout(function(){
			handleQueue();
		}, 1000);
	}, 12000);
}


function gameRoll(){
	isPotRunning = false;
	isRolling = true;
	logInfo('GameRoll');

	var entries = [];

	for(var itemsInPot in dataItemsInPot){
		var found = false;
		var position;
		for(var i in entries){
			if(entries[i].steamid == dataItemsInPot[itemsInPot].ownerid){
				found = true;
				position = i;

				break; //USELESS but faster
			}
		}

		if(!found){
			var arr = {
				steamid: dataItemsInPot[itemsInPot].ownerid,
				total: dataItemsInPot[itemsInPot].price,
				img: dataItemsInPot[itemsInPot].owneravatar,
				name: dataItemsInPot[itemsInPot].ownername
			};
			entries.push(arr);
		} else {
			entries[i].total += dataItemsInPot[itemsInPot].price;
		}
	}

	roundTotal = round(roundTotal, 2);
	//CHANCE CALCULATOR
	for(var entry in entries){
		entries[entry].total = round(entries[entry].total, 2);
		logInfo('Total: '+entries[entry].total+', RoundTotal: '+roundTotal);

		var chance = parseFloat((entries[entry].total / roundTotal).toFixed(2));
		logInfo('Chance: '+chance+' for: '+entries[entry].name);
		entries[entry].chance = chance;
	}

	/* entries = [
	{
		chance: 0.2,
		img: 'http://cdn.edgecast.steamstatic.com/steamcommunity/public/images/avatars/3c/3c6908ff39a0cbc630905216caf347e4acfa053e_medium.jpg'
	},
	{
		chance: 0.8,
		img: 'http://cdn.edgecast.steamstatic.com/steamcommunity/public/images/avatars/7a/7ad598022f21263d6be2f05ab9bce7eaca2b8b01_medium.jpg'
	}]; */

	//PICK WINNER

	//var random = Math.random();

	var random = getWinnerTicket(Number(roundTotal).toFixed(2));

	var winningAmountAt = parseFloat((roundTotal * random).toFixed(2));

	logInfo('Random: '+random+', WinningAmountAt: '+winningAmountAt);

	var winner = {};
	var counter = 0;
	for(var e in entries){
		var entry = entries[e];
		if(round(counter, 2) + round(entry.total, 2) >= winningAmountAt){
			winner = entry;

			winner.chance = round(winner.chance, 2);

			winner.total = round(winner.total, 2);

			logInfo('Winner found: '+winner.name+', Total: '+winner.total+', Chance: '+winner.chance*100+'%');

			break;
		} else {
			counter += entry.total;
		}
	}

	/* var winner = {
		img: 'http://cdn.edgecast.steamstatic.com/steamcommunity/public/images/avatars/3c/3c6908ff39a0cbc630905216caf347e4acfa053e_medium.jpg',
		name: 'DankMemeLord'
	}; */

	var html = '';
	var rollEntries = [];

	var tmpTotal = 0;

	logInfo(entries.length+' Entries');
    for(var entry in entries){

    	var persChance = 100 * entries[entry].chance;
    	persChance = round(persChance, 2);

       	logInfo(persChance+' Images for this person');

        for(var i = 0; i < persChance; i++){
            rollEntries.push('<div class="rollImg"><img src="'+entries[entry].img+'"></img></div>');
        }

        tmpTotal += persChance;
    }
    

    shuffle(rollEntries);
    for(var entry in rollEntries){
        html += rollEntries[entry];
    }

    html += '<div class="rollImg"><img src="'+winner.img+'"></img></div>';

    for(var entry in rollEntries){
        html += rollEntries[entry];
    }

	emitToAll('gameRoll',
	{	
		html: html,
	 	winner: winner,
	 	position: tmpTotal * 64,
	 	wobble: Math.random() * 32
	});

	var winnerdata = {
		name: winner.name,
		steamid: winner.steamid,
		img: winner.img,
		amount: roundTotal,
		percentage: winner.chance * 100,
		ticket: random.toFixed(7),
		salt: currentSalt,
		hash: currentHash,
		entries: dataItemsInPot
	};	

	var rN = roundNumber;
	roundNumber++;
	calculateItems(roundTotal, dataItemsInPot, (winner.name.indexOf('RustyPot.com') == -1 )? 10 : 5,function(items){
		//winnerdata.amount = items.amountWon;
		gameLoopReset(winnerdata, items, rN);
	
		sendWinnings(items.nonFee, winnerdata.steamid, rN);
	});
}

function addItem(item, fromQueue){
	if(isRolling){
		if(fromQueue){
			return 'isRolling';
		}
		addToQueue(item);
	} else {
		dataItemsInPot.push(item);

		if(potPlayers.indexOf(item.ownerid) == -1){
			potPlayers.push(item.ownerid);
		}
		

		itemsInPot++;

		addToRoundTotal(item.price);

		emitToAll('newItem', item);
		emitToAll('itemsInPot', { value: itemsInPot });
		emitToAll('roundTotal', { value: roundTotal });

		connection.query('UPDATE user SET `deposited` = `deposited` + ? WHERE steamid = ?', [item.price, item.ownerid], function(err){
			if(err){
				logError('FATAL ERROR -> FAILED TO SAVE THE AMOUNT TO THE DB.');		
			}
		});

		if(fromQueue){
			logInfo('[QUEUE] Item added');
		} else {
			logInfo('Item added');
		}


		if(potPlayers.length == 2 && !isPotRunning){
			gameLoopStart();
		} else if(itemsInPot == 200){
			if(fromQueue){
				return 'isFull';
			}
			gameRoll();
		}
	}
}

function addToQueue(item){
	itemQueue.push(item);
	logInfo('Item added to queue');
}

function handleQueue(){
	var rollIt = false;
	var success = [];
	for(var qI in itemQueue){
		var queueItem = itemQueue[qI];

		var stopHandlingQueue = addItem(queueItem, true);
		if(stopHandlingQueue == 'isFull'){
			logInfo('PotFull stopping handling the Queue');
			rollIt = true;
			break;
		} else if(stopHandlingQueue == 'isRolling'){
			logInfo('PotFull stopping handling the Queue');
			break;
		} else {
			success.push(qI);
		}
	}

	for(var i in success){
		itemQueue.splice(itemQueue.indexOf(success[i]), 1);
	}

	if(rollIt){
		gameRoll();
	}
}

function saveToDB(winnerdata, itemdata){
	logInfo('Saving to DB.');

	var array = {
		total: roundTotal,
		won: winnerdata.amount,
		winnersteamid: winnerdata.steamid,
		winnername: winnerdata.name,
		winnerchance: winnerdata.percentage.toFixed(4),
		winneravatar: winnerdata.img,
		potPlayers: JSON.stringify(potPlayers),
		offersent: 0,
		sendbackItems: JSON.stringify(itemdata.nonFeeNames),
		feeItems: JSON.stringify(itemdata.feeNames),
		salt: winnerdata.salt,
		hash: winnerdata.hash,
		ticket: winnerdata.ticket,
		rawEntries: JSON.stringify(winnerdata.entries)
	};

	connection.query('INSERT INTO jackpotHistory SET ?', array, function(err){
		if(err){
			logError('FATAL ERROR -> FAILED TO SAVE THE JACKPOT TO THE DB. Error: '+err);		
		}
	});

	connection.query('UPDATE user SET `won` = `won` + ? WHERE steamid = ?', [array.won, array.winnersteamid], function(err){
		if(err){
			logError('FATAL ERROR -> FAILED TO SAVE THE AMOUNT TO THE DB.');		
		}
	});

}
	
function loadFromDb(callback){
	logInfo('Trying to load from DB');

	var loadAnnouncement = function(){
		connection.query('SELECT * FROM `announcements` ORDER BY `id` DESC LIMIT 1', function(err2, results2){
			if(!err2){
				if(results2.length == 0){
					logInfo('No announcementdata found.');

					loadSettings();
				} else {
					announcement = results2[0].html;
					loadSettings();
				}
			} else {
				logError('FATAL ERROR -> FAILED TO LOAD THE ANNOUNCEMENTDATA FROM THE DB.');
				process.exit(1);
			}
		});
	};

	var loadSettings = function(){
		connection.query('SELECT * FROM `settings`', function(err, results){
			if(!err){
				if(results.length == 0){
					logInfo('No settings found.');

					loadBannedPeople();
				} else {
					logInfo('Loading '+results.length+' Settings.');
					for(var r in results){
						settings[results[r].name] = (results[r].value == '1')? true : false;
					}

					loadBannedPeople();
				}
			} else {
				logError('FATAL ERROR -> FAILED TO LOAD THE SETTINGS FROM THE DB.');
				process.exit(1);
			}
		});
	};

	var loadBannedPeople = function(){
		connection.query('SELECT * FROM `user` WHERE totalBan = "1" OR chatBan = "1"', function(err, results){
			if(!err){
				if(results.length == 0){
					logInfo('No banned People found.');

					callback();
				} else {
					logInfo('Loaded '+results.length+' banned People.');
					
					for(var r in results){
						var p = results[r];
						logInfo(p.steamname);

						if(p.chatBan == '1'){
							userChatBanned.push(p.steamid)
							logInfo('Chatban' + p.Chatban);
						}
							
						
						if(p.totalBan == '1'){
							userTotalBanned.push(p.steamid);
							logInfo('Totalban' + p.totalBan);

						}
				}

					callback();
				}
			} else {
				logError('FATAL ERROR -> FAILED TO LOAD THE BANNED PEOPLE.');
				process.exit(1);
			}
		});
	};


	connection.query('SELECT * FROM `jackpotHistory` ORDER BY `id` DESC LIMIT 5', function(err, results){
		if(!err){
			if(results.length == 0){
				logInfo('No JackpotData found. Congratz for the first Round in the History of RUSTYPOT.com. ---> Using crappy data');
				loadAnnouncement();
			} else {
				var i = 0;
				roundNumber = results[0].id + 1;
				lastWinner = {
					roundid: results[i].id,
					name: results[i].winnername,
					steamid: results[i].winnersteamid,
					img: results[i].winneravatar,
					amount: results[i].total,
					percentage: results[i].winnerchance,
					ticket: results[i].ticket,
					salt: results[i].salt,
					hash: results[i].hash,
					entries: JSON.parse(results[i].rawEntries)
				};

				for(var r in results){
					historyGames.unshift({
						roundid: r,
						name: results[r].winnername,
						steamid: results[r].winnersteamid,
						img: results[r].winneravatar,
						amount: results[r].total,
						percentage: results[r].winnerchance,
						ticket: results[r].ticket,
						salt: results[r].salt,
						hash: results[r].hash,
						entries: JSON.parse(results[r].rawEntries)
					});
				}

				generateSalt();
				generateHash();

				loadAnnouncement();
			}
		} else {
			logError('FATAL ERROR -> FAILED TO LOAD THE JACKPOTDATA FROM THE DB.');
			process.exit(1);
		}
	});

}


function newChatMessage(mes){
	currentChat.push(mes);

	if(currentChat.length > maxChatLength){
		currentChat.shift();
	}

	var steamid = mes.steamid;
	//mes.steamid = '1234';

	emitToNormal('chatMessage', mes);

	//mes.steamid = steamid;
	emitToAdmin('chatMessage', mes);


	var array = {
		message: mes.message,
		steamid: mes.steamid
	};

	connection.query('INSERT INTO chatHistory SET ?', array, function(err){
		if(err){
			logError('Error while saving the Message '+array.message+' by '+mes.name+'('+mes.steamid+'). Error: '+err);
		}
	})
}

function emitJackpotData(socket){
	socket.emit('lastWinner', lastWinner);

	socket.emit('itemsInPot', { value: itemsInPot });
	socket.emit('roundNumber', { value: roundNumber });
	socket.emit('roundTotal', { value: roundTotal });

	socket.emit('timeLeft', { value: timeLeft, isPotRunning: isPotRunning });

	socket.emit('roundHash', { value: currentHash });
}

function emitJackpotDataAll(){
	emitToAll('gameHistory', historyGames[historyGames.length - 1]);

	emitToAll('lastWinner', lastWinner);

	emitToAll('itemsInPot', { value: 0 });
	emitToAll('roundNumber', { value: roundNumber });
	emitToAll('roundTotal', { value: 0 });

	emitToAll('timeLeft', { value: timeLeft });

	emitToAll('roundHash', { value: currentHash });
}


function emitChatMessages(socket, rank){
	for(var c in currentChat){
		var mes = currentChat[c];
		//mes.steamid = '1234';
		mes.noAnimation = true;
		socket.emit('chatMessage', mes);
	}
}

function emitGameHistoryAll(socket){
	for(var h in historyGames){
		var his = historyGames[h];
		socket.emit('gameHistory', his);
	}
}

function emitItemsInPotAll(socket){
	for(var i in dataItemsInPot){
		var item = dataItemsInPot[i];
		item.noAnimation = true;
		socket.emit('newItem', item);
	}
}

function emitAnnouncement(socket){
	socket.emit('announcement', { html: announcement });
}

function notifySocket(socket, type, message){
	socket.emit('notification', { type: type, message: message });
}

function notifySteamid(steamid, type, message){
	try{ //idk if it will throw an error :D, too lazy to find out
		io.to(steamid+'').emit('notification', { type: type, message: message });
	} catch(err){

	}
}

function emitToSteamid(steamid, type, message){
	try{ //idk if it will throw an error :D, too lazy to find out
		io.to(steamid+'').emit(type, message);
	} catch(err){

	}
}

function emitToAll(type, data){
	io.sockets.emit(type, data);
}

function emitToNormal(type, data){
	io.to('normal').emit(type, data);
}

function emitToAdmin(type, data){
	io.to('admin').emit(type, data);
}


function safeText(text){
	text = text.substr(0, 199);

	for(var i = 0; i < text.length; i++){
		text = text.replace('<', '');
		text = text.replace('>', '');
	}

	for(var i = 0; i < text.length; i++){
		text = text.replace('<', '');
		text = text.replace('>', '');
	} //just to make sure :D

	if (text.replace(/\s/g, '').length == 0 || text == '') {
		return false;
	}

	return text;
}

function addToRoundTotal(value){
	roundTotal = roundTotal + value;
	roundTotal = parseFloat(parseFloat(roundTotal).toFixed(2));
}

function changeSettings(name, newValue){
	settings[name] = newValue;

	connection.query('UPDATE settings SET value = ? WHERE name = ?', [newValue, name], function(err){
		if(err){
			logError('Error while saving the setting '+name+' to '+newValue+'. Error: '+err);
		}
	});
}


function logInfo(message){
	log(colors.yellow(message));
}

function logSuccess(message){
    log(colors.green(message));
}

function logError(message){
	log(colors.red(message));
}

function log(message){
	console.log(message);
	var d = new Date();
	var time = ("00" + (d.getMonth() + 1)).slice(-2) + "/" + 
		("00" + d.getDate()).slice(-2) + "/" + 
		d.getFullYear() + " " + 
		("00" + d.getHours()).slice(-2) + ":" + 
		("00" + d.getMinutes()).slice(-2) + ":" + 
		("00" + d.getSeconds()).slice(-2);

	fs.appendFile('log.txt', '['+time+']'+' '+message+'\n', function(err){
		if(err)
			console.log('Error while appending to log.txt');
	})
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function round(num, scale) {
  if(!("" + num).includes("e")) {
    return +(Math.round(num + "e+" + scale)  + "e-" + scale);
  } else {
    var arr = ("" + num).split("e");
    var sig = ""
    if(+arr[1] + scale > 0) {
      sig = "+";
    }
    return +(Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) + "e-" + scale);
  }
}

function generateSalt(){
	currentSalt = generateRandomString(8);

	logInfo('Salt generated!: '+currentSalt);
}

function generateHash(){
	currentHash = crypto.createHash('sha1').update(currentSalt).digest('hex');

	logInfo('Hash generated!: '+currentHash);
}

function getWinnerTicket(total){
	var hash = crypto.createHash('md5').update(total+'-'+currentSalt).digest('hex');
		hash = hash.slice(0, 8);

	var ticket = parseInt(hash, 16);
		ticket = ticket / 4294967296;

	return ticket;
}


var timeoutActions = {};
function timeoutAction(steamid, name, perMin){
	if(!timeoutActions.hasOwnProperty(steamid)){
		timeoutActions[steamid] = [];
	}

	timeoutActions[steamid].push(name);

	setTimeout(function(){
		timeoutActions[steamid].splice(timeoutActions[steamid].indexOf(name), 1);
	}, 60000 / perMin);
}

function isTimeout(steamid, name){
	if(timeoutActions.hasOwnProperty(steamid)){
		if(timeoutActions[steamid].indexOf(name) != -1){
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
}





clearConsole();
botLogin();

var firstTime = true;
function botLoggedIn(){
	if(firstTime){
		firstTime = false;
		setup();
		loadFromDb(function(){
			logSuccess('Loaded from DB.');
			/* logInfo('Starting demo in 5 seconds');

			setTimeout(function(){
				start();
			}, 5000); */
		});
	}
}	


function start(){
	setInterval(function(){
		var item = {
			owneravatar: 'http://cdn.edgecast.steamstatic.com/steamcommunity/public/images/avatars/3c/3c6908ff39a0cbc630905216caf347e4acfa053e_medium.jpg',
			ownername: 'NahuiBlyat',
			ownerid: '76561198143176360',
			img: 'https://steamcommunity-a.akamaihd.net/economy/image/rtOnLXYSD-u65eusOk-nO4hCpUCJo2NbCxc2U4Y51MLNQ5Hz3URG1UJcBu0sv2Ko-M1Zj0mvYmKzVOblhE_kZDiDqzUUnSAYyUNwwYoNBWPspc_WGyySVEc98w/62fx62f',
			market_hash_name: 'ItemName',
			price: parseFloat((100 * Math.random()).toFixed(2))
		};
		
		addItem(item, false);

		setTimeout(function(){
			var item = {
				owneravatar: 'http://cdn.edgecast.steamstatic.com/steamcommunity/public/images/avatars/7a/7ad598022f21263d6be2f05ab9bce7eaca2b8b01_medium.jpg',
				ownername: 'Cristal',
				ownerid: '123',
				img: 'https://steamcommunity-a.akamaihd.net/economy/image/rtOnLXYSD-u65eusOk-nO4hCpUCJo2NbCxc2U4Y51MLNQ5Hz3URG1UJcBu0sv2Ko-M1Zj0mvYmKzVOblhE_kZDiDqzUUnSAYyUNwwYoNBWPspc_WGyySVEc98w/62fx62f',
				market_hash_name: 'ItemName',
				price: parseFloat((100 * Math.random()).toFixed(2))
			};
			
			addItem(item, false);
		}, 1000);
		
	}, 4000);
}

/* 
* STEAM-BOT
*/
/*
 *	Init of the node steam modules
 */
var client = new SteamUser();
var community = new Steamcommunity();

var manager = new TradeOfferManager({
        "steam": client,
        "language": "en",
        "pollInterval": -1
});

//Array to prevent double handling of offers
var tmpOffers = []; //offer.ids are stored here

//twoFactorCodeGeneration to start logging in
account.twoFactorCode = SteamTotp.generateAuthCode(account.shared_secret);

var usedAssetids = [];
var prices = {};

function botLogin(){
	logInfo('Launching the Bot!');

	loadUsedAssetids(function(){
		loadPrices(function(){
			client.logOn(account); //Tries to log in

			setBotEvents();
		});
	});
}

function loadUsedAssetids(callback){
	fs.readFile('./cache/usedAssetids.json', function(err, data) {
		if (!err){
			usedAssetids = JSON.parse(data);
			logSuccess('Successfully loaded usedAssetids');

			callback();
		} else {
			logError('FATAL ERROR -> BOT: FAILED TO LOAD "/cache/usedAssetids.json" -> I need this file.');
			process.exit(1);
		}
	});
}

function loadPrices(callback){
	var read = function(){
		fs.readFile('./cache/prices.json', function(err, data) {
			if (!err){
				prices = JSON.parse(data);
				logSuccess('Successfully loaded the Prices');

				startInterval();
				callback();
			} else {
				logInfo('Error while loading the Prices. Redownloading...');
				download();

				startInterval();
				callback();
			}
		});
	};
	

	var download = function(){
		request({
	        url: 'https://api.steamapis.com/market/items/252490?api_key='+steamapis_key+'&format=compact',
	        json: true
	    }, function (err, response, body) {
	        if (err){
	        	logError('Failed to download steamapis.com prices.');
	        	return;
	        } else if(response.statusCode != 200){
	        	logError('Unexpected response statusCode. '+response.statusCode);
	        	return;
	        } else {
	        	prices = body;

		        request({
			        url: 'https://opskins.com/pricelist/252490.json',
			        json: true
			    }, function (err, response, body) {
			       if (err){
			        	logError('Failed to download steamapis.com prices.');
			        	return;
			        } else if(response.statusCode != 200){
			        	logError('Unexpected response statusCode. '+response.statusCode);
			        	return;
	     		   } else {		        
				        var toSave = {};
				        var items = body;
				        for (var item in items) {
				            if (items.hasOwnProperty(item)) {  
				                var lastDate = null;
				                for(var key in items[item]){
				                    lastDate = key;
				                }
				                toSave[item] = parseFloat(items[item][lastDate].price / 100);
				            }
				        }

				        for(var tS in toSave){
				        	if(!prices.hasOwnProperty(tS)){
				        		prices[tS] = toSave[tS];
				        	}
				        }
				        
				        fs.writeFile('./cache/prices.json', JSON.stringify(prices), function(err){
				        	if(err){
				        		logError('FATAL ERROR --> FAILED TO SAVE PRICES. ABORTING.');
				        		process.exit(1);
				        	} else {
				        		logSuccess('Successfully downloaded the Prices');
				        	}	
				        });
			   		}
			    });
		    }
	    });
	};

	var startInterval = function(){
		setInterval(download, 1000 * 60 * 60 * 3); //Every 3 hours
	};

	read();
}

function setBotEvents(){
	// Event:
	// Kinda useless here but shows a successful login attempt
	client.on('loggedOn', function(data) {
	        logInfo('Logged in');
	        client.setPersona(SteamUser.EPersonaState.Online);

	});

	//Loads existing polldata for the tradeoffermanager
	if (fs.existsSync('./cache/polldata_' + account.accountName + '.json')) {
	        manager.pollData = JSON.parse(fs.readFileSync('./cache/polldata_' + account.accountName + '.json'));
	}
	//Saves polldata by the tradeoffermanager
	manager.on('pollData', function(pollData) {
	        fs.writeFile('./cache/polldata_' + account.accountName + '.json', JSON.stringify(pollData));
	});

	//Simple ClientError Event | Never saw it btw :)
	client.on('error', function(err) {
	        logError('Error ' + err);
	});

	//Once the client recieves the cookies of the current login-session it inits steamtradeoffermanager and steamcommunity
	client.on('webSession', function(sessionID, cookies) {
	        manager.setCookies(cookies, function(err) { //manager cookies
	                if (err) {
	                        logError('Cookie Error: ' + err);

	                        if (err != 'Access Denied') {
	                                logError('Failed to set TradeOfferManagerCookies. Aborting...');
	                                process.exit(1);
	                        } else {
	                                logError('Account is currently locked. Aborting...');
	                                process.exit(1);
	                        }
	                } else {
	                    logInfo('Cookies set');
	                    botLoggedIn();
	                }
	        });

	        community.setCookies(cookies); //community cookies
	        community.chatLogon(); //community login
	        community.startConfirmationChecker(10000, account.identity_secret); //confirmation checker for mobile confirmations
	});

	//Once the community session expires it tries to relogin
	community.on('sessionExpired', function(err) {
	        logInfo('Session expired.');
	        if (err) {
	                if (err.message == 'Not Logged In') {
	                        logError('Not Logged In');
							
							var tryLoginClient = function(){
								try{
									client.webLogOn();
								} catch(err){
									logError('Failed to login client, retrying...');
									setTimeout(function(){
										tryLoginClient();
									}, 1000);
								}
							}

							tryLoginClient();                       
	                } else {
	                        logError('Error :' + err.message);
	                }
	        } else {
	                logInfo('Relogin.');
	                client.webLogOn();
	        }
	});

	//Event that gets triggered once a new offer is received
	manager.on('newOffer', function(offer) {
	        logInfo('Received a new offer...');
	        handleOffer(offer);
	});

	//Used to log the received items, once an incoming trade has been successfully accepted
	manager.on('sentOfferChanged', function(offer, oldState) {
	        if (offer.state == TradeOfferManager.ETradeOfferState.Accepted) { //Checks if the offer got accepted
	                offer.getReceivedItems(function(err, items) { //Loads the receivedItems from the offer
	                        if (err) {
	                                logInfo("Couldnt load received items " + err); //IF error
	                        } else {
	                                if (items.length > 0) { //If items got received |
	                                	var func = function(){
	                                		for(var i in offer.itemsToReceive){
	                                			var offerItem = offer.itemsToReceive[i];
	                                			var item = {
															owneravatar: playerInfo[offer.partner].avatar,
															ownername: playerInfo[offer.partner].name,
															ownerid: offer.partner+'',
															img: offerItem.getImageURL() +'62fx62f',
															market_hash_name: offerItem.market_hash_name,
															price: prices[offerItem.market_hash_name]
														};
	                                			addItem(item);
	                                		}
	                                	}
	                                	if(playerInfo.hasOwnProperty(offer.partner)){
	                                		func();
	                                	} else {
	                                		logError('ERROR -> NO USER DETAILS FOR '+offer.partner);
	                                		connection.query('SELECT * FROM user WHERE steamid = '+offer.partner, function(playerInfoErr, playerInfoResults){
                                        		if(playerInfoErr){
                                        			logError('FATAL ERROR -> FAILED TO LOAD USER DETAILS FOR '+offer.partner+'. WE ALREADY GOT THE ITEMS THOUGH.');
                                        		} else {
                                        			if(playerInfoResults[0].tradelink != 'null'){
                                        				playerInfo[offer.partner] = {
	                                        				name: playerInfoResults[0].steamname,
	                                        				avatar: playerInfoResults[0].avatar_small,
	                                        				tradelink: playerInfoResults[0].tradelink
                                        				};

                                        				func();
                                        			}
                                        		}
                                        	});	
	                                	}
	                                }
	                        }
	                });
	        }
	});
}

//Handles offers
function handleOffer(offer) { // Prevents offers being handled more than once
        if (tmpOffers.indexOf(offer.id) != -1) { // the offer.id is already in the list -> returns
                return; // the offer.id is not in the list -> proceeds
        } else { //	& adds the offer.id to the list
                tmpOffers.push(offer.id);
        }
        offer.getUserDetails(function(error, me, them) { //Loads the userdetails of the offer to prevents escrow trades
                if (error) {
                        if (offer.state == TradeOfferManager.ETradeOfferState.Active) { //Error loading the details but the offer is still avaiblible, so we will wait for 10secs before trying again
                                logError('New Offer #' + offer.id + ', but there was an Error while loading the partner details. \n Error: ' + colors.magenta(error));
                                setTimeout(function() {
                                        tmpOffers.splice(tmpOffers.indexOf(offer.id), 1); //makes it possible to handle it again
                                        handleOffer(offer);
                                }, 10000);
                        } else {
                                logInfo('Offer #' + offer.id + ' not availible anymore..'); //The trade is not active anymore
                        }
                } else {
                        if (them.escrowDays > 0) {
                        		notifySteamid(offer.partner+'', 'error', 'Please note that we only accept trades without Tradehold. Declining your offer!');
                                manageOffer(offer, 'decline', them); //declines Escrowtrades
                        } else {
                                if (adminIds.indexOf(offer.partner + '') != -1) { //If offer.partner is admin
                                        logSuccess('Received request for Admin trade. Trying to accept...');
                                        notifySteamid(offer.partner+'', 'success', 'Admintrade received. Trying to accept your offer!');

                                        manageOffer(offer, 'accept', them); //accepts admin trades
                                } else {
                                		if(settings.jackpotPaused){
		                        			notifySteamid(offer.partner+'', 'error', 'Jackpot is paused right now. Declining your offer!');
		                        			manageOffer(offer, 'decline', them); //declines if jackpot is paused.
		                        			return;
		                        		}
                                        if(false){//if (offer.itemsToGive.length == 0 && offer.itemsToReceive.length > 0 && offer.itemsToReceive.length <= 10) { //if it is a donation | only items on their side
                                        	connection.query('SELECT * FROM user WHERE steamid = '+offer.partner, function(playerInfoErr, playerInfoResults){
                                        		if(playerInfoErr){
                                        			logInfo('Received bad offer from ' + them.personaName + ' -> No details found. Trying to decline...');

                                        			notifySteamid(offer.partner+'', 'error', 'Internal Error. Declining your offer!');
                                                	manageOffer(offer, 'decline', them); //not a donation
                                        		} else {
                                        			if(playerInfoResults[0].tradelink != 'null'){
                                        				playerInfo[offer.partner] = {
	                                        				name: playerInfoResults[0].steamname,
	                                        				avatar: playerInfoResults[0].avatar_small,
	                                        				tradelink: playerInfoResults[0].tradelink
                                        				};

                                        				var appidsValid = true;
		                                                var badPrice = false;
		                                                for (var i in offer.itemsToReceive) { //checks all items
		                                                        var appid = offer.itemsToReceive[i].appid;

		                                                        if (allowedAppids.indexOf(appid) == -1) { //for invalid appids
		                                                            appidsValid = false;
		                                                        }

		                                                        if(prices.hasOwnProperty(offer.itemsToReceive[i].market_hash_name)){
		                                                        	if(prices[offer.itemsToReceive[i].market_hash_name] < minPrice){
		                                                        		badPrice = true;
		                                                        		logInfo('Price of '+offer.itemsToReceive[i].market_hash_name+' is too low.');
		                                                        	}
		                                                        } else {
		                                                        	badPrice = true;
		                                                        	logError('Failed to find price for '+offer.itemsToReceive[i].market_hash_name);
		                                                        }
		                                                }
		                                                if (appidsValid && !badPrice) { //but if we wanna accept all items anyways its not a problem if we find invalid ones
		                                                        logSuccess('Received valid Offer from ' + them.personaName + '. Trying to accept the trade...');
		                                                        notifySteamid(offer.partner+'', 'success', 'Offer received. Accepting your offer...');
		                                                        manageOffer(offer, 'accept', them); //accepts, because its a donation.
		                                                } else {
		                                                		notifySteamid(offer.partner+'', 'error', 'Some of the items you sent were invalid. Declining your offer!');
		                                                        logInfo('Received bad offer from ' + them.personaName + '. Trying to decline...');

		                                                        manageOffer(offer, 'decline', them); //declines, because its a donation but we dont want it.
	                            	                    }
                                        			} else {
                                        				notifySteamid(offer.partner+'', 'error', 'Please enter your Tradelink!. Declining your offer!');
                                        				logInfo('Received bad offer from ' + them.personaName + ' -> no Tradelink found. Trying to decline...');

                                             			manageOffer(offer, 'decline', them); //no tradelink
                                        			}
                                        		}
                							});
                                        } else {
                                                logInfo('Received bad offer from ' + them.personaName + '. Trying to decline...');

                                                manageOffer(offer, 'decline', them); //not a donation
                                        }
                                }
                        }
                }
        });
}

/*
 *  Used to accept decline offers 
 *  offer is the trade offer we wanna work with
 *  action is what we are trying to do accept|decline
 *  them is the userdetails of the offer.partner
 */
function manageOffer(offer, action, them) {
        var counter = 0;
        var maxTries = 10;
        var retryInterval = 1000;
        var alreadyUpdating = false; //prevents offer.update spam

        var offerFunc = function() { //extra function to sort Everything
                if (counter < maxTries) { //dont retry forever
                        if (offer.isGlitched() == true && !alreadyUpdating) { //if glitched
                                alreadyUpdating = true; //prevents offer.update spam
                                offer.update(function(err) {
                                        if (err) {
                                                alreadyUpdating = false; //prevents offer.update spam
                                        } else {
                                                accept(); //tries to accept
                                        }
                                });
                        } else {
                                accept(); //tries to accept
                        }
                } else {
                        logInfo('Offer of ' + them.personaName + ' (' + offer.id + ') cancelled. Accepting/Declining failed.'); //limit of retries reached
                        clearInterval(interval); //stops the retry interval
                }
        };

        var accept = function() {
                if (offer.state == TradeOfferManager.ETradeOfferState.Active) { //if the trade is active -> acceptable|declineable
                        if (action == 'accept') {
                                offer.accept(function(err) {
                                        if (err) { //accepting failed
                                                logError('Accepting the offer of ' + them.personaName + ' (' + offer.id + ') failed. Error: ' + err);
                                                counter++; //used for the limit of retries
                                        } else {
                                                logSuccess('Offer of ' + them.personaName + ' (' + offer.id + ') sucessfully accepted.');
                                                clearInterval(interval); //stops the retry interval because of success
                                        }
                                });
                        } else {
                                offer.decline(function(err) {
                                        if (err) { //declining failed
                                                logError('Declining the offer of ' + them.personaName + ' (' + offer.id + ') failed. Error: ' + err);
                                                counter++; //used for the limit of retries
                                        } else {
                                                logInfo('Offer of ' + them.personaName + ' (' + offer.id + ') sucessfully declined.');
                                                clearInterval(interval); //stops the retry interval because of success
                                        }
                                });
                        }
                } else {
                        clearInterval(interval); //stops the retry interval because its not active anymore
                }
        };

        offerFunc(); //instantly runs the Function
        var interval = setInterval(offerFunc, retryInterval); // & runs it in an interval
}


function calculateItems(total, entries, pFee, callback){
	var array = {
		nonFee: [],
		fee: [],
		nonFeeNames: [],
		feeNames: [],
		amountWon: 0
	};

	var fee = pFee;
	fee = fee / 100;
	var approxFee = total * fee;
	approxFee = round(approxFee, 2);
	logInfo('Calculating Items. Approx. '+approxFee+'$ Fee');


	var allItems = [];


	for(var e in entries){
		allItems.push(entries[e]);
	}
	

	allItems = sortItems(allItems);

	var feeTaken = 0;
	for(var i in allItems){
		var item = allItems[i];

		item.price = round(item.price, 2);

		if(approxFee >= item.price){
			array.fee.push(item);
			array.feeNames.push(item.market_hash_name);

			approxFee -= item.price;
			feeTaken += item.price;
		} else {
			array.nonFee.push(item);
			array.nonFeeNames.push(item.market_hash_name);
			array.amountWon += item.price;
		}
	}
	feeTaken = round(feeTaken, 2);

	logInfo('Took '+feeTaken+' Fee');

	callback(array);
}


function sendWinnings(items, steamid, roundid){
	logInfo('Trying to send winnings to '+steamid);
	logInfo('Creating Steamitems');
	
	var tradelink = playerInfo[steamid].tradelink;

	var nameArray = [];

	for(var i in items){
		nameArray.push(items[i].market_hash_name);
	}

	var itemArray = [];

	var load = function(){
		manager.loadInventory(252490, 2, true, function(err, inventory){
			if(err){
				logError('Failed to load Inventory. Retrying in 5 Seconds.');

				setTimeout(load, 5000);
			} else {
				handle(inventory);
			}
		});
	};

	var assetids = [];

	var handle = function(inv){
		for(var nA in nameArray){
			var name = nameArray[nA];

			var itemInInv = false;
			for(var i in inv){
				var item = inv[i];

				if(item.market_hash_name == name){
					if(usedAssetids.indexOf(item.assetid) != -1){
						continue;
					} else {
						itemArray.push(rustItem(item.assetid));
						assetids.push(item.assetid);
						usedAssetids.push(item.assetid);
						itemInInv = true;
						break;
					}
				}
			}
			if(!itemInInv){
				logError('Fatal Error -> Item '+name+' not existing in Inventory.');
			}
		}

		send();
	};

	var send = function(){
		try{
			var offer = manager.createOffer(tradelink);			
		} catch(err){
			logError('FATAL ERROR --> FAILED TO CREATE OFFER. Reason: probably wrong Tradelink');
			return;
		}
       
        offer.addMyItems(itemArray);
        offer.setMessage('Congratiulations on your Win! Dont decline or counter with an Offer -> NO REFUNDS');

        offer.send(function(err, state) {
            if (err) {
                logError('Error while sending Trade #' + offer.id);
                removeAssetidsInUse(assetids);
            } else {
	            saveAssetidsInUse();
	            connection.query('UPDATE jackpotHistory SET offersent = "1" WHERE id = '+roundid, function(err){
					if(err){
						logError('FATAL ERROR -> FAILED TO SAVE OFFER SENT.');		
					}
				});

                setTimeout(function() {
                   	confirmOffer(offer, function(err) {
                        
                    });
                }, 3000);
            }
        });
	};

	load();
}

function sendDepositTrade(items, steamid, tradelink){
	logInfo('Trying to send deposit trade to '+steamid);

	try{
		var offer = manager.createOffer(tradelink);			
	} catch(err){
		logError('FATAL ERROR --> FAILED TO CREATE OFFER. Reason: probably wrong Tradelink');
		notifySteamid(steamid, 'error', 'Your Trade has been sent. Code: '+code);
		return;
	}
    var code = generateCode();

    offer.addTheirItems(items);
    offer.setMessage(code);

    offer.send(function(err, state) {
        if (err) {
            logError('Error while sending Trade #' + offer.id);
        } else {
            notifySteamid(steamid, 'success', 'Your Trade has been sent. Code: '+code);
        }
    });
}

function loadDepositInventory(steamid, callback){
	/*
	request({
	        url: 'https://api.steamapi.io/user/inventory/'+steamid+'/252490/2?key='+steamapiio_key
	    }, function (err, response, body) {
	        if(!err){
	        	if(response.statusCode == 200){
		        	var inv = [];

		        	try{
		        		body = JSON.parse(body);
		        	} catch(err){
		        		logError('Failed to load UserInventory of '+steamid+'. Invalid response body.');
		        		callback(true, null);
		        		return;
		        	}

		        	var inventory = body;

		        	
		        	for(var i in inventory){
						var item = inventory[i];

						if(!item.tradable){
							continue;
						}

						item.icon_url = 'http://steamcommunity-a.akamaihd.net/economy/image/'+item.icon_url+'/128x128';
						var arr = {
							img: item.icon_url,
							name: item.market_hash_name,
							assetid: item.assetid,
							price: (!prices.hasOwnProperty(item.market_hash_name)) ? 0 : prices[item.market_hash_name]
						};

						inv.push(arr);
					}

					logSuccess('Loaded the Inventory of '+steamid+' successfully. '+inv.length+' Items are tradeable.');
					callback(false, inv);
		        } else if(response.statusCode == 429){
		        	logError('FATAL ERROR --> Failed to load UserInventory of '+steamid+'. Limit reached.');
		        	callback(true, null);
		        } else {
		        	logError('Failed to load UserInventory of '+steamid+'. Invalid response. '+response.statusCode+'  |  '+'https://api.steamapi.io/user/inventory/'+steamid+'/252490/2?key='+steamapiio_key);
		        	callback(true, null);
		        }
	    	} else {
	    		logError('Failed to load UserInventory of '+steamid+'. Error response.');
		      	callback(true, null);
	    	}
	    });*/

	request({
        url: 'http://api.steamapis.com/steam/inventory/'+steamid+'/252490/2?api_key='+steamapis_key
    }, function (err, response, body) {
        if(!err){
        	if(response.statusCode == 200){
	        	var inv = [];

	        	try{
	        		body = JSON.parse(body);
	        	} catch(err){
	        		logError('Failed to load UserInventory of '+steamid+'. Invalid response body.');
	        		callback(true, null);
	        		return;
	        	}

	        	var assets = body.assets;
	        	var descriptions = body.descriptions;
	        	
	        	for(var i in assets){
					var classid = assets[i].classid;
					var assetid = assets[i].assetid;

					for(var y in descriptions){
						if(descriptions[y].classid == classid){
							var item = descriptions[y];

							if(!item.tradable){
								continue;
							}

							var arr = {
								img: 'http://steamcommunity-a.akamaihd.net/economy/image/'+item.icon_url+'/128x128',
								name: item.market_hash_name,
								assetid: assetid,
								price: (!prices.hasOwnProperty(item.market_hash_name)) ? 0 : prices[item.market_hash_name]
							};

							inv.push(arr);
						}
					}
				}

				logSuccess('Loaded the Inventory of '+steamid+' successfully. '+inv.length+' Items are tradeable.');
				callback(false, inv);
	        } else if(response.statusCode == 429){
	        	logError('FATAL ERROR --> Failed to load UserInventory of '+steamid+'. Limit reached.');
	        	callback(true, null);
	        } else {
	        	logError('Failed to load UserInventory of '+steamid+'. Invalid response. '+response.statusCode+'  |  '+'https://api.steamapi.io/user/inventory/'+steamid+'/252490/2?key='+steamapiio_key);
	        	callback(true, null);
	        }
    	} else {
    		logError('Failed to load UserInventory of '+steamid+'. Error response.');
	      	callback(true, null);
    	}
    });

	/*
	manager.loadUserInventory(steamid, 252490, 2, true, function(err, inventory){
		if(err){
			logError('Failed to load UserInventory of '+steamid+'.');

			callback(true, null);
		} else {
			var inv = [];

			for(var i in inventory){
				var item = inventory[i];

				var arr = {
					img: item.getImageURL() + '128x128',
					name: item.market_hash_name,
					assetid: item.assetid,
					price: (!prices.hasOwnProperty(item.market_hash_name)) ? 0 : prices[item.market_hash_name]
				};

				inv.push(arr);
			}

			logSuccess('Loaded the Inventory of '+steamid+' successfully');
			callback(false, inv);
		}
	});
	*/
}

function sortItems(arr){
    var swapped;
    do {
        swapped = false;
        for (var i=0; i < arr.length-1; i++) {
            if (arr[i].price > arr[i+1].price) {
                var temp = arr[i];
                arr[i] = arr[i+1];
                arr[i+1] = temp;
                swapped = true;
            }
        }
    } while (swapped);

    return arr;
}

function rustItem(assetid){
	var item = {};
	item.appid = 252490;
    item.assetid = assetid;
    item.contextid = 2;
    item.amount = 1;
    return item;
}

function confirmOffer(offer, callback){
	 
	community.acceptConfirmationForObject(account.identity_secret, offer.id, function(err) {
        if (err) {
            logError('Trade #' + offer.id + ': Error while confirming: ' + err);
        }
        if (callback != null) {
            callback(err);
        }
    });
}

function removeAssetidsInUse(assetids){
    for(var a in assetids){
       usedAssetids.splice(usedAssetids.indexOf(assetids[a]), 1);
    }
}

function saveAssetidsInUse(){
    var assetidsInUse_string = JSON.stringify(usedAssetids);

    fs.writeFile('./cache/usedAssetids.json', assetidsInUse_string, function(err) {
        if(err) {
            logError('FATAL ERROR -> Error saving the usedAssetids');
        } else {
            logInfo('The usedAssetids have been saved');
        }
    }); 
}

function generateCode(){
	return generateRandomString(5);
}

function generateRandomString(length){
	var random = '';
    var possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++){
        random += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return random;
}