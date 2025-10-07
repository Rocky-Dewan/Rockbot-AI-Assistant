import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    # This will place the DB inside instance/rockbot.db
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, '..', 'instance', 'rockbot.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
