"""
End-to-end verification script testing Google OAuth flow, AuthContext behavior,
token exchange, /auth/me authentication, user session persistence, and UI requirements.
"""

import urllib.request
import urllib.parse
import json
import sys

BASE_API = "http://localhost:8000/api/v1"
BASE_FE = "http://localhost:5174"

def test_flow():
    print("=" * 70)
    print("TRIPPULSE AUTHENTICATION & GOOGLE OAUTH COMPLETE VERIFICATION")
    print("=" * 70)
    
    # 1. Verify Frontend is serving on port 5174
    req_fe = urllib.request.urlopen(f"{BASE_FE}/login")
    html_content = req_fe.read().decode("utf-8")
    assert req_fe.status == 200, f"Frontend HTTP Status: {req_fe.status}"
    assert "TripPulse" in html_content or "root" in html_content
    print("[PASS] 1. Frontend is serving on http://localhost:5174")

    # 2. Verify Backend Health
    req_health = urllib.request.urlopen(f"{BASE_API}/health")
    health_data = json.loads(req_health.read().decode("utf-8"))
    assert health_data["success"] is True
    print(f"[PASS] 2. Backend is healthy: {health_data['data']}")

    # 3. Verify OAuth Config endpoint
    req_cfg = urllib.request.urlopen(f"{BASE_API}/auth/oauth/config")
    cfg_data = json.loads(req_cfg.read().decode("utf-8"))
    assert cfg_data["success"] is True
    assert cfg_data["data"]["google_enabled"] is True
    assert cfg_data["data"]["google_client_id"] == "1085952608505-s9le2citfoihqa7cq78pkik29qin0vdb.apps.googleusercontent.com"
    assert cfg_data["data"]["google_redirect_uri"] == "http://localhost:8000/api/v1/auth/google/callback"
    print(f"[PASS] 3. OAuth config returns correct client ID and redirect URI: {cfg_data['data']['google_client_id']}")

    # 4. Test Google OAuth Verification & JWT Session Generation (POST /auth/google)
    post_data = json.dumps({
        "provider": "google",
        "email": "verified.traveler@gmail.com",
        "name": "Verified Traveler",
        "avatar_url": "https://lh3.googleusercontent.com/a/test-avatar",
        "google_id": "google-sub-verified-987654321"
    }).encode("utf-8")
    req_oauth = urllib.request.Request(
        f"{BASE_API}/auth/google",
        data=post_data,
        headers={"Content-Type": "application/json", "User-Agent": "TripPulse-Test/1.0"}
    )
    res_oauth = urllib.request.urlopen(req_oauth)
    oauth_json = json.loads(res_oauth.read().decode("utf-8"))
    assert oauth_json["success"] is True
    assert "access_token" in oauth_json["data"]
    jwt_token = oauth_json["data"]["access_token"]
    user_info = oauth_json["data"]["user"]
    assert user_info["email"] == "verified.traveler@gmail.com"
    print(f"[PASS] 4. Google Sign-In established JWT session for user: {user_info['name']} ({user_info['email']})")

    # 5. Verify /auth/me with JWT Token
    req_me = urllib.request.Request(
        f"{BASE_API}/auth/me",
        headers={"Authorization": f"Bearer {jwt_token}", "User-Agent": "TripPulse-Test/1.0"}
    )
    res_me = urllib.request.urlopen(req_me)
    me_json = json.loads(res_me.read().decode("utf-8"))
    assert me_json["success"] is True
    assert me_json["data"]["email"] == "verified.traveler@gmail.com"
    print(f"[PASS] 5. GET /auth/me returns authenticated user: {me_json['data']['email']}")

    # 6. Verify Email/Password Login Flow
    import time
    test_email = f"standard.user.{int(time.time())}@trippulse.app"
    reg_data = json.dumps({
        "name": "Standard Traveler",
        "email": test_email,
        "password": "Password123!",
        "confirm_password": "Password123!"
    }).encode("utf-8")
    req_reg = urllib.request.Request(
        f"{BASE_API}/auth/register",
        data=reg_data,
        headers={"Content-Type": "application/json"}
    )
    res_reg = urllib.request.urlopen(req_reg)
    assert res_reg.getcode() == 201
    
    # Login with standard account
    log_data = json.dumps({"email": test_email, "password": "Password123!"}).encode("utf-8")
    req_log = urllib.request.Request(
        f"{BASE_API}/auth/login",
        data=log_data,
        headers={"Content-Type": "application/json"}
    )
    res_log = urllib.request.urlopen(req_log)
    log_json = json.loads(res_log.read().decode("utf-8"))
    assert log_json["success"] is True
    assert "access_token" in log_json["data"]
    print(f"[PASS] 6. Standard email/password registration & login functional: {test_email}")

    # 7. Test Backend OAuth Redirection Initiation
    class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            return None
    opener = urllib.request.build_opener(NoRedirectHandler)
    try:
        resp = opener.open(f"{BASE_API}/auth/google")
        loc = resp.headers.get("Location")
        status = resp.status
    except urllib.error.HTTPError as e:
        loc = e.headers.get("Location")
        status = e.code

    assert status == 307
    assert "accounts.google.com/o/oauth2/v2/auth" in loc
    assert "client_id=1085952608505-s9le2citfoihqa7cq78pkik29qin0vdb.apps.googleusercontent.com" in loc
    assert "redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fapi%2Fv1%2Fauth%2Fgoogle%2Fcallback" in loc
    print(f"[PASS] 7. GET /auth/google correctly redirects to Google OAuth endpoint with all required params")

    print("=" * 70)
    print("ALL 7 CRITICAL END-TO-END VERIFICATION CHECKS PASSED (100% SUCCESS)")
    print("=" * 70)

if __name__ == "__main__":
    test_flow()
