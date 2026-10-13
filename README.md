# 词间英语学习中心

完整可开发项目，应用版本 1.11.3。源码展开自已发布版本 fbe2b6c1372c491d81daff42cb42556b5f774b5e。

## 开发与运行

建议使用 Node.js 22 LTS 或更新的受支持版本。核心运行无外部 npm 依赖。

    npm ci
    npm test
    npm run build
    npm start

打开 http://127.0.0.1:4173 。dist 是可托管的静态构建；不要直接 file:// 打开。

## 目录

- src：应用逻辑、711词词库、句子与搭配题库
- audio：全部1,023个静态MP3及许可
- dictionary：词典数据和许可
- tests：核心测试及可选DOM/浏览器测试
- backups/1.11.3：原始完整快照、校验清单和恢复说明

测试使用锁定的jsdom开发依赖。先执行npm ci；浏览器测试另需可用Chromium。应用本身没有npm运行时依赖。

学习进度和自定义内容保存在浏览器；切换域名不会自动迁移。自定义朗读依赖设备语音，本地翻译取决于浏览器支持。没有后台账号或付费API。

公开仓库不包含密码、令牌或个人学习进度。历史版本说明见SOURCE_HISTORY.md。本站使用 GitHub Pages 的 main 分支根目录发布；.nojekyll 保留静态资源原样。更新 main 后 GitHub 自动构建发布，无需自定义高权限部署工作流。

## 访问

GitHub Pages：https://abooai.github.io/cijian/

原站：https://cijian-grade7-20261003.linwanggoo.chatgpt.site （独立保留；本仓库更新不会自动更新原站）。

两处地址属于不同域名，学习进度各保存在对应浏览器站点存储中，不自动互通。应用版本仍为 1.11.3，本次只整理开发仓库与新增托管地址。

## DOM 验证

    mkdir -p evidence
    for file in tests/dom-*.mjs; do node "$file"; done

以上循环适用于 Bash。可单独执行 node tests/dom-xxx.mjs；先建立 evidence 目录保存测试报告。

