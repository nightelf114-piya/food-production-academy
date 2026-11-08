from pathlib import Path
import json, re, traceback
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
html_file=root/'食品OEM_ODM生管專業養成學院_通用版_v4.1.html'
results=[]
def record(k,fn):
    try:
        detail=fn()
        results.append({'id':k,'status':'PASS','detail':str(detail or '')})
        print(k,'PASS',str(detail or ''))
    except Exception as e:
        results.append({'id':k,'status':'FAIL','detail':str(e)})
        print(k,'FAIL',str(e))
def verify(c,msg):
    if not c: raise AssertionError(msg)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    ctx=browser.new_context(viewport={'width':1400,'height':1000},accept_downloads=True)
    page=ctx.new_page()
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    file_loaded=False
    try:
        page.goto(html_file.resolve().as_uri(),wait_until='load',timeout=12000)
        file_loaded=True
    except Exception as e:
        print('FILE URL restricted:',str(e)[:200])
        try: page.close()
        except Exception: pass
        page=ctx.new_page()
        page.on('pageerror',lambda e: errors.append(str(e)))
        page.set_content(html_file.read_text(encoding='utf-8'),wait_until='load')
    record('NEUTRAL-01-UI',lambda:verify('學習成果與管理思維' in page.locator('body').inner_text(),'學習模組標題缺少'))
    record('NEUTRAL-02-first',lambda:(page.get_by_role('button',name='開始第一課（推薦）').click(),page.get_by_text('食品 OEM／ODM 與生管的權責',exact=False).first.wait_for()))
    page.screenshot(path=str(root/'01_通用學習首頁.png'),full_page=True)
    record('NEUTRAL-03-help',lambda:(page.get_by_role('button',name='我看不懂').click(),page.get_by_text('這一步該做什麼？').wait_for()))
    record('NEUTRAL-04-lesson',lambda:(page.locator('[data-teach-action="catalog"]').first.click(),page.locator('[data-ac-lesson="m04"]').first.click(),page.get_by_text('BOM 與 MRP：自己算出毛需求與缺口').first.wait_for()))
    page.screenshot(path=str(root/'02_BOM學習畫面.png'),full_page=True)
    record('NEUTRAL-05-workbench',lambda:(page.locator('.nav button[data-nav="erp"]').click(),page.get_by_text('ERP／MRP／APS 觀念實作').wait_for(),verify('通用 ERP' in page.locator('body').inner_text(),'ERP 通用說明未顯示')))
    page.screenshot(path=str(root/'03_ERP通用概念.png'),full_page=True)
    record('NEUTRAL-06-learning',lambda:(page.locator('.nav button[data-nav="learning"]').click(),page.get_by_text('生管日常管理說明範例').wait_for(),verify('生管日常管理說明範例' in page.locator('body').inner_text(),'管理說明範例未顯示')))
    record('NEUTRAL-07-no-error',lambda:verify(not errors,'JS 錯誤: '+repr(errors)))
    if file_loaded:
        def storage():
            page.evaluate("localStorage.setItem('neutral_test_key','verified')")
            page.reload(wait_until='load')
            verify(page.evaluate("localStorage.getItem('neutral_test_key')")=='verified','localStorage 未保留')
            page.evaluate("localStorage.removeItem('neutral_test_key')")
        record('NEUTRAL-08-file-reload-storage',storage)
    else:
        results.append({'id':'NEUTRAL-08-file-reload-storage','status':'UNKNOWN','detail':'file URL 受瀏覽器沙盒限制，無法直接驗證'})
    mctx=browser.new_context(viewport={'width':390,'height':844})
    mob=mctx.new_page()
    if file_loaded: mob.goto(html_file.resolve().as_uri(),wait_until='load')
    else: mob.set_content(html_file.read_text(encoding='utf-8'),wait_until='load')
    record('NEUTRAL-09-mobile',lambda:(verify(mob.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'),'手機頁面水平溢出'),verify('食品生管專業養成學院' in mob.locator('body').inner_text(),'手機畫面標題未顯示')))
    mob.screenshot(path=str(root/'04_手機學習畫面.png'),full_page=True)
    browser.close()
(root/'BROWSER_SMOKE_RESULTS.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print('SUMMARY',sum(x['status']=='PASS' for x in results),'PASS',sum(x['status']=='FAIL' for x in results),'FAIL',sum(x['status']=='UNKNOWN' for x in results),'UNKNOWN')
if any(x['status']=='FAIL' for x in results): raise SystemExit(1)
