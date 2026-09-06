# Client de démonstration

Client HTML/CSS/JavaScript sans framework pour l'API de notes. Il utilise tous les endpoints de la spécification :

- `GET /notes`
- `GET /notes/<id>`
- `POST /notes`
- `PUT /notes/<id>`
- `DELETE /notes/<id>`

## Lancer le client

Ouvrez directement le fichier `index.html` dans un navigateur (double-clic ou clic droit → ouvrir avec le navigateur). Aucun serveur web, bundler ou installation n'est nécessaire.

L'adresse de l'API est modifiable dans l'interface ; elle vaut par défaut `http://127.0.0.1:5000`.

## CORS déjà configuré

Un fichier ouvert directement a l'origine `null`. Le projet serveur inclut déjà `flask-cors` et autorise cette origine, ainsi que les deux origines locales suivantes si vous préférez utiliser un serveur de fichiers :

```text
null
http://127.0.0.1:8000
http://localhost:8000
```

Les étudiants n'ont rien à ajouter pour CORS dans cet exercice local.

Le client n'utilise aucune dépendance, aucun bundler et aucune étape de compilation.
