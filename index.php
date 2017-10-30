<?php
require_once('engine/functions.php');
require 'vendor/autoload.php';

if(isset($_GET['module'])){
	$moduleGet = $_GET['module'];
	$moduleGet = strtolower($moduleGet);
} else {
	$moduleGet = 'home';
}

if (isset($_GET['login']) || $_SESSION['steamid'] == 'err'){
	$Functions->authenticate();
} else if (isset($_GET['logout'])){
	$Functions->logout();
} else if (isset($_GET['update'])){
	$Functions->loginUserUpdate();
} 

$core = new Dwoo\Core();
$data = array('loggedIn'=>false,
			  'playButtonText'=>'Login to Deposit');


if($Functions->isLogged()){
	$user = $Functions->getUser();

	$username = $user->steamname;
	$useravatar = $user->avatar;
	$userHash = $user->userHash;
	$userRank = $user->rank;
	$userTradelink = $user->tradelink;

	if($userTradelink == 'null'){
		$userTradelink = '<Tradelink here>';
	}
	$data = array('loggedIn'=>true,
				  'username'=>$username,
				  'useravatar'=>$useravatar,
				  'userHash'=>$userHash,
				  'userRank'=>$userRank,
				  'userTradelink'=>$userTradelink,
				  'currentpage'=>$moduleGet,
				  'playButtonText'=>'Deposit'
				 );
}

$data['currentpage'] = $moduleGet;


if($Functions->getMaintenance()){
	echo $core->get('templates/maintenance.tpl', $data);
	exit;
}

if(!file_exists('templates/'.$moduleGet.'.tpl') || $moduleGet == 'main'){
	echo $core->get('templates/404.tpl', $data);
	exit;
}

if($moduleGet == 'acp'){
	if($data['userRank'] == 100){
		echo $core->get('templates/acp.tpl', $data);
		exit;
	} else {
		echo $core->get('templates/404.tpl', $data);
		exit;
	}
} if($moduleGet == 'myprofile'){
	if($data['loggedIn'] == true){
		echo $core->get('templates/myprofile.tpl', $data);
		exit;
	} else {
		echo $core->get('templates/home.tpl', $data);
		exit;
	}
} else
{
	echo $core->get('templates/'.$moduleGet.'.tpl', $data);
	exit;
}	
?>