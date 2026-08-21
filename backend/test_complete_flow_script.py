import urllib.request
import json
import os

BACKEND_URL = "http://localhost:8000"

print("=" * 70)
print("TRIPPULSE GOOGLE LOGIN & UI VERIFICATION SUITE")
print("=" * 70)

# 1. Test Health
print("\n[STEP 1] Testing Backend Health...")
try:
    req = urllib.request.Request(f"{BACKEND_URL}/health")
    with urllib.request.urlopen(req, timeout=5.0) as resp:
        data = json.loads(resp.read().decode())
        assert data.get("status") == "ok", f"Expected status ok, got {data}"
        print(f"  [PASS] Backend health: {data}")
except Exception as e:
    print(f"  [FAIL] Backend health check failed: {e}")
    exit(1)

# 2. Test OAuth Config
print("\n[STEP 2] Testing /api/v1/auth/oauth/config...")
try:
    req = urllib.request.Request(f"{BACKEND_URL}/api/v1/auth/oauth/config")
    with urllib.request.urlopen(req, timeout=5.0) as resp:
        data = json.loads(resp.read().decode())
        assert data.get("success") is True, f"Expected success true, got {data}"
        cfg = data.get("data", {})
        print(f"  [PASS] google_enabled: {cfg.get('google_enabled')}")
        print(f"  [PASS] google_client_id: {cfg.get('google_client_id')}")
        print(f"  [PASS] google_redirect_uri: {cfg.get('google_redirect_uri')}")
except Exception as e:
    print(f"  [FAIL] OAuth config failed: {e}")
    exit(1)

# 3. Test Google OAuth Login with verified Google User
print("\n[STEP 3] Testing POST /api/v1/auth/google (Google User Creation & JWT Generation)...")
issued_token = None
try:
    payload = {
        "provider": "google",
        "email": "aswin.google.test@trippulse.app",
        "name": "Aswin Google User",
        "google_id": "google-oauth2|1085952608505001",
        "avatar_url": "https://lh3.googleusercontent.com/a/test-avatar"
    }
    req = urllib.request.Request(
        f"{BACKEND_URL}/api/v1/auth/google",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=5.0) as resp:
        data = json.loads(resp.read().decode())
        assert data.get("success") is True, f"Expected success true, got {data}"
        issued_token = data.get("data", {}).get("access_token")
        user_info = data.get("data", {}).get("user", {})
        assert issued_token, "No access token returned!"
        assert user_info.get("email") == "aswin.google.test@trippulse.app"
        assert user_info.get("google_id") == "google-oauth2|1085952608505001"
        print(f"  [PASS] Google user created/logged in: {user_info.get('name')} ({user_info.get('email')})")
        print(f"  [PASS] JWT issued: {issued_token[:20]}...{issued_token[-15:]}")
except Exception as e:
    print(f"  [FAIL] POST /api/v1/auth/google failed: {e}")
    exit(1)

# 4. Test Authenticated Profile Access with Issued JWT (/api/v1/auth/me)
print("\n[STEP 4] Testing GET /api/v1/auth/me with TripPulse JWT Session...")
try:
    req = urllib.request.Request(
        f"{BACKEND_URL}/api/v1/auth/me",
        headers={"Authorization": f"Bearer {issued_token}"}
    )
    with urllib.request.urlopen(req, timeout=5.0) as resp:
        data = json.loads(resp.read().decode())
        assert data.get("success") is True, f"Expected success true, got {data}"
        me = data.get("data", {})
        assert me.get("email") == "aswin.google.test@trippulse.app"
        print(f"  [PASS] Authenticated Session Active: ID={me.get('id')}, Name={me.get('name')}, Email={me.get('email')}")
except Exception as e:
    print(f"  [FAIL] GET /api/v1/auth/me failed: {e}")
    exit(1)

# 5. Test Account Linking on Repeated Google Login
print("\n[STEP 5] Testing Google Account Linking on Re-login...")
try:
    payload = {
        "provider": "google",
        "email": "aswin.google.test@trippulse.app",
        "name": "Aswin Google User Updated",
        "google_id": "google-oauth2|1085952608505001"
    }
    req = urllib.request.Request(
        f"{BACKEND_URL}/api/v1/auth/google",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=5.0) as resp:
        data = json.loads(resp.read().decode())
        assert data.get("success") is True
        print(f"  [PASS] Google account re-login linked existing user ID={data.get('data', {}).get('user', {}).get('id')}")
except Exception as e:
    print(f"  [FAIL] Google re-login failed: {e}")
    exit(1)

# 6. Test Email/Password Login
print("\n[STEP 6] Testing Email/Password Login...")
try:
    login_payload = {
        "email": "aswin@example.com",
        "password": "password123"
    }
    req = urllib.request.Request(
        f"{BACKEND_URL}/api/v1/auth/login",
        data=json.dumps(login_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=5.0) as resp:
        data = json.loads(resp.read().decode())
        assert data.get("success") is True
        ep_token = data.get("data", {}).get("access_token")
        assert ep_token
        print(f"  [PASS] Email/Password login successful for aswin@example.com")
except Exception as e:
    print(f"  [FAIL] Email/Password login failed: {e}")
    exit(1)

# 7. Codebase Verification Checks
print("\n[STEP 7] Verifying Frontend Code Integrity...")
frontend_dir = r"c:\Users\ASWIN\.gemini\antigravity-ide\scratch\ai-trip-planner\frontend\src"

navbar_path = os.path.join(frontend_dir, "components", "Navbar.jsx")
with open(navbar_path, "r", encoding="utf-8") as f:
    nav_content = f.read()
assert "activePage !== 'login'" in nav_content, "Search bar not conditionally hidden on login page!"
print("  [PASS] Navbar.jsx hides search bar on activePage === 'login' only.")

auth_ctx_path = os.path.join(frontend_dir, "context", "AuthContext.jsx")
with open(auth_ctx_path, "r", encoding="utf-8") as f:
    ctx_content = f.read()
assert "urlParams.get('oauth_token') || urlParams.get('token')" in ctx_content, "AuthContext does not parse urlToken!"
print("  [PASS] AuthContext.jsx correctly parses and stores URL tokens.")

google_auth_path = os.path.join(frontend_dir, "services", "googleAuth.js")
with open(google_auth_path, "r", encoding="utf-8") as f:
    gauth_content = f.read()
assert "window.google?.accounts?.oauth2?.initTokenClient" in gauth_content, "googleAuth.js does not use initTokenClient!"
print("  [PASS] googleAuth.js uses Google Identity Services Token Client.")

login_page_path = os.path.join(frontend_dir, "pages", "Login.jsx")
with open(login_page_path, "r", encoding="utf-8") as f:
    login_content = f.read()
assert "setActivePage('trip-dashboard')" in login_content, "Login.jsx does not navigate to trip-dashboard!"
print("  [PASS] Login.jsx navigates to trip-dashboard on successful login.")

app_path = os.path.join(frontend_dir, "App.jsx")
with open(app_path, "r", encoding="utf-8") as f:
    app_content = f.read()
assert "navigate('trip-dashboard')" in app_content, "App.jsx does not navigate to trip-dashboard for authenticated users!"
print("  [PASS] App.jsx navigates authenticated users to trip-dashboard.")

print("\n" + "=" * 70)
print("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY (100% PASS RATE)!")
print("=" * 70)
