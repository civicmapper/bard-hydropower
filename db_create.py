#!/usr/bin/env python

#import sqlalchemy
#from models import Base, engine
from project.app import db
from project.models import User
from project.app import bcrypt

#Base.metadata.create_all(bind=engine)
db.create_all()

def create_user(email, password, role):
    new_user = User(
        email=email,
        password=bcrypt.generate_password_hash(password),
        role=role
    )
    db.session.add(new_user)
    db.session.commit()
    
create_user("username","userpw","user")