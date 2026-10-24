<?php
require __DIR__.'/../api/editor-auth.php';
$u=['id'=>'u1','email'=>'OWNER@example.com','email_confirmed_at'=>'2026-10-24','is_anonymous'=>false];
if(!aura_editor_owner($u,'owner@example.com'))throw new Exception('owner');
foreach([array_replace($u,['email'=>'other@example.com']),array_replace($u,['email_confirmed_at'=>null]),array_replace($u,['id'=>'']),array_replace($u,['is_anonymous'=>true]),['id'=>'bad','user_metadata'=>['role'=>'editor','email'=>'owner@example.com']]] as $bad){if(aura_editor_owner($bad,'owner@example.com'))throw new Exception('forged owner');}
if(aura_editor_owner($u,''))throw new Exception('missing config');
echo "7 owner authorization checks passed\n";
