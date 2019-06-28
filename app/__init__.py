# standard library imports

import os
import logging
from logging import Formatter, FileHandler

# dependencies
from flask import Flask, render_template, request, session, redirect, url_for, flash, send_from_directory, jsonify,  make_response
from flask_jsglue import JSGlue
from flaskext.markdown import Markdown
import requests


# ----------------------------------------------------------------------------
# APPLICATION SETUP

app = Flask(__name__)
app.config.from_pyfile('config.py')
# add JSGlue plugin
jsglue = JSGlue(app)
# add Markdown plugin
Markdown(app)
# API
from .api import *


# ----------------------------------------------------------------------------
# HELPERS


def get_token():
    """requests and returns an ArcGIS Token for the pre-registered application.
    Client id and secrets are managed through the ArcGIS Developer's console.
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

# ----------------------------------------------------------------------------
# Controllers / Route Handlers


@app.route('/home/')
@app.route('/index/')
@app.route('/')
def home():
    """root routes

    Returns:
        a redirect to the map view.
    """

    #t = get_token()
    return redirect(url_for('map'), code=302)


@app.route('/map/')
def map():
    """Map route. Automatically acquires an access token to premium services,
    and passes that to client-side code.

    Returns:
        renders the map view page
    """

    t = get_token()
    session['arcgis_token'] = t['access_token']
    return render_template(
        'pages/map.html',
        tokens={
            "arcgis": session['arcgis_token'],
            "mapbox": app.config['MAPBOX_ACCESS_TOKEN']
        }
    )


@app.errorhandler(500)
def internal_error(error):
    return render_template('errors/500.html'), 500


@app.errorhandler(404)
def not_found_error(error):
    return render_template('errors/404.html'), 404

# ----------------------------------------------------------------------------
# ERROR LOGGING

# remove file writes for pushing to App Engine
if not app.debug:
    #file_handler = FileHandler('error.log')
    #file_handler.setFormatter(
    #    Formatter(
    #        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]')
    #)
    app.logger.setLevel(logging.INFO)
    #file_handler.setLevel(logging.INFO)
    #app.logger.addHandler(file_handler)
    app.logger.info('Starting log')
