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
  renderActList();
  renderCharacterList();
  renderIdeaList();
  renderScriptPage();
  document.getElementById("tool-count").textContent = registeredToolCount;
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

function getFullState() {
  return {
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
      "Review this for character voice consistency, contradictions between a character's established traits and their dialogue/actions, pacing, and any speaker with no character entry. Report findings, and use edit_scene / update_character to fix anything you're confident about.",
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
        "Read the entire current script: all acts and their scenes (heading, action, dialogue), the full character list, and the idea board. Call this first before writing or editing anything, so you know what already exists.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: async () => {
        return { content: [{ type: "text", text: JSON.stringify(getFullState(), null, 2) }] };
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
