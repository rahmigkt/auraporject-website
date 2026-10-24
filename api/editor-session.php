<?php
declare(strict_types=1);
require __DIR__.'/editor-auth.php';
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
function answer(int $status,array $body): never {http_response_code($status);echo json_encode($body,JSON_UNESCAPED_UNICODE);exit;}
if(!aura_editor_secure()&&!aura_editor_local())answer(403,['error'=>'Güvenli HTTPS bağlantısı gerekli.']);
if(($_SERVER['REQUEST_METHOD']??'')!=='POST')answer(405,['error'=>'POST gerekli.']);
$origin=$_SERVER['HTTP_ORIGIN']??'';$expected=(aura_editor_secure()?'https://':'http://').($_SERVER['HTTP_HOST']??'');
if($origin!==$expected)answer(403,['error'=>'Geçersiz istek kaynağı.']);
if(stripos($_SERVER['CONTENT_TYPE']??'','application/json')!==0 || (int)($_SERVER['CONTENT_LENGTH']??0)>12000)answer(413,['error'=>'Geçersiz istek.']);
$raw=(string)file_get_contents('php://input',false,null,0,12001);if(strlen($raw)>12000)answer(413,['error'=>'Geçersiz istek.']);
try{$payload=json_decode($raw,true,16,JSON_THROW_ON_ERROR);}catch(Throwable $e){answer(400,['error'=>'Geçersiz istek.']);}
if(!is_array($payload))answer(400,['error'=>'Geçersiz istek.']);
aura_editor_session_start();
if(($payload['action']??'')==='logout'){
    $_SESSION=[];session_destroy();setcookie(session_name(),'', ['expires'=>time()-3600,'path'=>'/','secure'=>aura_editor_secure(),'httponly'=>true,'samesite'=>'Lax']);answer(200,['signed_out'=>true]);
}
if(($payload['action']??'')!=='login')answer(400,['error'=>'Geçersiz işlem.']);
$owner=(string)getenv('AURA_EDITOR_OWNER_EMAIL');if($owner==='')answer(503,['error'=>'Editör yetkisi sunucuda henüz yapılandırılmadı.']);
try{$token=$payload['access_token']??'';if(!is_string($token))answer(400,['error'=>'Geçersiz oturum.']);$user=aura_editor_fetch_user($token);if(!aura_editor_owner($user,$owner))answer(403,['error'=>'Bu doğrulanmış hesaba editör yetkisi verilmemiş.']);session_regenerate_id(true);$_SESSION['editor_token']=$token;$_SESSION['editor_until']=time()+1800;answer(200,['editor'=>true]);}
catch(RuntimeException $e){$code=$e->getCode()===503?503:401;answer($code,['error'=>$code===503?'Hesap doğrulama servisine ulaşılamadı.':'Geçerli oturum gerekli.']);}
