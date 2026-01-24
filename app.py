from flask import Flask
from config import Config
from extensions import CORS
from blueprints import register_blueprints
from models.cleanup import start_cleanup_thread

app = Flask(__name__)
app.config.from_object(Config)

CORS(app)
register_blueprints(app)
start_cleanup_thread()


if __name__ == "__main__":
    app.run(debug=True)
