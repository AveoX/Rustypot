<?php
require_once('engine/config.php');
ob_start();
session_start();
error_reporting(E_ERROR | E_PARSE);
ini_set('default_socket_timeout', 30);

class Functions{

    public $db, $config;

    public function __construct($config){
        
        $this->config = $config;
        $this->db = new mysqli($config['db_host'], $config['db_user'], $config['db_pass'], $config['db_name']);
        if ($this->db->connect_error) {
            die("Couldn't connect to MySQL: ".$this->db->connect_error);
        }
        mysqli_query($this->db, "SET NAMES utf8");
    }

    public function getUser($steamid = ""){
        if(empty($steamid)){
            $user = $this->db->query("SELECT * FROM user WHERE steamid = '".$this->getString($_SESSION['steamid'])."'");
            if($user->num_rows != 0){
                return $user->fetch_object();
            }else{
                return false;
            }
        }else{
            $user = $this->db->query("SELECT * FROM user WHERE steamid = '".$steamid."'");
            if($user->num_rows != 0){
                return $user->fetch_object();
            }else{
                return false;
            }
        }
    }

    public function isLogged(){
        if(!empty($_SESSION['steamid'])){
            $user = $this->db->query("SELECT * FROM user WHERE steamid = '".$this->getString($_SESSION['steamid'])."'");
            if($user->num_rows == 0){
                return false;
            }else{
                return true;
            }
        }else{
            return false;
        }
    }

    public function authenticate(){
        require 'openid.php';
        try {
            $openid = new LightOpenID($this->config['site_url']);
            
            if(!$openid->mode) {
                $openid->identity = 'http://steamcommunity.com/openid';
                header('Location: ' . $openid->authUrl());
            } elseif ($openid->mode == 'cancel') {
                echo 'User has canceled authentication!';
            } else {
                if($openid->validate()) { 
                    $id = $openid->identity;
                    $ptn = "/^http:\/\/steamcommunity\.com\/openid\/id\/(7[0-9]{15,25}+)$/";
                    preg_match($ptn, $id, $matches);
                    
                    $_SESSION['steamid'] = $matches[1];
                    $this->updateUser();
                    if (!headers_sent()) {
                        header('Location: /');
                        exit;
                    } else {
                        ?>
                        <script type="text/javascript">
                            window.location.href="/";
                        </script>
                        <noscript>
                            <meta http-equiv="refresh" content="0;url=/"/>
                        </noscript>
                        <?php
                        exit;
                    }
                } else {
                    $_SESSION['steamid'] = 'err';
                    if (!headers_sent()) {
                        header('Location: /');
                        exit;
                    } else {
                        ?>
                        <script type="text/javascript">
                            window.location.href="/";
                        </script>
                        <noscript>
                            <meta http-equiv="refresh" content="0;url=/"/>
                        </noscript>
                        <?php
                        exit;
                    }
                }
            }
        } catch(ErrorException $e) {
            echo $e->getMessage();
        }
    }

    public function getMaintenance(){
        $response = $this->db->query("SELECT * FROM maintenance");
        if($response->num_rows == 0){
            return false;
        } else{
            return true;
        }
    }

    public function logout(){
        session_unset();
        session_destroy();
        header('Location: /');
        exit;
    }

    public function loginUserUpdate(){
        unset($_SESSION['steam_uptodate']);
        $this->updateUser();
        header('Location: /');
        exit;
    }

    public function updateUser(){
        if (empty($_SESSION['steam_uptodate']) or empty($_SESSION['steam_personaname'])) {
            $url = file_get_contents("http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=".$this->config['steamapi']."&steamids=".$_SESSION['steamid']); 
            $content = json_decode($url, true);
            $_SESSION['steam_steamid'] = $content['response']['players'][0]['steamid'];
            $_SESSION['steam_communityvisibilitystate'] = $content['response']['players'][0]['communityvisibilitystate'];
            $_SESSION['steam_profilestate'] = $content['response']['players'][0]['profilestate'];
            $_SESSION['steam_personaname'] = $content['response']['players'][0]['personaname'];
            $_SESSION['steam_lastlogoff'] = $content['response']['players'][0]['lastlogoff'];
            $_SESSION['steam_profileurl'] = $content['response']['players'][0]['profileurl'];
            $_SESSION['steam_avatar'] = $content['response']['players'][0]['avatar'];
            $_SESSION['steam_avatarmedium'] = $content['response']['players'][0]['avatarmedium'];
            $_SESSION['steam_avatarfull'] = $content['response']['players'][0]['avatarfull'];
            $_SESSION['steam_personastate'] = $content['response']['players'][0]['personastate'];
            if (isset($content['response']['players'][0]['realname'])) { 
                   $_SESSION['steam_realname'] = $content['response']['players'][0]['realname'];
               } else {
                   $_SESSION['steam_realname'] = "Real name not given";
            }
            $_SESSION['steam_primaryclanid'] = $content['response']['players'][0]['primaryclanid'];
            $_SESSION['steam_timecreated'] = $content['response']['players'][0]['timecreated'];
            $_SESSION['steam_uptodate'] = time();

        
            $user = $this->db->query("SELECT * FROM user WHERE steamid = '".$this->getString($_SESSION['steamid'])."'");
            $userHash = md5($_SESSION['steamid']. time() . rand(1,1000));
            if($user->num_rows == 0){
                    $this->db->query("INSERT INTO `user` SET steamid = '".$this->getString($_SESSION['steamid'])."', steamname = '".$this->getString($_SESSION['steam_personaname'])."', avatar = '".$this->getString($_SESSION['steam_avatarfull'])."', avatar_small = '".$this->getString($_SESSION['steam_avatarmedium'])."', userHash = '".$userHash."'");
            } else{
                $this->db->query("UPDATE user SET steamname = '".$this->getString($_SESSION['steam_personaname'])."', avatar = '".$this->getString($_SESSION['steam_avatarfull'])."', avatar_small = '".$this->getString($_SESSION['steam_avatarmedium'])."', userHash = '".$userHash."' WHERE steamid = '".$this->getString($_SESSION['steamid'])."'");
            }
        } 
    }

    public function getIP() {
        if (isset($_SERVER['CF-PSEUDO-IPV4'])) return $_SERVER['CF-PSEUDO-IPV4'];
        return $_SERVER['REMOTE_ADDR'];
    }

    public function getString($str){
        return strtr($this->db->real_escape_string($str), '<', ' ');
        }

    public function generateRandomString($length = 10) {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)];
        }
        return $randomString;
    }
}

$Functions = new Functions($cfg);

?>