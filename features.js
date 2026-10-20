let visibleCaseIds=[],deck=[],slideIndex=0,playOrigin=null,playerOwnsFullscreen=false;
function caseInfo(id){return db['case-details']?.[id]}
function safeUrl(u){try{const url=new URL(u,location.href);return ['http:','https:'].includes(url.protocol)?esc(url.href):'#'}catch{return '#'}}
function downloadText(name,body,type='text/plain;charset=utf-8'){const url=URL.createObjectURL(new Blob([body],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function caseMedia(d,compact=false){if(!d?.image){const v=d?.diagram;return `<div class="process-diagram"><div class="diagram-nodes">${v?v.labels.map((t,i)=>`<div><span aria-hidden="true">${esc(v.icons[i])}</span><b>${esc(t)}</b></div>`).join('<em aria-hidden="true">→</em>'):'<span>觀察 → 分析 → 覆核</span>'}</div><small>教學流程示意 · 非研究實測圖</small><a href="${safeUrl(d.sources[0].url)}" target="_blank" rel="noopener">原站照片／影音與完整內容 ↗</a></div>`;}const im=d.image;return `<figure class="case-figure ${compact?'compact':''}"><a href="${safeUrl(im.source)}" target="_blank" rel="noopener"><img src="${safeUrl(im.url)}" alt="${esc(im.caption)}" loading="lazy" referrerpolicy="no-referrer"></a><figcaption><span class="tag">${esc(im.kind)}</span> ${esc(im.caption)}<small>${esc(im.credit)} · <a href="${safeUrl(im.source)}" target="_blank" rel="noopener">圖像出處 ↗</a></small></figcaption><div class="image-unavailable" hidden>圖片暫時無法載入，請由「圖像出處」查看原站。</div></figure>`}
function watchImages(root=document){root.querySelectorAll('.case-figure img').forEach(img=>{const failed=()=>{img.hidden=true;const msg=img.closest('figure').querySelector('.image-unavailable');if(msg)msg.hidden=false};img.addEventListener('error',failed,{once:true});if(img.complete&&img.naturalWidth===0)failed()})}
function ensurePlayer(){
 let player=document.querySelector('#player');if(player)return player;
 player=document.createElement('dialog');player.id='player';player.setAttribute('aria-label','講課圖卡播放');document.body.append(player);
 player.addEventListener('close',()=>{playerReader?.destroy();playerReader=null;if(playerOwnsFullscreen&&document.fullscreenElement)document.exitFullscreen().catch(()=>{});playerOwnsFullscreen=false;playOrigin?.focus?.()});
 player.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select,button,a'))return;const delta={ArrowRight:1,ArrowLeft:-1,PageDown:1,PageUp:-1};if(e.key in delta){e.preventDefault();moveSlide(delta[e.key])}else if(e.key==='Home'){e.preventDefault();playerReader?.go(0)}else if(e.key==='End'){e.preventDefault();playerReader?.go(playerReader.pages.length-1)}});
 return player;
}
document.addEventListener('click',e=>{
const play=e.target.closest('[data-play-case]');if(play)startDeck([{type:'case',id:play.dataset.playCase}]);
const all=e.target.closest('[data-play-cases]');if(all)startDeck((all.dataset.playCases==='featured'?db.cases.slice(0,3).map(r=>r['案例ID']):visibleCaseIds).map(id=>({type:'case',id})));
if(e.target.closest('[data-play-inquiry]'))startDeck(inquiryCards.map((_,index)=>({type:'inquiry',index})));
const step=e.target.closest('[data-step]');if(step)selectInquiryStep(Number(step.dataset.step),step.closest('dialog')||document);
const scroll=e.target.closest('[data-scroll]');if(scroll){e.preventDefault();document.getElementById(scroll.dataset.scroll)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})}
const template=e.target.closest('[data-template]');if(template)downloadTemplate(template.dataset.template);
const share=e.target.closest('[data-copy-case]');if(share){const url=new URL(location.href);url.hash='case/'+share.dataset.copyCase;navigator.clipboard?.writeText(url.href).then(()=>{document.querySelector('#case-share-status').textContent='已複製可直接開啟此案例的連結。'}).catch(()=>{document.querySelector('#case-share-status').textContent='請複製此連結：'+url.href});if(!navigator.clipboard)document.querySelector('#case-share-status').textContent='請複製此連結：'+url.href}
const search=e.target.closest('[data-case-search]');if(search){e.preventDefault();location.hash='cases';setTimeout(()=>{const input=document.querySelector('#search');if(input){input.value=search.dataset.caseSearch;input.dispatchEvent(new Event('input'))}},0)}
});

document.addEventListener('fullscreenchange',()=>{const b=document.querySelector('#player-fullscreen');if(b)b.textContent=document.fullscreenElement?'⛶ 退出全螢幕':'⛶ 全螢幕';if(!document.fullscreenElement)playerOwnsFullscreen=false});
