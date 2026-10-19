<?php
declare(strict_types=1);
// Designer download of a stored project package via a signed, expiring link (made by forma-submit.php).
$config = require __DIR__.'/forma-config.php';
$id = (string)($_GET['id'] ?? ''); $exp = (int)($_GET['exp'] ?? 0); $sig = (string)($_GET['sig'] ?? '');
$dir = rtrim((string)$config['submit_store_dir'], '/');
$ok = preg_match('/^F\d{6}-\d{6}-[0-9a-f]{6}$/', $id) && $exp > time() && strlen((string)$config['submit_secret']) >= 24
  && hash_equals(hash_hmac('sha256', "$id|$exp", (string)$config['submit_secret']), $sig) && is_file("$dir/$id.zip");
if (!$ok) { http_response_code(404); header('Content-Type: text/plain; charset=utf-8'); echo 'Bağlantı geçersiz ya da süresi dolmuş.'; exit; }
header('Content-Type: application/zip'); header('X-Content-Type-Options: nosniff'); header('Cache-Control: private, no-store');
header('Content-Disposition: attachment; filename="'.$id.'.zip"'); header('Content-Length: '.filesize("$dir/$id.zip"));
readfile("$dir/$id.zip");
