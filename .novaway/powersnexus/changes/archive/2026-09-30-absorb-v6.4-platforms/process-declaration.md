# Process Declaration: absorb-v6.4-platforms

> 路径：`.novaway/powersnexus/changes/absorb-v6.4-platforms/process-declaration.md`

## 声明级别

声明级别: L3
> 依据：新增三平台清单、扩展版本成套管理与 CI，涉及 Greenfield 模块与可执行脚本；经红队建议拆分为三个独立变更中的第三个（平台与版本，最后执行）。

## 遵循步骤

1. task-size-assessor 评估（已加载）。
2. brainstorming 设计并确认拆分与移植边界（已加载）。
3. 红队设计审查（三个并行子代理）。
4. 创建变更结构并逐项落地 REQ-001..004。
5. `npm run test:core` / `test:platform` / `test:package` 与 Hermes Job 验证。
6. `check delivery` → `audit` → `archive`。

## 跳过步骤及理由

- 基线压力测试（RED）跳过：平台清单为上游既有清单的本地化，行为等价，以清单测试与 pytest 为准。
- 完整红队代码审查未执行：以既有测试套件为门禁；如清单或版本一致性退化即回滚。

## 审查记录

- 红队（2026-09-30）：识别出 `.version-bump.json` 为版本驱动、YAML 版本校验、yq 依赖、Muse skills[] 漂移、`__pycache__` 进包、bump 时序等问题，已并入设计。
- 自审：核对三平台清单品牌本地化；核对版本三处登记点齐全。

## 用户确认

用户于 2026-09-30 确认：L3 流程、拆分为三个变更、范围内全移植并附排除表、版本 bump 6.3.0 并纳入新平台。用户确认结论：方案通过。
