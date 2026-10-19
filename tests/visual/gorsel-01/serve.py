"""Read-only, loopback-only before/after review. Run from any directory with Python 3.

The baseline scene is read from Git; all other modules and both fixture sets are identical.
No external network, browser automation, generated images or product AI is involved.
"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
import subprocess

ROOT = Path(__file__).resolve().parents[3]
BASE = 'f99efc17273ef0b61ffd779bd24a174568e67f62'
BASELINE = subprocess.check_output(['git', 'show', f'{BASE}:assets/forma/scene.js'], cwd=ROOT)
os.chdir(ROOT)

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        if self.path.split('?')[0] == '/baseline/assets/forma/scene.js':
            self.send_response(200)
            self.send_header('Content-Type', 'text/javascript; charset=utf-8')
            self.send_header('Content-Length', str(len(BASELINE)))
            self.end_headers()
            self.wfile.write(BASELINE)
            return
        if self.path.startswith('/baseline/'):
            self.path = self.path[len('/baseline'):]
        super().do_GET()

print('GÖRSEL-01 review: http://127.0.0.1:8766/tests/visual/gorsel-01/capture.html', flush=True)
ThreadingHTTPServer(('127.0.0.1', 8766), Handler).serve_forever()
