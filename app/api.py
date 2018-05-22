from . import app as application
from flask import jsonify, make_response
from flask_restful import Resource, Api, reqparse, inputs
from flasgger import Swagger, swag_from
from flask_cors import CORS

# -------------------------------------------------------------------
# enable CORS access to API
CORS(application, resources={r"/api/*": {"origins": "*"}})

# -------------------------------------------------------------------
# configure the SWAGGER API GUI
application.config['SWAGGER'] = {
    'title': 'Bard Microhydropower Calculator API',
    'uiversion': 3
}
swag = Swagger(
    application,
    template={
        "info": {
            "title": "Bard Microhydropower Calculator API",
            "description": "Estimate the power generation potential of a micro-hydroelectric turbine installations.",
            "contact": {
                "responsibleOrganization": "CivicMapper",
                "responsibleDeveloper": "Christian Gass",
                "email": "christian.gass@civicmapper.com",
                "url": "https://github.com/civicmapper/bard-hydropower",
            },
            "version": "1.0"
        },
        "schemes": [
            "http",
            "https"
        ]
    }
)

# -------------------------------------------------------------------
# Configure Flask-ReSTful
api = Api(application)

parser = reqparse.RequestParser()
parser.add_argument(
    'area',
    type=float,
    help='The area of the watershed in *square miles* above the location of the microhydropower installation.',
    required=True
)
parser.add_argument(
    'head',
    type=float,
    help='The elevation change in *feet* available for utilization by the microhydropower installation.',
    required=True
)
parser.add_argument(
    'price',
    type=float,
    help='The elevation change in *feet* available for utilization by the microhydropower installation.',
    required=False,
    default=0.10
)
parser.add_argument(
    'efficiency',
    type=float,
    help='The % efficiency of the microhydropower installation (0-1 scale).',
    required=False,
    default=0.7
)
parser.add_argument(
    'flow',
    type=float,
    help='An assumption of environmental flow, in cubic feet per second. Range from 0.1 to 0.5 with default value of 0.3.',
    required=False,
    default=0.3
)
parser.add_argument(
    'yield',
    type=float,
    help='The average annual watershed yield, in cubic feet per second per square mile.',
    required=False,
    default=1.6
)


class MicrohydropowerCalculator(Resource):
    @swag_from('apidocs/calculator-apispec.yaml')
    def get(self):
        """
        area: area of the watershed. required
        head: difference between high elevation and low elevation relative to dam/weir. required
        envflow: environmental flow requirement. default is 0.3, range options from 0.1-0.5. optional
        efficiency: efficiency default is 0.7. optional.
        """

        args = parser.parse_args()

        response = {"messages": [], "status": ""}
        data = {
            "inputs": {
                "head": 0,
                "area": 0,
                "flow": 0,
                "efficiency": 0,
                "yield": 0,
                "price": 0
            },
            "intermediate": {},
            "results": {
                "power": 0,
                "value": 0
            }
        }

        # try:
        area = float(args['area'])
        head = float(args['head'])
        envflow = float(args['flow'])
        efficiency = float(args['efficiency'])
        rate = float(args['price'])
        yld = float(args['yield'])

        data["inputs"] = {
            "head": head,
            "area": area,
            "flow": envflow,
            "efficiency": efficiency,
            "yield": yld,
            "price": rate
        }
        print(data)

        # except:
        #     response["status"] = "danger"
        #     response['messages'].append(
        #         'Input parameters could not be parsed.')

        if ((area and head)):

            if head <= 0:
                response["status"] = "warning"
                response["messages"].append(
                    "Head provided was <= 0. The result will be nonsense.")
            if area <= 0:
                response["status"] = "warning"
                response["messages"].append(
                    "Area provided was <= 0. The result will be nonsense.")

            data['intermediate']['qAvailable'] = area * yld
            data['intermediate']['qEnv'] = (area * envflow)
            data['intermediate']['qUseable'] = data['intermediate']['qAvailable'] - \
                data['intermediate']['qEnv']

            # Power in kW
            data['results']['power'] = round(
                data['intermediate']['qUseable'] *
                head / 11.8 * efficiency, 2
            )

            # cost = rate * hours per year * kilowatts
            data['results']['value'] = round(
                rate * 8766 * data['results']['power'], 2
            )

            response["status"] = "success"

            response["messages"].append(
                "The calculation completed successfully.")

        else:
            response["status"] = "danger"
            response["messages"].append(
                "required parameters were not provided")

        # ---------------------------------------------------------------
        # handle the response
        return {
            "meta": response,
            "data": data
        }


api.add_resource(MicrohydropowerCalculator, '/api/calculator/')
