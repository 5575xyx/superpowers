# Merge Report: {{CHANGE_NAME}}

> 模板来源：PowersNexus OpenSpec
> 路径：`.novaway/powersnexus/changes/archive/YYYY-MM-DD-{{CHANGE_NAME}}/merge-report.md`
> 用途：归档阶段记录本次变更的合并动作

---

## 元信息

| 字段 | 内容 |
|------|------|
| **变更名称** | {{CHANGE_NAME}} |
| **归档日期** | {{ARCHIVE_DATE}} |
| **创建模式** | Greenfield / Brownfield / Mixed |
| **涉及模块数** | {{MODULE_COUNT}} |

---

## 模式判定

| 字段 | 内容 |
|------|------|
| **创建模式** | {{MODE}} |
| **判定依据** | {{JUDGMENT_BASIS}} |
| **判定时机** | brainstorming 阶段（前置） |

---

## 合并动作详情

### 模块：{{MODULE_1}}

| 项目 | 内容 |
|------|------|
| **子模式** | Greenfield / Brownfield |
| **主规格路径** | `.novaway/powersnexus/specs/{{MODULE_1}}/spec.md` |
| **主规格状态** | 新建 / 更新 |
| **新增 REQ 数** | {{ADDED_COUNT}} |
| **修改 REQ 数** | {{MODIFIED_COUNT}} |
| **移除 REQ 数** | {{REMOVED_COUNT}} |
| **新版本号** | v{{NEW_VERSION}} |

**操作详情：**

- ✅ {{ACTION_1}}
- ✅ {{ACTION_2}}

---

### 模块：{{MODULE_2}}（如适用）

| 项目 | 内容 |
|------|------|
| **子模式** | Greenfield / Brownfield |
| **主规格路径** | `.novaway/powersnexus/specs/{{MODULE_2}}/spec.md` |
| **主规格状态** | 新建 / 更新 |
| **新增 REQ 数** | {{ADDED_COUNT}} |
| **修改 REQ 数** | {{MODIFIED_COUNT}} |
| **移除 REQ 数** | {{REMOVED_COUNT}} |
| **新版本号** | v{{NEW_VERSION}} |

---

## REQ-ID 映射

| 旧 REQ-ID | 新 REQ-ID | 变更类型 | 说明 |
|-----------|-----------|----------|------|
| - | REQ-{{NEW_ID}} | ADDED | 新增需求 |
| REQ-{{OLD_ID}} | REQ-{{NEW_ID}} | MODIFIED | 修改需求 |
| REQ-{{OLD_ID}} | - | REMOVED | 移除需求 |

---

## 冲突处理

| 冲突类型 | 状态 | 处理方式 |
|----------|------|----------|
| Greenfield 但 specs/ 已存在 | {{CONFLICT_STATUS}} | {{RESOLUTION}} |
| Brownfield 但 specs/ 不存在 | {{CONFLICT_STATUS}} | {{RESOLUTION}} |
| REQ-ID 冲突 | {{CONFLICT_STATUS}} | {{RESOLUTION}} |
| 模块遗漏 | {{CONFLICT_STATUS}} | {{RESOLUTION}} |

---

## 合并前快照

> 防止意外覆盖

| 文件 | 快照路径 | 状态 |
|------|----------|------|
| {{SPEC_FILE}} | `archive/pre-merge-snapshot/{{SPEC_FILE}}` | ✅ 已保存 |

---

## 合并后状态

- [x] 所有 artifacts 已移至 `archive/YYYY-MM-DD-{{CHANGE_NAME}}/`
- [x] 主规格已更新或新建
- [x] 变更历史已追加
- [x] 跨引用文档已更新
- [x] 知识库已记录（Step 2.5）

---

## 验证结果

| 验证项 | 通过 | 失败 |
|--------|------|------|
| Greenfield 流程 | ✅ | - |
| Brownfield 流程 | ✅ | - |
| Mixed 流程 | ✅ | - |
| 冲突检测 | ✅ | - |
| 模板完整性 | ✅ | - |

---

**报告生成时间：** {{GENERATED_AT}}
**生成者：** AI Agent
**审核者：** {{REVIEWER}}
