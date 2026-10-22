<?php
declare(strict_types=1);
// Pure validation/rendering: no endpoint, email, storage or external service is invoked.
require __DIR__.'/../api/project-lib.php';
function fixture(): array {
 return ['noticeVersion'=>'test','contact'=>['name'=>'Test','email'=>'test@example.invalid','country'=>'TR','city'=>'Test','acknowledgement'=>'on'],'project'=>['format'=>'aura-guided-design','version'=>1,'language'=>'tr','design'=>['family'=>'console','width'=>100,'height'=>80,'depth'=>40,'columns'=>1,'rows'=>1,'seats'=>1,'legs'=>'straight','arms'=>'none','cushions'=>'single','back'=>'fixedBack','configuration'=>'straight','top'=>'rect','weave'=>'plain','front'=>'open','wood'=>'oak','fabric'=>'linen'],'parts'=>[['role'=>'top','position'=>[0,0.8,0],'size'=>[1,0.03,0.4],'material'=>'wood']]]];
}
function check(bool $ok,string $why): void { if(!$ok)throw new RuntimeException($why); }
function rejected(array $data): void { try { aura_validate($data,'test'); } catch(InvalidArgumentException $e){return;} throw new RuntimeException('Malformed geometry was accepted'); }
$cases=[];
$cases['valid geometry renders all views without warnings']=function(){
 $clean=aura_validate(fixture(),'test');
 set_error_handler(function($severity,$message){throw new RuntimeException($message);});
 try{foreach(['front','side','top'] as $view){$svg=aura_svg($clean['project'],$view);check(strpos($svg,'<rect')!==false,'missing drawing');check(!preg_match('/(?:NAN|INF)/',$svg),'nonfinite drawing');}}finally{restore_error_handler();}
};
foreach(['position','size'] as $key){
 $cases[$key.' rejects named axes']=function()use($key){$d=fixture();$d['project']['parts'][0][$key]=['x'=>1,'y'=>1,'z'=>1];rejected($d);};
 $cases[$key.' rejects sparse numeric axes']=function()use($key){$d=fixture();$d['project']['parts'][0][$key]=[1=>1,2=>1,3=>1];rejected($d);};
 foreach([[1,2],[1,2,3,4],[1,INF,1],[1,NAN,1]] as $i=>$vector){$cases[$key.' rejects invalid vector '.$i]=function()use($key,$vector){$d=fixture();$d['project']['parts'][0][$key]=$vector;rejected($d);};}
}
$cases['zero size rejected']=function(){$d=fixture();$d['project']['parts'][0]['size'][1]=0;rejected($d);};
$cases['negative coordinates accepted']=function(){$d=fixture();$d['project']['parts'][0]['position']=[-0.5,0,0.2];$c=aura_validate($d,'test');check($c['project']['parts'][0]['position']=== [-0.5,0.0,0.2],'coordinate changed');};
$failed=0;foreach($cases as $name=>$run){try{$run();echo "PASS $name\n";}catch(Throwable $e){$failed++;fwrite(STDERR,"FAIL $name: ".$e->getMessage()."\n");}}
echo (count($cases)-$failed).'/'.count($cases)." passed\n";exit($failed?1:0);
