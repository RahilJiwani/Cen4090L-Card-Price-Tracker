from flask_restx import Namespace, Resource

api = Namespace('test')

@api.route('/<int:number>')
class TestResource(Resource):
    def get(self, number):
        return {'message': f'test api call with var {number}'}, 200