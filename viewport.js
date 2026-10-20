let carouselIndex=0,inquiryPosition=0,currentLibrary={},reviewStep=0;
function overview(){
  const r=db.cases[carouselIndex],d=caseInfo(r['案例ID']);
  const host=screen('AI 科學探究研究證據中心','資料探索版；AI查核、教材生成與正式發布尚未開放。');
  activeReader=mountSections(host,[{key:'overview',title:'教師研究工作台',parts:[
    `<div class="overview-stats">${[['cases','案例'],['tools','工具'],['lessons','教案'],['relations','關聯']].map(([k,t])=>`<a href="#${k==='relations'?'graph':k}"><strong>${db[k].length}</strong><span>${t}</span></a>`).join('')}</div>`,
    `<article class="featured-carousel"><div class="featured-top"><b>研究案例精選</b><div><button data-carousel="-1" aria-label="上一個精選案例">←</button><span>${carouselIndex+1} / 3</span><button data-carousel="1" aria-label="下一個精選案例">→</button></div></div>${compactCard('cases',r)}<button class="text-button" data-play-cases="featured">▣ 播放精選案例組</button></article>`,
  ]}]);
}
function compactCard(kind,r){const s=specs[kind],id=r[s.id],d=kind==='cases'?caseInfo(id):null;
  return `<article class="library-card"><div class="card-identity">${d?.image?`<a class="card-thumb" target="_blank" rel="noopener" href="${safeUrl(d.image.source)}"><img src="${safeUrl(d.image.url)}" alt="${esc(d.image.caption)}" referrerpolicy="no-referrer"><small>${esc(d.image.kind)} ↗</small></a>`:`<span class="card-glyph" aria-hidden="true">${kind==='cases'?'◎':kind==='tools'?'◇':'▤'}</span>`}<div><span class="tag">${esc(r[s.category])}</span><h3>${esc(r[s.name])}</h3><small>${esc(id)}</small></div></div><p>${esc(r[s.description])}</p><div class="compact-actions"><button class="text-button" data-detail="${esc(id)}">完整內容 ↗</button>${kind==='cases'?`<button class="text-button" data-play-case="${esc(id)}">▣ 講課圖卡</button>`:''}</div></article>`;
}
function library(kind){
  const s=specs[kind],state=currentLibrary[kind]||{query:'',category:'',page:0};currentLibrary[kind]=state;
  const host=screen(titles[kind],'搜尋與分類固定保留，卡片依畫面大小分頁。',`<input id="search" type="search" aria-label="搜尋資料" placeholder="搜尋案例、內容…" value="${esc(state.query)}"><select id="category" aria-label="篩選分類"><option value="">全部分類</option>${[...new Set(db[kind].map(r=>r[s.category]))].map(c=>`<option ${state.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select>${kind==='cases'?'<button class="primary" id="play-results" data-play-cases="results">▣ 播放結果</button>':''}`);
  const update=(reset=true)=>{
    state.query=document.querySelector('#search').value;state.category=document.querySelector('#category').value;
    const q=state.query.trim().toLowerCase(),rows=db[kind].filter(r=>(!q||(Object.values(r).join(' ')+(kind==='cases'?JSON.stringify(caseInfo(r['案例ID'])):'')).toLowerCase().includes(q))&&(!state.category||r[s.category]===state.category));
    if(kind==='cases'){visibleCaseIds=rows.map(r=>r[s.id]);document.querySelector('#play-results').disabled=!rows.length}
    activeReader?.destroy();if(reset)state.page=0;
    activeReader=mountSections(host,[{key:kind,title:`${titles[kind]} · ${rows.length} / ${db[kind].length} 筆`,parts:rows.map(r=>compactCard(kind,r))}],{start:state.page,onPage:(_,i)=>state.page=i});
  };
  document.querySelector('#search').oninput=()=>update();document.querySelector('#category').onchange=()=>update();update(false);
}
function inquiry(){
  const host=screen('關於科學探究','十個主題逐頁閱讀，完整案例拆成多頁。',`<select id="inquiry-topic" aria-label="選擇探究主題">${inquiryCards.map((c,i)=>`<option value="${c.id}">${i+1}. ${esc(c.title)}</option>`).join('')}<option value="references">參考來源</option></select><button class="primary" data-play-inquiry>▣ 講課播放</button>`);
  activeReader=mountSections(host,inquirySections(),{start:inquiryPosition,onPage:(p,i)=>{inquiryPosition=i;document.querySelector('#inquiry-topic').value=p.meta?.topic||p.key}});
  document.querySelector('#inquiry-topic').onchange=e=>activeReader.section(e.target.value);
}
function detail(id){if(caseInfo(id)){caseDetail(id);return}const item=find(id);if(!item)return;
  const sections=Object.entries(item.row).filter(([,v])=>v).map(([k,v],i)=>({key:String(i),title:k,parts:[`<article class="field-sheet"><h3>${esc(k)}</h3><p>${/^https?:\/\//i.test(v)?`<a class="source-link" href="${safeUrl(v)}" target="_blank" rel="noopener">開啟原始來源 ↗</a>`:esc(v)}</p></article>`]}));
  showDetail(item.name,sections);
}
function showDetail(title,sections,id){
  const dlg=document.querySelector('#detail');detailReader?.destroy();
  document.querySelector('#detail-body').innerHTML=`<div class="detail-heading"><h1>${esc(title)}</h1>${id?`<div class="detail-actions">${sizeSwitcher()}<button class="primary" data-play-case="${esc(id)}">▣ 播放案例組</button><button class="text-button" data-copy-case="${esc(id)}">複製連結</button></div>`:''}</div><div class="reader-host"></div><span id="case-share-status" class="micro-note" role="status"></span>`;
  if(!dlg.open)dlg.showModal();
  detailReader=mountSections(dlg.querySelector('.reader-host'),sections);dlg.scrollTop=0;
}
function caseDetail(id){const item=find(id);if(item)showDetail(item.name,caseSections(id),id)}
function graph(){
  if(!find(selected))selected='AISC-0001';const focused=find(selected),links=db.relations.filter(r=>r['來源ID']===selected||r['目標ID']===selected);
  const host=screen('知識關聯','一次聚焦一個節點與直接關聯。',`<select id="graph-select" aria-label="選擇關聯節點">${Object.entries(specs).flatMap(([k,s])=>db[k].map(r=>`<option value="${r[s.id]}" ${r[s.id]===selected?'selected':''}>${esc(r[s.name])}</option>`)).join('')}</select><button class="primary" data-detail="${esc(selected)}">節點詳情</button>`);
  const parts=links.map(r=>{const other=r['來源ID']===selected?r['目標ID']:r['來源ID'],neighbor=find(other);return `<article class="relation-card"><div class="relation-path"><span>${esc(find(r['來源ID'])?.name||r['來源ID'])}</span><b>→</b><span>${esc(find(r['目標ID'])?.name||r['目標ID'])}</span></div><span class="tag">${esc(r['關係'])}</span><p>${esc(r['備註'])}</p><button class="text-button" data-graph-focus="${esc(other)}">聚焦：${esc(neighbor?.name||other)} →</button><button class="text-button" data-detail="${esc(other)}">查看內容 ↗</button></article>`});
  activeReader=mountSections(host,[{key:selected,title:`${focused.name} · ${links.length} 筆直接關聯`,parts:parts.length?parts:['<p class="empty">目前沒有這個節點的直接關聯，請選擇其他節點。</p>']}]);
  document.querySelector('#graph-select').onchange=e=>{selected=e.target.value;graph()};
}
let reviewId='AISC-0001',reviewDrafts={};
const reviewFields=['claim','evidence','uncertainty','verdict'];
function draftFor(id){if(!reviewDrafts[id]){let local={};try{local=JSON.parse(localStorage.getItem('asei-review-drafts-v2')||'{}')}catch{}reviewDrafts[id]={...(readNotes()[id]||{}),...(local[id]||{})}}return reviewDrafts[id]}
function persistDraft(){try{localStorage.setItem('asei-review-drafts-v2',JSON.stringify(reviewDrafts));return true}catch{return false}}
function review(){
  disposeReader();const note=draftFor(reviewId),names=['選擇案例','待查核主張','原文證據','限制與不確定性','審閱狀態','儲存與匯出'];
  app.innerHTML=`<div class="screen-shell review-shell"><div class="screen-heading"><div><h1>證據審核筆記</h1><p>本機草稿保留輸入；正式核准與發布尚未開放。</p></div></div><div class="review-progress">${names.map((n,i)=>`<button data-review-step="${i}" class="${i===reviewStep?'current':''}" aria-label="步驟${i+1}：${n}">${i+1}<span>${n}</span></button>`).join('')}</div><form id="review-form" class="review-step-form"><div class="review-step-body"><h2>${reviewStep+1}. ${names[reviewStep]}</h2>${reviewStep===0?`<label for="case-id">研究案例</label><select id="case-id">${db.cases.map(r=>`<option value="${r['案例ID']}" ${r['案例ID']===reviewId?'selected':''}>${esc(r['案例名稱'])}</option>`).join('')}</select><div class="notice">筆記只存在此瀏覽器。換步驟保留草稿；清除瀏覽器資料會遺失，請定期匯出。</div>`:reviewStep<4?`<p class="review-case-name">${esc(find(reviewId).name)}</p><label for="review-value">${names[reviewStep]}</label><textarea id="review-value" aria-label="${names[reviewStep]}" placeholder="記錄你的判讀與原始資料來源…">${esc(note[reviewFields[reviewStep-1]]||'')}</textarea>`:reviewStep===4?`<label for="review-verdict">個人審閱狀態</label><select id="review-verdict">${['待確認','需補充證據','已完成個人覆核（未正式核准）'].map(v=>`<option ${note.verdict===v?'selected':''}>${v}</option>`).join('')}</select><div class="notice">Crossref／OpenAlex／PubMed 尚未查詢。個人覆核不是正式核准。</div>`:`<p class="review-case-name">${esc(find(reviewId).name)}</p><div class="completion-list">${reviewFields.slice(0,3).map((k,i)=>`<p><b>${names[i+1]}</b><span>${note[k]?.trim()?`已填寫 ${note[k].length} 字`:'尚未填寫'}</span></p>`).join('')}<p><b>狀態</b><span>${esc(note.verdict||'待確認')}</span></p></div><div class="save-actions"><button class="primary" type="submit">儲存本機筆記</button><button class="button secondary" type="button" id="export">匯出已儲存筆記 ↓</button></div>`}<p class="status" id="save-status" role="status"></p></div><div class="review-controls"><button type="button" data-review-step="${reviewStep-1}" ${reviewStep===0?'disabled':''}>← 上一步</button><span>${reviewStep+1} / ${names.length}</span><button type="button" data-review-step="${reviewStep+1}" ${reviewStep===5?'disabled':''}>下一步 →</button></div></form></div>`;
  const input=app.querySelector('#review-value');if(input)input.oninput=()=>{note[reviewFields[reviewStep-1]]=input.value;const saved=persistDraft();app.querySelector('#save-status').textContent=saved?'草稿已保存在本機。':'草稿保留於目前工作階段，瀏覽器拒絕儲存，請完成後匯出。'};
  const select=app.querySelector('#review-verdict');if(select)select.onchange=()=>{note.verdict=select.value;persistDraft()};
  const choice=app.querySelector('#case-id');if(choice)choice.onchange=()=>{reviewId=choice.value;review()};
  app.querySelector('#review-form').onsubmit=e=>{e.preventDefault();try{const notes=readNotes();notes[reviewId]={...note,verdict:note.verdict||'待確認',savedAt:new Date().toISOString()};localStorage.setItem(storageKey,JSON.stringify(notes));app.querySelector('#save-status').textContent='已儲存。尚未正式核准或發布。'}catch{app.querySelector('#save-status').textContent='儲存失敗，請匯出目前草稿備份。';downloadText('review-draft.json',JSON.stringify(reviewDrafts,null,2),'application/json')}};
  const exportButton=app.querySelector('#export');if(exportButton)exportButton.onclick=()=>downloadText('science-review-notes.json',JSON.stringify(readNotes(),null,2),'application/json');
}
function startDeck(items){
  if(!items.length)return;playOrigin=document.activeElement;const dlg=document.querySelector('#detail');if(dlg.open)dlg.close();
  deck=items;const sections=(items[0].type==='inquiry'?inquirySections():items.flatMap(e=>caseSections(e.id)));const player=ensurePlayer();playerReader?.destroy();
  player.innerHTML=`<div class="player-toolbar"><strong>SCIENCE INQUIRY <span>講課模式</span></strong><div>${sizeSwitcher()}<button id="player-fullscreen">${document.fullscreenElement?'⛶ 退出全螢幕':'⛶ 全螢幕'}</button><button id="player-close">✕ 結束播放</button></div></div><div class="reader-host"></div><div class="player-hint" role="status">← → 換頁 · Home / End 首尾頁 · Esc 退出 · 內容依畫面分頁</div>`;
  if(!player.open)player.showModal();
  playerReader=mountSections(player.querySelector('.reader-host'),sections,{onPage:(_,i)=>slideIndex=i});
  player.querySelector('#player-close').onclick=()=>player.close();
  player.querySelector('#player-fullscreen').onclick=async()=>{try{if(document.fullscreenElement){await document.exitFullscreen();playerOwnsFullscreen=false}else{await document.documentElement.requestFullscreen();playerOwnsFullscreen=true}}catch{player.querySelector('.player-hint').textContent='此瀏覽器未允許全螢幕；仍可使用滿版分頁模式。'}};
  player.focus();
}
function moveSlide(n){playerReader?.go(playerReader.index+n)}
function renderSlide(){playerReader?.go(slideIndex)}
document.addEventListener('click',e=>{
  const carousel=e.target.closest('[data-carousel]');if(carousel){carouselIndex=(carouselIndex+Number(carousel.dataset.carousel)+3)%3;overview()}
  const topic=e.target.closest('[data-inquiry-jump]');if(topic){const player=document.querySelector('#player');(player?.open?playerReader:activeReader)?.section(topic.dataset.inquiryJump)}
  const focus=e.target.closest('[data-graph-focus]');if(focus){selected=focus.dataset.graphFocus;graph()}
  const step=e.target.closest('[data-review-step]');if(step&&!step.disabled){reviewStep=Number(step.dataset.reviewStep);review()}
});
document.addEventListener('keydown',e=>{
  if(e.target.matches('input,textarea,select,button,a'))return;
  const player=document.querySelector('#player');if(player?.open)return;
  const reader=document.querySelector('#detail').open?detailReader:activeReader;if(!reader)return;
  if(e.key==='ArrowRight'){e.preventDefault();reader.go(reader.index+1)}else if(e.key==='ArrowLeft'){e.preventDefault();reader.go(reader.index-1)}
});

function sizeSwitcher(){return `<div class="size-switch" role="group" aria-label="閱讀字級"><button data-reading-size="standard" aria-pressed="${document.documentElement.dataset.readingSize==='standard'}">標準字</button><button data-reading-size="large" aria-pressed="${document.documentElement.dataset.readingSize!=='standard'}">大字</button></div>`}
function applyReadingSize(size){document.documentElement.dataset.readingSize=size;try{localStorage.setItem('asei-reading-size',size)}catch{}document.querySelectorAll('[data-reading-size]').forEach(b=>{if(b.tagName==='BUTTON')b.setAttribute('aria-pressed',String(b.dataset.readingSize===size))});requestAnimationFrame(()=>{activeReader?.reflow();detailReader?.reflow();playerReader?.reflow()})}
document.addEventListener('click',e=>{const b=e.target.closest('button[data-reading-size]');if(b)applyReadingSize(b.dataset.readingSize)});
