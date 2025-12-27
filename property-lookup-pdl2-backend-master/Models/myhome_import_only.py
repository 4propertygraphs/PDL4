"""
Import only MyHome feeds (no Acquaint), and only remove existing MyHome rows per agency.
Keeps other sources (e.g., Acquaint/Daft) intact.
"""

from dotenv import load_dotenv
from sqlalchemy import or_
from App import app
from models import db, Agency, Property, ImportActivity
from myhome_import import fetch_myhome_search, map_property_myhome
import datetime

load_dotenv()


def import_myhome_only():
    with app.app_context():
        agencies = Agency.query.filter(
            or_(
                Agency.primary_source == "myhome",
                Agency.myhome_api_key.isnot(None),
            )
        ).all()

        for agency in agencies:
            api_key = (agency.myhome_api_key or "").strip()
            if not api_key:
                print(f"[MyHome] Skipping {agency.name}: missing myhome_api_key")
                continue

            # remove only MyHome entries for this agency
            db.session.query(Property).filter(
                Property.agency_name == agency.name,
                Property.source == "myhome",
            ).delete()

            print(f"[MyHome] Fetching for agency '{agency.name}' with key '{api_key}'")
            added = 0
            started = datetime.datetime.utcnow()
            try:
                rows = fetch_myhome_search(api_key) or []
                for raw in rows:
                    try:
                        db.session.add(map_property_myhome(raw, agency.name))
                        added += 1
                    except Exception as exc:
                        print(f"[MyHome] Skip property for {agency.name}: {exc}")
            except Exception as exc:
                print(f"[MyHome] Failed fetching {agency.name}: {exc}")
                db.session.add(ImportActivity(
                    agency_name=agency.name,
                    source="myhome",
                    added_count=added,
                    status="failed",
                    message=str(exc),
                    started_at=started,
                    finished_at=datetime.datetime.utcnow()
                ))
                db.session.commit()
                continue

            try:
                db.session.commit()
                print(f"[MyHome] Imported {added} properties for {agency.name}")
                finished = datetime.datetime.utcnow()
                db.session.add(ImportActivity(
                    agency_name=agency.name,
                    source="myhome",
                    added_count=added,
                    status="ok",
                    message=None,
                    started_at=started,
                    finished_at=finished,
                    duration_sec=(finished - started).total_seconds()
                ))
                db.session.commit()
            except Exception as exc:
                db.session.rollback()
                print(f"[MyHome] Commit failed for {agency.name}: {exc}")
                db.session.add(ImportActivity(
                    agency_name=agency.name,
                    source="myhome",
                    added_count=added,
                    status="failed",
                    message=str(exc),
                    started_at=started,
                    finished_at=datetime.datetime.utcnow()
                ))
                db.session.commit()


if __name__ == "__main__":
    import_myhome_only()
