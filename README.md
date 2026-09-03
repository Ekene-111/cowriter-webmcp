# CoWriter

A screenplay you write **together with an AI agent**, live, in the same browser tab — built for the [OpenAI WebMCP Challenge](https://webmcp.devpost.com/).

CoWriter is a small screenwriting tool: a **Story Bible** (title, logline, theme, genre, tone), a real **Outline** organized act-by-act (paste in your own outline — Act 1 with its beats, Act 2 with its beats, and so on — including acts that don't have any scenes written yet), acts, scenes (in real screenplay format — sluglines, action, character cues, dialogue), a character bible, and a loose "idea board." What makes it a WebMCP app is that every one of those things — revising the premise, importing or editing the outline, adding a scene, editing a line, adding a character, dropping an idea, reordering scenes, and even flagging consistency problems — is exposed as a structured **tool** an AI agent can call directly, using the [WebMCP](https://github.com/webmachinelearning/webmcp) standard (`document.modelContext.registerTool`). The agent isn't guessing its way around buttons — it's calling the exact same functions the UI calls, and its changes show up on your screen instantly, on the same live document you're looking at and can keep editing by hand.

Critically, the agent isn't writing blind: `get_script`'s own description tells it to call this tool **first, before anything else**, and it always returns the human-authored outline and Story Bible up front — so every scene the agent drafts and every consistency check it runs is explicitly grounded in the story's real, act-by-act throughline and theme, not just pattern-matched off whatever scene happens to be on screen. The outline (the plan) and the written scenes (what's actually on the page) are deliberately kept as two distinct things, the way a real writer's outline and draft are — so they can drift and be reconciled on purpose, rather than silently merging into one unreliable source.

## Why WebMCP fits this

Co-writing with an AI today usually means: paste your script into a chat window, get a wall of text back, copy-paste it back into your actual document, and lose all your formatting and structure along the way. CoWriter removes that round-trip entirely. You ask your agent, in plain language, to write a scene, revise a character, or check the whole script for consistency — and it happens directly inside your actual screenplay, formatted correctly, while you keep working on the same page. You can type into any line yourself at any time; nothing about the agent's access changes how you use the app.

## What people and agents can do together here (that wasn't easy before)

- **Draft while you steer.** "Write a tense scene where she finds the letter, no dialogue yet" → the agent calls `add_scene` and it appears, screenplay-formatted, on your page. You read it, don't love the last beat, say "make her hesitate before opening it" → the agent calls `edit_scene` on that exact scene.
- **Keep a living character bible.** The agent can create characters as they're introduced and revise their traits as the story develops, without you leaving the page to update a separate document.
- **Catch inconsistencies a full re-read would take you an hour to catch.** `check_consistency` hands the agent every dialogue line labeled by speaker plus the full character bible, so it can notice things like "MARA is calling Jess by her first name in Act 1 but 'kid' in Act 2 — was that intentional?" — the kind of cross-document consistency check that's tedious for a human to do by hand but natural for an agent.
- **Keep loose ideas from getting lost.** Either of you can drop a "what if" onto the idea board without committing it to the actual script yet.

## The 12 WebMCP tools

| Tool | What it does |
|---|---|
| `get_script` | Read the story premise, the act-by-act outline, and every act, scene, character, and idea currently in the script. Its description tells the agent to call this first, always. |
| `update_premise` | Revise the story's title, logline, theme, genre, or tone. |
| `add_outline_beat` | Add a beat to a named act in the outline (creating the act if it doesn't exist yet). |
| `update_outline_beat` | Rewrite an existing outline beat. |
| `set_outline` | Replace the entire outline at once with a full act-by-act structure. |
| `add_scene` | Insert a new scene (heading, action, dialogue) into an act. |
| `edit_scene` | Rewrite an existing scene's heading, action, and/or dialogue. |
| `reorder_scenes` | Change the order of scenes within an act. |
| `add_character` | Add a new character to the story bible. |
| `update_character` | Revise a character's description or traits. |
| `add_idea` | Drop a loose plot idea onto the shared idea board. |
| `check_consistency` | Get every line annotated by speaker + the character bible + the outline, formatted for the agent to find contradictions, voice drift, unestablished speakers, or scenes drifting from the planned throughline. |

Click **Import** in the Outline panel to paste in your own outline — start each act on its own line (e.g. "Act 1"), then list its beats underneath, one per line. It replaces the current outline and immediately becomes what the agent reads first.

## Running it locally

No build step, no dependencies, no server required.

1. Clone this repo.
2. Open `index.html` directly in a browser, **or** serve the folder with any static file server (e.g. `python3 -m http.server`) and visit it.
3. To actually see the agent tools in action, open the deployed live URL either:
   - inside **ChatGPT's built-in browser** (Codex / ChatGPT Work), which supports WebMCP natively, or
   - in **Google Chrome** with WebMCP enabled via an experimental flag or origin trial.
4. Ask your agent to do something with the script — e.g. *"add a scene where Mara finds out about the letter"* — and watch it appear on the page.

Your script is saved to your browser's local storage as you go, so refreshing the page won't lose your work.

## Tech

Plain HTML, CSS, and vanilla JavaScript. No framework, no build tooling, no backend — the entire app (including all 12 tool definitions) lives in `script.js`. This was a deliberate choice: it keeps the WebMCP tool-registration code easy to read start to finish, with nothing hidden behind a framework's abstractions.

## Roadmap

Ideas for after the challenge deadline, roughly in priority order:

- **Multi-scene consistency diffing** - let check_consistency compare against the previous run's report so an agent can flag only *new* contradictions instead of re-surfacing everything each time.
- **Export** - PDF/Fountain export of the finished screenplay, so a script drafted here can leave the browser in an industry-standard format.
- **Multi-document projects** - support more than one script per browser profile (currently a single script lives in local storage), with a lightweight project switcher.
- **Real persistence** - optional backend/cloud sync so a script isn't tied to one browser's local storage.
- **Scene-level undo** - a visible history/undo stack for agent-made edits, so a human can revert a single dd_scene/edit_scene call without hand-editing the page.
- **Richer character bible** - arcs, relationships between characters, and a "first appearance" pointer the agent can use to catch characters who show up before being introduced.
## License

MIT — see [LICENSE](./LICENSE).
