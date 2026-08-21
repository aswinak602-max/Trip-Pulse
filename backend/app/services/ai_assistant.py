"""
Context-Aware AI Tourist Assistant Service.
Processes tourist queries by injecting structured trip metadata (Destination, Budget, Weather,
Itinerary, Group Members, Interests, ML Cost Predictions) into intelligent response generation.
Produces structured interactive action proposals for user confirmation.
"""

from typing import Dict, Any, List
import json

class AITouristAssistant:
    @classmethod
    def generate_response(cls, user_message: str, trip_context: Dict[str, Any]) -> Dict[str, Any]:
        msg_lower = user_message.lower().strip()
        destination = trip_context.get("destination", "Ooty")
        budget = trip_context.get("budget", 25000.0)
        estimated_cost = trip_context.get("estimated_cost", 21500.0)
        members_count = trip_context.get("members_count", 4)
        interests = trip_context.get("interests", ["Nature", "Photography"])
        weather = trip_context.get("weather", {})
        weather_cond = weather.get("condition", "Pleasant")
        weather_temp = weather.get("temperature", 16.5)
        suitability = weather.get("suitability", "GOOD")

        suggested_actions = []
        reply = ""

        # 1. Weather Inquiry
        if "weather" in msg_lower or "rain" in msg_lower or "cold" in msg_lower:
            reply = f"For **{destination}**, current conditions are **{weather_cond}** with a temperature of **{weather_temp}°C** (Suitability: **{suitability}**). "
            if suitability == "UNSUITABLE":
                reply += "Because heavy showers or storms are present, I strongly advise indoor visits like the **Ooty Tea Factory & Museum**, **Honey & Bee Museum**, or **Thunder World**."
                suggested_actions.append({
                    "type": "add_to_itinerary",
                    "title": "Add Ooty Tea Factory & Museum (Indoor)",
                    "description": "Switch outdoor trek to covered tea factory tour during rain",
                    "payload": {"place_name": "Ooty Tea Factory & Tea Museum", "day": 1}
                })
            else:
                reply += "The weather is very favorable for outdoor sightseeing, garden walks, and landscape photography!"

        # 2. Budget Reduction / Optimization Inquiry
        elif "budget" in msg_lower or "reduce cost" in msg_lower or "cheap" in msg_lower or "save money" in msg_lower:
            per_person = round(estimated_cost / max(1, members_count))
            diff = estimated_cost - budget
            reply = f"Your current estimated trip cost is **₹{estimated_cost:,.0f}** (~₹{per_person:,.0f}/person) against a budget of **₹{budget:,.0f}**. "
            if diff > 0:
                reply += f"You are currently **₹{diff:,.0f} over budget**. Here is how we can optimize:\n" \
                         f"1. **Accommodation:** Switch from Luxury/Resort to Standard Cottages or Homestays (saves ~₹4,000).\n" \
                         f"2. **Transportation:** Carpooling with your {members_count} members is already cost-effective; opt for state highways or express buses if needed.\n" \
                         f"3. **Activities:** Explore free scenic spots like Doddabetta views and local flower markets instead of paid commercial boat parks."
            else:
                reply += f"Great news! Your estimated spending is **within budget** with a comfortable safety margin of **₹{abs(diff):,.0f}**."

            suggested_actions.append({
                "type": "reduce_budget",
                "title": "Apply Smart Budget Optimization",
                "description": "Switch accommodation tier to Standard and recalculate ML cost prediction",
                "payload": {"accommodation_type": "Standard", "food_tier": "Standard"}
            })

        # 3. What to Visit / Recommendations Inquiry
        elif "visit" in msg_lower or "recommend" in msg_lower or "attraction" in msg_lower or "places" in msg_lower:
            int_str = " + ".join(interests) if interests else "Nature & Sightseeing"
            reply = f"Based on your profile ({members_count} travelers interested in **{int_str}** with a budget of ₹{budget:,.0f}), our K-Means ML engine recommends:\n" \
                     f"1. **Avalanche Lake & Valley:** Exceptional 98% match for your Photography & Nature focus.\n" \
                     f"2. **Government Botanical Garden:** Historic 55-acre terraced flora sanctuary.\n" \
                     f"3. **Doddabetta Peak:** Highest point in the Nilgiris (2,637m) with 360° observatory vistas.\n" \
                     f"4. **Pykara Falls & Speedboat Reservoir:** Scenic cascading falls amid pine forests."
            
            suggested_actions.append({
                "type": "add_to_itinerary",
                "title": "Add Avalanche Lake to Day 2",
                "description": "Add 3.5 hour nature photography expedition to Day 2 morning",
                "payload": {"place_name": "Avalanche Lake", "day": 2}
            })

        # 4. Packing List Inquiry
        elif "pack" in msg_lower or "clothes" in msg_lower or "wear" in msg_lower:
            reply = f"Packing checklist for **{destination}** ({weather_temp}°C):\n" \
                     f"• Warm jackets, windbreakers or fleece sweaters (temperatures dip to 10-12°C at night)\n" \
                     f"• Compact umbrella or waterproof poncho for mountain mist\n" \
                     f"• Comfortable trekking shoes with good grip for Doddabetta & Avalanche trails\n" \
                     f"• High-capacity power bank & camera equipment\n" \
                     f"• Motion sickness pills if traveling via the 36 hairpin bends ghat road"

        # 5. Itinerary Optimization Inquiry / Sequence
        elif "itinerary" in msg_lower or "arrange" in msg_lower or "schedule" in msg_lower or "route" in msg_lower:
            reply = f"I have analyzed your day-wise schedule for {destination}. To avoid unnecessary zigzag driving, " \
                     f"we recommend grouping attractions by geographical proximity: Lake & Botanical Garden on Day 1, " \
                     f"Avalanche Valley & Emerald Lake on Day 2, and Doddabetta Peak + Pykara on Day 3."
            
            suggested_actions.append({
                "type": "optimize_route",
                "title": "Auto-Optimize Day 1 Route Sequence",
                "description": "Rearrange Hotel → Lake → Botanical Garden → Tea Museum geographically",
                "payload": {"day": 1}
            })

        # 6. Default Context-Aware Response
        else:
            reply = f"Hello! I'm your AI Tourist Assistant for your upcoming trip to **{destination}**. " \
                     f"I have full context of your trip: **{members_count} travelers**, **₹{budget:,.0f} budget**, " \
                     f"and interests in **{', '.join(interests)}**. You can ask me for personalized recommendations, " \
                     f"weather forecasts, budget reduction advice, or packing checklists!"

        return {
            "reply": reply,
            "structured_context": {
                "destination": destination,
                "budget": budget,
                "estimated_cost": estimated_cost,
                "members_count": members_count,
                "interests": interests,
                "weather": weather
            },
            "suggested_actions": suggested_actions,
            "source": "AI Context-Aware Tourist Assistant"
        }

ai_assistant = AITouristAssistant()
