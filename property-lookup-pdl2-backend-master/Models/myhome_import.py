"""
Import all properties from MyHome and Acquaint for agencies stored in DB.
- MyHome: uses myhome_api_key, PageSize=50
- Acquaint: uses site_prefix or acquaint_site_prefix (4 chars)
Properties are stored in the existing 'properties' table with current columns.
Existing properties for each agency are cleared before import to avoid duplicates.
"""

import os
import json
import requests
from dotenv import load_dotenv
from App import app
from models import db, Agency, Property
from sqlalchemy import or_

load_dotenv()

# Allow long-running feeds; default 600s so bulk Acquaint/MyHome imports do not timeout.
FETCH_TIMEOUT = int(os.getenv("FETCH_TIMEOUT", "600"))


def sanitize_str(value, default=""):
    if value is None:
        return default
    return str(value)


def clamp(value, max_len=255):
    if value is None:
        return None
    s = str(value)
    return s[:max_len]


def map_property_common(agency_name, agent_name, address, price, beds, baths, size, extras, main_photo, photo_urls, source=None):
    # Clamp all string fields to DB limits (varchar 255)
    photo_urls = [p for p in photo_urls if p]
    images_json = clamp(json.dumps(photo_urls[:5]), 255) if photo_urls else None

    prop = Property(
        agency_agent_name=clamp(agent_name or agency_name),
        agency_name=clamp(agency_name),
        house_location=clamp(address or "Unknown address"),
        house_price=clamp(sanitize_str(price, "N/A")),
        house_bedrooms=int(beds or 0),
        house_bathrooms=int(baths or 0),
        house_mt_squared=clamp(sanitize_str(size, "N/A")),
        house_extra_info_1=clamp(sanitize_str(extras[0], None)),
        house_extra_info_2=clamp(sanitize_str(extras[1], None)),
        house_extra_info_3=clamp(sanitize_str(extras[2], None)),
        house_extra_info_4=clamp(sanitize_str(extras[3], None)),
        agency_image_url=clamp(main_photo),
        images_url_house=images_json
    )
    if source:
        try:
            prop.source = clamp(source)
        except Exception:
            pass
    return prop


# ---------------------- MyHome ----------------------

def map_property_myhome(raw, agency_name):
    # Accept MyHome search shape with SearchResults items (see exm.json)
    address = sanitize_str(
        raw.get("DisplayAddress")
        or raw.get("displayAddress")
        or raw.get("OrderedDisplayAddress")
        or raw.get("SeoDisplayAddress")
        or "Unknown address"
    )
    price = raw.get("PriceAsString") or raw.get("price") or raw.get("formattedPrice") or raw.get("displayPrice") or "N/A"

    beds = 0
    bed_str = raw.get("BedsString") or raw.get("beds") or raw.get("bedrooms")
    if isinstance(bed_str, str) and bed_str.strip():
        try:
            beds = int(bed_str.split()[0])
        except Exception:
            beds = 0
    else:
        beds = int(bed_str or 0)

    baths = 0
    bath_str = raw.get("BathString") or raw.get("baths") or raw.get("bathrooms")
    if isinstance(bath_str, str) and bath_str.strip():
        try:
            baths = int(bath_str.split()[0])
        except Exception:
            baths = 0
    else:
        baths = int(bath_str or 0)

    size = raw.get("SizeStringMeters") or raw.get("size") or raw.get("floorArea") or "N/A"

    # Fill extras so FE může zobrazit Type / Sale-Rent / State / Status / Photos count
    property_type = raw.get("PropertyClass") or raw.get("PropertyClassUrlSlug") or raw.get("propertyType") or raw.get("type")
    property_status = raw.get("PropertyStatus") or "For Sale"
    state_live = "Live" if raw.get("IsActive", True) else "Inactive"
    sale_type = raw.get("SaleTypeId") or raw.get("SaleType") or property_status

    photos = raw.get("Photos") or raw.get("photos") or raw.get("images") or []
    if isinstance(photos, dict):
        photos = photos.get("items") or photos.get("large") or []
    photo_urls = []
    for p in photos:
        if isinstance(p, str):
            photo_urls.append(p)
        elif isinstance(p, dict):
            photo_urls.append(p.get("url") or p.get("src") or p.get("large"))
    main_photo = raw.get("MainPhoto") or (photo_urls[0] if photo_urls else None)

    agent_name = sanitize_str(raw.get("GroupName") or raw.get("Group") or raw.get("agentName") or agency_name)

    return map_property_common(
        agency_name=agency_name,
        agent_name=agent_name,
        address=address,
        price=price,
        beds=beds,
        baths=baths,
        size=size,
        extras=[
            property_type,      # house_extra_info_1 -> Type
            property_status,    # house_extra_info_2 -> Status / Sale/Rent
            state_live,         # house_extra_info_3 -> State
            sale_type           # house_extra_info_4 -> SaleTypeId/SaleType
        ],
        main_photo=main_photo,
        photo_urls=photo_urls,
        source="myhome",
    )


def fetch_myhome_search(api_key):
    url = f"https://agentapi.myhome.ie/search/{api_key}?format=json&correlationId={api_key}&PageSize=50&PropertyClassIds=1"
    resp = requests.get(url, timeout=FETCH_TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    if isinstance(data, dict):
        return data.get("SearchResults") or data.get("results") or data.get("Properties") or data.get("items") or data.get("properties") or []
    if isinstance(data, list):
        return data
    return []


# ---------------------- Acquaint ----------------------

def fetch_acquaint(prefix):
    url = f"https://www.acquaintcrm.co.uk/datafeeds/standardxml/{prefix}-0.xml"
    resp = requests.get(url, timeout=FETCH_TIMEOUT)
    resp.raise_for_status()
    data = resp.text
    return data


def parse_acquaint(xml_text):
    import xmltodict
    xml_data = xmltodict.parse(xml_text)
    props = xml_data.get("data", {}).get("properties", {}).get("property", [])
    if isinstance(props, dict):
        props = [props]
    return props


def map_property_acquaint(raw, agency_name):
    def pick(*vals):
        for v in vals:
            if v:
                return v
        return None

    def pick_text(val):
        if isinstance(val, dict):
            return val.get("#text") or val.get("text") or None
        return val

    # Build address string from parts
    addr = raw.get("address") or {}
    parts = [
        pick_text(addr.get("propertyname") or raw.get("propertyname")),
        pick_text(addr.get("street") or raw.get("street") or raw.get("streetname")),
        pick_text(addr.get("locality") or raw.get("locality")),
        pick_text(addr.get("town") or raw.get("city") or raw.get("county")),
        pick_text(addr.get("region") or raw.get("region")),
        pick_text(addr.get("postcode") or raw.get("postcode") or raw.get("postalcode")),
    ]
    address = ", ".join([sanitize_str(p) for p in parts if p]) or "Unknown address"

    price = pick_text(raw.get("price") or raw.get("displayprice") or raw.get("askingprice") or raw.get("amount") or "N/A")
    beds = pick_text(raw.get("beds") or raw.get("bedrooms") or raw.get("bed") or 0)
    baths = pick_text(raw.get("baths") or raw.get("bathrooms") or raw.get("bath") or 0)
    size = pick_text(raw.get("size") or raw.get("floorarea") or raw.get("area") or "N/A")

    # Extras to feed FE table similarly to MyHome
    property_type = pick_text(raw.get("type") or raw.get("propertytype"))
    property_status = pick_text(raw.get("status") or "For Sale")
    state_live = "Live"
    sale_type = pick_text(raw.get("saletype") or raw.get("tenure") or property_status)
    extra1 = property_type
    extra2 = property_status
    extra3 = state_live
    extra4 = sale_type

    photos = []
    images = raw.get("images") or raw.get("photos") or raw.get("imagesUrl") or raw.get("image")
    if isinstance(images, list):
        photos = [pick_text(i.get("url") if isinstance(i, dict) else i) for i in images]
    elif isinstance(images, dict):
        if "image" in images:
            imgs = images.get("image")
            if isinstance(imgs, list):
                photos = [pick_text(i.get("url") if isinstance(i, dict) else i) for i in imgs]
            elif isinstance(imgs, dict):
                photos = [pick_text(imgs.get("url") or imgs.get("#text"))]
        else:
            photos = [pick_text(images.get("url") or images.get("#text"))]
    elif isinstance(images, str):
        photos = [images]

    photos = [p for p in photos if p]
    main_photo = photos[0] if photos else None

    agent_name = sanitize_str(pick_text(raw.get("agent") or raw.get("negotiator") or raw.get("agency") or agency_name))

    return map_property_common(
        agency_name=agency_name,
        agent_name=agent_name,
        address=address,
        price=price,
        beds=beds,
        baths=baths,
        size=size,
        extras=[extra1, extra2, extra3, extra4],
        main_photo=main_photo,
        photo_urls=photos,
        source="acquaint",
    )


# ---------------------- Runner ----------------------

def import_feeds():
    with app.app_context():
        agencies = Agency.query.filter(
            or_(
                Agency.primary_source.in_(["myhome", "acquaint"]),
                Agency.myhome_api_key.isnot(None),
                Agency.site_prefix.isnot(None),
                Agency.acquaint_site_prefix.isnot(None),
            )
        ).all()

        for agency in agencies:
            source = (agency.primary_source or "").strip().lower()
            is_myhome = source == "myhome" or agency.myhome_api_key
            is_acquaint = source == "acquaint" or agency.site_prefix or agency.acquaint_site_prefix

            if is_myhome:
                api_key = (agency.myhome_api_key or "").strip()
                if api_key:
                    # clear only MyHome records for this agency, keep other sources
                    db.session.query(Property).filter(
                        Property.agency_name == agency.name,
                        Property.source == "myhome"
                    ).delete()
                    print(f"[MyHome] Fetching for agency '{agency.name}' with key '{api_key}'")
                    try:
                        rows = fetch_myhome_search(api_key) or []
                        added = 0
                        for raw in rows:
                            try:
                                db.session.add(map_property_myhome(raw, agency.name))
                                added += 1
                            except Exception as exc:
                                print(f"Skip myhome property for {agency.name}: {exc}")
                    except Exception as exc:
                        print(f"Failed fetching MyHome for {agency.name}: {exc}")
                        rows = []
                        added = 0
                else:
                    print(f"[MyHome] Skipping agency '{agency.name}': missing myhome_api_key")
                    rows = []
                    added = 0

            if is_acquaint:
                prefix = (agency.site_prefix or agency.acquaint_site_prefix or "").strip()
                if prefix:
                    try:
                        # clear only Acquaint records for this agency, keep other sources
                        db.session.query(Property).filter(
                            Property.agency_name == agency.name,
                            Property.source == "acquaint"
                        ).delete()
                        xml_text = fetch_acquaint(prefix)
                        rows = parse_acquaint(xml_text) or []
                        added = 0
                        for raw in rows:
                            try:
                                db.session.add(map_property_acquaint(raw, agency.name))
                                added += 1
                            except Exception as exc:
                                print(f"Skip acquaint property for {agency.name}: {exc}")
                    except Exception as exc:
                        print(f"Failed fetching Acquaint for {agency.name}: {exc}")
                        rows = []
                        added = 0

            # Commit once per agency and report result
            try:
                db.session.commit()
                print(f"Imported properties for agency {agency.name} (count: {added})")
            except Exception as exc:
                db.session.rollback()
                print(f"Commit failed for agency {agency.name}: {exc}")


if __name__ == "__main__":
    import_feeds()
