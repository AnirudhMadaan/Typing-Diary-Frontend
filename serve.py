#!/usr/bin/env python3
"""Serve the prebuilt Typing Diary frontend using only Python's standard library."""

import os
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


FRONTEND_DIR = Path(__file__).resolve().parent
DIST_DIR = FRONTEND_DIR / "dist"
HOST = os.environ.get("FRONTEND_HOST", "0.0.0.0")
PORT = int(os.environ.get("FRONTEND_PORT", "5500"))


class DiaryStaticHandler(BaseHTTPRequestHandler):
    """Serves files from DIST_DIR; falls back to index.html for unknown paths (SPA)."""

    def do_GET(self):
        self._serve()

    def do_HEAD(self):
        self._serve(head_only=True)

    def _serve(self, head_only=False):
        # Clean path: strip query string and fragment
        url_path = self.path.split("?", 1)[0].split("#", 1)[0]

        # Resolve the file on disk
        rel = url_path.lstrip("/")
        file_path = (DIST_DIR / rel) if rel else DIST_DIR / "index.html"

        # SPA fallback: serve index.html for any non-existent path
        if not file_path.is_file():
            file_path = DIST_DIR / "index.html"

        # Determine MIME type
        mime, _ = mimetypes.guess_type(str(file_path))
        if mime is None:
            mime = "application/octet-stream"

        # Read and send
        try:
            data = file_path.read_bytes()
        except OSError:
            self.send_error(404, "File not found")
            return

        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        if not head_only:
            self.wfile.write(data)

    def log_message(self, format, *args):
        print(f"  [{self.address_string()}] {format % args}")


def main():
    index = DIST_DIR / "index.html"
    if not index.is_file():
        raise SystemExit(
            f"\n[ERROR] dist/index.html not found!\n"
            f"  Looked in: {DIST_DIR}\n"
            f"  Make sure the dist/ folder is inside frontend/ next to serve.py\n"
        )

    server = ThreadingHTTPServer((HOST, PORT), DiaryStaticHandler)
    print()
    print(f"  Typing Diary is running!")
    print(f"  Open --> http://localhost:{PORT}")
    print(f"  Serving files from: {DIST_DIR}")
    print(f"  Press Ctrl+C to stop.")
    print()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Stopping server. Bye!")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
