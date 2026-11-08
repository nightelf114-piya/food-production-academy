# TEST REPORT｜v4.2

## 本輪已實際執行

| 測試 | 結果 | 補充 |
|---|---|---|
| 排程／耗料／品質原有 Node 測試 | 18 PASS / 0 FAIL | `source/tests.js`、`ENGINE_TEST_RESULTS.json` |
| 課程原有 Node 測試 | 16 PASS / 0 FAIL | `source/tests_academy.js`、`ACADEMY_TEST_RESULTS.json` |
| v4.2 跟班單元 Node 測試 | 18 PASS / 0 FAIL | `source/tests_journey42.js`、`JOURNEY42_TEST_RESULTS.json` |
| 瀏覽器互動：十一個階段完整走完 | PASS | Chromium + Playwright `set_content`，含答錯、提示與最後驗收 |
| 瀏覽器互動：既有課程可切回 | PASS | 測試沒有發生頁面 JS 錯誤 |
| 瀏覽器互動：手機尺寸入口 | PASS | 390px 寬畫面能使用入口 |
| 問題描述與標籤庫存計算一致 | PASS | 2,100−1,000＝1,100；2,640−1,100＝1,540 |
| 直接用 Windows 瀏覽器 `file://` 重開後的本機儲存 | UNKNOWN | 受測環境阻擋 URL 導覽，未實際驗證 |
| 真實企業 ERP／生產資料串接 | NOT IMPLEMENTED | 設計上不包含此功能 |

實際瀏覽器畫面：`01_跟班實作開始.png`、`02_引導式錯誤教學.png`、`03_完整訂單完成.png`、`04_手機跟班入口.png`。

## 已知教學限制

- 18/16/18 項皆為自動化規則及核心資料驗證，**不能推論學生已具備獨立工作的能力**。
- 新增跟班流程是第一個完整案例，仍需擴充成真正的連續工作週、委外流程和更多非預設情境。
- 因測試環境阻擋本機／HTTP URL 導覽，跨頁重載儲存測試保留 UNKNOWN，不以模擬測試冒稱 PASS。
