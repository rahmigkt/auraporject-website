"""Cached parent modules must resolve a changed child to its new content URL."""
import importlib.util
import json
import pathlib
import tempfile
import unittest

TESTROOT = pathlib.Path(__file__).resolve().parents[1] / 'work'
TESTROOT.mkdir(exist_ok=True)
path = TESTROOT.parent / 'tools/release/version-assets.py'
spec = importlib.util.spec_from_file_location('release_versions', path)
versions = importlib.util.module_from_spec(spec)
spec.loader.exec_module(versions)


def import_map(html):
    return json.loads(html.split('<script type="importmap">', 1)[1].split('</script>', 1)[0])['imports']


class CacheRelease(unittest.TestCase):
    def test_cached_parent_gets_new_child_without_changing_parent(self):
        saved = versions.ROOT
        try:
            with tempfile.TemporaryDirectory(dir=TESTROOT) as d:
                versions.ROOT = root = pathlib.Path(d)
                (root / 'assets').mkdir()
                (root / 'assets/entry.js').write_text("import {value} from './child.js'; export {value};")
                (root / 'assets/child.js').write_text('export const value=1;')
                html = '<html><head><meta charset="utf-8"><script type="module" src="assets/entry.js?v=old"></script></head></html>'
                before, _ = versions.build('index.html', html)
                entry_before = import_map(before)['./assets/entry.js']
                child_before = import_map(before)['./assets/child.js']
                (root / 'assets/child.js').write_text('export const value=2;')
                after, _ = versions.build('index.html', before)
                self.assertEqual(entry_before, import_map(after)['./assets/entry.js'])
                self.assertNotEqual(child_before, import_map(after)['./assets/child.js'])
                self.assertEqual(versions.build('index.html', after)[0], after)
                self.assertLess(after.index('type="importmap"'), after.index('type="module"'))
                self.assertLess(after.index('charset="utf-8"'), after.index('type="importmap"'))
        finally:
            versions.ROOT = saved

    def test_nested_queried_import_has_same_singleton_target(self):
        saved = versions.ROOT
        try:
            with tempfile.TemporaryDirectory(dir=TESTROOT) as d:
                versions.ROOT = root = pathlib.Path(d)
                (root / 'assets').mkdir()
                (root / 'mizan').mkdir()
                (root / 'mizan/app.js').write_text("import '../assets/shared.js?v=old'; import '../assets/shared.js';")
                (root / 'assets/shared.js').write_text('export const shared={};')
                html = '<html><head></head><body><script type="module" src="app.js?v=old"></script></body></html>'
                output, _ = versions.build('mizan/index.html', html)
                m = import_map(output)
                self.assertEqual(m['../assets/shared.js?v=old'], m['../assets/shared.js'])
                self.assertTrue(m['../assets/shared.js'].startswith('../assets/shared.js?v='))
                (root / 'assets/shared.js').unlink()
                with self.assertRaisesRegex(ValueError, 'Missing local module'):
                    versions.build('mizan/index.html', html)
        finally:
            versions.ROOT = saved


if __name__ == '__main__':
    unittest.main()
