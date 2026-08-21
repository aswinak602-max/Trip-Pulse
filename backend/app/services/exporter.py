"""
TripPulse Document & Itinerary Exporter Service.
Generates structured Markdown, JSON, and clean printable HTML documents
for full trip itineraries, checklists, budget analytics, and group debt settlements.
"""

from typing import Dict, Any, List
import json

class TripExporter:
    @staticmethod
    def generate_html(trip_data: Dict[str, Any]) -> str:
        """Generates a responsive, modern, printable standalone HTML trip summary document."""
        title = trip_data.get("title", "Trip Plan")
        origin = trip_data.get("current_location", "Origin")
        dest = trip_data.get("destination", "Destination")
        start = trip_data.get("start_date", "")
        end = trip_data.get("end_date", "")
        days = trip_data.get("days_count", 3)
        members_count = trip_data.get("members_count", 4)
        budget = trip_data.get("budget", 25000)
        est = trip_data.get("estimated_cost", 21500)
        actual = trip_data.get("total_actual_spent", 0)

        itinerary = trip_data.get("itinerary_items", [])
        expenses = trip_data.get("expenses", [])
        checklists = trip_data.get("checklists", [])

        # Group itinerary by day
        it_by_day = {}
        for item in itinerary:
            d = item.get("day_number", 1)
            if d not in it_by_day:
                it_by_day[d] = []
            it_by_day[d].append(item)

        # Itinerary rows HTML
        itin_html = ""
        for day in sorted(it_by_day.keys()):
            itin_html += f"""
            <div style="margin-bottom: 24px;">
                <h3 style="color: #1e3a8a; border-bottom: 2px solid #93c5fd; padding-bottom: 6px; margin-bottom: 12px; font-size: 1.15rem;">
                    Day {day} Schedule
                </h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 0.92rem;">
                    <thead>
                        <tr style="background: #f1f5f9; text-align: left;">
                            <th style="padding: 8px 12px; border: 1px solid #cbd5e1;">Time</th>
                            <th style="padding: 8px 12px; border: 1px solid #cbd5e1;">Activity / Destination</th>
                            <th style="padding: 8px 12px; border: 1px solid #cbd5e1;">Type</th>
                            <th style="padding: 8px 12px; border: 1px solid #cbd5e1;">Duration</th>
                            <th style="padding: 8px 12px; border: 1px solid #cbd5e1;">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
            """
            for it in sorted(it_by_day[day], key=lambda x: x.get("sort_order", 0)):
                name = it.get("custom_title") or (it.get("place", {}) or {}).get("name", "Stop")
                time_slot = it.get("time_slot", "")
                act_type = it.get("activity_type", "attraction").title()
                dur = it.get("duration_hours", 2.0)
                notes = it.get("notes", "") or "-"
                itin_html += f"""
                        <tr>
                            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: 600; color: #2563eb;">{time_slot}</td>
                            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: 600;">{name}</td>
                            <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">{act_type}</td>
                            <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">{dur} hrs</td>
                            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; color: #64748b;">{notes}</td>
                        </tr>
                """
            itin_html += """
                    </tbody>
                </table>
            </div>
            """

        # Expenses rows HTML
        exp_html = ""
        if expenses:
            exp_html = """
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9rem;">
                <thead>
                    <tr style="background: #f1f5f9; text-align: left;">
                        <th style="padding: 8px 12px; border: 1px solid #cbd5e1;">Date</th>
                        <th style="padding: 8px 12px; border: 1px solid #cbd5e1;">Category</th>
                        <th style="padding: 8px 12px; border: 1px solid #cbd5e1;">Description</th>
                        <th style="padding: 8px 12px; border: 1px solid #cbd5e1;">Paid By</th>
                        <th style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
            """
            for e in expenses:
                exp_html += f"""
                    <tr>
                        <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">{e.get("date", "")}</td>
                        <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">{e.get("category", "")}</td>
                        <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">{e.get("description", "")}</td>
                        <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">{e.get("paid_by", "")}</td>
                        <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700;">₹{e.get("amount", 0):,.2f}</td>
                    </tr>
                """
            exp_html += "</tbody></table>"
        else:
            exp_html = "<p style='color: #64748b; font-style: italic;'>No expenses logged yet.</p>"

        # Checklists HTML
        check_html = "<div style='display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px;'>"
        for c in checklists:
            done = c.get("is_completed", False)
            icon = "☑" if done else "☐"
            color = "#16a34a" if done else "#64748b"
            check_html += f"""
            <div style="padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.88rem;">
                <span style="color: {color}; font-weight: bold; margin-right: 6px;">{icon}</span>
                <span style="color: #1e293b; {'text-decoration: line-through;' if done else ''}">{c.get("item_text", "")}</span>
                <span style="float: right; color: #94a3b8; font-size: 0.78rem;">{c.get("category", "")}</span>
            </div>
            """
        check_html += "</div>"

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>TripPulse Itinerary - {title}</title>
    <style>
        @media print {{
            body {{ font-size: 12pt; background: #fff !important; color: #000 !important; }}
            .no-print {{ display: none; }}
            .page-break {{ page-break-after: always; }}
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.5;
            color: #1e293b;
            background: #f8fafc;
            padding: 30px;
            margin: 0 auto;
            max-width: 900px;
        }}
        .card {{
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.06);
            border: 1px solid #e2e8f0;
            padding: 24px;
            margin-bottom: 24px;
        }}
        .header-banner {{
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: #ffffff;
            padding: 28px 32px;
            border-radius: 12px;
            margin-bottom: 24px;
        }}
        .stat-grid {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
            margin-top: 16px;
        }}
        .stat-box {{
            background: rgba(255,255,255,0.15);
            padding: 12px 16px;
            border-radius: 8px;
        }}
        .stat-label {{ font-size: 0.78rem; color: #bfdbfe; text-transform: uppercase; letter-spacing: 0.05em; }}
        .stat-val {{ font-size: 1.25rem; font-weight: 800; color: #ffffff; margin-top: 2px; }}
    </style>
</head>
<body>
    <div class="header-banner">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <span style="background: rgba(255,255,255,0.2); font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">
                    TripPulse Official Itinerary
                </span>
                <h1 style="margin: 8px 0 4px 0; font-size: 1.8rem; font-weight: 800;">{title}</h1>
                <p style="margin: 0; color: #bfdbfe; font-size: 0.95rem;">
                    {origin} ➔ {dest} • {start} to {end} ({days} Days) • {members_count} Travelers
                </p>
            </div>
            <button class="no-print" onclick="window.print()" style="background: #ffffff; color: #1e3a8a; font-weight: 700; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                Print / Save PDF
            </button>
        </div>

        <div class="stat-grid">
            <div class="stat-box">
                <div class="stat-label">Trip Budget</div>
                <div class="stat-val">₹{budget:,.0f}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">ML Prediction</div>
                <div class="stat-val">₹{est:,.0f}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Actual Spent</div>
                <div class="stat-val">₹{actual:,.0f}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Per Traveler</div>
                <div class="stat-val">₹{round(actual / max(1, members_count)):,.0f}</div>
            </div>
        </div>
    </div>

    <!-- Itinerary Section -->
    <div class="card">
        <h2 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 18px;">
            Day-by-Day Travel Itinerary
        </h2>
        {itin_html if itin_html else "<p style='color: #64748b;'>No itinerary items scheduled.</p>"}
    </div>

    <!-- Expenses & Settlements -->
    <div class="card">
        <h2 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 6px;">
            Trip Expenses & Account Ledger
        </h2>
        {exp_html}
    </div>

    <!-- Checklists -->
    <div class="card">
        <h2 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 6px;">
            Packing & Travel Checklists
        </h2>
        {check_html if checklists else "<p style='color: #64748b;'>No checklists registered.</p>"}
    </div>

    <div style="text-align: center; color: #94a3b8; font-size: 0.8rem; margin-top: 30px;" class="no-print">
        Generated by TripPulse AI Travel Platform • Powered by FastAPI & React
    </div>
</body>
</html>
"""
        return html

    @staticmethod
    def generate_markdown(trip_data: Dict[str, Any]) -> str:
        """Generates clean Markdown documentation for exporting."""
        title = trip_data.get("title", "Trip Plan")
        origin = trip_data.get("current_location", "Origin")
        dest = trip_data.get("destination", "Destination")
        start = trip_data.get("start_date", "")
        end = trip_data.get("end_date", "")
        days = trip_data.get("days_count", 3)
        members_count = trip_data.get("members_count", 4)
        budget = trip_data.get("budget", 25000)
        est = trip_data.get("estimated_cost", 21500)
        actual = trip_data.get("total_actual_spent", 0)

        itinerary = trip_data.get("itinerary_items", [])
        expenses = trip_data.get("expenses", [])
        checklists = trip_data.get("checklists", [])

        md = f"# TripPulse Official Itinerary: {title}\n\n"
        md += f"- **Route**: {origin} ➔ {dest}\n"
        md += f"- **Dates**: {start} to {end} ({days} Days)\n"
        md += f"- **Travelers**: {members_count} members\n"
        md += f"- **Budget**: ₹{budget:,.2f} | **ML Estimate**: ₹{est:,.2f} | **Actual Spent**: ₹{actual:,.2f}\n\n"
        md += "## Day-by-Day Schedule\n\n"

        it_by_day = {}
        for item in itinerary:
            d = item.get("day_number", 1)
            if d not in it_by_day:
                it_by_day[d] = []
            it_by_day[d].append(item)

        for day in sorted(it_by_day.keys()):
            md += f"### Day {day}\n\n"
            md += "| Time | Activity / Place | Type | Duration | Notes |\n"
            md += "| :--- | :--- | :--- | :--- | :--- |\n"
            for it in sorted(it_by_day[day], key=lambda x: x.get("sort_order", 0)):
                name = it.get("custom_title") or (it.get("place", {}) or {}).get("name", "Stop")
                time_slot = it.get("time_slot", "")
                act_type = it.get("activity_type", "attraction").title()
                dur = it.get("duration_hours", 2.0)
                notes = it.get("notes", "") or "-"
                md += f"| {time_slot} | {name} | {act_type} | {dur} hrs | {notes} |\n"
            md += "\n"

        md += "## Expense Summary\n\n"
        if expenses:
            md += "| Date | Category | Description | Paid By | Amount |\n"
            md += "| :--- | :--- | :--- | :--- | :--- |\n"
            for e in expenses:
                md += f"| {e.get('date')} | {e.get('category')} | {e.get('description')} | {e.get('paid_by')} | ₹{e.get('amount', 0):,.2f} |\n"
            md += f"\n**Total Logged Spending**: ₹{actual:,.2f}\n\n"

        md += "## Checklists\n\n"
        for c in checklists:
            mark = "x" if c.get("is_completed") else " "
            md += f"- [{mark}] {c.get('item_text')} ({c.get('category')})\n"

        return md

trip_exporter = TripExporter()
