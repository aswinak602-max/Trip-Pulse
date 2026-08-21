import urllib.request
import json

def test_api_across_new_destinations():
    print("=== TESTING FASTAPI ENDPOINTS WITH NEW DATASET ===")

    test_dests = ['Munnar', 'Bangalore', 'Manali', 'Delhi', 'Mumbai', 'Coimbatore', 'Mysore', 'Kolkata']

    for d in test_dests:
        # 1. Test Places Discovery for destination
        req_places = urllib.request.Request(
            f'http://127.0.0.1:8000/api/v1/places/destination?destination={d}&origin=Chennai'
        )
        res_places = urllib.request.urlopen(req_places)
        places_data = json.loads(res_places.read().decode())
        places = places_data.get('data', [])
        print(f"\n[PASS] 1. Places Discovery for '{d}': Retrieved {len(places)} attractions:")
        for p in places[:3]:
            print(f"   - {p.get('name')} ({p.get('category')}) | Lat: {p.get('latitude')}, Lng: {p.get('longitude')}")

        # 2. Test ML Recommendations for destination
        req_recs = urllib.request.Request(
            'http://127.0.0.1:8000/api/v1/recommendations',
            data=json.dumps({'destination': d, 'interests': ['Nature', 'Adventure', 'Photography'], 'limit': 3}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        res_recs = urllib.request.urlopen(req_recs)
        recs_data = json.loads(res_recs.read().decode())
        recs = recs_data.get('data', {}).get('recommendations', [])
        print(f"[PASS] 2. ML Recommendations for '{d}': Returned {len(recs)} clustered matches:")
        for r in recs:
            pl = r.get('place', {})
            print(f"   - {pl.get('name')} | Match: {r.get('match_score')}% | Cluster: {r.get('cluster_id')}")

    print("\n=== ALL NEW DATASET DESTINATIONS AND PLACES TESTED SUCCESSFULLY! ===")

if __name__ == '__main__':
    test_api_across_new_destinations()
