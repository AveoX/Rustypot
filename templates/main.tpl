<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="shortcut icon" type="image/x-icon" href="/templates/img/favicon.ico" />
    <meta name="description" content="RustyPot.com | The first rust jackpot site." property="og:description" />
    <meta name="keywords" content="RustyPot, RustyPot.com, Rust jackpot, Rust, rust skins, rust gambling, rust betting, jackpot, pot, rusty, rust steam game, rust betting website" />
    <title>RustyPot.com | The first rust jackpot site</title>

    <link href="/templates/css/bootstrap.min.css" rel="stylesheet">
    <link href="/templates/css/toastr.min.css" rel="stylesheet" type="text/css">


	<link href="/templates/css/animate.css" rel="stylesheet">
    


    <link href="/templates/css/font-awesome.min.css" rel="stylesheet" type="text/css">
    <link href="/templates/css/custom.css" rel="stylesheet" type="text/css">

    <!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->
    <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
    <!--[if lt IE 9]>
    <script src="https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js"></script>
    <script src="https://oss.maxcdn.com/libs/respond.js/1.4.2/respond.min.js"></script>
    <![endif]-->

    <script src="/templates/js/jquery.min.js"></script>
    <script src="/templates/js/jquery-ui.min.js"></script>
    <!-- <script src="/templates/js/jquery.contextMenu.js"></script> -->
    <script src="/templates/js/jquery.knob.min.js"></script>
    <script src="/templates/js/jquery.easing.js"></script>


    
    <script src="/templates/js/bootstrap.min.js"></script>
    <script src="/templates/js/toastr.min.js"></script>
    <script src="/templates/js/flipclock.min.js"></script>
    
    <script src="/templates/js/socket.io.js"></script>
    <style>
      @media (min-width: 768px) {
        .navbar-nav.navbar-center {
          position: absolute;
          left: 50%;
          transform: translatex(-50%);
        }

        .hideMobileNav {
          display: block !important;
        }
        .hideDesktopNav {
          display: none !important;
        }
      }

      @media (max-width: 767px) {
        .hideMobileNav {
          display: none !important;
        }
        .hideDesktopNav {
          display: block !important;
        }
      }

      .padTop{
        padding-top: 5px;
      }
    </style>
    {block "extrastyle"}

    {/block}
  </head>
    <body>
    <div id="loader"></div>
    <div id="header">
      <nav class="navbar navbar-inverse" id="nav">
        <div class="container-fluid">
          <div class="navbar-header">
            <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#headerNavbar">
              <span class="icon-bar"></span>
              <span class="icon-bar"></span>
              <span class="icon-bar"></span>
            </button>
            <a class="navbar-brand hideDesktopNav padTop" href="https://twitter.com/RustyPot" target="_blank"><i class="fa fa-twitter fa-2x" aria-hidden="true"></i></a>
            <a class="navbar-brand hideDesktopNav padTop" href="https://steamcommunity.com/groups/RustyPot" target="_blank"><i class="fa fa-steam fa-2x" aria-hidden="true"></i></a>
            <a class="navbar-brand hideDesktopNav padTop" href="https://discord.gg/TPnu9rp" target="_blank"><img src='/templates/img/discord_png.png' alt="discord" style="height: 28px; width: 28px;"></img></a>  
          </div>
          <div class="collapse navbar-collapse" id="headerNavbar">
            <ul class="nav navbar-nav">
              <li class="hideMobileNav"><a href="https://twitter.com/RustyPot" target="_blank"><i class="fa fa-twitter fa-2x" aria-hidden="true"></i></a> </li></li>
              <li class="hideMobileNav"><a href="https://steamcommunity.com/groups/RustyPot" target="_blank"><i class="fa fa-steam fa-2x" aria-hidden="true"></i></a> </li>
              <li class="hideMobileNav"><a href="https://discord.gg/TPnu9rp" target="_blank"><img src='/templates/img/discord_png.png' alt="discord" style="height: 28px; width: 28px;"></img></a> </li>
            </ul>
            <ul class="nav navbar-nav navbar-right padTop">
            
              <li><a href="/home"><strong>Play</strong></a></li>
			  <li><a href="/giveaway"><strong><span style="color:#ffb400;">GIVEAWAY</span></strong></a></li>

              <li><a href="/provably-fair"><strong>Provably Fair</strong></a></li>

              <li><a onclick="$('#faqModal').modal('show'); return false;" style="cursor: pointer;"><strong>Get Started</strong></a></li>

              <li><a onclick="$('#tosModal').modal('show'); return false;" style="cursor: pointer;"><strong>Tos</strong></a></li>

              <li><a onclick="$('#supportModal').modal('show'); return false;" style="cursor: pointer;"><strong>Support</strong></a></li>
              

                  <?php
                    if($data['userRank'] == 100){
                  ?>
                    <li><a href="/acp"><strong>Admin Control Panel</strong></a></li>
                  <?php
                    }
                  ?>

              <?php  
                if($data['username'] != ''){
              ?>
                <li class="dropdown">
                  <a class="dropdown-toggle" data-toggle="dropdown" href="#"><strong>{$username}</strong>
                  <span class="caret"></span></a>
                  <ul class="dropdown-menu">
				    <li><a href="/myprofile"><strong>My Profile</strong></a></li>
                    <li><a href="/?logout"><strong>Logout</strong></a></li>
                  </ul>
                </li>
              <?php
                } else {
              ?>
               <li><a href="/?login"><strong>Login</strong></a></li>   
              <?php
                }
              ?>
              <!-- /USER -->

            </ul>
          </div>
        </div>
      </nav>
    </div>
    <div id="main">
      <div style="width: 90% !important; margin-left: 5%;">
        <div class="col-lg-12">
          {block "content"}PageContent{/block}
        </div>
      </div>  
    </div>     

    </div>

    <div id="footer">
    </div>

    <!-- Modal -->
    <div class="modal fade" id="supportModal" role="dialog">
      <div class="modal-dialog modal-lg">
      
        <!-- Modal content-->
        <div class="modal-content">
          <div class="modal-header text-center">
            <button type="button" class="close" data-dismiss="modal">&times;</button>
            <h4 class="modal-title">Support</h4>
          </div>
          <div class="modal-body">
            <p>Join our Official Discord <a href="https://discord.gg/TPnu9rp" target="_blank"><h4>HERE</h4></a></p>
			      <p>Or send us an email to: contact@rustypot.com</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
          </div>
        </div>
        
      </div>
    </div>

    <!-- Modal -->
    <div class="modal fade" id="faqModal" role="dialog">
      <div class="modal-dialog modal-lg">
      
        <!-- Modal content-->
        <div class="modal-content">
          <div class="modal-header text-center">
            <button type="button" class="close" data-dismiss="modal">&times;</button>
            <h4 class="modal-title">Get Started</h4>
          </div>
          <div class="modal-body">
            <h1>Get Started:</h1>
              <br>
              <h2>Principle of operation:</h2>
              <p style="font-size:16px;">
              Players deposit skins in a round.<br>
              When the number of required deposited skins is reached, a winner will be picked based on the number of tickets his deposit worth and will be awarded all the skins in the pot!<br>
              For every $0.01 a player will get a better chance to win the pot, so a higher number of tickets means a better chance of winning! You can see the details under the <a href="/provably-fair">Provably Fair section</a>.</p>
              <h2>How to play?</h2>
              <ol style="margin-bottom:30px;">
              <li>You should login with your Steam account.</li>
              <li>
              Set your trade link by editing your Steam Profile URL.
              <p>This is a necessary step to receive the items you win and also to deposit skins.</p>
              </li>
              <li>
              After it you can start to deposit.
              <p>(So you can not accidentally deposit your skins, you have to confirm it on your phone!)</p>
              </li>
              <li>Once the item threshold of 200 items is reached, the winner will be announced.<br>
              If you won, you will receive all the items in the pot and you will receive a tradeoffer very soon.</li>
              </ol>
            </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
          </div>
        </div>
        
      </div>
    </div>

    <!-- Modal -->
    <div class="modal fade" id="tosModal" role="dialog">
      <div class="modal-dialog modal-lg">
      
        <!-- Modal content-->
        <div class="modal-content">
          <div class="modal-header text-center">
            <button type="button" class="close" data-dismiss="modal">&times;</button>
            <h4 class="modal-title">ToS</h4>
          </div>
          <div class="modal-body">
            <h1>Terms of Service</h1>
            <br>
             
            <h2>Legal Notice:</h2>
            <p style="font-size:14px;">The terms and conditions set out below (the "Terms and Conditions") apply to and govern any services used by you ("You", the "user") and marketed by us under the brand name "Rustypot" including any services provided through any website with a domain name ending "Rustypot.com" (the "Website"), and to any email and other correspondence between us relating to such a service.</p>
            <h2>Bet participation:</h2>
            <p style="font-size:14px;">By placing a bet on Rustypot.com you are 18 years of age or over, of sound mind and capable of taking responsibility for your own actions. Rustypot.com comes with no guarantees, expressed or implied, in connection with the service which is provided to you "as is" and we provide you with no warranty whatsoever regarding its quality, completeness or accuracy. As such, Rustypot.com cannot be held responsible in any event, direct, indirect or consequential with the use of the website. Rustypot.com reserves the right to suspend and/or cancel any bet/wager at any time. When a platform is suspended, any bets entered will be on hold. Rustypot.com also reserves the right to cease betting at any time without notice.</p>
            <h2>Deposit, withdraw or lost items:</h2>
            <p style="font-size:14px;">If any loss occur during a bet caused by a software or network issue, you have 7 days to make a claim by opening a ticket at <a href="http://contact.Rustypot.com" target="_blank">http://contact.Rustypot.com</a>, after which these items will be considered surrendered. We strongly encourage you to withdraw your winning as soon as possible to avoid any issues. Keep in mind that the items you get after winning a round may not be the same as the one you deposit, meaning that stickers and nametag may be lost. However the total value won will stay the same. For every round played on Rustypot.com a 0-5% commission will be taken. It is calculated of the total pot value and is taken from the item pool, except the winners deposited item. 
            <h2>Content:</h2>
            <p style="font-size:14px;">The content of the pages of this website is for your general information and use only. It is subject to change without notice. This website contains material which is owned by us. This material includes, but is not limited to, the design, layout, look, appearance and graphics. Reproduction is prohibited other than in accordance with the copyright notice, which forms part of these terms and conditions.</p>
            <h2>Affiliation:</h2>
            <p style="font-size:14px;">Rustypot.com is no affiliated with Valve Corporation, Rust or any other trademarks of the Valve Corporation.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
          </div>
        </div>
        
      </div>
    </div>

    <!-- Modal -->
    <div class="modal fade" id="roundModal" role="dialog">
      <div class="modal-dialog modal-lg">
      
        <!-- Modal content-->
        <div class="modal-content">
          <div class="modal-header text-center">
            <button type="button" class="close" data-dismiss="modal">&times;</button>
          </div>
          <div class="modal-body roundModalBody"></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
          </div>
        </div>
        
      </div>
    </div>

    <!-- Modal -->
    <div class="modal fade" id="depositModal" role="dialog">
      <div class="modal-dialog modal-lg">
      
        <!-- Modal content-->
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal">&times;</button>
            <h4 class="modal-title text-center">Deposit</h4>
          </div>
          <div class="modal-body">
            <div class="row" style="margin: 0 5px 10px 5px;">
              <div class="col-lg-10">
                <input type="text" class="form-control" onkeyup="search();" placeholder="Search..." id="itemSearch" value="">
              </div>
              <div class="col-lg-2">
                <div class="dropdown">
                  <button class="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown"><span id="sortButtonText">Price descending</span>
                  <span class="caret"></span></button>
                  <ul class="dropdown-menu">
                    <li><a href="#" onclick="sortItems('desc', false); return false;">Price descending</a></li>
                    <li><a href="#" onclick="sortItems('asc', false); return false;">Price ascending</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="row"> 

              <div class="col-lg-12" id="depositModalBody">
                <div style="margin-left: 47%;">
                  <i class="fa fa-refresh fa-spin fa-3x fa-fw"></i>
                  <span class="sr-only">Loading...</span>
                </div> 
              </div> 
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
            <button type="button" class="btn btn-default" onclick="refresh();">Refresh Inventory</button>
            <button type="button" class="btn btn-default" onclick="deposit();">Deposit<span id="depositTotal"></span></button>
          </div>
        </div>
        
      </div>
    </div>

    <script>
      var loggedIn = "{$loggedIn}";
      var userHash = "{$userHash}";
      var currentpage = "{$currentpage}";
      var tradelink = "{$userTradelink}";
    </script>

    {block "extrajs"}{/block}
    <script type="text/javascript" src="/templates/js/app.js"></script>
    
  </body>
</html>