{extends "main.tpl"}

{block "title"}
  Admin Control Panel
{/block}

{block "extrastyle"}
  <style>
      .aButton{
        color: white !important;
        cursor: pointer;
      }
  </style>
{/block}

{block "content"}
      <div class="panel panel-default">
        <div class="panel-heading">
          <i class="fa fa-file-text" aria-hidden="true"></i> Create new Announcement
        </div>
        <!-- /.panel-heading -->
        <div class="panel-body">
          <div class="col-lg-10">
            <textarea class="form-control" id="announcement" rows="11">&lt;span class="bold text-primary redText"&gt; &lt;/span&gt;</textarea>
          </div>
          <div class="col-lg-2">
            <button type="button" class="btn btn-primary" id="setannouncement" onclick="changeAnnouncement()">Confirm</button>
          </div>
        </div>
      </div>
      <div class="panel panel-default">
        <div class="panel-heading">
          <i class="fa fa-file-text" aria-hidden="true"></i> Pause Jackpot Deposits
        </div>
        <!-- /.panel-heading -->
        <div class="panel-body">
          <div class="col-lg-12">
            <button type="button" class="btn btn-primary btn-lg btn-block" onclick="jackpotPauseOn()">Deactivate Jackpot</button>
          </div>
          <br><br><br>
          <div class="col-lg-12">
            <button type="button" class="btn btn-primary btn-lg btn-block" onclick="jackpotPauseOff()">Activate Jackpot</button>
          </div>
        </div>
      </div>
      <div class="panel panel-default">
        <div class="panel-heading">
          <i class="fa fa-file-text" aria-hidden="true"></i> Chat
        </div>
        <!-- /.panel-heading -->
        <div class="panel-body">
          <div class="col-lg-12">
            <button type="button" class="btn btn-primary btn-lg btn-block" onclick="chatClear();">Clear Chat</button>
          </div>
          <br><br><br>
          <div class="col-lg-12">
            <button type="button" class="btn btn-primary btn-lg btn-block" onclick="chatPauseOn();">Deactivate Chat</button>
          </div>
          <br><br><br>
          <div class="col-lg-12">
            <button type="button" class="btn btn-primary btn-lg btn-block" onclick="chatPauseOff();">Activate Chat</button>
          </div>
        </div>
      </div>
      <div class="panel panel-default">
        <div class="panel-heading">
          <i class="fa fa-clock-o fa-fw"></i> Userinformations
        </div>
        <!-- /.panel-heading -->
        <div class="panel-body">
          <p>
          </p>
          <div class="col-lg-10">
            <input type="text" class="form-control" placeholder="Steamid64" id="steamid64" value="">
          </div>
          <div class="col-lg-2"><button type="button" class="btn btn-primary" id="search" onclick="userSearch()">Search</button>
          </div>
          <div class="col-lg-12">
            <br>
            <table class="table" id="userTable">
              <thead>
                <tr>
                  <th>Steamid64</th>
                  <th>Steamname</th>
                  <th>Won</th>
                  <th>Deposited</th>
                  <th>Tradelink</th>
                  <th>Rank</th>
                  <th>ChatBan</th>
                  <th>TotalBan</th>
                </tr>
              </thead>
              <tbody style="background-color: #337ab7;">
              </tbody>
            </table>
          </div>
        </div>
        <!-- /.panel-body -->
    </div>
{/block}
{block "extrajs"}
  <script>
  function jackpotPauseOn(){
    socket.emit('jackpotPauseOn', {});
  }

  function jackpotPauseOff(){
    socket.emit('jackpotPauseOff', {});
  }

  function chatPauseOn(){
    socket.emit('chatPauseOn', {});
  }

  function chatPauseOff(){
    socket.emit('chatPauseOff', {});
  }

  function changeAnnouncement(){
    socket.emit('changeAnnouncement', { html: $('#announcement').val() });
  }

  function userSearch(){
    socket.emit('userSearch', { userid: $('#steamid64').val() });
  }

  function userBan(type, steamid){
    socket.emit('userBan', { type: type, steamid: steamid });
    console.log('UserBan', type, steamid);
  }

  function userUnban(type, steamid){
    socket.emit('userUnban', { type: type, steamid: steamid });
    console.log('UserUnban', type, steamid);
  }

  function chatClear(){
    console.log('chatClear');
    socket.emit('chatClear', {});
  }

  function appendToUserTable(userResult){
    console.log(userResult);
    var button1 = '<td><a class="aButton" onclick="userUnban(\'chatBan\', \''+userResult.steamid+'\');">Unban</a></td>'; 
    var button2 = '<td><a class="aButton" onclick="userBan(\'chatBan\', \''+userResult.steamid+'\');">Ban</a></td>';

    var button3 = '<td><a class="aButton" onclick="userUnban(\'totalBan\', \''+userResult.steamid+'\');">Unban</a></td>';
    var button4 = '<td><a class="aButton" onclick="userBan(\'totalBan\', \''+userResult.steamid+'\');">Ban</a></td>';


    var tableRow = '<tr>';
    tableRow += '<td>'+userResult.steamid+'</td>';
    tableRow += '<td>'+userResult.steamname+'</td>';
    tableRow += '<td>'+userResult.won+'</td>';
    tableRow += '<td>'+userResult.deposited+'</td>';
    tableRow += '<td>'+userResult.tradelink+'</td>';
    tableRow += '<td>'+userResult.rank+'</td>';

    if(userResult.chatBan == '1'){
      tableRow += button1;
    } else {
      tableRow += button2;
    }
    if(userResult.totalBan == '1'){
      tableRow += button3;
    } else {
      tableRow += button4;
    }

    tableRow += '</tr>';

    $('#userTable tbody').append(tableRow);
  }

  </script>
{/block}