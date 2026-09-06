# Consignes de réalisation — API de notes

Lisez d'abord le contrat précis de l'API dans [`README.md`](README.md). Ce document vous guide dans l'ordre de réalisation, sans fournir la solution.

> Travaillez par petites étapes. Après chaque étape, démarrez le serveur et vérifiez ce qui fonctionne avant de passer à la suivante.

## 1. Découvrir Flask et renvoyer du JSON

Commencez avec l'application de départ dans `server/`.

1. Démarrez-la avec `uv run server` depuis le dossier `server`.
2. Ouvrez `http://127.0.0.1:5000/` dans un navigateur.
3. Repérez où l'application Flask est créée et où la route `/` est définie.
4. Assurez-vous de comprendre la différence entre une page HTML et une réponse JSON.
5. Créez ensuite, à titre d'essai, une petite route qui renvoie une réponse JSON. Elle ne fait pas encore partie de l'API finale.

Recherches utiles :

```text
Flask route GET documentation
Flask jsonify return JSON
Flask status code response
```

Questions à poser à une IA :

```text
Explique moi simplement ce que font Flask, une route et jsonify, sans me donner le code complet d'une API.
Comment vérifier une réponse JSON d'un serveur Flask dans le navigateur ou avec curl ?
```

**Objectif à atteindre :** vous savez démarrer le serveur et créer une route Flask qui renvoie du JSON avec le bon code HTTP.

---

## 2. Créer la classe `Note`

Avant de stocker des notes, représentez une note avec une classe Python.

1. Créez un emplacement logique pour vos modèles, par exemple `models/`.
2. Réfléchissez aux trois informations qu'une note doit contenir selon le contrat : `id`, `title` et `content`.
3. Votre classe doit permettre de transformer une note en dictionnaire afin que Flask puisse l'envoyer en JSON.
4. Testez la classe dans un petit fichier Python ou dans le terminal avant de l'utiliser dans Flask.

Ne commencez pas par la base de données : vérifiez d'abord que vous comprenez ce qu'est un objet `Note` et comment il devient un dictionnaire.

Recherches utiles :

```text
Python class __init__ attributes beginner
Python object to dictionary method
Python dataclass beginner
```

Questions à poser à une IA :

```text
Comment concevoir une classe Python simple pour représenter une note, sans écrire mon exercice à ma place ?
Pourquoi transformer un objet Python en dictionnaire avant de le renvoyer en JSON ?
```

**Objectif à atteindre :** vous pouvez créer une note en Python et obtenir un dictionnaire contenant ses informations.

---

## 3. Isoler la connexion à la base de données

SQLite est déjà disponible dans Python via le module `sqlite3`. Vous n'avez rien à installer avec `uv` pour l'utiliser.

1. Créez une classe `DatabaseConnection` dans un dossier dédié à la base de données.
2. Cette classe doit être le seul endroit de votre projet qui connaît le nom ou le chemin du fichier de base SQLite.
3. Elle doit être la seule classe qui crée une connexion avec SQLite.
4. Vérifiez séparément que vous pouvez ouvrir une connexion à une base locale, puis la fermer.

Ne mettez pas de SQL dans les routes Flask. L'objectif est que le reste de l'application puisse plus tard remplacer SQLite par PostgreSQL avec le moins de modifications possible.

Recherches utiles :

```text
Python sqlite3 connect documentation
Python sqlite3 close connection
SQLite database file Python
```

Questions à poser à une IA :

```text
Quel est le rôle d'une classe DatabaseConnection dans une application Python orientée objet ?
Explique comment tester une connexion sqlite3 en Python, étape par étape, sans me donner l'architecture complète de l'exercice.
Pourquoi ne faut-il pas appeler sqlite3.connect dans chaque route Flask ?
```

**Objectif à atteindre :** une classe dédiée peut créer une connexion SQLite ; aucune route Flask ne dépend directement de `sqlite3`.

---

## 4. Préparer la table et le repository

Une fois la connexion isolée, créez une classe `NoteRepository`.

1. Cette classe reçoit ou utilise un objet `DatabaseConnection`.
2. Elle est responsable de créer la table des notes si elle n'existe pas encore.
3. Elle contient ensuite les opérations liées aux données : ajouter, retrouver, modifier et supprimer une note.
4. Elle doit transformer les résultats de la base de données en objets `Note` (ou en données permettant de créer ces objets).

Faites une opération à la fois. Commencez par créer la table, puis insérer une note et enfin relire cette note.

Recherches utiles :

```text
SQLite CREATE TABLE IF NOT EXISTS Python
Python sqlite3 parameterized query question mark
Python sqlite3 lastrowid
Python sqlite3 Row row_factory
```

Questions à poser à une IA :

```text
Quelle responsabilité doit avoir un repository dans une application Python ?
Quelle différence entre une classe Note et une classe NoteRepository ?
Explique les requêtes SQL paramétrées avec sqlite3 et les placeholders ?, avec un exemple générique différent de mon exercice.
```

**Objectif à atteindre :** vous pouvez manipuler des notes dans SQLite depuis le repository, sans Flask.

---

## 5. Ajouter le service et la validation

Créez ensuite `NoteService`, entre les routes et le repository.

1. Le service vérifie que les données reçues respectent les règles du contrat : champs présents, chaînes de caractères, texte non vide et tailles maximales.
2. Il décide quoi faire lorsqu'une note n'existe pas ou lorsqu'une donnée est invalide.
3. Les routes Flask restent courtes : elles lisent la requête, appellent le service, puis renvoient une réponse JSON.

Recherches utiles :

```text
Python strip string validation
Flask request get_json documentation
Flask error handler JSON 404 405
```

Questions à poser à une IA :

```text
Quelle logique doit aller dans un service plutôt que dans une route Flask ?
Comment valider proprement un dictionnaire reçu en JSON dans Flask ?
Comment renvoyer une erreur JSON avec Flask sans écrire la solution complète ?
```

**Objectif à atteindre :** la validation n'est ni dans le repository ni dispersée dans les routes.

---

## 6. Brancher progressivement les endpoints

Implémentez les endpoints dans l'ordre suivant :

1. `GET /notes`
2. `POST /notes`
3. `GET /notes/<id>`
4. `PUT /notes/<id>`
5. `DELETE /notes/<id>`

Après chaque endpoint, comparez exactement son URL, son code HTTP et son JSON avec le contrat dans `README.md`.

Outils possibles pour tester :

```text
navigateur (pour les GET)
curl POST JSON Flask
Postman API testing
Insomnia REST client
VS Code REST Client extension
```

Questions à poser à une IA :

```text
Comment tester une route POST JSON avec curl ? Donne-moi une méthode, pas le code de mon API.
Comment choisir entre les codes HTTP 200, 201, 204, 400 et 404 dans une API REST ?
```

---

## Avant de rendre

- Le serveur se lance avec `uv run server`.
- Les notes sont conservées après le redémarrage du serveur.
- Toutes les réponses, y compris les erreurs, sont en JSON.
- Les cinq endpoints demandés respectent `README.md`.
- Les requêtes SQL sont uniquement dans le repository.
- `sqlite3.connect(...)` n'est appelé qu'à l'intérieur de `DatabaseConnection`.
- Les requêtes SQL utilisant des données utilisateur sont paramétrées.
- Vous avez testé les cas normaux et au moins un cas d'erreur pour chaque endpoint.
