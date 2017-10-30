const socket_host = '84.200.222.172:1337';
//const bot_tradeurl = "https://steamcommunity.com/tradeoffer/new/?partner=416463195&token=dDxxTe8N";
var socket;
var jackpotCountdownClock;

toastr.options.progressBar = true;
toastr.options.positionClass = "toast-bottom-left";

var rankNames = {
    '1337': {
        name: 'Developer',
        color: 'green'
    },     
    '100': {
        name: 'Admin',
        color: 'red'
    } 
};


$(document).ready(function() {
	ready();
});

function ready(){
    connect();
    listeners();
    shit();
}

function connect() {
    socket = io(socket_host);

    setTimeout(function() {
        if (!socket.connected) {
            showNotification('error', 'Failed to connect with the Server.');
        }
    }, 3000);

    socket.on('connect', function() {
        showNotification('success', 'Connected to the Server.');
        if (loggedIn) {
            socket.emit('userConnection', {
                userHash: userHash,
                jackpot: true
            });
        } else {
            loaded();
        }
    });

    socket.on('disconnect', function() {
        showNotification('error', 'Lost connection to the Server.');

        setTimeout(function(){
            location.reload();
        }, 1000);
    });

    socket.on('refresh', function(){
        setTimeout(function(){
            location.reload();
        }, Math.random() * 1000);
    })


    setupSocket();
}


function setupSocket() {
    socket.on('notification', function(data) {
        showNotification(data.type, data.message);
    });

    socket.on('chatMessage', function(data){
    	addChatMessage(data);
    });

    socket.on('lastWinner', function(data){
    	setLastWinner(data);
    });

    socket.on('itemsInPot', function(data){
        knobChange(data.value);
    });

    socket.on('roundNumber', function(data){
        roundNumberChange(data.value);
    });

    socket.on('roundTotal', function(data){
        roundTotalChange(data.value);
    });

    socket.on('roundHash', function(data){
        roundHashChange(data.value);
    });

    socket.on('timeLeft', function(data){
        clockChance(data.value, data.isPotRunning);
    });

    socket.on('gameRoll', function(data){
        gameRoll(data);
    });

    socket.on('gameHistory', function(data){
        var l = $('.historyGame').length;

        if(l == 5){
            $('#historyArea .historyGame').last().remove();
        }
        
        addHistory(data);
    });

    socket.on('newItem', function(data){
        if(currentpage == 'home'){
            addItem(data, $('#currentItems'));
            $('#roundHash').css('display', '');
        }
    });


    socket.on('announcement', function(data){
        setAnnouncement(data.html);
    });

    socket.on('depositInventory', function(data){
        console.log(data);
        if(data.success){
            sortItems('desc', data.inventoryHtml);
        } else {
            fillDepositInventory(data.inventoryHtml);
            showNotification('error', 'Failed to load your Inventory. Try again later!');
        }
    });

    socket.on('userSearchResult', function(data){
        if(currentpage == 'acp'){
            console.log(data);
            appendToUserTable(data); //SECRET ADMIN PANEL FUNC EHEHEEHE
        }
    });

    socket.on('clearChat', function(data){
        if(currentpage == 'home'){
            clearChat();
        }
    });


    if(loggedIn){
        socket.on('authenticated', function(data){
            loaded();
        });
    }    
}

function shit(){
    toolTip()
    /* $("#knobIsLuv").knob({
        'format': function(value) {
            return value + '/50';
        },
        'draw': function() {
            $(this.i).css('font-size', '45px');
        }
    });
    console.log('knobIsLife');
    
    jackpotCountdownClock = $('.timer').FlipClock(120, {
        countdown: true,
        clockFace: 'MinuteCounter',
        autoStart: false
    }); */

    $('.rollPanel').slideUp('fast', function(){});

    $('#roundHash').css('display', 'none');
}

function listeners(){
    $('#chatForm').on('submit', function() {
        var text = $("#chatMessage").val();
        $("#chatMessage").val('');
        if (text) {
            socket.emit('chatMessage', { message: text });
        }
        return false;
    });

    $('#jackpotPlay').on('click', function() {
        if(!loggedIn){
            showNotification('error', 'Please log in');
            return;
        }
        if(tradelink != 'null'){
            openDepositInventory();
            /* var win = window.open(bot_tradeurl, '_blank');
            if (win) {
                win.focus();
            } else {
                alert('Please allow popups for this website');
            } */
        } else {
            showNotification('info', 'Please set your Tradelink in your profile.');
        }
    });
}

function saveTradeUrl(){
    var text = $("#tradeurlInput").val();

    if (text) {
        socket.emit('tradelink', { url: text });
        console.log('Tradelink: Saving...');
    }
}


function openProvablyFair(){
    //window.location.href = 'provably-fair';
    var win = window.open('provably-fair', '_blank');
    if (win) {
        win.focus();
   } else {
        alert('Please allow popups for this website');
    }
}

function gameRoll(data){
    showNotification('info', 'Rolling...');
    knobChange(0);
    clockChance(0, false);

    //jackpotCountdownClock.setTime(0);

    var html = data.html;

    $('#rollContentRoll').css("margin-left", "-32px");
    $('#rollContentRoll').html(html);

    var rest = function(){
        var rollEntries = [];

        var render = function(){
            var fix = parseInt($('#rollPanelBody').width() / 2);
            fix = fix - 35;
            var pos = data.position;
            console.log(pos, fix);
            pos = pos - fix;
            console.log(pos);
            pos = pos - data.wobble;

            pos = pos * -1;
            pos = pos.toFixed(0);

            console.log(pos);

            $("#rollContentRoll").animate({marginLeft: pos+'px'}, 8500, "easeOutExpo");
        };

        setTimeout(function(){
            render();
        }, 750);
        

        setTimeout(function(){
            clearItems();
            $('.rollPanel').slideUp('fast', function(){
                $('#slideUpTogether').slideDown('slow', function(){
                    $('#roundHash').css('display', 'none');
                });
            });
        }, 11000);
    };

    $('#slideUpTogether').slideUp('fast', function(){
        $('.rollPanel').slideDown('slow', function(){
            rest();
        });
    });
}

function addChatMessage(message){
    if(currentpage == "home"){
        var mes = "<li><div class='chatMessage'>";

        var rank = (rankNames.hasOwnProperty(message.rank)) ? '<b style="color: '+rankNames[message.rank].color+'">['+rankNames[message.rank].name+']</b>': '';
        if(message.steamid != '1234'){
            mes += "<p class='chatMessage'><img class='img-rounded' src='"+message.avatar+"' height='25' width='25'> <a href='http://steamcommunity.com/profiles/"+message.steamid+"/' target='_blank'>"+rank+"<b>"+message.name+"</b></a>: "+message.message+"</p>";
        } else {
            mes += "<p class='chatMessage'><img class='img-rounded' src='"+message.avatar+"' height='25' width='25'> "+rank+" <b>"+message.name+"</b> : "+message.message+"</p>";
        }
        
        mes += "</div></li>";
        var $mes = $(mes);


        $mes.appendTo($('#chatArea'));

        var chatArea = document.getElementById('chatArea');
            chatArea.scrollTop = chatArea.scrollHeight;

        /* if(message.noAnimation){

            $mes.appendTo($('#chatArea'));

            var chatArea = document.getElementById('chatArea');
            chatArea.scrollTop = chatArea.scrollHeight;
        } else {
            $mes.appendTo($('#chatArea')).slideDown("fast", function() { 
                var chatArea = document.getElementById('chatArea');
                chatArea.scrollTop = chatArea.scrollHeight;
            }); 
        } */ 
    }
}

function clearChat(){
    $('#chatArea').html('');
}

var currentHistoryId = 0;
var historyDataStorage = {};

function addHistory(data){
    var his = "<div class='historyGame' onclick='showHistoryDetails("+currentHistoryId+")'>";
    his += "<img class='historyProfilePicture' src='"+data.img+"'></img><span class='redText'>"+data.name+"</span> won <span class='redText'>"+parseFloat(data.amount).toFixed(2)+"$</span> with a <span class='redText'>"+parseFloat(data.percentage).toFixed(2)+"%</span> Chance <div class='text-center' data-toggle='tooltip' data-placement='top' title='What is this?' onclick='openProvablyFair(); return false;'>Ticket: <span class='redText'>"+data.ticket+"</span></div>";
    his += "</div>";

    var $his = $(his);


    $his.prependTo($('#historyArea')); 

    toolTip();

    historyDataStorage[currentHistoryId] = data;
    currentHistoryId++;
}


function showHistoryDetails(id){
    var data = historyDataStorage[id];
    data = JSON.parse(JSON.stringify(data));

    console.log(id);
    console.log(data);
    
    $('.roundModalBody').empty();
    $('.roundModalBody').html("<div class='text-center'> Ticket: <span class='redText' data-toggle='tooltip' data-placement='top' title='What is this?' onclick='openProvablyFair(); return false;'>"+data.ticket+" </span>\
    Salt: <span class='redText' data-toggle='tooltip' data-placement='top' title='What is this?' onclick='openProvablyFair(); return false;'>"+data.salt+" </span>\
    Hash: <span class='redText' data-toggle='tooltip' data-placement='top' title='What is this?' onclick='openProvablyFair(); return false;'>"+data.hash+" </span></div>");

    var winnerId = data.steamid;
    var xd = 100 - id;


    for(var d in data.entries){
        console.log(data.entries[d].ownerid);
        data.entries[d].ownerid += '_' + xd;
        data.entries[d].noAnimation = true;
        addItem(data.entries[d], $('.roundModalBody'));
    }

    console.log(data);

    console.log(winnerId, xd,  $('.owner_'+winnerId+'_' + xd).html());

    $('.owner_'+winnerId+'_' + xd).addClass('roundWinner');

    $('#roundModal').modal('show');  
}


function addItem(data, where, profilePicutre){
    var item = "<div class='gameItem item_"+data.ownerid+ " img-rounded floating-div' data-toggle='tooltip' data-price='"+data.price+"' title='"+data.market_hash_name+"'>";
    item += "<img src='"+data.img+"'></img>";
    item += "<span class='redText'>$"+data.price+"</span>";
    item += "</div>";

    var showAnimation = true;
    if(data.hasOwnProperty('noAnimation')){
        showAnimation = false;
    }
    console.log(showAnimation);
    if( $('.owner_'+data.ownerid).length ){
        var $item = $(item);

        if(showAnimation){
            $item.hide().prependTo($('#owner_'+data.ownerid+'_items')).slideDown('slow', function(){});
        } else {
            $item.prependTo($('#owner_'+data.ownerid+'_items'));    
        }

        var pricesum = parseFloat($('#owner_'+data.ownerid+'_span').data('sum')) + parseFloat(data.price);
        pricesum = pricesum.toFixed(2).replace('.00','');

        $('#owner_'+data.ownerid+'_span').text('$'+pricesum);
        $('#owner_'+data.ownerid+'_span').data('sum', pricesum);

        var itemList = $('.item_'+data.ownerid);
        itemList.sort(function(a, b){
            return ($(a).data('price') > $(b).data('price')) ? -1 : ($(a).data('price') < $(b).data('price')) ? 1 : 0;
        });

        $('#owner_'+data.ownerid+'_items').html(itemList);
        toolTip();
    } else {
        var ownerdiv = "<div class='gameItemOwner owner_"+data.ownerid+"'>";
        ownerdiv += "<img src='"+data.owneravatar+"' class='ownerAvatar' style='border-radius: 50%; margin-right: 5px;'></img>";
        ownerdiv += "<a href='https://steamcommunity.com/profiles/"+data.ownerid.split('_')[0]+"'>"+data.ownername+"</a> | <span id='owner_"+data.ownerid+"_span' class='ownerSpan' data-sum='"+data.price+"'>"+data.price+"$</span>";
        ownerdiv += "<div class='clearfix'><div class='outer-div'><div class='ownerItems inner-div' id='owner_"+data.ownerid+"_items'></div>";
        ownerdiv += "</div></div></div>";

        var $ownerdiv = $(ownerdiv);   

        var $item = $(item);
        

        if(showAnimation){
            $ownerdiv.hide().prependTo(where).slideDown('fast', function(){
                $item.hide().prependTo($('#owner_'+data.ownerid+'_items')).slideDown('slow', function(){
                    toolTip();
                });
            });
            
        } else {
            $ownerdiv.prependTo(where);
            $item.prependTo($('#owner_'+data.ownerid+'_items'));
            toolTip();
        }
    }
}


function clearItems(){
    $('#currentItems').slideUp('slow', function(){
        $('#currentItems').empty();
        $('#currentItems').css('display', '');
    });  
}

function setLastWinner(data){
    console.log(data.img);
    $('#lastWinnerImg').attr('src', data.img);
    $('#lastWinnerName').text(data.name);
    $('#lastAmount').text('$'+parseFloat(data.amount).toFixed(2).replace('.00',''));
    $('#lastPercent').text(parseFloat(data.percentage).toFixed(2).replace('.00','')+'%'); 
    $('#lastTicket').text(data.ticket); 
}

function setAnnouncement(data){
    if(currentpage == 'home'){
        $('#announcementPanel').html(data);
    }
}


function knobChange(value){
    //$('#knobIsLuv').val(value).trigger('change');
    $('#jackpotItems').text(value+'/200');
}

function clockChance(value, start){
    $('#jackpotTimer').text(value);
    //jackpotCountdownClock.setTime(value);

    //if(start)
        //jackpotCountdownClock.start();
    if(start){
        var countdownTime = parseInt($('#jackpotTimer').text());
        var clock = function(){
            $('#jackpotTimer').text(countdownTime+'');
            countdownTime--;
            if(countdownTime == 0)
                clearInterval(interval); 
        };

        var interval = setInterval(clock, 1000);
    }    
}

function roundNumberChange(value){
    $('#roundNumber').text('#'+value);
}


function roundTotalChange(value){
    $('#roundTotal').text('$'+value);
}

function roundHashChange(value){
    $('#roundHash').text(value);
}


function invSelect(assetid){
    var $div = $('#assetid_'+assetid);
    var $checkmark = $('#assetid_'+assetid+'_bg');
    
    if($div.length == 1){
        if($div.hasClass('itemSelected')){
            //UNSELECT
            $div.removeClass('itemSelected');
            $checkmark.removeClass('checkmark');
            subtractDepositTotalCounter($div.data('price'));
        } else {
            if($('.itemSelected').length >= 20){
                showNotification('info', 'You can only select 20 Items');
                return;
            }
            //SELECT
            $div.addClass('itemSelected');
            $checkmark.addClass('checkmark');
            addDepositTotalCounter($div.data('price'));
        }
    }
}

var depositTotal = 0;
function addDepositTotalCounter(amount){
    amount = round(amount, 2);
    depositTotal += amount;

    depositTotal = round(depositTotal, 2);
    $('#depositTotal').text(' $'+depositTotal);
}

function subtractDepositTotalCounter(amount){
    amount = round(amount, 2);
    depositTotal -= amount;

    depositTotal = round(depositTotal, 2);
    if(depositTotal > 0){
        $('#depositTotal').text(' $'+depositTotal);
    } else {
        $('#depositTotal').text('');
    }
}

var inventoryLoadedOnce = false; 
function openDepositInventory(){
    $('#depositModal').modal('show');

    if(!inventoryLoadedOnce){
        socket.emit('loadInventory', {});
    }
}

function fillDepositInventory(html){
    $('#depositModalBody').html(html);
    toolTip();
    
    inventoryLoadedOnce = true;
}

function toolTip(){
    $('[data-toggle="tooltip"]').tooltip();
}


function deposit(){
    var assetids = [];

    $('#depositModalBody').find('.itemSelected').each(function(i){
        assetids.push($(this).attr('data-assetid'));
    });

    if(assetids.length != 0){
        $('#depositModal').modal('hide');
        showNotification('info', 'Depositing... Please be patient');

        socket.emit('deposit', { assetids: assetids });
    } else {
        showNotification('error', 'You need to select Items!');
    }
}

function refresh(){
    depositTotal = 0;
    $('#depositTotal').text('');
    $('#depositModalBody').html('<div style="margin-left: 47%;"><i class="fa fa-refresh fa-spin fa-3x fa-fw"></i><span class="sr-only">Loading...</span></div>');
    socket.emit('loadInventory', {});
}

function sortItems(sort, items){
    if(items == false){
        var itemList = $('.itemChoose');
    } else {
        var itemList = $(items);
    }
    
    if(sort == 'asc'){
        $('#sortButtonText').text('Price ascending');
        
        itemList.sort(function(a, b){
            return ($(a).data('price') > $(b).data('price')) ? 1 : -1;;
        });
    } else {
        $('#sortButtonText').text('Price descending');

        itemList.sort(function(a, b){
            return ($(a).data('price') < $(b).data('price')) ? 1 : -1;;
        });
    }
    if(items == false){
        $('#depositModalBody').html(itemList);
    } else {
        fillDepositInventory(itemList);
    }
}

function search(){
    var filter = $('#itemSearch').val().toLowerCase();

    $('.itemChoose').each(function() {
        if($(this).attr('data-name').toLowerCase().indexOf(filter) > -1){
            $(this).css('display', '');
        } else {   
            $(this).css('display', 'none');
        }
    });


}



function loaded(){
    setTimeout(function(){
        //$('#loader').css('display', 'none');
        $('#loader').fadeOut("slow");
    },500);
}

function showNotification(type, message, duration){
	console.info('Notification -> '+type+': '+message);
	switch(type){
		case 'success':
			toastr.success(message);
			break;
		case 'error':
			toastr.error(message);
			break;
		case 'info':
			toastr.info(message);
			break;		
	}
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