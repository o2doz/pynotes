# Partie 3 — Remplacer la mémoire par SQLite

Prérequis : [partie 2](02-objets-et-stockage-memoire.md) terminée et testée.

## Objectif

Créer `SQLiteNoteRepository`, qui expose **les mêmes méthodes et les mêmes retours** que `MemoryNoteRepository`, mais conserve les notes dans un fichier SQLite.

```text
Route Flask → SQLiteNoteRepository → fichier SQLite
                    ↓
                objets Note
```

Garder la classe mémoire pour pouvoir tester les deux implémentations. Ne pas ajouter de service, de classe de connexion, de classe abstraite ou d'ORM : une classe SQLite suffit ici. Utiliser le module standard `sqlite3`, déjà disponible avec Python.

**Règle obligatoire :** toutes les valeurs variables des requêtes SQL passent par des paramètres `?`. Jamais de concaténation ni de f-string contenant les données du client dans une requête SQL.

## 1 — Préparer le fichier et la connexion

Créer `server/src/server/sqlite_note_repository.py` et y déclarer la classe `SQLiteNoteRepository`.

1. Faire recevoir au constructeur le chemin du fichier de base.
2. Conserver ce chemin comme attribut.
3. Choisir un chemin stable, par exemple `server/notes.sqlite3`, construit relativement à un fichier du projet avec `pathlib` plutôt qu'au dossier depuis lequel la commande est lancée.
4. Ajouter le fichier de base aux exclusions Git du serveur. Ne pas versionner les données de test.

**Recherche nécessaire — Python/SQLite :** dans la [documentation sqlite3](https://docs.python.org/fr/3/library/sqlite3.html), chercher `connect`, `close`, `commit` et `rollback`. Dans la documentation `pathlib`, chercher `Path(__file__).resolve()` et les répertoires parents.

Pour rester simple : ouvrir une connexion locale dans chaque opération, puis la fermer. Ne pas garder une connexion globale partagée entre les requêtes Flask. Une petite méthode interne d'ouverture est possible mais pas obligatoire.

**Attention :** `with sqlite3.connect(...) as connection` gère la transaction, mais ne ferme pas automatiquement la connexion à la sortie. Prévoir une fermeture, par exemple avec `try/finally`, y compris en cas d'erreur. Valider les écritures avant de fermer.

**Validation :** depuis un test Python sans Flask, ouvrir puis fermer une connexion au chemin choisi ; vérifier où le fichier a été créé. Ne pas utiliser `:memory:` pour les tests de persistance.

## 2 — Initialiser la table sans supprimer les données

Au démarrage du repository, créer la table seulement si elle n'existe pas. Ne jamais la vider ou la recréer à chaque lancement.

Structure attendue :

| Colonne | Définition attendue |
|---|---|
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` |
| `title` | `TEXT NOT NULL` |
| `content` | `TEXT NOT NULL` |

**Recherche nécessaire — SQL :** chercher `CREATE TABLE IF NOT EXISTS` et la signification de `INTEGER PRIMARY KEY AUTOINCREMENT` dans SQLite.

SQLite génère maintenant les ids : aucun compteur Python dans cette classe. `AUTOINCREMENT` évite de réutiliser les ids des lignes supprimées après des insertions validées. Les ids peuvent avoir des trous : ils ne représentent pas le nombre actuel de notes.

**TODO :** écrire la requête de création et son exécution, puis construire deux fois le repository sur le même fichier. La seconde initialisation ne doit ni échouer ni effacer les données.

## 3 — Respecter le contrat existant

Reprendre exactement les signatures publiques de la partie 2 :

| Méthode | Résultat |
|---|---|
| `list_all()` | Liste d'objets `Note` triée par id croissant |
| `get_by_id(note_id)` | `Note` ou `None` |
| `create(title, content)` | `Note` créée avec l'id attribué par SQLite |
| `update(note_id, title, content)` | `Note` mise à jour ou `None` |
| `delete(note_id)` | `True` si supprimée, `False` sinon |

Les lignes SQL ne doivent pas sortir du repository : convertir chaque ligne lue en objet `Note`. Ne pas renvoyer de tuple SQL, de curseur, de réponse Flask ou de code HTTP.

**Recherche nécessaire — SQLite :** chercher `fetchone()`, `fetchall()` et, au choix, l'accès aux tuples ou `sqlite3.Row`. Réfléchir à une petite méthode interne de conversion si le même code se répète.

## 4 — Lire les notes

### 4.1 — list_all()

1. Ouvrir la connexion.
2. Sélectionner explicitement `id`, `title` et `content`.
3. Ajouter `ORDER BY id ASC` : sans cela, l'ordre n'est pas garanti.
4. Récupérer les lignes et fabriquer une liste d'objets `Note`.
5. Fermer la connexion et renvoyer la liste.

**Validation :** sur une base neuve, obtenir `[]`.

### 4.2 — get_by_id(note_id)

Écrire un SELECT filtré par id avec un paramètre `?`. Renvoyer `None` si aucune ligne n'est trouvée, sinon un objet `Note`.

Exemple générique de requête paramétrée — à comprendre, pas à recopier comme solution :

```python
cursor = connection.execute(
    "SELECT name FROM products WHERE id = ?",
    (product_id,),
)
```

**Recherche nécessaire — Python :** pourquoi la virgule dans `(product_id,)` est-elle indispensable pour former un tuple d'un seul élément ?

**Validation :** demander un id absent donne `None`, pas une exception liée à une conversion de ligne vide.

## 5 — Créer une note

Dans `create(title, content)` :

1. Ouvrir une connexion.
2. Insérer le titre et le contenu avec deux paramètres `?`, sans fournir d'id.
3. Récupérer l'id généré depuis le curseur de cette insertion.
4. Valider l'écriture.
5. Construire et renvoyer l'objet `Note` correspondant.
6. Garantir la fermeture de la connexion.

**Recherche nécessaire — SQLite :** chercher `INSERT INTO`, `cursor.lastrowid` et quand appeler `commit()`. Ne pas utiliser `SELECT MAX(id)` pour retrouver l'id créé.

**TODO / validation sans Flask :**

- Créer une note et vérifier son id, son titre et son contenu.
- La relire avec `get_by_id()` puis `list_all()`.
- Fermer le programme, le relancer sur le même fichier et retrouver la note.
- Tester un titre comme `L'été d'Ana` : l'apostrophe doit être enregistrée normalement grâce aux paramètres.

## 6 — Modifier et supprimer

### 6.1 — update(note_id, title, content)

1. Vérifier si la note existe ; sinon, renvoyer `None`.
2. Modifier les deux champs avec un UPDATE paramétré, y compris pour l'id dans le WHERE.
3. Valider l'écriture et renvoyer la note mise à jour.
4. Conserver le même id. Ne pas insérer une note si elle est absente.

Pour cette version pédagogique, une lecture d'existence suivie d'une mise à jour suffit. Ne pas ajouter de gestion de concurrence.

**Validation :** un id inconnu donne `None`. Modifier une note avec des valeurs identiques reste une réussite et renvoie une `Note`.

### 6.2 — delete(note_id)

1. Exécuter un DELETE avec un WHERE paramétré sur l'id.
2. Déterminer si une ligne a été supprimée.
3. Valider l'écriture et renvoyer le booléen attendu.

**Recherche nécessaire — SQLite :** chercher `UPDATE`, `DELETE`, `WHERE` et `cursor.rowcount`. Attention : oublier le WHERE peut modifier ou supprimer toutes les notes.

**Validation :** supprimer une note donne `True`, recommencer donne `False`. Les autres notes restent présentes.

## 7 — Remplacer le stockage, sans réécrire les routes

Dans le module de l'application :

1. Importer `SQLiteNoteRepository`.
2. Remplacer la construction de `MemoryNoteRepository` par celle de `SQLiteNoteRepository`, avec le chemin de base choisi.
3. Garder le même nom de variable, par exemple `note_store`.
4. Ne changer ni les appels de méthodes dans les routes, ni les conversions `to_dict()`, ni les codes HTTP.

**Recherche nécessaire — POO :** chercher le « duck typing » en Python. Expliquer pourquoi les deux classes peuvent être utilisées de la même manière sans hériter d'une classe commune.

Si les routes doivent maintenant traiter des tuples SQL ou connaître le chemin de la base, revoir les responsabilités : le repository n'a pas respecté le contrat.

Aucune migration automatique des anciennes notes en mémoire n'est demandée. Créer les données de test par l'API une fois SQLite branché.

## 8 — Tester les deux implémentations et la persistance

Écrire un petit scénario Python indépendant de Flask qui reçoit un repository et réalise : création, liste, lecture, modification, suppression et recherche d'un id absent. L'exécuter avec chacune des deux classes, sur un stockage neuf. Les types de retours et comportements doivent correspondre.

Puis tester l'API :

1. Partir d'un fichier de test neuf et créer deux notes.
2. Modifier la seconde et supprimer la première.
3. Arrêter puis relancer le serveur sans supprimer le fichier.
4. Vérifier que la seconde conserve son id et ses nouveaux textes ; la première reste absente.
5. Créer une troisième note : elle reçoit un nouvel id, pas celui de la note supprimée.
6. Rejouer les tests d'erreurs de la partie 1, dont JSON invalide et id inconnu.
7. Vérifier un titre contenant une apostrophe et du contenu avec des accents.

Pour recommencer à zéro, supprimer uniquement une base de test identifiée, serveur arrêté. Ne jamais ajouter de suppression automatique de la base au démarrage.

## Critères de réussite / TODO

- [ ] Les cinq méthodes ont le même contrat que dans la classe mémoire.
- [ ] Toutes les données SQL variables utilisent les paramètres `?`.
- [ ] Les connexions sont fermées et les écritures validées.
- [ ] SQLite gère les ids ; aucun compteur global ne subsiste dans ce stockage.
- [ ] La table et les notes survivent aux redémarrages.
- [ ] Le SQL reste dans `SQLiteNoteRepository` ; les routes restent indépendantes du stockage.
- [ ] La classe mémoire est conservée et peut encore remplacer la classe SQLite.

**Bilan à rédiger en quelques phrases :** qu'est-ce qui a changé entre les parties 1, 2 et 3 ? Qu'est-ce qui est resté identique pour le client ? Pourquoi fixer les méthodes et les valeurs de retour avant de changer le stockage ?
