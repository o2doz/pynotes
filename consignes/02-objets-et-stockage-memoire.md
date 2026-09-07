# Partie 2 — Introduire la programmation orientée objet

Prérequis : [partie 1](01-routes-et-memoire.md) terminée.

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

**Repères concrets à classer :** `request.get_json()`, `self.title`, `get_by_id(note_id)`, `jsonify(...)` et `self.notes.append(note)`. TODO : associer chaque expression à une ligne du tableau et justifier votre choix.

**À expliquer :** pourquoi une note ne doit-elle pas connaître Flask ? Quelle différence entre une classe et les deux objets créés à partir de cette classe ?

## 2 — Écrire la classe Note

Créer `server/src/server/note.py`.

1. Définir la classe `Note`.
2. Écrire son constructeur pour recevoir `id`, `title` et `content`.
3. Stocker ces valeurs dans des attributs d'instance.
4. Ajouter une méthode `to_dict()` qui renvoie un dictionnaire contenant exactement ces trois champs.

**Amorce à compléter :**

```python
class Note:
    def __init__(self, id, title, content):
        self.id = id
        # TODO : conserver les deux autres informations sur l'instance.

    def to_dict(self):
        # TODO : renvoyer un dictionnaire, pas une chaîne JSON.
        raise NotImplementedError
```

**Repères :** accéder à un attribut avec `self.title` dans une méthode ou `note.title` depuis le code appelant. Pour l'import dans un autre module du package, partir de `from .note import Note` ; rechercher pourquoi cet import relatif suppose une exécution dans le contexte du package.

Ne pas appeler `jsonify` dans cette classe : convertir en dictionnaire est une opération Python indépendante de Flask.

**Recherche nécessaire — Python/POO :** chercher comment importer une classe depuis un module du même package. La classe `Note` doit rester indépendante de Flask.

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

**Amorce de signature :**

```python
class MemoryNoteRepository:
    def get_by_id(self, note_id):
        # TODO : chercher dans la collection de cette instance.
        raise NotImplementedError
```

TODO : ajouter les quatre autres méthodes du tableau avec `self` comme premier paramètre. `raise NotImplementedError` est uniquement un marqueur provisoire, pas le retour attendu pour un id absent.

**Recherche nécessaire — POO :** comprendre pourquoi la définition comporte `self`, alors que l'appel s'écrit `repository.get_by_id(3)` et non `repository.get_by_id(repository, 3)`.

## 4 — Déplacer la liste et le compteur

Dans le constructeur de `MemoryNoteRepository`, initialiser une liste vide et un compteur à zéro, comme **attributs d'instance**.

**Recherche nécessaire — POO :** comprendre la différence entre un attribut déclaré sur la classe et un attribut créé avec `self` dans `__init__`. Pourquoi une liste déclarée sur la classe peut-elle être partagée accidentellement ?

1. Implémenter `list_all()` pour renvoyer les notes dans l'ordre des ids.
2. Implémenter `create()` : incrémenter le compteur, créer un objet `Note`, l'ajouter à la collection et le renvoyer.
3. Vérifier qu'on stocke maintenant des objets, plus des dictionnaires.

**Amorce du constructeur, à ajouter à la classe existante :**

```python
def __init__(self):
    self.notes = []
    # TODO : initialiser aussi le compteur d'instance.
```

**Repères pour les méthodes :** `self.notes_created += 1`, `Note(id, title, content)`, `self.notes.append(note)` et `sorted(self.notes, key=lambda note: note.id)`. TODO : choisir leur emplacement et les valeurs à renvoyer. Ne pas utiliser `global` ici.

**Recherche nécessaire — Python :** chercher le paramètre `key` de `sorted()` et le rôle de la petite fonction `lambda` ci-dessus.

## 5 — Compléter les opérations

1. Écrire `get_by_id()` : chercher selon l'attribut `id`, pas selon la position dans la liste.
2. Écrire `update()` : retrouver la note, modifier ses attributs et renvoyer l'objet ; renvoyer `None` si elle n'existe pas.
3. Écrire `delete()` : supprimer la note et renvoyer un booléen, sans diminuer le compteur.

**TODO :** reprendre les algorithmes de la partie 1 et les adapter aux attributs d'instance et aux objets `Note`. Ne pas garder une deuxième copie de la liste dans les routes.

**Amorce pour réutiliser une méthode depuis une autre :**

```python
# Au début de update(), dans la classe :
note = self.get_by_id(note_id)
# TODO : traiter None avant d'accéder aux attributs de note.
```

**Repères :** `note.id` remplace `note["id"]`, `note.title = title` met à jour un attribut et `self.notes.remove(note)` retire l'objet trouvé. TODO : écrire vous-même les branches et les retours `None`, `True` ou `False`.

**Recherche nécessaire — POO :** revoir l'appel d'une méthode sur `self` et la différence entre accès par clé de dictionnaire et accès par attribut.

## 6 — Brancher les routes sur le repository

Créer **une seule instance** de `MemoryNoteRepository`, au niveau du module de l'application, hors des fonctions de routes. La nommer par exemple `note_store`.

Ne pas construire un repository à chaque requête : sa liste serait réinitialisée à chaque appel.

Pour chaque route, dans l'ordre GET liste, POST, GET individuel, PUT, DELETE :

1. Conserver la lecture et la validation de la requête.
2. Remplacer les manipulations directes de la liste par l'appel à la méthode correspondante.
3. Traduire les retours `None` ou `False` en erreur JSON 404 lorsque nécessaire.
4. Transformer les objets renvoyés en dictionnaires avant `jsonify`.
5. Conserver les mêmes codes HTTP.

**Recherche nécessaire — Python et Flask :** pourquoi Flask ne sait-il pas directement sérialiser votre objet `Note` ? Comment transformer une liste d'objets en liste de dictionnaires avec une boucle ou une compréhension de liste ?

**Correspondances à utiliser :**

| Route | Appel au stockage |
|---|---|
| GET liste | `note_store.list_all()` |
| POST | `note_store.create(title, content)` |
| GET individuel | `note_store.get_by_id(note_id)` |
| PUT | `note_store.update(note_id, title, content)` |
| DELETE | `note_store.delete(note_id)` |

**Amorce de conversion dans une route individuelle :**

```python
note = note_store.get_by_id(note_id)
# TODO : traiter le cas None avant la ligne suivante.
payload = note.to_dict()
# TODO : renvoyer payload avec jsonify et le bon statut.
```

Pour la liste, partir de `payload = []`, parcourir les objets et utiliser `payload.append(note.to_dict())`. TODO : placer ces instructions dans la bonne route, puis essayer une compréhension de liste après recherche.

Attention : pour DELETE, utiliser le booléen uniquement pour décider entre 204 et 404 ; ne pas renvoyer ce booléen comme corps de succès.

Supprimer ensuite les anciennes variables globales `notes` et `notes_created`, ainsi que les instructions `global` devenues inutiles. L'instance partagée `note_store` reste au niveau du module.

## Critères de réussite / TODO

- [ ] `Note` représente une note et fournit `to_dict()`.
- [ ] `MemoryNoteRepository` possède la liste et le compteur d'instance.
- [ ] Les cinq méthodes respectent précisément le tableau de contrat.
- [ ] Les classes sont indépendantes de Flask et ne l'importent pas.
- [ ] Les routes ne parcourent plus la collection et ne gèrent plus les ids.
- [ ] Les réponses HTTP sont identiques à celles de la partie 1.
- [ ] Vous savez expliquer pourquoi l'instance du repository est créée hors des routes.

Question de transition : si une autre classe proposait exactement les mêmes méthodes et retours, que faudrait-il changer dans les routes pour l'utiliser ?

Suite : [Partie 3 — Repository SQLite](03-repository-sqlite.md).
