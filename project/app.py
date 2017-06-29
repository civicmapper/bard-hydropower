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

# dependencies

from flask import Flask, render_template, request, session, redirect, url_for, flash, send_from_directory, jsonify,  make_response
from flask_assets import Environment, Bundle
import pdb

# config

app = Flask(__name__)
app.config.from_pyfile('config.py')
assets = Environment(app)

# asset bundling

bundle_js = Bundle(
    'js/plugins.js',
    'js/utils.js',
    'js/map.js',
    'js/layout.js',
    'js/calcControl.js',
    'js/hydropower.js',
    'js/geoprocessing.js',
    filters='jsmin',
    output='bundle.js')
assets.register('bundle_js', bundle_js)

bundle_css = Bundle(
    'css/layout.main.css',
    'css/main.css',
    'css/main.responsive.css',
    filters='cssutils',
    output='bundle.css')
assets.register('bundle_css', bundle_css)


#----------------------------------------------------------------------------#
# Helper Functions & Wrappers
#----------------------------------------------------------------------------#


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
    #t = get_token()
    #return render_template('pages/home.html')
    return redirect(url_for('map'), code=302)

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
    return redirect(url_for('map'), code=302)
    #return render_template('pages/help.html')


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

