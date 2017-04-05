# project/_config.py

import os
from datetime import timedelta

# Grabs the folder where the script runs.
basedir = os.path.abspath(os.path.dirname(__file__))

# Enable debug mode.
DEBUG = True

# Secret key for session management.
SECRET_KEY = 'i\xf8\x95\xc2\x0e\xfc8\x04\xbd\x07\xbeLA*\x14\x8f\xeb##T\x01-\xd8\xff'

# Session lifetime (matches lifetime of Esri tokens)
# PERMANENT_SESSION_LIFETIME = timedelta(seconds=3600)

# Connect to the database
SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'database.db')