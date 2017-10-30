{extends "main.tpl"}

{block "title"}
  Your Profile
{/block}

{block "content"}
	<div class="panel panel-default">
    <div class="panel-heading text-center">
        Your Profile
    </div>
    <div class="panel-body">
    	<div class="row">
	        <div class="col-lg-4 user-profile" style="font-size:24px; word-wrap: break-word;">
	            <img src="{$useravatar}" alt="{$username} - profile picture" class="userpicture">
	         	{$username}
	            <!-- <div class="info">
	                <div class="name nameprofile">{$username}</div>
	            </div> -->
	        </div>
	        <div class="col-lg-8">
	        	<h3>Save your Trade URL</h3>
	            <p>Please make sure the trade url is valid or we won't be able to send you trade offers. You can find your trade url <a href="https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url" target="_blank" class="text-success">here</a>.</p>
	            <input type="text" class="form-control tradelinkinput" placeholder="{$userTradelink}" id="tradeurlInput" autocomplete="off"></input>
	            <button type="button" class="btn btn-red" id="save-trade" onclick="saveTradeUrl();">SAVE</button>
	        </div>
	        <!-- <div class="page">
	            <div class="name">Save your Trade URL</div>
	            <p>Please make sure the trade url is valid or we won't be able to send you trade offers. You can find your trade url <a href="https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url" target="_blank" class="text-success">here</a>.</p>
	            <div class="input-button">
	                <div class="group-input group-small">
	                    <input class="trade-input no-step" type="text" style="width:1000px;height:30px;" placeholder="https://steamcommunity.com/tradeoffer/new/?partner=">
	                    <div class="addon"><i class="fa fa-retweet"></i></div>
	                </div>
	                <button type="button" class="btn btn-red save-trade" style="width:200px;">SAVE</button>
	            </div>
	        </div> -->
        </div>
    </div>
</div>   
{/block}