<?php
// AURA Forma server settings. Secrets never live in Git: put them in forma-secrets.php (same folder,
// gitignored, uploaded by hand) or in environment variables. Everything stays off until configured.
$secrets = is_file(__DIR__.'/forma-secrets.php') ? require __DIR__.'/forma-secrets.php' : [];
return array_merge([
 // AI (text commands + image reading). Provider: Anthropic Messages API.
 'ai_enabled' => false,
 'ai_api_key' => getenv('AURA_AI_KEY') ?: '',
 'ai_model' => 'claude-haiku-5-5',          // commands: fast and low cost
 'ai_model_vision' => 'claude-sonnet-5-5',   // photo / sketch reading: stronger model, used rarely
 'ai_vision' => true,
 'ai_rate_per_10min' => 30,                   // per visitor address
 'ai_daily_limit' => 1500,                    // whole site per day (cost ceiling)
 // Designer hand-off. Leave disabled until privacy notice, recipient and mail delivery are verified.
 'submit_enabled' => false,
 'submit_recipient' => '',
 'submit_sender' => '',
 'submit_store_dir' => '',   // absolute path OUTSIDE public_html, e.g. /home/user/aura-projects
 'submit_max_mb' => 25,
 'submit_secret' => getenv('AURA_SUBMIT_SECRET') ?: '',  // long random text; signs the designer's download links
 'submit_link_days' => 60,
 'submit_customer_copy' => true,  // short confirmation to the customer (link to the design, no attachment)
], is_array($secrets) ? $secrets : []);
