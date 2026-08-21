import csv
import re
import os
from collections import defaultdict

def analyze():
    csv_path = os.path.join(os.path.dirname(__file__), 'app', 'data', 'tourist_places.csv')
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Total rows in CSV: {len(rows)}")

    seen_names = {}
    seen_coords = {}
    name_duplicates = []
    coord_duplicates = []

    for idx, r in enumerate(rows):
        raw_name = r['Name'].strip()
        norm_name = re.sub(r'[^a-z0-9]', '', raw_name.lower())
        lat = round(float(r['Latitude']), 4)
        lng = round(float(r['Longitude']), 4)
        
        if norm_name in seen_names:
            name_duplicates.append((seen_names[norm_name], idx + 1, raw_name, rows[seen_names[norm_name]-1]['Name']))
        else:
            seen_names[norm_name] = idx + 1
            
        coord = (lat, lng)
        if coord in seen_coords:
            coord_duplicates.append((seen_coords[coord], idx + 1, coord, raw_name, rows[seen_coords[coord]-1]['Name']))
        else:
            seen_coords[coord] = idx + 1

    print(f"\nDuplicate normalized names found: {len(name_duplicates)}")
    for d in name_duplicates:
        print(f"  Row {d[1]} is duplicate name of Row {d[0]}: '{d[2]}' vs '{d[3]}'")

    print(f"\nDuplicate coordinates found: {len(coord_duplicates)}")
    for d in coord_duplicates:
        print(f"  Row {d[1]} is duplicate coords of Row {d[0]}: {d[2]} | '{d[3]}' vs '{d[4]}'")

    from app.core.database import SessionLocal
    from app.models.trip import Place, Destination

    with SessionLocal() as db:
        db_places = db.query(Place).all()
        print(f"\nExisting DB places count: {len(db_places)}")
        existing_names = set()
        for p in db_places:
            d_name = p.destination.name if p.destination else "None"
            existing_names.add(re.sub(r'[^a-z0-9]', '', p.name.lower()))
            print(f"  ID {p.id}: {p.name} ({d_name})")

        overlap = []
        for idx, r in enumerate(rows):
            norm = re.sub(r'[^a-z0-9]', '', r['Name'].lower())
            if norm in existing_names:
                overlap.append((idx + 1, r['Name']))
        print(f"\nPlaces in CSV overlapping with existing DB places: {len(overlap)}")
        for o in overlap:
            print(f"  Row {o[0]}: {o[1]}")

if __name__ == '__main__':
    analyze()
