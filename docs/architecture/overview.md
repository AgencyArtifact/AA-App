# Architecture overview

SOP. Version 1.0, 2026-10-13. Changed only through a stage Blueprint, under the golden rule (SOP first, then code).

## Layers

| Layer | Contains | Reads from | Must never |
|---|---|---|---|
| 1. Data | SharePoint lists on `AA Operations` and `AA Principals`; the Graph access module in `src/` | SharePoint, as the signed-in user | Decide access in code |
| 2. Calculation | Chris's logic, real margin, planned versus actual | Data interface only | Use a language model; reinterpret Chris's logic |
| 3. Views | Screens by role, charts, weekly brief, Excel exports | Calculation interface only (see open questions for writes) | Compute figures of its own |
| 4. AI and agents (future) | Summaries, rankings, proposals | Calculated outputs only | Write or alter a figure |

## What every interface spec contains

An interface is defined in the SOP of the layer that provides it, before any code that uses it.

- Name and providing layer.
- Shape: TypeScript types for every input and output. For data interfaces, the list columns and their SharePoint types.
- Units and time zone of every field.
- Access: which roles can use it, and how the data layer enforces that.
- Freshness: how the caller knows how current the result is.
- Errors: every failure the caller must handle, and how it becomes visible to the user.
- Version, and what changed from the previous version.

## Defined interfaces

None yet. The first interfaces are defined in the Blueprint gate of the stage that introduces the project register and the live timecard.

## Open questions (for that Blueprint)

- Raw writes (hours, task completions, unplanned work) originate in views. Either they pass through a calculation-layer interface, or the data layer exposes a write interface that views use directly. The four-layer rule says each layer talks only to the one below, so this needs an explicit decision by Galileo.
- Where calculation runs (in the app, in flows, or elsewhere) is not decided.
