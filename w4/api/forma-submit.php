<?php
declare(strict_types=1);
// Designer hand-off for Forma packages. Off by default (fail closed): when disabled the browser offers
// the package as a download instead. When enabled, the ZIP is stored outside the web root and mailed.
$config = require __DIR__.'/forma-config.php';
header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); header('X-Content-Type-Options: nosniff');
function out(int $status, array $body): void { http_response_code($status); echo json_encode($body, JSON_UNESCAPED_UNICODE); exit; }
$ready = $config['submit_enabled'] && filter_var($config['submit_recipient'], FILTER_VALIDATE_EMAIL) && $config['submit_store_dir'] !== '' && is_dir($config['submit_store_dir']) && is_writable($config['submit_store_dir']);
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') out(200, ['available' => (bool)$ready]);
if (!$ready) out(503, ['available' => false, 'error' => 'Direct sending is not configured']);
$origin = $_SERVER['HTTP_ORIGIN'] ?? ''; $host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin === '' || parse_url($origin, PHP_URL_HOST) !== explode(':', $host)[0]) out(403, ['error' => 'Origin not allowed']);
$file = $_FILES['package'] ?? null;
if (!$file || $file['error'] !== UPLOAD_ERR_OK || $file['size'] > $config['submit_max_mb'] * 1048576) out(400, ['error' => 'Missing or oversized package']);
$head = file_get_contents($file['tmp_name'], false, null, 0, 4);
if ($head !== "PK\x03\x04") out(400, ['error' => 'Package must be a ZIP']);
$meta = json_decode((string)($_POST['meta'] ?? ''), true);
if (!is_array($meta) || empty($meta['consent']) || trim((string)($meta['name'] ?? '')) === '') out(400, ['error' => 'Name and consent are required']);
$clean = fn($v, $n = 200) => mb_substr(trim(preg_replace('/[\r\n\t]+/', ' ', (string)$v)), 0, $n);
$id = 'F'.date('ymd-His').'-'.bin2hex(random_bytes(3));
$dest = rtrim($config['submit_store_dir'], '/').'/'.$id.'.zip';
if (!move_uploaded_file($file['tmp_name'], $dest)) out(500, ['error' => 'Could not store package']);
file_put_contents(rtrim($config['submit_store_dir'], '/').'/'.$id.'.json', json_encode(['id' => $id, 'received' => date('c'), 'name' => $clean($meta['name']), 'email' => $clean($meta['email'] ?? ''), 'phone' => $clean($meta['phone'] ?? ''), 'city' => $clean($meta['city'] ?? ''), 'note' => $clean($meta['note'] ?? '', 1500), 'lang' => $clean($meta['lang'] ?? '', 5), 'summary' => $clean($meta['summary'] ?? '', 800)], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
// Mail with the package attached (MIME). Hosting mail delivery must be verified before enabling.
$boundary = 'aura'.bin2hex(random_bytes(8));
$body = "--$boundary\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nAURA Forma $id\r\n".$clean($meta['name'])." · ".$clean($meta['email'] ?? '')." · ".$clean($meta['phone'] ?? '')."\r\n".$clean($meta['summary'] ?? '', 800)."\r\n\r\n".$clean($meta['note'] ?? '', 1500)."\r\n";
if (filesize($dest) < 9 * 1048576) $body .= "--$boundary\r\nContent-Type: application/zip; name=\"$id.zip\"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"$id.zip\"\r\n\r\n".chunk_split(base64_encode((string)file_get_contents($dest)))."\r\n";
$body .= "--$boundary--";
$headers = "MIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=\"$boundary\"\r\n".($config['submit_sender'] ? 'From: '.$config['submit_sender']."\r\n" : '');
$sent = @mail($config['submit_recipient'], "AURA Forma $id", $body, $headers);
out(200, ['ok' => true, 'id' => $id, 'mailed' => $sent]);
