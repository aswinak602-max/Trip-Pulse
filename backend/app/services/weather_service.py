"""
Weather Intelligence & Weather-Aware Alternative Recommendation Service.
Integrates OpenWeatherMap with robust offline simulation,
classifies outdoor suitability (GOOD / MODERATE / UNSUITABLE),
and dynamically suggests indoor/covered attraction alternatives when bad weather occurs.
"""

import httpx
from datetime import datetime, timedelta
from typing import Dict, Any, List
from app.core.config import settings

DESTINATION_WEATHER_PROFILES = {
    "ooty": {"temp": 16.5, "condition": "Clouds", "desc": "Pleasant mountain mist & cool breeze", "humidity": 75, "wind": 8.5, "rain_prob": 25},
    "chennai": {"temp": 31.0, "condition": "Sunny", "desc": "Warm coastal sunshine with sea breeze", "humidity": 68, "wind": 14.0, "rain_prob": 10},
    "munnar": {"temp": 18.0, "condition": "Rain", "desc": "Light mountain showers with lush greenery", "humidity": 82, "wind": 10.0, "rain_prob": 65},
    "paris": {"temp": 19.5, "condition": "Clear", "desc": "Crisp autumn sunshine over Parisian boulevards", "humidity": 55, "wind": 9.0, "rain_prob": 15},
    "tokyo": {"temp": 22.0, "condition": "Clear", "desc": "Comfortable temperate breeze", "humidity": 50, "wind": 7.5, "rain_prob": 10},
    "dubai": {"temp": 34.0, "condition": "Sunny", "desc": "Clear sunny desert skies", "humidity": 45, "wind": 12.0, "rain_prob": 0},
    "goa": {"temp": 29.0, "condition": "Sunny", "desc": "Tropical coastal sunshine", "humidity": 70, "wind": 11.0, "rain_prob": 20},
}

class WeatherService:
    @staticmethod
    def classify_suitability(condition: str, rain_prob: int, temp: float) -> tuple[str, str]:
        cond_lower = condition.lower()
        if "storm" in cond_lower or "heavy rain" in cond_lower or rain_prob > 70 or temp > 42 or temp < 0:
            return "UNSUITABLE", f"Inclement weather ({condition}, {rain_prob}% rain chance). Outdoor mountain trails and open-air activities are not advised. Check indoor alternatives below."
        elif "rain" in cond_lower or "shower" in cond_lower or rain_prob > 40 or temp > 36 or temp < 8:
            return "MODERATE", f"Moderate conditions ({condition}, {rain_prob}% rain probability). Keep an umbrella or light jacket handy for outdoor stops."
        else:
            return "GOOD", f"Ideal weather conditions ({condition}, {round(temp)}°C). Excellent for outdoor sightseeing, photography, and nature walks."

    @classmethod
    async def get_weather(cls, city: str, lat: float = None, lon: float = None) -> Dict[str, Any]:
        city_clean = city.strip().lower()
        is_live = False
        data = None

        # 1. Try Live OpenWeatherMap API if key is provided
        if settings.OPENWEATHER_API_KEY:
            try:
                url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&units=metric&appid={settings.OPENWEATHER_API_KEY}"
                if lat and lon:
                    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={settings.OPENWEATHER_API_KEY}"
                
                async with httpx.AsyncClient(timeout=4.0) as client:
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        live_json = resp.json()
                        temp = live_json["main"]["temp"]
                        feels = live_json["main"]["feels_like"]
                        cond = live_json["weather"][0]["main"]
                        desc = live_json["weather"][0]["description"].title()
                        hum = live_json["main"]["humidity"]
                        wind = live_json["wind"]["speed"]
                        icon = live_json["weather"][0]["icon"]
                        is_live = True

                        suitability, reason = cls.classify_suitability(cond, 20 if "rain" not in cond.lower() else 75, temp)
                        data = {
                            "city": city.title(),
                            "country": live_json.get("sys", {}).get("country", "IN"),
                            "temperature": round(temp, 1),
                            "feels_like": round(feels, 1),
                            "condition": cond,
                            "description": desc,
                            "humidity": hum,
                            "wind_speed": round(wind * 3.6, 1), # km/h
                            "icon": icon,
                            "suitability": suitability,
                            "suitability_reason": reason,
                            "is_live_api": True
                        }
            except Exception as e:
                print(f"OpenWeatherMap live API error (fallback active): {e}")

        # 2. Fallback Meteorological Engine (Deterministic, realistic and accurate)
        if not data:
            profile = DESTINATION_WEATHER_PROFILES.get(
                city_clean,
                {"temp": 24.0, "condition": "Partly Cloudy", "desc": "Pleasant gentle breeze with intermittent sun", "humidity": 60, "wind": 10.0, "rain_prob": 20}
            )
            temp = profile["temp"]
            cond = profile["condition"]
            desc = profile["desc"]
            hum = profile["humidity"]
            wind = profile["wind"]
            rain_p = profile["rain_prob"]
            suitability, reason = cls.classify_suitability(cond, rain_p, temp)

            data = {
                "city": city.title(),
                "country": "India" if city_clean in ["ooty", "chennai", "munnar", "goa", "jaipur"] else "Global",
                "temperature": temp,
                "feels_like": round(temp - 1.2 if temp < 20 else temp + 1.8, 1),
                "condition": cond,
                "description": desc,
                "humidity": hum,
                "wind_speed": wind,
                "icon": "02d" if cond == "Clouds" else ("10d" if "Rain" in cond else "01d"),
                "suitability": suitability,
                "suitability_reason": reason,
                "is_live_api": False
            }

        # Generate 5-Day Forecast
        forecast = []
        base_temp = data["temperature"]
        for day_offset in range(1, 6):
            f_date = (datetime.now() + timedelta(days=day_offset)).strftime("%a, %b %d")
            delta = ((day_offset * 3) % 5) - 2.0
            day_temp = round(base_temp + delta, 1)
            
            # Simulate rainy day on day 3 if in hill station for demonstration of weather alternative trigger
            is_rainy_day = (day_offset == 3 and city_clean in ["ooty", "munnar"])
            cond_f = "Rain" if is_rainy_day else data["condition"]
            desc_f = "Heavy Shola Rain & Mountain Fog" if is_rainy_day else data["description"]
            rain_prob_f = 85 if is_rainy_day else max(10, (data["humidity"] // 2) + day_offset * 5)
            
            s_f, _ = cls.classify_suitability(cond_f, rain_prob_f, day_temp)

            forecast.append({
                "date": f_date,
                "temp_min": round(day_temp - 4.5, 1),
                "temp_max": round(day_temp + 3.0, 1),
                "temp_day": day_temp,
                "condition": cond_f,
                "description": desc_f,
                "icon": "10d" if "Rain" in cond_f else ("03d" if "Cloud" in cond_f else "01d"),
                "rain_probability": rain_prob_f,
                "humidity": min(95, data["humidity"] + (10 if is_rainy_day else 0)),
                "wind_speed": round(data["wind_speed"] + (3.0 if is_rainy_day else 0), 1),
                "suitability": s_f
            })

        # Generate Hourly Timeline Forecast
        hourly_slots = [
            ("06:00 AM", -3.0, "Mist & Fog" if "ooty" in city_clean else "Clear Skies", 15),
            ("09:00 AM", -1.0, data["condition"], 20),
            ("12:00 PM", +2.5, "Partly Cloudy", 25),
            ("03:00 PM", +1.5, "Scattered Showers" if "ooty" in city_clean else data["condition"], 45 if "ooty" in city_clean else 20),
            ("06:00 PM", -0.5, "Cool Evening Breeze", 30),
            ("09:00 PM", -2.5, "Chilly Night Skies", 10)
        ]
        hourly_forecast = []
        for time_label, t_delta, cond_h, r_prob in hourly_slots:
            h_temp = round(base_temp + t_delta, 1)
            hourly_forecast.append({
                "time": time_label,
                "temperature": h_temp,
                "condition": cond_h,
                "rain_probability": r_prob,
                "humidity": min(95, data["humidity"] + int(t_delta * -2)),
                "icon": "10d" if "Shower" in cond_h or "Rain" in cond_h else ("03d" if "Cloud" in cond_h else ("01d" if "AM" in time_label or "PM" in time_label and "09" not in time_label else "01n"))
            })

        # Generate Contextual Weather Alerts
        alerts = []
        if data["suitability"] == "UNSUITABLE":
            alerts.append({
                "level": "WARNING",
                "title": "Severe Weather Warning",
                "message": f"Heavy showers & reduced visibility in {city.title()}. Outdoor treks suspended."
            })
        elif "rain" in data["condition"].lower():
            alerts.append({
                "level": "CAUTION",
                "title": "Rain Advisory",
                "message": "Intermittent mountain rain expected. Pack umbrellas & waterproof jackets."
            })
        else:
            alerts.append({
                "level": "INFO",
                "title": "Optimal Travel Conditions",
                "message": f"Pleasant conditions ({data['temperature']}°C). High visibility for viewpoints."
            })

        data["forecast"] = forecast
        data["hourly_forecast"] = hourly_forecast
        data["alerts"] = alerts
        return data

weather_service = WeatherService()
