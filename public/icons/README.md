# PWA Icons

## 生成 PNG 图标

使用在线工具将 `icon.svg` 转换为 PNG：

1. 访问 https://cloudconvert.com/svg-to-png
2. 上传 `icon.svg`
3. 分别生成以下尺寸：
   - `icon-192.png` (192x192)
   - `icon-512.png` (512x512)
   - `apple-touch-icon.png` (180x180)

或使用命令行工具（需要安装 ImageMagick）：

```bash
convert icon.svg -resize 192x192 icon-192.png
convert icon.svg -resize 512x512 icon-512.png
convert icon.svg -resize 180x180 apple-touch-icon.png
```
