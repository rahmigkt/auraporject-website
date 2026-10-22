<?php
declare(strict_types=1);
// Local temporary counters only. Never load a provider, secret config, mailer or real endpoint.
require_once __DIR__.'/../api/forma-rate-limit.php';

if (($argv[1] ?? '') === 'worker') {
    $deadline = microtime(true) + 15;
    while (!is_file($argv[4])) {
        if (microtime(true) > $deadline) exit(9);
        usleep(1000);
    }
    $accepted = 0;
    for ($i = 0; $i < 4; $i++) if (forma_rate_slot($argv[2], (int)$argv[3])) $accepted++;
    echo $accepted;
    exit;
}
function check(bool $ok, string $message): void { if (!$ok) throw new RuntimeException($message); }
function storageFails(callable $run): void {
    try { $run(); } catch (RuntimeException $e) { return; }
    throw new RuntimeException('Storage failure permitted a request');
}
$root = __DIR__.'/../work/rate-check-'.bin2hex(random_bytes(6));
check(mkdir($root, 0700, true), 'Create local test directory');
$checks = 0;
foreach ([1, 5, 7] as $limit) {
    $path = "$root/parallel-$limit"; $gate = "$path.go"; $jobs = [];
    for ($i = 0; $i < 4; $i++) {
        $process = proc_open([PHP_BINARY, __FILE__, 'worker', $path, (string)$limit, $gate],
            [0=>['pipe','r'], 1=>['pipe','w'], 2=>['pipe','w']], $pipes, null, null, ['bypass_shell'=>true]);
        check(is_resource($process), 'Start local counter worker'); fclose($pipes[0]);
        $jobs[] = [$process, $pipes];
    }
    file_put_contents($gate, 'go'); $accepted = 0;
    foreach ($jobs as [$process, $pipes]) {
        $out = stream_get_contents($pipes[1]); $errors = stream_get_contents($pipes[2]);
        fclose($pipes[1]); fclose($pipes[2]);
        check(proc_close($process) === 0 && $errors === '' && ctype_digit($out), 'Worker failed: '.$errors);
        $accepted += (int)$out;
    }
    check($accepted === $limit, "Concurrent limit $limit admitted $accepted of16");
    check(file_get_contents($path) === (string)$limit, 'Counter matches accepted reservations');
    check(!forma_rate_slot($path, $limit), 'Full bucket stays denied');
    echo "PASS 16 concurrent attempts: limit=$limit accepted=$accepted\n"; $checks++;
}
$path = "$root/sequential";
check(forma_rate_slot($path, 2) && forma_rate_slot($path, 2) && !forma_rate_slot($path, 2), 'Sequential boundary'); $checks++;
file_put_contents("$root/existing", '4');
check(forma_rate_slot("$root/existing", 5) && !forma_rate_slot("$root/existing", 5), 'Existing counter compatibility'); $checks++;
check(!forma_rate_slot("$root/disabled", 0) && !file_exists("$root/disabled"), 'Disabled limit'); $checks++;
foreach (['', 'broken', '-1', '1.5'] as $invalid) {
    file_put_contents("$root/invalid", $invalid);
    storageFails(fn()=>forma_rate_slot("$root/invalid", 5));
    check(file_get_contents("$root/invalid") === $invalid, 'Do not reset corrupt counter'); $checks++;
}
file_put_contents("$root/huge", str_repeat('9', 40));
check(!forma_rate_slot("$root/huge", 5), 'Oversized counter denied'); $checks++;
storageFails(fn()=>forma_rate_slot("$root/missing/counter", 5)); $checks++;
mkdir("$root/directory-counter");
storageFails(fn()=>forma_rate_slot("$root/directory-counter", 5)); $checks++;

// Execute only the real reservation blocks with local paths; stop before JSON/provider/mail code.
class LocalRateResponse extends Exception {}
function out(int $status, array $body): void { throw new LocalRateResponse((string)$status); }
foreach (['forma-ai.php', 'forma-submit.php'] as $endpoint) {
    $source = file_get_contents(__DIR__.'/../api/'.$endpoint);
    check(preg_match('/try \{\s*if \(!forma_rate_slot[\s\S]*?catch \(RuntimeException \$e\) \{ out\(503[^\n]+/', $source, $match) === 1, 'Locate real endpoint reservation block');
    $block = $match[0]; $bucket = "$root/$endpoint-client"; $day = "$root/$endpoint-day";
    $config = ['ai_rate_per_10min'=>1, 'ai_daily_limit'=>1];
    if ($endpoint === 'forma-submit.php') file_put_contents($bucket, '4');
    eval($block); // First local reservation succeeds.
    try { eval($block); throw new RuntimeException('Quota should reject'); }
    catch (LocalRateResponse $e) { check($e->getMessage() === '429', 'Quota maps to429'); }
    file_put_contents($bucket, 'corrupt');
    try { eval($block); throw new RuntimeException('Corrupt storage should reject'); }
    catch (LocalRateResponse $e) { check($e->getMessage() === '503', 'Storage failure maps to503'); }
    if ($endpoint === 'forma-ai.php') {
        $bucket = "$root/another-client";
        try { eval($block); throw new RuntimeException('Daily quota should reject'); }
        catch (LocalRateResponse $e) { check($e->getMessage() === '429', 'Daily quota maps to429'); }
        check(file_get_contents($day) === '1', 'Denied daily quota stays capped');
    }
    $checks++;
}
echo "PASS $checks local rate-limit scenarios; no provider or mail calls\n";
