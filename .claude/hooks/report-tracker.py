#!/usr/bin/env python3
"""report-tracker — PostToolUse(Write|Edit|MultiEdit) compliance audit logger.

Appends an immutable, timestamped line to docs/audit/audit-YYYY-MM-DD.md for every
file the agent writes or edits. Audit-readiness is the thesis of the estate
(charter §X): the dashboard *is* the proof. This hook makes the build self-document.

Reads the PostToolUse JSON payload on stdin. Never blocks (always exit 0); a broken
audit logger must not break the build.
"""
import datetime
import json
import os
import sys


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    tool = payload.get("tool_name", "?")
    tool_input = payload.get("tool_input", {}) or {}
    path = tool_input.get("file_path") or tool_input.get("path") or "?"

    project = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    now = datetime.datetime.now()
    audit_dir = os.path.join(project, "docs", "audit")
    os.makedirs(audit_dir, exist_ok=True)
    log = os.path.join(audit_dir, f"audit-{now:%Y-%m-%d}.md")

    rel = path
    try:
        rel = os.path.relpath(path, project)
    except Exception:
        pass

    new = not os.path.exists(log)
    try:
        with open(log, "a", encoding="utf-8") as fh:
            if new:
                fh.write(f"# Build audit — {now:%Y-%m-%d}\n\n")
                fh.write("| Time | Tool | File |\n|---|---|---|\n")
            fh.write(f"| {now:%H:%M:%S} | {tool} | `{rel}` |\n")
    except Exception:
        return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
