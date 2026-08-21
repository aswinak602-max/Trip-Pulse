"""
Dataset Loader and Processor for AI-Powered Intelligent Trip Planner.
Source of Truth: city_tourist_places.csv (cities, tourist places).
Guarantees strict 1-to-1 destination-to-attraction matching without cross-contamination.
"""

import os
import csv
import re
from typing import List, Dict, Any, Tuple

# Curated high-aesthetic Unsplash images per category (no placeholders)
CATEGORY_IMAGES = {
    "Nature": [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
    ],
    "Tea": [
        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1564865878688-9a244444042a?auto=format&fit=crop&w=800&q=80",
    ],
    "Waterfall": [
        "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=800&q=80",
    ],
    "History": [
        "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    ],
    "Culture": [
        "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80",
    ],
    "Adventure": [
        "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80",
    ],
    "Beach": [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
    ],
    "Wildlife": [
        "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=800&q=80",
    ],
    "Shopping": [
        "https://images.unsplash.com/photo-1481437156560-3205f6a55735?auto=format&fit=crop&w=800&q=80",
    ],
    "Food": [
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    ],
    "Family": [
        "https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?auto=format&fit=crop&w=800&q=80",
    ],
}

DESTINATION_METADATA = {
    "Kanyakumari": {
        "country": "India", "state": "Tamil Nadu",
        "description": "The southernmost tip of mainland India where the Arabian Sea, Indian Ocean, and Bay of Bengal meet.",
        "hero_image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 8.0780, "longitude": 77.5550, "popularity": 4.9,
        "tags": "Vivekananda Rock, Thiruvalluvar Statue, Sunrise, Sunset, Tri-Sea, Coastal"
    },
    "Ooty": {
        "country": "India", "state": "Tamil Nadu",
        "description": "The Queen of Hill Stations in the Nilgiri Hills, renowned for lush tea gardens, mist-clad peaks, and serene lakes.",
        "hero_image": "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to June", "latitude": 11.4102, "longitude": 76.6950, "popularity": 4.8,
        "tags": "Hill Station, Tea Gardens, Nature, Lakes, Mountains"
    },
    "Munnar": {
        "country": "India", "state": "Kerala",
        "description": "Idyllic hill station in Kerala's Western Ghats known for rolling green tea plantations, misty hills, and waterfalls.",
        "hero_image": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
        "best_time": "September to May", "latitude": 10.0889, "longitude": 77.0595, "popularity": 4.8,
        "tags": "Hill Station, Tea Gardens, Waterfalls, Trekking, Wildlife"
    },
    "Chennai": {
        "country": "India", "state": "Tamil Nadu",
        "description": "The Cultural Capital of South India, famous for Marina Beach, ancient Dravidian temples, and Carnatic music.",
        "hero_image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
        "best_time": "November to February", "latitude": 13.0827, "longitude": 80.2707, "popularity": 4.7,
        "tags": "Coastal, Marina Beach, Temples, Carnatic Music, Heritage"
    },
    "Coimbatore": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Vibrant city at the foot of Velliangiri hills, home to the iconic Adiyogi Shiva Statue, Dhyanalinga, and Siruvani waterfalls.",
        "hero_image": "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1200&q=80",
        "best_time": "September to March", "latitude": 11.0168, "longitude": 76.9558, "popularity": 4.7,
        "tags": "Spiritual, Temples, Waterfalls, Museums, Nature, Siruvani"
    },
    "Coonoor": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Picturesque Nilgiri hill retreat famous for Sim's Park, panoramic Dolphin's Nose, tea estates, and cascading waterfalls.",
        "hero_image": "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to June", "latitude": 11.3530, "longitude": 76.7959, "popularity": 4.8,
        "tags": "Hill Station, Tea Gardens, Sims Park, Nature, Western Ghats"
    },
    "Madurai": {
        "country": "India", "state": "Tamil Nadu",
        "description": "The Athens of the East, crowned by the majestic Meenakshi Sundareswarar Temple and Thirumalai Nayak Palace.",
        "hero_image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 9.9195, "longitude": 78.1193, "popularity": 4.9,
        "tags": "Meenakshi Temple, Dravidian Architecture, Food Capital, Nayakkar Palace"
    },
    "Thanjavur": {
        "country": "India", "state": "Tamil Nadu",
        "description": "The cradle of Chola culture and art, home to the UNESCO Great Living Chola Brihadeeswara Temple.",
        "hero_image": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 10.7828, "longitude": 79.1318, "popularity": 4.9,
        "tags": "UNESCO World Heritage, Brihadeeswara, Cholas, Art, Palace"
    },
    "Tiruchirappalli": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Cultural hub dominated by the 83m Rockfort Temple and the colossal Sri Ranganathaswamy Temple at Srirangam.",
        "hero_image": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 10.7905, "longitude": 78.7047, "popularity": 4.8,
        "tags": "Rockfort Temple, Srirangam, Cauvery, Ancient Heritage"
    },
    "Salem": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Flanked by the picturesque Shevaroy Hills, featuring the tranquil mountain resort of Yercaud.",
        "hero_image": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 11.6643, "longitude": 78.1460, "popularity": 4.7,
        "tags": "Yercaud, Shevaroy Hills, Coffee, Hill Station, Nature"
    },
    "Tirunelveli": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Ancient city on the Thamirabarani River, renowned for the therapeutic Courtallam Waterfalls and Nellaiappar Temple.",
        "hero_image": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80",
        "best_time": "July to March", "latitude": 8.7139, "longitude": 77.7567, "popularity": 4.7,
        "tags": "Courtallam Falls, Nellaiappar Temple, River, Heritage, Nature"
    },
    "Kodaikanal": {
        "country": "India", "state": "Tamil Nadu",
        "description": "The Princess of Hill Stations in the Palani Hills, famous for star-shaped Kodaikanal Lake, Pillar Rocks, and cool mist.",
        "hero_image": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        "best_time": "September to May", "latitude": 10.2381, "longitude": 77.4892, "popularity": 4.8,
        "tags": "Hill Station, Lake, Pillar Rocks, Waterfalls, Nature"
    },
    "Ramanathapuram": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Holy pilgrimage island of Rameswaram, Dhanushkodi ghost town, and the architectural wonder Pamban Sea Bridge.",
        "hero_image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to April", "latitude": 9.2876, "longitude": 79.3129, "popularity": 4.9,
        "tags": "Rameswaram, Pilgrimage, Coastal, Dhanushkodi, Pamban Bridge"
    },
    "Vellore": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Historic fortress city home to the granite Vellore Fort, Jalakandeswarar Temple, and the Golden Temple at Sripuram.",
        "hero_image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 12.9165, "longitude": 79.1325, "popularity": 4.7,
        "tags": "Vellore Fort, Golden Temple, Granite Moat, History"
    },
    "Mahabalipuram": {
        "country": "India", "state": "Tamil Nadu",
        "description": "UNESCO World Heritage coastal town famous for 7th-century Pallava Shore Temple, monolithic Rathas, and rock bas-reliefs.",
        "hero_image": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 12.6269, "longitude": 80.1927, "popularity": 4.9,
        "tags": "UNESCO World Heritage, Shore Temple, Pancha Rathas, Coastal, History"
    },
    "Erode": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Turmeric City on the Cauvery river, featuring the ancient Bhavani Sangameswarar Temple at the sacred Triveni Sangam.",
        "hero_image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 11.3410, "longitude": 77.7172, "popularity": 4.6,
        "tags": "Bhavani Sangameswarar, Confluence, Dam, Temples"
    },
    "Dharmapuri": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Scenic forested plateau home to the thunderous Hogenakkal Falls on the Cauvery river, known as the Niagara of India.",
        "hero_image": "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80",
        "best_time": "July to March", "latitude": 12.1211, "longitude": 78.1582, "popularity": 4.8,
        "tags": "Hogenakkal Falls, Coracle Rides, Cauvery River, Nature"
    },
    "Theni": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Scenic Western Ghats gateway blessed with Suruli Waterfalls, Meghamalai cloud mountains, and spice plantations.",
        "hero_image": "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1200&q=80",
        "best_time": "September to March", "latitude": 10.0104, "longitude": 77.4768, "popularity": 4.7,
        "tags": "Suruli Falls, Meghamalai, Western Ghats, Waterfalls"
    },
    "Dindigul": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Gateway to the Palani and Sirumalai hills, famous for its massive rock fort, Sanjeevani hill retreats, and Palani temple.",
        "hero_image": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 10.3673, "longitude": 77.9803, "popularity": 4.7,
        "tags": "Sirumalai Hills, Rock Fort, Palani Murugan Temple, Nature"
    },
    "Namakkal": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Historic center around the monolithic Namakkal Fort, Anjaneyar Temple, and the scenic Kolli Hills with 70 hairpin bends.",
        "hero_image": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 11.2189, "longitude": 78.1674, "popularity": 4.6,
        "tags": "Namakkal Fort, Kolli Hills, Anjaneyar Temple, Hairpin Bends"
    },
    "Krishnagiri": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Mango capital known for the expansive Krishnagiri Dam reservoir, scenic hillocks, and historic hilltop forts.",
        "hero_image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to February", "latitude": 12.5266, "longitude": 78.2147, "popularity": 4.5,
        "tags": "Krishnagiri Dam, Reservoir, Hills, Scenic Nature"
    },
    "Nagapattinam": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Coastal pilgrimage port famous for the Basilica of Our Lady of Good Health at Velankanni and Nagore Dargah.",
        "hero_image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 10.6800, "longitude": 79.8450, "popularity": 4.8,
        "tags": "Velankanni Basilica, Coastal, Pilgrimage, Beaches"
    },
    "Pudukkottai": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Former princely state rich in megalithic monuments, Sittannavasal Jain rock-cut caves, and Thirumayam Fort.",
        "hero_image": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 10.3797, "longitude": 78.8208, "popularity": 4.5,
        "tags": "Sittannavasal, Thirumayam Fort, Caves, History"
    },
    "Sivaganga": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Heart of the Chettinad region, world-renowned for opulent 19th-century Chettinad Palaces and Pillayarpatti temple.",
        "hero_image": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 9.8433, "longitude": 78.4809, "popularity": 4.7,
        "tags": "Chettinad Palace, Pillayarpatti, Mansions, Architecture"
    },
    "Tiruppur": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Featuring the revered Sivanmalai Murugan Temple, Thirumoorthy Hills, and Amaravathi Dam wildlife area.",
        "hero_image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 11.1085, "longitude": 77.3411, "popularity": 4.6,
        "tags": "Sivanmalai, Thirumoorthy Hills, Temples, Amaravathi Dam"
    },
    "Virudhunagar": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Celebrated for the iconic 11-tier gopuram of Srivilliputhur Andal Temple, depicted on the Tamil Nadu state emblem.",
        "hero_image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 9.5872, "longitude": 77.9514, "popularity": 4.7,
        "tags": "Srivilliputhur Andal, State Emblem, Gopuram, Heritage"
    },
    "Thoothukudi": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Pearl City of South India famous for the historic Our Lady of Snows Basilica, Tiruchendur Murugan Sea Temple, and beaches.",
        "hero_image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 8.7642, "longitude": 78.1348, "popularity": 4.7,
        "tags": "Our Lady of Snows, Tiruchendur Temple, Coastal Beaches, Port"
    },
    "Cuddalore": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Coastal district famous for Silver Beach and the world's second-largest mangrove wetland forest at Pichavaram.",
        "hero_image": "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 11.7480, "longitude": 79.7714, "popularity": 4.6,
        "tags": "Silver Beach, Pichavaram Mangroves, Boating, Coastal"
    },
    "Bangalore": {
        "country": "India", "state": "Karnataka",
        "description": "The Silicon Valley and Garden City of India, known for Lalbagh Botanical Garden, Cubbon Park, and Bangalore Palace.",
        "hero_image": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 12.9716, "longitude": 77.5946, "popularity": 4.9,
        "tags": "Metropolis, Lalbagh, Cubbon Park, Palaces, Tech City"
    },
    "Mysore": {
        "country": "India", "state": "Karnataka",
        "description": "The City of Palaces renowned for the grand Mysore Palace, Chamundi Hills, Srirangapatna, and Brindavan Gardens.",
        "hero_image": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 12.2958, "longitude": 76.6394, "popularity": 4.8,
        "tags": "Mysore Palace, Chamundi Hills, Brindavan Gardens, Heritage"
    },
    "Coorg": {
        "country": "India", "state": "Karnataka",
        "description": "The Scotland of India in the Western Ghats famous for coffee plantations, Abbey Falls, Raja's Seat, and Namdroling Monastery.",
        "hero_image": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to April", "latitude": 12.3375, "longitude": 75.8069, "popularity": 4.8,
        "tags": "Coffee Plantations, Abbey Falls, Rajas Seat, Monastery, Nature"
    },
    "Hyderabad": {
        "country": "India", "state": "Telangana",
        "description": "The City of Pearls boasting Charminar, Golconda Fort, Hussain Sagar Lake, Chowmahalla Palace, and Ramoji Film City.",
        "hero_image": "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 17.3850, "longitude": 78.4867, "popularity": 4.8,
        "tags": "Charminar, Golconda Fort, Hussain Sagar, Nizami Heritage"
    },
    "Mumbai": {
        "country": "India", "state": "Maharashtra",
        "description": "The City of Dreams on the Arabian Sea coast, home to the Gateway of India, Marine Drive, Elephanta Caves, and Juhu Beach.",
        "hero_image": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 18.9220, "longitude": 72.8347, "popularity": 4.9,
        "tags": "Gateway of India, Marine Drive, Elephanta Caves, Coastal"
    },
    "Delhi": {
        "country": "India", "state": "Delhi NCR",
        "description": "India's historic capital showcasing UNESCO monuments (Qutub Minar, Red Fort, Humayun's Tomb), India Gate, and Akshardham.",
        "hero_image": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 28.6139, "longitude": 77.2090, "popularity": 4.9,
        "tags": "Qutub Minar, Red Fort, India Gate, Humayun Tomb, History"
    },
    "Jaipur": {
        "country": "India", "state": "Rajasthan",
        "description": "The Pink City of India renowned for Hawa Mahal, Amer Fort, City Palace, Jantar Mantar, and royal Rajasthani heritage.",
        "hero_image": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 26.9124, "longitude": 75.7873, "popularity": 4.9,
        "tags": "Hawa Mahal, Amer Fort, City Palace, Royal Heritage"
    },
    "Kolkata": {
        "country": "India", "state": "West Bengal",
        "description": "The City of Joy and cultural capital of India, famous for Victoria Memorial, Howrah Bridge, and Dakshineswar Kali Temple.",
        "hero_image": "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 22.5726, "longitude": 88.3639, "popularity": 4.8,
        "tags": "Victoria Memorial, Howrah Bridge, Dakshineswar, Culture"
    },
    "Manali": {
        "country": "India", "state": "Himachal Pradesh",
        "description": "High-altitude Himalayan resort town in Beas River Valley, renowned for Solang Valley, Rohtang Pass, and Jogini falls.",
        "hero_image": "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to June", "latitude": 32.2432, "longitude": 77.1892, "popularity": 4.9,
        "tags": "Solang Valley, Rohtang Pass, Hadimba Temple, Snow, Himalayas"
    },
    "Shimla": {
        "country": "India", "state": "Himachal Pradesh",
        "description": "The summer capital of British India in the Himalayas, famous for the Ridge, Mall Road, Jakhu Temple, and Kufri.",
        "hero_image": "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to June", "latitude": 31.1048, "longitude": 77.1734, "popularity": 4.8,
        "tags": "The Ridge, Mall Road, Jakhu Temple, Kufri, Himalayas"
    },
    "Dharamshala": {
        "country": "India", "state": "Himachal Pradesh",
        "description": "Serene hillside home of the Dalai Lama, featuring Tsuglagkhang complex, McLeod Ganj, Bhagsu waterfall, and Triund trek.",
        "hero_image": "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80",
        "best_time": "September to June", "latitude": 32.2190, "longitude": 76.3234, "popularity": 4.8,
        "tags": "Dalai Lama, McLeodGanj, Triund, Bhagsu Falls, Tibetan Culture"
    },
    "Palakkad": {
        "country": "India", "state": "Kerala",
        "description": "The Gateway of Kerala flanked by the Western Ghats, featuring Palakkad Fort, Malampuzha Dam, and Kava viewpoints.",
        "hero_image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
        "best_time": "November to February", "latitude": 10.7867, "longitude": 76.6548, "popularity": 4.5,
        "tags": "Palakkad Fort, Malampuzha Dam, Kava, Kerala Heritage"
    },
    "Valparai": {
        "country": "India", "state": "Tamil Nadu",
        "description": "Pollachi-Anamalai hill station famous for 40 hairpin bends, pristine Sholayar dam, Monkey Falls, and tea estates.",
        "hero_image": "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80",
        "best_time": "October to March", "latitude": 10.3256, "longitude": 76.9529, "popularity": 4.6,
        "tags": "Sholayar Dam, Monkey Falls, Tea Estates, Hairpin Bends, Nature"
    },
    "Paris": {
        "country": "France", "state": "Ile-de-France",
        "description": "The City of Light, celebrated worldwide for art, haute couture, gastronomy, romantic boulevards, and monuments.",
        "hero_image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
        "best_time": "April to October", "latitude": 48.8566, "longitude": 2.3522, "popularity": 4.9,
        "tags": "Eiffel Tower, Louvre Museum, Notre Dame, Seine, Art, Culture"
    },
    "London": {
        "country": "United Kingdom", "state": "England",
        "description": "Historic capital on the River Thames, home to Tower Bridge, Big Ben, Westminster Abbey, and the British Museum.",
        "hero_image": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80",
        "best_time": "May to October", "latitude": 51.5074, "longitude": -0.1278, "popularity": 4.8,
        "tags": "Tower Bridge, Big Ben, British Museum, London Eye, History"
    },
    "Tokyo": {
        "country": "Japan", "state": "Kanto",
        "description": "Fascinating blend of ultramodern neon skyscrapers and historic temples, Shibuya crossing, and digital art museums.",
        "hero_image": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80",
        "best_time": "March to May, September to November", "latitude": 35.6762, "longitude": 139.6503, "popularity": 4.9,
        "tags": "Senso-ji Temple, Shibuya, teamLab, Skytree, Culture, Modern"
    },
    "Dubai": {
        "country": "United Arab Emirates", "state": "Dubai",
        "description": "Futuristic skyline with Burj Khalifa, Museum of the Future, Palm Jumeirah, and desert safari adventures.",
        "hero_image": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
        "best_time": "November to March", "latitude": 25.2048, "longitude": 55.2708, "popularity": 4.8,
        "tags": "Burj Khalifa, Museum of Future, Palm Jumeirah, Desert Safari"
    },
    "Rome": {
        "country": "Italy", "state": "Lazio",
        "description": "The Eternal City, home to the Colosseum, Roman Forum, Trevi Fountain, Pantheon, and Vatican City.",
        "hero_image": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80",
        "best_time": "April to June, September to October", "latitude": 41.9028, "longitude": 12.4964, "popularity": 4.9,
        "tags": "Colosseum, Trevi Fountain, Pantheon, Vatican, Ancient History"
    },
    "New York": {
        "country": "United States", "state": "New York",
        "description": "The Big Apple, featuring Central Park, Empire State Building, Statue of Liberty, Times Square, and The Met.",
        "hero_image": "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1200&q=80",
        "best_time": "April to June, September to November", "latitude": 40.7128, "longitude": -74.0060, "popularity": 4.9,
        "tags": "Central Park, Empire State, Statue of Liberty, Times Square"
    }
}

def infer_place_attributes(name: str, dest_name: str, index: int) -> Dict[str, Any]:
    """Generates 9D interest vector, category, cost, hours, and indoor flag based on place name."""
    name_lower = name.lower()

    # Initialize default 9D scores
    nature = 0.1
    adventure = 0.1
    history = 0.1
    beach = 0.0
    wildlife = 0.1
    culture = 0.1
    food = 0.1
    photography = 0.6
    family = 0.6

    category = "Nature"
    is_indoor = False
    cost = 50.0
    hours = 2.0

    if any(k in name_lower for k in ['temple', 'church', 'mosque', 'gurudwara', 'basilica', 'monastery', 'mandir', 'dargah', 'spiritual', 'ashram', 'meditation', 'shrine', 'sangam']):
        category = "Culture"
        culture = 0.96
        history = 0.70
        nature = 0.20
        family = 0.85
        cost = 0.0
        hours = 1.5

    elif any(k in name_lower for k in ['fort', 'palace', 'memorial', 'statue', 'monument', 'museum', 'heritage', 'observatory', 'mahal', 'bridge', 'colosseum', 'eiffel', 'louvre', 'tower', 'historic', 'pyramid']):
        category = "History"
        history = 0.98
        culture = 0.75
        photography = 0.90
        family = 0.80
        cost = 100.0
        hours = 2.5
        if any(k in name_lower for k in ['museum', 'gallery', 'louvre', 'palace', 'indoor', 'metropolitan']):
            is_indoor = True

    elif any(k in name_lower for k in ['waterfall', 'falls', 'lake', 'dam', 'tea', 'garden', 'park', 'viewpoint', 'peak', 'view', 'valley', 'hills', 'botanical', 'rose', 'nature', 'ridge', 'pass']):
        category = "Nature"
        nature = 0.98
        photography = 0.95
        family = 0.80
        hours = 2.5
        cost = 40.0
        if any(k in name_lower for k in ['waterfall', 'falls', 'trek', 'pass', 'adventure', 'solang', 'rohtang', 'triund', 'paragliding']):
            adventure = 0.85

    elif any(k in name_lower for k in ['beach', 'coast', 'promenade', 'ocean', 'sea', 'ghat', 'theertham']):
        category = "Beach"
        beach = 0.98
        nature = 0.85
        photography = 0.92
        food = 0.50
        family = 0.90
        cost = 0.0
        hours = 2.5

    elif any(k in name_lower for k in ['wildlife', 'sanctuary', 'zoo', 'safari', 'national park', 'bird', 'peafowl', 'elephant', 'tahr', 'crocodile']):
        category = "Wildlife"
        wildlife = 0.98
        nature = 0.90
        family = 0.95
        photography = 0.90
        cost = 150.0
        hours = 3.0

    elif any(k in name_lower for k in ['safari', 'sports', 'fun world', 'snow', 'adventure', 'theme park', 'black thunder']):
        category = "Adventure"
        adventure = 0.95
        nature = 0.70
        family = 0.85
        cost = 350.0
        hours = 3.5

    elif any(k in name_lower for k in ['bazaar', 'street', 'mall', 'shopping', 'boulevard', 'market']):
        category = "Shopping"
        food = 0.70
        culture = 0.50
        family = 0.80
        cost = 200.0
        hours = 2.0
        is_indoor = True

    # Curated image selection
    img_pool = CATEGORY_IMAGES.get(category, CATEGORY_IMAGES["Nature"])
    if "tea" in name_lower:
        img_pool = CATEGORY_IMAGES["Tea"]
    elif "waterfall" in name_lower or "falls" in name_lower:
        img_pool = CATEGORY_IMAGES["Waterfall"]
    elif "beach" in name_lower:
        img_pool = CATEGORY_IMAGES["Beach"]
    img_url = img_pool[index % len(img_pool)]

    desc = f"Famous landmark in {dest_name}, renowned for its scenic beauty, architecture, and cultural heritage."

    return {
        "category": category,
        "description": desc,
        "rating": round(4.4 + ((index * 3) % 6) * 0.1, 1),
        "popularity": round(84.0 + ((index * 5) % 16), 1),
        "image_url": img_url,
        "address": f"{name}, {dest_name}",
        "opening_hours": "06:00 AM - 08:30 PM" if category in ["Culture", "Beach"] else "09:00 AM - 06:00 PM",
        "estimated_visit_hours": hours,
        "estimated_cost": cost,
        "is_indoor": is_indoor,
        "nature_score": round(nature, 2),
        "adventure_score": round(adventure, 2),
        "history_score": round(history, 2),
        "beach_score": round(beach, 2),
        "wildlife_score": round(wildlife, 2),
        "culture_score": round(culture, 2),
        "food_score": round(food, 2),
        "photography_score": round(photography, 2),
        "family_score": round(family, 2),
    }

def load_cleaned_dataset() -> Tuple[Dict[str, Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Parses `city_tourist_places.csv` as the Single Source of Truth.
    Extracts every city and tourist place, creates coordinates, 9D scores, and returns
    (destinations_dict, places_list).
    """
    city_places_path = os.path.join(os.path.dirname(__file__), 'city_tourist_places.csv')
    cleaned_places = []
    seen_dest_place_keys = set()

    if os.path.exists(city_places_path):
        with open(city_places_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        for idx, r in enumerate(rows):
            # Support both 'cities' / 'Cities' and 'tourist places' / 'Tourist Places'
            city_name = (r.get('cities') or r.get('Cities') or '').strip()
            place_name = (r.get('tourist places') or r.get('Tourist Places') or '').strip()

            if not city_name or not place_name:
                continue

            dest_meta = DESTINATION_METADATA.get(city_name)
            base_lat = dest_meta["latitude"] if dest_meta else 11.4102
            base_lng = dest_meta["longitude"] if dest_meta else 76.6950

            # Slight coordinate offset to disperse places around the city center
            offset_lat = round(base_lat + ((idx % 7) - 3) * 0.012, 4)
            offset_lng = round(base_lng + ((idx % 5) - 2) * 0.012, 4)

            dest_key = (city_name.lower().strip(), place_name.lower().strip())
            if dest_key in seen_dest_place_keys:
                continue
            seen_dest_place_keys.add(dest_key)

            attributes = infer_place_attributes(place_name, city_name, idx)
            cleaned_places.append({
                "name": place_name,
                "destination_name": city_name,
                "latitude": offset_lat,
                "longitude": offset_lng,
                **attributes
            })

    return DESTINATION_METADATA, cleaned_places
