<?php
declare(strict_types=1);
// Thin, bounded proxy between the Forma studio and the AI provider. The model never executes anything:
// it only returns JSON that the browser validates against the part vocabulary before applying.
$config = require __DIR__.'/forma-config.php';
header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); header('X-Content-Type-Options: nosniff');
function out(int $status, array $body): void { http_response_code($status); echo json_encode($body, JSON_UNESCAPED_UNICODE); exit; }
$ready = $config['ai_enabled'] && $config['ai_api_key'] !== '' && function_exists('curl_init');
$action = $_GET['action'] ?? '';
if ($action === 'health') out(200, ['available' => $ready, 'vision' => $ready]);
if (!$ready) out(503, ['error' => 'AI service is not configured']);
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(405, ['error' => 'Method not allowed']);
$origin = $_SERVER['HTTP_ORIGIN'] ?? ''; $host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== explode(':', $host)[0]) out(403, ['error' => 'Origin not allowed']);
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 6_000_000) out(413, ['error' => 'Request too large']);

// Rate limit per client address (hashed), file-based so it works on shared hosting.
$bucket = sys_get_temp_dir().'/aura-forma-'.hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '').date('YmdH').intdiv((int)date('i'), 10));
$count = is_file($bucket) ? (int)file_get_contents($bucket) : 0;
if ($count >= (int)$config['ai_rate_per_10min']) out(429, ['error' => 'Too many requests']);
file_put_contents($bucket, (string)($count + 1));

$in = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($in)) out(400, ['error' => 'Invalid JSON']);
$vocab = json_encode($in['vocabulary'] ?? [], JSON_UNESCAPED_UNICODE);
$lang = preg_replace('/[^a-z]/', '', (string)($in['lang'] ?? 'en'));

if ($action === 'command') {
  $text = mb_substr((string)($in['text'] ?? ''), 0, 600);
  $design = json_encode($in['design'] ?? [], JSON_UNESCAPED_UNICODE);
  $system = "You edit a parametric seating design (sofa, loveseat, armchair). Units: millimetres and degrees. "
    ."Answer ONLY with JSON: {\"actions\":[...], \"reply\":\"short confirmation in the user's language ($lang)\"}. "
    ."Action forms: {\"type\":\"set\"|\"delta\",\"key\":PARAM,\"value\":NUMBER} · {\"type\":\"enum\",\"key\":ENUM,\"value\":OPTION} · "
    ."{\"type\":\"material\",\"slot\":\"fabric\"|\"wood\"|\"metal\"|\"welt\",\"key\":KEY,\"value\":OPTION} · {\"type\":\"style\",\"value\":STYLE} · {\"type\":\"kind\",\"value\":KIND}. "
    ."Use only keys and options from this vocabulary: $vocab. If the request cannot be expressed with them, return no actions and explain briefly in reply. Never invent options.";
  $messages = [['role' => 'user', 'content' => "Current design: $design\nRequest: $text"]];
} elseif ($action === 'vision') {
  $img = (string)($in['image'] ?? '');
  if (!preg_match('#^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$#', $img, $m)) out(400, ['error' => 'Unsupported image']);
  if (strlen($m[2]) > 5_500_000) out(413, ['error' => 'Image too large']);
  $system = "You read a photo or sketch of a seating piece (sofa, loveseat, armchair) and describe it ONLY with this parametric vocabulary: $vocab. "
    ."Analyse parts the way an upholsterer would: arms (section and height), back (construction and rake), seat cushions (count, edge, thickness), base (legs/plinth/skirt/sled/frame) and leg turning. "
    ."Estimate millimetre dimensions from ergonomic norms when no scale is visible and list only truly measurable dimensions in \"measured\". "
    ."Do not name designers, brands or products. Do not invent parts you cannot see. "
    ."Answer ONLY with JSON: {\"design\":{\"kind\":KIND,\"style\":STYLE,\"params\":{...},\"materials\":{\"fabric\":{...},\"wood\":{...},\"metal\":{...}},\"measured\":[],\"confidence\":0..1,\"notes\":\"one sentence in $lang\"}}.";
  $messages = [['role' => 'user', 'content' => [
    ['type' => 'image', 'source' => ['type' => 'base64', 'media_type' => $m[1], 'data' => $m[2]]],
    ['type' => 'text', 'text' => 'Describe this piece as a design in the vocabulary.']
  ]]];
} else out(400, ['error' => 'Unknown action']);

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 60,
  CURLOPT_HTTPHEADER => ['content-type: application/json', 'x-api-key: '.$config['ai_api_key'], 'anthropic-version: 2023-06-01'],
  CURLOPT_POSTFIELDS => json_encode(['model' => $config['ai_model'], 'max_tokens' => (int)$config['ai_max_tokens'], 'system' => $system, 'messages' => $messages])]);
$raw = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
if ($raw === false || $code >= 400) out(502, ['error' => 'AI provider error']);
$res = json_decode($raw, true); $text = '';
foreach (($res['content'] ?? []) as $block) if (($block['type'] ?? '') === 'text') $text .= $block['text'];
if (!preg_match('/\{.*\}/s', $text, $j)) out(502, ['error' => 'Unreadable AI answer']);
$data = json_decode($j[0], true);
if (!is_array($data)) out(502, ['error' => 'Unreadable AI answer']);
out(200, $data);
