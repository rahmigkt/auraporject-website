"""Verify the complete receipt against unchanged original bytes and every row."""
import gzip
import hashlib
import json
from pathlib import Path

directory = Path('knowledge/ai-egitim/inceleme')
summary = json.loads((directory/'C7-yerlesim-yapisal-tarama.json').read_text(encoding='utf8'))
receipt_path = Path(summary['receipt'])
assert hashlib.sha256(receipt_path.read_bytes()).hexdigest() == summary['receipt_sha256']
total = 0
with gzip.open(receipt_path, 'rt', encoding='utf8') as receipt:
    for source in summary['files']:
        source_path = Path(source['file'])
        assert hashlib.sha256(source_path.read_bytes()).hexdigest() == source['compressed_source_sha256']
        ids = set()
        with gzip.open(source_path, 'rt', encoding='utf8') as stream:
            for line_no, line in enumerate(stream, 1):
                row = json.loads(line)
                record = json.loads(next(receipt))
                assert record['file'] == source_path.as_posix() and record['line'] == line_no
                assert record['id'] == row['id'] and row['id'] not in ids
                ids.add(row['id'])
                canonical = json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()
                assert record['row_sha256'] == hashlib.sha256(canonical).hexdigest()
                assert record['training_approved'] is False and record['manual_review_not_asserted_by_tool'] is True
                total += 1
        assert len(ids) == source['counts']['rows']
    assert next(receipt, None) is None
assert total == 17167
print('PASS gzip receipt integrity;17167 source/row hashes and IDs bound;source fingerprints unchanged;zero approvals')
