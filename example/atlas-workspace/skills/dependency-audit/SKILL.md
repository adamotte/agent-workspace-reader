---
name: dependency-audit
description: Audit a Node.js project's dependencies before a runtime upgrade.
---

# Dependency audit

1. Read `package.json` and the lockfile.
2. Run `pnpm outdated --json` and keep the major gaps.
3. For each gap, read the changelog and note the breaking changes.
4. Hand the findings to [[skills/write-report/SKILL|write-report]].
