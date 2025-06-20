import os
import logging
from flask import Flask, render_template, jsonify, send_from_directory, session
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix

# Configure logging
logging.basicConfig(level=logging.DEBUG)


class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Database configuration (switch to SQLite for now)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///quotequest.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize the app with the extension
db.init_app(app)

with app.app_context():
    # Import models here to ensure tables are created
    import models  # noqa: F401
    db.create_all()

# Import and register auth blueprint
from routes import *  # Import all routes


# Make session permanent
@app.before_request
def make_session_permanent():
    session.permanent = True

import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
