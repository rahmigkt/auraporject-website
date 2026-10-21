<?php
declare(strict_types=1);

/** Reserve a slot under one lock. Storage failure must never permit a request. */
function forma_rate_slot(string $path, int $limit): bool {
    if ($limit <= 0) return false;
    // A separate lock keeps the same inode locked while the counter is atomically replaced.
    $lock = @fopen($path.'.lock', 'c');
    if ($lock === false) throw new RuntimeException('Rate limit storage unavailable');
    $temporary = null;
    try {
        if (!flock($lock, LOCK_EX)) throw new RuntimeException('Rate limit lock unavailable');
        clearstatcache(true, $path);
        $count = 0;
        if (file_exists($path)) {
            $raw = @file_get_contents($path);
            if ($raw === false || !preg_match('/\A[0-9]+\z/D', $raw)) throw new RuntimeException('Invalid rate limit counter');
            // Compare as a float first so even an oversized existing counter remains denied.
            if ((float)$raw >= $limit) return false;
            $count = (int)$raw;
        }
        $next = (string)($count + 1);
        $temporary = @tempnam(dirname($path), '.aura-rate-');
        if ($temporary === false) throw new RuntimeException('Rate limit storage unavailable');
        if (@file_put_contents($temporary, $next) !== strlen($next) || !@rename($temporary, $path)) {
            throw new RuntimeException('Could not persist rate limit counter');
        }
        $temporary = null;
        return true;
    } finally {
        if (is_string($temporary)) @unlink($temporary);
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}
