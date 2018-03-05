# Bard Microydropower Calculator

A simple map-based application for estimating the power potential of microhydropower installations.

## Software

The Bard Microhydropower Calculator is built with Python-Flask, Leaflet, Esri-Leaflet, Bootstrap, and jQuery. Data and Geoprocessing services are from the Esri Living Atlas in ArcGIS Online (AGOL).

### Development Quickstart

This application requires Python 3.4 or later. Client-side javascript dependencies are included with the repository, so no javascript build system (e.g., Node/NPM) is currently necessary. However that _should_ change in the future; more on that later.

This quickstart assumes you have:

* a working installation of Python 3.4+,
* you can call `python` and `pip` or (`python -m pip`) from the command line
* `git` installed, also available from the command line.

1.  Clone the repository.

```shell
git clone https://github.com/civicmapper/bard-hydropower
cd bard-hydropower
```

1.  Initialize a Python virtual environment and install dependencies with Python `pipenv`:

If you don't have `pipenv` (and you won't with an out-of-the-box python installation)

```shell
pip install pipenv
```

Then:

```shell
pipenv install
```

...to install dependencies, and then:

```shell
pipenv shell
```

...to activate the virtual environment.

1.  Run the development server:

Within the `pipenv shell`:

```shell
python run.py
```

Navigate to [http://localhost:5000](http://localhost:5000) to see the site.

### Architecture

Python Flask provides a server-side framework for assembling the web application from templates and assets. Since this is a single page app, it doesn't have much to do in that regard. Rather, its role is primarily to serve as a proxy for authenticating into secured Esri ArcGIS Online (AGOL) resources. It retrieves an AGOL authentication token on page load and returns it to the client side code (javascript), where it is used to make calls to elevation and other data services from Esri.

On the front-end:

* Bootstrap and jQuery provides the stack for the mobile-adaptive layout
* Leaflet is used for the map
* Esri-Leaflet helps utilize Esri services in conjunction with the Leaflet map

Front-end business logic is written in javascript with only jQuery. Javascript bundling for _business-logic only_ is being handled by the Flask plugin Flask-Assets.

NOTE: Currently, all javascript (including 3rd party dependencies like Leaflet) are being loaded through standard `<script>` tags in the `html`. In the future 3rd-party dependencies should installed with `npm`, explicitly imported into the business logic scripts, and all should be bundled with a task runner like Gulp, Webpack, or Rollup.

### Configuration (`config.py`)

#### ArcGIS Application Registration

_to be completed_

* Application ID
* Application Secret

### Deployment

There are many ways to deploy this application. [PythonAnywhere](https://www.pythonanywhere.com/) provides a great place for deploying Flask applications like this. This one could also easily be deployed to AWS Elastic Beanstalk.

#### Deployment to AWS Elastic Beanstalk

Follow [this](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create-deploy-python-flask.html) guide for deployment.

As of this writing, AWS Elastic Beanstalk supports Python 3.4.

## Credits

Application by Christian Gass @ CivicMapper.
