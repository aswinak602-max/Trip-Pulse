import urllib.request
import urllib.parse
import json
import sys

print("=== 1. Testing Frontend HTTP Server (port 5174) ===")
req_fe = urllib.request.urlopen("http://localhost:5174/login")
fe_html = req_fe.read().decode("utf-8")
assert req_fe.status == 200, f"Status {req_fe.status}"
assert "TripPulse" in fe_html or "root" in fe_html, "Frontend HTML check"
print("  [PASS] Frontend served index.html on port 5174 successfully.")

print("=== 2. Testing Backend OAuth Config ===")
req_cfg = urllib.request.urlopen("http://localhost:8000/api/v1/auth/oauth/config")
cfg_data = json.loads(req_cfg.read().decode("utf-8"))
assert cfg_data["data"]["google_enabled"] is True
assert cfg_data["data"]["google_client_id"] == "1085952608505-s9le2citfoihqa7cq78pkik29qin0vdb.apps.googleusercontent.com"
assert cfg_data["data"]["google_redirect_uri"] == "http://localhost:8000/api/v1/auth/google/callback"
assert cfg_data["data"]["is_secret_configured"] is False
print(f"  [PASS] Backend OAuth Config: {cfg_data['data']}")

print("=== 3. Testing Backend Google Authorization Endpoint ===")
class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

opener = urllib.request.build_opener(NoRedirectHandler)
status = 0
loc = ""
try:
    resp = opener.open("http://localhost:8000/api/v1/auth/google")
    loc = resp.headers.get("Location")
    status = resp.status
except urllib.error.HTTPError as e:
    loc = e.headers.get("Location")
    status = e.code

print(f"  HTTP Status: {status}")
print(f"  Redirect Location: {loc}")
assert status == 307
assert "accounts.google.com/o/oauth2/v2/auth" in loc
assert "client_id=1085952608505-s9le2citfoihqa7cq78pkik29qin0vdb.apps.googleusercontent.com" in loc
assert "redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fapi%2Fv1%2Fauth%2Fgoogle%2Fcallback" in loc
assert "response_type=code" in loc
print("  [PASS] Backend generated exact Google OAuth 2.0 authorization URL!")

print("=== 4. Testing Backend Callback Route with error parameter ===")
cb_status = 0
cb_loc = ""
try:
    resp_cb = opener.open("http://localhost:8000/api/v1/auth/google/callback?error=access_denied")
    cb_loc = resp_cb.headers.get("Location")
    cb_status = resp_cb.status
except urllib.error.HTTPError as e:
    cb_loc = e.headers.get("Location")
    cb_status = e.code

print(f"  HTTP Status: {cb_status}")
print(f"  Callback Redirect: {cb_loc}")
assert cb_status == 307
assert cb_loc == "http://localhost:5174/login?error=access_denied"
print("  [PASS] Callback error redirection works as expected!")

print("=== ALL LIVE INTEGRATION CHECKS PASSED ===")
