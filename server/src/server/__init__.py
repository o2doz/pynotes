from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)

# Infrastructure fournie : le client statique local peut appeler l'API Flask.
# Ce point ne fait pas partie de l'exercice des étudiants.
CORS(app, origins=["null", "http://127.0.0.1:8000", "http://localhost:8000"])


@app.get("/")
def hello() -> tuple[object, int]:
    """Temporary route: replace or keep it while building the API."""
    return jsonify({"message": "Hello, world!"}), 200


@app.get("/notes")
def get_notes():
    return jsonify([
                   {"id": 1, "title": "Liste de courses", "content": "Lait, riz et pâtes"},
                   {"id": 2, "title": "Flask", "content": "Apprendre les routes et le JSON."}
               ]), 200


@app.get("/notes/<int:id>")
def get_note(id):
    print(id)
    return jsonify({"id": 1, "title": "Liste de courses", "content": "Lait, riz et pâtes"})

@app.post("/notes")
def create_note():
    data = request.get_json(silent=True)

    if not data:
       return {"error": "JSON invalide ou manquant"}, 400

    print(data.get('title'))
    print(data.get('content'))
       
    return data, 201

@app.put("/notes/<int:id>")
def modify_note(id):
    data = request.get_json(silent=True)
    if not data:
       return {"error": "JSON invalide ou manquant"}, 400

    print(id)
    print(data.get("title"))
    print(data.get("content"))

    return data, 200

@app.delete("/notes/<int:id>")
def delete_note(id):
    print(id)

    return '', 204

def main() -> None:
    app.run(debug=True)
