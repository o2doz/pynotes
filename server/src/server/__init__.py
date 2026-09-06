from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)

# Infrastructure fournie : le client statique local peut appeler l'API Flask.
# Ce point ne fait pas partie de l'exercice des étudiants.
CORS(app, origins=["null", "http://127.0.0.1:8000", "http://localhost:8000"])


@app.get("/")
def hello() -> tuple[object, int]:
    """Temporary route: replace or keep it while building the API."""
    return jsonify({"message": "Hello, world!"}), 200


def main() -> None:
    app.run(debug=True)
