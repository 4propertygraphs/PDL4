from flask import Flask, request, jsonify
from dotenv import load_dotenv
import os
import requests
import json
import xmltodict
from flask_cors import CORS, cross_origin
import jwt
import datetime
from werkzeug.security import generate_password_hash, check_password_hash  
from models import db, User, Property, Agency, Connector, Pipeline, Site, ImportActivity
from collections import defaultdict
from sqlalchemy import text, or_  # Add this import for using text queries
from urllib.parse import unquote, urlparse
from html import unescape


def _tag_source(payload, source_label):
    """Ensure every dict/item has a 'source' set to source_label if missing."""
    if isinstance(payload, list):
        for item in payload:
            if isinstance(item, dict) and not item.get("source"):
                item["source"] = source_label
            if isinstance(item, dict) and not item.get("sourceLabel"):
                item["sourceLabel"] = source_label
    elif isinstance(payload, dict):
        if not payload.get("source"):
            payload["source"] = source_label
        if not payload.get("sourceLabel"):
            payload["sourceLabel"] = source_label
    return payload


# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

# Initialize the database
db.init_app(app)  # Ensure this is called after app is created
with app.app_context():
    try:
        ImportActivity.__table__.create(db.engine, checkfirst=True)
    except Exception:
        pass

CORS(app, resources={r"/api/*": {"origins": [
    origin for origin in {
        os.getenv('FRONTEND_ORIGIN'),
        'https://board.4projectss.com',
        'https://pdl.4projectss.com',
        'https://pdlapi.4projectss.com',
        'http://localhost:5173'
    } if origin
]}})  # Allow the frontend tunnel, board domain, and local dev client


@app.route('/', methods=['GET'])
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200


# import pymysql

# connection = pymysql.connect(
#     host='localhost',
#     user='root',
#     password='',
#     database='ippidemobackend'
# )

# def remove_duplicate_items(items, key):
#     seen = set()
#     result = []
#     for item in items:
#         if item[key] not in seen:
#             seen.add(item[key])
#             result.append(item)
#     return result

# def fetch_and_save_agencies():
#     url = "https://api2.4pm.ie/api/Agency/GetAgency?Key=RDlaeFVPN004a0hvJTJmWUJIQTN3TVdnJTNkJTNk0"
#     response = requests.get(url)
#     data = json.loads(response.text)
#     unique_data = remove_duplicate_items(data, "Name")

#     with connection.cursor() as cursor:
#         for agency in unique_data:
#             acquiant = agency.get("AcquiantCustomer", {})
#             myhome = agency.get("MyhomeApi", {})

#             sql = """
#                 INSERT INTO agencies (
#                     name, office_name, address1, address2, logo, site,
#                     site_name, site_prefix, daft_api_key,
#                     fourpm_branch_id, myhome_api_key, myhome_group_id, unique_key
#                 ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
#             """

#             values = (
#                 agency.get("Name"),
#                 agency.get("OfficeName"),
#                 agency.get("Address1"),
#                 agency.get("Address2"),
#                 agency.get("Logo"),
#                 agency.get("Site"),
#                 acquiant.get("SiteName") if acquiant else None,
#                 acquiant.get("SitePrefix") if acquiant else None,
#                 agency.get("DaftApiKey"),
#                 acquiant.get("FourPMBranchID") if acquiant else None,
#                 myhome.get("ApiKey") if myhome else None,
#                 myhome.get("GroupID")if myhome else None,
#                 agency.get("Key")
                
#             )
#             cursor.execute(sql, values)
#         connection.commit()


# User Signup Route
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()  # Get the data from the request
    if User.query.filter_by(email=data['email']).first():  # Check if email already exists
        return jsonify({'message': 'Email already exists'}), 400  # Return error if email exists
    
    # Create a new user object
    new_user = User(username=data['username'], email=data['email'], password=data['password'])
    db.session.add(new_user)  # Add the user to the session
    db.session.commit()  # Commit the session to save the user to the database
    return jsonify({'message': 'User created successfully'}), 201  # Return success message

# User Login Route
@app.route('/api/login', methods=['POST'])
def login():
    
    data = request.get_json()  # Get the data from the request
    user = User.query.filter_by(email=data['email']).first()  # Check if user exists by email
    
    if not user or not check_password_hash(user.password_hash, data['password']):  # Check if user exists and password is correct
        return jsonify({'message': 'Invalid credentials'}), 401  # Return error if credentials are invalid
    
    # Generate a JWT token with user ID and expiration time
    token = jwt.encode({'id': user.id, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)}, 
                       app.config['SECRET_KEY'], algorithm='HS256')

    # Save the token in the database for the user
    user.token = token
    db.session.commit()

    return jsonify({'token': token})  # Return the generated token

# Verify Token Route
@app.route('/api/verify_token', methods=['POST'])
def verify_token():
    data = request.get_json()  # Get the data from the request
    token = data.get('token')  # Get the token from the request

    if not token:
        return jsonify({'message': 'Token is missing'}), 400  # Return error if no token is provided

    try:
        # Decode the JWT token to get the user ID
        decoded_token = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = decoded_token['id']

        # Check if the token exists in the database and matches the user
        user = User.query.get(user_id)
        if user and user.token == token:  # Token must match the one stored in the database
            return jsonify({'message': 'Token is valid'}), 200  # Return success if token is valid
        else:
            return jsonify({'message': 'Invalid token'}), 401  # Return error if token is invalid
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401  # Return error if token has expired
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401  # Return error if token is invalid

   
# Update User Data Route
@app.route('/api/users/<int:id>', methods=['PUT'])
def update_user(id):
    user = User.query.get_or_404(id)  # Get user by ID or return 404 if not found
    data = request.get_json()  # Get the data from the request
    
    # Update user fields if provided
    if 'username' in data:
        user.username = data['username']
    if 'email' in data:
        user.email = data['email']
    if 'password' in data:
        user.password_hash = generate_password_hash(data['password'])  # Hash the new password
    
    db.session.commit()  # Commit changes to the database
    return jsonify({'message': 'User updated successfully'})  # Return success message
# Add Property Route (POST)
@app.route('/api/properties', methods=['POST'])
def add_property():
    data = request.get_json()
    new_property = Property(
        agent_name=data['agent_name'],
        agency_name=data['agency_name'],
        location=data['location'],
        price=data['price'],
        bedrooms=data['bedrooms'],
        bathrooms=data['bathrooms'],
        mt_squared=data['mt_squared'],
        extra_info=data.get('extra_info', ''),
        extra_info_2=data.get('extra_info_2', ''),
        extra_info_3=data.get('extra_info_3', ''),
        extra_info_4=data.get('extra_info_4', ''),
        agency_image_url=data.get('agency_image_url', ''),
        images_url_house=data['images_url_house']
    )
    
    db.session.add(new_property)
    db.session.commit()
    return jsonify({'message': 'Property added successfully'}), 201  # Return success message



# Get Property by ID Route


# Update Property Route
@app.route('/api/properties/<int:id>', methods=['PUT'])
def update_property(id):
    property = Property.query.get_or_404(id)  # Get property by ID or return 404 if not found
    data = request.get_json()  # Get the data from the request

    # Update property fields if provided
    if 'agent_name' in data:
        property.agent_name = data['agent_name']
    if 'agency_name' in data:
        property.agency_name = data['agency_name']
    if 'location' in data:
        property.location = data['location']
    if 'price' in data:
        property.price = data['price']
    if 'bedrooms' in data:
        property.bedrooms = data['bedrooms']
    if 'bathrooms' in data:
        property.bathrooms = data['bathrooms']
    if 'mt_squared' in data:
        property.mt_squared = data['mt_squared']
    if 'extra_info' in data:
        property.extra_info = data['extra_info']
    if 'extra_info_2' in data:
        property.extra_info_2 = data['extra_info_2']
    if 'extra_info_3' in data:
        property.extra_info_3 = data['extra_info_3']
    if 'extra_info_4' in data:
        property.extra_info_4 = data['extra_info_4']
    if 'agency_image_url' in data:
        property.agency_image_url = data['agency_image_url']
    if 'images_url_house' in data:
        property.images_url_house = data['images_url_house']

    db.session.commit()  # Commit the changes to the database
    return jsonify({'message': 'Property updated successfully'})  # Return success message

# Delete Property Route
@app.route('/api/properties/<int:id>', methods=['DELETE'])
def delete_property(id):
    property = Property.query.get_or_404(id)  # Get property by ID or return 404 if not found
    db.session.delete(property)  # Delete the property from the session
    db.session.commit()  # Commit the session to apply changes
    return jsonify({'message': 'Property deleted successfully'})  # Return success message


# ---------------- Activity & Countdown ----------------
IMPORT_INTERVAL_SEC = int(os.getenv("IMPORT_INTERVAL_SEC", "600"))


@app.route('/api/activity', methods=['GET'])
def get_activity():
    limit = request.args.get("limit", default=50, type=int)
    rows = (
        ImportActivity.query.order_by(ImportActivity.id.desc())
        .limit(limit)
        .all()
    )
    return jsonify([r.to_dict() for r in rows]), 200


@app.route('/api/countdown', methods=['GET'])
def get_countdown():
    last = (
        ImportActivity.query
        .order_by(ImportActivity.finished_at.desc().nullslast(), ImportActivity.id.desc())
        .first()
    )
    now = datetime.datetime.utcnow()
    if last and last.finished_at:
        elapsed = (now - last.finished_at).total_seconds()
    elif last and last.started_at:
        elapsed = (now - last.started_at).total_seconds()
    else:
        elapsed = 0
    remaining = max(0, IMPORT_INTERVAL_SEC - elapsed)
    return jsonify({
        "interval_sec": IMPORT_INTERVAL_SEC,
        "remaining_sec": remaining,
        "last_finished_at": last.finished_at.isoformat() if last and last.finished_at else None
    }), 200


# ---------------- Live combined properties (no DB) ----------------
@app.route("/api/properties/live", methods=["GET"])
@cross_origin()
def get_properties_live():
    """
    Fetches fresh properties directly from sources for a given agency key (no DB storage).
    Params:
      - key=<agency_api_key/site_prefix/myhome_api_key/daft_api_key>
      - sources=comma,separated (optional filter: myhome,acquaint,daft)
    """
    # Lazy imports to avoid circular dependency
    from myhome_import import fetch_myhome_search, fetch_acquaint, parse_acquaint
    from daft_import import fetch_daft_api

    api_key_raw = request.args.get("key")
    if not api_key_raw:
        return jsonify({"message": "API key is required"}), 400
    api_key = unquote(api_key_raw)

    # Find agency by any known key
    agency = Agency.query.filter(
        or_(
            Agency.unique_key == api_key,
            Agency.myhome_api_key == api_key,
            Agency.daft_api_key == api_key,
            Agency.site_prefix == api_key,
            Agency.acquaint_site_prefix == api_key
        )
    ).first()
    if not agency:
        return jsonify({"message": "Unknown agency key"}), 404

    source_filter_raw = request.args.get("sources")
    source_filter = None
    if source_filter_raw:
        source_filter = {s.strip().lower() for s in source_filter_raw.split(",") if s.strip()}

    results = []
    errors = []

    # MyHome
    if agency.myhome_api_key and (not source_filter or "myhome" in source_filter):
        try:
            rows = fetch_myhome_search(agency.myhome_api_key) or []
            _tag_source(rows, "myhome")
            results.extend(rows)
        except Exception as exc:
            errors.append({"source": "myhome", "error": str(exc)})

    # Acquaint
    prefix = (agency.site_prefix or agency.acquaint_site_prefix or "").strip()
    if prefix and (not source_filter or "acquaint" in source_filter):
        try:
            xml_text = fetch_acquaint(prefix)
            rows = parse_acquaint(xml_text) or []
            _tag_source(rows, "acquaint")
            results.extend(rows)
        except Exception as exc:
            errors.append({"source": "acquaint", "error": str(exc)})

    # Daft
    daft_key = (agency.daft_api_key or agency.unique_key or "").strip()
    if daft_key and (not source_filter or "daft" in source_filter):
        try:
            rows = fetch_daft_api(daft_key) or []
            _tag_source(rows, "daft")
            results.extend(rows)
        except Exception as exc:
            errors.append({"source": "daft", "error": str(exc)})

    # WordPress
    wp_endpoint = _guess_wordpress_endpoint(agency)
    if wp_endpoint and (not source_filter or "wordpress" in source_filter):
        wp_items, wp_err = _fetch_wordpress(wp_endpoint)
        results.extend(wp_items)
        errors.extend(wp_err)

    return jsonify({"items": results, "errors": errors, "agency": agency.name}), 200


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORDPRESS_ENDPOINTS_FILE = os.getenv(
    "WORDPRESS_ENDPOINTS_FILE",
    os.path.join(BASE_DIR, "mobile", "assets", "wordpress_endpoints.txt")
)


def _resolve_agency_by_key(api_key: str):
    return Agency.query.filter(
        or_(
            Agency.unique_key == api_key,
            Agency.myhome_api_key == api_key,
            Agency.daft_api_key == api_key,
            Agency.site_prefix == api_key,
            Agency.acquaint_site_prefix == api_key
        )
    ).first()


def _fetch_live_items_for_agency(agency: Agency, source_filter=None):
    from myhome_import import fetch_myhome_search, fetch_acquaint, parse_acquaint
    from daft_import import fetch_daft_api

    results = []
    errors = []

    sf = None
    if source_filter:
        sf = {s.strip().lower() for s in source_filter if s}

    if agency.myhome_api_key and (not sf or "myhome" in sf):
        try:
            rows = fetch_myhome_search(agency.myhome_api_key) or []
            _tag_source(rows, "myhome")
            results.extend(rows)
        except Exception as exc:
            errors.append({"source": "myhome", "error": str(exc)})

    prefix = (agency.site_prefix or agency.acquaint_site_prefix or "").strip()
    if prefix and (not sf or "acquaint" in sf):
        try:
            xml_text = fetch_acquaint(prefix)
            rows = parse_acquaint(xml_text) or []
            _tag_source(rows, "acquaint")
            results.extend(rows)
        except Exception as exc:
            errors.append({"source": "acquaint", "error": str(exc)})

    daft_key = (agency.daft_api_key or agency.unique_key or "").strip()
    if daft_key and (not sf or "daft" in sf):
        try:
            rows = fetch_daft_api(daft_key) or []
            _tag_source(rows, "daft")
            results.extend(rows)
        except Exception as exc:
            errors.append({"source": "daft", "error": str(exc)})

    return results, errors


def _normalize_value(val):
    if val is None:
        return ''
    try:
        return str(val).strip()
    except Exception:
        return ''


def _normalize_prop(obj):
    if not obj:
        return {}
    return {
        "id": _normalize_value(obj.get("id") if isinstance(obj, dict) else getattr(obj, "id", None)) or _normalize_value(obj.get("uniquereferencenumber") if isinstance(obj, dict) else getattr(obj, "uniquereferencenumber", None)),
        "price": _normalize_value(obj.get("priceText") if isinstance(obj, dict) else getattr(obj, "price", None) or getattr(obj, "priceText", None) or getattr(obj, "house_price", None)),
        "status": _normalize_value(obj.get("statusText") if isinstance(obj, dict) else getattr(obj, "status", None) or getattr(obj, "statusText", None) or getattr(obj, "house_extra_info_3", None)),
        "address": _normalize_value(obj.get("addressText") if isinstance(obj, dict) else getattr(obj, "addressText", None) or getattr(obj, "displayaddress", None) or getattr(obj, "house_location", None)),
    }


@app.route("/api/ai/compare", methods=["POST"])
@cross_origin()
def ai_compare():
    """
    Simple delta: compare local property vs live feed for given agency key.
    Body: { key: <agency_key>, property_id: <id>, sources?: "daft,myhome", wordpress_url?: "<endpoint>" }
    """
    data = request.get_json(force=True) or {}
    api_key_raw = data.get("key")
    prop_id = data.get("property_id")
    source_filter = data.get("sources")
    wordpress_url = data.get("wordpress_url")
    if not api_key_raw or not prop_id:
        return jsonify({"message": "key and property_id are required"}), 400

    api_key = unquote(str(api_key_raw))
    agency = _resolve_agency_by_key(api_key)
    if not agency:
        return jsonify({"message": "Unknown agency key"}), 404

    # local property
    local_prop = Property.query.filter_by(id=prop_id).first()
    if not local_prop:
        # try by string id match in DB fields
        local_prop = Property.query.filter(Property.uniquereferencenumber == str(prop_id)).first()
    local_norm = _normalize_prop(local_prop.to_dict() if local_prop else None)

    # live items
    sf_set = None
    if isinstance(source_filter, str):
        sf_set = {s.strip().lower() for s in source_filter.split(",") if s.strip()}
    elif isinstance(source_filter, list):
        sf_set = {s.strip().lower() for s in source_filter if isinstance(s, str)}

    live_items, errors = _fetch_live_items_for_agency(agency, sf_set)
    live_match = None
    for item in live_items:
        norm = _normalize_prop(item)
        if norm.get("id") and norm.get("id") == str(prop_id):
            live_match = item
            break
        # fallback by address partial match
        if norm.get("address") and local_norm.get("address") and norm.get("address").lower() in local_norm.get("address").lower():
            live_match = item
            break

    # Fallback: fetch WordPress endpoint if provided
    if not live_match and wordpress_url:
        wp_items, wp_err = _fetch_wordpress(wordpress_url)
        errors.extend(wp_err)
        for item in wp_items:
            norm = _normalize_prop(item)
            if norm.get("id") and norm.get("id") == str(prop_id):
                live_match = item
                break
            if norm.get("address") and local_norm.get("address") and norm.get("address").lower() in local_norm.get("address").lower():
                live_match = item
                break

    live_norm = _normalize_prop(live_match)

    deltas = []
    if local_norm.get("price") != live_norm.get("price"):
        deltas.append({"field": "price", "local": local_norm.get("price"), "live": live_norm.get("price")})
    if local_norm.get("status") != live_norm.get("status"):
        deltas.append({"field": "status", "local": local_norm.get("status"), "live": live_norm.get("status")})
    if local_norm.get("address") != live_norm.get("address"):
        deltas.append({"field": "address", "local": local_norm.get("address"), "live": live_norm.get("address")})

    return jsonify({
        "agency": agency.to_dict() if hasattr(agency, "to_dict") else {"name": agency.name},
        "local": local_norm,
        "live": live_norm,
        "deltas": deltas,
        "errors": errors,
        "message": "Delta computed" if deltas else "No delta detected" if live_match else "Property not found in live feed"
    }), 200


# ---------------- WordPress fetch ----------------
def _domain_from_url(url):
    try:
        return urlparse(url).hostname or ''
    except Exception:
        return ''


def _fetch_wordpress(endpoint: str):
    """Fetch WP property CPT, normalize minimal fields."""
    items = []
    errors = []
    try:
        resp = requests.get(endpoint, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict):
            data = data.get("items") or data.get("results") or data.get("properties") or data.get("value") or []
        if not isinstance(data, list):
            return [], [{"source": "wordpress", "error": "Unexpected response shape"}]
        for row in data:
            try:
                title = unescape(row.get("title", {}).get("rendered", "")) if isinstance(row.get("title"), dict) else unescape(str(row.get("title", "")))
                price = row.get("price") or row.get("price_sold") or ""
                status = row.get("property_status") or row.get("status") or row.get("property_market") or ""
                pics = []
                if isinstance(row.get("wppd_pics"), list):
                    pics = row.get("wppd_pics")
                elif row.get("wppd_primary_image"):
                    pics = [row.get("wppd_primary_image")]
                items.append({
                    "id": row.get("id"),
                    "addressText": title,
                    "price": price,
                    "status": status,
                    "eircode": row.get("eircode"),
                    "latitude": row.get("latitude"),
                    "longitude": row.get("longitude"),
                    "photoUrls": pics,
                    "source": "wordpress",
                    "sourceLabel": "WordPress",
                    "link": row.get("link"),
                })
            except Exception as e:
                errors.append({"source": "wordpress", "error": str(e)})
    except Exception as e:
        errors.append({"source": "wordpress", "error": str(e)})
    return items, errors


def _load_wordpress_endpoints():
    endpoints = []
    try:
        with open(WORDPRESS_ENDPOINTS_FILE, "r", encoding="utf-8") as f:
            for line in f:
                url = line.strip()
                if not url:
                    continue
                endpoints.append(url)
    except Exception:
        pass
    return endpoints


WORDPRESS_ENDPOINTS = _load_wordpress_endpoints()


def _guess_wordpress_endpoint(agency: Agency):
    """Try to match agency site/domain to a known WP endpoint from the list."""
    if not WORDPRESS_ENDPOINTS:
        return None
    candidates = [agency.site_name or "", agency.site_prefix or "", agency.logo or "", agency.address1 or "", agency.address2 or ""]
    candidates = [c.lower() for c in candidates if c]
    for ep in WORDPRESS_ENDPOINTS:
        domain = _domain_from_url(ep).lower()
        if not domain:
            continue
        for c in candidates:
            if domain in c:
                return ep
    return None


@app.route("/api/wordpress", methods=["GET"])
@cross_origin()
def get_properties_wordpress():
    url = request.args.get("url")
    if not url:
        return jsonify({"message": "url is required"}), 400
    items, errors = _fetch_wordpress(url)
    return jsonify({"items": items, "errors": errors}), 200


# ---------------- Grouped properties with variants (for dedup/diffs) ----------------

def _normalize_location(val: str) -> str:
    return (val or "").strip().lower()


@app.route("/api/properties/grouped", methods=["GET"])
@cross_origin()
def get_properties_grouped():
    """
    Returns properties grouped by normalized house_location.
    Query params:
      - key=<agency_api_key|site_prefix|myhome_key|daft_api_key> (optional; if provided, filter to that agency)
      - only_dupes=1 (return only groups with count > 1)
      - min_count=N (default 1)
      - sources=comma,separated (optional filter: include group if it has any of these sources)
      - limit (optional) cap number of groups returned
    """
    only_dupes = request.args.get("only_dupes", "").lower() in ["1", "true", "yes"]
    min_count = max(1, request.args.get("min_count", default=1, type=int))
    source_filter_raw = request.args.get("sources", default=None, type=str)
    source_filter = None
    if source_filter_raw:
        source_filter = {s.strip().lower() for s in source_filter_raw.split(",") if s.strip()}
    limit = request.args.get("limit", type=int)

    # optional agency filter by key
    api_key_raw = request.args.get("key")
    agency = None
    if api_key_raw:
        api_key = unquote(api_key_raw)
        agency = Agency.query.filter(
            or_(
                Agency.unique_key == api_key,
                Agency.myhome_api_key == api_key,
                Agency.daft_api_key == api_key,
                Agency.site_prefix == api_key,
                Agency.acquaint_site_prefix == api_key
            )
        ).first()
        if not agency:
            return jsonify({'message': 'Unknown agency key'}), 404
        props = Property.query.filter_by(agency_name=agency.name).all()
    else:
        props = Property.query.all()
    grouped = defaultdict(list)
    for p in props:
        key = _normalize_location(getattr(p, "house_location", None))
        if not key:
            # skip completely empty locations to avoid dumping everything into one bucket
            continue
        grouped[key].append(p)

    result = []
    for key, items in grouped.items():
        variants = [i.to_dict() for i in items]
        sources = sorted({(v.get("source") or "").lower() for v in variants if v.get("source")})
        count = len(variants)

        if only_dupes and count <= 1:
            continue
        if count < min_count:
            continue
        if source_filter and not (set(sources) & source_filter):
            continue

        result.append({
            "group_key": key,
            "count": count,
            "sources": sources,
            "variants": variants,
        })

    if limit:
        result = result[:limit]

    return jsonify(result), 200

# Helper function to remove duplicate items
def remove_duplicate_items(_api_data, _key):
    # Create a dictionary to hold unique items
    unique_items = {}
    
    # Iterate over the list of dictionaries
    for item in _api_data:
        # Use the value of the specified key as the dictionary key
        key_value = item[_key]
        # If the key value is not already in the dictionary, add the item
        if key_value not in unique_items:
            unique_items[key_value] = item
    
    # Return the list of unique items
    return list(unique_items.values())

# Updated route: Fetch agencies from the database
@app.route("/api/agencies", methods=['GET'])
def get_agencies():
    agencies = Agency.query.all()  # Query all agencies from the database
    result = []
    for agency in agencies:
        d = agency.to_dict()
        # try auto-match wordpress endpoint from known list
        wp_ep = _guess_wordpress_endpoint(agency)
        if wp_ep:
            d["wordpress_endpoint"] = wp_ep
            if not d.get("primary_source"):
                d["primary_source"] = "wordpress"
        result.append(d)
    return jsonify(result)  # Convert each agency to a dictionary and return as JSON

# New route: Fetch properties based on agency key
@app.route("/api/properties", methods=['GET'])
def get_properties_external():
    """
    Fetch properties using the agency's primary_source and stored API key.
    Supports:
      - primary_source == '4pm'      -> https://api2.4pm.ie/api/property/json?Key=<unique_key>
      - primary_source == 'acquaint' -> https://www.acquaintcrm.co.uk/datafeeds/standardxml/<site_prefix>-0.xml
      - primary_source == 'myhome'   -> https://agentapi.myhome.ie/search/<myhome_api_key>?format=json&correlationId=<key>&PageSize=50&PropertyClassIds=1
    """
    api_key_raw = request.args.get('key')
    if not api_key_raw:
        return jsonify({'message': 'API key is required'}), 400  # Return error if API key is missing

    api_key = unquote(api_key_raw)

    agency = Agency.query.filter(
        or_(
            Agency.unique_key == api_key,
            Agency.myhome_api_key == api_key,
            Agency.daft_api_key == api_key,
            Agency.site_prefix == api_key,
            Agency.acquaint_site_prefix == api_key
        )
    ).first()
    if not agency:
        # Unknown key, keep backward compatibility and attempt 4pm with provided key
        return _fetch_properties_4pm(api_key)

    # If we already have properties in DB for this agency and no force_refresh, return cached data (even empty list)
    force_refresh = request.args.get("force_refresh", "").lower() in ["1", "true", "yes"]
    if not force_refresh:
        existing_props = Property.query.filter_by(agency_name=agency.name).all()
        props_dict = [p.to_dict() for p in existing_props]
        # backfill source from agency if missing
        agency_source = (agency.primary_source or "").strip().lower() or None
        for item in props_dict:
            if not item.get("source"):
                item["source"] = agency_source or "unknown"
            if not item.get("sourceLabel"):
                item["sourceLabel"] = item.get("source")
        return jsonify(props_dict)

    source = (agency.primary_source or '').lower().strip()

    # Explicit source selection
    if source == 'acquaint':
        prefix = (agency.site_prefix or agency.acquaint_site_prefix or '').strip()
        if not prefix:
            return jsonify({'message': 'Missing Acquaint site_prefix for this agency'}), 400
        return _fetch_properties_acquaint(prefix)

    if source == 'myhome':
        myhome_key = (agency.myhome_api_key or '').strip()
        if not myhome_key:
            return jsonify({'message': 'Missing MyHome API key for this agency'}), 400
        return _fetch_properties_myhome(myhome_key, correlation_id=api_key)

    if source == '4pm':
        return _fetch_properties_4pm(agency.unique_key or api_key)

    # Fallback auto-detect by available keys if primary_source not set
    prefix = (agency.site_prefix or agency.acquaint_site_prefix or '').strip()
    if prefix:
        return _fetch_properties_acquaint(prefix)
    if agency.myhome_api_key:
        return _fetch_properties_myhome(agency.myhome_api_key, correlation_id=api_key)
    return _fetch_properties_4pm(agency.unique_key or api_key)


def _fetch_properties_4pm(key):
    url = f"https://api2.4pm.ie/api/property/json?Key={key}"
    try:
        response = requests.get(url, timeout=20)
        response.raise_for_status()
        data = response.json()
        data = _tag_source(data, "daft")
        return jsonify(data)
    except requests.exceptions.HTTPError as e:
        return jsonify({'message': 'Failed to fetch data from 4pm', 'error': str(e), 'status': response.status_code}), 502
    except requests.exceptions.RequestException as e:
        return jsonify({'message': 'Failed to fetch data from 4pm', 'error': str(e)}), 502
    except json.JSONDecodeError:
        return jsonify({'message': 'Invalid JSON response from 4pm'}), 502


def _fetch_properties_acquaint(key):
    url = f"https://www.acquaintcrm.co.uk/datafeeds/standardxml/{key}-0.xml"
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        xml_data = xmltodict.parse(response.text)
        props = xml_data.get("data", {}).get("properties", {}).get("property", [])
        # Ensure list
        if isinstance(props, dict):
            props = [props]
        props = _tag_source(props, "acquaint")
        return jsonify(props)
    except requests.exceptions.HTTPError as e:
        return jsonify({'message': 'Failed to fetch data from Acquaint', 'error': str(e), 'status': response.status_code}), 502
    except requests.exceptions.RequestException as e:
        return jsonify({'message': 'Failed to fetch data from Acquaint', 'error': str(e)}), 502
    except Exception as e:  # xml parse or other
        return jsonify({'message': 'Error processing Acquaint feed', 'error': str(e)}), 502


def _fetch_properties_myhome(api_key, correlation_id=None):
    # correlationId is optional; PageSize and PropertyClassIds fixed for listing
    corr = correlation_id or api_key
    url = f"https://agentapi.myhome.ie/search/{api_key}?format=json&correlationId={corr}&PageSize=50&PropertyClassIds=1"
    try:
        response = requests.get(url, timeout=20)
        response.raise_for_status()
        data = response.json()
        # Ensure list; if MyHome returns error object, bubble it as 502
        items = None
        if isinstance(data, list):
            items = data
        elif isinstance(data, dict):
            # Common MyHome search fields
            if data.get("HasResults") is False and data.get("ResponseStatus"):
                return jsonify({'message': 'MyHome returned error', 'details': data}), 502
            items = data.get("results") or data.get("Properties") or data.get("items") or data.get("properties")
        if items is None:
            return jsonify({'message': 'Unexpected MyHome response shape', 'details': data}), 502
        items = _tag_source(items, "myhome")
        return jsonify(items)
    except requests.exceptions.HTTPError as e:
        return jsonify({'message': 'Failed to fetch data from MyHome', 'error': str(e), 'status': response.status_code}), 502
    except requests.exceptions.RequestException as e:
        return jsonify({'message': 'Failed to fetch data from MyHome', 'error': str(e)}), 502
    except json.JSONDecodeError:
        return jsonify({'message': 'Invalid JSON response from MyHome'}), 502


@app.route("/api/myhome", methods=['GET'])
@cross_origin(origins="*")  # Allow cross-origin requests from any origin
def get_property():
    api_key = request.args.get('key')
    id = request.args.get('id')
    if api_key is None or id is None:
        return jsonify({'message': 'API key and ID are required'}), 400

    # First try to serve from DB if the given id matches our property primary key
    try:
        pid = int(id)
        prop = Property.query.get(pid)
        if prop:
            data = prop.to_dict()
            if not data.get("sourceLabel"):
                data["sourceLabel"] = data.get("source")
            return jsonify(data)
    except Exception:
        # Not an integer or not found, continue to external fetch
        pass

    url = f"https://agentapi.myhome.ie/property/{api_key}/{id}?format=json"
    response = requests.request("GET", url)
    data = json.loads(response.text)
    return jsonify(data)

@app.route("/api/acquaint", methods=['GET'])
def get_property_by_id():
    api_key = request.args.get('key')
    property_id = request.args.get('id')

    # Remove the API key from the property ID
    # First try DB lookup by numeric primary key
    try:
        pid = int(property_id)
        prop = Property.query.filter_by(id=pid).first()
        if prop:
            data = prop.to_dict()
            if not data.get("sourceLabel"):
                data["sourceLabel"] = data.get("source")
            return jsonify(data)
    except Exception:
        pass

    if property_id.startswith(api_key):
        property_id = property_id[len(api_key):]

    url = f"https://www.acquaintcrm.co.uk/datafeeds/standardxml/{api_key}-0.xml"
    
    # Fetch the XML data
    response = requests.request("GET", url)
    if response.status_code != 200:
        return jsonify({'message': 'Failed to fetch data from the external API'}), response.status_code

    # Parse the XML data
    try:
        xml_data = xmltodict.parse(response.text)
        properties = xml_data["data"]["properties"]["property"]
    except Exception as e:
        return jsonify({'message': 'Error parsing XML data', 'error': str(e)}), 500

    # Find the property with the matching ID
    matching_property = next((prop for prop in properties if prop["id"] == property_id), None)
    if not matching_property:
        return jsonify({'message': 'Property not found'}), 404

    # Return the matching property in JSON format
    return jsonify(matching_property)




@app.route('/api/connectors', methods=['GET'])
def get_connectors():
    connectors = Connector.query.all()  # Get all properties from the database
    return jsonify([connector.to_dict() for connector in connectors]) 

@app.route('/api/pipelines', methods=['GET'])
def get_pipelines():
    pipelines = Pipeline.query.all()  # Get all pipelines from the database
    return jsonify([pipeline.to_dict() for pipeline in pipelines])  # Return pipelines as a list of dictionaries


# New route: Fetch a single agency by ID
@app.route("/api/agencies/<int:id>", methods=['GET'])
def get_agency(id):
    agency = Agency.query.get_or_404(id)  # Fetch the agency by ID or return 404 if not found
    return jsonify(agency.to_dict())  # Convert the agency to a dictionary and return as JSON

# Add a route to edit agencies by their ID
@app.route('/api/agencies/<int:id>', methods=['PUT'])
def update_agency(id):
    agency = Agency.query.get_or_404(id)  # Fetch the agency by ID or return 404 if not found
    data = request.get_json()  # Get the data from the request

    # Update agency fields if provided
    if 'name' in data:
        agency.name = data['name']
    if 'address1' in data:
        agency.address1 = data['address1']
    if 'address2' in data:
        agency.address2 = data['address2']
    if 'logo' in data:
        agency.logo = data['logo']
    if 'site_name' in data:
        agency.site_name = data['site_name']
    if 'site_prefix' in data:
        agency.site_prefix = data['site_prefix']
    if 'myhome_api_key' in data:
        agency.myhome_api_key = data['myhome_api_key']
    if 'myhome_group_id' in data:
        agency.myhome_group_id = data['myhome_group_id']
    if 'daft_api_key' in data:
        agency.daft_api_key = data['daft_api_key']
    if 'fourpm_branch_id' in data:
        agency.fourpm_branch_id = data['fourpm_branch_id']
    if 'unique_key' in data:
        agency.unique_key = data['unique_key']
    if 'office_name' in data:
        agency.office_name = data['office_name']
    if 'ghl_id' in data:
        agency.ghl_id = data['ghl_id']
    if 'whmcs_id' in data:
        agency.whmcs_id = data['whmcs_id']

    db.session.commit()  # Commit the changes to the database
    return jsonify({'message': 'Agency updated successfully'})  # Return success message

@app.route('/api/field_mappings', methods=['GET'])
def get_field_mappings():
    field_mappings = db.session.execute(text("SELECT * FROM field_mappings")).fetchall()  # Use text for the query
    result = [
        {
            "id": row.id,
            "field_name": row.field_name,
            "acquaint_crm": row.acquaint_crm,
            "propertydrive": row.propertydrive,
            "daft": row.daft,
            "myhome": row.myhome
        }
        for row in field_mappings
    ]
    return jsonify(result)  # Return the records as JSON

if __name__ == '__main__':
    host = os.getenv('HOST', '127.0.0.1')  # Default to localhost if not set
    port = int(os.getenv('PORT', 5000))    # Default to port 5000 if not set
    app.run(host=host, port=port, debug=True)  # Use host and port from .env
