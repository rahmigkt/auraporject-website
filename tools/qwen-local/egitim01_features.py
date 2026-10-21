"""Text-only EGITIM-01 validation and assistant-payload loss masks.

No model framework is imported. Local tokenizer/template files are the only
model artifacts read. GPU and CPU use the same rendered text and feature code.
"""
from pathlib import Path
import hashlib
import json
import re

START = '<|im_start|>'
END = '<|im_end|>'
EMPTY_THINK = '<think>\n\n</think>\n\n'
SEGMENT = re.compile(r'<\|im_start\|>(system|user|assistant)\n(.*?)<\|im_end\|>\n?', re.S)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def _unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f'Duplicate JSON key: {key}')
        result[key] = value
    return result


def _bad_constant(value):
    raise ValueError(f'Non-finite JSON constant: {value}')


def normalize_messages(row):
    """Coalesce leading system messages; keep every instruction and state text."""
    messages = row.get('messages')
    if not isinstance(messages, list) or not messages:
        raise ValueError('Expected nonempty EGITIM-01 messages')
    result = []
    for message in messages:
        if not isinstance(message, dict) or set(message) != {'role', 'content'}:
            raise ValueError('Each message needs exactly role and content')
        role, content = message['role'], message['content']
        if role not in {'system', 'user', 'assistant'} or not isinstance(content, str):
            raise ValueError('Only text system/user/assistant messages are supported')
        if any(marker in content for marker in [START, END, '<think>', '</think>']):
            raise ValueError('Reserved chat control markup in message content')
        content = content.strip()  # Matches the saved Qwen template's trim filter.
        if role == 'assistant':
            target = json.loads(content, object_pairs_hook=_unique_object, parse_constant=_bad_constant)
            if not isinstance(target, dict) or set(target) != {'reply', 'actions'}:
                raise ValueError('Assistant content must be exactly {reply, actions}')
            if not isinstance(target['reply'], str) or not isinstance(target['actions'], list):
                raise ValueError('reply must be text and actions must be a list')
            for action in target['actions']:
                if not isinstance(action, dict) or not isinstance(action.get('type'), str):
                    raise ValueError('Each native action needs its type')
                if action.get('katman') not in {'ev', 'yerlesim', 'tekstil', 'aydinlatma', 'proje'}:
                    raise ValueError('Unsupported home-project action layer')
        if role == 'system' and result:
            if len(result) != 1 or result[0]['role'] != 'system':
                raise ValueError('System messages may occur only at the beginning')
            result[0]['content'] += '\n\n' + content
        else:
            result.append({'role': role, 'content': content})
    dialogue = [m for m in result if m['role'] != 'system']
    if not dialogue or dialogue[0]['role'] != 'user' or dialogue[-1]['role'] != 'assistant':
        raise ValueError('Expected a user-led conversation ending in an assistant target')
    return result


def load_splits(directory):
    directory = Path(directory)
    splits, hashes, seen = {}, {}, set()
    for name in ['train', 'dev']:
        path = directory / (name + '.jsonl')
        raw = path.read_bytes()
        hashes[path.name] = sha(raw)
        rows = [json.loads(line) for line in raw.decode('utf8').splitlines() if line.strip()]
        for row in rows:
            identifier = row.get('id')
            if not isinstance(identifier, str) or not identifier or identifier in seen:
                raise ValueError('Missing/duplicate ID or train/dev overlap')
            seen.add(identifier)
            normalize_messages(row)
        splits[name] = rows
    if not splits['train']:
        raise ValueError('No compiled training rows; run tools/egitim/derle.mjs first')
    report_path = directory / 'rapor.json'
    if report_path.exists():
        raw = report_path.read_bytes()
        report = json.loads(raw)
        hashes[report_path.name] = sha(raw)
        if any(report.get(k) != len(splits[k]) for k in ['train', 'dev']):
            raise ValueError('Compiler report count mismatch')
        if report.get('alinan') != len(seen):
            raise ValueError('Compiler total count mismatch')
    return splits, hashes


class LocalTextTokenizer:
    def __init__(self, directory):
        # Imports remain optional for ordinary format validation and unit tests.
        from tokenizers import Tokenizer
        from jinja2.sandbox import ImmutableSandboxedEnvironment
        from importlib.metadata import version
        self.package_versions = {name: version(name) for name in ['tokenizers', 'Jinja2']}
        directory = Path(directory)
        names = ['tokenizer.json', 'tokenizer_config.json', 'chat_template.jinja']
        raw = {name: (directory / name).read_bytes() for name in names}
        self.file_hashes = {name: sha(data) for name, data in raw.items()}
        config = json.loads(raw['tokenizer_config.json'])
        self.eos_token = config.get('eos_token')
        if isinstance(self.eos_token, dict):
            self.eos_token = self.eos_token['content']
        if self.eos_token != END:
            raise ValueError('Expected the Qwen im_start/im_end chat contract')
        self.backend = Tokenizer.from_file(str(directory / 'tokenizer.json'))
        if self.backend.token_to_id(START) is None or self.backend.token_to_id(END) is None:
            raise ValueError('Missing Qwen chat control tokens')
        environment = ImmutableSandboxedEnvironment(trim_blocks=True, lstrip_blocks=True,
                                                     extensions=['jinja2.ext.loopcontrols'])
        environment.globals['raise_exception'] = lambda text: (_ for _ in ()).throw(ValueError(text))
        environment.filters['tojson'] = lambda value, **kwargs: json.dumps(value, ensure_ascii=False, **kwargs)
        self.template = environment.from_string(raw['chat_template.jinja'].decode('utf8'))

    def render(self, messages):
        return self.template.render(messages=messages, add_generation_prompt=False,
                                    enable_thinking=False, add_vision_id=False, tools=None,
                                    eos_token=self.eos_token, bos_token='')


def assistant_spans(rendered, messages):
    """Locate payload+EOS spans; headers, empty thinking and prompts stay masked."""
    matches = list(SEGMENT.finditer(rendered))
    if len(matches) != len(messages):
        raise ValueError('Chat template produced an unexpected number of turns')
    spans, cursor = [], 0
    for match, message in zip(matches, messages):
        if match.start() != cursor or match[1] != message['role']:
            raise ValueError('Chat template changed role boundaries')
        cursor = match.end()
        body, payload_start = match[2], match.start(2)
        if message['role'] == 'assistant' and body.startswith(EMPTY_THINK):
            body = body[len(EMPTY_THINK):]
            payload_start += len(EMPTY_THINK)
        if body != message['content']:
            raise ValueError('Chat template changed message payload')
        if message['role'] == 'assistant':
            spans.append((payload_start, match.end(2) + len(END)))
    if cursor != len(rendered) or not spans:
        raise ValueError('Unparsed chat template text or no assistant payload')
    return spans


def mask_tokens(ids, offsets, spans):
    if len(ids) != len(offsets):
        raise ValueError('Token IDs and offsets are not aligned')
    labels, counts = [], [0] * len(spans)
    for token, (start, end) in zip(ids, offsets):
        turn = next((i for i, (lo, hi) in enumerate(spans) if lo <= start < end <= hi), None)
        if turn is None:
            if start < end and any(start < hi and end > lo for lo, hi in spans):
                raise ValueError('Token crosses prompt/assistant boundary')
            labels.append(-100)
        else:
            labels.append(token)
            counts[turn] += 1
    if not counts or not all(counts):
        raise ValueError('An assistant turn has no supervised tokens')
    return {'input_ids': list(ids), 'attention_mask': [1] * len(ids), 'labels': labels}, counts


def prepare_features(tokenizer, rows, max_length, allow_overflow=False):
    features, audits = [], []
    for row in rows:
        messages = normalize_messages(row)
        rendered = tokenizer.render(messages)
        spans = assistant_spans(rendered, messages)
        encoded = tokenizer.backend.encode(rendered, add_special_tokens=False)
        feature, counts = mask_tokens(encoded.ids, encoded.offsets, spans)
        supervised = [token for token, label in zip(encoded.ids, feature['labels']) if label != -100]
        expected = ''.join(rendered[lo:hi] for lo, hi in spans)
        decoded = tokenizer.backend.decode(supervised, skip_special_tokens=False)
        if decoded != expected:
            raise ValueError('Supervised token decode differs from assistant payloads+EOS')
        within_context = len(encoded.ids) <= max_length
        if not within_context and not allow_overflow:
            raise ValueError(f'Context exceeded for {row["id"]}: {len(encoded.ids)} > {max_length}; no truncation')
        features.append(feature)
        audits.append({'id': row['id'], 'tokens': len(encoded.ids), 'assistant_turns': len(spans),
                       'supervised_tokens': len(supervised), 'supervised_tokens_by_turn': counts,
                       'masked_tokens': len(encoded.ids) - len(supervised), 'within_context': within_context,
                       'leading_system_messages_coalesced': len(row['messages']) - len(messages),
                       'rendered_sha256': sha(rendered.encode()), 'assistant_payloads_sha256': sha(expected.encode()),
                       'decoded_targets_match': True, 'prompt_tokens_supervised': 0, 'truncated': False})
    return features, audits
