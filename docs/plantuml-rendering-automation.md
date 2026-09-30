# PlantUML 图片渲染与 GitHub Actions 自动化

## 内容约定

图表使用 `content/<chapter>/images/<name>.puml` 作为源码，同目录的 `<name>.svg` 作为已提交图片。Markdown 使用 `![图表说明](images/<name>.svg)`。工具文档、嵌入式文档采用同一规则；命令、配置、目录树继续使用代码块。

GitHub 和编辑器直接显示 SVG。网站通过 Vite 的图片 glob 打包 SVG，再由 Markdown 图片组件显示；浏览器无需联系在线 PlantUML 服务。不要新增 PlantUML 代码块或在工具文档中重新引入 Mermaid 流程图。

## 修改与提交

1. 创建或修改语义命名的 `.puml`。
2. 执行 `bash scripts/setup-plantuml.sh` 准备渲染环境。
3. 执行 `npm run render:diagrams`。默认根据文件修改时间跳过已有新图片；完整检查使用 `npm run render:diagrams -- --force`。
4. 将 `.puml`、生成的 `.svg`、Markdown 图片引用一起提交。
5. 执行 `npm run validate:content`、`npm run lint`、`npm run build`，记录真实结果。

渲染器在临时源码中注入 `Noto Sans CJK SC`，不改变 `.puml` 的环境无关内容。中文字体避免字符显示为方框。

## 运行时与缓存

`scripts/setup-plantuml.sh` 集中管理固定版本 PlantUML JAR、固定提交的简体中文字体及其 SHA-256。Assets 缓存在 `.cache/plantuml.jar` 与 `.cache/fonts/`；缓存缺失才下载，命中后仍验证哈希。字体复制到当前用户的字体目录，并刷新该目录的字体索引。Java、Graphviz、fontconfig 已存在时不安装，缺失时才通过 apt 安装。

Actions 缓存键为 `plantuml-runtime-<runner.os>-<setup-plantuml.sh 的内容哈希>`。更新版本、字体、哈希或安装脚本自动产生新键。`actions/setup-node` 同时缓存 npm 下载内容；依赖仍由 `npm ci` 按锁文件安装。缓存可能被 GitHub 淘汰，因此首次运行或缓存丢失时允许重新下载。不要把 JAR 或字体二进制提交到仓库。

## 自动化顺序

`.github/workflows/deploy-pages.yml` 执行以下过程：

1. Checkout → Node 24 / npm 缓存 → `npm ci`。
2. 恢复 PlantUML / 字体缓存 → `bash scripts/setup-plantuml.sh`。
3. 校验已提交内容与图片，拦截缺少 SVG、缺少源码、失效图片引用和嵌入 PlantUML 代码块。
4. `npm run render:diagrams -- --force`，对全部源码做真实渲染，避免 checkout 时间戳造成错误跳过。
5. 再次校验内容 → TypeScript 检查 → `bash scripts/check-cpp-examples.sh`（C++20 编译与行为检查）→ Vite 构建。
6. 无论成功或失败，上传现有 `logs/plantuml-render.log` 为 `plantuml-render-logs` artifact。
7. PR 运行检查但不发布；`main` push 和手动触发在全部检查通过后上传 Pages 产物并部署。

PR 与主分支采用独立并发组；同一分支上的旧运行会取消，不影响主分支发布。生成的 SVG 进入 `dist`，Actions 不自动回写代码仓库。

## 常见故障

| 现象 | 处理 |
| --- | --- |
| `Missing script: render:plantuml` | 使用当前 `package.json` 的 `render:diagrams`，同时清除删除脚本的引用 |
| 图片引用失效或缺少 `.svg` | 本地渲染并提交源图与 SVG；不要依赖 CI 临时生成来掩盖缺图 |
| PlantUML 语法错误 | 下载渲染日志，按失败源码路径修复并重新渲染 |
| 中文方框 | 检查字体缓存、`fc-match 'Noto Sans CJK SC'` 和渲染器注入的字体名 |
| 哈希校验失败 | 清理对应缓存并重新下载；更新版本必须同步更新固定 URL 和真实校验值 |
| 缓存未命中 | 检查 runner OS、脚本哈希与缓存淘汰；重新下载成功即可继续 |
| Build 通过但 Pages 未更新 | 检查 deploy job 与对应 commit；PR 不执行发布 |

本次修复源自图片迁移后 CI 仍调用被移除的 `render:plantuml`，且引用了不存在的 `scripts/plantuml.test.mjs`。以后修改渲染器、npm 命令和文件位置时，必须同步更新 Actions、AGENTS 与本文。
