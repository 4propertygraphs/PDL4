from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
from flask import Flask

# Initialize the database
db = SQLAlchemy()

# User model
class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False, unique=True)
    email = db.Column(db.String(100), nullable=False, unique=True)
    password_hash = db.Column(db.String(200), nullable=False)
    token = db.Column(db.String(200))

    def __init__(self, username, email, password, token=None):
        self.username = username
        self.email = email
        self.password_hash = generate_password_hash(password)
        self.token = token

    def __repr__(self):
        return f"User(id={self.id}, username={self.username}, email={self.email})"

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "token": self.token
        }

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


# Property model
class Property(db.Model):
    __tablename__ = 'properties'

    id = db.Column(db.Integer, primary_key=True)
    agency_agent_name = db.Column(db.String(100), nullable=False)
    agency_name = db.Column(db.String(100), nullable=False)
    house_location = db.Column(db.String(255), nullable=False)
    house_price = db.Column(db.String(255), nullable=False)  
    house_bedrooms = db.Column(db.Integer, nullable=False)
    house_bathrooms = db.Column(db.Integer, nullable=False)
    house_mt_squared = db.Column(db.String, nullable=False) 
    house_extra_info_1 = db.Column(db.String(255))
    house_extra_info_2 = db.Column(db.String(255))
    house_extra_info_3 = db.Column(db.String(255))
    house_extra_info_4 = db.Column(db.String(255))
    agency_image_url = db.Column(db.String(255))
    images_url_house = db.Column(db.String(255))

    def __init__(self, agency_agent_name, agency_name, house_location, house_price, house_bedrooms, house_bathrooms, house_mt_squared, house_extra_info_1, house_extra_info_2, house_extra_info_3, house_extra_info_4, agency_image_url, images_url_house):
        self.agency_agent_name = agency_agent_name
        self.agency_name = agency_name
        self.house_location = house_location
        self.house_price = house_price
        self.house_bedrooms = house_bedrooms
        self.house_bathrooms = house_bathrooms
        self.house_mt_squared = house_mt_squared
        self.house_extra_info_1 = house_extra_info_1
        self.house_extra_info_2 = house_extra_info_2
        self.house_extra_info_3 = house_extra_info_3
        self.house_extra_info_4 = house_extra_info_4
        self.agency_image_url = agency_image_url
        self.images_url_house = images_url_house

    def to_dict(self):
        return {
            "id": self.id,
            "agency_agent_name": self.agency_agent_name,
            "agency_name": self.agency_name,
            "house_location": self.house_location,
            "house_price": self.house_price,
            "house_bedrooms": self.house_bedrooms,
            "house_bathrooms": self.house_bathrooms,
            "house_mt_squared": self.house_mt_squared,
            "house_extra_info_1": self.house_extra_info_1,
            "house_extra_info_2": self.house_extra_info_2,
            "house_extra_info_3": self.house_extra_info_3,
            "house_extra_info_4": self.house_extra_info_4,
            "agency_image_url": self.agency_image_url,
            "images_url_house": self.images_url_house
        }
        
    def save_to_db(self):
        db.session.add(self)
        db.session.commit()