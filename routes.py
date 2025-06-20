from flask import jsonify, render_template, request, send_from_directory
from flask_login import current_user
from app import app, db
from models import UserFavorite


@app.route('/')
def index():
    """Render the main quote display page"""
    return render_template('index.html')


@app.route('/api/quotes')
def get_quotes():
    """API endpoint to fetch quotes data"""
    try:
        return send_from_directory('static/data', 'quotes.json')
    except Exception as e:
        app.logger.error(f"Error loading quotes: {e}")
        return jsonify({"error": "Failed to load quotes data"}), 500


@app.route('/api/favorites', methods=['GET'])
def get_user_favorites():
    """Get user's favorite quotes"""
    if not current_user.is_authenticated:
        return jsonify({"favorites": []})
    
    try:
        favorites = UserFavorite.query.filter_by(user_id=current_user.id).all()
        favorite_quote_ids = [fav.quote_id for fav in favorites]
        return jsonify({"favorites": favorite_quote_ids})
    except Exception as e:
        app.logger.error(f"Error getting favorites: {e}")
        return jsonify({"error": "Failed to get favorites"}), 500


@app.route('/api/favorites', methods=['POST'])
def toggle_favorite():
    """Add or remove a quote from favorites"""
    if not current_user.is_authenticated:
        return jsonify({"error": "Authentication required"}), 401
    
    try:
        data = request.get_json()
        quote_id = data.get('quote_id')
        
        if not quote_id:
            return jsonify({"error": "Quote ID required"}), 400
        
        # Check if already favorited
        existing = UserFavorite.query.filter_by(
            user_id=current_user.id,
            quote_id=quote_id
        ).first()
        
        if existing:
            # Remove from favorites
            db.session.delete(existing)
            action = "removed"
        else:
            # Add to favorites
            favorite = UserFavorite(user_id=current_user.id, quote_id=quote_id)
            db.session.add(favorite)
            action = "added"
        
        db.session.commit()
        
        # Get updated count
        count = UserFavorite.query.filter_by(user_id=current_user.id).count()
        
        return jsonify({
            "success": True,
            "action": action,
            "favorites_count": count
        })
    
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error toggling favorite: {e}")
        return jsonify({"error": "Failed to update favorite"}), 500


@app.route('/api/user_info')
def get_user_info():
    """Get current user information"""
    if current_user.is_authenticated:
        return jsonify({
            "authenticated": True,
            "user": {
                "id": current_user.id,
                "email": current_user.email,
                "first_name": current_user.first_name,
                "last_name": current_user.last_name,
                "profile_image_url": current_user.profile_image_url
            }
        })
    else:
        return jsonify({"authenticated": False})


@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

    from flask import request, jsonify
from models import db, UserFavorite, User
from datetime import datetime

# Temporary fixed user ID (until Google Auth is added)
FIXED_USER_ID = "test-user-001"

@app.route("/favorite", methods=["POST"])
def favorite_quote():
    data = request.get_json()

    quote_id = data.get("quote_id")
    if not quote_id:
        return jsonify({"error": "Missing quote_id"}), 400

    # Check if user already exists
    user = User.query.get(FIXED_USER_ID)
    if not user:
        user = User(id=FIXED_USER_ID, email="demo@example.com", first_name="Test", last_name="User")
        db.session.add(user)
        db.session.commit()

    # Check if this quote is already favorited
    existing = UserFavorite.query.filter_by(user_id=FIXED_USER_ID, quote_id=quote_id).first()
    if existing:
        return jsonify({"message": "Quote already favorited"}), 200

    # Create the new favorite
    new_favorite = UserFavorite(
        user_id=FIXED_USER_ID,
        quote_id=quote_id,
        created_at=datetime.now()
    )
    db.session.add(new_favorite)
    db.session.commit()

    return jsonify({"message": "Quote favorited!"}), 201