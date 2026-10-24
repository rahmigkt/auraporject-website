import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const cases=[['missing',503],['wrong',401],['http',403],['ok',200]];
for(const [mode,status]of cases){const php=`ob_start(); register_shutdown_function(function(){ $b=ob_get_clean(); echo json_encode(['status'=>http_response_code() ?: 200,'has_editor'=>str_contains($b,'SOSYAL İÇERİK STÜDYOSU')]); }); putenv('AURA_EDITOR_USER'); putenv('AURA_EDITOR_PASSWORD_HASH'); putenv('AURA_EDITOR_LOCAL'); $_SERVER['REMOTE_ADDR']='127.0.0.1'; if('${mode}'!=='missing'){putenv('AURA_EDITOR_USER=local-test');putenv('AURA_EDITOR_PASSWORD_HASH='.password_hash('test-only',PASSWORD_DEFAULT));} if('${mode}'!=='http')putenv('AURA_EDITOR_LOCAL=1'); $_SERVER['PHP_AUTH_USER']='local-test';$_SERVER['PHP_AUTH_PW']='${mode==='wrong'?'wrong':'test-only'}';include 'sosyal-editor.php';`;
 const r=spawnSync('C:/xampp/php/php.exe',['-r',php],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);const data=JSON.parse(r.stdout);assert.equal(data.status,status,mode);assert.equal(data.has_editor,mode==='ok');}
console.log('PASS: PHP missing configuration503, wrong password401, nonHTTPS403, valid local200');
