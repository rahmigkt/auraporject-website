<?php
declare(strict_types=1);
// Editor roles are decided only from the Auth server's verified user response.
function aura_editor_owner(array $user, string $owner): bool {
    $email = strtolower(trim((string)($user['email'] ?? '')));
    return $owner !== '' && !empty($user['id']) && !empty($user['email_confirmed_at'])
        && hash_equals(strtolower(trim($owner)), $email)
        && empty($user['is_anonymous']);
}
function aura_editor_secure(): bool {return ($_SERVER['HTTPS'] ?? '') === 'on';}
function aura_editor_local(): bool {return getenv('AURA_EDITOR_LOCAL') === '1' && in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1','::1'], true);}
function aura_editor_session_start(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    ini_set('session.use_strict_mode','1');
    session_name('aura_editor_session');
    session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>aura_editor_secure(),'httponly'=>true,'samesite'=>'Lax']);
    session_start();
}
function aura_editor_fetch_user(string $token): array {
    if (!preg_match('/^[A-Za-z0-9._~-]{32,8192}$/D', $token)) throw new RuntimeException('invalid_token',401);
    $curl = curl_init('https://xcsvobtewvjlnjeyqiux.supabase.co/auth/v1/user');
    if ($curl === false) throw new RuntimeException('auth_unavailable',503);
    curl_setopt_array($curl,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>10,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,CURLOPT_HTTPHEADER=>['apikey: sb_publishable_yjwxxm5IaMkEi1TCugejzA__cqLpYnP','Authorization: Bearer '.$token]]);
    $body=curl_exec($curl);$status=(int)curl_getinfo($curl,CURLINFO_HTTP_CODE);curl_close($curl);
    if ($body===false || $status===0 || $status>=500) throw new RuntimeException('auth_unavailable',503);
    if ($status!==200) throw new RuntimeException('invalid_session',401);
    $user=json_decode($body,true);
    if (!is_array($user)) throw new RuntimeException('auth_unavailable',503);
    return $user;
}
function aura_editor_current(): ?array {
    aura_editor_session_start();
    $owner=(string)getenv('AURA_EDITOR_OWNER_EMAIL');
    if ($owner==='') throw new RuntimeException('editor_not_configured',503);
    if (empty($_SESSION['editor_token']) || (int)($_SESSION['editor_until']??0)<time()) return null;
    try {$user=aura_editor_fetch_user((string)$_SESSION['editor_token']);}
    catch (RuntimeException $e) {if($e->getCode()===401)unset($_SESSION['editor_token'],$_SESSION['editor_until']);throw $e;}
    if (!aura_editor_owner($user,$owner)) {unset($_SESSION['editor_token'],$_SESSION['editor_until']);return null;}
    return $user;
}
function aura_editor_require(): void {
    header('Cache-Control: no-store');
    if(!aura_editor_secure()&&!aura_editor_local()){http_response_code(403);exit('Editör erişimi HTTPS gerektirir.');}
    try {$user=aura_editor_current();} catch(RuntimeException $e){http_response_code($e->getCode()===503?503:401);exit('Editör oturumu doğrulanamadı. Hesap ekranından yeniden giriş yapın.');}
    if(!$user){header('Location: hesap.html?next=sosyal-editor.php',true,303);exit;}
}
