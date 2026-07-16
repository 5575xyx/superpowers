# Testing PowersNexus

PowersNexus has two distinct kinds of tests, each in its own directory:

- **`tests/`** — does the plugin's non-LLM code work? Bash + node + python integration tests for brainstorm-server JS, OpenCode plugin loading, codex-plugin sync, and analysis utilities.
- **`evals/`** — do agents behave correctly on real LLM sessions? Python harness driving real tmux sessions of Claude Code / Codex / Gemini CLI, with an LLM actor and verifier judging skill compliance.

## Plugin tests

Live in `tests/`. Currently:

- `tests/brainstorm-server/` — node test suite for the brainstorm server JS code.
- `tests/opencode/` — bash tests for OpenCode plugin loading, bootstrap caching, and tool registration.
- `tests/codex-plugin-sync/` — bash sync verification.
- `tests/kimi/` — bash/Python checks for Kimi plugin manifest wiring.
- `tests/claude-code/test-helpers.sh`, `analyze-token-usage.py` — utilities used by remaining bash tests.
- `tests/claude-code/test-subagent-driven-development.sh` — agent-can-describe-SDD test (no drill counterpart; tests description-recall, not behavior).
- `tests/claude-code/test-subagent-driven-development-integration.sh` — extended SDD integration with token analysis (drill covers the YAGNI subset; bash adds commit-count, Claude Code task-tracking, and token telemetry assertions).
- `tests/claude-code/test-worktree-native-preference.sh` — RED-GREEN-REFACTOR validation for worktree skill (drill covers the PRESSURE phase; bash also covers RED/GREEN baselines).
- `tests/explicit-skill-requests/` — Haiku-specific, multi-turn, and skill-name-prompted tests not covered by drill.

Run the Node-only core suite with `npm test` (or `npm run test:core`). It does not require Python.

Run `npm run test:uiux` only in an environment with Python 3; it verifies the bundled UI/UX Pro Max search engine against its local data set.

Run `npm run test:platform` on Linux, macOS, or a correctly configured Git Bash environment to execute the fast cross-platform suites: SessionStart Hook output, OpenCode plugin loading and bootstrap caching, Kimi manifest wiring, Antigravity tool mappings, Shell lint behavior, and brainstorm-server service/lifecycle coverage. This command installs the locked `tests/brainstorm-server` test dependency before running that suite. If `rsync` is installed, it also runs the Codex plugin synchronization regression; CI requires that tool and fails if it is unavailable. It deliberately excludes tests requiring an installed AI client, including OpenCode integration tests.

Run `npm run test:package` to validate the npm release contents without creating an archive. It checks that runtime skills and plugin code are included, while tests, local review records, legacy files, and Python caches are excluded.

Run `npm run test:all` for the complete local release gate: core tests, UI/UX design intelligence, platform tests, then the package artifact check. On Windows, run it from a configured Git Bash shell because the platform phase requires Bash.

Individual platform-specific Bash suites remain available via the relevant directory's `run-*.sh` scripts.

## Skill behavior evals

Live in `evals/`. Drill is the harness; scenarios live at `evals/scenarios/*.yaml`. See `evals/README.md` for setup. Quick start:

```bash
cd evals
uv sync --extra dev
export ANTHROPIC_API_KEY=sk-...
uv run drill run triggering-test-driven-development -b claude
```

Drill scenarios are slow (3-30+ minutes each) and run real LLM sessions. They are not part of CI today; the natural follow-up is a tiered model (fast subset on PR, full sweep nightly + on-demand).
