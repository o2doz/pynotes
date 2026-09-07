# Partie 3 — Remplacer la mémoire par SQLite

Prérequis : [partie 2](02-objets-et-stockage-memoire.md) terminée.

## Objectif

Créer `SQLiteNoteRepository`, qui expose **les mêmes méthodes et les mêmes retours** que `MemoryNoteRepository`, mais conserve les notes dans un fichier SQLite.

```text
Route Flask → SQLiteNoteRepository → fichier SQLite
                    ↓
                objets Note
```

Garder la classe mémoire pour illustrer le remplacement d'une implémentation par une autre. Ne pas ajouter de service, de classe de connexion, de classe abstraite ou d'ORM : une classe SQLite suffit ici. Utiliser le module standard `sqlite3`, déjà disponible avec Python.

**Règle obligatoire :** toutes les valeurs variables des requêtes SQL passent par des paramètres `?`. Jamais de concaténation ni de f-string contenant les données du client dans une requête SQL.

## 1 — Préparer le fichier et la connexion

Créer `server/src/server/sqlite_note_repository.py` et y déclarer la classe `SQLiteNoteRepository`.

1. Faire recevoir au constructeur le chemin du fichier de base.
2. Conserver ce chemin comme attribut.
3. Utiliser le fichier `notes.sqlite3`. Le serveur étant lancé depuis `server/` avec `uv run server`, ce chemin relatif désigne `server/notes.sqlite3`.

**Recherche nécessaire — Python/SQLite :** dans la [documentation sqlite3](https://docs.python.org/fr/3/library/sqlite3.html), chercher `connect`, `close`, `commit` et `rollback`.

**Amorce de constructeur :**

```python
class SQLiteNoteRepository:
    def __init__(self, db_path):
        self.db_path = db_path
        # TODO : appeler l'initialisation de la table à l'étape 2.
```

**Repère :** utiliser `db_path = "notes.sqlite3"` lors du branchement dans Flask à l'étape 7. SQLite crée ce fichier s'il n'existe pas.

**Amorce d'ouverture/fermeture dans une méthode :**

```python
connection = sqlite3.connect(self.db_path)
try:
    # TODO : exécuter l'opération, puis commit() si nécessaire.
    ...
finally:
    connection.close()
```

TODO : ajouter `import sqlite3` et remplacer `...` par le travail de la méthode. Ce bloc seul n'effectue aucune opération sur les notes.

Pour rester simple : ouvrir une connexion locale dans chaque opération, puis la fermer. Ne pas garder une connexion globale partagée entre les requêtes Flask. Une petite méthode interne d'ouverture est possible mais pas obligatoire.

**Attention :** `with sqlite3.connect(...) as connection` gère la transaction, mais ne ferme pas automatiquement la connexion à la sortie. Prévoir une fermeture, par exemple avec `try/finally`, y compris en cas d'erreur. Valider les écritures avant de fermer.

## 2 — Initialiser la table sans supprimer les données

Au démarrage du repository, créer la table seulement si elle n'existe pas. Ne jamais la vider ou la recréer à chaque lancement.

Structure attendue :

| Colonne | Définition attendue |
|---|---|
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` |
| `title` | `TEXT NOT NULL` |
| `content` | `TEXT NOT NULL` |

**Recherche nécessaire — SQL :** chercher `CREATE TABLE IF NOT EXISTS` et la signification de `INTEGER PRIMARY KEY AUTOINCREMENT` dans SQLite.

**Méthode interne conseillée :** `_initialize_table(self)`, appelée avec `self._initialize_table()` depuis le constructeur. Utiliser `connection.execute(sql)` puis `connection.commit()` dans le bloc de gestion de connexion.

**Amorce SQL à compléter avant exécution :**

```sql
CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT
    -- TODO : ajouter les deux colonnes restantes, avec les virgules nécessaires.
);
```

TODO : écrire le SQL dans une chaîne Python multiligne. Ne pas exécuter ce schéma incomplet : il manquerait les colonnes utilisées ensuite.

SQLite génère maintenant les ids : aucun compteur Python dans cette classe. `AUTOINCREMENT` évite de réutiliser les ids des lignes supprimées après des insertions validées. Les ids peuvent avoir des trous : ils ne représentent pas le nombre actuel de notes.

**TODO :** écrire la requête de création et son exécution dans `_initialize_table()`. L'initialisation doit conserver une table déjà existante et ses données.

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

**Amorce de conversion avec les tuples par défaut :**

```python
def _row_to_note(self, row):
    # Précondition : row n'est pas None ; le SELECT utilise id, title, content.
    note_id = row[0]
    # TODO : récupérer les deux autres valeurs et renvoyer une Note.
    raise NotImplementedError
```

TODO : importer `Note`, puis conserver les signatures publiques de la classe mémoire. Ne pas copier son constructeur ni ses attributs de stockage en mémoire.

## 4 — Lire les notes

### 4.1 — list_all()

1. Ouvrir la connexion.
2. Sélectionner explicitement `id`, `title` et `content`.
3. Ajouter `ORDER BY id ASC` : sans cela, l'ordre n'est pas garanti.
4. Récupérer les lignes et fabriquer une liste d'objets `Note`.
5. Fermer la connexion et renvoyer la liste.

**Repères à assembler :** `connection.execute(sql)`, `cursor.fetchall()`, une boucle sur les lignes et `self._row_to_note(row)`. La requête doit suivre la forme `SELECT colonnes FROM notes ORDER BY id ASC` : remplacer `colonnes` par les trois noms attendus.

**Recherche nécessaire — SQL/Python :** vérifier le rôle de `ORDER BY`, le résultat de `fetchall()` sur une table vide et comment construire une liste avec `append()` ou une compréhension.

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

**Repères pour votre méthode :** adapter la requête générique à la table `notes` et aux trois colonnes ; passer `(note_id,)`, appeler `cursor.fetchone()`, puis traiter le cas `row is None` avant `self._row_to_note(row)`.

## 5 — Créer une note

Dans `create(title, content)` :

1. Ouvrir une connexion.
2. Insérer le titre et le contenu avec deux paramètres `?`, sans fournir d'id.
3. Récupérer l'id généré depuis le curseur de cette insertion.
4. Valider l'écriture.
5. Construire et renvoyer l'objet `Note` correspondant.
6. Garantir la fermeture de la connexion.

**Recherche nécessaire — SQLite :** chercher `INSERT INTO`, `cursor.lastrowid` et quand appeler `commit()`. Ne pas utiliser `SELECT MAX(id)` pour retrouver l'id créé.

**Amorce à compléter dans le bloc de connexion :**

```python
# TODO : définir sql avec INSERT INTO et deux placeholders ?.
cursor = connection.execute(sql, (title, content))
new_id = cursor.lastrowid
# TODO : valider l'écriture et renvoyer une Note avec new_id.
```

Repères : `connection.commit()` et `Note(new_id, title, content)`. L'ordre des valeurs dans le tuple doit correspondre à l'ordre des colonnes de l'INSERT.

## 6 — Modifier et supprimer

### 6.1 — update(note_id, title, content)

1. Vérifier si la note existe ; sinon, renvoyer `None`.
2. Modifier les deux champs avec un UPDATE paramétré, y compris pour l'id dans le WHERE.
3. Valider l'écriture et renvoyer la note mise à jour.
4. Conserver le même id. Ne pas insérer une note si elle est absente.

**Repères :** commencer par `self.get_by_id(note_id)` et traiter le cas `is None`. Construire ensuite une requête de la forme `UPDATE notes SET colonne = ?, autre_colonne = ? WHERE id = ?`, en remplaçant les noms de colonnes. Passer les paramètres `(title, content, note_id)` à `connection.execute(...)`, puis utiliser `connection.commit()`.

**Recherche nécessaire — SQLite :** vérifier la syntaxe de `UPDATE ... SET ... WHERE ...` et pourquoi l'ordre des paramètres est important. TODO : choisir comment reconstruire l'objet `Note` à renvoyer après validation de l'écriture.

Pour cette version pédagogique, une lecture d'existence suivie d'une mise à jour suffit. Ne pas ajouter de gestion de concurrence.

Modifier une note avec des valeurs identiques reste une réussite et renvoie une `Note`.

### 6.2 — delete(note_id)

1. Exécuter un DELETE avec un WHERE paramétré sur l'id.
2. Déterminer si une ligne a été supprimée.
3. Valider l'écriture et renvoyer le booléen attendu.

**Recherche nécessaire — SQLite :** chercher `UPDATE`, `DELETE`, `WHERE` et `cursor.rowcount`. Attention : oublier le WHERE peut modifier ou supprimer toutes les notes.

**Repères :** la requête commence par `DELETE FROM notes` ; TODO : ajouter le WHERE avec son placeholder avant de l'exécuter. Utiliser `(note_id,)`, conserver le curseur et examiner `cursor.rowcount`. La comparaison `cursor.rowcount > 0` produit un booléen ; valider l'écriture avant de renvoyer le résultat.

## 7 — Remplacer le stockage, sans réécrire les routes

Dans le module de l'application :

1. Importer `SQLiteNoteRepository`.
2. Remplacer la construction de `MemoryNoteRepository` par celle de `SQLiteNoteRepository`, avec le chemin de base choisi.
3. Garder le même nom de variable, par exemple `note_store`.
4. Ne changer ni les appels de méthodes dans les routes, ni les conversions `to_dict()`, ni les codes HTTP.

**Recherche nécessaire — POO :** chercher le « duck typing » en Python. Expliquer pourquoi les deux classes peuvent être utilisées de la même manière sans hériter d'une classe commune.

**Ligne de branchement à adapter, hors des routes :**

```python
# TODO : importer la classe et définir db_path avec le nom de fichier de l'étape 1.
note_store = SQLiteNoteRepository(db_path)
```

L'ancienne ligne `note_store = MemoryNoteRepository()` est remplacée, pas conservée en dessous. TODO : vérifier que les routes appellent toujours seulement les cinq méthodes du contrat.

Si les routes doivent maintenant traiter des tuples SQL ou connaître le chemin de la base, revoir les responsabilités : le repository n'a pas respecté le contrat.

## Critères de réussite / TODO

- [ ] Les cinq méthodes ont le même contrat que dans la classe mémoire.
- [ ] Toutes les données SQL variables utilisent les paramètres `?`.
- [ ] Les connexions sont fermées et les écritures validées.
- [ ] SQLite gère les ids ; aucun compteur global ne subsiste dans ce stockage.
- [ ] La table et les notes survivent aux redémarrages.
- [ ] Le SQL reste dans `SQLiteNoteRepository` ; les routes restent indépendantes du stockage.
- [ ] La classe mémoire est conservée et peut encore remplacer la classe SQLite.

**Bilan à rédiger en quelques phrases :** qu'est-ce qui a changé entre les parties 1, 2 et 3 ? Qu'est-ce qui est resté identique pour le client ? Pourquoi fixer les méthodes et les valeurs de retour avant de changer le stockage ?
