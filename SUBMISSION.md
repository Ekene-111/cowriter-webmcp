# Devpost submission text (draft — paste into the submission form)

## Project name
CoWriter

## Tagline / one-liner
A screenplay you write together with your agent — live, on the same page.

## Description

Co-writing with an AI today usually means pasting your script into a chat window, getting a wall of text back, and copy-pasting it into your real document — losing formatting and context every round trip. CoWriter removes that entirely.

CoWriter is a small screenwriting tool: acts, scenes in real screenplay format (sluglines, action, character cues, dialogue), a character bible, and a loose idea board. Every action on that script — adding a scene, editing a line, revising a character, dropping an idea, reordering scenes, checking the whole thing for consistency — is exposed as a WebMCP tool (`document.modelContext.registerTool`). The agent isn't clicking around a UI it has to guess at; it's calling the exact same functions the interface calls, and the result shows up on your screen instantly, on the same live document you can keep editing by hand at any moment.

**What this makes possible that wasn't easy before:**

You can ask, in plain language, "write a tense scene where she finds the letter, no dialogue yet" — the agent calls `add_scene` and it appears, correctly formatted, right in front of you. You read it, say "make her hesitate before opening it," and the agent calls `edit_scene` on that exact scene. The character bible updates the same way as new characters get introduced. And `check_consistency` hands the agent every dialogue line labeled by speaker plus the full character bible in one structured payload, so it can catch things like a character's voice contradicting itself across acts — the kind of full-document consistency pass that's genuinely tedious for a human to do by re-reading, but natural for an agent to do well.

Nothing about the human side of the app changes because an agent is present — you can type directly into any line at any time, exactly like a normal document. That's the point: one shared script, two collaborators, no export/import step between them.

**Implementation:** plain HTML/CSS/vanilla JS, no framework or backend. All 8 tools are registered in a single readable file so the WebMCP integration itself is easy to inspect. Data persists to the browser's local storage.

## Built With
webmcp, javascript, html5, css3

## Try it out
- Live app: <PASTE YOUR GITHUB PAGES URL HERE>
- Source code: <PASTE YOUR GITHUB REPO URL HERE>
