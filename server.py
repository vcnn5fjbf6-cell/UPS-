from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import base64
import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen


HOST = "127.0.0.1"
PORT = 8000

ZHIHANG_API = {
    "internal": "http://gateway.meta42.indc.vnet.com",
    "external": "https://digitaltwin.meta42.indc.vnet.com/openapi",
}
ZHIHANG_AUTH = ("root", "taosdata")
ZHIHANG_ENDPOINTS = [
    "GET /cmdb/objRemote/getObjList",
    "POST /cmdb/insRemote/getInsByDomainCodeAndObjIds",
    "POST /device_twin/reported/list",
    "POST /tsdb/point_data/v2/search",
    "POST /tsdb/point_data/v2/sql/search",
    "POST /cmdb/insRemote/getPointDataByInsStandardIds",
    "POST /cmdb/insAsstRemote/getDownInsByAsstIdBatch",
    "POST /cmdb/insRemote/list",
]

ZHIHANG_SAMPLE_POINTS = {
    "1.1.5.2.4.1": 220.0,
    "1.1.5.2.32.1": 220.0,
    "1.1.5.2.54.1": 32.0,
    "1.1.5.2.58.1": 96.0,
    "1.1.5.2.59.1": 34.2,
    "1.1.5.2.57.1": 47.0,
    "1.1.5.2.56.1": 1.8,
    "1.1.5.2.38.1": 50.0,
    "1.1.5.2.29.1": 384.0,
    "1.1.5.2.2.1": 1,
    "1.1.5.2.9998.1": 0,
}


def local_point_value(point_id):
    if point_id in ZHIHANG_SAMPLE_POINTS:
        return ZHIHANG_SAMPLE_POINTS[point_id]
    seed = sum(ord(char) for char in point_id)
    return round(10 + (seed % 90), 1)


def build_local_point_payload(point_ids):
    payload = {}
    for point_id in point_ids:
        payload[point_id] = {
            "reported_value": local_point_value(point_id),
            "reported_timestamp": int(__import__("time").time() * 1000),
        }
    return payload


def zhihang_request(method, path, payload=None, mode="external"):
    base_url = ZHIHANG_API.get(mode, ZHIHANG_API["external"])
    headers = {}
    data = None
    if payload is not None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"
    token = base64.b64encode(
        f"{ZHIHANG_AUTH[0]}:{ZHIHANG_AUTH[1]}".encode("utf-8")
    ).decode("ascii")
    headers["Authorization"] = f"Basic {token}"
    request = Request(f"{base_url}{path}", data=data, headers=headers, method=method)
    with urlopen(request, timeout=8) as response:
        return json.loads(response.read().decode("utf-8"))


class StaticHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def query_mode(self):
        parsed = urlparse(self.path)
        return (parse_qs(parsed.query).get("mode") or ["local"])[0]

    def read_json_body(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        if not length:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8") or "{}")

    def do_GET(self):
        if self.path.startswith("/api/zhihang/status"):
            self.send_json({"ok": True, "endpoints": ZHIHANG_ENDPOINTS})
            return
        if self.path.startswith("/api/zhihang/models"):
            if self.query_mode() == "local":
                try:
                    models_path = Path(__file__).resolve().parent / "model-library" / "zhihang-std-models" / "device_models.json"
                    result = json.loads(models_path.read_text(encoding="utf-8"))
                except (OSError, ValueError) as error:
                    self.send_json({"ok": False, "error": str(error)}, status=500)
                    return
                self.send_json({"ok": True, "source": "local-standard", "count": len(result), "data": result})
                return
            try:
                result = zhihang_request("GET", "/cmdb/objRemote/getObjList", mode=self.query_mode())
            except (HTTPError, URLError, ValueError, OSError) as error:
                self.send_json({"ok": False, "error": str(error)}, status=502)
                return
            self.send_json({"ok": True, "count": len(result) if isinstance(result, list) else 0, "data": result})
            return
        super().do_GET()

    def do_POST(self):
        if self.path.startswith("/api/zhihang/realtime"):
            body = self.read_json_body()
            if self.query_mode() == "local":
                sample = build_local_point_payload(body.get("points", []))
                self.send_json({"ok": True, "source": "local-standard", "data": sample})
                return
            try:
                result = zhihang_request(
                    "POST",
                    "/device_twin/reported/list",
                    body.get("points", []),
                    mode=self.query_mode(),
                )
            except (HTTPError, URLError, ValueError, OSError) as error:
                sample = build_local_point_payload(body.get("points", []))
                self.send_json({
                    "ok": True,
                    "source": "local-standard",
                    "data": sample,
                })
                return
            self.send_json({"ok": True, "source": "zhihang", "data": result})
            return
        if self.path.startswith("/api/zhihang/devices"):
            body = self.read_json_body()
            if self.query_mode() == "local":
                obj_ids = body.get("objIds", [])
                sample = [
                    {"insName": f"本地示例-{obj_id}", "insId": f"LOCAL-{index + 1}", "objId": obj_id}
                    for index, obj_id in enumerate(obj_ids)
                ]
                self.send_json({"ok": True, "source": "local-standard", "data": sample})
                return
            try:
                result = zhihang_request(
                    "POST",
                    "/cmdb/insRemote/getInsByDomainCodeAndObjIds",
                    {
                        "page": 1,
                        "size": 999999,
                        "objIds": body.get("objIds", []),
                        "domainCode": body.get("domainCode", ""),
                        "isQueryProperties": False,
                        "isQueryPointData": False,
                    },
                    mode=self.query_mode(),
                )
            except (HTTPError, URLError, ValueError, OSError) as error:
                self.send_json({"ok": False, "error": str(error)}, status=502)
                return
            self.send_json({"ok": True, "data": result})
            return
        self.send_json({"ok": False, "error": "not found"}, status=404)


if __name__ == "__main__":
    root = Path(__file__).resolve().parent
    print(f"Serving Huawei UPS monitor from {root}")
    print(f"Open http://{HOST}:{PORT}/index.html")
    server = ThreadingHTTPServer((HOST, PORT), StaticHandler)
    server.serve_forever()
