#----------------------------------------------------------------------------#
# APP CONFIGURATION
#----------------------------------------------------------------------------#

# standard library imports
import os
import logging
from logging import Formatter, FileHandler
from functools import wraps
import requests
import json
from datetime import datetime
from dateutil.parser import parse
from dateutil import tz
import uuid


#import pprint
#pp = pprint.PrettyPrinter(indent=2)

# dependencies
from flask import Flask, render_template, request, session, redirect, url_for, flash, send_from_directory, jsonify,  make_response
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, current_user, login_required
from flask.ext.bcrypt import Bcrypt
from sqlalchemy.exc import IntegrityError

import pdb

# config
app = Flask(__name__)
app.config.from_pyfile('config.py')
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

# in-app imports
from project.forms import ForgotForm, LoginForm, RegisterForm
import project.models

#----------------------------------------------------------------------------#
# Helper Functions & Wrappers
#----------------------------------------------------------------------------#

# load login manager
login_manager = LoginManager()
login_manager.init_app(app)

# Login required decorator

def login_required(test):
    @wraps(test)
    def wrap(*args, **kwargs):
        if 'logged_in' in session:
            return test(*args, **kwargs)
        else:
            flash('You need to login first.')
            return redirect(url_for('login'))
    return wrap

@login_manager.user_loader
def user_loader(user_id):
    """Given *user_id*, return the associated User object.
    @param unicode user_id: user_id (email) user to retrieve.
    """
    return models.User.query.get(user_id)

def get_token():
    """requests and returns an ArcGIS Token for the pre-registered application.
    Client id and secrets are managed through the ArcGIS Developer's console:
        https://developers.arcgis.com/applications/#/ca3136177e564894907ddff85c325529/
        (Spatial Analytix AGOL organization credentials required)
    """
    params = {
        'client_id': app.config['ESRI_APP_CLIENT_ID'],
        'client_secret': app.config['ESRI_APP_CLIENT_SECRET'],
        'grant_type': "client_credentials"
    }
    request = requests.get(
        'https://www.arcgis.com/sharing/oauth2/token',
        params=params
    )
    token = request.json()
    print("token acquired: {0}".format(token))
    return token

#----------------------------------------------------------------------------#
# Controllers / Route Handlers
#----------------------------------------------------------------------------#

# ---------------------------------------------------
# pages (rendered from templates)

## home page
@app.route('/home/')
@app.route('/index/')
@app.route('/')
def home():
    t = get_token()
    return render_template('pages/home.html')

## map view
@app.route('/map/')
#@login_required
def map():
    t = get_token()
    session['arcgis_token'] = t['access_token']
    return render_template('pages/map.html', arcgis_token=session['arcgis_token'])
    '''
    if 'arcgis_token' not in session:
        t = get_token()
        session['arcgis_token'] = t['access_token']
        return render_template('pages/map.html', arcgis_token=session['arcgis_token'])
    else:
        return render_template('pages/map.html', arcgis_token=session['arcgis_token'])
    '''

## data table view
@app.route('/help/')
#@login_required
def help():
    return render_template('pages/help.html')


# ---------------------------------------------------
# pages for authentication

## login
@app.route('/login/', methods=['GET','POST'])
def login():
    error = None
    form = LoginForm(request.form)
    if request.method == 'POST':
        if form.validate_on_submit():
            user = models.User.query.filter_by(email=request.form['email']).first()
            #user = user_loader(request.form['email'])
            if user is not None and bcrypt.check_password_hash(user.password, request.form['password']):
                session['logged_in'] = True
                session['user_id'] = user.email
                session['role'] = user.role
                flash('Welcome!','success')
                return redirect(url_for('home'))
            else:
                error = 'Invalid credentials. Please try again.'
                flash(error, 'warning')
        else:
            error = 'User and password not provided. Please try again.'
            flash(error, 'warning')
    return render_template('forms/login.html', form=form)


@app.route('/register/', methods=['GET','POST'])
def register():
    error = None
    form = RegisterForm(request.form)
    if request.method == 'POST':
        if form.validate_on_submit():
            new_user = User(
                form.email.data,
                bcrypt.generate_password_hash(form.password.data)
            )
            try:
                db.session.add(new_user)
                db.session.commit()
                flash('Thanks for registering. Please login.')
                return redirect(url_for('login'))
            except IntegrityError:
                error = 'That username / email already exists.'
                return render_template('register.html', form=form, error=error)
    return render_template('forms/register.html', form=form, error=error)

@app.route('/forgot/')
def forgot():
    form = ForgotForm(request.form)
    return render_template('includes/forgot.html', form=form)



# ------------------------------------------------
# application logic (no page rendered)

## Logout - ends session for user, redirects to login
@app.route('/logout/')
def logout():
    session.pop('logged_in', None)
    session.pop('user_id', None)
    session.pop('role', None)
    flash('You are logged out.')
    return redirect(url_for('home'))

## DATA
@app.route('/data/<path:path>')
@login_required
def send_data(path):
    return send_from_directory('data', path)


# ------------------------------------------------
# Error Handling

## Error handler 500
@app.errorhandler(500)
def internal_error(error):
    #db_session.rollback()
    return render_template('errors/500.html'), 500

## Error handler 404
@app.errorhandler(404)
def not_found_error(error):
    return render_template('errors/404.html'), 404

## Error Logging
if not app.debug:
    file_handler = FileHandler('error.log')
    file_handler.setFormatter(
        Formatter('%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]')
    )
    app.logger.setLevel(logging.INFO)
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.info('errors')

