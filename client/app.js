// État minimal de l'interface : l'identifiant est null tant qu'une note n'est pas enregistrée.
let currentNoteId = null;

const apiUrlInput = document.querySelector("#api-url");
const statusElement = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");
const form = document.querySelector("#note-form");
const titleInput = document.querySelector("#title");
const contentInput = document.querySelector("#content");
const editorTitle = document.querySelector("#editor-title");
const noteIdElement = document.querySelector("#note-id");
const deleteButton = document.querySelector("#delete-button");

// Construit une URL sans produire deux slashs entre l'adresse et le chemin.
function apiUrl(path) {
  print(apiUrl)
  return `${apiUrlInput.value.trim().replace(/\/$/, "")}${path}`;
}

// Affiche un message lisible sans utiliser innerHTML avec des données du serveur.
function setStatus(message, type = "") {
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
}

// Lit le JSON lorsqu'il existe. DELETE renvoie volontairement un corps vide (204).
async function readResponse(response) {
  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Le serveur a renvoyé une réponse qui n'est pas du JSON.");
    }
  }

  if (!response.ok) {
    throw new Error(data?.error || `Erreur HTTP ${response.status}`);
  }
  return data;
}

// Centralise les appels fetch : chaque endpoint passe par cette fonction.
async function request(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  return readResponse(response);
}

function resetEditor() {
  currentNoteId = null;
  form.reset();
  editorTitle.textContent = "Nouvelle note";
  noteIdElement.textContent = "NON ENREGISTRÉE";
  deleteButton.disabled = true;
  document.querySelectorAll(".note-button").forEach((button) => button.classList.remove("active"));
  titleInput.focus();
}

function showNote(note) {
  currentNoteId = note.id;
  titleInput.value = note.title;
  contentInput.value = note.content;
  editorTitle.textContent = "Modifier la note";
  noteIdElement.textContent = `ID #${note.id}`;
  deleteButton.disabled = false;

  document.querySelectorAll(".note-button").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.id) === note.id);
  });
}

function renderNotes(notes) {
  notesList.replaceChildren();

  if (notes.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "Aucune note. Créez la première.";
    notesList.append(empty);
    return;
  }

  for (const note of notes) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    const noteTitle = document.createElement("strong");
    const preview = document.createElement("span");

    button.type = "button";
    button.className = "note-button";
    button.dataset.id = note.id;
    noteTitle.textContent = note.title;
    preview.textContent = note.content;
    button.append(noteTitle, preview);
    button.addEventListener("click", () => loadOneNote(note.id));
    item.append(button);
    notesList.append(item);
  }
}

// Utilise GET /notes pour mettre à jour l'index à gauche.
async function loadNotes() {
  try {
    setStatus("Lecture des notes…");
    const notes = await request("/notes");
    renderNotes(notes);
    setStatus(`${notes.length} note(s) chargée(s).`, "success");
  } catch (error) {
    setStatus(`Impossible de charger les notes : ${error.message}`, "error");
  }
}

// Utilise GET /notes/<id> avant d'afficher une note dans l'éditeur.
async function loadOneNote(id) {
  try {
    setStatus(`Lecture de la note #${id}…`);
    const note = await request(`/notes/${id}`);
    showNote(note);
    setStatus(`Note #${id} ouverte.`, "success");
  } catch (error) {
    setStatus(`Impossible d'ouvrir la note : ${error.message}`, "error");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Les mêmes règles seront vérifiées par le serveur ; ceci évite un aller-retour inutile.
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  if (!title || !content) {
    setStatus("Le titre et le contenu ne peuvent pas être vides.", "error");
    return;
  }

  const isNew = currentNoteId === null;
  const path = isNew ? "/notes" : `/notes/${currentNoteId}`;
  const method = isNew ? "POST" : "PUT";

  try {
    setStatus(isNew ? "Création de la note…" : "Enregistrement des modifications…");
    const note = await request(path, {
      method,
      body: JSON.stringify({ title, content }),
    });
    showNote(note);
    await loadNotes();
    // loadNotes reconstruit la liste : on remet en évidence la note qui vient d'être sauvée.
    document.querySelector(`.note-button[data-id="${note.id}"]`)?.classList.add("active");
    setStatus(isNew ? "Note créée." : "Note modifiée.", "success");
  } catch (error) {
    setStatus(`Impossible d'enregistrer : ${error.message}`, "error");
  }
});

deleteButton.addEventListener("click", async () => {
  if (currentNoteId === null) return;
  if (!window.confirm("Supprimer cette note définitivement ?")) return;

  try {
    setStatus(`Suppression de la note #${currentNoteId}…`);
    await request(`/notes/${currentNoteId}`, { method: "DELETE" });
    resetEditor();
    await loadNotes();
    setStatus("Note supprimée.", "success");
  } catch (error) {
    setStatus(`Impossible de supprimer : ${error.message}`, "error");
  }
});

document.querySelector("#new-button").addEventListener("click", resetEditor);
document.querySelector("#cancel-button").addEventListener("click", resetEditor);
document.querySelector("#connect-button").addEventListener("click", loadNotes);

// Chargement initial : l'adresse par défaut est celle du serveur Flask de développement.
loadNotes();
