"""Recovered evidence is immutable; no model or network is needed."""
import hashlib
import json
from pathlib import Path

for manifest, key in [
    ('knowledge/ai-egitim/toparlama-01/archive-manifest.json', None),
    ('knowledge/ai-egitim/qwen-pilot-01/RECOVERY.json', 'files'),
]:
    value = json.loads(Path(manifest).read_text(encoding='utf-8'))
    rows = value[key] if key else value
    assert rows
    for row in rows:
        path = Path(row['path'])
        assert path.is_relative_to('knowledge/ai-egitim')
        assert hashlib.sha256(path.read_bytes()).hexdigest() == row['sha256'], path
        assert row['status'] == 'superseded'
        if key:
            assert path.suffix in ('.json', '.jsonl', '.html')
print('PASS immutable conflict archive and lightweight pilot recovery hashes')
