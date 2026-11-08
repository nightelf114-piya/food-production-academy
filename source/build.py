from pathlib import Path
src=Path(__file__).parent
root=src.parent
css=(src/'style.css').read_text(encoding='utf-8')+'\n'+(src/'academy.css').read_text(encoding='utf-8')+'\n'+(src/'coach41.css').read_text(encoding='utf-8')+'\n'+(src/'journey42.css').read_text(encoding='utf-8')
engine=(src/'engine.js').read_text(encoding='utf-8')
academy=(src/'academy.js').read_text(encoding='utf-8')
coach=(src/'coach41.js').read_text(encoding='utf-8')
journey=(src/'journey42.js').read_text(encoding='utf-8')
ui=(src/'ui.js').read_text(encoding='utf-8')
html='''<!doctype html><html lang="zh-Hant-TW"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>食品 OEM／ODM 生管專業養成學院 v4.2｜跟班實作版</title><style>'''+css+'''</style></head>
<body><div class="shell"><aside><div class="brand"><div class="logo">◈ 生管養成學院</div><small>食品 OEM／ODM<br>十門核心課程・六級能力・工作週模擬</small></div><div class="asidecaption">由零開始學習</div><nav class="nav" aria-label="主要功能">
<button data-nav="academy" class="active">✦　專業養成課程</button>
<button data-nav="journey">★　完整訂單跟班實作</button>
<button data-nav="overview">◫　今日生管總覽</button>
<button data-nav="orders">▤　訂單與產能排程</button>
<button data-nav="materials">◈　BOM、原物料與庫存</button>
<button data-nav="factories">▦　代工廠與生產進度</button>
<button data-nav="cases">◎　突發事件決策訓練</button>
<button data-nav="issues">☑　事件處理與追蹤</button>
<button data-nav="erp">⇄　ERP 資料概念練習</button>
<button data-nav="learning">✦　學習成果與管理思維</button></nav>
<div class="asidefoot">全系統使用虛構案例資料，未連線任何實際 ERP 或企業系統。僅供學習，不可作為正式排產或食品品質放行依據。<br><span id="saveStatus">此瀏覽器本機儲存</span></div></aside>
<main><header class="toolbar"><div><div class="crumb">FOOD OPERATIONS · PROFESSIONAL ACADEMY V4.2</div><h1 id="pageTitle">食品生管專業養成學院</h1><p id="pageSub">從專業基礎到排程、預防、風險控制與管理判斷。</p></div>
<div class="tools"><label>工作台示範情境<select class="select" id="caseSelect" aria-label="選擇訓練案例"></select></label><label>模擬日期<input class="field" id="simDate" type="date"></label><button class="btn" id="resetCase" title="重置示範情境，不刪除課程進度">重置工作台案例</button><button class="btn" id="helpTop">名詞百科</button><button class="btn danger" id="clearAll">重置全部進度</button></div></header>
<div class="content"><div id="panel"></div><div class="footer">食品 OEM／ODM 生管專業養成 v4.2｜單檔離線可用｜模擬案例與模型均為虛構｜試排不等於正式交貨承諾｜法律要求請核對官方現行規定</div></div></main></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div><script>'''+engine+'''</script><script>'''+academy+'''</script><script>'''+coach+'''</script><script>'''+journey+'''</script><script>'''+ui+'''</script></body></html>'''
file=root/'index.html';file.write_text(html,encoding='utf-8');print('Built',file,len(html),'chars')
