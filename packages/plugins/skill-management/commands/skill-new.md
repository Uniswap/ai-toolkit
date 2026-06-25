---
description: Codify the current work into a NEW skill or agent. Drafts name + triggering description + outline, then hands the drafting/eval to the skill-creator skill.
argument-hint: [optional: what the new skill/agent should do]
allowed-tools: Bash(python3:*), Read, Grep, Glob, Agent
---

Run the **skill-doctor** skill in **`create`** mode. Additional guidance from the user (may be empty): $ARGUMENTS

- Go straight to codifying the current work into a new skill or agent: draft a
  `name`, a pushy triggering `description` (per the skill's analysis rubric), and
  a body outline. Decide skill vs agent vs command using the rubric.
- Hand the draft to the **skill-creator** skill to flesh out and (if useful) eval.
- Create only under writable roots: personal config under
  `~/.claude/{skills,agents,commands}`, or a git repo you contribute to (delivered
  as a draft PR off its default branch).
- **Show the draft and confirm before writing files.**
