/* =========================================================
   CoWriter — a screenplay you write together with an agent
   Data lives in localStorage. WebMCP tools operate on the
   exact same state the human sees and edits by hand.
   ========================================================= */

const STORAGE_KEY = "cowriter_state_v1";

/* ---------- id helper ---------- */
function newId(prefix) {
  return prefix + "_" + Math.random().toString(36).slice(2, 9);
}

/* ---------- default / seed state ---------- */
function seedState() {
  const charJess = newId("char");
  const charMara = newId("char");
  const act1 = newId("act");
  const scene1 = newId("scene");

  return {
    premise: {
      title: "Currents",
      logline:
        "A courier who never stops moving is forced to slow down at the one door she's avoided for years — her sister's — carrying a letter that will finally explain why she left.",
      theme: "You can't outrun what you never faced.",
      genre: "Short drama, ~10 pages",
      tone: "Quiet, tense, understated — more silence than speeches.",
    },
    characters: [
      {
        id: charJess,
        name: "JESS",
        description: "24, a courier who never lets anyone see her scared.",
        traits: "guarded, quick-witted, secretly loyal",
      },
      {
        id: charMara,
        name: "MARA",
        description: "Jess's estranged older sister. Runs a repair shop.",
        traits: "blunt, practical, still hurt",
      },
    ],
    ideas: [
      {
        id: newId("idea"),
        text: "Maybe the letter Jess is carrying is actually addressed to Mara — she doesn't know yet.",
      },
    ],
    outline: [
      {
        id: newId("actg"),
        actLabel: "Act 1",
        beats: [
          { id: newId("beat"), text: "Jess shows up at Mara's shop after hours, letter in hand, trying to act like nothing's wrong." },
          { id: newId("beat"), text: "Mara refuses to let her in at first — old wounds surface fast." },
          { id: newId("beat"), text: "Jess won't say why she's really there. Mara clocks the courier bag and gets suspicious." },
        ],
      },
      {
        id: newId("actg"),
        actLabel: "Act 2",
        beats: [
          { id: newId("beat"), text: "Mara finally looks at the letter and realizes it's addressed to her, not Jess." },
          { id: newId("beat"), text: "Jess admits she's known for weeks and was too scared to say anything." },
          { id: newId("beat"), text: "An old argument resurfaces — why Jess really left, and what Mara never forgave her for." },
        ],
      },
      {
        id: newId("actg"),
        actLabel: "Act 3",
        beats: [
          { id: newId("beat"), text: "Mara decides to open the letter in front of Jess instead of alone." },
          { id: newId("beat"), text: "Whatever it says, neither of them can pretend anymore — the film ends before we see the contents, just their reaction." },
        ],
      },
    ],
    acts: [
      {
        id: act1,
        title: "Act 1",
        scenes: [
          {
            id: scene1,
            heading: "INT. MARA'S REPAIR SHOP - NIGHT",
            action:
              "Fluorescent light hums over a workbench cluttered with tools. JESS pushes through the door, out of breath, a courier bag slung across her chest.",
            dialogue: [
              { character: "MARA", line: "We're closed." },
              {
                character: "JESS",
                line: "You're never closed. Not for me, anyway.",
              },
            ],
          },
        ],
      },
    ],
  };
}

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not load saved script, starting fresh.", e);
  }
  return seedState();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Could not save script.", e);
  }
}

/* ---------- lookups ---------- */
function findScene(sceneId) {
  for (const act of state.acts) {
    const scene = act.scenes.find((s) => s.id === sceneId);
    if (scene) return { act, scene };
  }
  return null;
}
function findAct(actId) {
  return state.acts.find((a) => a.id === actId) || null;
}
function findCharacter(characterId) {
  return state.characters.find((c) => c.id === characterId) || null;
}

/* =========================================================
   RENDERING
   ========================================================= */

let activeSceneId = null;

function render() {
  renderPremisePanel();
  renderOutlineList();
  renderActList();
  renderCharacterList();
  renderIdeaList();
  renderScriptPage();
  document.getElementById("tool-count").textContent = registeredToolCount;
}

function renderPremisePanel() {
  const container = document.getElementById("premise-panel");
  if (!container) return;
  const p = state.premise || {};
  container.innerHTML = `
    <div class="premise-title">${escapeHtml(p.title || "Untitled story")}</div>
    <div class="premise-row"><span class="premise-label">Logline</span>${escapeHtml(p.logline || "—")}</div>
    <div class="premise-row"><span class="premise-label">Theme</span>${escapeHtml(p.theme || "—")}</div>
    <div class="premise-row"><span class="premise-label">Genre</span>${escapeHtml(p.genre || "—")}</div>
    <div class="premise-row"><span class="premise-label">Tone</span>${escapeHtml(p.tone || "—")}</div>
  `;
}

function renderOutlineList() {
  const container = document.getElementById("outline-list");
  if (!container) return;
  container.innerHTML = "";
  if (!state.outline || state.outline.length === 0) {
    container.innerHTML =
      '<p class="hint">No outline yet. Click "Import" to paste your outline, organized by act.</p>';
    return;
  }

  state.outline.forEach((group) => {
    const groupBlock = document.createElement("div");
    groupBlock.className = "outline-group";

    const groupTitle = document.createElement("div");
    groupTitle.className = "outline-group-title";
    groupTitle.textContent = group.actLabel;
    groupBlock.appendChild(groupTitle);

    group.beats.forEach((beat) => {
      const item = document.createElement("div");
      item.className = "outline-item";

      const text = document.createElement("span");
      text.className = "outline-text";
      text.textContent = beat.text;
      item.appendChild(text);

      const actions = document.createElement("span");
      actions.className = "scene-actions";

      const upBtn = document.createElement("button");
      upBtn.className = "icon-btn";
      upBtn.textContent = "↑";
      upBtn.title = "Move earlier within this act";
      upBtn.onclick = () => {
        moveOutlineBeat(beat.id, -1);
        render();
      };

      const downBtn = document.createElement("button");
      downBtn.className = "icon-btn";
      downBtn.textContent = "↓";
      downBtn.title = "Move later within this act";
      downBtn.onclick = () => {
        moveOutlineBeat(beat.id, 1);
        render();
      };

      const delBtn = document.createElement("button");
      delBtn.className = "icon-btn";
      delBtn.textContent = "✕";
      delBtn.title = "Delete beat";
      delBtn.onclick = () => {
        deleteOutlineBeat(beat.id);
        render();
      };

      actions.appendChild(upBtn);
      actions.appendChild(downBtn);
      actions.appendChild(delBtn);
      item.appendChild(actions);

      groupBlock.appendChild(item);
    });

    container.appendChild(groupBlock);
  });
}

function renderActList() {
  const container = document.getElementById("act-list");
  container.innerHTML = "";

  if (state.acts.length === 0) {
    container.innerHTML = '<p class="hint">No acts yet. Add one to start writing.</p>';
    return;
  }

  if (!activeSceneId && state.acts[0].scenes[0]) {
    activeSceneId = state.acts[0].scenes[0].id;
  }

  state.acts.forEach((act) => {
    const block = document.createElement("div");
    block.className = "act-block";

    const titleRow = document.createElement("div");
    titleRow.className = "act-title-row";
    const titleSpan = document.createElement("span");
    titleSpan.textContent = act.title;
    const addSceneBtn = document.createElement("button");
    addSceneBtn.className = "icon-btn";
    addSceneBtn.title = "Add scene to " + act.title;
    addSceneBtn.textContent = "+";
    addSceneBtn.onclick = () => openSceneModal({ actId: act.id });
    titleRow.appendChild(titleSpan);
    titleRow.appendChild(addSceneBtn);
    block.appendChild(titleRow);

    act.scenes.forEach((scene) => {
      const item = document.createElement("div");
      item.className = "scene-item" + (scene.id === activeSceneId ? " active" : "");
      item.onclick = () => {
        activeSceneId = scene.id;
        render();
      };

      const label = document.createElement("span");
      label.className = "scene-label";
      label.textContent = scene.heading || "(untitled scene)";
      item.appendChild(label);

      const actions = document.createElement("span");
      actions.className = "scene-actions";

      const upBtn = document.createElement("button");
      upBtn.className = "icon-btn";
      upBtn.textContent = "↑";
      upBtn.title = "Move earlier";
      upBtn.onclick = (e) => {
        e.stopPropagation();
        moveScene(scene.id, -1);
      };

      const downBtn = document.createElement("button");
      downBtn.className = "icon-btn";
      downBtn.textContent = "↓";
      downBtn.title = "Move later";
      downBtn.onclick = (e) => {
        e.stopPropagation();
        moveScene(scene.id, 1);
      };

      const delBtn = document.createElement("button");
      delBtn.className = "icon-btn";
      delBtn.textContent = "✕";
      delBtn.title = "Delete scene";
      delBtn.onclick = (e) => {
        e.stopPropagation();
        deleteScene(scene.id);
      };

      actions.appendChild(upBtn);
      actions.appendChild(downBtn);
      actions.appendChild(delBtn);
      item.appendChild(actions);

      block.appendChild(item);
    });

    container.appendChild(block);
  });
}

function renderCharacterList() {
  const container = document.getElementById("character-list");
  container.innerHTML = "";
  if (state.characters.length === 0) {
    container.innerHTML = '<p class="hint">No characters yet.</p>';
    return;
  }
  state.characters.forEach((c) => {
    const card = document.createElement("div");
    card.className = "character-card";
    card.onclick = () => openCharacterModal(c.id);
    card.innerHTML = `
      <div class="character-name">${escapeHtml(c.name)}</div>
      <div class="character-desc">${escapeHtml(c.description || "")}</div>
    `;
    container.appendChild(card);
  });
}

function renderIdeaList() {
  const container = document.getElementById("idea-list");
  container.innerHTML = "";
  if (state.ideas.length === 0) {
    container.innerHTML = '<p class="hint">No ideas yet.</p>';
    return;
  }
  state.ideas.forEach((idea) => {
    const item = document.createElement("div");
    item.className = "idea-item";
    item.textContent = idea.text;
    container.appendChild(item);
  });
}

function renderScriptPage() {
  const page = document.getElementById("script-page");
  page.innerHTML = "";

  const found = activeSceneId ? findScene(activeSceneId) : null;

  if (!found) {
    page.innerHTML =
      '<div class="empty-state">Pick a scene on the left, or ask your agent to write one for you.</div>';
    return;
  }

  const { scene } = found;
  const block = document.createElement("div");
  block.className = "scene-block";

  const heading = document.createElement("div");
  heading.className = "scene-heading scene-editable";
  heading.contentEditable = "true";
  heading.textContent = scene.heading || "";
  heading.addEventListener("blur", () => {
    scene.heading = heading.textContent.trim();
    saveState();
    renderActList();
  });
  block.appendChild(heading);

  const action = document.createElement("div");
  action.className = "scene-action scene-editable";
  action.contentEditable = "true";
  action.textContent = scene.action || "";
  action.addEventListener("blur", () => {
    scene.action = action.textContent;
    saveState();
  });
  block.appendChild(action);

  (scene.dialogue || []).forEach((line, idx) => {
    const dBlock = document.createElement("div");
    dBlock.className = "dialogue-block";

    const cue = document.createElement("div");
    cue.className = "character-cue scene-editable";
    cue.contentEditable = "true";
    cue.textContent = line.character || "";
    cue.addEventListener("blur", () => {
      line.character = cue.textContent.trim();
      saveState();
    });

    const text = document.createElement("div");
    text.className = "dialogue-line scene-editable";
    text.contentEditable = "true";
    text.textContent = line.line || "";
    text.addEventListener("blur", () => {
      line.line = text.textContent;
      saveState();
    });

    dBlock.appendChild(cue);
    dBlock.appendChild(text);
    block.appendChild(dBlock);
  });

  page.appendChild(block);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* =========================================================
   MUTATIONS (shared by UI buttons AND WebMCP tools)
   ========================================================= */

function addAct(title) {
  const act = { id: newId("act"), title: title || "New Act", scenes: [] };
  state.acts.push(act);
  saveState();
  return act;
}

function addScene({ actId, heading, action, dialogue, position }) {
  const act = findAct(actId) || state.acts[0];
  if (!act) throw new Error("No act to add the scene to. Add an act first.");
  const scene = {
    id: newId("scene"),
    heading: heading || "INT. LOCATION - DAY",
    action: action || "",
    dialogue: Array.isArray(dialogue) ? dialogue : [],
  };
  const pos =
    typeof position === "number" && position >= 0 && position <= act.scenes.length
      ? position
      : act.scenes.length;
  act.scenes.splice(pos, 0, scene);
  activeSceneId = scene.id;
  saveState();
  return scene;
}

function editScene({ sceneId, heading, action, dialogue }) {
  const found = findScene(sceneId);
  if (!found) throw new Error("No scene found with id " + sceneId);
  const { scene } = found;
  if (typeof heading === "string") scene.heading = heading;
  if (typeof action === "string") scene.action = action;
  if (Array.isArray(dialogue)) scene.dialogue = dialogue;
  saveState();
  return scene;
}

function deleteScene(sceneId) {
  for (const act of state.acts) {
    const idx = act.scenes.findIndex((s) => s.id === sceneId);
    if (idx !== -1) {
      act.scenes.splice(idx, 1);
      if (activeSceneId === sceneId) activeSceneId = null;
      saveState();
      render();
      return true;
    }
  }
  return false;
}

function moveScene(sceneId, direction) {
  for (const act of state.acts) {
    const idx = act.scenes.findIndex((s) => s.id === sceneId);
    if (idx !== -1) {
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= act.scenes.length) return false;
      const [scene] = act.scenes.splice(idx, 1);
      act.scenes.splice(newIdx, 0, scene);
      saveState();
      render();
      return true;
    }
  }
  return false;
}

function reorderScenes({ actId, orderedSceneIds }) {
  const act = findAct(actId);
  if (!act) throw new Error("No act found with id " + actId);
  const byId = {};
  act.scenes.forEach((s) => (byId[s.id] = s));
  const newOrder = orderedSceneIds.map((id) => byId[id]).filter(Boolean);
  // keep any scenes not mentioned, appended at the end, so nothing is silently lost
  const mentioned = new Set(orderedSceneIds);
  act.scenes.forEach((s) => {
    if (!mentioned.has(s.id)) newOrder.push(s);
  });
  act.scenes = newOrder;
  saveState();
  return act.scenes;
}

function addCharacter({ name, description, traits }) {
  const character = {
    id: newId("char"),
    name: name || "UNNAMED",
    description: description || "",
    traits: traits || "",
  };
  state.characters.push(character);
  saveState();
  return character;
}

function updateCharacter({ characterId, name, description, traits }) {
  const character = findCharacter(characterId);
  if (!character) throw new Error("No character found with id " + characterId);
  if (typeof name === "string") character.name = name;
  if (typeof description === "string") character.description = description;
  if (typeof traits === "string") character.traits = traits;
  saveState();
  return character;
}

function addIdea({ text }) {
  const idea = { id: newId("idea"), text: text || "" };
  state.ideas.push(idea);
  saveState();
  return idea;
}

/* Outline is now a list of act-groups: [{ id, actLabel, beats: [{id, text}] }] */

function findOutlineGroupByLabel(actLabel, createIfMissing) {
  const norm = (s) => (s || "").trim().toLowerCase();
  let group = state.outline.find((g) => norm(g.actLabel) === norm(actLabel));
  if (!group && createIfMissing) {
    group = { id: newId("actg"), actLabel: actLabel || "Act 1", beats: [] };
    state.outline.push(group);
  }
  return group;
}

function findOutlineBeat(beatId) {
  for (const group of state.outline) {
    const beat = group.beats.find((b) => b.id === beatId);
    if (beat) return { group, beat };
  }
  return null;
}

function addOutlineBeat({ actLabel, text, position }) {
  const group = findOutlineGroupByLabel(actLabel || "Act 1", true);
  const beat = { id: newId("beat"), text: text || "" };
  const pos =
    typeof position === "number" && position >= 0 && position <= group.beats.length
      ? position
      : group.beats.length;
  group.beats.splice(pos, 0, beat);
  saveState();
  return beat;
}

function editOutlineBeat({ beatId, text }) {
  const found = findOutlineBeat(beatId);
  if (!found) throw new Error("No outline beat found with id " + beatId);
  if (typeof text === "string") found.beat.text = text;
  saveState();
  return found.beat;
}

function deleteOutlineBeat(beatId) {
  const found = findOutlineBeat(beatId);
  if (!found) return false;
  const idx = found.group.beats.indexOf(found.beat);
  found.group.beats.splice(idx, 1);
  if (found.group.beats.length === 0) {
    const gIdx = state.outline.indexOf(found.group);
    if (gIdx !== -1) state.outline.splice(gIdx, 1);
  }
  saveState();
  return true;
}

function moveOutlineBeat(beatId, direction) {
  const found = findOutlineBeat(beatId);
  if (!found) return false;
  const beats = found.group.beats;
  const idx = beats.indexOf(found.beat);
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= beats.length) return false;
  const [beat] = beats.splice(idx, 1);
  beats.splice(newIdx, 0, beat);
  saveState();
  return true;
}

/* Parse a plain-text outline the user pastes in. Convention:
   a line like "Act 1" (or "Act 1: Setup") starts a new act group;
   every non-empty line under it becomes one beat, until the next
   "Act ..." line. Leading "-", "*", "1." bullets are stripped. */
function parseOutlineText(raw) {
  const lines = (raw || "").split("\n").map((l) => l.trim());
  const actLineRe = /^act\s+\S+/i;
  const groups = [];
  let current = null;

  for (const line of lines) {
    if (!line) continue;
    if (actLineRe.test(line)) {
      current = { id: newId("actg"), actLabel: line.replace(/:\s*$/, ""), beats: [] };
      groups.push(current);
    } else {
      const cleaned = line.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "");
      if (!current) {
        current = { id: newId("actg"), actLabel: "Act 1", beats: [] };
        groups.push(current);
      }
      current.beats.push({ id: newId("beat"), text: cleaned });
    }
  }
  return groups;
}

function importOutlineFromText(raw) {
  const groups = parseOutlineText(raw);
  state.outline = groups;
  saveState();
  return groups;
}

function setOutlineGroups(groups) {
  // Agent-facing: replace the whole outline at once with a structured array
  // of { actLabel, beats: [string, ...] }.
  const normalized = (groups || []).map((g) => ({
    id: newId("actg"),
    actLabel: g.actLabel || "Act",
    beats: (g.beats || []).map((b) => ({
      id: newId("beat"),
      text: typeof b === "string" ? b : b.text || "",
    })),
  }));
  state.outline = normalized;
  saveState();
  return state.outline;
}

function updatePremise({ title, logline, theme, genre, tone }) {
  if (!state.premise) state.premise = {};
  if (typeof title === "string") state.premise.title = title;
  if (typeof logline === "string") state.premise.logline = logline;
  if (typeof theme === "string") state.premise.theme = theme;
  if (typeof genre === "string") state.premise.genre = genre;
  if (typeof tone === "string") state.premise.tone = tone;
  saveState();
  return state.premise;
}

function getFullState() {
  return {
    premise: state.premise,
    outline: state.outline,
    characters: state.characters,
    ideas: state.ideas,
    acts: state.acts,
  };
}

function buildConsistencyPayload() {
  // Flatten every dialogue line with which character supposedly said it,
  // plus the character bible, so the agent (not this script) can reason
  // about contradictions, voice drift, and unestablished characters.
  const knownNames = new Set(state.characters.map((c) => c.name.toUpperCase()));
  const lines = [];
  const unknownSpeakers = new Set();

  state.acts.forEach((act) => {
    act.scenes.forEach((scene) => {
      (scene.dialogue || []).forEach((d) => {
        lines.push({
          act: act.title,
          scene: scene.heading,
          character: d.character,
          line: d.line,
        });
        if (d.character && !knownNames.has(d.character.toUpperCase())) {
          unknownSpeakers.add(d.character);
        }
      });
    });
  });

  return {
    premise: state.premise,
    outline: state.outline,
    characters: state.characters,
    dialogue_lines: lines,
    scenes: state.acts.flatMap((act) =>
      act.scenes.map((s) => ({
        act: act.title,
        heading: s.heading,
        action: s.action,
      }))
    ),
    speakers_missing_a_character_entry: Array.from(unknownSpeakers),
    note:
      "Review this for: character voice consistency, contradictions between a character's established traits and their dialogue/actions, pacing, any speaker with no character entry, whether scenes/dialogue actually serve the story's premise/theme/tone above, AND whether the written scenes are drifting from what the outline says should happen. Report findings, and use edit_scene / update_character / update_premise / update_outline_beat to fix anything you're confident about.",
  };
}

/* =========================================================
   MODALS (simple add/edit forms for the human)
   ========================================================= */

function openModal(html, onMount) {
  const backdrop = document.getElementById("modal-backdrop");
  const modal = document.getElementById("modal");
  modal.innerHTML = html;
  backdrop.classList.remove("hidden");
  if (onMount) onMount(modal);
}
function closeModal() {
  document.getElementById("modal-backdrop").classList.add("hidden");
}
document.getElementById("modal-backdrop").addEventListener("click", (e) => {
  if (e.target.id === "modal-backdrop") closeModal();
});

function openSceneModal({ actId }) {
  openModal(
    `
    <h3>New scene</h3>
    <label>Heading</label>
    <input type="text" id="f-heading" placeholder="INT. LOCATION - DAY" />
    <label>Action</label>
    <textarea id="f-action" placeholder="What happens in the scene..."></textarea>
    <div class="modal-actions">
      <button class="btn" id="f-cancel">Cancel</button>
      <button class="btn primary" id="f-save">Add scene</button>
    </div>
  `,
    (modal) => {
      modal.querySelector("#f-cancel").onclick = closeModal;
      modal.querySelector("#f-save").onclick = () => {
        const heading = modal.querySelector("#f-heading").value.trim();
        const action = modal.querySelector("#f-action").value.trim();
        addScene({ actId, heading, action, dialogue: [] });
        closeModal();
        render();
      };
    }
  );
}

function openCharacterModal(characterId) {
  const existing = characterId ? findCharacter(characterId) : null;
  openModal(
    `
    <h3>${existing ? "Edit character" : "New character"}</h3>
    <label>Name</label>
    <input type="text" id="f-name" value="${existing ? escapeHtml(existing.name) : ""}" />
    <label>Description</label>
    <textarea id="f-desc">${existing ? escapeHtml(existing.description) : ""}</textarea>
    <label>Traits</label>
    <input type="text" id="f-traits" value="${existing ? escapeHtml(existing.traits) : ""}" />
    <div class="modal-actions">
      <button class="btn" id="f-cancel">Cancel</button>
      <button class="btn primary" id="f-save">${existing ? "Save" : "Add character"}</button>
    </div>
  `,
    (modal) => {
      modal.querySelector("#f-cancel").onclick = closeModal;
      modal.querySelector("#f-save").onclick = () => {
        const name = modal.querySelector("#f-name").value.trim();
        const description = modal.querySelector("#f-desc").value.trim();
        const traits = modal.querySelector("#f-traits").value.trim();
        if (existing) {
          updateCharacter({ characterId, name, description, traits });
        } else {
          addCharacter({ name, description, traits });
        }
        closeModal();
        render();
      };
    }
  );
}

function openIdeaModal() {
  openModal(
    `
    <h3>New idea</h3>
    <label>Idea</label>
    <textarea id="f-idea" placeholder="What if..."></textarea>
    <div class="modal-actions">
      <button class="btn" id="f-cancel">Cancel</button>
      <button class="btn primary" id="f-save">Add idea</button>
    </div>
  `,
    (modal) => {
      modal.querySelector("#f-cancel").onclick = closeModal;
      modal.querySelector("#f-save").onclick = () => {
        const text = modal.querySelector("#f-idea").value.trim();
        if (text) addIdea({ text });
        closeModal();
        render();
      };
    }
  );
}

function openPremiseModal() {
  const p = state.premise || {};
  openModal(
    `
    <h3>Story Bible</h3>
    <label>Title</label>
    <input type="text" id="f-title" value="${escapeHtml(p.title || "")}" />
    <label>Logline</label>
    <textarea id="f-logline">${escapeHtml(p.logline || "")}</textarea>
    <label>Theme</label>
    <textarea id="f-theme">${escapeHtml(p.theme || "")}</textarea>
    <label>Genre</label>
    <input type="text" id="f-genre" value="${escapeHtml(p.genre || "")}" />
    <label>Tone</label>
    <input type="text" id="f-tone" value="${escapeHtml(p.tone || "")}" />
    <div class="modal-actions">
      <button class="btn" id="f-cancel">Cancel</button>
      <button class="btn primary" id="f-save">Save</button>
    </div>
  `,
    (modal) => {
      modal.querySelector("#f-cancel").onclick = closeModal;
      modal.querySelector("#f-save").onclick = () => {
        updatePremise({
          title: modal.querySelector("#f-title").value.trim(),
          logline: modal.querySelector("#f-logline").value.trim(),
          theme: modal.querySelector("#f-theme").value.trim(),
          genre: modal.querySelector("#f-genre").value.trim(),
          tone: modal.querySelector("#f-tone").value.trim(),
        });
        closeModal();
        render();
      };
    }
  );
}

function openOutlineModal() {
  const lastActLabel = state.outline.length ? state.outline[state.outline.length - 1].actLabel : "Act 1";
  openModal(
    `
    <h3>New outline beat</h3>
    <label>Act</label>
    <input type="text" id="f-act" value="${escapeHtml(lastActLabel)}" placeholder="Act 1" />
    <label>Beat</label>
    <textarea id="f-beat" placeholder="What happens in this beat..."></textarea>
    <div class="modal-actions">
      <button class="btn" id="f-cancel">Cancel</button>
      <button class="btn primary" id="f-save">Add beat</button>
    </div>
  `,
    (modal) => {
      modal.querySelector("#f-cancel").onclick = closeModal;
      modal.querySelector("#f-save").onclick = () => {
        const actLabel = modal.querySelector("#f-act").value.trim() || "Act 1";
        const text = modal.querySelector("#f-beat").value.trim();
        if (text) addOutlineBeat({ actLabel, text });
        closeModal();
        render();
      };
    }
  );
}

function openImportOutlineModal() {
  const existingText = (state.outline || [])
    .map((g) => g.actLabel + "\n" + g.beats.map((b) => "- " + b.text).join("\n"))
    .join("\n\n");
  openModal(
    `
    <h3>Import your outline</h3>
    <p class="hint">
      Paste your outline below. Start each act on its own line (e.g. <em>"Act 1"</em>), then list its
      beats underneath, one per line. This <strong>replaces</strong> the current outline.
    </p>
    <label>Outline text</label>
    <textarea id="f-outline" style="min-height: 220px;">${escapeHtml(existingText)}</textarea>
    <div class="modal-actions">
      <button class="btn" id="f-cancel">Cancel</button>
      <button class="btn primary" id="f-save">Replace outline</button>
    </div>
  `,
    (modal) => {
      modal.querySelector("#f-cancel").onclick = closeModal;
      modal.querySelector("#f-save").onclick = () => {
        const raw = modal.querySelector("#f-outline").value;
        importOutlineFromText(raw);
        closeModal();
        render();
      };
    }
  );
}

function openActModal() {
  openModal(
    `
    <h3>New act</h3>
    <label>Title</label>
    <input type="text" id="f-title" placeholder="Act 2" />
    <div class="modal-actions">
      <button class="btn" id="f-cancel">Cancel</button>
      <button class="btn primary" id="f-save">Add act</button>
    </div>
  `,
    (modal) => {
      modal.querySelector("#f-cancel").onclick = closeModal;
      modal.querySelector("#f-save").onclick = () => {
        const title = modal.querySelector("#f-title").value.trim();
        addAct(title);
        closeModal();
        render();
      };
    }
  );
}

/* ---------- toolbar buttons ---------- */
document.getElementById("edit-premise-btn").addEventListener("click", openPremiseModal);
document.getElementById("add-beat-btn").addEventListener("click", openOutlineModal);
document.getElementById("import-outline-btn").addEventListener("click", openImportOutlineModal);
document.getElementById("reset-btn").addEventListener("click", () => {
  const ok = window.confirm(
    "Reset CoWriter to the sample script? This clears everything currently on the page (scenes, characters, ideas)."
  );
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  state = seedState();
  activeSceneId = null;
  saveState();
  render();
});
document.getElementById("add-act-btn").addEventListener("click", openActModal);
document.getElementById("add-character-btn").addEventListener("click", () => openCharacterModal(null));
document.getElementById("add-idea-btn").addEventListener("click", openIdeaModal);
document.getElementById("run-consistency-btn").addEventListener("click", () => {
  const reportEl = document.getElementById("consistency-report");
  reportEl.innerHTML =
    '<div class="flag">This check runs through your agent\'s reasoning, not this page alone. In chat, ask: "check the script for consistency" — the agent will read every scene and character and report back here-ish (in chat) with anything worth fixing.</div>';
});

/* =========================================================
   WEBMCP TOOL REGISTRATION
   ========================================================= */

let registeredToolCount = 0;

async function registerWebMcpTools() {
  const statusEl = document.getElementById("tool-status");

  if (!("modelContext" in document) || !document.modelContext) {
    statusEl.textContent = "No agent tools detected (open in ChatGPT's browser or Chrome with WebMCP on)";
    statusEl.classList.add("absent");
    return;
  }

  const mc = document.modelContext;

  const tools = [
    {
      name: "get_script",
      description:
        "ALWAYS call this FIRST, before any other tool, no matter what the user is asking for. It reads the entire current script: the story premise (title, logline, theme, genre, tone), the human-authored outline (the story's real, act-by-act throughline — e.g. Act 1 with its beats, Act 2 with its beats, etc. — including beats not written as scenes yet), all acts and their actually-written scenes (heading, action, dialogue), the full character list, and the idea board. Every scene you write, every edit you make, and every consistency check must be grounded in this outline and premise — they are the source of truth for where the story is headed, not just whatever scene happens to be open. The outline is the plan; the scenes are what's actually been written; they won't always be in sync yet.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: async () => {
        return { content: [{ type: "text", text: JSON.stringify(getFullState(), null, 2) }] };
      },
    },
    {
      name: "update_premise",
      description:
        "Revise the story's premise: title, logline, theme, genre, and/or tone. Use this if the direction of the story shifts, so future writing (by you or the human) stays grounded in the current premise. Only the fields you provide are changed.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          logline: { type: "string", description: "One or two sentences summarizing the story." },
          theme: { type: "string", description: "The underlying idea/message the story is about." },
          genre: { type: "string" },
          tone: { type: "string" },
        },
        additionalProperties: false,
      },
      execute: async (args) => {
        updatePremise(args);
        render();
        return { content: [{ type: "text", text: "Premise updated." }] };
      },
    },
    {
      name: "add_outline_beat",
      description:
        "Add a new beat to a named act in the story outline — the human-authored, act-by-act throughline of the whole story, independent of which scenes have actually been written yet. Use this to plan ahead or record a structural decision. If the act doesn't exist yet in the outline, it's created.",
      inputSchema: {
        type: "object",
        properties: {
          actLabel: { type: "string", description: "Which act this beat belongs to, e.g. \"Act 2\"." },
          text: { type: "string", description: "A single beat, e.g. \"Mara realizes the letter is addressed to her.\"" },
          position: { type: "integer", description: "Optional 0-based index within that act to insert at. Defaults to the end." },
        },
        required: ["actLabel", "text"],
        additionalProperties: false,
      },
      execute: async (args) => {
        addOutlineBeat(args);
        render();
        return { content: [{ type: "text", text: "Outline beat added." }] };
      },
    },
    {
      name: "update_outline_beat",
      description: "Rewrite an existing outline beat's text.",
      inputSchema: {
        type: "object",
        properties: {
          beatId: { type: "string", description: "The id of the beat to update (from get_script)." },
          text: { type: "string" },
        },
        required: ["beatId", "text"],
        additionalProperties: false,
      },
      execute: async (args) => {
        editOutlineBeat(args);
        render();
        return { content: [{ type: "text", text: "Outline beat updated." }] };
      },
    },
    {
      name: "set_outline",
      description:
        "Replace the entire outline at once with a full act-by-act structure. Use this only when asked to import, restructure, or rewrite the whole outline — for a single change, prefer add_outline_beat / update_outline_beat instead.",
      inputSchema: {
        type: "object",
        properties: {
          groups: {
            type: "array",
            description: "Ordered list of acts, each with its ordered beats.",
            items: {
              type: "object",
              properties: {
                actLabel: { type: "string" },
                beats: { type: "array", items: { type: "string" } },
              },
              required: ["actLabel", "beats"],
            },
          },
        },
        required: ["groups"],
        additionalProperties: false,
      },
      execute: async (args) => {
        setOutlineGroups(args.groups);
        render();
        return { content: [{ type: "text", text: "Outline replaced." }] };
      },
    },
    {
      name: "add_scene",
      description:
        "Add a brand-new scene to a given act of the script. The new scene appears live on the user's screen immediately.",
      inputSchema: {
        type: "object",
        properties: {
          actId: { type: "string", description: "The id of the act to add the scene to (from get_script)." },
          heading: { type: "string", description: 'Scene heading, e.g. "INT. KITCHEN - NIGHT".' },
          action: { type: "string", description: "Action / description text for the scene." },
          dialogue: {
            type: "array",
            description: "Ordered list of dialogue lines.",
            items: {
              type: "object",
              properties: {
                character: { type: "string" },
                line: { type: "string" },
              },
              required: ["character", "line"],
            },
          },
          position: {
            type: "integer",
            description: "Optional 0-based index to insert the scene at within the act. Defaults to the end.",
          },
        },
        required: ["actId", "heading"],
        additionalProperties: false,
      },
      execute: async (args) => {
        const scene = addScene(args);
        render();
        return { content: [{ type: "text", text: `Added scene "${scene.heading}" (id: ${scene.id}).` }] };
      },
    },
    {
      name: "edit_scene",
      description:
        "Rewrite or tweak an existing scene's heading, action text, and/or dialogue. Only the fields you provide are changed; everything else is left as-is.",
      inputSchema: {
        type: "object",
        properties: {
          sceneId: { type: "string", description: "The id of the scene to edit (from get_script)." },
          heading: { type: "string" },
          action: { type: "string" },
          dialogue: {
            type: "array",
            items: {
              type: "object",
              properties: { character: { type: "string" }, line: { type: "string" } },
              required: ["character", "line"],
            },
          },
        },
        required: ["sceneId"],
        additionalProperties: false,
      },
      execute: async (args) => {
        const scene = editScene(args);
        render();
        return { content: [{ type: "text", text: `Updated scene "${scene.heading}".` }] };
      },
    },
    {
      name: "reorder_scenes",
      description: "Reorder the scenes within one act by supplying the full desired order of scene ids.",
      inputSchema: {
        type: "object",
        properties: {
          actId: { type: "string", description: "The act whose scenes should be reordered." },
          orderedSceneIds: {
            type: "array",
            items: { type: "string" },
            description: "Scene ids in the new desired order.",
          },
        },
        required: ["actId", "orderedSceneIds"],
        additionalProperties: false,
      },
      execute: async (args) => {
        reorderScenes(args);
        render();
        return { content: [{ type: "text", text: "Scenes reordered." }] };
      },
    },
    {
      name: "add_character",
      description: "Add a new character to the story bible (name, one-line description, key traits).",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          traits: { type: "string", description: "Comma-separated key personality traits." },
        },
        required: ["name"],
        additionalProperties: false,
      },
      execute: async (args) => {
        const character = addCharacter(args);
        render();
        return { content: [{ type: "text", text: `Added character ${character.name} (id: ${character.id}).` }] };
      },
    },
    {
      name: "update_character",
      description: "Revise an existing character's description or traits.",
      inputSchema: {
        type: "object",
        properties: {
          characterId: { type: "string", description: "The id of the character to update (from get_script)." },
          name: { type: "string" },
          description: { type: "string" },
          traits: { type: "string" },
        },
        required: ["characterId"],
        additionalProperties: false,
      },
      execute: async (args) => {
        const character = updateCharacter(args);
        render();
        return { content: [{ type: "text", text: `Updated character ${character.name}.` }] };
      },
    },
    {
      name: "add_idea",
      description:
        "Drop a loose plot idea, a 'what if', or a direction the story could go onto the shared idea board — without committing it to the script yet.",
      inputSchema: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
        additionalProperties: false,
      },
      execute: async (args) => {
        addIdea(args);
        render();
        return { content: [{ type: "text", text: "Idea added to the board." }] };
      },
    },
    {
      name: "check_consistency",
      description:
        "Get every dialogue line in the script annotated with its speaker, plus the full character bible, formatted specifically for reviewing consistency. Use this to find things like: a character's dialogue contradicting their established traits, a speaker who has no character entry, or pacing/repetition issues across scenes. This tool returns data for you to analyze — after finding issues, report them to the user and optionally fix them with edit_scene / update_character.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: async () => {
        return { content: [{ type: "text", text: JSON.stringify(buildConsistencyPayload(), null, 2) }] };
      },
    },
  ];

  for (const tool of tools) {
    try {
      await mc.registerTool(tool);
      registeredToolCount++;
    } catch (e) {
      console.error("Failed to register tool", tool.name, e);
    }
  }

  statusEl.textContent = `${registeredToolCount} agent tools ready`;
  statusEl.classList.add("ready");
  document.getElementById("tool-count").textContent = registeredToolCount;
}

/* =========================================================
   INIT
   ========================================================= */
render();
registerWebMcpTools();