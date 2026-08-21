import urllib.request
import urllib.parse
import json
import sys

def main():
    print("==================================================")
    print("TRIPPULSE FULL SYSTEM VERIFICATION")
    print("==================================================")

    # 1. FRONTEND SERVER
    print("\n--- STEP 1: FRONTEND DEV SERVER ---")
    try:
        req = urllib.request.Request('http://localhost:5174/login')
        with urllib.request.urlopen(req, timeout=5) as r:
            html = r.read().decode('utf-8')
            print(f"[PASS] Frontend responding on http://localhost:5174 (HTTP {r.status}, HTML size: {len(html)} bytes)")
    except Exception as e:
        print(f"[FAIL] Frontend unreachable on http://localhost:5174: {e}")

    # 2. BACKEND HEALTH ENDPOINTS
    print("\n--- STEP 2: BACKEND HEALTH ENDPOINTS ---")
    try:
        req = urllib.request.Request('http://localhost:8000/health')
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read().decode('utf-8'))
            print(f"[PASS] Root Health (http://localhost:8000/health): {data}")
    except Exception as e:
        print(f"[FAIL] Root Health failed: {e}")

    try:
        req = urllib.request.Request('http://localhost:8000/api/v1/health')
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read().decode('utf-8'))
            print(f"[PASS] API v1 Health (http://localhost:8000/api/v1/health): {data}")
    except Exception as e:
        print(f"[FAIL] API v1 Health failed: {e}")

    # 3. CORS PREFLIGHT & HEADERS
    print("\n--- STEP 3: CORS HEADERS & SECURITY ---")
    try:
        # Preflight OPTIONS
        req = urllib.request.Request('http://localhost:8000/api/v1/health', method='OPTIONS', headers={
            'Origin': 'http://localhost:5174',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Authorization,Content-Type'
        })
        with urllib.request.urlopen(req, timeout=5) as r:
            print(f"[PASS] Preflight OPTIONS HTTP {r.status}")
            print(f"       Access-Control-Allow-Origin: {r.headers.get('access-control-allow-origin')}")
            print(f"       Access-Control-Allow-Credentials: {r.headers.get('access-control-allow-credentials')}")
            print(f"       Access-Control-Allow-Methods: {r.headers.get('access-control-allow-methods')}")
    except Exception as e:
        print(f"[FAIL] CORS Preflight failed: {e}")

    # 4. AUTH LOGIN REQUEST
    print("\n--- STEP 4: AUTH LOGIN FLOW ---")
    token = None
    user_data = None
    try:
        login_body = json.dumps({
            "email": "aswin@example.com",
            "password": "password123"
        }).encode('utf-8')
        req = urllib.request.Request(
            'http://localhost:8000/api/v1/auth/login',
            data=login_body,
            headers={
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:5174'
            }
        )
        with urllib.request.urlopen(req, timeout=5) as r:
            res = json.loads(r.read().decode('utf-8'))
            print(f"[PASS] Login HTTP {r.status} - Success: {res.get('success')}")
            token = res.get('data', {}).get('access_token')
            user_data = res.get('data', {}).get('user')
            print(f"       Logged in user: {user_data.get('name')} ({user_data.get('email')})")
            print(f"       Access Token: {token[:20]}...{token[-10:]}")
    except Exception as e:
        print(f"[FAIL] Auth login failed: {e}")

    # 5. AUTH VERIFY /me & TRIPS
    print("\n--- STEP 5: AUTHENTICATED USER & TRIPS ---")
    if token:
        try:
            req = urllib.request.Request(
                'http://localhost:8000/api/v1/auth/me',
                headers={
                    'Authorization': f'Bearer {token}',
                    'Origin': 'http://localhost:5174'
                }
            )
            with urllib.request.urlopen(req, timeout=5) as r:
                res = json.loads(r.read().decode('utf-8'))
                print(f"[PASS] /auth/me profile verified: {res.get('data', {}).get('name')}")
        except Exception as e:
            print(f"[FAIL] /auth/me failed: {e}")

        try:
            req = urllib.request.Request(
                'http://localhost:8000/api/v1/trips',
                headers={
                    'Authorization': f'Bearer {token}',
                    'Origin': 'http://localhost:5174'
                }
            )
            with urllib.request.urlopen(req, timeout=5) as r:
                res = json.loads(r.read().decode('utf-8'))
                trips = res.get('data', [])
                print(f"[PASS] User trips retrieved ({len(trips)} trip(s)):")
                for t in trips:
                    print(f"       * Trip ID {t.get('id')}: \"{t.get('title')}\" ({t.get('current_location')} -> {t.get('destination')})")
        except Exception as e:
            print(f"[FAIL] Trips list failed: {e}")

    # 6. GOOGLE OAUTH CONFIGURATION
    print("\n--- STEP 6: GOOGLE OAUTH CONFIGURATION ---")
    try:
        req = urllib.request.Request('http://localhost:8000/api/v1/auth/oauth/config')
        with urllib.request.urlopen(req, timeout=5) as r:
            res = json.loads(r.read().decode('utf-8'))
            oauth_data = res.get('data', {})
            print(f"[PASS] OAuth config: google_enabled={oauth_data.get('google_enabled')}")
            print(f"       Google Client ID: {oauth_data.get('google_client_id')}")
            print(f"       Redirect URI: {oauth_data.get('google_redirect_uri')}")
    except Exception as e:
        print(f"[FAIL] OAuth config failed: {e}")

    # 7. DESTINATIONS & PLACES
    print("\n--- STEP 7: DESTINATIONS & PLACES ---")
    try:
        req = urllib.request.Request('http://localhost:8000/api/v1/destinations')
        with urllib.request.urlopen(req, timeout=5) as r:
            res = json.loads(r.read().decode('utf-8'))
            dests = res.get('data', [])
            print(f"[PASS] Destinations catalog retrieved ({len(dests)} destination(s)):")
            for d in dests[:3]:
                print(f"       * {d.get('name')} ({d.get('state')}, {d.get('country')}) - {d.get('places_count')} places")
    except Exception as e:
        print(f"[FAIL] Destinations failed: {e}")

    print("\n==================================================")
    print("ALL CHECKS COMPLETE")
    print("==================================================")

if __name__ == "__main__":
    main()
