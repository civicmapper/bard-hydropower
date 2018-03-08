# project/_config.py

import os
from datetime import timedelta

# Grabs the folder where the script runs.
basedir = os.path.abspath(os.path.dirname(__file__))

# Enable debug mode.
DEBUG = True

# Secret key for session management.
SECRET_KEY = ""

# Session lifetime (matches lifetime of Esri tokens)
# PERMANENT_SESSION_LIFETIME = timedelta(seconds=3600)

# ESRI IDs for accessing premium AGOL services (elevation and hydrology)
ESRI_APP_CLIENT_ID = ''
ESRI_APP_CLIENT_SECRET = ''

# MAPBOX Token for better custom basemaps
MAPBOX_ACCESS_TOKEN = ""
