# session-start-update-notice 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use PowersNexus:subagent-driven-development (recommended) or PowersNexus:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 在共享 SessionStart 钩子中实现每日一次的 gitee 版本比对，发现新版本时向注入上下文追加一行中文提示，失败时静默。

**Architecture:** 新增独立脚本 `hooks/check-update`（本地/远程版本 + `$HOME` 缓存 + 超时网络），由 `hooks/session-start` 与 `hooks/session-start-codex` 在 JSON 转义前调用；非空单行提示并入 `session_context` 文本，协议分支不动。

**Tech Stack:** Bash（无 jq/node 运行时依赖）、curl/wget、`node --test` 不适用——平台 shell 测试对齐 `tests/hooks/test-session-start.sh` 风格。

## Global Constraints

- 需求：REQ-001 版本比对、REQ-002 更新提示、REQ-003 每日缓存、REQ-004 失败静默、REQ-005 双钩子共用
- 提示与测试文案一律简体中文；代码标识符英文
- `hooks/check-update` 退出码恒 0；无网/解析失败静默，绝不让钩子失败
- 网络超时 `--max-time 3` / `wget -T 3`；默认 URL `https://gitee.com/nova-way/powersnexus/raw/main/package.json`
- 缓存路径 `${XDG_CACHE_HOME:-$HOME/.cache}/powersnexus/update-check.json`，禁止写入 `PLUGIN_ROOT`
- 版本格式仅 `X.Y.Z` 数字段严格大于才提示；不引入 `jq`/`node` 到钩子路径
- `.sh`/扩展名钩子禁 UTF-8 BOM（`tests/executable-script-encoding.test.mjs`）
- 不修改 OpenCode 插件、不修改三平台 JSON 分支、不自动 `git pull`
- 测试不得依赖公网；用 `POWERSNexus_UPDATE_URL` / `POWERSNexus_UPDATE_CACHE` 注入
- 未经授权不 push；commit 须用户明确同意

## Acceptance Criteria

1. 离线执行 `hooks/session-start` 与 `session-start-codex`：退出 0、合法 JSON、上下文无「检测到新版本」
2. `POWERSNexus_UPDATE_URL` 指向更高版本 fixture 时，输出 JSON 的 additionalContext 含「检测到新版本」及新版本号
3. fixture 版本 ≤ 本地时无提示
4. 同日第二次运行命中缓存，不再次发起网络（以缓存 `checkedAt` 与注入的失败 URL 仍得缓存结果为证）
5. `bash tests/hooks/test-update-notice.sh` 与 `bash tests/hooks/test-session-start.sh` 全绿
6. `npm run test:core`、`npm run test:package` 全绿
7. `powersnexus check consistency` / `check delivery session-start-update-notice` 通过
8. Delta Spec 以 REQ-001～REQ-005 声明并被 CLI 识别

## Non-Functional Requirements

- **性能:** 单次网络 ≤ 3s；缓存命中 0 网络
- **可靠性:** 任何 check-update 失败不影响 bootstrap 注入
- **安全:** 仅拉取固定 gitee raw JSON，不执行远程内容；缓存在用户目录
- **可维护性:** 检查逻辑单文件；两钩子共用同一脚本
- **可观测性:** 静默失败即可（无日志文件要求）

---

### Task 1: 失败测试骨架与契约

**Files:**
- Create: `tests/hooks/test-update-notice.sh`
- Modify: `tests/run-platform-tests.sh:20` 后插入一行

**Interfaces:**
- Consumes: 既有 `test-session-start.sh` 的临时 HOME / pass-fail 模式
- Produces: 测试脚本调用 `hooks/check-update` 与两钩子；环境变量名 `POWERSNexus_UPDATE_URL`、`POWERSNexus_UPDATE_CACHE`（后续任务必须沿用）

- [x] **Step 1: 写失败测试**

创建 `tests/hooks/test-update-notice.sh`（核心断言，完整内容）：

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CHECK="$REPO_ROOT/hooks/check-update"
HOOK="$REPO_ROOT/hooks/session-start"
CODEX_HOOK="$REPO_ROOT/hooks/session-start-codex"

FAILURES=0
TEST_ROOT="$(mktemp -d)"
cleanup() { rm -rf "$TEST_ROOT"; }
trap cleanup EXIT

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }

LOCAL_VERSION="$(node -p "require('$REPO_ROOT/package.json').version")"

bump_patch() {
  node -e 'const [a,b,c]=process.argv[1].split(".").map(Number); console.log(`${a}.${b}.${c+1}`)' "$1"
}
NEW_VERSION="$(bump_patch "$LOCAL_VERSION")"

make_fixture() {
  local version="$1" path="$2"
  printf '{"name":"powersnexus","version":"%s"}\n' "$version" >"$path"
}

make_home() {
  local home="$TEST_ROOT/$1/home"
  mkdir -p "$home"
  printf '%s' "$home"
}

echo "版本更新提示测试"

# 1) 离线/坏 URL：check-update 静默且退出 0
home1="$(make_home offline)"
fixture_bad="$TEST_ROOT/offline.json"
printf 'not-json' >"$fixture_bad"
if out="$(env -i PATH="$PATH" HOME="$home1" \
  POWERSNexus_UPDATE_URL="file://$fixture_bad" \
  POWERSNexus_UPDATE_CACHE="$home1/cache.json" \
  bash "$CHECK" 2>&1)"; then
  if [ -z "$out" ]; then
    pass "坏 URL 时 check-update 静默且退出 0"
  else
    fail "坏 URL 时应无输出，得到：$out"
  fi
else
  fail "坏 URL 时 check-update 应退出 0"
fi

# 2) 发现新版本：钩子上下文含提示
home2="$(make_home newer)"
fixture_new="$TEST_ROOT/newer.json"
make_fixture "$NEW_VERSION" "$fixture_new"
hook_out="$(env -i PATH="$PATH" HOME="$home2" \
  POWERSNexus_UPDATE_URL="file://$fixture_new" \
  POWERSNexus_UPDATE_CACHE="$home2/cache.json" \
  bash "$HOOK" 2>&1)" || { fail "新版本时 session-start 应退出 0"; hook_out=""; }
if printf '%s' "$hook_out" | grep -q "检测到新版本"; then
  pass "远程版本更高时 session-start 含提示"
else
  fail "远程版本更高时 session-start 应含「检测到新版本」"
fi
if printf '%s' "$hook_out" | grep -q "$NEW_VERSION"; then
  pass "提示包含新版本号"
else
  fail "提示应包含新版本号 $NEW_VERSION"
fi

# 3) Codex 钩子同样提示
codex_out="$(env -i PATH="$PATH" HOME="$home2" \
  POWERSNexus_UPDATE_URL="file://$fixture_new" \
  POWERSNexus_UPDATE_CACHE="$home2/codex-cache.json" \
  bash "$CODEX_HOOK" 2>&1)" || { fail "新版本时 codex 钩子应退出 0"; codex_out=""; }
if printf '%s' "$codex_out" | grep -q "检测到新版本"; then
  pass "远程版本更高时 session-start-codex 含提示"
else
  fail "远程版本更高时 session-start-codex 应含「检测到新版本」"
fi

# 4) 版本不更新：无提示
home3="$(make_home older)"
fixture_old="$TEST_ROOT/older.json"
make_fixture "$LOCAL_VERSION" "$fixture_old"
old_out="$(env -i PATH="$PATH" HOME="$home3" \
  POWERSNexus_UPDATE_URL="file://$fixture_old" \
  POWERSNexus_UPDATE_CACHE="$home3/cache.json" \
  bash "$HOOK" 2>&1)" || { fail "同版本时 session-start 应退出 0"; old_out=""; }
if printf '%s' "$old_out" | grep -q "检测到新版本"; then
  fail "同版本时不应有提示"
else
  pass "远程版本不高于本地时无提示"
fi

# 5) 每日缓存：首次写入后，坏 URL 仍用缓存 latest
home4="$(make_home cache)"
fixture_c="$TEST_ROOT/cache.json"
make_fixture "$NEW_VERSION" "$fixture_c"
cache_file="$home4/update-check.json"
env -i PATH="$PATH" HOME="$home4" \
  POWERSNexus_UPDATE_URL="file://$fixture_c" \
  POWERSNexus_UPDATE_CACHE="$cache_file" \
  bash "$CHECK" >/dev/null 2>&1 || fail "首次 check-update 应退出 0"
today="$(date +%F)"
if grep -q "$today" "$cache_file" 2>/dev/null && grep -q "$NEW_VERSION" "$cache_file" 2>/dev/null; then
  pass "缓存写入当日日期与 latest"
else
  fail "缓存应含当日与 latest：$(cat "$cache_file" 2>/dev/null || echo 无文件)"
fi
cached_out="$(env -i PATH="$PATH" HOME="$home4" \
  POWERSNexus_UPDATE_URL="file://$TEST_ROOT/missing-$$.json" \
  POWERSNexus_UPDATE_CACHE="$cache_file" \
  bash "$CHECK" 2>&1)" || cached_out=""
if printf '%s' "$cached_out" | grep -q "检测到新版本 $NEW_VERSION"; then
  pass "当日缓存命中且不依赖网络"
else
  fail "当日缓存应直接给出 latest 提示，得到：$cached_out"
fi

echo
if [ "$FAILURES" -eq 0 ]; then
  echo "版本更新提示测试全部通过"
  exit 0
fi
echo "$FAILURES 项失败"
exit 1
```

- [x] **Step 2: 挂入平台套件**

在 `tests/run-platform-tests.sh` 的 `run_test "SessionStart Hook 输出协议" ...` 行之后插入：

```bash
run_test "版本更新提示" bash "$REPO_ROOT/tests/hooks/test-update-notice.sh"
```

- [x] **Step 3: 运行确认失败**

Run: `bash tests/hooks/test-update-notice.sh`
Expected: FAIL（`hooks/check-update` 不存在）

---

### Task 2: 实现 `hooks/check-update`

**Files:**
- Create: `hooks/check-update`

**Interfaces:**
- Consumes: `$PLUGIN_ROOT/package.json` 的 `version`；环境变量 `POWERSNexus_UPDATE_URL`、`POWERSNexus_UPDATE_CACHE`
- Produces: stdout 至多一行中文提示（无换行）；退出码 0。钩子任务只依赖「非空 stdout」

- [x] **Step 1: 写最小实现**

创建 `hooks/check-update`（完整内容）：

```bash
#!/usr/bin/env bash
# 会话启动版本提示：本地 package.json 与 gitee raw 比对；失败静默，退出码恒 0。
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

DEFAULT_URL="https://gitee.com/nova-way/powersnexus/raw/main/package.json"
UPDATE_URL="${POWERSNexus_UPDATE_URL:-$DEFAULT_URL}"
CACHE_FILE="${POWERSNexus_UPDATE_CACHE:-${XDG_CACHE_HOME:-$HOME/.cache}/powersnexus/update-check.json}"

extract_version() {
    printf '%s' "$1" | sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([0-9]\+\.[0-9]\+\.[0-9]\+\)".*/\1/p' | head -n1
}

version_gt() {
    # 远程 > 本地？三段数字比较
    local remote="$1" local_v="$2"
    [ -n "$remote" ] && [ -n "$local_v" ] || return 1
    local i r l
    for i in 1 2 3; do
        r="$(printf '%s' "$remote" | cut -d. -f"$i")"
        l="$(printf '%s' "$local_v" | cut -d. -f"$i")"
        [ "$r" -gt "$l" ] 2>/dev/null || { [ "$r" -eq "$l" ] 2>/dev/null || return 1; }
        if [ "$r" -gt "$l" ] 2>/dev/null; then
            return 0
        fi
    done
    return 1
}

notice_for() {
    local remote="$1" local_v="$2"
    version_gt "$remote" "$local_v" || return 0
    printf '[powersnexus] 检测到新版本 %s（当前 %s）。更新：重新安装插件或 git pull 后重启会话。' \
        "$remote" "$local_v"
}

today="$(date +%F)"
local_json="$(cat "${PLUGIN_ROOT}/package.json" 2>/dev/null || true)"
local_version="$(extract_version "$local_json")"
[ -n "$local_version" ] || exit 0

latest=""
if [ -f "$CACHE_FILE" ]; then
    cached="$(cat "$CACHE_FILE" 2>/dev/null || true)"
    cached_at="$(printf '%s' "$cached" | sed -n 's/.*"checkedAt"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
    if [ "$cached_at" = "$today" ]; then
        latest="$(printf '%s' "$cached" | sed -n 's/.*"latest"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
    fi
fi

if [ -z "$latest" ]; then
    remote_json=""
    if command -v curl >/dev/null 2>&1; then
        remote_json="$(curl -fsSL --max-time 3 "$UPDATE_URL" 2>/dev/null || true)"
    elif command -v wget >/dev/null 2>&1; then
        remote_json="$(wget -q -T 3 -O - "$UPDATE_URL" 2>/dev/null || true)"
    fi
    latest="$(extract_version "$remote_json")"
    if [ -n "$latest" ]; then
        cache_dir="$(dirname "$CACHE_FILE")"
        mkdir -p "$cache_dir" 2>/dev/null || true
        printf '{"checkedAt":"%s","latest":"%s"}\n' "$today" "$latest" >"$CACHE_FILE" 2>/dev/null || true
    fi
fi

[ -n "$latest" ] || exit 0
notice_for "$latest" "$local_version"
exit 0
```

- [x] **Step 2: 确认无 BOM、退出 0**

Run: `bash hooks/check-update; echo exit:$?`
Expected: 无输出或一行提示，`exit:0`（本机若能访问 gitee 且本地落后才可能有提示）

Run（PowerShell 检查 BOM）:

```powershell
$bytes = [System.IO.File]::ReadAllBytes("hooks/check-update")[0..2]; if ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) { throw "BOM" } else { "no-bom" }
```

Expected: `no-bom`

- [x] **Step 3: 跑失败测试至通过**

Run: `bash tests/hooks/test-update-notice.sh`
Expected: PASS 全部项

---

### Task 3: 接入两钩子

**Files:**
- Modify: `hooks/session-start`（在 `escape_for_json` 调用与 `session_context=` 之间）
- Modify: `hooks/session-start-codex`（同位置）

**Interfaces:**
- Consumes: `hooks/check-update` 的 stdout 单行或空
- Produces: 不变的 JSON 协议；仅 `session_context` 文本可能多一行提示

- [x] **Step 1: 修改 `hooks/session-start`**

在 `using_powersnexus_escaped=$(escape_for_json ...)` **之前**插入：

```bash
update_notice="$("${BASH:-bash}" "${PLUGIN_ROOT}/hooks/check-update" 2>/dev/null || true)"
if [ -n "$update_notice" ]; then
    session_context="<EXTREMELY_IMPORTANT>\nYou have powersnexus.\n\n**Below is the full content of your 'powersnexus:using-powersnexus' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**\n\n${using_powersnexus_escaped}\n</EXTREMELY_IMPORTANT>\n\n${update_notice}"
else
    session_context="<EXTREMELY_IMPORTANT>\nYou have powersnexus.\n\n**Below is the full content of your 'powersnexus:using-powersnexus' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**\n\n${using_powersnexus_escaped}\n</EXTREMELY_IMPORTANT>"
fi
```

注意：`update_notice` 必须在 `session_context=` 赋值处一并转义——若提示含引号，对整个 context 使用现有 `escape_for_json` 路径时，仅 `using_powersnexus_escaped` 被转义而 `session_context` 是拼好的 JSON 片段。**实现时将提示拼入 `session_context` 后不再二次 escape 提示以外内容**；提示本身仅含中文与数字/点/括号，无 `"` `\` 换行，可直接嵌入。

- [x] **Step 2: 修改 `hooks/session-start-codex`**

同样在 `session_context=` 处增加非空 `update_notice` 分支，Codex 文案保持原 skill 加载说明不变，仅在 `</EXTREMELY_IMPORTANT>` 后追加 `\n\n${update_notice}`。

- [x] **Step 3: 回归 session-start 协议**

Run: `bash tests/hooks/test-session-start.sh`
Expected: 全部 PASS

Run: `bash tests/hooks/test-update-notice.sh`
Expected: 全部 PASS

---

### Task 4: 文档一句话

**Files:**
- Modify: `docs/README.opencode.md`（`## 更新` 节）或 `.opencode/INSTALL.md` 更新节

**Interfaces:**
- Consumes: 无
- Produces: 用户可见说明：会话启动会提示新版本

- [x] **Step 1: 追加一句**

在更新相关小节追加（按文件已有语言风格）：

```markdown
会话启动时若检测到 gitee 上有更新版本，SessionStart 上下文会附带一行版本提示；检查失败时静默，不影响会话。
```

- [x] **Step 2: 确认无断言冲突**

Run: `npm run test:core`
Expected: 全绿

---

### Task 5: 集成验收与交付

**Files:**
- Modify: `.novaway/powersnexus/changes/session-start-update-notice/delivery.json`（argv 已预填，状态更新）
- Optional: `.novaway/powersnexus/changes/session-start-update-notice/tasks.md` 勾选

**Interfaces:**
- Consumes: Task 1-4 全部产物
- Produces: 交付证据、归档就绪

- [x] **Step 1: 一致性检查**

Run: `node src/cli/powersnexus-cli.js check consistency session-start-update-notice`
Expected: 通过；若缺 delta-specs/proposal，按 CLI 报错补齐最小工件后再跑

- [x] **Step 2: 平台 + 核心 + 包测试**

Run（Git Bash）:

```bash
bash tests/hooks/test-update-notice.sh
bash tests/hooks/test-session-start.sh
npm run test:core
npm run test:package
```

Expected: 全绿

- [x] **Step 3: 交付验证**

Run:

```bash
node src/cli/powersnexus-cli.js check delivery session-start-update-notice
node src/cli/powersnexus-cli.js verify delivery session-start-update-notice
```

Expected: 通过（argv 见 `delivery.json`）

- [x] **Step 4: 归档前检查与（经用户同意的）提交**

Run: `node src/cli/powersnexus-cli.js archive session-start-update-notice`（仅在用户要求归档时）
提醒用户：可 `git commit` / 推送；**未经授权不 push**。

---

## 验收标准映射

| AC | 任务 |
|----|------|
| REQ-001 离线语义与比对 | Task 1 用例 1 + Task 3 回归 |
| REQ-002 新版本提示 | Task 1 用例 2/3 + Task 3 |
| REQ-002 旧版本无提示 | Task 1 用例 4 |
| REQ-003 每日缓存 | Task 1 用例 5 + Task 2 |
| REQ-004 失败静默 | Task 1 用例 1、Task 2 |
| REQ-005 双钩子 | Task 1、Task 3 |
| hook 测试绿 | Task 3 Step 3 |
| core/package 绿 | Task 4 Step 2、Task 5 Step 2 |
| CLI 交付 | Task 5 |
