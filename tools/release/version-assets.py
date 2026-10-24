"""Pin each page's local module graph to its bytes, including cached parents.

Import maps keep native module imports and offline Node tests unchanged. Run again
after changing a runtime module; --check fails if a page's map needs rebuilding.
"""
import argparse
import hashlib
import json
import pathlib
import posixpath
import re
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parents[2]
MARKER = re.compile(r'<!-- AURA module versions -->.*?<!-- /AURA module versions -->\n?', re.S)
SCRIPTS = re.compile(r'<script\b(?=[^>]*\btype=[\"\']module[\"\'])([^>]*)>', re.I)
SRC = re.compile(r'\bsrc=([\"\'])(.*?)\1', re.I)
IMPORTS = re.compile(r'''(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)(["'])([^"'\n]+)\1''')


def local_url(parent, spec):
    if not spec.startswith(('.', '/')) and parent.endswith('.js'):
        return None  # bare package or remote import
    u = urllib.parse.urlsplit(spec)
    if u.scheme or u.netloc:
        return None
    path = posixpath.normpath(posixpath.join(posixpath.dirname(parent), u.path)) if not u.path.startswith('/') else u.path.lstrip('/')
    if path.startswith('../') or not (ROOT / path).is_file():
        raise ValueError(f'Missing local module: {parent}: {spec}')
    return path + (('?' + u.query) if u.query else '')


def digest(path):
    # Git/FTP checkout uses LF; Windows worktrees may use CRLF.
    return hashlib.sha256((ROOT / path).read_bytes().replace(b'\r\n', b'\n')).hexdigest()[:16]


def graph(entries):
    todo = list(entries)
    found = set()
    while todo:
        url = todo.pop()
        if url in found:
            continue
        found.add(url)
        path = url.split('?', 1)[0]
        for m in IMPORTS.finditer((ROOT / path).read_text(encoding='utf-8')):
            spec = m[2]
            if '.js' not in spec:
                continue
            child = local_url(path, spec)
            if child:
                todo.append(child)
    return found


def build(page, text):
    text = MARKER.sub('', text)
    entries = []

    def script(m):
        src = SRC.search(m[1])
        if not src:
            return m[0]
        url = local_url(page, src[2])
        if not url:
            return m[0]
        path = url.split('?', 1)[0]
        entries.append(path)
        relative = posixpath.relpath(path, posixpath.dirname(page) or '.')
        return m[0].replace(src[0], f'src={src[1]}{relative}?v={digest(path)}{src[1]}')

    text = SCRIPTS.sub(script, text)
    if not entries:
        return text, 0
    mapping = {}
    for url in sorted(graph(entries)):
        path = url.split('?', 1)[0]
        relative = posixpath.relpath(path, posixpath.dirname(page) or '.')
        relative = relative if relative.startswith('.') else './' + relative
        key = relative + (('?' + url.split('?', 1)[1]) if '?' in url else '')
        mapping[key] = relative + '?v=' + digest(path)
        mapping.setdefault(relative, relative + '?v=' + digest(path))
    block = '<!-- AURA module versions --><script type="importmap">' + json.dumps({'imports': mapping}, separators=(',', ':')) + '</script><!-- /AURA module versions -->\n'
    # Maps must precede any module script. They are relative to this document,
    # so previews in a subdirectory and nested Mizan pages resolve correctly.
    # Keep the encoding declaration inside the first 1024 bytes. Large maps
    # placed immediately after <head> would push that declaration too far back.
    first_module = SCRIPTS.search(text)
    text = text[:first_module.start()] + block + text[first_module.start():]
    return text, len(mapping)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    pages = sorted(list(ROOT.glob('*.html')) + list(ROOT.glob('*.php')) + list((ROOT / 'mizan').rglob('*.html')))
    changed = []
    total = 0
    for p in pages:
        if p.name == 'preview-test.html':
            continue
        page = p.relative_to(ROOT).as_posix()
        old = p.read_text(encoding='utf-8')
        new, count = build(page, old)
        total += bool(count)
        if new != old:
            changed.append(page)
            if not args.check:
                p.write_text(new, encoding='utf-8', newline='\n')
    print(json.dumps({'pages': total, 'stale' if args.check else 'updated': changed}))
    if args.check and changed:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
