from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


HOST = "127.0.0.1"
PORT = 8000


class StaticHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
    }


if __name__ == "__main__":
    root = Path(__file__).resolve().parent
    print(f"Serving Huawei UPS monitor from {root}")
    print(f"Open http://{HOST}:{PORT}/index.html")
    server = ThreadingHTTPServer((HOST, PORT), StaticHandler)
    server.serve_forever()
