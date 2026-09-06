# Application de notes — Spécification du serveur (v1)

Construisez un serveur Flask qui fournit une API JSON pour stocker des notes. Un client séparé utilisera cette API.

## Démarrer le serveur

```bash
cd server
uv run server
```

Le projet de départ expose actuellement `GET /` et renvoie :

```json
{"message": "Hello, world!"}
```

Flask est installé avec `uv`. La prise en charge de SQLite est fournie par le module intégré `sqlite3` de Python : aucun paquet SQLite séparé n'est nécessaire.

## Règles

- Le serveur doit renvoyer du JSON pour chaque endpoint, y compris les erreurs.
- Les données des requêtes doivent être reçues au format JSON.
- Les notes doivent être stockées de façon permanente dans une base de données SQLite. Redémarrer le serveur ne doit pas supprimer les notes existantes.
- Utilisez des requêtes SQL paramétrées (placeholders `?`) ; ne construisez jamais de SQL en concaténant une entrée utilisateur.
- Utilisez les codes de statut HTTP indiqués ci-dessous.
- L'API ne comporte ni connexion, ni utilisateurs, ni tags, ni recherche dans la version 1.

## Données d'une note

Une note renvoyée par l'API a exactement cette forme :

```json
{
  "id": 1,
  "title": "Liste de courses",
  "content": "Lait, riz et pâtes"
}
```

| Champ | Type | Règles |
|---|---|---|
| `id` | entier | Généré par la base de données ; le client ne l'envoie pas lors de la création d'une note. |
| `title` | chaîne de caractères | Obligatoire ; après suppression des espaces au début et à la fin, il ne doit pas être vide ; 100 caractères maximum. |
| `content` | chaîne de caractères | Obligatoire ; après suppression des espaces au début et à la fin, il ne doit pas être vide ; 5 000 caractères maximum. |

## Endpoints obligatoires

### `GET /notes`

Renvoie toutes les notes sous la forme d'un tableau JSON, trié par `id` croissant.

**Succès — `200 OK`**

```json
[
  {"id": 1, "title": "Liste de courses", "content": "Lait, riz et pâtes"},
  {"id": 2, "title": "Flask", "content": "Apprendre les routes et le JSON."}
]
```

Renvoyez `[]` lorsqu'il n'y a aucune note.

---

### `GET /notes/<id>`

Renvoie une note.

**Succès — `200 OK`**

```json
{"id": 1, "title": "Liste de courses", "content": "Lait, riz et pâtes"}
```

**Note absente — `404 Not Found`**

```json
{"error": "Note not found"}
```

---

### `POST /notes`

Crée une note. Le `Content-Type` de la requête doit être `application/json`.

**Corps de la requête**

```json
{"title": "Liste de courses", "content": "Lait, riz et pâtes"}
```

**Succès — `201 Created`**

Renvoyez la note nouvellement créée, y compris son `id` généré.

```json
{"id": 1, "title": "Liste de courses", "content": "Lait, riz et pâtes"}
```

**Corps invalide — `400 Bad Request`**

Pour du JSON invalide, des champs manquants, des champs qui ne sont pas des chaînes de caractères, des champs vides ou des valeurs dépassant les limites :

```json
{"error": "title and content are required strings"}
```

Le message précis peut être différent, mais la réponse doit être un objet JSON avec une chaîne `error`.

---

### `PUT /notes/<id>`

Remplace le titre et le contenu d'une note existante. Le corps de la requête et les règles de validation sont identiques à ceux de `POST /notes`.

**Succès — `200 OK`**

Renvoyez la note mise à jour complète.

**Note absente — `404 Not Found`**

```json
{"error": "Note not found"}
```

**Corps invalide — `400 Bad Request`**

```json
{"error": "title and content are required strings"}
```

---

### `DELETE /notes/<id>`

Supprime une note. Aucun corps de requête n'est nécessaire.

**Succès — `204 No Content`**

Le corps de la réponse doit être vide.

**Note absente — `404 Not Found`**

```json
{"error": "Note not found"}
```

## Gestion des erreurs

Pour une URL qui n'existe pas, renvoyez une réponse JSON `404` plutôt que la page HTML par défaut de Flask :

```json
{"error": "Not found"}
```

Pour une méthode HTTP non prise en charge sur une route valide, renvoyez une réponse JSON `405` :

```json
{"error": "Method not allowed"}
```

## Structure POO obligatoire

Ne placez pas les requêtes SQL directement dans les fonctions de routes Flask. Organisez l'application de façon à séparer les responsabilités :

```text
Route Flask  ->  NoteService  ->  NoteRepository  ->  DatabaseConnection
```

### Classes minimales

- `Note` : représente une note (`id`, `title`, `content`). Elle doit pouvoir produire le dictionnaire utilisé dans les réponses JSON.
- `DatabaseConnection` : possède la configuration de la base de données et crée les connexions SQLite. Aucune autre classe ne doit appeler `sqlite3.connect(...)` directement.
- `NoteRepository` : contient les opérations SQL : créer la table, récupérer toutes les notes, récupérer une note par son id, insérer, mettre à jour et supprimer.
- `NoteService` : applique la validation et coordonne le repository. Les routes appellent cette classe au lieu d'écrire elles-mêmes la logique métier.

Le repository doit dépendre de `DatabaseConnection`, et non directement de SQLite. Ceci prépare le remplacement ultérieur du connecteur par une implémentation PostgreSQL.

Voici une organisation de fichiers suggérée :

```text
server/
  src/server/
    __init__.py
    models/note.py
    database/connection.py
    repositories/note_repository.py
    services/note_service.py
```

Les noms de fichiers exacts sont libres ; la séparation des responsabilités est obligatoire.
