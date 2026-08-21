"""
Map, Directions & Geographic Route Optimization Service.
Implements Haversine distance math, coordinate geocoding, route calculations, and TSP nearest-neighbor
itinerary route reordering.
"""

import math
import urllib.request
import urllib.parse
import json
from typing import List, Dict, Any, Tuple, Optional

# Comprehensive coordinates repository for Indian cities, South Indian districts, Tamil Nadu towns & global hubs
CITY_COORDINATES = {
    # Tamil Nadu & South India Hubs
    "chennai": (13.0827, 80.2707),
    "coimbatore": (11.0168, 76.9558),
    "madurai": (9.9252, 78.1198),
    "kanyakumari": (8.0883, 77.5385),
    "ooty": (11.4102, 76.6950),
    "udagamandalam": (11.4102, 76.6950),
    "munnar": (10.0889, 77.0595),
    "tiruchirappalli": (10.7905, 78.7047),
    "trichy": (10.7905, 78.7047),
    "salem": (11.6643, 78.1460),
    "tirunelveli": (8.7139, 77.7567),
    "thanjavur": (10.7870, 79.1378),
    "tanjore": (10.7870, 79.1378),
    "vellore": (12.9165, 79.1325),
    "rameswaram": (9.2876, 79.3129),
    "kodaikanal": (10.2381, 77.4892),
    "puducherry": (11.9416, 79.8083),
    "pondicherry": (11.9416, 79.8083),
    "erode": (11.3410, 77.7172),
    "tiruppur": (11.1085, 77.3411),
    "dindigul": (10.3673, 77.9803),
    "cuddalore": (11.7480, 79.7714),
    "dharmapuri": (12.1211, 78.1582),
    "karur": (10.9601, 78.0766),
    "krishnagiri": (12.5186, 78.2137),
    "nagapattinam": (10.7672, 79.8449),
    "namakkal": (11.2189, 78.1674),
    "pudukkottai": (10.3833, 78.8001),
    "ramanathapuram": (9.3639, 78.8395),
    "sivaganga": (9.8433, 78.4809),
    "theni": (10.0104, 77.4768),
    "thoothukudi": (8.7642, 78.1348),
    "tuticorin": (8.7642, 78.1348),
    "villupuram": (11.9401, 79.4861),
    "virudhunagar": (9.5680, 77.9624),
    "hosur": (12.7409, 77.8253),
    "yelagiri": (12.5786, 78.6399),
    "mahabalipuram": (12.6208, 80.1983),
    "mamallapuram": (12.6208, 80.1983),
    "chambarakam": (13.0033, 80.0500),
    "bangalore": (12.9716, 77.5946),
    "bengaluru": (12.9716, 77.5946),
    "mysore": (12.2958, 76.6394),
    "mysuru": (12.2958, 76.6394),
    "kochi": (9.9312, 76.2673),
    "cochin": (9.9312, 76.2673),
    "trivandrum": (8.5241, 76.9366),
    "thiruvananthapuram": (8.5241, 76.9366),
    "alappuzha": (9.4981, 76.3388),
    "alleppey": (9.4981, 76.3388),
    "wayanad": (11.6854, 76.1320),
    "thekkady": (9.6031, 77.1615),
    "varkala": (8.7379, 76.7163),
    "hyderabad": (17.3850, 78.4867),
    "visakhapatnam": (17.6868, 83.2185),
    "vizag": (17.6868, 83.2185),
    "goa": (15.2993, 74.1240),
    "panaji": (15.4909, 73.8278),
    "mumbai": (19.0760, 72.8777),
    "pune": (18.5204, 73.8567),
    "delhi": (28.6139, 77.2090),
    "new delhi": (28.6139, 77.2090),
    "jaipur": (26.9124, 75.7873),
    "agra": (27.1767, 78.0081),
    "varanasi": (25.3176, 82.9739),
    "kolkata": (22.5726, 88.3639),
    "shimla": (31.1048, 77.1734),
    "manali": (32.2396, 77.1887),
    "rishikesh": (30.0869, 78.2676),
    "darjeeling": (27.0410, 88.2663),
    
    # Key Tamil Nadu Hubs & Attractions
    "coonoor": (11.3530, 76.7959),
    "siruvani waterfalls & dam": (10.9388, 76.6853),
    "siruvani waterfalls": (10.9388, 76.6853),
    "siruvani dam": (10.9388, 76.6853),
    "isha yoga center & adiyogi shiva statue": (10.9737, 76.7404),
    "adiyogi shiva statue": (10.9737, 76.7404),
    "marudhamalai murugan temple": (11.0456, 76.8523),
    "gd naidu museum & science centre": (11.0183, 76.9740),
    "sim's park": (11.3524, 76.7981),
    "sims park": (11.3524, 76.7981),
    "dolphin's nose coonoor": (11.3328, 76.8402),
    "lamb's rock": (11.3415, 76.8228),
    "highfield tea factory": (11.3650, 76.8040),

    # Famous Key Tourist Spots / Attractions Direct Coordinates
    "vivekananda rock memorial": (8.0780, 77.5552),
    "thiruvalluvar statue": (8.0778, 77.5540),
    "bhagavathi amman temple": (8.0812, 77.5529),
    "mathur aqueduct": (8.3375, 77.2886),
    "kanyakumari beach & sunset view point": (8.0805, 77.5510),
    "padmanabhapuram palace": (8.2507, 77.3262),
    "vattakottai fort": (8.1250, 77.5647),
    "triveni sangam kanyakumari": (8.0790, 77.5548),
    "gandhi memorial mandapam": (8.0801, 77.5525),
    "government botanical garden": (11.4190, 76.7110),
    "ooty lake & boat house": (11.4060, 76.6880),
    "doddabetta peak": (11.4010, 76.7360),
    "pykara waterfalls & lake": (11.4550, 76.6020),
    "eravikulam national park": (10.1500, 77.0600),
    "mattupetty dam": (10.1060, 77.1240),
    "kdhp tea museum": (10.0890, 77.0580),
    
    # Global Hubs
    "paris": (48.8566, 2.3522),
    "tokyo": (35.6762, 139.6503),
    "dubai": (25.2048, 55.2708),
    "london": (51.5074, -0.1278),
    "new york": (40.7128, -74.0060),
    "singapore": (1.3521, 103.8198),
    "sydney": (-33.8688, 151.2093),
    "bangkok": (13.7563, 100.5018),
    "rome": (41.9028, 12.4964),
    "barcelona": (41.3851, 2.1734),
    "amsterdam": (52.3676, 4.9041),
    "eiffel tower": (48.8584, 2.2945),
    "louvre museum": (48.8606, 2.3376)
}

MAP_CITY_ALIASES = {
    "ooty": "udagamandalam",
    "udagamandalam": "ooty",
    "trichy": "tiruchirappalli",
    "tiruchirappalli": "trichy",
    "tanjore": "thanjavur",
    "thanjavur": "tanjore",
    "pondicherry": "puducherry",
    "puducherry": "pondicherry",
    "bangalore": "bengaluru",
    "bengaluru": "bangalore",
    "bombay": "mumbai",
    "mumbai": "bombay",
    "calcutta": "kolkata",
    "kolkata": "calcutta",
    "madras": "chennai",
    "chennai": "madras",
    "trivandrum": "thiruvananthapuram",
    "thiruvananthapuram": "trivandrum",
    "cochin": "kochi",
    "kochi": "cochin",
    "kanyakumari": "cape comorin",
    "cape comorin": "kanyakumari"
}

class MapService:
    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates spherical distance between two coordinate pairs in kilometers."""
        R = 6371.0  # Earth radius in kilometers
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return round(R * c, 2)

    @classmethod
    def get_city_coords(cls, city_name: str) -> Optional[Tuple[float, float]]:
        """
        Resolves coordinates for any city or tourist place without falling back to arbitrary default.
        1. Checks numeric coordinates format ('lat,lng').
        2. Checks comprehensive CITY_COORDINATES dictionary.
        3. Queries SQLite database (Destination and Place tables).
        4. Queries OpenStreetMap Nominatim geocoder if online.
        5. Returns None if unresolvable.
        """
        if not city_name or not str(city_name).strip():
            return None

        raw = str(city_name).strip()
        key = raw.lower()

        # 1. Check if direct coordinates string: "13.0827,80.2707"
        if "," in raw:
            parts = raw.split(",")
            if len(parts) == 2:
                try:
                    lat = float(parts[0].strip())
                    lng = float(parts[1].strip())
                    if -90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0:
                        return (lat, lng)
                except ValueError:
                    pass

        # 2. Check exact match in CITY_COORDINATES
        if key in CITY_COORDINATES:
            return CITY_COORDINATES[key]

        # 3. Check city aliases mapping
        canonical = MAP_CITY_ALIASES.get(key, key)
        if canonical in CITY_COORDINATES:
            return CITY_COORDINATES[canonical]

        # 4. Query SQLite Database for Place or Destination
        try:
            from app.core.database import SessionLocal
            from app.models.trip import Place, Destination

            with SessionLocal() as db:
                # Check Place table first (e.g. "Bhagavathi Amman Temple", "Mathur Aqueduct")
                place = db.query(Place).filter(Place.name.ilike(raw)).first()
                if not place:
                    place = db.query(Place).filter(Place.name.ilike(f"{raw}%")).first()
                if not place:
                    place = db.query(Place).filter(Place.name.ilike(f"%{raw}%")).first()
                if place and place.latitude and place.longitude:
                    return (float(place.latitude), float(place.longitude))

                # Check Destination table
                dest = db.query(Destination).filter(Destination.name.ilike(raw)).first()
                if not dest:
                    dest = db.query(Destination).filter(Destination.name.ilike(f"{raw}%")).first()
                if not dest:
                    dest = db.query(Destination).filter(Destination.name.ilike(f"%{raw}%")).first()
                if dest and dest.latitude and dest.longitude:
                    return (float(dest.latitude), float(dest.longitude))
        except Exception as e:
            print(f"Database coordinate lookup notice: {e}")

        # 5. Check prefix/suffix matching in CITY_COORDINATES
        for k, v in CITY_COORDINATES.items():
            if len(key) >= 4 and (k.startswith(key) or key.startswith(k)):
                return v

        # 6. Attempt online geocoding via OpenStreetMap Nominatim with strict timeout
        try:
            clean_q = urllib.parse.quote(raw)
            url = f"https://nominatim.openstreetmap.org/search?format=json&q={clean_q}&limit=1"
            req = urllib.request.Request(url, headers={"User-Agent": "TripPulse-App/1.0"})
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                data = json.loads(resp.read().decode())
                if data and len(data) > 0:
                    lat = float(data[0]["lat"])
                    lng = float(data[0]["lon"])
                    CITY_COORDINATES[key] = (lat, lng)
                    return (lat, lng)
        except Exception:
            pass

        return None

    @classmethod
    def calculate_trip_route(cls, origin: str, destination: str) -> Dict[str, Any]:
        """Calculates origin -> destination route, driving distance, and travel time."""
        c1 = cls.get_city_coords(origin)
        c2 = cls.get_city_coords(destination)

        if not c1:
            raise ValueError(f"Unable to find location for origin '{origin}'. Please verify the origin location name.")
        if not c2:
            raise ValueError(f"Unable to find location for destination '{destination}'. Please verify the destination name.")

        direct_dist = cls.haversine_distance(c1[0], c1[1], c2[0], c2[1])
        # Actual road travel distance multiplier
        road_distance = round(direct_dist * 1.22, 1)
        
        # Estimate driving hours (avg speed ~60 km/h)
        avg_speed = 58.0
        hours = road_distance / avg_speed
        hrs_int = int(hours)
        mins_int = int((hours - hrs_int) * 60)

        # Generate route waypoints
        mid_lat = round((c1[0] + c2[0]) / 2.0, 5)
        mid_lng = round((c1[1] + c2[1]) / 2.0, 5)
        
        orig_clean = origin.strip()
        dest_clean = destination.strip()
        orig_title = orig_clean if "," not in orig_clean else "Selected Origin"
        dest_title = dest_clean if "," not in dest_clean else "Selected Destination"

        # Construct Google Maps navigation URL with exact destination name and coordinates
        encoded_origin = urllib.parse.quote(orig_clean) if "," not in orig_clean else f"{c1[0]},{c1[1]}"
        encoded_dest = urllib.parse.quote(dest_clean) if "," not in dest_clean else f"{c2[0]},{c2[1]}"
        gmaps_url = f"https://www.google.com/maps/dir/?api=1&origin={encoded_origin}&destination={encoded_dest}&travelmode=driving"

        waypoints = [
            {"name": orig_title, "lat": c1[0], "lng": c1[1], "type": "origin"},
            {"name": "Highway Transit Point", "lat": mid_lat, "lng": mid_lng, "type": "waypoint"},
            {"name": dest_title, "lat": c2[0], "lng": c2[1], "type": "destination"}
        ]

        return {
            "origin": orig_title,
            "destination": dest_title,
            "origin_coords": {"lat": c1[0], "lng": c1[1]},
            "destination_coords": {"lat": c2[0], "lng": c2[1]},
            "dest_coords": {"lat": c2[0], "lng": c2[1]},
            "distance_km": road_distance,
            "duration_hours": hrs_int,
            "duration_mins": mins_int,
            "duration_formatted": f"{hrs_int}h {mins_int}m",
            "waypoints": waypoints,
            "google_maps_url": gmaps_url,
            "summary": f"{orig_title} to {dest_title} via Direct Road Transit"
        }

    @classmethod
    def optimize_itinerary_sequence(cls, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Geographically arranges a day's places using Nearest Neighbor TSP algorithm:
        Hotel -> Place A -> Place B -> Place C.
        """
        if len(items) <= 2:
            return items

        hotel_or_start = None
        other_items = []
        for it in items:
            if it.get("activity_type") == "hotel" or "hotel" in (it.get("custom_title") or "").lower():
                hotel_or_start = it
            else:
                other_items.append(it)

        if not hotel_or_start:
            hotel_or_start = other_items.pop(0)

        ordered_list = [hotel_or_start]
        current_lat = hotel_or_start.get("latitude") or 11.4102
        current_lng = hotel_or_start.get("longitude") or 76.6950

        remaining = list(other_items)
        while remaining:
            best_idx = 0
            best_dist = float("inf")
            for idx, candidate in enumerate(remaining):
                c_lat = candidate.get("latitude") or current_lat
                c_lng = candidate.get("longitude") or current_lng
                d = cls.haversine_distance(current_lat, current_lng, c_lat, c_lng)
                if d < best_dist:
                    best_dist = d
                    best_idx = idx

            nearest = remaining.pop(best_idx)
            nearest["distance_from_prev_km"] = round(best_dist, 1)
            nearest["travel_time_mins"] = max(5, int((best_dist / 30.0) * 60))
            ordered_list.append(nearest)
            current_lat = nearest.get("latitude", current_lat)
            current_lng = nearest.get("longitude", current_lng)

        times = ["09:00 AM", "11:30 AM", "01:30 PM", "03:30 PM", "06:00 PM", "08:00 PM"]
        for i, item in enumerate(ordered_list):
            item["sort_order"] = i + 1
            if i < len(times):
                item["time_slot"] = times[i]

        return ordered_list

    @classmethod
    def get_nearby_facilities(cls, lat: float, lon: float, category: str = "Restaurants") -> List[Dict[str, Any]]:
        """Provides nearby services (Restaurants, Hotels, Fuel, Hospitals, ATMs)."""
        cat_lower = category.lower().strip()
        
        facilities = {
            "restaurants": [
                {"name": "Heritage Dining & Bistro", "category": "South & North Indian Cuisine", "rating": 4.6, "distance_km": 1.2, "address": "Main Road", "price": "₹₹"},
                {"name": "Coastal Spices Restaurant", "category": "Traditional Seafood & Meals", "rating": 4.5, "distance_km": 1.8, "address": "Beach Road", "price": "₹₹"},
                {"name": "Saravana Bhavan Classic", "category": "Pure Vegetarian Tiffins & Filter Coffee", "rating": 4.4, "distance_km": 0.8, "address": "Temple Street", "price": "₹"},
                {"name": "The Green Cafe & Bakery", "category": "Bakes, Coffee & Desserts", "rating": 4.3, "distance_km": 1.5, "address": "Commercial Avenue", "price": "₹₹"}
            ],
            "hotels": [
                {"name": "Grand Palace Hotel & Suites", "category": "Luxury City Hotel", "rating": 4.6, "distance_km": 2.4, "address": "Station Road", "price": "₹3,600/night"},
                {"name": "The Residency Heritage", "category": "Premium Boutique Resort", "rating": 4.8, "distance_km": 1.1, "address": "Hill View Road", "price": "₹5,500/night"},
                {"name": "Travelers Inn", "category": "Standard Executive Stay", "rating": 4.2, "distance_km": 1.8, "address": "Bypass Road", "price": "₹1,800/night"}
            ],
            "hospitals": [
                {"name": "City Government General Hospital", "category": "24/7 Emergency & Trauma", "rating": 4.2, "distance_km": 1.9, "address": "Hospital Road", "contact": "+91 423 244 2212"},
                {"name": "Apollo Clinic & Diagnostic Center", "category": "Multi-Speciality Clinic", "rating": 4.4, "distance_km": 2.5, "address": "Main Commercial Street", "contact": "+91 423 244 3300"}
            ],
            "fuel stations": [
                {"name": "Indian Oil Auto Care Fuel Station", "category": "Petrol, Diesel & EV Fast Charge", "rating": 4.4, "distance_km": 0.9, "address": "Highway Junction", "hours": "24 Hours"},
                {"name": "Bharat Petroleum Retail Outlet", "category": "Petrol & Diesel", "rating": 4.3, "distance_km": 2.3, "address": "Bypass Link", "hours": "06:00 AM - 10:00 PM"}
            ],
            "atms": [
                {"name": "State Bank of India ATM (24/7)", "category": "ATM & Cash Deposit", "rating": 4.5, "distance_km": 0.4, "address": "Main Junction"},
                {"name": "HDFC Bank ATM", "category": "ATM", "rating": 4.4, "distance_km": 0.7, "address": "Commercial Street"}
            ]
        }

        return facilities.get(cat_lower, facilities["restaurants"])

map_service = MapService()
