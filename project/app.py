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
from flask_jsglue import JSGlue
import pdb

# config

app = Flask(__name__)
app.config.from_pyfile('config.py')
assets = Environment(app)
jsglue = JSGlue(app)

# asset bundling

bundle_js = Bundle(
    'js/plugins.js',
    'js/utils.js',
    'js/map.js',
    'js/geoControl.js',
    'js/calcControl.js',
    'js/ready.js',
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

@app.route('/calc/')
def calc():
    return render_template('pages/calc.html')
## help
@app.route('/help/')
def help():
    return redirect(url_for('map'), code=302)
    #return render_template('pages/help.html')

## Calculator API
@app.route('/hydropower/calculator/api')
def api():
    """
    area: area of the watershed. required
    head: difference between high elevation and low elevation relative to dam/weir. required
    envflow: environmental flow requirement. default is 0.3, range options from 0.1-0.5. optional
    efficiency: efficiency default is 0.7. optional.
    """

    response = {"messages" : []}
    result = {}
    
    try:
        area = float(request.args.get('area'))
        head = float(request.args.get('head'))
        envflow = float(request.args.get('envflow'))
        efficiency = float(request.args.get('efficiency'))
        rate = float(request.args.get('rate'))
    except:
        response['messages'].append('Input parameters could not be parsed.')
        status = 400
    
    if ((area and head)):
        result['head'] = head
        result['area'] = area
        #calculate power
        result['q-available'] = area * 1.6
        #where envflow is a range from 0.1 to 0.5 with default value of 0.3
        if envflow:
            result['envflow'] = envflow
        else:
            result['envflow'] = 0.3
        result['q-env'] = (result['area'] * result['envflow'])
        result['q-useable'] = result['q-available'] - result['q-env']
        #where efficiency is a variable with default value 0.7 
        if efficiency:
            result['efficiency'] = efficiency
        else:
            result['efficiency'] = 0.7
        #where rate has a default of $0.10
        if rate:
            result['rate'] = rate
        else:
            result['rate'] = 0.1
        
        #Power in kW
        p = result['q-useable'] * result['head'] * (0.084) * result['efficiency']
        result['power'] = round(p, 2)
        
        #cost = rate * hours per year * kilowatts
        c = result['rate'] * 8766 * p
        
        response["status"] = "success"
        
        if head <= 0:
            response["status"] = "warning"
            response["messages"].append("Head provided was <= 0. The result will be nonsense.")
        if area <= 0:
            response["status"] = "warning"
            response["messages"].append("Area provided was <= 0. The result will be nonsense.")
            
        response["messages"].append("The calculation completed successfully.")
        response["result"] = result
        status = 200

    else:
        response["status"] = "error"
        response["messages"].append("required parameters were not provided")
        status = 400

        
    # ---------------------------------------------------------------
    # handle the response
    # build the response
    r = make_response(jsonify(response), status)
    # add header to enable CORS
    r.headers['Access-Control-Allow-Origin'] = '*'
    return make_response(r)


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

