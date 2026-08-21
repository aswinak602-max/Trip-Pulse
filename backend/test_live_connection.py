import urllib.request
import urllib.error
import json

def test_live_suite():
    print("=== TESTING LIVE FASTAPI SERVER ON PORT 8000 WITH PORT 5174 ORIGIN ===")

    # 1. Test CORS preflight OPTIONS request from port 5174
    req_opt = urllib.request.Request(
        'http://localhost:8000/api/v1/auth/login',
        headers={
            'Origin': 'http://localhost:5174',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type,authorization'
        },
        method='OPTIONS'
    )
    res_opt = urllib.request.urlopen(req_opt)
    print('[PASS] 1. CORS Preflight Status:', res_opt.status)
    print('   - Access-Control-Allow-Origin:', res_opt.headers.get('Access-Control-Allow-Origin'))
    print('   - Access-Control-Allow-Credentials:', res_opt.headers.get('Access-Control-Allow-Credentials'))

    # 2. Test Registration with Origin: http://localhost:5174
    email = f"explorer_5174_{int(urllib.request.time.time())}@trippulse.ai"
    user_payload = json.dumps({
        'name': 'Test Explorer 5174',
        'email': email,
        'password': 'password123',
        'confirm_password': 'password123'
    }).encode()

    req_reg = urllib.request.Request(
        'http://localhost:8000/api/v1/auth/register',
        data=user_payload,
        headers={'Content-Type': 'application/json', 'Origin': 'http://localhost:5174'},
        method='POST'
    )
    res_reg = urllib.request.urlopen(req_reg)
    reg_data = json.loads(res_reg.read().decode())
    print('[PASS] 2. Registration Success:', reg_data.get('message'), f"for {email}")

    # 3. Test Login with Origin: http://localhost:5174
    login_payload = json.dumps({
        'email': email,
        'password': 'password123'
    }).encode()

    req_login = urllib.request.Request(
        'http://localhost:8000/api/v1/auth/login',
        data=login_payload,
        headers={'Content-Type': 'application/json', 'Origin': 'http://localhost:5174'},
        method='POST'
    )
    res_login = urllib.request.urlopen(req_login)
    login_data = json.loads(res_login.read().decode())
    token = login_data['data']['access_token']
    print('[PASS] 3. Login Success! Token generated:', token[:25] + '...')

    # 4. Test Authenticated Profile Request with Token & Origin: http://localhost:5174
    req_me = urllib.request.Request(
        'http://localhost:8000/api/v1/auth/me',
        headers={'Authorization': f'Bearer {token}', 'Origin': 'http://localhost:5174'},
        method='GET'
    )
    res_me = urllib.request.urlopen(req_me)
    me_data = json.loads(res_me.read().decode())
    print(f"[PASS] 4. Authenticated User Profile retrieved: {me_data['data']['name']} ({me_data['data']['email']})")

    # 5. Test Authenticated Create Trip with Token & Origin: http://localhost:5174
    trip_payload = json.dumps({
        'title': 'Ooty 5174 Journey',
        'current_location': 'Chennai',
        'destination': 'Ooty',
        'start_date': '2026-09-10',
        'end_date': '2026-09-12',
        'days_count': 3,
        'members_count': 3,
        'budget': 20000,
        'transport_type': 'Bus',
        'accommodation_type': 'Budget',
        'food_budget_tier': 'Budget',
        'interests': ['Nature', 'Photography'],
        'selected_places': [
            {
                'id': 101,
                'name': 'Ooty Lake & Boat House',
                'latitude': 11.4078,
                'longitude': 76.6883,
                'category': 'Nature'
            }
        ]
    }).encode()

    req_trip = urllib.request.Request(
        'http://localhost:8000/api/v1/trips',
        data=trip_payload,
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}', 'Origin': 'http://localhost:5174'},
        method='POST'
    )
    res_trip = urllib.request.urlopen(req_trip)
    trip_res = json.loads(res_trip.read().decode())
    print(f"[PASS] 5. Authenticated Trip Creation Success! Trip ID #{trip_res['data']['id']} ('{trip_res['data']['title']}')")

    # 6. Test Health Endpoint
    req_h = urllib.request.Request('http://localhost:8000/api/v1/health', headers={'Origin': 'http://localhost:5174'})
    res_h = urllib.request.urlopen(req_h)
    h_data = json.loads(res_h.read().decode())
    print(f"[PASS] 6. Health check: status='{h_data['data']['status']}', db='{h_data['data']['database']}'")

    print("\n=== ALL LIVE CONNECTION & CORS TESTS PASSED FOR PORT 5174! ===")

if __name__ == '__main__':
    test_live_suite()
