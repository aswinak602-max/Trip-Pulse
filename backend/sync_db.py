"""
Authoritative Database Syncer for AI-Powered Intelligent Trip Planner.
Ingests and reconciles destination and place data from city_tourist_places.csv directly.
"""

from app.core.database import SessionLocal, Base, engine, ensure_schema_compatibility
from app.models.trip import Destination, Place
from app.data.dataset_loader import load_cleaned_dataset

def sync_dataset_to_db():
    Base.metadata.create_all(bind=engine)
    try:
        ensure_schema_compatibility()
    except Exception as e:
        print(f"Schema compatibility notice: {e}")

    dest_meta, places = load_cleaned_dataset()

    with SessionLocal() as db:
        print("=== AUTHORITATIVE SYNC TO SQLITE DATABASE ===")

        # 1. Sync / Update Destinations
        dest_map = {}
        for d in db.query(Destination).all():
            dest_map[d.name.lower()] = d

        added_dests = 0
        for dest_name, meta in dest_meta.items():
            key = dest_name.lower()
            if key not in dest_map:
                new_d = Destination(name=dest_name, **meta)
                db.add(new_d)
                db.commit()
                db.refresh(new_d)
                dest_map[key] = new_d
                added_dests += 1
                print(f"[NEW DESTINATION] Added {dest_name} ({meta['state']}, {meta['country']})")
            else:
                # Update metadata if needed
                d_obj = dest_map[key]
                for k, v in meta.items():
                    setattr(d_obj, k, v)
                db.commit()

        # 2. Clear old places and re-populate cleanly from source of truth
        db.query(Place).delete()
        db.commit()

        added_places = 0
        seen_keys = set()
        for p in places:
            p_name = p['name'].strip()
            target_dest_name = p['destination_name']
            dest_obj = dest_map.get(target_dest_name.lower())
            if not dest_obj:
                continue

            place_key = (dest_obj.id, p_name.lower())
            if place_key in seen_keys:
                continue
            seen_keys.add(place_key)

            place_data = {k: v for k, v in p.items() if k != 'destination_name'}
            new_place = Place(destination_id=dest_obj.id, **place_data)
            db.add(new_place)
            added_places += 1

        db.commit()
        print(f"[SUCCESS] Ingested {added_dests} new destinations and {added_places} places.")
        print(f"Total places in DB: {db.query(Place).count()}")
        print(f"Total destinations in DB: {db.query(Destination).count()}")

if __name__ == '__main__':
    sync_dataset_to_db()
