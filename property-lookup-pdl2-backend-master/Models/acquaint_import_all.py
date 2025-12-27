"""
Import all properties from Acquaint feeds for agencies stored in DB.
- Uses site_prefix or acquaint_site_prefix (4 chars) from the agencies table.
- Stores records in the properties table with source='acquaint'.
- Existing properties for each agency are removed before import to avoid duplicates.
"""

import requests
from dotenv import load_dotenv
from sqlalchemy import or_
from App import app
from models import db, Agency, Property
from myhome_import import fetch_acquaint, parse_acquaint, map_property_acquaint

load_dotenv()


def import_acquaint():
    with app.app_context():
        agencies = Agency.query.filter(
            or_(
                Agency.primary_source == 'acquaint',
                Agency.site_prefix.isnot(None),
                Agency.acquaint_site_prefix.isnot(None),
            )
        ).all()

        for agency in agencies:
            prefix = (agency.site_prefix or agency.acquaint_site_prefix or "").strip()
            if not prefix:
                print(f"[Acquaint] Skipping {agency.name}: missing prefix")
                continue

            print(f"[Acquaint] Fetching for agency '{agency.name}' with prefix '{prefix}'")
            try:
                xml_text = fetch_acquaint(prefix)
                rows = parse_acquaint(xml_text) or []
            except Exception as exc:
                print(f"[Acquaint] Failed fetching for {agency.name}: {exc}")
                continue

            # Clear only Acquaint properties for this agency; keep other sources (e.g., MyHome)
            db.session.query(Property).filter(
                Property.agency_name == agency.name,
                Property.source == "acquaint"
            ).delete()

            added = 0
            for raw in rows:
                try:
                    prop = map_property_acquaint(raw, agency.name)
                    prop.source = "acquaint"
                    db.session.add(prop)
                    added += 1
                except Exception as exc:
                    print(f"[Acquaint] Skip property for {agency.name}: {exc}")

            try:
                db.session.commit()
                print(f"[Acquaint] Imported properties for agency {agency.name} (count: {added})")
            except Exception as exc:
                db.session.rollback()
                print(f"[Acquaint] Commit failed for agency {agency.name}: {exc}")


if __name__ == "__main__":
    import_acquaint()
