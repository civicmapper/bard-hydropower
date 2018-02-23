# Bard Microydropower Calculator

A simple map-based application for estimating the power potential of microhydropower installations.

## Software

Built with Python-Flask, Leaflet, Esri-Leaflet, Bootstrap, and jQuery. Data services from the Esri Living Atlas in ArcGIS Online (AGOL).

### Development Quickstart

This application requires Python 3.4 or later. Client-side javascript dependencies are included with the repository, so Node/NPM is not currently necessary (however this should change in the future; more on that later).

1. Clone the repo

```shell
git clone https://github.com/civicmapper/bard-hydropower
cd bard-hydropower
```

1. Initialize a Python virtual environment and install dependencies with Python `pipenv`:

If you don't have `pipenv`

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

1. Run the development server:

Within the `pipenv shell`:

```shell
python run.py
```

Navigate to [http://localhost:5000](http://localhost:5000)

### Architecture

Python Flask provides a server-side framework for assembling the web application from templates and assets. Since this is a single page app, it doesn't have much to do in that regard. Rather, its role is primarily to serve as a proxy for authenticating into secured Esri ArcGIS Online (AGOL) resources. It retrieves an AGOL authentication token on page load and returns it to the client side code (javascript), where it is used to make calls to elevation and other data services from Esri.

On the front-end:

* Bootstrap and jQuery provides the stack for the mobile-adaptive layout
* Leaflet is used for the map
* Esri-Leaflet helps utilize Esri services in conjunction with the Leaflet map

Front-end business logic is written in javascript with only jQuery. Javascript bundling for *business-logic only* is being handled by the Flask plugin Flask-Assets.

NOTE: Currently, all javascript (including 3rd party dependencies like Leaflet) are being loaded through standard `<script>` tags in the `html`. In the future 3rd-party dependencies should installed with `npm`, explicitly imported into the business logic scripts, and all should be bundled with a task runner like Gulp, Webpack, or Rollup.

### Deployment

There are many ways to deploy this application. [PythonAnywhere](https://www.pythonanywhere.com/) provides a great place for deploying Flask applications like this. This one could also easily by deployed to AWS Elastic Beanstalk.

#### Deployment to AWS Elastic Beanstalk

Follow [this](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create-deploy-python-flask.html) guide for deployment.

As of this writing, AWS Elastic Beanstalk supports Python 3.4.

## Credits

Application by Christian Gass @ CivicMapper.