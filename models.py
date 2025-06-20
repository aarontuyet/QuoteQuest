from datetime import datetime
from app import db
# from flask_dance.consumer.storage.sqla import OAuthConsumerMixin
from flask_login import UserMixin
from sqlalchemy import UniqueConstraint


# User model for Google Auth (or future authentication system)
class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String, primary_key=True)
    email = db.Column(db.String, unique=True, nullable=True)
    first_name = db.Column(db.String, nullable=True)
    last_name = db.Column(db.String, nullable=True)
    profile_image_url = db.Column(db.String, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime,
                           default=datetime.now,
                           onupdate=datetime.now)

    # Relationship to favorites
    favorites = db.relationship('UserFavorite', back_populates='user', cascade='all, delete-orphan')


# User favorites model
class UserFavorite(db.Model):
    __tablename__ = 'user_favorites'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String, db.ForeignKey('users.id'), nullable=False)
    quote_id = db.Column(db.String, nullable=False)  # Unique identifier for quotes
    created_at = db.Column(db.DateTime, default=datetime.now)

    # Relationship
    user = db.relationship('User', back_populates='favorites')

    # Ensure a user can't favorite the same quote twice
    __table_args__ = (UniqueConstraint('user_id', 'quote_id', name='uq_user_quote'),)