import csv
import re
import os
import json

def assign_destination(lat, lng, name):
    name_lower = name.lower()
    
    # Keyword based matching first
    if any(k in name_lower for k in ['manali', 'solang', 'rohtang', 'atal tunnel', 'jogini', 'vashisht', 'hadimba', 'hidimba', 'hampta', 'lama dugh', 'bhrigu']):
        return "Manali", "Himachal Pradesh", "India"
    if any(k in name_lower for k in ['dharamshala', 'dharmashala', 'mcleodganj', 'bhagsu', 'triund', 'kangra', 'palampur', 'dal lake']):
        return "Dharamshala", "Himachal Pradesh", "India"
    if any(k in name_lower for k in ['kullu', 'tirthan', 'jalori', 'bijli mahadev', 'chandrakhani']):
        return "Kullu", "Himachal Pradesh", "India"
    if any(k in name_lower for k in ['shimla', 'kufri', 'jakhu', 'annadale']):
        return "Shimla", "Himachal Pradesh", "India"
    if any(k in name_lower for k in ['chandigarh', 'chattbir', 'sohana', 'rock garden', 'yadavindra']):
        return "Chandigarh", "Chandigarh", "India"
    if any(k in name_lower for k in ['delhi', 'qutub', 'lodhi', 'humayun', 'red fort', 'gurugram', 'connaught', 'hauz khas', 'akshardham', 'rashtrapati', 'india gate']):
        return "Delhi", "Delhi NCR", "India"
    if any(k in name_lower for k in ['vrindavan', 'mathura', 'deeg']):
        return "Mathura & Vrindavan", "Uttar Pradesh", "India"
    if any(k in name_lower for k in ['kolkata', 'howrah', 'belur', 'dakshineswar', 'victoria memorial', 'sunderban', 'sajnekhali', 'eden garden']):
        return "Kolkata", "West Bengal", "India"
    if any(k in name_lower for k in ['guwahati', 'sukreshwar', 'umananda', 'naranarayan', 'umling']):
        return "Guwahati", "Assam", "India"
    if any(k in name_lower for k in ['hyderabad', 'charminar', 'golconda', 'hussain sagar', 'falaknuma', 'ramoji', 'chowmahalla', 'bhadrakali', 'warangal', 'srisailam', 'nallamala']):
        return "Hyderabad", "Telangana", "India"
    if any(k in name_lower for k in ['mumbai', 'gateway of india', 'juhu', 'elephanta', 'kanheri', 'alibag', 'murud', 'janjira', 'diveagar', 'taj mahal palace', 'csmt']):
        return "Mumbai", "Maharashtra", "India"
    if any(k in name_lower for k in ['pune', 'shaniwar wada', 'sinhagad', 'dagdusheth', 'lal mahal', 'matheran', 'lonavala', 'lonavla', 'khandala', 'mahabaleshwar', 'panchgani', 'mulshi', 'aga khan']):
        return "Pune", "Maharashtra", "India"
    if any(k in name_lower for k in ['bangalore', 'bengaluru', 'lalbagh', 'cubbon', 'vidhan soudha', 'iskcon', 'ub city', 'commercial street', 'bannerghatta']):
        return "Bangalore", "Karnataka", "India"
    if any(k in name_lower for k in ['mysore', 'mysuru', 'chamundi', 'shreerangapattana', 'brindavan', 'srirangapatna', 'jaganmohan', 'talakkadu', 'gaganchutki', 'bharachukki', 'cauvery']):
        return "Mysore", "Karnataka", "India"
    if any(k in name_lower for k in ['chennai', 'marina', 'elliot', 'perungudi', 'guindy', 'vandalur', 'golden beach', 'adyar']):
        return "Chennai", "Tamil Nadu", "India"
    if any(k in name_lower for k in ['coonoor', 'connoor', 'sims park', 'dolphin nose', 'wellington', 'lambs rock', 'laws falls', 'sleeping lady', 'pakasun']):
        return "Coonoor", "Tamil Nadu", "India"
    if any(k in name_lower for k in ['ooty', 'doddabetta', 'botanical garden', 'pykara', 'avalanche', 'nilgiri', 'rose garden', 'ketri', 'masinagudi', 'bandipur']):
        return "Ooty", "Tamil Nadu", "India"
    if any(k in name_lower for k in ['coimbatore', 'kovai', 'siruvani', 'marudhamalai', 'gedee', 'eachanari', 'dhyanlinga', 'adiyogi', 'isha yoga', 'velliangiri', 'black thunder']):
        return "Coimbatore", "Tamil Nadu", "India"
    if any(k in name_lower for k in ['palakkad', 'malampuzha', 'chulanur', 'kava']):
        return "Palakkad", "Kerala", "India"
    if any(k in name_lower for k in ['valparai', 'sholayar', 'chinna kalar', 'iraichal parai', 'monkey waterfall', 'thirumoorthy']):
        return "Valparai", "Tamil Nadu", "India"
    if any(k in name_lower for k in ['munnar', 'pothamendu', 'mattupetty', 'attukad', 'anamudi', 'eravikulam', 'chithirapuram', 'kolukkumalai']):
        return "Munnar", "Kerala", "India"

    # Coordinate-based bounding boxes
    if 32.15 <= lat <= 32.45 and 76.90 <= lng <= 77.45:
        return "Manali", "Himachal Pradesh", "India"
    if 31.95 <= lat <= 32.35 and 76.15 <= lng <= 76.85:
        return "Dharamshala", "Himachal Pradesh", "India"
    if 31.40 <= lat <= 32.15 and 77.00 <= lng <= 77.60:
        return "Kullu", "Himachal Pradesh", "India"
    if 31.00 <= lat <= 31.25 and 77.05 <= lng <= 77.35:
        return "Shimla", "Himachal Pradesh", "India"
    if 30.20 <= lat <= 31.35 and 76.20 <= lng <= 77.05:
        return "Chandigarh", "Punjab", "India"
    if 28.30 <= lat <= 28.90 and 76.70 <= lng <= 77.50:
        return "Delhi", "Delhi NCR", "India"
    if 27.20 <= lat <= 27.80 and 77.10 <= lng <= 77.90:
        return "Mathura & Vrindavan", "Uttar Pradesh", "India"
    if 21.80 <= lat <= 23.30 and 88.10 <= lng <= 89.10:
        return "Kolkata", "West Bengal", "India"
    if 25.80 <= lat <= 26.50 and 90.40 <= lng <= 92.20:
        return "Guwahati", "Assam", "India"
    if 17.10 <= lat <= 18.20 and 78.10 <= lng <= 79.90:
        return "Hyderabad", "Telangana", "India"
    if 18.10 <= lat <= 19.35 and 72.70 <= lng <= 73.20:
        return "Mumbai", "Maharashtra", "India"
    if 17.50 <= lat <= 19.30 and 73.20 <= lng <= 74.20:
        return "Pune", "Maharashtra", "India"
    if 12.70 <= lat <= 13.25 and 77.40 <= lng <= 77.80:
        return "Bangalore", "Karnataka", "India"
    if 12.10 <= lat <= 12.60 and 76.40 <= lng <= 77.30:
        return "Mysore", "Karnataka", "India"
    if 12.80 <= lat <= 13.25 and 80.00 <= lng <= 80.35:
        return "Chennai", "Tamil Nadu", "India"
    if 11.25 <= lat <= 11.45 and 76.75 <= lng <= 76.90:
        return "Coonoor", "Tamil Nadu", "India"
    if 11.35 <= lat <= 11.70 and 76.50 <= lng <= 76.78:
        return "Ooty", "Tamil Nadu", "India"
    if 10.85 <= lat <= 11.20 and 76.65 <= lng <= 77.15:
        return "Coimbatore", "Tamil Nadu", "India"
    if 10.60 <= lat <= 10.90 and 76.35 <= lng <= 76.80:
        return "Palakkad", "Kerala", "India"
    if 10.25 <= lat <= 10.55 and 76.85 <= lng <= 77.20:
        return "Valparai", "Tamil Nadu", "India"
    if 9.90 <= lat <= 10.25 and 76.85 <= lng <= 77.25:
        return "Munnar", "Kerala", "India"
    if 8.60 <= lat <= 9.00 and 76.70 <= lng <= 77.20:
        return "Thiruvananthapuram", "Kerala", "India"

    # Default fallback
    return "India", "India", "India"

def test_mapping():
    csv_path = os.path.join(os.path.dirname(__file__), 'app', 'data', 'tourist_places.csv')
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    dest_counts = {}
    for r in rows:
        lat = float(r['Latitude'])
        lng = float(r['Longitude'])
        name = r['Name'].strip()
        dest, state, country = assign_destination(lat, lng, name)
        dest_counts[dest] = dest_counts.get(dest, 0) + 1

    print("Destination mapping summary across dataset:")
    for d, c in sorted(dest_counts.items(), key=lambda x: -x[1]):
        print(f"  {d}: {c} places")

    print("\nPlaces mapped to India fallback:")
    for r in rows:
        lat = float(r['Latitude'])
        lng = float(r['Longitude'])
        name = r['Name'].strip()
        dest, state, country = assign_destination(lat, lng, name)
        if dest == "India":
            print(f"  #{r['DestinationID']}: {name} ({lat}, {lng}) - {r['Characteristics']}")

if __name__ == '__main__':
    test_mapping()
