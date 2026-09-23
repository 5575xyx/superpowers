#!/usr/bin/env bash
set -uo pipefail

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

LOCAL_VERSION="$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\)".*/\1/p' "$REPO_ROOT/package.json" | head -n1)"
[ -n "$LOCAL_VERSION" ] || { echo "无法读取本地 version"; exit 1; }
NEW_VERSION="$(printf '%s' "$LOCAL_VERSION" | awk -F. '{ printf "%s.%s.%s", $1, $2, $3+1 }')"

make_fixture() {
  local version="$1" path="$2"
  printf '{"name":"powersnexus","version":"%s"}\n' "$version" >"$path"
}

make_home() {
  local home="$TEST_ROOT/$1/home"
  mkdir -p "$home"
  printf '%s' "$home"
}

# 用 HOME 隔离缓存；保留完整 PATH 以便 curl/cygpath 可用。
run_hook() {
  local home="$1" url="$2" cache="$3" hook="$4"
  HOME="$home" POWERSNexus_UPDATE_URL="$url" POWERSNexus_UPDATE_CACHE="$cache" bash "$hook" 2>&1
}

echo "版本更新提示测试"

# 1) 离线/坏 URL：check-update 静默且退出 0
home1="$(make_home offline)"
fixture_bad="$TEST_ROOT/offline.json"
printf 'not-json' >"$fixture_bad"
if out="$(run_hook "$home1" "file://$fixture_bad" "$home1/cache.json" "$CHECK")"; then
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
hook_out="$(run_hook "$home2" "file://$fixture_new" "$home2/cache.json" "$HOOK")" || { fail "新版本时 session-start 应退出 0"; hook_out=""; }
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
codex_out="$(run_hook "$home2" "file://$fixture_new" "$home2/codex-cache.json" "$CODEX_HOOK")" || { fail "新版本时 codex 钩子应退出 0"; codex_out=""; }
if printf '%s' "$codex_out" | grep -q "检测到新版本"; then
  pass "远程版本更高时 session-start-codex 含提示"
else
  fail "远程版本更高时 session-start-codex 应含「检测到新版本」"
fi

# 4) 版本不更新：无提示
home3="$(make_home older)"
fixture_old="$TEST_ROOT/older.json"
make_fixture "$LOCAL_VERSION" "$fixture_old"
old_out="$(run_hook "$home3" "file://$fixture_old" "$home3/cache.json" "$HOOK")" || { fail "同版本时 session-start 应退出 0"; old_out=""; }
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
run_hook "$home4" "file://$fixture_c" "$cache_file" "$CHECK" >/dev/null 2>&1 || fail "首次 check-update 应退出 0"
today="$(date +%F)"
if grep -q "$today" "$cache_file" 2>/dev/null && grep -q "$NEW_VERSION" "$cache_file" 2>/dev/null; then
  pass "缓存写入当日日期与 latest"
else
  fail "缓存应含当日与 latest：$(cat "$cache_file" 2>/dev/null || echo 无文件)"
fi
cached_out="$(run_hook "$home4" "file://$TEST_ROOT/missing-$$.json" "$cache_file" "$CHECK")" || cached_out=""
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
