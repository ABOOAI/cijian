# 词间 1.13.7 独立恢复包

本目录中的六个 ZIP 共同组成词间 1.13.7 的完整源码与静态资源备份。它们是可以分别解压的普通 ZIP，不是依赖特定软件的分卷格式。

| 文件 | 内容 |
| --- | --- |
| `part-01-core.zip` | 应用源码、题库、测试、构建脚本和项目说明 |
| `part-02-audio.zip` | 1,049 个预生成 MP3 与许可文件 |
| `part-03-dictionary.zip` | ECDICT 词典分片与许可文件 |
| `part-04-kokoro-runtime.zip` | Kokoro 浏览器运行库、WASM、声音与许可文件 |
| `part-05-kokoro-model-a.zip` | Kokoro 量化模型分片 0–2 |
| `part-06-kokoro-model-b.zip` | Kokoro 量化模型分片 3–5 |

## 恢复

1. 下载本目录全部六个 ZIP。
2. 按 `BACKUP_MANIFEST.json` 校验文件大小和 SHA-256。
3. 将六个 ZIP 解压到同一个空目录，保留目录结构。
4. 在恢复目录执行：

```bash
npm ci
npm test
npm run build
npm start
```

打开 `http://127.0.0.1:4173`。

本备份不包含个人学习记录、账号密码、登录会话或 Supabase 服务端数据。个人进度请另外保存应用设置中导出的 JSON 学习备份。
