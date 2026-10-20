<?php
declare(strict_types=1);
// Run only the checked-in command prompt assignments, never the endpoint or a model answer.
$input = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
$source = file_get_contents(__DIR__.'/../../api/forma-ai.php');
$command = strpos($source, "if (\$action === 'command')");
if ($command === false) throw new RuntimeException('Command branch changed; review required');
$start = strpos($source, '  $system =', $command);
if ($start === false) throw new RuntimeException('Command prompt missing; review required');
$end = strpos($source, '  $maxTokens = 600;', $start);
if ($start === false || $end === false) throw new RuntimeException('Command prompt boundary changed; review required');
$batch = array_is_list($input);
$answers = [];
foreach ($batch ? $input : [$input] as $in) {
$family = preg_replace('/[^a-z]/', '', (string)$in['design']['family']);
$lang = preg_replace('/[^a-z]/', '', (string)$in['lang']);
$vocab = json_encode($in['vocabulary'], JSON_UNESCAPED_UNICODE);
$design = json_encode($in['design'], JSON_UNESCAPED_UNICODE);
$text = mb_substr((string)$in['text'], 0, 600);
// Trusted repository PHP only. No credentials, networking, endpoint side effects or generated code.
eval(substr($source, $start, $end - $start));
$answers[] = ['messages'=>array_merge([['role'=>'system','content'=>$system]], $messages)];
}
echo json_encode($batch ? $answers : $answers[0], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
