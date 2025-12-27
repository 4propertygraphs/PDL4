"""
Import Acquaint feeds listed in A-data.json into the properties table.
- Reads A-data.json from repo root (expects list of {"SitePrefix": "...", "url": "..."}).
- For each prefix, fetches the feed, parses properties, stores with source='acquaint' and agency_name=SitePrefix.
- Before inserting, removes existing properties for that agency_name with source='acquaint' to avoid duplicates.
"""

import json
import pathlib
import datetime
from dotenv import load_dotenv
from App import app
from models import db, Property, ImportActivity
from myhome_import import fetch_acquaint, parse_acquaint, map_property_acquaint

load_dotenv()


def load_prefixes():
    path = pathlib.Path(__file__).resolve().parent.parent / "A-data.json"
    data = json.loads(path.read_text())
    prefixes = []
    for item in data:
        pref = item.get("SitePrefix")
        if pref:
            prefixes.append(pref.strip())
    return list(dict.fromkeys(prefixes))  # unique


def import_all():
    prefixes = load_prefixes()
    with app.app_context():
        for pref in prefixes:
            if not pref:
                continue
            print(f"[Acquaint] Fetching prefix {pref}")
            started = datetime.datetime.utcnow()
            try:
                xml_text = fetch_acquaint(pref)
                rows = parse_acquaint(xml_text) or []
            except Exception as exc:
                print(f"[Acquaint] Failed fetch {pref}: {exc}")
                db.session.add(ImportActivity(
                    agency_name=pref,
                    source="acquaint",
                    added_count=0,
                    status="failed",
                    message=str(exc),
                    started_at=started,
                    finished_at=datetime.datetime.utcnow()
                ))
                db.session.commit()
                continue

            # clear old
            db.session.query(Property).filter(
                Property.agency_name == pref,
                Property.source == 'acquaint'
            ).delete()

            added = 0
            for raw in rows:
                try:
                    prop = map_property_acquaint(raw, pref)
                    prop.source = 'acquaint'
                    db.session.add(prop)
                    added += 1
                except Exception as exc:
                    print(f"[Acquaint] Skip property ({pref}): {exc}")
            try:
                db.session.commit()
                print(f"[Acquaint] Imported {added} properties for {pref}")
                finished = datetime.datetime.utcnow()
                db.session.add(ImportActivity(
                    agency_name=pref,
                    source="acquaint",
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
                print(f"[Acquaint] Commit failed for {pref}: {exc}")
                db.session.add(ImportActivity(
                    agency_name=pref,
                    source="acquaint",
                    added_count=added,
                    status="failed",
                    message=str(exc),
                    started_at=started,
                    finished_at=datetime.datetime.utcnow()
                ))
                db.session.commit()


if __name__ == "__main__":
    import_all()
