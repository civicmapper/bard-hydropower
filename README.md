# Bard Microhydropower Calculator

A map-based application for estimating the power potential of microhydropower installations.


Built as a demonstration project in collaboration with [Bard College](http://www.bard.edu/) and [Current Hydro](http://www.currenthydro.com/).

## Architecture Overview

The Bard Microhydropower Calculator is built with Python-Flask, Leaflet, Esri-Leaflet, Bootstrap, and jQuery. Data and Geoprocessing services are from the Esri Living Atlas in ArcGIS Online (AGOL).

Python Flask provides a server-side framework for assembling the web application from templates and assets. Since this is a single page app, it doesn't have much to do in that regard. Rather, its role is primarily to serve as a proxy for authenticating into secured Esri ArcGIS Online (AGOL) resources. It retrieves an AGOL authentication token on page load and returns it to the client side code (javascript), where it is used to make calls to elevation and other data services from Esri.

On the front-end:

* Bootstrap and jQuery provides the stack for the mobile-adaptive layout
* Leaflet is used for the map
* Esri-Leaflet helps utilize Esri services in conjunction with the Leaflet map

Front-end business logic is written in javascript with only jQuery. Javascript and CSS compliation and bundling is being handled by GulpJS and Browserify.

## Development

### Configuration (`config.py`)

The application requires a few global configuration variables to be set, mainly to enable access to 3rd-party services.

See `app/config.py` for more information.

_to be completed._

#### ArcGIS Application Registration

* Esri Application ID
* Esri Application Secret

#### Mapbox Token

* Token

### Development Quickstart

_(for editing HTML and Python only)._

To develop this, you must have installed:

* Python 3.4+, and you can call `python` and `pip` or (`python -m pip`) from the command line
* Node/NPM and you can call `node` and `npm` from the command line
* GulpJS installed (available via `npm`)
* `git` installed, also available from the command line.

#### 1. Clone the repository

```shell
git clone https://github.com/civicmapper/bard-hydropower
cd bard-hydropower
```

#### 2. Initialize a Python virtual environment and install Python dependencies with Python `pipenv`

If you don't have `pipenv` (and you won't with an out-of-the-box python installation)

```shell
pip install pipenv
```

Then:

```shell
pipenv install
```

...to install dependencies, and then:

#### 3. Run a basic development server

```shell
pipenv shell python run.py
```

Navigate to [http://localhost:5000](http://localhost:5000) to see the site.

This is sufficient for modifying `html` in the `app/templates/` folder, or changing any of the python scripts. However, it only serves up pre-compiled client-side code stored under `app/static/`; it does not run the client-side build tasks, so you won't see edits made to code in `src` if you only develop using this method.

You can kill this development server by pressing `ctrl-c` in the command line.

### Client-Side Development

_for editing JS, CSS, HTML, and python._

(assuming you've installed Python dependencies above)

#### 1. Install javascript dependencies

In the repository root:

```shell
npm install
```

This will download and install a whole lot of javascript in a `node_modules` folder.

#### 2. Run a browser-synced development server

```shell
gulp watch
```

This does a bunch of things:

* it compiles and bundles `js` files from the `src` and `node_modules` directory, and puts them in the the `app/static` directory (where the application wants them to be)
* it does the same with `css` files
* it copies assets from certain `js` modules to the `app/static/assets` directory,
* it fires up the Python-Flask application and its development web server for you (runs `pipenv shell python run.py`)
* it opens up your default browser and loads the page.

#### 3. Develop and see changes as they happen

With #2 complete, when you change code in the `src` folder, the browser will either:

* live reload (inserting your changes into the page)
* refresh automatically (if it needs to reload an entire script or asset again)

## Build

Use `gulp build` from the command line to compile source code and copy assets in the `app` folder. Once built, only the `app` folder (and its contents) and `application.py` script are required for running the web application in production.

Make sure your `config.py` `DEBUG` parameter is set to `False` for production!

## Deployment

There are many ways to deploy this application. Some options:

### PythonAnywhere

[PythonAnywhere](https://www.pythonanywhere.com/) provides a great place for deploying a Flask applications like this. Follow [this](https://help.pythonanywhere.com/pages/Flask/) guide for deployment.

### Deployment to AWS Elastic Beanstalk

Follow [this](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create-deploy-python-flask.html) guide for deployment to AWS EBS.

As of this writing, AWS Elastic Beanstalk supports Python 3.4.

## Credits

Application by Christian Gass @ CivicMapper.
