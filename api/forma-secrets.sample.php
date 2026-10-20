<?php
// Copy to forma-secrets.php on the server (never commit it) and fill in.
return [
 // AI (Anthropic API key with a monthly spend limit set in the Anthropic console)
 'ai_enabled' => true,
 'ai_api_key' => 'sk-ant-...',
 // Designer hand-off: mailbox created in the hosting panel; package folder OUTSIDE public_html
 'submit_enabled' => true,
 'submit_recipient' => 'design@auraproject.com.tr',   // Aster Mail alias (same inbox as info@)
 'submit_sender' => 'info@auraproject.com.tr',      // PHP mail() leaves from the Natro server: its IP must be in the SPF record
 'submit_store_dir' => '/home/HESAP/aura-projeler',
 'submit_secret' => 'EN-AZ-24-KARAKTERLIK-RASTGELE-METIN',
];
