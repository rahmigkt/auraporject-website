<?php
declare(strict_types=1);
function aura_ready(array $c): bool {
 return ($c['enabled'] ?? false) === true && ($c['notice_verified'] ?? false) === true && !empty($c['controller']) && !empty($c['address']) && filter_var($c['recipient'] ?? '', FILTER_VALIDATE_EMAIL) && filter_var($c['sender'] ?? '', FILTER_VALIDATE_EMAIL) && filter_var($c['privacy_email'] ?? '', FILTER_VALIDATE_EMAIL) && ($c['retention_days'] ?? 0) > 0;
}
function aura_text($value, int $max, bool $required=false): string {
 if (!is_string($value) || strlen($value)>$max || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $value)) throw new InvalidArgumentException('Invalid field');
 $v=trim($value); if($required && $v==='') throw new InvalidArgumentException('Required field'); return $v;
}
function aura_validate(array $data, string $version): array {
 if(($data['noticeVersion'] ?? '')!==$version) throw new InvalidArgumentException('Notice changed');
 $contact=$data['contact'] ?? [];if(!is_array($contact) || !empty($contact['website']) || ($contact['acknowledgement'] ?? '')!=='on') throw new InvalidArgumentException('Invalid acknowledgement');
 $clean=[];foreach(['name'=>160,'email'=>254,'phone'=>80,'country'=>120,'city'=>160,'postal'=>40,'address'=>500,'note'=>1500] as $key=>$max) $clean[$key]=aura_text($contact[$key] ?? '',$max,in_array($key,['name','email','country','city'],true));
 if(!filter_var($clean['email'],FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/',$clean['email'])) throw new InvalidArgumentException('Invalid email');
 $p=$data['project'] ?? [];if(!is_array($p)||($p['format']??'')!=='aura-guided-design'||($p['version']??0)!==1)throw new InvalidArgumentException('Invalid project');
 $design=$p['design']??[];$families=['console','sofa','armchair','chair','bench','table','coffee','desk','shelf','wardrobe','dresser','nightstand','tv','bed'];if(!in_array($design['family']??'',$families,true))throw new InvalidArgumentException('Invalid family');
 $state=['family'=>$design['family']];foreach(['width','height','depth','columns','rows','seats'] as $key){$n=$design[$key]??null;if(!is_numeric($n)||!is_finite((float)$n)||$n<=0||$n>400)throw new InvalidArgumentException('Invalid dimensions');$state[$key]=(float)$n;}
 $enums=['legs'=>['straight','tapered','sled','plinth'],'arms'=>['square','rolled','rounded','slim','sloped','none'],'cushions'=>['single','split','fixed'],'back'=>['fixedBack','looseBack','channelBack'],'configuration'=>['straight','left','right'],'top'=>['rect','soft','round','oval'],'weave'=>['plain','twill22','basket'],'front'=>['open','closed','mixed'],'wood'=>['oak','walnut','dark'],'fabric'=>['linen','clay','indigo','charcoal']];foreach($enums as $key=>$values){if(!in_array($design[$key]??null,$values,true))throw new InvalidArgumentException('Invalid option');$state[$key]=$design[$key];}
 $parts=$p['parts']??[];if(!is_array($parts)||count($parts)<1||count($parts)>300)throw new InvalidArgumentException('Invalid parts');$safeParts=[];foreach($parts as $part){$item=['role'=>aura_text($part['role']??'',60,true)];foreach(['position','size'] as $key){$v=$part[$key]??null;if(!is_array($v)||count($v)!==3)throw new InvalidArgumentException('Invalid geometry');foreach($v as $n)if(!is_numeric($n)||!is_finite((float)$n)||abs((float)$n)>5||($key==='size'&&$n<=0))throw new InvalidArgumentException('Invalid geometry');$item[$key]=array_map('floatval',$v);}$item['material']=in_array($part['material']??'',['wood','fabric','metal'],true)?$part['material']:'wood';$safeParts[]=$item;}
 $language=in_array($p['language']??'',['tr','en','fr','da','de','nl','es','it'],true)?$p['language']:'en';
 return ['contact'=>$clean,'project'=>['format'=>'aura-guided-design','version'=>1,'language'=>$language,'design'=>$state,'brief'=>['room'=>in_array($p['brief']['room']??'',['living','dining','bedroom','entry','office'],true)?$p['brief']['room']:'living','familyChosen'=>true,'dimensionsEntered'=>($p['brief']['dimensionsEntered']??false)===true],'parts'=>$safeParts,'stage'=>'concept','materialsRepresentative'=>true,'designerReviewRequired'=>true,'paymentStatus'=>'not_collected','submitted'=>true],'noticeVersion'=>$version,'acknowledgedAt'=>gmdate('c')];
}
function aura_svg(array $project, string $view): string {
 $axes=$view==='front'?[0,1]:($view==='side'?[2,1]:[0,2]);$x=$axes[0];$y=$axes[1];$w=$project['design'][$x===0?'width':'depth']/100;$h=$project['design'][$y===1?'height':'depth']/100;$sx=650/max($w,.1);$sy=450/max($h,.1);$scale=min($sx,$sy);$svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#faf8f1"/><text x="40" y="35" fill="#34422f">AURA / '.strtoupper($view).' / CONCEPT</text>';
 foreach($project['parts'] as $p){$px=400+($p['position'][$x]-$p['size'][$x]/2)*$scale;$py=$y===1?530-($p['position'][$y]+$p['size'][$y]/2)*$scale:300+($p['position'][$y]-$p['size'][$y]/2)*$scale;$color=$p['material']==='fabric'?'#d2bba0':($p['material']==='metal'?'#72766a':'#aa8662');$svg.='<rect x="'.$px.'" y="'.$py.'" width="'.($p['size'][$x]*$scale).'" height="'.($p['size'][$y]*$scale).'" fill="'.$color.'" stroke="#535d4a" stroke-width="1"/>';}
 return $svg.'<text x="40" y="580" fill="#34422f">'.$project['design']['width'].' x '.$project['design']['height'].' x '.$project['design']['depth'].' cm / Designer review required</text></svg>';
}
