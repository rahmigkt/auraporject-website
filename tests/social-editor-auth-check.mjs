import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
// PR279's Basic-auth checks are superseded by verified Auth owner sessions.
for(const [mode,status] of [['missing',503],['basicCannotAuthorize',303],['http',403]]){
 const code=`ob_start(); register_shutdown_function(function(){ob_end_clean();echo http_response_code()?:200;});putenv('AURA_EDITOR_OWNER_EMAIL');putenv('AURA_EDITOR_LOCAL');$_SERVER['REMOTE_ADDR']='127.0.0.1';if('${mode}'!=='missing')putenv('AURA_EDITOR_OWNER_EMAIL=owner@example.com');if('${mode}'!=='http')putenv('AURA_EDITOR_LOCAL=1');$_SERVER['PHP_AUTH_USER']='owner@example.com';$_SERVER['PHP_AUTH_PW']='old-basic-password';include 'sosyal-editor.php';`;
 const r=spawnSync('C:/xampp/php/php.exe',['-r',code],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.equal(Number(r.stdout),status,mode);
}
console.log('PASS missing owner503, Basic credentials cannot authorize303, HTTP403');
