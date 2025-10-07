from src.extensions import db

class Conversation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255))
    updated_at = db.Column(db.DateTime)
