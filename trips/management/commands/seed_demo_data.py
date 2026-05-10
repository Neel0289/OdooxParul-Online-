from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

from trips.models import Activity, Budget, Note, PackingItem, Stop, Trip, TripShare, UserProfile


class Command(BaseCommand):
    help = "Seed rich demo data for UI review"

    def handle(self, *args, **options):
        today = timezone.now().date()

        user, created = User.objects.get_or_create(
            username="demo_traveler",
            defaults={
                "email": "demo@traveloop.app",
                "first_name": "Demo",
                "last_name": "Traveler",
            },
        )
        user.set_password("demo12345")
        user.first_name = "Demo"
        user.last_name = "Traveler"
        user.email = "demo@traveloop.app"
        user.save()

        UserProfile.objects.get_or_create(user=user, defaults={"bio": "A curated demo account for app review."})

        # Keep reruns deterministic by replacing only demo account's trips.
        Trip.objects.filter(user=user).delete()

        trip_specs = [
            {
                "title": "Japan Spring Explorer",
                "description": "Tokyo to Kyoto with food alleys, temples, and mountain day-trips.",
                "start": today + timedelta(days=12),
                "end": today + timedelta(days=24),
                "budget": Decimal("3200.00"),
                "is_public": True,
                "stops": [
                    {
                        "city": "Tokyo",
                        "country": "Japan",
                        "lat": 35.6762,
                        "lng": 139.6503,
                        "arrival": today + timedelta(days=12),
                        "departure": today + timedelta(days=16),
                        "duration": 4,
                        "cost": "high",
                        "desc": "Shibuya crossings, ramen crawl, and skyline nights.",
                        "activities": [
                            ("Senso-ji Temple Walk", "culture", Decimal("0.00"), 2),
                            ("Tsukiji Food Tour", "food", Decimal("60.00"), 3),
                            ("Shinjuku Night Photography", "sightseeing", Decimal("25.00"), 2),
                        ],
                    },
                    {
                        "city": "Kyoto",
                        "country": "Japan",
                        "lat": 35.0116,
                        "lng": 135.7681,
                        "arrival": today + timedelta(days=16),
                        "departure": today + timedelta(days=21),
                        "duration": 5,
                        "cost": "medium",
                        "desc": "Bamboo forests, tea houses, and hidden shrines.",
                        "activities": [
                            ("Arashiyama Bamboo Grove", "sightseeing", Decimal("15.00"), 2),
                            ("Tea Ceremony", "culture", Decimal("40.00"), 1),
                            ("Philosopher's Path", "relaxation", Decimal("0.00"), 2),
                        ],
                    },
                    {
                        "city": "Osaka",
                        "country": "Japan",
                        "lat": 34.6937,
                        "lng": 135.5023,
                        "arrival": today + timedelta(days=21),
                        "departure": today + timedelta(days=24),
                        "duration": 3,
                        "cost": "medium",
                        "desc": "Street food and bright neon energy.",
                        "activities": [
                            ("Dotonbori Street Eats", "food", Decimal("35.00"), 2),
                            ("Osaka Castle Visit", "culture", Decimal("12.00"), 2),
                        ],
                    },
                ],
                "budgets": [
                    ("transport", Decimal("900.00"), Decimal("0.00"), "Flights + JR pass"),
                    ("accommodation", Decimal("1200.00"), Decimal("0.00"), "Hotels + ryokan split"),
                    ("food", Decimal("650.00"), Decimal("0.00"), "Street eats + 2 premium dinners"),
                    ("activities", Decimal("350.00"), Decimal("0.00"), "Museums and tours"),
                    ("other", Decimal("100.00"), Decimal("0.00"), "Local SIM + misc"),
                ],
                "packing": [
                    ("Passport", "documents", True),
                    ("Universal Adapter", "electronics", False),
                    ("Walking Shoes", "clothing", True),
                    ("Rain Jacket", "clothing", False),
                    ("Medication Kit", "medications", False),
                ],
                "notes": [
                    "Book Ghibli Museum tickets 30 days in advance.",
                    "Reserve Kyoto tea ceremony slot for day 6.",
                ],
            },
            {
                "title": "Bali Workation",
                "description": "Two-week island rhythm with coworking mornings and sunset surf sessions.",
                "start": today - timedelta(days=4),
                "end": today + timedelta(days=9),
                "budget": Decimal("2100.00"),
                "is_public": False,
                "stops": [
                    {
                        "city": "Canggu",
                        "country": "Indonesia",
                        "lat": -8.6478,
                        "lng": 115.1385,
                        "arrival": today - timedelta(days=4),
                        "departure": today + timedelta(days=2),
                        "duration": 6,
                        "cost": "medium",
                        "desc": "Coworking cafes and beach clubs.",
                        "activities": [
                            ("Morning Surf Lesson", "adventure", Decimal("28.00"), 2),
                            ("Cowork Session", "other", Decimal("15.00"), 4),
                        ],
                    },
                    {
                        "city": "Ubud",
                        "country": "Indonesia",
                        "lat": -8.5069,
                        "lng": 115.2625,
                        "arrival": today + timedelta(days=2),
                        "departure": today + timedelta(days=9),
                        "duration": 7,
                        "cost": "low",
                        "desc": "Rice terraces, waterfalls, and yoga retreats.",
                        "activities": [
                            ("Tegalalang Rice Terrace", "sightseeing", Decimal("10.00"), 2),
                            ("Evening Yoga Class", "relaxation", Decimal("14.00"), 1),
                        ],
                    },
                ],
                "budgets": [
                    ("accommodation", Decimal("850.00"), Decimal("620.00"), "Villa + co-living"),
                    ("food", Decimal("450.00"), Decimal("210.00"), "Cafes and local warungs"),
                    ("activities", Decimal("300.00"), Decimal("92.00"), "Surf, yoga, day tours"),
                    ("transport", Decimal("250.00"), Decimal("130.00"), "Scooter + airport rides"),
                ],
                "packing": [
                    ("Laptop", "electronics", True),
                    ("Swimwear", "clothing", True),
                    ("Portable SSD", "electronics", True),
                    ("Toiletry Pouch", "toiletries", False),
                ],
                "notes": [
                    "Current stay: Canggu coworking pass active.",
                    "Book Mt. Batur sunrise hike for next week.",
                ],
            },
            {
                "title": "Istanbul Weekend Escape",
                "description": "Historic neighborhoods, rooftop tea, and Bosphorus evenings.",
                "start": today - timedelta(days=40),
                "end": today - timedelta(days=36),
                "budget": Decimal("780.00"),
                "is_public": True,
                "stops": [
                    {
                        "city": "Istanbul",
                        "country": "Turkey",
                        "lat": 41.0082,
                        "lng": 28.9784,
                        "arrival": today - timedelta(days=40),
                        "departure": today - timedelta(days=36),
                        "duration": 4,
                        "cost": "medium",
                        "desc": "Old city and modern districts in one route.",
                        "activities": [
                            ("Hagia Sophia Visit", "culture", Decimal("25.00"), 2),
                            ("Bosphorus Sunset Cruise", "relaxation", Decimal("32.00"), 2),
                            ("Grand Bazaar Walk", "shopping", Decimal("0.00"), 2),
                        ],
                    }
                ],
                "budgets": [
                    ("transport", Decimal("260.00"), Decimal("255.00"), "Round-trip flights"),
                    ("accommodation", Decimal("240.00"), Decimal("240.00"), "Boutique hotel"),
                    ("food", Decimal("160.00"), Decimal("172.00"), "Kebabs + rooftop dinner"),
                    ("activities", Decimal("90.00"), Decimal("82.00"), "Museum and cruise"),
                ],
                "packing": [
                    ("Travel Documents", "documents", True),
                    ("Power Bank", "electronics", True),
                    ("Light Jacket", "clothing", True),
                ],
                "notes": [
                    "Completed trip. Keep this template for future long-weekend escapes.",
                ],
            },
        ]

        created_trips = []
        for spec in trip_specs:
            trip = Trip.objects.create(
                user=user,
                title=spec["title"],
                description=spec["description"],
                start_date=spec["start"],
                end_date=spec["end"],
                total_budget=spec["budget"],
                is_public=spec["is_public"],
            )

            stop_map = {}
            for idx, stop_spec in enumerate(spec["stops"]):
                stop = Stop.objects.create(
                    trip=trip,
                    city_name=stop_spec["city"],
                    country=stop_spec["country"],
                    latitude=stop_spec["lat"],
                    longitude=stop_spec["lng"],
                    arrival_date=stop_spec["arrival"],
                    departure_date=stop_spec["departure"],
                    duration_days=stop_spec["duration"],
                    cost_index=stop_spec["cost"],
                    description=stop_spec["desc"],
                    order=idx,
                )
                stop_map[idx] = stop

                for title, category, cost, duration in stop_spec["activities"]:
                    Activity.objects.create(
                        stop=stop,
                        title=title,
                        category=category,
                        cost=cost,
                        duration_hours=duration,
                        description=f"{title} experience in {stop.city_name}.",
                    )

            for category, est, actual, note in spec["budgets"]:
                Budget.objects.create(
                    trip=trip,
                    category=category,
                    estimated_cost=est,
                    actual_cost=actual,
                    notes=note,
                )

            for item_name, category, packed in spec["packing"]:
                PackingItem.objects.create(
                    trip=trip,
                    item_name=item_name,
                    category=category,
                    is_packed=packed,
                )

            for idx, content in enumerate(spec["notes"]):
                Note.objects.create(
                    trip=trip,
                    stop=stop_map.get(idx % len(stop_map)) if stop_map else None,
                    content=content,
                    timestamp=timezone.now() - timedelta(days=idx),
                )

            if spec["is_public"]:
                TripShare.objects.create(trip=trip, is_public=True)

            created_trips.append(trip)

        self.stdout.write(self.style.SUCCESS("Demo data injected successfully."))
        self.stdout.write(f"User: demo_traveler / Password: demo12345")
        self.stdout.write(f"Trips created: {len(created_trips)}")
