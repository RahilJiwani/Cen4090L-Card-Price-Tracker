from flask import request, session
from flask_restx import Namespace, Resource
from ..exts import db
from ..models import User
import secrets
from flask_mail import Message
from ..exts import db, mail

api = Namespace('auth', description='Authentication related operations')


# Update signup to generate and send magic link
@api.route('/signup')
class Signup(Resource):
    def post(self):
        data = request.get_json()
        if not data:
            return {"error": "Invalid request payload"}, 400
            
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username or not email or not password:
            return {"error": "Missing required fields"}, 400
        if User.query.filter_by(username=username).first():
            return {"error": "Username already exists"}, 400
        if User.query.filter_by(email=email).first():
            return {"error": "Email already exists"}, 400

        try:
            # Create user
            new_user = User(username=username, email=email)
            new_user.set_password(password)
            new_user.is_verified = False

            # Generate magic link token
            token = secrets.token_urlsafe(32)
            new_user.verification_token = token
            
            db.session.add(new_user)
            db.session.commit()

            # Send magic link email
            verify_url = f"http://localhost:5173/verify?token={token}"
            msg = Message(
                subject="Verify your email",
                recipients=[email],
                body=f"Click this link to verify your account: {verify_url}"
            )
            mail.send(msg)

            return {"message": "User created successfully, check your email"}, 201
        except Exception as e:
            db.session.rollback()
            return {"error": "Internal server error"}, 500


# New endpoint — handles the magic link click
@api.route('/verify-email')
class VerifyEmail(Resource):
    def get(self):
        token = request.args.get('token')
        
        if not token:
            return {"error": "Missing token"}, 400

        user = User.query.filter_by(verification_token=token).first()
        if not user:
            return {"error": "Invalid or expired token"}, 400

        try:
            user.is_verified = True
            user.verification_token = None
            db.session.commit()

            # Log them in automatically
            session['user_id'] = user.id

            return {"message": "Email verified successfully"}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": "Internal server error"}, 500


@api.route('/signup')
class Signup(Resource):
    def post(self):
        data = request.get_json()
        if not data:
            return {"error": "Invalid request payload"}, 400
            
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username or not email or not password:
            return {"error": "Missing required fields"}, 400

        if User.query.filter_by(username=username).first():
            return {"error": "Username already exists"}, 400

        if User.query.filter_by(email=email).first():
            return {"error": "Email already exists"}, 400

        try:
            new_user = User(username=username, email=email)
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.commit()
            
            # Log the user in automatically upon successful registration
            session['user_id'] = new_user.id
            return {"message": "User created successfully", "user_id": new_user.id}, 201
        except Exception as e:
            db.session.rollback()
            return {"error": "Internal server error"}, 500


@api.route('/login')
class Login(Resource):
    def post(self):
        data = request.get_json()
        if not data:
            return {"error": "Invalid request payload"}, 400
            
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return {"error": "Missing username or password"}, 400

        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password):
            session['user_id'] = user.id
            return {"message": "Logged in successfully", "user_id": user.id}, 200

        return {"error": "Invalid username or password"}, 401


@api.route('/logout')
class Logout(Resource):
    def post(self):
        session.pop('user_id', None)
        return {"message": "Logged out successfully"}, 200


@api.route('/me')
class Me(Resource):
    def get(self):
        user_id = session.get('user_id')
        if not user_id:
            return {"error": "Unauthorized"}, 401

        user = User.query.get(user_id)
        if not user:
            # Stale session
            session.pop('user_id', None)
            return {"error": "User not found"}, 401

        return {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }, 200
