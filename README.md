# 词间 · 英语学习中心

当前备份版本：**1.13.7**（线上源码快照日期：2026-11-22）。

- 在线版本：https://cijian-grade7-20261003.linwanggoo.chatgpt.site/
- GitHub 备份：https://github.com/ABOOAI/cijian
- 旧版 1.11.3 备份继续保留在 `backups/1.11.3/`
- 当前 1.13.7 独立恢复包位于 `backups/1.13.7/`

## 1.13.7 主要能力

- 必须注册登录；每个账号使用独立的 Supabase 云端学习记录。
- 711 个内置词项：289 个教材单元词项，422 个小学词汇、数词、月份和星期词项。
- 单词记忆、翻译辨义、听力辨义、听写、默写、固定搭配与双层间隔复习。
- 句子中心、50 句内置句子、自定义句子、句子记忆追踪和句子五种练习。
- 搭配与语境、阅读理解、完形填空、句子讲解各 128 道题，共 512 道。
- 掌握词四项自主复习、单元循环学习、今日学情、分页和完成后再学一遍。
- JSON 学习备份导出、合并或覆盖恢复；包含自定义内容、进度、排期、掌握状态、错题、学情、设置和未完成练习。
- 所有朗读入口使用 Kokoro 美音；内置音频随项目提供，自定义内容由浏览器本机 Kokoro 生成。

## 仓库内容

- `src/`：应用、账号、云端存储、JSON 备份、学习逻辑与题库。
- `audio/`：1,049 个预生成 MP3 与许可说明。
- `vendor/`：本机 Kokoro 运行库、模型分片、声音与来源说明。
- `dictionary/`：ECDICT 分片与许可。
- `tests/`：379 项自动测试所需源码。
- `backups/1.13.7/`：六个独立 ZIP、SHA-256 清单与恢复说明。
- `SITE_SOURCE_HISTORY.md`：原 Site 源码中的完整开发与版本记录。
- `SOURCE_HISTORY.md`：1.11.3 以前的历史记录。

## 本地验证

建议使用 Node.js 22 LTS 或更新的受支持版本：

```bash
npm ci
npm test
npm run build
npm start
```

打开 `http://127.0.0.1:4173`。构建结果写入 `dist/`，不纳入 Git 备份。

## 数据边界

本仓库备份应用源码、静态资源、测试和本机 Kokoro 模型，不包含任何用户密码、会话、服务端密钥或个人学习记录。浏览器端 Supabase 配置只有公开项目地址与 publishable key；授权依赖 Supabase Row Level Security。

个人学习数据应在应用设置中使用“导出学习备份”另行保存。恢复代码不会自动恢复 Supabase Auth 用户或云端 `learning_backups` 表中的实时数据。

完整恢复与校验步骤见 [BACKUP_RESTORE.md](BACKUP_RESTORE.md)。
