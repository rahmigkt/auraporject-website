<?php
declare(strict_types=1);
// Thin, bounded proxy between the Forma studio and the AI provider. The model never executes anything:
// it only returns JSON that the browser validates against the design vocabulary before applying.
// Cost control: local parsing first (in the browser), a fast small model for commands, a larger one only for
// images, per-address rate limit and a daily cap.
$config = require __DIR__.'/forma-config.php';
header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); header('X-Content-Type-Options: nosniff');
function out(int $status, array $body): void { http_response_code($status); echo json_encode($body, JSON_UNESCAPED_UNICODE); exit; }
$qwen = ($config['ai_provider'] ?? 'anthropic') === 'qwen';
$ready = $config['ai_enabled'] && function_exists('curl_init') && ($qwen ? $config['qwen_url'] !== '' : $config['ai_api_key'] !== '');
$action = $_GET['action'] ?? '';
if ($action === 'health') out(200, ['available' => $ready, 'vision' => $ready && !empty($config['ai_vision'])]);
if (!$ready) out(503, ['error' => 'AI service is not configured']);
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(405, ['error' => 'Method not allowed']);
$origin = $_SERVER['HTTP_ORIGIN'] ?? ''; $host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== explode(':', $host)[0]) out(403, ['error' => 'Origin not allowed']);
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 6_000_000) out(413, ['error' => 'Request too large']);

// Rate limit per client address (hashed) and a site-wide daily cap; file-based for shared hosting.
$tmp = sys_get_temp_dir();
$bucket = $tmp.'/aura-forma-'.hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '').date('YmdH').intdiv((int)date('i'), 10));
$count = is_file($bucket) ? (int)file_get_contents($bucket) : 0;
if ($count >= (int)$config['ai_rate_per_10min']) out(429, ['error' => 'Too many requests']);
file_put_contents($bucket, (string)($count + 1));
$day = $tmp.'/aura-forma-day-'.date('Ymd');
$daily = is_file($day) ? (int)file_get_contents($day) : 0;
if ($daily >= (int)$config['ai_daily_limit']) out(429, ['error' => 'Daily limit reached']);
file_put_contents($day, (string)($daily + 1));

$in = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($in)) out(400, ['error' => 'Invalid JSON']);
$vocab = json_encode($in['vocabulary'] ?? [], JSON_UNESCAPED_UNICODE);
$lang = preg_replace('/[^a-z]/', '', (string)($in['lang'] ?? 'en'));
$model = $qwen ? $config['qwen_model'] : $config['ai_model'];

if ($action === 'command') {
  $text = mb_substr((string)($in['text'] ?? ''), 0, 600);
  $design = json_encode($in['design'] ?? [], JSON_UNESCAPED_UNICODE);
  $family = preg_replace('/[^a-z]/', '', (string)($in['design']['family'] ?? 'seating'));
  $system = "You edit a parametric furniture design (family: $family) in a design studio. Units: millimetres and degrees. "
    ."The customer may write in any language. Answer ONLY with JSON: {\"actions\":[...], \"reply\":\"short confirmation in the customer's language ($lang)\"}. "
    ."Action forms: {\"type\":\"set\"|\"delta\",\"key\":PARAM,\"value\":NUMBER} · {\"type\":\"enum\",\"key\":ENUM,\"value\":OPTION} · "
    ."{\"type\":\"material\",\"slot\":SLOT,\"key\":KEY,\"value\":OPTION} · {\"type\":\"style\",\"value\":STYLE} · {\"type\":\"kind\",\"value\":KIND}. "
    ."Rules: use only keys and options from this vocabulary: $vocab. Convert units (cm, m, '1.80', 'bir seksen') to millimetres. "
    ."Relative wishes ('a bit', 'biraz') are small deltas (20-50 mm). NEVER apply something the customer refuses ('olmasın', 'istemiyorum', 'not', 'no', 'without'): "
    ."a refusal alone gives no action unless the customer also names what they want instead. If the request is unclear, impossible with the vocabulary, "
    ."or not about the design, return no actions and ask one short question in reply. Never invent keys or options.";
  $messages = [['role' => 'user', 'content' => "Current design: $design\nRequest: $text"]];
  $maxTokens = 600;
} elseif ($action === 'vision') {
  if (empty($config['ai_vision'])) out(503, ['error' => 'Image reading is off']);
  $model = $qwen ? $config['qwen_model'] : $config['ai_model_vision'];
  $img = (string)($in['image'] ?? '');
  if (!preg_match('#^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$#', $img, $m)) out(400, ['error' => 'Unsupported image']);
  if (strlen($m[2]) > 5_500_000) out(413, ['error' => 'Image too large']);
  $system = "You read a photo or sketch of a seating piece (sofa, loveseat, armchair) and describe it ONLY with this parametric vocabulary: $vocab. "
    ."Analyse parts the way an upholsterer would: arms, back, seat cushions, base and legs. Estimate millimetre dimensions from ergonomic norms when no scale is visible "
    ."and list only truly measurable dimensions in \"measured\". Do not name designers, brands or products. Do not invent parts you cannot see. "
    ."Answer ONLY with JSON: {\"design\":{\"kind\":KIND,\"style\":STYLE,\"params\":{...},\"materials\":{\"fabric\":{...},\"wood\":{...},\"metal\":{...}},\"measured\":[],\"confidence\":0..1,\"notes\":\"short, in $lang\"}}";
  $messages = [['role' => 'user', 'content' => [
    ['type' => 'image', 'source' => ['type' => 'base64', 'media_type' => $m[1], 'data' => $m[2]]],
    ['type' => 'text', 'text' => 'Describe this piece as a design in the vocabulary.']
  ]]];
  $maxTokens = 1600;
} else out(400, ['error' => 'Unknown action']);

if ($qwen) {
  // Own server: Qwen behind an OpenAI-compatible endpoint (vLLM), reached over HTTPS with a bearer token.
  $omsg = [['role' => 'system', 'content' => $system]];
  foreach ($messages as $mm0) {
    if (is_string($mm0['content'])) { $omsg[] = ['role' => 'user', 'content' => $mm0['content']]; continue; }
    $parts = [];
    foreach ($mm0['content'] as $c) $parts[] = $c['type'] === 'image' ? ['type' => 'image_url', 'image_url' => ['url' => 'data:'.$c['source']['media_type'].';base64,'.$c['source']['data']]] : ['type' => 'text', 'text' => $c['text']];
    $omsg[] = ['role' => 'user', 'content' => $parts];
  }
  $ch = curl_init(rtrim($config['qwen_url'], '/').'/v1/chat/completions');
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_TIMEOUT => 45,
    CURLOPT_HTTPHEADER => ['content-type: application/json', 'authorization: Bearer '.$config['qwen_token']],
    CURLOPT_POSTFIELDS => json_encode(['model' => $model, 'max_tokens' => $maxTokens, 'temperature' => 0.2, 'messages' => $omsg, 'response_format' => ['type' => 'json_object'], 'chat_template_kwargs' => ['enable_thinking' => false]])]);
  $res = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  if ($res === false || $code >= 400) out(502, ['error' => 'AI server error']);
  $j = json_decode($res, true);
  $text = (string)($j['choices'][0]['message']['content'] ?? '');
} else {
  $ch = curl_init('https://api.anthropic.com/v1/messages');
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_TIMEOUT => 45,
    CURLOPT_HTTPHEADER => ['content-type: application/json', 'x-api-key: '.$config['ai_api_key'], 'anthropic-version: 2023-06-01'],
    CURLOPT_POSTFIELDS => json_encode(['model' => $model, 'max_tokens' => $maxTokens, 'system' => $system, 'messages' => $messages])]);
  $res = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  if ($res === false || $code >= 400) out(502, ['error' => 'AI provider error']);
  $j = json_decode($res, true);
  $text = '';
  foreach (($j['content'] ?? []) as $c) if (($c['type'] ?? '') === 'text') $text .= $c['text'];
}
if (!preg_match('/\{[\s\S]*\}/', $text, $mm)) out(502, ['error' => 'No JSON in answer']);
$data = json_decode($mm[0], true);
if (!is_array($data)) out(502, ['error' => 'Invalid JSON in answer']);
out(200, $data);
