---
name: ui-ux-pro-max
description: 在构建或重做网页、移动端界面、仪表盘、营销页、表单、导航、图表或设计系统时使用。基于本地 UI/UX Pro Max 设计知识库生成与检索视觉方向、色彩、排版、布局、交互、无障碍和框架实践；在实现前为 frontend-quality 提供可追溯的设计依据。
---

# UI/UX Pro Max 设计智能

本技能集成 UI/UX Pro Max v2.11.0 的本地数据集与搜索工具。来源：Next Level Builder，MIT 许可证；版权和许可全文见 [LICENSE](LICENSE)。

不要手工加载大型 CSV 数据文件。始终使用 `scripts/run-search.js` 检索所需信息。

## 触发后的顺序

1. 读取项目现有页面、设计令牌、组件库、主题与图标体系；已有系统优先。
2. 从产品类型、行业、受众、页面目标、品牌语气与信息密度构造查询。
3. 先生成设计系统，再按需检索细节与技术栈实践。
4. 将结果交给 `frontend-quality`，形成项目特定的视觉契约、状态清单和验收证据。

## 生成设计系统

对每个具有独立视觉方向的产品或页面，先运行：

```bash
node skills/ui-ux-pro-max/scripts/run-search.js \
  "B2B analytics dashboard calm professional medium-density" \
  --design-system --project-name "Analytics Console" --format markdown
```

输出必须明确：视觉风格、色彩语义、字体组合、间距密度、布局模式、交互反馈和应避免的反模式。

仅在用户已批准设计方向且存在活动变更时，才持久化设计产物：

```bash
node skills/ui-ux-pro-max/scripts/run-search.js \
  "B2B analytics dashboard calm professional medium-density" \
  --design-system --project-name "Analytics Console" --format markdown \
  --persist --output-dir .novaway/powersnexus/changes/<change-name>
```

这会在变更目录中创建 `design-system/<project-slug>/MASTER.md`，作为视觉方向的单一事实来源。页面特例位于同目录的 `pages/` 下；不得以特例覆盖主设计系统。

## 按需检索

```bash
# 风格、色彩、字体、图表、可访问性和交互模式
node skills/ui-ux-pro-max/scripts/run-search.js "fintech trustworthy" --domain color
node skills/ui-ux-pro-max/scripts/run-search.js "loading focus accessibility" --domain ux
node skills/ui-ux-pro-max/scripts/run-search.js "revenue comparison" --domain chart

# 与项目实际技术栈对应的实现建议
node skills/ui-ux-pro-max/scripts/run-search.js "forms navigation responsive" --stack react
```

支持的领域：`style`、`color`、`typography`、`product`、`landing`、`chart`、`ux`、`icons`、`gsap`、`react`、`web`、`google-fonts`。

支持的技术栈：`react`、`nextjs`、`vue`、`svelte`、`astro`、`swiftui`、`react-native`、`flutter`、`nuxtjs`、`nuxt-ui`、`html-tailwind`、`shadcn`、`angular`、`laravel`、`javafx`、`wpf`、`winui`、`avalonia`、`uno`、`uwp`。

## 设计旋钮

仅在需求已说明其必要性时使用：

- `--variance 1-10`：从克制对称到大胆非对称。
- `--motion 1-10`：从微交互到复杂编排。不得因为获得示例就新增动画库或装饰性动效。
- `--density 1-10`：从宽松内容页到高密度仪表盘。

## 交付门槛

- 不用 emoji 作为结构性图标；复用项目的单一图标体系。
- 设计结果必须由 `frontend-quality` 转化为令牌、组件状态、响应式与无障碍契约。
- 用 Visual Companion 或浏览器预览比较主观视觉方向；不要只用文本描述做最终选择。
- 提交前按 `frontend-quality` 的视觉验收清单检查桌面、移动端、加载/空/错误状态和键盘路径。

## 运行环境

`run-search.js` 会自动尝试 `python3`、`python` 和 Windows `py -3` 来运行随技能提供的无第三方依赖搜索器。若三者都不可用，报告缺少 Python 3；不要静默跳过设计检索。
