<?php
declare(strict_types=1);
require __DIR__.'/project-lib.php';$config=require __DIR__.'/project-config.php';
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
function respond(int $status,array $body): void {http_response_code($status);echo json_encode($body,JSON_UNESCAPED_UNICODE);exit;}
$method=$_SERVER['REQUEST_METHOD']??'GET';
// Fail closed: draft mode never reads or stores the submitted customer body.
if(!aura_ready($config))respond($method==='GET'?200:503,['available'=>false,'mode'=>'draft']);
if(!in_array($method,['GET','POST'],true))respond(405,['error'=>'Method not allowed']);
session_name('aura_project');session_set_cookie_params(['httponly'=>true,'secure'=>!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off','samesite'=>'Strict','path'=>'/w4/api/']);session_start();
if(empty($_SESSION['token']))$_SESSION['token']=bin2hex(random_bytes(32));
if($method==='GET')respond(200,['available'=>true,'controller'=>$config['controller'],'noticeVersion'=>$config['notice_version'],'token'=>$_SESSION['token']]);
$origin=$_SERVER['HTTP_ORIGIN']??'';$host=$_SERVER['HTTP_HOST']??'';if($origin===''||parse_url($origin,PHP_URL_HOST)!==explode(':',$host)[0]||!hash_equals($_SESSION['token'],$_SERVER['HTTP_X_AURA_TOKEN']??''))respond(403,['error'=>'Invalid session']);
if((int)($_SERVER['CONTENT_LENGTH']??0)>150000||stripos($_SERVER['CONTENT_TYPE']??'','application/json')!==0)respond(413,['error'=>'Invalid payload']);
$raw=file_get_contents('php://input',false,null,0,150001);if(strlen($raw)>150000)respond(413,['error'=>'Payload too large']);
try{$data=json_decode($raw,true,32,JSON_THROW_ON_ERROR);if(!is_array($data))throw new InvalidArgumentException();$record=aura_validate($data,$config['notice_version']);}catch(Throwable $e){respond(422,['error'=>'Check fields and notice']);}
$private=dirname(rtrim($_SERVER['DOCUMENT_ROOT'],'/')).'/aura-private';if(!is_dir($private)&&!mkdir($private,0700,true))respond(503,['error'=>'Storage unavailable']);
$lock=fopen($private.'/submission.lock','c');if(!$lock||!flock($lock,LOCK_EX))respond(503,['error'=>'Storage unavailable']);
$now=time();foreach(glob($private.'/rate-*')?:[] as $old)if(filemtime($old)<$now-3600)unlink($old);
$rate=$private.'/rate-'.hash('sha256',($_SERVER['REMOTE_ADDR']??'unknown').$config['sender']);$attempts=is_file($rate)?json_decode(file_get_contents($rate),true):[];$attempts=array_values(array_filter(is_array($attempts)?$attempts:[],fn($t)=>is_int($t)&&$t>$now-3600));if(count($attempts)>=5){flock($lock,LOCK_UN);fclose($lock);respond(429,['error'=>'Please try later']);}$attempts[]=$now;file_put_contents($rate,json_encode($attempts),LOCK_EX);chmod($rate,0600);
$reference='AURA-'.gmdate('Ymd').'-'.strtoupper(bin2hex(random_bytes(5)));$record['reference']=$reference;$record['receivedAt']=gmdate('c');$record['deleteAfter']=gmdate('c',time()+86400*(int)$config['retention_days']);$file=$private.'/'.$reference.'.json';$json=json_encode($record,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);if(file_put_contents($file,$json,LOCK_EX)===false){flock($lock,LOCK_UN);fclose($lock);respond(503,['error'=>'Storage unavailable']);}chmod($file,0600);
// No personal data is placed in URL parameters or in mail subject/header fields.
$boundary='aura_'.bin2hex(random_bytes(16));$headers='From: '.$config['sender']."\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=\"".$boundary.'"';$body='--'.$boundary."\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n".'New AURA project: '.$reference."\n";foreach($record['contact'] as $key=>$value)$body.=$key.': '.$value."\n";
$attachments=['project.json'=>json_encode($record['project'],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)];foreach(['front','side','top'] as $view)$attachments[$view.'.svg']=aura_svg($record['project'],$view);foreach($attachments as $filename=>$content)$body.="\r\n--".$boundary."\r\nContent-Type: application/octet-stream\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"".$filename."\"\r\n\r\n".chunk_split(base64_encode($content));$body.="\r\n--".$boundary."--\r\n";
$sent=mail($config['recipient'],'AURA project '.$reference,$body,$headers);$record['notificationAccepted']=$sent;file_put_contents($file,json_encode($record,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE),LOCK_EX);
// Retention applies to private project copies; email retention must be configured separately.
foreach(glob($private.'/AURA-*.json')?:[] as $old){$r=json_decode(file_get_contents($old),true);if(!empty($r['deleteAfter'])&&strtotime($r['deleteAfter'])<$now)unlink($old);}flock($lock,LOCK_UN);fclose($lock);
// The durable server receipt is authoritative; mail transport acceptance is not delivery proof.
respond(201,['reference'=>$reference,'received'=>true]);
