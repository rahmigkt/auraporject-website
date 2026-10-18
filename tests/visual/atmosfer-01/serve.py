"""Loopback-only review server with enough backlog for browser module imports."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


class ReviewServer(ThreadingHTTPServer):
    request_queue_size = 128


if __name__ == '__main__':
    root = Path(__file__).resolve().parents[3]
    server = ReviewServer(('127.0.0.1', 8768), partial(QuietHandler, directory=str(root)))
    print('http://127.0.0.1:8768/tests/visual/atmosfer-01/review.html', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
