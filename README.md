# AI Science Evidence & Inquiry

AI 科學探究研究證據中心 · V1.7 資料探索版

網站：https://prayer168.github.io/ai-science-evidence-inquiry/

## 已提供

- 工作台總覽、19 個研究案例、18 項 AI 工具及 5 份探究教案。
- 關鍵字搜尋、分類篩選、原始來源詳情。
- 33 筆工具／案例／教材關聯及節點篩選。
- 瀏覽器本機審核筆記、儲存與 JSON 匯出。
- 響應式版面與鍵盤可操作的原生表單及對話框。

## 功能界線

本版是靜態網站，不具備 PDF 解析、AI 判讀、跨來源撤稿查核、教材自動生成、身分驗證、正式核准或 Science Portal 發布。資料中的查證狀態沿用原始資料，不代表本網站已完成覆核。本機筆記不會傳送伺服器，清除瀏覽器資料會遺失，請使用匯出備份。

## 本機預覽

使用任一靜態 HTTP 伺服器，在此目錄執行，例如已安裝 Python 時：

```sh
python -m http.server 8765 --bind 127.0.0.1
```

瀏覽 http://127.0.0.1:8765。請勿直接雙擊 HTML，資料載入需要 HTTP。

## 檔案

- `index.html`, `style.css`, `app.js`: 無建置依賴的網站程式。
- `data/`: V1.6 JSON 及原始 Excel 資料。
- `docs/ROADMAP.md`: 後續開發目標。
- `docs/V1.6-original-README.md`: 原資料包說明；其中 Python pipeline 安裝指令不適用此靜態網站。

## 核心原則

AI 協助蒐集與分析；教師負責證據判斷；人工核准後才正式發布。AI 信心不能取代研究可信度判斷。

Do not commit API keys, local databases, full-text research PDFs, or personal information.
