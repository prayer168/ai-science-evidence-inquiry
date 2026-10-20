const app=document.querySelector('#app');
let preferredSize='large';try{preferredSize=localStorage.getItem('asei-reading-size')==='standard'?'standard':'large'}catch{}document.documentElement.dataset.readingSize=preferredSize;document.querySelector('header .pill').outerHTML=sizeSwitcher();
document.fonts.ready.then(()=>{activeReader?.reflow();detailReader?.reflow();playerReader?.reflow()});
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titles={overview:'工作台總覽',inquiry:'關於科學探究',cases:'研究案例庫',tools:'AI 工具箱',lessons:'探究教案',graph:'知識關聯',review:'證據審核筆記'};
let db={},selected='';
const specs={cases:{id:'案例ID',name:'案例名稱',category:'領域分類',description:'研究內容'},tools:{id:'工具ID',name:'工具名稱',category:'工具分類',description:'原理簡述'},lessons:{id:'教材ID',name:'教材名稱',category:'適用學段',description:'研究問題'}};
const storageKey='asei-review-notes-v1';
function readNotes(){try{const notes=JSON.parse(localStorage.getItem(storageKey)||'{}');return notes&&typeof notes==='object'&&!Array.isArray(notes)?notes:{}}catch{return {}}}
function find(id){for(const [kind,s] of Object.entries(specs)){const row=db[kind]?.find(r=>r[s.id]===id);if(row)return {row,kind,name:row[s.name]}}}
function route(){
  let key=location.hash.slice(1)||'overview';const caseId=key.startsWith('case/')?key.slice(5):null;if(caseId)key='cases';if(!titles[key])key='overview';
  const detail=document.querySelector('#detail');if(detail.open)detail.close();
  document.querySelector('#breadcrumb').textContent=titles[key];document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('active',a.hash==='#'+key));
  if(key==='overview')overview();else if(key==='inquiry')inquiry();else if(specs[key])library(key);else if(key==='graph')graph();else review();
  if(caseId&&caseInfo(caseId))caseDetail(caseId);
}
document.addEventListener('click',e=>{const button=e.target.closest('[data-detail]');if(button)detail(button.dataset.detail)});
document.querySelector('#close-dialog').onclick=()=>document.querySelector('#detail').close();
document.querySelector('#detail').addEventListener('close',()=>{detailReader?.destroy();detailReader=null});
window.addEventListener('hashchange',()=>{if(db.cases)route()});
Promise.all(['cases','tools','lessons','relations','case-details'].map(async key=>{const response=await fetch(`data/${key}.json?v=1.8.0`);if(!response.ok)throw Error(key);db[key]=await response.json()})).then(route).catch(()=>{app.innerHTML='<div class="empty">資料載入失敗，請確認網路後重新整理，並使用 HTTP 網址開啟。</div>'});
