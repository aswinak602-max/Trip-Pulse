"""
Places Discovery Service.
Provides tourist attraction search, place details, coordinates, and photos strictly for matching destinations.
"""

import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.services.map_service import map_service

GLOBAL_TOURIST_PLACES: Dict[str, List[Dict[str, Any]]] = {
    "kanyakumari": [
        {
            "id": 1,
            "name": "Vivekananda Rock Memorial",
            "category": "Culture / Memorial",
            "description": "Monument on a sacred rock island where Swami Vivekananda meditated, at the confluence of three oceans.",
            "rating": 4.9, "latitude": 8.0780, "longitude": 77.5550,
            "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
            "address": "Kanyakumari, Tamil Nadu 629702", "opening_hours": "08:00 AM - 04:00 PM",
            "estimated_visit_hours": 2.5, "estimated_cost": 50.0, "is_indoor": False
        },
        {
            "id": 2,
            "name": "Thiruvalluvar Statue",
            "category": "History / Monument",
            "description": "Colossal 133-foot stone sculpture honoring the ancient Tamil poet and philosopher Thiruvalluvar.",
            "rating": 4.8, "latitude": 8.0772, "longitude": 77.5539,
            "image_url": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
            "address": "Kanyakumari Island, Tamil Nadu", "opening_hours": "08:00 AM - 04:00 PM",
            "estimated_visit_hours": 1.5, "estimated_cost": 30.0, "is_indoor": False
        },
        {
            "id": 3,
            "name": "Kanyakumari Beach & Sunset View Point",
            "category": "Beach / Coastal",
            "description": "Spectacular shoreline offering simultaneous sunset and moonrise over the Tri-Sea confluence.",
            "rating": 4.7, "latitude": 8.0820, "longitude": 77.5510,
            "image_url": "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
            "address": "Beach Road, Kanyakumari", "opening_hours": "Open 24 Hours",
            "estimated_visit_hours": 2.0, "estimated_cost": 0.0, "is_indoor": False
        },
        {
            "id": 4,
            "name": "Bhagavathi Amman Temple",
            "category": "Culture / Temple",
            "description": "Ancient 3,000-year-old temple dedicated to Goddess Kanya Kumari, famous for its glittering diamond nose ring.",
            "rating": 4.8, "latitude": 8.0805, "longitude": 77.5528,
            "image_url": "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=800&q=80",
            "address": "Main Road, Kanyakumari", "opening_hours": "04:30 AM - 12:30 PM, 04:00 PM - 08:30 PM",
            "estimated_visit_hours": 1.5, "estimated_cost": 0.0, "is_indoor": False
        },
        {
            "id": 5,
            "name": "Gandhi Memorial Mandapam",
            "category": "History / Memorial",
            "description": "Pink temple-style memorial built where Mahatma Gandhi's ashes were kept prior to immersion.",
            "rating": 4.6, "latitude": 8.0833, "longitude": 77.5540,
            "image_url": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",
            "address": "Beach Road, Kanyakumari", "opening_hours": "07:00 AM - 07:00 PM",
            "estimated_visit_hours": 1.0, "estimated_cost": 10.0, "is_indoor": True
        }
    ],
    "ooty": [
        {
            "id": 101,
            "name": "Ooty Lake & Boat House",
            "category": "Nature / Lake",
            "description": "Scenic 65-acre lake constructed in 1824 offering pedal, motor, and row boating surrounded by eucalyptus groves.",
            "rating": 4.5, "latitude": 11.4078, "longitude": 76.6883,
            "image_url": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
            "address": "North Lake Road, Ooty, Tamil Nadu 643001", "opening_hours": "09:00 AM - 06:00 PM",
            "estimated_visit_hours": 2.0, "estimated_cost": 250.0, "is_indoor": False
        },
        {
            "id": 102,
            "name": "Doddabetta Peak",
            "category": "Adventure / Mountain Peak",
            "description": "The highest mountain peak in the Nilgiris (2,637m) providing panoramic 360-degree views of the Western Ghats.",
            "rating": 4.6, "latitude": 11.4011, "longitude": 76.7369,
            "image_url": "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80",
            "address": "Ooty-Kotagiri Road, 9 km from Ooty", "opening_hours": "09:00 AM - 06:00 PM",
            "estimated_visit_hours": 2.0, "estimated_cost": 40.0, "is_indoor": False
        },
        {
            "id": 103,
            "name": "Government Botanical Garden",
            "category": "Nature / Botanical Reserve",
            "description": "55 acres of terraced exotic flora established in 1848 with a 20-million-year-old fossilized tree trunk.",
            "rating": 4.6, "latitude": 11.4172, "longitude": 76.7118,
            "image_url": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80",
            "address": "Vannarapettai, Ooty, Tamil Nadu 643002", "opening_hours": "07:00 AM - 06:30 PM",
            "estimated_visit_hours": 2.5, "estimated_cost": 50.0, "is_indoor": False
        },
        {
            "id": 104,
            "name": "Government Rose Garden",
            "category": "Nature / Floral Garden",
            "description": "The largest rose garden in India, perched on Elk Hill containing over 20,000 varieties of blooming roses.",
            "rating": 4.5, "latitude": 11.4060, "longitude": 76.7145,
            "image_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
            "address": "Elk Hill, Vijayanagaram, Ooty", "opening_hours": "08:30 AM - 06:00 PM",
            "estimated_visit_hours": 1.5, "estimated_cost": 40.0, "is_indoor": False
        },
        {
            "id": 105,
            "name": "Pykara Waterfalls & Lake",
            "category": "Nature / Waterfall",
            "description": "The sacred Pykara River cascades through shola rocks in two spectacular waterfalls surrounded by pine forests.",
            "rating": 4.7, "latitude": 11.5003, "longitude": 76.5982,
            "image_url": "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80",
            "address": "Pykara, 21 km from Ooty", "opening_hours": "08:30 AM - 05:30 PM",
            "estimated_visit_hours": 2.5, "estimated_cost": 175.0, "is_indoor": False
        }
    ],
    "munnar": [
        {
            "id": 201,
            "name": "Eravikulam National Park",
            "category": "Wildlife / Sanctuary",
            "description": "Sanctuary for the endangered mountain ibex (Nilgiri Tahr) with rolling grasslands and views of Anamudi Peak.",
            "rating": 4.8, "latitude": 10.1500, "longitude": 77.0600,
            "image_url": "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=800&q=80",
            "address": "Kannan Devan Hills, Munnar", "opening_hours": "07:30 AM - 04:00 PM",
            "estimated_visit_hours": 3.0, "estimated_cost": 200.0, "is_indoor": False
        },
        {
            "id": 202,
            "name": "Mattupetty Dam & Lake",
            "category": "Nature / Dam",
            "description": "Storage concrete gravity dam with speedboating and peaceful views of mist-covered tea plantations.",
            "rating": 4.6, "latitude": 10.1086, "longitude": 77.1238,
            "image_url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
            "address": "Mattupetty, Munnar", "opening_hours": "09:00 AM - 05:30 PM",
            "estimated_visit_hours": 2.0, "estimated_cost": 150.0, "is_indoor": False
        },
        {
            "id": 203,
            "name": "KDHP Tea Museum Munnar",
            "category": "Culture / Museum",
            "description": "Showcases the legacy of tea processing in Munnar with vintage machinery, documentary screenings, and tea tasting.",
            "rating": 4.5, "latitude": 10.0910, "longitude": 77.0550,
            "image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
            "address": "Nullatanni Estate, Munnar", "opening_hours": "09:00 AM - 05:00 PM",
            "estimated_visit_hours": 1.5, "estimated_cost": 125.0, "is_indoor": True
        }
    ],
    "paris": [
        {
            "id": 301,
            "name": "Eiffel Tower",
            "category": "History / Architectural Monument",
            "description": "The globally celebrated 330-meter wrought-iron landmark on Champ de Mars offering panoramic views over Paris.",
            "rating": 4.7, "latitude": 48.8584, "longitude": 2.2945,
            "image_url": "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80",
            "address": "Champ de Mars, 5 Av. Anatole France, 75007 Paris, France", "opening_hours": "09:30 AM - 11:45 PM",
            "estimated_visit_hours": 2.5, "estimated_cost": 2200.0, "is_indoor": False
        },
        {
            "id": 302,
            "name": "Louvre Museum",
            "category": "Culture / Fine Art Museum",
            "description": "The world's largest museum housing the Mona Lisa, Venus de Milo, and over 35,000 priceless historical works.",
            "rating": 4.8, "latitude": 48.8606, "longitude": 2.3376,
            "image_url": "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80",
            "address": "Rue de Rivoli, 75001 Paris, France", "opening_hours": "09:00 AM - 06:00 PM",
            "estimated_visit_hours": 4.0, "estimated_cost": 1500.0, "is_indoor": True
        }
    ]
}

class PlacesService:
    @classmethod
    async def fetch_places_for_destination(
        cls,
        destination: str,
        origin_lat: Optional[float] = None,
        origin_lng: Optional[float] = None,
        origin_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        dest_clean = destination.strip().lower()

        # Check in built-in global tourist places catalog first with exact city matching
        places_list = []
        for city_key, city_places in GLOBAL_TOURIST_PLACES.items():
            if city_key == dest_clean or city_key in dest_clean or dest_clean in city_key:
                places_list = list(city_places)
                break

        # If not found directly and Google Places API key is present, search specifically for that destination
        if not places_list and settings.GOOGLE_MAPS_API_KEY:
            try:
                url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?query=tourist+attractions+in+{destination}&key={settings.GOOGLE_MAPS_API_KEY}"
                async with httpx.AsyncClient(timeout=4.0) as client:
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        results = data.get("results", [])
                        for idx, item in enumerate(results[:8]):
                            loc = item.get("geometry", {}).get("location", {})
                            places_list.append({
                                "id": 5000 + idx,
                                "name": item.get("name", f"{destination.title()} Attraction"),
                                "category": "Tourist Attraction",
                                "description": f"Famous point of interest in {destination.title()}.",
                                "rating": item.get("rating", 4.5),
                                "latitude": loc.get("lat", 11.4102),
                                "longitude": loc.get("lng", 76.6950),
                                "image_url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
                                "address": item.get("formatted_address", f"{destination.title()}"),
                                "opening_hours": "09:00 AM - 06:00 PM",
                                "estimated_visit_hours": 2.0,
                                "estimated_cost": 100.0,
                                "is_indoor": False
                            })
            except Exception as e:
                print(f"Google Places API query failed: {e}")

        # If no places match this destination, return empty list (NEVER inject random default places)
        if not places_list:
            return []

        # Calculate distances if origin coordinates / origin name provided
        o_lat = origin_lat
        o_lng = origin_lng
        if o_lat is None and origin_name:
            c = map_service.get_city_coords(origin_name)
            o_lat, o_lng = c[0], c[1]

        results = []
        for p in places_list:
            p_copy = dict(p)
            if o_lat is not None and o_lng is not None:
                dist = map_service.haversine_distance(o_lat, o_lng, p["latitude"], p["longitude"])
                p_copy["distance_from_origin_km"] = round(dist * 1.2, 1)
            results.append(p_copy)

        return results

places_service = PlacesService()
