#!/usr/bin/env python3
"""Cheap inventory of every Claude Code skill / agent / command available on this
machine, plus lightweight quality flags. Stdlib only — no pip installs.

The point is to map a large, sprawling customization surface (hundreds of items
across local dirs + several marketplaces) WITHOUT reading every file into the
model's context. This script extracts just the signal (name, description, size,
path, source, writability, bundled resources) and computes flags, so the model
can reason over a compact map and only deep-read the handful of flagged items.

Outputs:
  <workspace>/inventory.json   full structured data
  <workspace>/inventory.md     compact human/model-readable tables + Flagged section
and prints the workspace path on stdout.

Usage:
  inventory.py [--cwd DIR] [--mine-only] [--workspace DIR]

--mine-only limits the scan to writable (own) sources, for the session/create modes.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import tempfile
from pathlib import Path

HOME = Path(os.path.expanduser("~"))

# Locations the skill is allowed to EDIT. Everything else is read-only (mapped,
# never modified). Keep this list in sync with SKILL.md's "editable targets".
# Skill/agent/command files inside a git repo are also editable, but only via a
# draft PR — they are not enumerated here because the writable repos vary per user
# and per machine; the skill resolves those at PR time.
WRITABLE_ROOTS = [
    HOME / ".claude" / "skills",
    HOME / ".claude" / "agents",
    HOME / ".claude" / "commands",
]

# Descriptions shorter than this (in words) are flagged as weak/missing.
MIN_DESCRIPTION_WORDS = 15
# Bodies longer than this are flagged as oversized (skill-creator's <500 guidance).
MAX_BODY_LINES = 500
# Description Jaccard >= this (on word sets) flags a near-duplicate pair.
NEAR_DUP_THRESHOLD = 0.6
# Phrases that indicate a description tells the model WHEN to trigger.
TRIGGER_HINTS = ("use when", "use this", "trigger", "when the user", "when you",
                 "invokes", "says", "/")


def is_writable(path: Path) -> bool:
    rp = path.resolve()
    for root in WRITABLE_ROOTS:
        try:
            rp.relative_to(root.resolve())
            return True
        except ValueError:
            continue
    return False


def parse_frontmatter(text: str) -> tuple[dict, int]:
    """Return (frontmatter_dict, body_line_count). Tolerant of YAML we don't fully
    parse — we only need `name` and `description`, including folded (>) / multi-line
    scalars and quoted values. No yaml dependency."""
    fm: dict[str, str] = {}
    body = text
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            raw = text[3:end]
            body = text[end + 4:]
            fm = parse_simple_yaml(raw)
    body_lines = body.count("\n") + (1 if body and not body.endswith("\n") else 0)
    return fm, body_lines


def parse_simple_yaml(raw: str) -> dict[str, str]:
    """Minimal top-level key: value parser handling plain, quoted, and block
    scalars (| and >). Sufficient for name/description frontmatter."""
    out: dict[str, str] = {}
    lines = raw.split("\n")
    i = 0
    key_re = re.compile(r"^([A-Za-z0-9_-]+):\s*(.*)$")
    while i < len(lines):
        line = lines[i]
        m = key_re.match(line)
        if not m:
            i += 1
            continue
        key, val = m.group(1), m.group(2).strip()
        if val in (">", "|", ">-", "|-", ">+", "|+"):
            # Block scalar: gather indented continuation lines.
            block: list[str] = []
            i += 1
            while i < len(lines) and (lines[i].startswith((" ", "\t")) or lines[i].strip() == ""):
                block.append(lines[i].strip())
                i += 1
            out[key] = " ".join(s for s in block if s).strip()
            continue
        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
            val = val[1:-1]
        out[key] = val
        i += 1
    return out


def word_set(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def has_trigger_language(desc: str) -> bool:
    low = desc.lower()
    return any(h in low for h in TRIGGER_HINTS)


def bundled_resources(skill_dir: Path) -> list[str]:
    found = []
    for sub in ("scripts", "references", "assets"):
        if (skill_dir / sub).is_dir():
            found.append(sub)
    return found


def make_entry(path: Path, kind: str, source: str) -> dict:
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        text = ""
    fm, body_lines = parse_frontmatter(text)
    name = fm.get("name") or (path.parent.name if kind == "skill" else path.stem)
    desc = fm.get("description", "").strip()
    entry = {
        "name": name,
        "kind": kind,                       # skill | agent | command
        "source": source,                   # logical bucket (see scan())
        "path": str(path),
        "writable": is_writable(path),
        "description": desc,
        "description_words": len(desc.split()),
        "body_lines": body_lines,
        "bundled": bundled_resources(path.parent) if kind == "skill" else [],
    }
    return entry


def scan(cwd: Path, mine_only: bool) -> list[dict]:
    entries: list[dict] = []
    seen_paths: set[str] = set()

    def add(path: Path, kind: str, source: str):
        rp = str(path.resolve())
        if rp in seen_paths:
            return
        seen_paths.add(rp)
        entries.append(make_entry(path, kind, source))

    # --- Own / writable sources -------------------------------------------
    for p in sorted((HOME / ".claude" / "skills").glob("*/SKILL.md")):
        add(p, "skill", "user")
    for p in sorted((HOME / ".claude" / "agents").glob("*.md")):
        add(p, "agent", "user")
    for p in sorted((HOME / ".claude" / "commands").glob("*.md")):
        add(p, "command", "user")

    # Project-local (cwd) config.
    proj = cwd / ".claude"
    if proj.is_dir():
        for p in sorted((proj / "skills").glob("*/SKILL.md")):
            add(p, "skill", "project")
        for p in sorted((proj / "agents").glob("*.md")):
            add(p, "agent", "project")
        for p in sorted((proj / "commands").glob("*.md")):
            add(p, "command", "project")

    if mine_only:
        return entries

    # --- External (read-only) sources -------------------------------------
    plugins = HOME / ".claude" / "plugins"
    for bucket, root in (("marketplace", plugins / "marketplaces"),
                         ("plugin-cache", plugins / "cache")):
        if not root.is_dir():
            continue
        for p in sorted(root.rglob("SKILL.md")):
            add(p, "skill", bucket)
        for p in sorted(root.rglob("agents/*.md")):
            add(p, "agent", bucket)
        for p in sorted(root.rglob("commands/*.md")):
            add(p, "command", bucket)

    return entries


def compute_flags(entries: list[dict]) -> dict:
    flags: dict[str, list] = {
        "duplicate_names": [],
        "near_duplicate_descriptions": [],
        "weak_or_missing_description": [],
        "oversized_body": [],
        "no_trigger_language": [],
    }

    # Duplicate names (same name across >1 entry).
    by_name: dict[str, list[dict]] = {}
    for e in entries:
        by_name.setdefault(e["name"], []).append(e)
    for name, group in sorted(by_name.items()):
        if len(group) > 1:
            sources = {g["source"] for g in group}
            # marketplace<->plugin-cache pairs are just install mirrors of the
            # same upstream item — not an actionable collision. Flag whether the
            # group involves an own/writable copy OR spans genuinely distinct
            # sources (not only the mirror pair), which is the interesting case.
            mirror_only = sources <= {"marketplace", "plugin-cache"}
            flags["duplicate_names"].append(
                {"name": name, "count": len(group),
                 "sources": sorted(sources),
                 "involves_writable": any(g["writable"] for g in group),
                 "mirror_only": mirror_only,
                 "paths": [g["path"] for g in group]})

    # Per-entry quality flags.
    for e in entries:
        if e["description_words"] < MIN_DESCRIPTION_WORDS:
            flags["weak_or_missing_description"].append(
                {"name": e["name"], "kind": e["kind"], "source": e["source"],
                 "words": e["description_words"], "path": e["path"],
                 "writable": e["writable"]})
        if e["body_lines"] > MAX_BODY_LINES:
            flags["oversized_body"].append(
                {"name": e["name"], "kind": e["kind"], "lines": e["body_lines"],
                 "path": e["path"], "writable": e["writable"]})
        if e["description"] and not has_trigger_language(e["description"]):
            flags["no_trigger_language"].append(
                {"name": e["name"], "kind": e["kind"], "source": e["source"],
                 "path": e["path"], "writable": e["writable"]})

    # Near-duplicate descriptions (pairwise within skills+commands; agents too).
    # O(n^2) but n is a few hundred — fine, and only runs once.
    desc_entries = [e for e in entries if e["description_words"] >= 5]
    word_sets = [(e, word_set(e["description"])) for e in desc_entries]
    for i in range(len(word_sets)):
        ei, wi = word_sets[i]
        for j in range(i + 1, len(word_sets)):
            ej, wj = word_sets[j]
            if ei["name"] == ej["name"]:
                continue  # already covered by duplicate_names
            score = jaccard(wi, wj)
            if score >= NEAR_DUP_THRESHOLD:
                flags["near_duplicate_descriptions"].append(
                    {"a": ei["name"], "a_path": ei["path"],
                     "b": ej["name"], "b_path": ej["path"],
                     "similarity": round(score, 2),
                     "either_writable": ei["writable"] or ej["writable"]})

    return flags


def render_markdown(entries: list[dict], flags: dict, cwd: Path, mine_only: bool) -> str:
    out: list[str] = []
    out.append("# Skill / Agent / Command Inventory\n")
    out.append(f"- cwd: `{cwd}`")
    out.append(f"- mine_only: `{mine_only}`")
    out.append(f"- total entries: **{len(entries)}**\n")

    # Counts by source x kind.
    by_source: dict[str, dict[str, int]] = {}
    for e in entries:
        by_source.setdefault(e["source"], {}).setdefault(e["kind"], 0)
        by_source[e["source"]][e["kind"]] += 1
    out.append("## Counts by source\n")
    out.append("| source | skills | agents | commands | writable |")
    out.append("|---|---:|---:|---:|---|")
    for src in sorted(by_source):
        c = by_source[src]
        w = "yes" if any(e["writable"] for e in entries if e["source"] == src) else "no"
        out.append(f"| {src} | {c.get('skill',0)} | {c.get('agent',0)} | "
                   f"{c.get('command',0)} | {w} |")
    out.append("")

    # Full listing grouped by source (compact: name — description first ~16 words).
    out.append("## Entries (grouped by source)\n")
    for src in sorted(by_source):
        out.append(f"### {src}\n")
        out.append("| name | kind | lines | desc (truncated) |")
        out.append("|---|---|---:|---|")
        for e in sorted([x for x in entries if x["source"] == src],
                        key=lambda x: (x["kind"], x["name"])):
            d = " ".join(e["description"].split()[:16])
            d = d.replace("|", "\\|")
            if e["description_words"] > 16:
                d += " …"
            out.append(f"| {e['name']} | {e['kind']} | {e['body_lines']} | {d} |")
        out.append("")

    # Flagged section.
    out.append("## Flagged\n")

    def section(title: str, key: str, fmt):
        items = flags[key]
        out.append(f"### {title} ({len(items)})\n")
        if not items:
            out.append("_none_\n")
            return
        for it in items:
            out.append(f"- {fmt(it)}")
        out.append("")

    # Surface actionable duplicates first; mirror-only ones are expected noise.
    dup_sorted = sorted(flags["duplicate_names"],
                        key=lambda it: (it["mirror_only"], not it["involves_writable"]))
    flags["duplicate_names"] = dup_sorted
    section("Duplicate names", "duplicate_names",
            lambda it: f"`{it['name']}` × {it['count']} ({', '.join(it['sources'])})"
                       + (" [editable]" if it["involves_writable"] else "")
                       + (" — mirror-only, ignorable" if it["mirror_only"] else ""))
    section("Near-duplicate descriptions", "near_duplicate_descriptions",
            lambda it: f"`{it['a']}` ≈ `{it['b']}` (sim {it['similarity']}, "
                       f"{'editable' if it['either_writable'] else 'read-only'})")
    section("Weak / missing description", "weak_or_missing_description",
            lambda it: f"`{it['name']}` ({it['kind']}, {it['source']}, "
                       f"{it['words']}w){' [editable]' if it['writable'] else ''}")
    section("Oversized body (>%d lines)" % MAX_BODY_LINES, "oversized_body",
            lambda it: f"`{it['name']}` ({it['kind']}, {it['lines']} lines)"
                       f"{' [editable]' if it['writable'] else ''}")
    section("No trigger language in description", "no_trigger_language",
            lambda it: f"`{it['name']}` ({it['kind']}, {it['source']})"
                       f"{' [editable]' if it['writable'] else ''}")

    return "\n".join(out) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--cwd", default=os.getcwd(),
                    help="project dir to scan for .claude/ (default: $PWD)")
    ap.add_argument("--mine-only", action="store_true",
                    help="limit scan to writable (own) sources")
    ap.add_argument("--workspace", default=None,
                    help="output dir (default: <tmpdir>/skill-doctor)")
    args = ap.parse_args()

    cwd = Path(args.cwd).expanduser()
    workspace = (Path(args.workspace).expanduser() if args.workspace
                 else Path(tempfile.gettempdir()) / "skill-doctor")
    workspace.mkdir(parents=True, exist_ok=True)

    entries = scan(cwd, args.mine_only)
    flags = compute_flags(entries)

    data = {
        "cwd": str(cwd),
        "mine_only": args.mine_only,
        "total": len(entries),
        "entries": entries,
        "flags": flags,
        "writable_roots": [str(r) for r in WRITABLE_ROOTS],
    }
    (workspace / "inventory.json").write_text(json.dumps(data, indent=2))
    (workspace / "inventory.md").write_text(
        render_markdown(entries, flags, cwd, args.mine_only))

    print(str(workspace))
    print(f"  inventory.json  ({len(entries)} entries)")
    print("  inventory.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
