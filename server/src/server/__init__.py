from flask import Flask, jsonify

app = Flask(__name__)


@app.get("/")
def hello() -> tuple[object, int]:
    """Temporary route: replace or keep it while building the API."""
    return jsonify({"message": "Hello, world!"}), 200


def main() -> None:
    app.run(debug=True)
