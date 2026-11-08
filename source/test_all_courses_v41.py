from playwright.sync_api import sync_playwright
from pathlib import Path
import json,traceback
root=Path(__file__).resolve().parent.parent
html=(root/'食品OEM_ODM生管專業養成學院_通用版_v4.1.html').read_text()
results=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 pg=b.new_page(viewport={'width':1366,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
 pg.set_content(html);pg.locator('[data-teach-welcome=start]').click()
 for l in range(1,11):
  lid=f'm{l:02}'
  try:
   if l!=1:
    pg.locator('[data-teach-action=catalog]').first.click();pg.locator(f'[data-ac-lesson="{lid}"]').first.click()
   for phase in [1,2]:pg.locator('[data-teach-stage=next]').click()
   pg.locator('#coach-inspect-0').click();pg.locator('#coach-inspect-1').click()
   pg.locator('[data-teach-stage=next]').click()
   typ=pg.evaluate('(id)=>window.ACADEMY.LESSONS.find(x=>x.id===id).type',lid)
   answer=pg.evaluate('(id)=>{const A=window.ACADEMY;const x=A.LESSONS.find(x=>x.id===id);return x.answer(window.__PC_DEMO__.getState(),window.__PC_DEMO__.getPlan())}',lid)
   if typ=='number':pg.locator('#coach-answer').fill(str(answer))
   else:pg.locator(f'#coachPractice input[value="{answer}"]').check()
   pg.locator('#coach-reason').fill('我會確認目前訂單資料以及應該注意的限制，遇到不確定事項會再找負責人確認。')
   pg.locator('#coachPractice button[type=submit]').click()
   pg.locator('#coachVariant').wait_for(timeout=4000)
   v=pg.evaluate('(id)=>{const A=window.ACADEMY,PC=window.__PC_DEMO__;const x=A.__coachTest.variants[id];return {type:x.type,answer:x.answer(PC.getState(),PC.getPlan())}}',lid)
   if v['type']=='number':pg.locator('#coach-variant-answer').fill(str(v['answer']))
   else:pg.locator(f'#coachVariant input[value="{v["answer"]}"]').check()
   pg.locator('#coachVariant button[type=submit]').click()
   pg.get_by_text('變化題通過').wait_for(timeout=4000)
   pg.locator('[data-teach-stage=next]').click()
   pg.get_by_text('資深生管主管講評').wait_for(timeout=4000)
   pg.locator('[data-teach-stage=next]').click()
   pg.locator('#coach-transfer').fill('我會先確認工作台的訂單與品質狀態，再與採購、品保或業務確認可行方案，並排定下次追蹤時間。')
   pg.locator('#coachTransfer button[type=submit]').click()
   pg.get_by_text('此課已記錄完成').wait_for(timeout=4000)
   results.append({'lesson':lid,'result':'PASS','details':'all six phases + variation + saved completion'});print('PASS',lid)
  except Exception as e:
   results.append({'lesson':lid,'result':'FAIL','details':str(e)[:500]});print('FAIL',lid,repr(e))
   try:pg.screenshot(path=str(root/f'failed_{lid}.png'))
   except:pass
 print('DONES',pg.evaluate('window.__PC_DEMO__.getAcademy().done'), 'JS errors',errs)
 b.close()
(root/'ALL_COURSES_V41_RESULTS.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
