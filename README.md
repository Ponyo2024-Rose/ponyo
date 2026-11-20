# 數光群島｜五年級數學冒險網站

## 檔案說明

| 檔案 | 用途 | 需要修改嗎？ |
|---|---|---|
| `index.html` | 網站主頁 | 不用 |
| `js/config.js` | **所有設定**：島名、建築、遊戲連結、NPC 台詞、班級人數、試算表網址 | ✅ 要 |
| `js/app.js`、`js/art.js`、`js/draw.js` | 地圖、角色與遊戲邏輯 | 不用 |
| `games/` | 放你從 Claude 或 Gemini 複製出來的遊戲（`.html` 檔） | 放遊戲進來 |
| `apps-script/Code.gs` | Google 試算表後台程式（貼到 Apps Script 使用） | 不用 |

## 讓遊戲自動回報「過關」

在遊戲判定過關的地方加上這一行（可以請 Claude 或 Gemini 幫你加）：

```js
window.parent.postMessage({ type: 'shuguang-complete' }, '*');
```

沒有加這一行的遊戲（例如 Padlet Arcade），學生玩完後按「我完成了」即可。

完整的上線步驟請看「數光群島 設定教學」。
