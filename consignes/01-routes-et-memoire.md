# Partie 1 — Routes Flask, puis stockage en mémoire

## Objectif

Construire les cinq endpoints avec des réponses fictives, puis les faire fonctionner avec une liste globale de dictionnaires. **Aucune classe ni base de données pour le moment.**

Cette progression remplace les anciennes consignes d'architecture. Le [README](../README.md) reste la référence pour le contrat HTTP, les champs et leurs limites. La persistance n'est attendue qu'en partie 3. Contrairement aux autres réponses, une réponse 204 est vide, sans JSON.

Travaillez par petites étapes : écrire, tester, puis continuer. Les données JSON sont fournies ; les fonctions Flask restent à écrire. Les recherches indiquées font partie du travail demandé.

## 1 — Découvrir le serveur

1. Depuis `server/`, lancer `uv run server`.
2. Ouvrir `http://127.0.0.1:5000/`.
3. Lire `server/src/server/__init__.py` et repérer l'application, le décorateur de route, la fonction appelée et sa réponse.
4. Conserver la configuration CORS fournie : elle n'est pas à travailler dans cet exercice.

**Recherche nécessaire — Flask :** dans la [documentation](https://flask.palletsprojects.com/en/stable/quickstart/), trouver comment associer une URL et une méthode HTTP à une fonction, renvoyer du JSON avec `jsonify` et préciser un code HTTP.

**À expliquer :** quelle différence entre l'URL, la méthode HTTP et le nom de la fonction Python ?

## 2 — Créer les cinq endpoints avec des réponses fictives

Créer une fonction différente pour chaque opération :

| Méthode | URL | Réponse provisoire | Code |
|---|---|---|---|
| GET | `/notes` | Les deux notes ci-dessous | 200 |
| GET | `/notes/<id>` | Une note fictive avec l'id de l'URL | 200 |
| POST | `/notes` | Une note fictive créée | 201 |
| PUT | `/notes/<id>` | Une note fictive modifiée avec l'id de l'URL | 200 |
| DELETE | `/notes/<id>` | Corps vide | 204 |

**Recherche nécessaire — Flask :** trouver la syntaxe du convertisseur de route `int`, comment recevoir sa valeur dans la fonction, et comment déclarer les méthodes POST, PUT et DELETE. Chercher également comment renvoyer une réponse vide.

### Données à copier pour GET /notes

```json
[
  {"id": 1, "title": "Liste de courses", "content": "Lait, riz et pâtes"},
  {"id": 2, "title": "Flask", "content": "Apprendre les routes et le JSON."}
]
```

### Données de départ pour GET /notes/1

```json
{"id": 1, "title": "Liste de courses", "content": "Lait, riz et pâtes"}
```

**TODO :** dans la fonction, remplacer l'id fixe par l'entier reçu dans l'URL. Pour l'instant, `/notes/42` peut renvoyer cette note fictive avec l'id 42.

### Données à copier pour POST /notes

```json
{"id": 3, "title": "Python", "content": "Réviser les listes et les dictionnaires."}
```

### Données de départ pour PUT /notes/1

```json
{"id": 1, "title": "Courses du samedi", "content": "Lait, riz, pâtes et pommes."}
```

**TODO :** utiliser l'id de l'URL. Ne pas encore lire le corps de la requête.

### DELETE /notes/1

Renvoyer 204 sans corps : ni message, ni `{}`, ni `null`.

À ce stade, POST, PUT et DELETE ne changent rien au GET : aucune donnée n'est réellement stockée. C'est volontaire.

**Recherche nécessaire — tests HTTP :** avec curl, Postman ou Insomnia, trouver comment choisir une méthode et afficher le code de statut. Le navigateur seul ne suffit pas pour tester simplement les cinq opérations.

**Validation :** relever le code et le corps reçus pour chaque endpoint avant de poursuivre.

## 3 — Déclarer les deux variables globales

Dans le module de l'application, hors des fonctions de routes, ajouter :

```python
notes = []
notes_created = 0
```

- `notes` contiendra des dictionnaires avec `id`, `title` et `content`.
- `notes_created` compte les créations réussies depuis le démarrage, pas les notes encore présentes.
- La première création reçoit l'id 1.
- Une suppression ne diminue jamais le compteur et ne renumérote pas les notes.
- Ne pas utiliser `len(notes) + 1` pour les ids : après une suppression, cela peut créer un doublon.

Commencer avec une liste vide : on abandonne les réponses fictives de l'étape précédente.

**Recherche nécessaire — Python :** chercher la portée des variables et `global`. Expliquer pourquoi réaffecter le compteur depuis une fonction demande cette déclaration, alors qu'appeler `append` sur une liste existante ne réaffecte pas la variable.

**Limite volontaire :** cette solution concerne un serveur de développement dans un seul processus. Un redémarrage, y compris le rechargement automatique après modification du code, efface les notes et le compteur. Ne pas résoudre cela maintenant.

## 4 — Faire fonctionner GET /notes et POST /notes

### 4.1 — Lire la liste

Remplacer le JSON fixe de GET par la liste globale. Au démarrage, GET doit renvoyer `[]` avec 200.

### 4.2 — Créer une note

**Recherche nécessaire — Flask :** chercher `request.get_json()`, le rôle de `silent=True` et comment repérer un JSON absent ou illisible sans obtenir une page d'erreur HTML.

Dans la fonction POST :

1. Lire le corps JSON et vérifier qu'il s'agit d'un objet JSON.
2. Vérifier que `title` et `content` sont des chaînes de caractères.
3. Supprimer leurs espaces de début et de fin ; refuser les chaînes vides.
4. Appliquer les limites : 100 caractères pour le titre, 5 000 pour le contenu.
5. En cas d'erreur, renvoyer un objet JSON contenant `error` avec 400, sans modifier les variables.
6. Sinon, incrémenter le compteur, construire le dictionnaire avec cet id et l'ajouter à la liste.
7. Renvoyer la note créée avec 201. Ne pas utiliser un éventuel id envoyé par le client.

Une petite fonction de validation réutilisable par POST et PUT suffit ; aucune bibliothèque supplémentaire n'est demandée.

Corps de requête à copier :

```json
{"title": "Python", "content": "Réviser les listes et les dictionnaires."}
```

Exemple d'erreur à copier :

```json
{"error": "title and content are required strings"}
```

**Recherche nécessaire — outil HTTP :** trouver comment envoyer ce corps avec `Content-Type: application/json`.

**Validation :** créer deux notes différentes. Elles reçoivent les ids 1 et 2 et apparaissent dans GET. Une création invalide ne consomme pas d'id.

## 5 — Lire, modifier et supprimer par id

**Recherche nécessaire — Python :** chercher comment parcourir une liste de dictionnaires et retirer un élément. L'id d'une note n'est pas son indice dans la liste.

### 5.1 — GET /notes/<id>

Chercher le dictionnaire ayant l'id demandé. Le renvoyer avec 200 ou, s'il est absent, renvoyer 404 :

```json
{"error": "Note not found"}
```

### 5.2 — PUT /notes/<id>

1. Chercher la note ; si elle est absente, renvoyer 404.
2. Lire et valider les données comme pour POST.
3. Remplacer le titre et le contenu, sans changer l'id.
4. Renvoyer la note complète avec 200.

PUT ne crée pas de note et ne modifie pas le compteur. Des données invalides ne doivent pas modifier la note existante.

### 5.3 — DELETE /notes/<id>

Retirer la note si elle existe : renvoyer 204 sans corps. Sinon, renvoyer l'erreur JSON 404. Ne pas diminuer le compteur.

## 6 — Vérifier le fonctionnement complet

**Recherche nécessaire — Flask :** chercher `errorhandler` pour produire une erreur JSON sur une URL inconnue (404) et une méthode non autorisée (405).

Pas d'authentification, de permissions ou de fonctionnalité de sécurité supplémentaire : rester sur les opérations demandées et la validation simple du contrat.

Exécuter ce scénario sans redémarrer ni modifier le code entre les étapes :

1. Lire la liste vide → 200 et `[]`.
2. Créer deux notes → 201, ids 1 et 2.
3. Lire puis modifier la note 2 → 200, même id et nouveaux textes.
4. Envoyer un titre vide, puis du JSON mal formé → 400, aucune modification.
5. Supprimer la note 1 → 204 et corps vide.
6. Créer une nouvelle note → id 3, pas 2.
7. Lire, modifier ou supprimer la note 1 → 404.
8. Vérifier que GET liste les notes 2 et 3, dans cet ordre.
9. Tester une URL inconnue et une méthode non autorisée → erreurs JSON 404 et 405.
10. Redémarrer → liste vide : c'est normal pour cette partie.

## Critères de réussite / TODO

- [ ] Les cinq endpoints manipulent la même liste globale.
- [ ] Les réponses fixes ont été remplacées par les données réelles.
- [ ] Les ids restent uniques pendant une exécution, même après suppression.
- [ ] Les erreurs sont en JSON ; DELETE réussi a un corps vide.
- [ ] Vous savez expliquer la portée des variables et la lecture du JSON.

Suite : [Partie 2 — Objets et stockage mémoire](02-objets-et-stockage-memoire.md).
