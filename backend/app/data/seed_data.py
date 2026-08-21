"""
Seed data generator for AI-Powered Intelligent Trip Planner.
Provides a rich catalog of global & Indian destinations, places, 9D interest scores,
indoor/outdoor classifications, and pre-configured test scenarios.
"""

from sqlalchemy.orm import Session
from app.models.trip import Destination, Place, Trip, TripMember, ItineraryItem, Expense, Reservation, ChecklistItem
from app.models.user import User
from app.core.security import get_password_hash
import json

DESTINATIONS_DATA = [
    {
        "name": "Ooty",
        "country": "India",
        "state": "Tamil Nadu",
        "description": "The Queen of Hill Stations in the Nilgiri Hills, renowned for lush tea gardens, mist-clad peaks, colonial architecture, and serene lakes.",
        "hero_image": "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to June",
        "latitude": 11.4102,
        "longitude": 76.6950,
        "popularity": 4.8,
        "tags": "Hill Station, Tea Gardens, Nature, Lakes, Mountains",
        "places": [
            {
                "name": "Avalanche Lake",
                "category": "Nature",
                "description": "A pristine mountain lake surrounded by rolling emerald hills, blooming rhododendrons, and crystal clear trout-filled streams. Ideal for landscape photography and nature walks.",
                "rating": 4.8,
                "popularity": 92.0,
                "latitude": 11.2986,
                "longitude": 76.5925,
                "image_url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
                "address": "Avalanche Valley, 28 km from Ooty",
                "opening_hours": "08:00 AM - 05:00 PM",
                "estimated_visit_hours": 3.0,
                "estimated_cost": 150.0,
                "is_indoor": False,
                "nature_score": 0.95,
                "adventure_score": 0.85,
                "history_score": 0.10,
                "beach_score": 0.00,
                "wildlife_score": 0.70,
                "culture_score": 0.20,
                "food_score": 0.20,
                "photography_score": 0.98,
                "family_score": 0.85,
            },
            {
                "name": "Government Botanical Garden",
                "category": "Nature",
                "description": "Sprawling across 55 acres of terraced gardens established in 1848, featuring thousands of exotic flora species, a 20-million-year-old fossilized tree trunk, and Italian flower beds.",
                "rating": 4.6,
                "popularity": 95.0,
                "latitude": 11.4172,
                "longitude": 76.7118,
                "image_url": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80",
                "address": "Vannarapettai, Ooty, Tamil Nadu 643002",
                "opening_hours": "07:00 AM - 06:30 PM",
                "estimated_visit_hours": 2.5,
                "estimated_cost": 50.0,
                "is_indoor": False,
                "nature_score": 0.92,
                "adventure_score": 0.30,
                "history_score": 0.45,
                "beach_score": 0.00,
                "wildlife_score": 0.40,
                "culture_score": 0.50,
                "food_score": 0.20,
                "photography_score": 0.90,
                "family_score": 0.95,
            },
            {
                "name": "Doddabetta Peak",
                "category": "Adventure",
                "description": "The highest peak in the Nilgiri mountain range standing at 2,637 meters. Provides breathtaking 360-degree panoramic views of the Western Ghats with an observatory telescope.",
                "rating": 4.5,
                "popularity": 90.0,
                "latitude": 11.4011,
                "longitude": 76.7369,
                "image_url": "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80",
                "address": "Ooty-Kotagiri Road, 9 km from Ooty",
                "opening_hours": "09:00 AM - 06:00 PM",
                "estimated_visit_hours": 2.0,
                "estimated_cost": 40.0,
                "is_indoor": False,
                "nature_score": 0.90,
                "adventure_score": 0.85,
                "history_score": 0.15,
                "beach_score": 0.00,
                "wildlife_score": 0.30,
                "culture_score": 0.15,
                "food_score": 0.20,
                "photography_score": 0.95,
                "family_score": 0.80,
            },
            {
                "name": "Ooty Tea Factory & Tea Museum",
                "category": "Culture",
                "description": "An interactive, covered factory where visitors watch the step-by-step processing of orthodox black tea leaves, learn about Nilgiri tea history, and enjoy freshly brewed cardamom tea.",
                "rating": 4.4,
                "popularity": 88.0,
                "latitude": 11.4190,
                "longitude": 76.7310,
                "image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
                "address": "Doddabetta Road, Ooty",
                "opening_hours": "09:00 AM - 06:30 PM",
                "estimated_visit_hours": 1.5,
                "estimated_cost": 100.0,
                "is_indoor": True,
                "nature_score": 0.60,
                "adventure_score": 0.20,
                "history_score": 0.75,
                "beach_score": 0.00,
                "wildlife_score": 0.10,
                "culture_score": 0.90,
                "food_score": 0.85,
                "photography_score": 0.70,
                "family_score": 0.90,
            },
            {
                "name": "Ooty Lake & Boat House",
                "category": "Family",
                "description": "An artificial lake constructed in 1824 by John Sullivan stretching over 65 acres. Offers motorized, pedal, and row boating framed by towering eucalyptus groves.",
                "rating": 4.3,
                "popularity": 94.0,
                "latitude": 11.4078,
                "longitude": 76.6883,
                "image_url": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
                "address": "North Lake Road, Ooty",
                "opening_hours": "09:00 AM - 06:00 PM",
                "estimated_visit_hours": 2.0,
                "estimated_cost": 250.0,
                "is_indoor": False,
                "nature_score": 0.80,
                "adventure_score": 0.50,
                "history_score": 0.35,
                "beach_score": 0.00,
                "wildlife_score": 0.20,
                "culture_score": 0.30,
                "food_score": 0.40,
                "photography_score": 0.78,
                "family_score": 0.95,
            },
            {
                "name": "Pykara Waterfalls & Lake",
                "category": "Nature",
                "description": "The sacred Pykara River cascades through the shola forests in two picturesque falls, opening up to a serene reservoir offering speedboat rides amid dense pine woods.",
                "rating": 4.7,
                "popularity": 89.0,
                "latitude": 11.5003,
                "longitude": 76.5982,
                "image_url": "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80",
                "address": "Pykara, 21 km on Mysore Highway",
                "opening_hours": "08:30 AM - 05:30 PM",
                "estimated_visit_hours": 2.5,
                "estimated_cost": 175.0,
                "is_indoor": False,
                "nature_score": 0.96,
                "adventure_score": 0.75,
                "history_score": 0.10,
                "beach_score": 0.00,
                "wildlife_score": 0.50,
                "culture_score": 0.20,
                "food_score": 0.20,
                "photography_score": 0.95,
                "family_score": 0.85,
            },
            {
                "name": "Nilgiri Mountain Railway (Toy Train)",
                "category": "History",
                "description": "UNESCO World Heritage 1,000 mm meter-gauge rack railway built by the British in 1908. Passes through 16 tunnels, 250 bridges, and scenic tea hills from Mettupalayam to Ooty.",
                "rating": 4.8,
                "popularity": 96.0,
                "latitude": 11.4055,
                "longitude": 76.6970,
                "image_url": "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?auto=format&fit=crop&w=800&q=80",
                "address": "Ooty Railway Station",
                "opening_hours": "06:00 AM - 06:00 PM",
                "estimated_visit_hours": 3.5,
                "estimated_cost": 300.0,
                "is_indoor": True,
                "nature_score": 0.85,
                "adventure_score": 0.60,
                "history_score": 0.95,
                "beach_score": 0.00,
                "wildlife_score": 0.30,
                "culture_score": 0.85,
                "food_score": 0.20,
                "photography_score": 0.92,
                "family_score": 0.95,
            },
            {
                "name": "Government Rose Garden",
                "category": "Nature",
                "description": "The largest rose garden in India perched at 2,200m on the slopes of Elk Hill, containing over 20,000 varieties of roses in terraced arcades.",
                "rating": 4.5,
                "popularity": 86.0,
                "latitude": 11.4060,
                "longitude": 76.7145,
                "image_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
                "address": "Elk Hill, Vijayanagaram, Ooty",
                "opening_hours": "08:30 AM - 06:00 PM",
                "estimated_visit_hours": 1.5,
                "estimated_cost": 40.0,
                "is_indoor": False,
                "nature_score": 0.90,
                "adventure_score": 0.15,
                "history_score": 0.20,
                "beach_score": 0.00,
                "wildlife_score": 0.10,
                "culture_score": 0.30,
                "food_score": 0.10,
                "photography_score": 0.92,
                "family_score": 0.90,
            },
            {
                "name": "Honey & Bee Museum (Indoor Alternative)",
                "category": "Culture",
                "description": "A unique indoor museum by the Keystone Foundation presenting the ecology, tribal beekeeping traditions of the Nilgiri Biosphere Reserve, live hive demonstrations, and pure wild honey tasting.",
                "rating": 4.4,
                "popularity": 80.0,
                "latitude": 11.4115,
                "longitude": 76.7025,
                "image_url": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80",
                "address": "Club Road, Near Co-operative Store, Ooty",
                "opening_hours": "09:30 AM - 06:30 PM",
                "estimated_visit_hours": 1.5,
                "estimated_cost": 50.0,
                "is_indoor": True,
                "nature_score": 0.70,
                "adventure_score": 0.20,
                "history_score": 0.60,
                "beach_score": 0.00,
                "wildlife_score": 0.65,
                "culture_score": 0.85,
                "food_score": 0.75,
                "photography_score": 0.60,
                "family_score": 0.90,
            },
            {
                "name": "Thunder World & Snow Park (Indoor Attraction)",
                "category": "Family",
                "description": "An all-weather indoor entertainment complex with animatronic dinosaur models, vortex 5D cinema, rain forest simulations, and an indoor snow room.",
                "rating": 4.2,
                "popularity": 82.0,
                "latitude": 11.4042,
                "longitude": 76.6908,
                "image_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80",
                "address": "Opposite Lake, Fern Hill Road, Ooty",
                "opening_hours": "09:00 AM - 07:00 PM",
                "estimated_visit_hours": 2.0,
                "estimated_cost": 350.0,
                "is_indoor": True,
                "nature_score": 0.30,
                "adventure_score": 0.65,
                "history_score": 0.20,
                "beach_score": 0.00,
                "wildlife_score": 0.30,
                "culture_score": 0.15,
                "food_score": 0.30,
                "photography_score": 0.60,
                "family_score": 0.98,
            },
            {
                "name": "St. Stephen's Church",
                "category": "History",
                "description": "Constructed in 1829 using timber salvaged from Tipu Sultan's island palace at Srirangapatna, boasting stained glass windows and peaceful colonial architecture.",
                "rating": 4.5,
                "popularity": 78.0,
                "latitude": 11.4140,
                "longitude": 76.7020,
                "image_url": "https://images.unsplash.com/photo-1548625361-19597330761e?auto=format&fit=crop&w=800&q=80",
                "address": "Club Road, Upper Bazar, Ooty",
                "opening_hours": "10:00 AM - 05:00 PM",
                "estimated_visit_hours": 1.0,
                "estimated_cost": 0.0,
                "is_indoor": True,
                "nature_score": 0.30,
                "adventure_score": 0.10,
                "history_score": 0.95,
                "beach_score": 0.00,
                "wildlife_score": 0.05,
                "culture_score": 0.90,
                "food_score": 0.05,
                "photography_score": 0.80,
                "family_score": 0.75,
            }
        ]
    },
    {
        "name": "Chennai",
        "country": "India",
        "state": "Tamil Nadu",
        "description": "The vibrant capital of Tamil Nadu on the Coromandel Coast, famed for ancient Dravidian temples, classical music, Marina Beach, and rich culinary heritage.",
        "hero_image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
        "best_time": "November to February",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "popularity": 4.6,
        "tags": "Coastal, Temples, Culture, Beach, Metropolitan",
        "places": [
            {
                "name": "Marina Beach",
                "category": "Beach",
                "description": "One of the longest natural urban beaches in the world, stretching over 13 km with lively evening stalls, lighthouse views, and sea breezes.",
                "rating": 4.5,
                "popularity": 95.0,
                "latitude": 13.0500,
                "longitude": 80.2824,
                "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
                "address": "Marina Beach Promenade, Chennai",
                "opening_hours": "Open 24 Hours",
                "estimated_visit_hours": 2.5,
                "estimated_cost": 50.0,
                "is_indoor": False,
                "nature_score": 0.75,
                "adventure_score": 0.40,
                "history_score": 0.30,
                "beach_score": 0.98,
                "wildlife_score": 0.15,
                "culture_score": 0.70,
                "food_score": 0.85,
                "photography_score": 0.88,
                "family_score": 0.92,
            },
            {
                "name": "Government Museum & Art Gallery (Indoor)",
                "category": "History",
                "description": "Established in 1851, the second oldest museum in India featuring rich collections of Chola bronze sculptures, Amaravati marble reliefs, and archeology.",
                "rating": 4.6,
                "popularity": 86.0,
                "latitude": 13.0697,
                "longitude": 80.2575,
                "image_url": "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=800&q=80",
                "address": "Pantheon Road, Egmore, Chennai",
                "opening_hours": "09:30 AM - 05:00 PM",
                "estimated_visit_hours": 2.5,
                "estimated_cost": 50.0,
                "is_indoor": True,
                "nature_score": 0.15,
                "adventure_score": 0.10,
                "history_score": 0.98,
                "beach_score": 0.00,
                "wildlife_score": 0.10,
                "culture_score": 0.95,
                "food_score": 0.10,
                "photography_score": 0.75,
                "family_score": 0.85,
            },
            {
                "name": "Kapaleeshwarar Temple",
                "category": "Culture",
                "description": "A 7th-century masterpiece of Dravidian temple architecture in Mylapore dedicated to Lord Shiva, renowned for its towering, colorful Gopuram.",
                "rating": 4.8,
                "popularity": 92.0,
                "latitude": 13.0336,
                "longitude": 80.2694,
                "image_url": "https://images.unsplash.com/photo-1609766418204-94aae0ecfddc?auto=format&fit=crop&w=800&q=80",
                "address": "Mylapore, Chennai",
                "opening_hours": "06:00 AM - 12:30 PM, 04:00 PM - 09:00 PM",
                "estimated_visit_hours": 1.5,
                "estimated_cost": 0.0,
                "is_indoor": False,
                "nature_score": 0.20,
                "adventure_score": 0.10,
                "history_score": 0.95,
                "beach_score": 0.00,
                "wildlife_score": 0.05,
                "culture_score": 0.98,
                "food_score": 0.60,
                "photography_score": 0.90,
                "family_score": 0.85,
            }
        ]
    },
    {
        "name": "Munnar",
        "country": "India",
        "state": "Kerala",
        "description": "An idyllic hill station at the confluence of three mountain streams, famed for rolling tea plantations, rare Nilgiri Tahr, and misty valleys.",
        "hero_image": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80",
        "best_time": "September to May",
        "latitude": 10.0889,
        "longitude": 77.0595,
        "popularity": 4.7,
        "tags": "Hill Station, Tea, Wildlife, Waterfalls",
        "places": [
            {
                "name": "Eravikulam National Park",
                "category": "Wildlife",
                "description": "Sanctuary for the endangered mountain ibex (Nilgiri Tahr) with rolling grasslands and breathtaking views of Anamudi Peak.",
                "rating": 4.7,
                "popularity": 93.0,
                "latitude": 10.1500,
                "longitude": 77.0600,
                "image_url": "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80",
                "address": "Kannan Devan Hills, Munnar",
                "opening_hours": "07:30 AM - 04:00 PM",
                "estimated_visit_hours": 3.0,
                "estimated_cost": 200.0,
                "is_indoor": False,
                "nature_score": 0.98,
                "adventure_score": 0.80,
                "history_score": 0.10,
                "beach_score": 0.00,
                "wildlife_score": 0.96,
                "culture_score": 0.10,
                "food_score": 0.10,
                "photography_score": 0.95,
                "family_score": 0.85,
            },
            {
                "name": "KDHP Tea Museum (Indoor)",
                "category": "Culture",
                "description": "Showcases the legacy of tea processing in Munnar with vintage machinery, documentary screenings, and tea tasting rooms.",
                "rating": 4.5,
                "popularity": 85.0,
                "latitude": 10.0910,
                "longitude": 77.0550,
                "image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
                "address": "Nullatanni Estate, Munnar",
                "opening_hours": "09:00 AM - 05:00 PM",
                "estimated_visit_hours": 1.5,
                "estimated_cost": 125.0,
                "is_indoor": True,
                "nature_score": 0.50,
                "adventure_score": 0.10,
                "history_score": 0.85,
                "beach_score": 0.00,
                "wildlife_score": 0.05,
                "culture_score": 0.90,
                "food_score": 0.80,
                "photography_score": 0.70,
                "family_score": 0.88,
            }
        ]
    },
    {
        "name": "Paris",
        "country": "France",
        "state": "Île-de-France",
        "description": "The City of Light, celebrated worldwide for art, haute couture, gastronomy, romantic boulevards, and iconic architectural monuments.",
        "hero_image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
        "best_time": "April to October",
        "latitude": 48.8566,
        "longitude": 2.3522,
        "popularity": 4.9,
        "tags": "Romantic, Art, Monuments, Food, Culture",
        "places": [
            {
                "name": "Louvre Museum (Indoor)",
                "category": "Culture",
                "description": "The world's largest art museum holding over 38,000 objects including the Mona Lisa, Venus de Milo, and Winged Victory.",
                "rating": 4.8,
                "popularity": 99.0,
                "latitude": 48.8606,
                "longitude": 2.3376,
                "image_url": "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80",
                "address": "Rue de Rivoli, 75001 Paris",
                "opening_hours": "09:00 AM - 06:00 PM",
                "estimated_visit_hours": 4.0,
                "estimated_cost": 1500.0,
                "is_indoor": True,
                "nature_score": 0.10,
                "adventure_score": 0.20,
                "history_score": 0.99,
                "beach_score": 0.00,
                "wildlife_score": 0.00,
                "culture_score": 0.99,
                "food_score": 0.40,
                "photography_score": 0.92,
                "family_score": 0.85,
            },
            {
                "name": "Eiffel Tower",
                "category": "History",
                "description": "The legendary 330-meter wrought-iron lattice tower on the Champ de Mars offering sweeping views over the Seine river.",
                "rating": 4.7,
                "popularity": 100.0,
                "latitude": 48.8584,
                "longitude": 2.2945,
                "image_url": "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80",
                "address": "Champ de Mars, 5 Av. Anatole France, 75007 Paris",
                "opening_hours": "09:30 AM - 11:45 PM",
                "estimated_visit_hours": 2.5,
                "estimated_cost": 2200.0,
                "is_indoor": False,
                "nature_score": 0.25,
                "adventure_score": 0.50,
                "history_score": 0.95,
                "beach_score": 0.00,
                "wildlife_score": 0.00,
                "culture_score": 0.95,
                "food_score": 0.50,
                "photography_score": 0.99,
                "family_score": 0.92,
            }
        ]
    },
    {
        "name": "Tokyo",
        "country": "Japan",
        "state": "Tokyo",
        "description": "A dazzling metropolis blending ultramodern skyscrapers, neon landscapes, robotic innovations, historic temples, and world-class culinary artistry.",
        "hero_image": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80",
        "best_time": "March to May & September to November",
        "latitude": 35.6762,
        "longitude": 139.6503,
        "popularity": 4.9,
        "tags": "Modern, Anime, Temples, Food, Technology",
        "places": [
            {
                "name": "teamLab Planets (Indoor)",
                "category": "Culture",
                "description": "An immersive digital art museum where visitors walk barefoot through mesmerizing light waters and floating flower gardens.",
                "rating": 4.8,
                "popularity": 96.0,
                "latitude": 35.6518,
                "longitude": 139.7963,
                "image_url": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
                "address": "Toyosu, Koto City, Tokyo",
                "opening_hours": "09:00 AM - 10:00 PM",
                "estimated_visit_hours": 2.5,
                "estimated_cost": 2500.0,
                "is_indoor": True,
                "nature_score": 0.40,
                "adventure_score": 0.60,
                "history_score": 0.10,
                "beach_score": 0.00,
                "wildlife_score": 0.00,
                "culture_score": 0.95,
                "food_score": 0.30,
                "photography_score": 0.99,
                "family_score": 0.95,
            },
            {
                "name": "Senso-ji Temple",
                "category": "History",
                "description": "Tokyo's oldest and most significant ancient Buddhist temple founded in 645 AD, entered via the dramatic Kaminarimon Thunder Gate.",
                "rating": 4.7,
                "popularity": 94.0,
                "latitude": 35.7148,
                "longitude": 139.7967,
                "image_url": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
                "address": "Asakusa, Taito City, Tokyo",
                "opening_hours": "06:00 AM - 05:00 PM",
                "estimated_visit_hours": 2.0,
                "estimated_cost": 0.0,
                "is_indoor": False,
                "nature_score": 0.30,
                "adventure_score": 0.20,
                "history_score": 0.98,
                "beach_score": 0.00,
                "wildlife_score": 0.05,
                "culture_score": 0.98,
                "food_score": 0.85,
                "photography_score": 0.95,
                "family_score": 0.90,
            }
        ]
    },
    {
        "name": "Dubai",
        "country": "United Arab Emirates",
        "state": "Dubai",
        "description": "A luxury oasis known for ultramodern architecture, desert sand dunes, lively nightlife, and record-breaking landmarks.",
        "hero_image": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
        "best_time": "November to March",
        "latitude": 25.2048,
        "longitude": 55.2708,
        "popularity": 4.8,
        "tags": "Luxury, Desert, Skyscrapers, Shopping",
        "places": [
            {
                "name": "Museum of the Future (Indoor)",
                "category": "Culture",
                "description": "A stunning architectural marvel engraved with Arabic poetry exploring visionary futures in AI, space exploration, and bioengineering.",
                "rating": 4.7,
                "popularity": 95.0,
                "latitude": 25.2192,
                "longitude": 55.2819,
                "image_url": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
                "address": "Sheikh Zayed Road, Dubai",
                "opening_hours": "10:00 AM - 07:30 PM",
                "estimated_visit_hours": 2.5,
                "estimated_cost": 3200.0,
                "is_indoor": True,
                "nature_score": 0.10,
                "adventure_score": 0.40,
                "history_score": 0.30,
                "beach_score": 0.00,
                "wildlife_score": 0.00,
                "culture_score": 0.95,
                "food_score": 0.30,
                "photography_score": 0.98,
                "family_score": 0.95,
            }
        ]
    }
]

def seed_database(db: Session):
    """Seed sample data, destinations catalog and tourist places dataset."""
    # Seed Default Users if not exist
    test_user = db.query(User).filter(User.email == "aswin@example.com").first()
    if not test_user:
        test_user = User(
            name="Aswin Kumar",
            email="aswin@example.com",
            hashed_password=get_password_hash("password123")
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)

    user2 = db.query(User).filter(User.email == "aswinak602@gmail.com").first()
    if not user2:
        user2 = User(
            name="Aswin Kumar",
            email="aswinak602@gmail.com",
            hashed_password=get_password_hash("password123")
        )
        db.add(user2)
        db.commit()

    # 1. Seed Core Destinations and Places if not already present
    existing_dest_names = {d.name.lower(): d for d in db.query(Destination).all()}
    existing_place_names = {p.name.strip().lower() for p in db.query(Place).all()}

    for dest_info in DESTINATIONS_DATA:
        dest_copy = dict(dest_info)
        places_data = dest_copy.pop("places", [])
        d_name_key = dest_copy["name"].lower()
        if d_name_key not in existing_dest_names:
            destination = Destination(**dest_copy)
            db.add(destination)
            db.commit()
            db.refresh(destination)
            existing_dest_names[d_name_key] = destination
        else:
            destination = existing_dest_names[d_name_key]

        for p in places_data:
            if p["name"].strip().lower() not in existing_place_names:
                place = Place(destination_id=destination.id, **p)
                db.add(place)
                existing_place_names.add(p["name"].strip().lower())
        db.commit()

    # 2. Ingest Extended Tourist Places Dataset
    try:
        from app.data.dataset_loader import load_cleaned_dataset
        dest_meta, dataset_places = load_cleaned_dataset()

        for dest_name, meta in dest_meta.items():
            key = dest_name.lower()
            if key not in existing_dest_names:
                new_d = Destination(name=dest_name, **meta)
                db.add(new_d)
                db.commit()
                db.refresh(new_d)
                existing_dest_names[key] = new_d

        for p in dataset_places:
            p_name = p["name"].strip()
            if p_name.lower() in existing_place_names:
                continue

            target_dest_name = p["destination_name"]
            dest_obj = existing_dest_names.get(target_dest_name.lower())
            if not dest_obj:
                dest_obj = existing_dest_names.get("ooty") or list(existing_dest_names.values())[0]

            place_data = {k: v for k, v in p.items() if k != "destination_name"}
            new_place = Place(destination_id=dest_obj.id, **place_data)
            db.add(new_place)
            existing_place_names.add(p_name.lower())
        db.commit()
    except Exception as err:
        print(f"Notice during dataset ingestion in seed_data: {err}")

    # Seed Demonstration Scenario if no trips exist
    if db.query(Trip).count() == 0:
        ooty_dest = db.query(Destination).filter(Destination.name == "Ooty").first()
        ooty_places = db.query(Place).filter(Place.destination_id == ooty_dest.id).all()
        
        demo_trip = Trip(
            user_id=test_user.id,
            title="College Mini-Project Demo: Ooty Nature Getaway",
            destination="Ooty",
            current_location="Chennai",
            start_date="2026-09-10",
            end_date="2026-09-12",
            days_count=3,
            members_count=4,
            budget=25000.0,
            estimated_cost=21500.0,
            transport_type="Car",
            accommodation_type="Standard",
            food_budget_tier="Standard",
            interests=json.dumps(["Nature", "Photography", "Adventure"]),
            status="active"
        )
        db.add(demo_trip)
        db.commit()
        db.refresh(demo_trip)

        # Seed Trip Members
        members = [
            TripMember(trip_id=demo_trip.id, user_id=test_user.id, name="Aswin Kumar (Owner)", email="aswin@example.com", role="OWNER", is_sharing_location=True, last_latitude=11.4102, last_longitude=76.6950),
            TripMember(trip_id=demo_trip.id, name="Rahul Sharma", email="rahul@example.com", role="EDIT", is_sharing_location=True, last_latitude=11.4172, last_longitude=76.7118),
            TripMember(trip_id=demo_trip.id, name="Priya Sundaram", email="priya@example.com", role="VIEW", is_sharing_location=False),
            TripMember(trip_id=demo_trip.id, name="Karthik R.", email="karthik@example.com", role="VIEW", is_sharing_location=True, last_latitude=11.4011, last_longitude=76.7369),
        ]
        db.add_all(members)

        # Seed Day-Wise Itinerary
        if ooty_places:
            place_dict = {p.name: p.id for p in ooty_places}
            itinerary = [
                ItineraryItem(trip_id=demo_trip.id, day_number=1, time_slot="09:00 AM", place_id=place_dict.get("Ooty Lake & Boat House"), custom_title="Morning Boating at Ooty Lake", duration_hours=2.0, distance_from_prev_km=0.0, travel_time_mins=0, notes="Reach early to avoid boat house rush", sort_order=1),
                ItineraryItem(trip_id=demo_trip.id, day_number=1, time_slot="11:30 AM", place_id=place_dict.get("Government Botanical Garden"), custom_title="Botanical Garden Flora Walk", duration_hours=2.0, distance_from_prev_km=3.2, travel_time_mins=10, notes="Check out the 20M-year-old fossil tree", sort_order=2),
                ItineraryItem(trip_id=demo_trip.id, day_number=1, time_slot="01:30 PM", custom_title="Lunch at Earl's Secret Restaurant", activity_type="restaurant", duration_hours=1.5, distance_from_prev_km=1.8, travel_time_mins=8, notes="Colonial heritage dining experience", sort_order=3),
                ItineraryItem(trip_id=demo_trip.id, day_number=1, time_slot="03:30 PM", place_id=place_dict.get("Ooty Tea Factory & Tea Museum"), custom_title="Tea Factory & Tasting Tour", duration_hours=2.0, distance_from_prev_km=4.5, travel_time_mins=15, notes="Indoor covered tour with fresh cardamom tea", sort_order=4),
                ItineraryItem(trip_id=demo_trip.id, day_number=1, time_slot="06:30 PM", custom_title="Check-in at Hotel / Rest", activity_type="hotel", duration_hours=2.0, distance_from_prev_km=3.0, travel_time_mins=12, notes="Evening leisure and campfire", sort_order=5),
                
                ItineraryItem(trip_id=demo_trip.id, day_number=2, time_slot="08:30 AM", place_id=place_dict.get("Avalanche Lake"), custom_title="Expedition to Avalanche Lake Valley", duration_hours=3.5, distance_from_prev_km=28.0, travel_time_mins=55, notes="Forest permit check and landscape photography", sort_order=1),
                ItineraryItem(trip_id=demo_trip.id, day_number=2, time_slot="01:00 PM", custom_title="Picnic Lunch near Emerald Lake", activity_type="restaurant", duration_hours=1.5, distance_from_prev_km=8.0, travel_time_mins=20, notes="Pack snacks and hot beverages", sort_order=2),
                ItineraryItem(trip_id=demo_trip.id, day_number=2, time_slot="03:30 PM", place_id=place_dict.get("Government Rose Garden"), custom_title="Rose Garden Stroll", duration_hours=2.0, distance_from_prev_km=24.0, travel_time_mins=50, notes="Panoramic viewpoints over Elk hill", sort_order=3),
                
                ItineraryItem(trip_id=demo_trip.id, day_number=3, time_slot="09:00 AM", place_id=place_dict.get("Doddabetta Peak"), custom_title="Doddabetta Peak & Telescope House", duration_hours=2.5, distance_from_prev_km=9.0, travel_time_mins=25, notes="Clear morning skies for Western Ghats vistas", sort_order=1),
                ItineraryItem(trip_id=demo_trip.id, day_number=3, time_slot="12:30 PM", place_id=place_dict.get("Pykara Waterfalls & Lake"), custom_title="Pykara Falls & Speedboat Experience", duration_hours=3.0, distance_from_prev_km=29.0, travel_time_mins=45, notes="Speedboating in the pine forest reservoir", sort_order=2),
                ItineraryItem(trip_id=demo_trip.id, day_number=3, time_slot="04:30 PM", custom_title="Return Journey to Chennai", activity_type="transport", duration_hours=8.0, distance_from_prev_km=530.0, travel_time_mins=480, notes="Safe driving back home via Salem-Vellore", sort_order=3),
            ]
            db.add_all(itinerary)

        # Seed Sample Expenses
        expenses = [
            Expense(trip_id=demo_trip.id, category="Transport", amount=6800.0, paid_by="Aswin Kumar", date="2026-09-10", description="Fuel & Highway Tolls (Chennai to Ooty round trip)"),
            Expense(trip_id=demo_trip.id, category="Hotel", amount=7200.0, paid_by="Rahul Sharma", date="2026-09-10", description="2 Rooms for 2 Nights at Sterling Ooty"),
            Expense(trip_id=demo_trip.id, category="Food", amount=3400.0, paid_by="Aswin Kumar", date="2026-09-11", description="Earl's Secret heritage lunch and snacks"),
            Expense(trip_id=demo_trip.id, category="Activities", amount=2400.0, paid_by="Karthik R.", date="2026-09-11", description="Boat House tickets, Avalanche safari, entry fees"),
        ]
        db.add_all(expenses)

        # Seed Sample Reservations
        reservations = [
            Reservation(trip_id=demo_trip.id, type="Hotels", title="Sterling Ooty Fern Hill Resort", provider="Sterling Holidays", booking_reference="STR-OOTY-94821", date="2026-09-10", time="02:00 PM", address="Fern Hill, Ooty, Nilgiris, Tamil Nadu", cost=7200.0, notes="Includes complimentary hill-view breakfast and parking"),
            Reservation(trip_id=demo_trip.id, type="Rental Cars", title="Toyota Innova Crysta Rental", provider="Zoomcar / Avis India", booking_reference="ZOOM-CHN-7721", date="2026-09-10", time="05:30 AM", address="Chennai Central Hub", cost=5500.0, notes="7-seater AC SUV with fastag enabled"),
        ]
        db.add_all(reservations)

        # Seed Checklists
        checklists = [
            ChecklistItem(trip_id=demo_trip.id, category="Documents", item_text="Driver's License & Vehicle Registration", is_completed=True, assigned_to="Aswin Kumar"),
            ChecklistItem(trip_id=demo_trip.id, category="Documents", item_text="Hotel Booking PDF & Govt IDs", is_completed=True, assigned_to="Rahul Sharma"),
            ChecklistItem(trip_id=demo_trip.id, category="Packing", item_text="Warm Jackets & Sweaters (Night temperatures ~12°C)", is_completed=True, assigned_to="All Members"),
            ChecklistItem(trip_id=demo_trip.id, category="Packing", item_text="DSLR Camera & Extra Memory Cards", is_completed=True, assigned_to="Aswin Kumar"),
            ChecklistItem(trip_id=demo_trip.id, category="Packing", item_text="Power banks & fast chargers", is_completed=False, assigned_to="Karthik R."),
            ChecklistItem(trip_id=demo_trip.id, category="Shopping", item_text="Buy authentic Nilgiri orthodox tea & homemade chocolates", is_completed=False, assigned_to="Priya Sundaram"),
            ChecklistItem(trip_id=demo_trip.id, category="To-Do", item_text="Pre-download offline maps for Nilgiri Ghat roads", is_completed=True, assigned_to="Aswin Kumar"),
        ]
        db.add_all(checklists)

        db.commit()
    print("[OK] Successfully initialized and seeded database with global destinations & Ooty demonstration trip!")
