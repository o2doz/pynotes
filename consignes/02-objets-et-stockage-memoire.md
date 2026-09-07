# Partie 2 — Introduire la programmation orientée objet

Prérequis : [partie 1](01-routes-et-memoire.md) terminée et testée.

## Objectif

Remplacer les variables globales de données par deux classes :

- `Note` représente **une** note ; le singulier est choisi parce qu'une instance correspond à une seule note.
- `MemoryNoteRepository` conserve les notes en mémoire et permet de les retrouver, créer, modifier et supprimer.

Un repository est ici simplement une classe qui regroupe les opérations de stockage. Pas de classe abstraite, d'héritage, de service supplémentaire ou de bibliothèque à ajouter.

```text
Route Flask → MemoryNoteRepository → objets Note
```

Les URL, les codes HTTP et le JSON ne changent pas. Les notes seront encore perdues au redémarrage.

## 1 — Comprendre les responsabilités

Avant de coder, classer ces opérations : recevoir une requête HTTP, représenter un titre, chercher une note, fabriquer une réponse 404, ajouter une note à une collection.

Répartition attendue :

| Élément | Responsabilité |
|---|---|
| Route Flask | Lire et valider la requête, appeler le repository, choisir le code HTTP et renvoyer le JSON |
| Note | Conserver `id`, `title`, `content` et produire un dictionnaire |
| MemoryNoteRepository | Conserver la collection et le compteur, effectuer les opérations sur les notes |

**Recherche nécessaire — POO :** lire les notions de classe, instance, `__init__`, `self`, attribut d'instance et méthode dans le [tutoriel Python](https://docs.python.org/fr/3/tutorial/classes.html).

**À expliquer :** pourquoi une note ne doit-elle pas connaître Flask ? Quelle différence entre une classe et les deux objets créés à partir de cette classe ?

## 2 — Écrire la classe Note

Créer `server/src/server/note.py`.

1. Définir la classe `Note`.
2. Écrire son constructeur pour recevoir `id`, `title` et `content`.
3. Stocker ces valeurs dans des attributs d'instance.
4. Ajouter une méthode `to_dict()` qui renvoie un dictionnaire contenant exactement ces trois champs.

Ne pas appeler `jsonify` dans cette classe : convertir en dictionnaire est une opération Python indépendante de Flask.

Petit test utilisable une fois votre classe écrite :

```python
note = Note(7, "POO", "Comprendre les instances.")
assert note.to_dict() == {
    "id": 7,
    "title": "POO",
    "content": "Comprendre les instances.",
}
```

**TODO :** ajouter vous-même l'import nécessaire et créer une deuxième note. Modifier le titre de la première, puis vérifier que la seconde n'a pas changé.

**Recherche nécessaire — Python :** chercher comment importer une classe depuis un module du même package. Exécuter les tests depuis `server/` avec `uv run python` ou un petit script adapté.

**Validation :** la classe fonctionne sans démarrer Flask.

## 3 — Fixer le contrat du stockage

Créer `server/src/server/memory_note_repository.py`. Sa classe doit proposer les méthodes suivantes. Ces noms et résultats seront conservés en partie 3.

| Méthode | Résultat attendu |
|---|---|
| `list_all()` | Liste d'objets `Note`, triée par id croissant ; `[]` si vide |
| `get_by_id(note_id)` | Objet `Note` ou `None` si absent |
| `create(title, content)` | Nouvel objet `Note` avec son id généré |
| `update(note_id, title, content)` | Objet `Note` mis à jour, ou `None` si absent |
| `delete(note_id)` | `True` si une note a été supprimée, sinon `False` |

Le repository reçoit des titres et contenus déjà validés par les routes. Il ne renvoie ni réponse Flask ni code HTTP. Par exemple, `None` sera traduit en 404 par la route, pas par le repository.

**TODO :** écrire les signatures de ces méthodes, puis les implémenter une par une aux étapes suivantes. Les annotations de type sont facultatives ; les valeurs de retour demandées ne le sont pas.

## 4 — Déplacer la liste et le compteur

Dans le constructeur de `MemoryNoteRepository`, initialiser une liste vide et un compteur à zéro, comme **attributs d'instance**.

**Recherche nécessaire — POO :** comprendre la différence entre un attribut déclaré sur la classe et un attribut créé avec `self` dans `__init__`. Pourquoi une liste déclarée sur la classe peut-elle être partagée accidentellement ?

1. Implémenter `list_all()` pour renvoyer les notes dans l'ordre des ids.
2. Implémenter `create()` : incrémenter le compteur, créer un objet `Note`, l'ajouter à la collection et le renvoyer.
3. Vérifier qu'on stocke maintenant des objets, plus des dictionnaires.

**Validation sans Flask :** créer un repository, ajouter deux notes, vérifier leurs ids et leurs attributs. Créer un deuxième repository : il doit être vide et son compteur indépendant.

## 5 — Compléter les opérations

1. Écrire `get_by_id()` : chercher selon l'attribut `id`, pas selon la position dans la liste.
2. Écrire `update()` : retrouver la note, modifier ses attributs et renvoyer l'objet ; renvoyer `None` si elle n'existe pas.
3. Écrire `delete()` : supprimer la note et renvoyer un booléen, sans diminuer le compteur.

**TODO :** reprendre les algorithmes de la partie 1 et les adapter aux attributs d'instance et aux objets `Note`. Ne pas garder une deuxième copie de la liste dans les routes.

Tests à écrire sans serveur :

- Un id inconnu donne `None` en lecture et modification, `False` en suppression.
- Une modification conserve l'id et ne crée pas de note supplémentaire.
- Une suppression réussie donne `True` ; une deuxième suppression donne `False`.
- Après création des ids 1 et 2, suppression de 1 et nouvelle création, on obtient l'id 3.

## 6 — Brancher les routes sur le repository

Créer **une seule instance** de `MemoryNoteRepository`, au niveau du module de l'application, hors des fonctions de routes. La nommer par exemple `note_store`.

Ne pas construire un repository à chaque requête : sa liste serait réinitialisée à chaque appel.

Pour chaque route, dans l'ordre GET liste, POST, GET individuel, PUT, DELETE :

1. Conserver la lecture et la validation de la requête.
2. Remplacer les manipulations directes de la liste par l'appel à la méthode correspondante.
3. Traduire les retours `None` ou `False` en erreur JSON 404 lorsque nécessaire.
4. Transformer les objets renvoyés en dictionnaires avant `jsonify`.
5. Conserver les mêmes codes HTTP.
6. Tester avant de passer à la route suivante.

**Recherche nécessaire — Python et Flask :** pourquoi Flask ne sait-il pas directement sérialiser votre objet `Note` ? Comment transformer une liste d'objets en liste de dictionnaires avec une boucle ou une compréhension de liste ?

Attention : pour DELETE, utiliser le booléen uniquement pour décider entre 204 et 404 ; ne pas renvoyer ce booléen comme corps de succès.

Supprimer ensuite les anciennes variables globales `notes` et `notes_created`, ainsi que les instructions `global` devenues inutiles. L'instance partagée `note_store` reste au niveau du module.

## 7 — Vérifier que le comportement n'a pas changé

Rejouer intégralement le scénario de la partie 1. Si le client fonctionnait avant, il doit toujours fonctionner sans modification.

## Critères de réussite / TODO

- [ ] `Note` représente une note et fournit `to_dict()`.
- [ ] `MemoryNoteRepository` possède la liste et le compteur d'instance.
- [ ] Les cinq méthodes respectent précisément le tableau de contrat.
- [ ] Les classes se testent sans Flask et n'importent pas Flask.
- [ ] Les routes ne parcourent plus la collection et ne gèrent plus les ids.
- [ ] Les réponses HTTP sont identiques à celles de la partie 1.
- [ ] Vous savez expliquer pourquoi l'instance du repository est créée hors des routes.

Question de transition : si une autre classe proposait exactement les mêmes méthodes et retours, que faudrait-il changer dans les routes pour l'utiliser ?

Suite : [Partie 3 — Repository SQLite](03-repository-sqlite.md).
