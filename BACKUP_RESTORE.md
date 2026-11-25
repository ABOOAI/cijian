# 词间 1.13.7 备份与恢复

备份版本：**1.13.7**。源 Site 提交：`99621fe2b44fce4868d5445cb0897f75de7a6fa6`。

## 包含内容

- 完整 HTML、CSS、JavaScript 源码与构建脚本；
- 711 个内置词项、50 句内置句子、60 条固定搭配；
- 四个各 128 道的语境题库；
- 1,049 个预生成 MP3、ECDICT 分片；
- 本机 Kokoro 运行库、量化模型分片和两套声音；
- 账号、云端存储、JSON 导入导出、分页、学情和句子追踪源码；
- 379 项自动测试与可复现的 npm 锁文件。

不包含个人学习记录、账号密码、登录会话、Supabase 服务端密钥、Supabase Auth 用户和服务端数据库内容。旧版 `backups/1.11.3/` 保留不变。

## 从仓库根目录恢复

```bash
npm ci
npm test
npm run build
npm start
```

打开 `http://127.0.0.1:4173`。不要直接用 `file://` 打开 `index.html`。

## 从六个 ZIP 恢复

下载 `backups/1.13.7/` 内全部六个 ZIP，解压到同一个空目录并保留目录结构，然后执行上面的四条命令。六个 ZIP 是独立压缩包，不是专有分卷。

先按 `BACKUP_MANIFEST.json` 校验每个 ZIP 的 SHA-256。清单同时记录字节数、文件数和源 Site 提交。压缩包不含可重新生成的 `dist/`、Git 历史和 `node_modules/`。

## 云端与学习数据恢复

1. 代码恢复后仍连接 `src/supabase-config.js` 指向的现有 Supabase 项目。
2. 公开 publishable key 可以随前端保存；严禁把 service-role key 或用户密码提交到仓库。
3. 若 Supabase 项目本身丢失，仅有本代码仓库不能重建 Auth 用户和实时学习数据；还需要单独的 Supabase 数据库备份。
4. 用户个人进度应从应用设置导出的 JSON 恢复。导入前会校验格式，支持安全合并；覆盖恢复需要明确确认，导入失败不会提交半成品。

## 已完成验证

- 六个 ZIP 可解压且没有重复路径；
- SHA-256 与清单一致；
- 合并恢复后的文件集合与仓库备份集合一致；
- `npm ci` 成功；
- `npm test`：379 / 379 通过；
- `npm run build`：成功，资源校验通过。
