#!/usr/bin/env bash
# Setup script for OpenCode plugin tests
# Creates an isolated test environment with proper plugin installation
set -euo pipefail

# Get the repository root (two levels up from tests/opencode/)
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# Create temp home directory for isolation
export TEST_HOME
TEST_HOME=$(mktemp -d)
export HOME="$TEST_HOME"
export XDG_CONFIG_HOME="$TEST_HOME/.config"
export OPENCODE_CONFIG_DIR="$TEST_HOME/.config/opencode"

# Standard install layout:
#   $OPENCODE_CONFIG_DIR/PowersNexus/             ← package root
#   $OPENCODE_CONFIG_DIR/PowersNexus/skills/      ← skills dir (../../skills from plugin)
#   $OPENCODE_CONFIG_DIR/PowersNexus/.opencode/plugins/powersnexus.js ← plugin file
#   $OPENCODE_CONFIG_DIR/plugins/powersnexus.js   ← symlink OpenCode reads

PowersNexus_DIR="$OPENCODE_CONFIG_DIR/PowersNexus"
PowersNexus_SKILLS_DIR="$PowersNexus_DIR/skills"
PowersNexus_PLUGIN_FILE="$PowersNexus_DIR/.opencode/plugins/powersnexus.js"

# Install skills
mkdir -p "$PowersNexus_DIR"
cp -r "$REPO_ROOT/skills" "$PowersNexus_DIR/"

# Install plugin
mkdir -p "$(dirname "$PowersNexus_PLUGIN_FILE")"
cp "$REPO_ROOT/.opencode/plugins/powersnexus.js" "$PowersNexus_PLUGIN_FILE"

# Register plugin via symlink (what OpenCode actually reads)
mkdir -p "$OPENCODE_CONFIG_DIR/plugins"
plugin_registration="$OPENCODE_CONFIG_DIR/plugins/powersnexus.js"
ln -sf "$PowersNexus_PLUGIN_FILE" "$plugin_registration" || true

# Windows Git Bash 可能没有创建符号链接的权限。OpenCode 同样可加载常规文件，
# 因此隔离夹具在此情况下保留等价文件副本；Linux 仍会验证符号链接布局。
if [ ! -L "$plugin_registration" ]; then
    rm -f "$plugin_registration"
    cp "$PowersNexus_PLUGIN_FILE" "$plugin_registration"
fi

# Create test skills in different locations for testing

# Personal test skill
mkdir -p "$OPENCODE_CONFIG_DIR/skills/personal-test"
cat > "$OPENCODE_CONFIG_DIR/skills/personal-test/SKILL.md" <<'EOF'
---
name: personal-test
description: Test personal skill for verification
---
# Personal Test Skill

This is a personal skill used for testing.

PERSONAL_SKILL_MARKER_12345
EOF

# Create a project directory for project-level skill tests
mkdir -p "$TEST_HOME/test-project/.opencode/skills/project-test"
cat > "$TEST_HOME/test-project/.opencode/skills/project-test/SKILL.md" <<'EOF'
---
name: project-test
description: Test project skill for verification
---
# Project Test Skill

This is a project skill used for testing.

PROJECT_SKILL_MARKER_67890
EOF

echo "Setup complete: $TEST_HOME"
echo "OPENCODE_CONFIG_DIR:  $OPENCODE_CONFIG_DIR"
echo "PowersNexus dir:      $PowersNexus_DIR"
echo "Skills dir:           $PowersNexus_SKILLS_DIR"
echo "Plugin file:          $PowersNexus_PLUGIN_FILE"
echo "Plugin registered at: $OPENCODE_CONFIG_DIR/plugins/powersnexus.js"
echo "Test project at:      $TEST_HOME/test-project"

# Helper function for cleanup (call from tests or trap)
cleanup_test_env() {
    if [ -n "${TEST_HOME:-}" ] && [ -d "$TEST_HOME" ]; then
        rm -rf "$TEST_HOME"
    fi
}

# Export for use in tests
export -f cleanup_test_env
export REPO_ROOT
export PowersNexus_DIR
export PowersNexus_SKILLS_DIR
export PowersNexus_PLUGIN_FILE
