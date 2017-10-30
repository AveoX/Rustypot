{extends "main.tpl"}

{block "title"}
	INDEX
{/block}

{block "extrastyle"}
	<link rel="stylesheet" type="text/css" href="/templates/css/flipclock.css">
{/block}
{block "content"}
	<div class="row">
		<!-- LAST WINNER -->
		<div class="col-lg-3">
			<div class="panel panel-default lastWinnerPanel">
				<div class="panel-heading text-center">
					Last Winner
				</div>
				  
				<div class="panel-body noScroll text-center">
					<img src="412431.jpg" class="img-responsive center-block" id="lastWinnerImg" alt="lastWinner"></img>

					<div style="margin-top: 10px;">
						<span id="lastWinnerName" class="redText"></span> won <span id="lastAmount" class="redText"></span> with a <span id="lastPercent" class="redText"></span> Chance <br> (Ticket: <span id="lastTicket" class='redText'></span>)
					</div>
				</div>
			</div>

			<div class="panel panel-default historyPanel scroll">
				<div class="panel-heading text-center">
					History
				</div>
				  
				<div class="panel-body" id="historyArea">

				</div>
			</div>
		</div>

		<!-- JACKPOT -->
		<div class="col-lg-6" id="maxSizeDivsUnder" align="center">
			<div class="panel panel-default jackpotPanel antiPanel"> 
				<div class="panel-body" style="padding-left: 0; padding-right: 0; position: relative;">
					<img src="/templates/img/download.png" class="img-responsive center-block" id="jackpotImg"></img>
					<span id="jackpotItems">69/200</span>

					<span id="roundTotal">69.5$</span>
		
					<span id="jackpotTimer">180</span>
					
					<!--
					<div class="centered">
						<div class="row">
							<div class="col-lg-6">
								<div id="progressWheel">
									<input id="knobIsLuv" data-fgcolor="#c7413b" value="2" data-width="250" data-height="250" data-readOnly="true" data-inputColor="#4f4847" data-max="50" style="font-size:30px;">
									<span id="jackpotTimer" class="timer flip-clock-wrapper"></span>
				               	</div>
				            </div>
				            <div class="col-lg-6">   	
		               			<div id="roundInfo">
									Round -> <span class="redText" id="roundNumber">#1337</span><br>
									Total -> <span class="redText" id="roundTotal">69.5$</span>
				               	</div>
			               	</div>
		               	</div>
					</div>
					-->
				</div>
			</div>
			<div class="panel panel-default rollPanel"> 	
				<div class="panel-body text-center" id='rollPanelBody' style="overflow: hidden; padding-left: 0 !important; padding-right: 0 !important; position: relative;">
					<img src="/templates/img/Laser.png" alt="X" class="rollX"></img>
					<div id="rollContentRoll">

					</div>
				</div>
			</div>
			<div id="slideUpTogether">
				<!-- <div class="panel panel-default antiPanel redPanel"> 	
					<div class="panel-body">		
						<div id="jackpotInfoText" class="text-center">
							Add "Cyka Blyat" to your name to get <span class="redText">5%</span> less Fee!
						</div>	
					</div>
				</div> -->
				<div class="panel panel-default antiPanel redPanel"> 	
					<div class="panel-body">		
						<div id="jackpotPlay" class="text-center">
							{$playButtonText}
						</div>	
					</div>
				</div>
			</div>	
			<div class="panel panel-default antiPanel redPanel"> 
				<div class="panel-body text-center">
					<h2 style="margin-top: -5px;"> Current Items </h2>		
					<div id="currentItems">
						
					</div>
					<span id="roundHash" data-toggle="tooltip" data-placement="top" title="What is this?" onclick="openProvablyFair(); return false;">secrethackermanhash</span>	
				</div>
			</div>
		</div>

		<!-- CHAT -->
		<div class="col-lg-3">
			<div class="panel panel-default chatPanel">
				<div class="panel-heading text-center">
					Chat
				</div>

			<div class="panel-body">
				<ul class="divchat scroll" id="chatArea">
				</ul>
					<form id="chatForm">
						<?php if(isset($_SESSION["steamid"])): ?>
							<input type="text" class="form-control chatinput" placeholder="Type here to chat..." id="chatMessage" autocomplete="off" maxlength="200"></input>
						<?php endif; ?>
						<?php if(!isset($_SESSION["steamid"])): ?>  
							<input type="text" class="form-control chatinput" placeholder="You need to login to chat" id="chatMessage" autocomplete="off" maxlength="200" disabled></input>
						<?php endif; ?>
					</form>   
				</div>
			</div>

			<div class="panel panel-default announcementPanel scroll">
				<div class="panel-heading text-center">
					Announcements
				</div>
				  
				<div class="panel-body" id="announcementPanel">
					<span class="redText">RELEASE SOON</span>
				</div>
			</div>
		</div>
	</div>   
{/block}

{block "extrajs"}
	
{/block}