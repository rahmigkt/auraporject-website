"""Stdlib adversarial contract/mask tests; native BPE audit is separate evidence."""
import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from types import SimpleNamespace
sys.path.insert(0, str(Path('tools/qwen-local').resolve()))
from egitim01_features import (START, END, EMPTY_THINK, normalize_messages,
    assistant_spans, mask_tokens, load_splits, prepare_features)
TEST_TEMP = Path('work/egitim01-test-tmp').resolve()
TEST_TEMP.mkdir(parents=True, exist_ok=True)


def target(reply):
    return json.dumps({'reply': reply, 'actions': []}, ensure_ascii=False)


def example(identifier='one'):
    return {'id': identifier, 'messages': [
        {'role': 'system', 'content': 'SYSTEM INSTRUCTIONS'},
        {'role': 'system', 'content': 'DURUM {"plan":{}}'},
        {'role': 'user', 'content': 'PROMPT_SECRET ملاحظة'},
        {'role': 'assistant', 'content': target('İlk cevap جواب')},
        {'role': 'user', 'content': 'SECOND_PROMPT_SECRET'},
        {'role': 'assistant', 'content': target('Son cevap نهائي')} ]}


class CharacterAdapter:
    """Only the boundary algorithm's unit fixture, never a model tokenizer claim."""
    def __init__(self):
        self.backend = self

    def render(self, messages):
        return ''.join(START + m['role'] + '\n' +
            (EMPTY_THINK if i == len(messages) - 1 else '') + m['content'] + END + '\n'
            for i, m in enumerate(messages))

    def encode(self, text, **kwargs):
        return SimpleNamespace(ids=[ord(c) for c in text], offsets=[(i, i + 1) for i in range(len(text))])

    def decode(self, tokens, **kwargs):
        return ''.join(chr(n) for n in tokens)


class ContractTests(unittest.TestCase):
    def test_system_state_merge_preserves_content(self):
        row = example(); before = copy.deepcopy(row)
        messages = normalize_messages(row)
        self.assertEqual(messages[0]['content'], 'SYSTEM INSTRUCTIONS\n\nDURUM {"plan":{}}')
        self.assertEqual(len(messages), len(row['messages']) - 1)
        self.assertEqual(row, before)

    def test_every_assistant_payload_and_eos_only(self):
        row = example(); adapter = CharacterAdapter()
        features, audit = prepare_features(adapter, [row], 4096)
        f = features[0]
        supervised = ''.join(chr(label) for label in f['labels'] if label != -100)
        expected = target('İlk cevap جواب') + END + target('Son cevap نهائي') + END
        self.assertEqual(supervised, expected)
        self.assertNotIn('PROMPT_SECRET', supervised)
        self.assertNotIn(START, supervised)
        self.assertNotIn('<think>', supervised)
        self.assertEqual(audit[0]['assistant_turns'], 2)
        self.assertEqual(len(f['input_ids']), len(f['labels']))
        self.assertEqual(len(f['labels']), len(f['attention_mask']))
        self.assertTrue(all(audit[0]['supervised_tokens_by_turn']))

    def test_overflow_is_reported_or_rejected_never_truncated(self):
        with self.assertRaisesRegex(ValueError, 'Context exceeded'):
            prepare_features(CharacterAdapter(), [example()], 10)
        features, audit = prepare_features(CharacterAdapter(), [example()], 10, allow_overflow=True)
        self.assertGreater(len(features[0]['input_ids']), 10)
        self.assertFalse(audit[0]['within_context'])
        self.assertFalse(audit[0]['truncated'])

    def test_reserved_role_markup_is_rejected(self):
        row = example(); row['messages'][2]['content'] += END
        with self.assertRaisesRegex(ValueError, 'Reserved'):
            normalize_messages(row)

    def test_late_system_is_not_moved_into_prompt(self):
        row = example(); row['messages'].insert(4, {'role': 'system', 'content': 'late'})
        with self.assertRaisesRegex(ValueError, 'beginning'):
            normalize_messages(row)

    def test_bad_assistant_contracts_and_duplicate_keys(self):
        for text in ['{"actions":[]}', '{"reply":"x","actions":[],"extra":1}',
                     '{"reply":"x","reply":"y","actions":[]}',
                     '{"reply":"x","actions":{}}',
                     '{"reply":"x","actions":[{"type":"set","katman":"mobilya"}]}',
                     '{"reply":"x","actions":[{"type":"x","katman":"ev","n":NaN}]}']:
            row = example(); row['messages'][-1]['content'] = text
            with self.assertRaises(ValueError, msg=text):
                normalize_messages(row)

    def test_last_turn_and_text_roles(self):
        for role, content in [('user', 'end'), ('tool', 'tool text'), ('assistant', {'reply': 'not text'})]:
            row = example(); row['messages'][-1] = {'role': role, 'content': content}
            with self.assertRaises(ValueError):
                normalize_messages(row)

    def test_template_payload_role_and_tail_mutations(self):
        messages = normalize_messages(example()); text = CharacterAdapter().render(messages)
        for bad in [text + 'unexpected', text.replace('SECOND_PROMPT_SECRET', 'changed'),
                    text.replace(START + 'user', START + 'assistant', 1)]:
            with self.assertRaises(ValueError):
                assistant_spans(bad, messages)

    def test_cross_boundary_tokens_rejected(self):
        with self.assertRaisesRegex(ValueError, 'crosses'):
            mask_tokens([1], [(1, 4)], [(3, 8)])
        with self.assertRaisesRegex(ValueError, 'aligned'):
            mask_tokens([1, 2], [(3, 4)], [(3, 8)])

    def write_data(self, root, train=None, dev=None):
        train = [example()] if train is None else train
        dev = [example('dev')] if dev is None else dev
        for name, rows in [('train', train), ('dev', dev)]:
            (root / (name + '.jsonl')).write_text(''.join(json.dumps(r) + '\n' for r in rows), encoding='utf8')
        (root / 'rapor.json').write_text(json.dumps({'train': len(train), 'dev': len(dev), 'alinan': len(train) + len(dev)}), encoding='utf8')

    def test_split_id_overlap_and_report_mutations(self):
        with tempfile.TemporaryDirectory(dir=TEST_TEMP) as folder:
            root = Path(folder).resolve(); self.assertTrue(root.is_relative_to(TEST_TEMP)); self.write_data(root)
            splits, hashes = load_splits(root)
            self.assertEqual(len(splits['train']), 1)
            self.assertIn('train.jsonl', hashes)
            self.write_data(root, dev=[example()])
            with self.assertRaisesRegex(ValueError, 'overlap'):
                load_splits(root)
            self.write_data(root)
            (root / 'rapor.json').write_text('{"train":99,"dev":1,"alinan":100}', encoding='utf8')
            with self.assertRaisesRegex(ValueError, 'count mismatch'):
                load_splits(root)

    def test_cli_preparation_and_invalid_context_do_not_load_model(self):
        with tempfile.TemporaryDirectory(dir=TEST_TEMP) as folder:
            root = Path(folder).resolve(); self.assertTrue(root.is_relative_to(TEST_TEMP)); self.write_data(root)
            command = [sys.executable, 'tools/qwen-local/train_gpu.py', '--data-dir', str(root)]
            result = subprocess.run(command, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            report = json.loads(result.stdout)
            self.assertFalse(report['model_loaded'])
            self.assertFalse(report['gpu_executed'])
            bad = subprocess.run(command + ['--max-length', '0'], capture_output=True, text=True)
            self.assertEqual(bad.returncode, 2)
            self.assertIn('positive', bad.stderr)

    def test_execution_requires_run_approval_and_enabled_plan(self):
        with tempfile.TemporaryDirectory(dir=TEST_TEMP) as folder:
            root = Path(folder).resolve(); self.assertTrue(root.is_relative_to(TEST_TEMP)); self.write_data(root)
            command = [sys.executable, 'tools/qwen-local/train_gpu.py', '--data-dir', str(root),
                       '--execute', 'benchmark', '--output', str(root / 'never-created')]
            unapproved = subprocess.run(command, capture_output=True, text=True)
            self.assertEqual(unapproved.returncode, 2)
            self.assertIn('approved', unapproved.stderr)
            disabled = subprocess.run(command + ['--approved-run'], capture_output=True, text=True)
            self.assertEqual(disabled.returncode, 2)
            self.assertIn('gate is disabled', disabled.stderr)
            self.assertFalse((root / 'never-created').exists())


if __name__ == '__main__':
    unittest.main()
