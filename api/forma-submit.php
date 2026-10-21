<?php
declare(strict_types=1);
// Designer hand-off for Forma packages. Off until configured (fail closed): when disabled the browser offers the
// package as a download. When enabled, the ZIP is stored OUTSIDE the web root and only small mails are sent:
// the designer gets a signed download link, the customer a short confirmation with the design link. No attachments.
$config = require __DIR__.'/forma-config.php';
require_once __DIR__.'/forma-rate-limit.php';
header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); header('X-Content-Type-Options: nosniff');
function out(int $status, array $body): void { http_response_code($status); echo json_encode($body, JSON_UNESCAPED_UNICODE); exit; }
$dir = rtrim((string)$config['submit_store_dir'], '/');
$ready = $config['submit_enabled'] && filter_var($config['submit_recipient'], FILTER_VALIDATE_EMAIL) && filter_var($config['submit_sender'], FILTER_VALIDATE_EMAIL)
  && strlen((string)$config['submit_secret']) >= 24 && $dir !== '' && is_dir($dir) && is_writable($dir)
  && (($config['mail_api_key'] ?? '') !== '' ? function_exists('curl_init') : function_exists('mail')); // Natro shared hosting has no mail(): use the HTTPS API
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') out(200, ['available' => (bool)$ready]);
if (!$ready) out(503, ['available' => false, 'error' => 'Direct sending is not configured']);
$origin = $_SERVER['HTTP_ORIGIN'] ?? ''; $host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin === '' || parse_url($origin, PHP_URL_HOST) !== explode(':', $host)[0]) out(403, ['error' => 'Origin not allowed']);
// At most 5 submissions per address per hour.
$bucket = sys_get_temp_dir().'/aura-submit-'.hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '').date('YmdH'));
try {
  if (!forma_rate_slot($bucket, 5)) out(429, ['error' => 'Too many submissions']);
} catch (RuntimeException $e) { out(503, ['error' => 'Request limit storage unavailable']); }

$file = $_FILES['package'] ?? null;
if (!$file || $file['error'] !== UPLOAD_ERR_OK || $file['size'] > $config['submit_max_mb'] * 1048576) out(400, ['error' => 'Missing or oversized package']);
if (file_get_contents($file['tmp_name'], false, null, 0, 4) !== "PK\x03\x04") out(400, ['error' => 'Package must be a ZIP']);
$meta = json_decode((string)($_POST['meta'] ?? ''), true);
if (!is_array($meta) || empty($meta['consent']) || trim((string)($meta['name'] ?? '')) === '') out(400, ['error' => 'Name and consent are required']);
$clean = fn($v, $n = 200) => mb_substr(trim(preg_replace('/[\r\n\t]+/', ' ', (string)$v)), 0, $n);
$id = 'F'.date('ymd-His').'-'.bin2hex(random_bytes(3));
if (!move_uploaded_file($file['tmp_name'], "$dir/$id.zip")) out(500, ['error' => 'Could not store package']);
$email = filter_var($clean($meta['email'] ?? ''), FILTER_VALIDATE_EMAIL) ?: '';
$record = ['id' => $id, 'received' => date('c'), 'name' => $clean($meta['name']), 'email' => $email, 'phone' => $clean($meta['phone'] ?? ''),
  'summary' => $clean($meta['summary'] ?? '', 2000), 'link' => $clean($meta['link'] ?? '', 4000), 'lang' => preg_replace('/[^a-z]/', '', (string)($meta['lang'] ?? 'tr'))];
file_put_contents("$dir/$id.json", json_encode($record, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

// Signed, expiring download link for the designer (api/forma-file.php).
$exp = time() + 86400 * (int)$config['submit_link_days'];
$sig = hash_hmac('sha256', "$id|$exp", (string)$config['submit_secret']);
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$base = "$scheme://$host".rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/api/x'), '/');
$download = "$base/forma-file.php?id=$id&exp=$exp&sig=$sig";

$from = $config['submit_sender'];
$mailTo = function (string $to, string $subject, string $text, string $replyTo = '') use ($from, $config): bool {
  if (($config['mail_api_key'] ?? '') !== '') { // Brevo transactional API over HTTPS (free tier); sender domain verified in Brevo (DKIM in Cloudflare)
    $body = ['sender' => ['name' => 'AURA', 'email' => $from], 'to' => [['email' => $to]], 'subject' => $subject, 'textContent' => $text];
    if ($replyTo !== '') $body['replyTo'] = ['email' => $replyTo];
    $ch = curl_init('https://api.brevo.com/v3/smtp/email');
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15,
      CURLOPT_HTTPHEADER => ['accept: application/json', 'content-type: application/json', 'api-key: '.$config['mail_api_key']],
      CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE)]);
    curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    return $code >= 200 && $code < 300;
  }
  $headers = "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: 8bit\r\nFrom: AURA <$from>\r\n".($replyTo ? "Reply-To: $replyTo\r\n" : '');
  return @mail($to, '=?UTF-8?B?'.base64_encode($subject).'?=', $text, $headers, "-f$from");
};
$designer = "Yeni AURA projesi: $id\r\n\r\nMüşteri: {$record['name']}\r\nE-posta: $email\r\nTelefon: {$record['phone']}\r\n\r\n{$record['summary']}\r\n\r\n"
  ."Paket (ZIP, {$config['submit_link_days']} gün geçerli):\r\n$download\r\n\r\nTasarımı açmak için:\r\n{$record['link']}\r\n";
$sent = $mailTo($config['submit_recipient'], "AURA proje $id — {$record['name']}", $designer, $email);
$copy = false;
if ($config['submit_customer_copy'] && $email) {
  $tr = $record['lang'] === 'tr';
  $text = $tr ? "Merhaba {$record['name']},\r\n\r\nProjeniz AURA tasarımcısına ulaştı (no: $id). Tasarımcımız sizinle iletişime geçecek.\r\n\r\nTasarımınızı istediğiniz zaman açmak için:\r\n{$record['link']}\r\n\r\nAURA"
              : "Hello {$record['name']},\r\n\r\nYour project has reached an AURA designer (no. $id). We will be in touch.\r\n\r\nOpen your design at any time:\r\n{$record['link']}\r\n\r\nAURA";
  $copy = $mailTo($email, $tr ? "AURA — projeniz alındı ($id)" : "AURA — your project was received ($id)", $text);
}
out(200, ['ok' => true, 'id' => $id, 'mailed' => $sent, 'copy' => $copy]);
