"""
Import Daft/4PM properties for agencies that have daft_api_key or primary_source='4pm'.
Stores records in the properties table with source='daft'. Other sources remain untouched.
"""

import os
import json
import datetime
import requests
from dotenv import load_dotenv
from sqlalchemy import or_
from App import app
from models import db, Agency, Property, ImportActivity

load_dotenv()

FETCH_TIMEOUT = int(os.getenv("FETCH_TIMEOUT", "600"))


def sanitize(value, default=""):
    if value is None:
        return default
    return str(value)


def clamp(value, max_len=255):
    if value is None:
        return None
    return str(value)[:max_len]


def map_property_4pm(raw, agency_name):
    # Mapping aligned to daftapi.4pm.ie JSON (see daft.json sample)
    address = raw.get("full_address") or raw.get("address") or "Unknown address"
    price = raw.get("price") or raw.get("rent") or "N/A"
    beds = raw.get("bedrooms") or raw.get("beds") or 0
    baths = raw.get("bathrooms") or raw.get("baths") or 0
    size = raw.get("square_metres") or raw.get("sq_ft") or raw.get("acres") or "N/A"

    prop_type = raw.get("property_type") or raw.get("house_type")
    status = "Agreed" if str(raw.get("agreed") or "0") != "0" else "For Sale"
    state_live = "Live"
    sale_type = raw.get("selling_type") or raw.get("price_type") or status

    photos = [
        raw.get("large_thumbnail_url"),
        raw.get("medium_thumbnail_url"),
        raw.get("small_thumbnail_url"),
        raw.get("ipad_search_url"),
        raw.get("ipad_gallery_url"),
    ]
    photos = [p for p in photos if p]
    main_photo = photos[0] if photos else None
    images_json = clamp(json.dumps(photos[:5]), 255) if photos else None

    return Property(
        agency_agent_name=clamp(raw.get("agent") or raw.get("Agent") or agency_name),
        agency_name=clamp(agency_name),
        house_location=clamp(address),
        house_price=clamp(sanitize(price, "N/A")),
        house_bedrooms=int(beds or 0),
        house_bathrooms=int(baths or 0),
        house_mt_squared=clamp(sanitize(size, "N/A")),
        house_extra_info_1=clamp(sanitize(prop_type, None)),
        house_extra_info_2=clamp(sanitize(status, None)),
        house_extra_info_3=clamp(sanitize(state_live, None)),
        house_extra_info_4=clamp(sanitize(sale_type, None)),
        agency_image_url=clamp(main_photo),
        images_url_house=images_json,
        source="daft",
    )


def fetch_daft_api(key):
    # New endpoint for Daft/4PM
    url = f"https://daftapi.4pm.ie/property?key={key}"
    resp = requests.get(url, timeout=FETCH_TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        combined = []
        for v in data.values():
            if isinstance(v, list):
                combined.extend(v)
        return combined
    return []


def import_daft():
    with app.app_context():
        agencies = Agency.query.filter(
            or_(Agency.primary_source == "4pm", Agency.daft_api_key.isnot(None))
        ).all()

        for agency in agencies:
            key = (agency.daft_api_key or agency.unique_key or "").strip()
            if not key:
                print(f"[Daft] Skipping {agency.name}: missing daft_api_key/unique_key")
                continue

            # Clear only daft records for this agency
            db.session.query(Property).filter(
                Property.agency_name == agency.name,
                Property.source == "daft",
            ).delete()

            print(f"[Daft] Fetching for agency '{agency.name}' with key '{key}'")
            added = 0
            started = datetime.datetime.now(datetime.timezone.utc)
            try:
                rows = fetch_daft_api(key) or []
                for raw in rows:
                    try:
                        db.session.add(map_property_4pm(raw, agency.name))
                        added += 1
                    except Exception as exc:
                        print(f"[Daft] Skip property for {agency.name}: {exc}")
            except Exception as exc:
                print(f"[Daft] Failed fetching {agency.name}: {exc}")
                db.session.add(
                    ImportActivity(
                        agency_name=agency.name,
                        source="daft",
                        added_count=added,
                        status="failed",
                        message=str(exc),
                        started_at=started,
                        finished_at=datetime.datetime.now(datetime.timezone.utc),
                    )
                )
                db.session.commit()
                continue

            try:
                db.session.commit()
                finished = datetime.datetime.now(datetime.timezone.utc)
                print(f"[Daft] Imported {added} properties for {agency.name}")
                db.session.add(
                    ImportActivity(
                        agency_name=agency.name,
                        source="daft",
                        added_count=added,
                        status="ok",
                        message=None,
                        started_at=started,
                        finished_at=finished,
                        duration_sec=(finished - started).total_seconds(),
                    )
                )
                db.session.commit()
            except Exception as exc:
                db.session.rollback()
                print(f"[Daft] Commit failed for {agency.name}: {exc}")
                db.session.add(
                    ImportActivity(
                        agency_name=agency.name,
                        source="daft",
                        added_count=added,
                        status="failed",
                        message=str(exc),
                        started_at=started,
                        finished_at=datetime.datetime.utcnow(),
                    )
                )
                db.session.commit()


if __name__ == "__main__":
    import_daft()
