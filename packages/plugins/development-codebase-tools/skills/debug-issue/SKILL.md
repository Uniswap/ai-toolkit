---
name: debug-issue
description: >-
  Systematic debugging workflow for any code error, crash, test failure, or unexpected behavior. Use this
  skill whenever a user mentions an error, bug, exception, crash, test failure, or says something "isn't working",
  "is broken", "keeps failing", or "isn't behaving as expected" — even if they haven't used the word "debug".
  Also trigger when the user pastes a stack trace, error message, or unexpected output and asks why. Don't wait
  for the user to say "debug"; if they're describing a problem with running code, this skill applies. Trigger
  phrases include: "getting an error", "this crashes", "why is this failing", "help me fix this", "it broke",
  "not working", "exception thrown", "stack trace", "test is failing", "something is wrong with".
allowed-tools: >-
  Read, Glob, Grep, Edit, Write, Bash(git log:*), Bash(git diff:*), Bash(git blame:*), Bash(git status:*),
  Task(subagent_type:debug-assistant-agent)
model: opus
---

# Debug Issue

Diagnose and fix any code problem — from vague symptoms to full stack traces — using a structured
investigation workflow backed by the `debug-assistant-agent`.

The skill accepts any form of bug report: a raw error message, a test failure output, a symptom
description ("the app freezes when I click save"), or a combination. Its job is to gather the right
context and translate that rough report into a root cause and a concrete fix.

## When to Activate

- User pastes an error message, exception, or stack trace
- A test is failing and the reason isn't obvious
- Something works locally but fails in CI or production
- Unexpected output that doesn't match what the code should do
- User says "this broke after my last change" — or doesn't know what changed

## Step 1: Capture the Problem

Before looking at any files, nail down what you're actually dealing with:

- **Symptoms** — what goes wrong? Extract the exact error type and message if there is one.
- **Trigger** — when does it fail? (always, sometimes, only after a specific action, only in prod)
- **Stack trace** — if present, read it carefully: the first project-owned frame (not a library frame)
  is the origin point and your starting location.

If the user gave vague symptoms only ("it just crashes"), ask one targeted clarifying question before
continuing — something like "do you have the error message or a stack trace?" But keep the interaction
short; once you have enough to locate the origin, move forward.

## Step 2: Locate the Origin

With the origin file and line in hand, read the code around the failure. The goal here is not to read
every related file — it's to form a working hypothesis fast.

- Read the relevant function or module: 10–20 lines around the error site give more useful context
  than the single failing line.
- Check whether this code changed recently (`git log -10 --oneline <file>` and `git diff HEAD~3 -- <file>`)
- Look for obvious candidates: null dereferences, incorrect assumptions about async ordering,
  missing env vars, changed interface contracts, off-by-one conditions.

Write your working hypothesis before moving to Step 3 — for example, "I believe this fails because
`userId` is undefined when `getUser()` is called on logout." A stated hypothesis keeps the
investigation from drifting into unfocused file-reading.

## Step 3: Gather Supporting Context

With a hypothesis in hand, collect the evidence that confirms or refutes it. Aim for depth over
breadth — three closely related files read carefully beat ten files skimmed.

Gather what the `debug-assistant-agent` needs:

| Piece                      | Where to find it                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| Full error and stack trace | User input, test output, or CI logs                                                      |
| Failing code               | Read the origin file; note surrounding functions if they're part of the call chain       |
| Recent changes             | `git log --oneline -5` on package.json, go.mod, requirements.txt, or the affected module |
| Config / env               | Check relevant .env files, config objects, or framework setup near the failure           |
| Logs                       | logs/ directory, stdout captures, or ask the user                                        |

If the evidence already strongly supports your hypothesis, you can delegate immediately. There's no
value in gathering everything available if you already understand the problem.

## Step 4: Analyze with debug-assistant-agent

Invoke the `debug-assistant-agent` with the structured context. Format your prompt to the agent as:

```
error: <exact error message and type, or "no explicit error — symptom: ...">
logs: <relevant log output, or "not available">
context: <the failing code and any related code you read — include file path and function name>
history: <recent git changes to this area, or "no recent changes">
environment: <runtime/framework/version info, or "standard dev environment">
```

The agent returns ranked root-cause hypotheses (with confidence scores), an error pattern
classification, a three-phase fix plan (immediate change → validation → deployment), and concrete
code patches.

Pick the highest-confidence hypothesis and fix plan. If two hypotheses are close in confidence,
note both and proceed with the more likely one — you can revisit if the first fix doesn't hold.

## Step 5: Apply and Validate

Apply the agent's recommended fix, then confirm it works:

1. Make the code changes the agent recommended (Edit/Write the affected files).
2. Run the relevant test or reproduce the original trigger.
3. If the error is gone, summarize for the user:
   - Root cause in plain language
   - What was changed and why it fixes the problem
   - Any follow-up to consider (adding a regression test, updating docs, monitoring a metric)
4. If the error persists or a different error appears, treat the new state as updated input and
   return to Step 2. What failed is useful information about where the real root cause lies.

## Staying on Track

Debugging can drift into exploration. Two guardrails that keep it productive:

- **One hypothesis at a time.** Pick the most likely cause, apply the fix, verify. Only move to
  the next hypothesis if verification fails. Trying to fix multiple hypotheses simultaneously
  muddies the signal.
- **Distinguish code bugs from environment issues.** If the root cause is a missing env variable,
  wrong Node/Python version, corrupted cache, or a service that's down — say so clearly. The fix
  is outside the code and applying a code patch won't help.
