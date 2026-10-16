<?php
// AURA Forma server settings. Secrets never live in Git: put them in forma-secrets.php (same folder,
// gitignored, uploaded by hand) or in environment variables. Everything stays off until configured.
$secrets = is_file(__DIR__.'/forma-secrets.php') ? require __DIR__.'/forma-secrets.php' : [];
return array_merge([
 // AI (text commands + image reading). Provider: Anthropic Messages API.
 'ai_enabled' => false,
 'ai_api_key' => getenv('AURA_AI_KEY') ?: '',
 'ai_model' => 'claude-sonnet-5-5',
 'ai_max_tokens' => 1600,
 'ai_rate_per_10min' => 30,
 // Designer hand-off. Leave disabled until privacy notice, recipient and mail delivery are verified.
 'submit_enabled' => false,
 'submit_recipient' => '',
 'submit_sender' => '',
 'submit_store_dir' => '',   // absolute path OUTSIDE public_html, e.g. /home/user/aura-projects
 'submit_max_mb' => 25,
], is_array($secrets) ? $secrets : []);
