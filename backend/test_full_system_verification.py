"""
End-to-End Live Verification Script for TripPulse
Validates:
1. Frontend on http://localhost:5174
2. Backend on http://localhost:8000
3. Health check endpoints (/health and /api/v1/health)
4. CORS headers from frontend origin http://localhost:5174
5. Frontend proxy forwarding /api -> http://localhost:8000
6. User Registration & Login flow (JWT Token issuance)
7. Google OAuth config & flow endpoints
8. Trip Dashboard & formatting tests
"""

import urllib.request
import urllib.parse
import json
import sys
import time

FRONTEND_URL = "http://localhost:5174"
BACKEND_URL = "http://localhost:8000"

def log_test(step_num, title, success, details=""):
    mark = "[PASS]" if success else "[FAIL]"
    print(f"{mark} Step {step_num}: {title}")
    if details:
        print(f"       -> {details}")

def test_http_get(url, headers=None):
    req_headers = {"User-Agent": "TripPulse-Verifier/1.0"}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, content, resp.headers
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8"), e.headers
    except Exception as e:
        return 0, str(e), {}

def test_http_post(url, data=None, headers=None):
    req_headers = {"Content-Type": "application/json", "User-Agent": "TripPulse-Verifier/1.0"}
    if headers:
        req_headers.update(headers)
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=req_headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content), resp.headers
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode("utf-8")), e.headers
        except Exception:
            return e.code, {"error": str(e)}, e.headers
    except Exception as e:
        return 0, {"error": str(e)}, {}

def run_verification():
    print("=" * 70)
    print(" TRIPPULSE FULL SYSTEM VERIFICATION")
    print("=" * 70)
    
    all_passed = True
    
    # 1. Frontend Server reachable on port 5174
    code, html, _ = test_http_get(f"{FRONTEND_URL}/login")
    fe_ok = code == 200 and ("TripPulse" in html or "doctype" in html.lower())
    log_test(1, f"Frontend Server on port 5174 ({FRONTEND_URL}/login)", fe_ok, f"HTTP {code}, size {len(html)} bytes")
    all_passed = all_passed and fe_ok

    # 2. Backend Server reachable on port 8000 (/health)
    code, content, _ = test_http_get(f"{BACKEND_URL}/health")
    try:
        be_health = json.loads(content)
        be_ok = code == 200 and be_health.get("status") == "ok"
    except Exception:
        be_ok = False
    log_test(2, f"Backend Root Health ({BACKEND_URL}/health)", be_ok, f"HTTP {code}, status='{be_health.get('status')}', database='{be_health.get('database')}'")
    all_passed = all_passed and be_ok

    # 3. Backend API v1 Health (/api/v1/health)
    code, content, _ = test_http_get(f"{BACKEND_URL}/api/v1/health")
    try:
        api_health = json.loads(content)
        api_ok = code == 200 and api_health.get("success") is True and api_health.get("data", {}).get("status") == "online"
    except Exception:
        api_ok = False
    log_test(3, f"Backend API v1 Health ({BACKEND_URL}/api/v1/health)", api_ok, f"HTTP {code}, API Status='{api_health.get('data', {}).get('status')}', message='{api_health.get('message')}'")
    all_passed = all_passed and api_ok

    # 4. CORS Headers Verification (Origin: http://localhost:5174)
    code, content, resp_headers = test_http_get(
        f"{BACKEND_URL}/api/v1/health",
        headers={"Origin": "http://localhost:5174"}
    )
    cors_origin = resp_headers.get("access-control-allow-origin") or resp_headers.get("Access-Control-Allow-Origin")
    cors_creds = resp_headers.get("access-control-allow-credentials") or resp_headers.get("Access-Control-Allow-Credentials")
    cors_ok = cors_origin in ("http://localhost:5174", "*") and cors_creds == "true"
    log_test(4, "CORS Configuration for http://localhost:5174", cors_ok, f"Access-Control-Allow-Origin: {cors_origin}, Allow-Credentials: {cors_creds}")
    all_passed = all_passed and cors_ok

    # 5. Frontend Vite Proxy forwarding (/api/v1/health via port 5174)
    code, content, _ = test_http_get(f"{FRONTEND_URL}/api/v1/health")
    try:
        proxy_data = json.loads(content)
        proxy_ok = code == 200 and proxy_data.get("success") is True
    except Exception:
        proxy_ok = False
    log_test(5, "Frontend Vite Proxy (/api forwarding to backend:8000)", proxy_ok, f"HTTP {code}, response received through Vite dev proxy")
    all_passed = all_passed and proxy_ok

    # 6. User Registration & Login Authentication Request
    test_user_email = f"explorer.test.{int(time.time())}@trippulse.app"
    test_user_pwd = "TripPulsePassword!2026"
    
    # Register
    code_reg, res_reg, _ = test_http_post(f"{BACKEND_URL}/api/v1/auth/register", data={
        "name": "Alex Verification User",
        "email": test_user_email,
        "password": test_user_pwd,
        "confirm_password": test_user_pwd
    })
    reg_ok = code_reg == 201 and res_reg.get("success") is True
    
    # Login
    code_login, res_login, _ = test_http_post(f"{BACKEND_URL}/api/v1/auth/login", data={
        "email": test_user_email,
        "password": test_user_pwd
    })
    login_ok = code_login == 200 and res_login.get("success") is True and "access_token" in res_login.get("data", {})
    jwt_token = res_login.get("data", {}).get("access_token", "") if login_ok else ""
    log_test(6, f"User Authentication (Register & Login flow: {test_user_email})", reg_ok and login_ok, f"HTTP {code_login}, JWT Token generated (Length: {len(jwt_token)})")
    all_passed = all_passed and reg_ok and login_ok

    # 7. Authenticated User Profile Request (/api/v1/auth/me)
    code_me, res_me, _ = test_http_get(f"{BACKEND_URL}/api/v1/auth/me", headers={"Authorization": f"Bearer {jwt_token}"})
    try:
        data_me = json.loads(res_me)
        me_ok = code_me == 200 and data_me.get("success") is True and data_me.get("data", {}).get("email") == test_user_email
    except Exception:
        me_ok = False
    log_test(7, "Authenticated Session (/api/v1/auth/me)", me_ok, f"HTTP {code_me}, User verified as '{data_me.get('data', {}).get('name')}'")
    all_passed = all_passed and me_ok

    # 8. Google OAuth Config Route (/api/v1/auth/oauth/config)
    code_oauth, res_oauth, _ = test_http_get(f"{BACKEND_URL}/api/v1/auth/oauth/config")
    try:
        oauth_data = json.loads(res_oauth)
        oauth_ok = code_oauth == 200 and oauth_data.get("success") is True and "google_client_id" in oauth_data.get("data", {})
    except Exception:
        oauth_ok = False
    client_id_val = oauth_data.get("data", {}).get("google_client_id", "") if oauth_ok else ""
    log_test(8, "Google OAuth Server Config (/api/v1/auth/oauth/config)", oauth_ok, f"HTTP {code_oauth}, Google Client ID: {client_id_val[:15]}...{client_id_val[-20:] if len(client_id_val) > 30 else ''}")
    all_passed = all_passed and oauth_ok

    # 9. Google OAuth Verified Login Endpoint (/api/v1/auth/google)
    code_gauth, res_gauth, _ = test_http_post(f"{BACKEND_URL}/api/v1/auth/google", data={
        "provider": "google",
        "email": "alex.explorer.google@gmail.com",
        "name": "Alex Explorer",
        "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        "google_id": "google-oauth2|1085952608505999"
    })
    gauth_ok = code_gauth == 200 and res_gauth.get("success") is True and res_gauth.get("data", {}).get("user", {}).get("email") == "alex.explorer.google@gmail.com"
    log_test(9, "Google OAuth Authentication Endpoint (/api/v1/auth/google)", gauth_ok, f"HTTP {code_gauth}, User: {res_gauth.get('data', {}).get('user', {}).get('name')}")
    all_passed = all_passed and gauth_ok

    # 10. Dashboard Trips Retrieval (/api/v1/trips)
    code_trips, res_trips, _ = test_http_get(f"{BACKEND_URL}/api/v1/trips", headers={"Authorization": f"Bearer {jwt_token}"})
    try:
        trips_data = json.loads(res_trips)
        trips_ok = code_trips == 200 and trips_data.get("success") is True
    except Exception:
        trips_ok = False
    log_test(10, "Trip Dashboard Data Access (/api/v1/trips)", trips_ok, f"HTTP {code_trips}, Trips retrieved successfully")
    all_passed = all_passed and trips_ok

    print("=" * 70)
    if all_passed:
        print(" ALL 10 SYSTEM VERIFICATION CHECKS PASSED (100% SUCCESS)")
    else:
        print(" SOME VERIFICATION CHECKS FAILED")
    print("=" * 70)
    
    return all_passed

if __name__ == "__main__":
    success = run_verification()
    sys.exit(0 if success else 1)
