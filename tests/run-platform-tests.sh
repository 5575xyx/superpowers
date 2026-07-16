#!/usr/bin/env bash
# 聚合所有无需专用 AI 客户端的跨平台回归测试。
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BRAINTST_DIR="$REPO_ROOT/tests/brainstorm-server"

run_test() {
    local name="$1"
    shift

    echo
    echo "========================================"
    echo "运行平台测试：$name"
    echo "========================================"
    "$@"
}

run_test "SessionStart Hook 输出协议" bash "$REPO_ROOT/tests/hooks/test-session-start.sh"
run_test "OpenCode 快速插件测试" bash "$REPO_ROOT/tests/opencode/run-tests.sh"
run_test "Kimi 插件清单" bash "$REPO_ROOT/tests/kimi/run-tests.sh"
run_test "Antigravity 工具映射" bash "$REPO_ROOT/tests/antigravity/run-tests.sh"
run_test "Shell lint 脚本行为" bash "$REPO_ROOT/tests/shell-lint/test-lint-shell.sh"

if command -v rsync >/dev/null 2>&1; then
    run_test "Codex 插件同步回归" bash "$REPO_ROOT/tests/codex-plugin-sync/test-sync-to-codex-plugin.sh"
elif [[ "${PowersNexus_REQUIRE_RSYNC_TESTS:-}" == "1" ]]; then
    echo "错误：当前质量门槛要求 rsync，但系统中未找到该命令。" >&2
    exit 1
else
    echo
    echo "跳过 Codex 插件同步回归：当前环境未安装 rsync。"
fi

run_test "brainstorm-server 测试依赖安装" npm --prefix "$BRAINTST_DIR" ci --ignore-scripts
run_test "brainstorm-server 服务与生命周期" npm --prefix "$BRAINTST_DIR" test

echo
echo "========================================"
echo "所有平台测试通过"
echo "========================================"
