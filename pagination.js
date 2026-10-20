/* Measure real rendered content; split at semantic boundaries instead of clipping. */
class ScreenReader {
  constructor(host,sections,{start=0,onPage=()=>{}}={}){
    this.host=host;this.sections=sections;this.index=start;this.onPage=onPage;this.pages=[];
    host.innerHTML='<div class="reader-caption"></div><div class="reading-surface"></div><div class="reader-controls"><button data-reader-prev>← 上一頁</button><select data-reader-jump aria-label="選擇頁面"></select><span class="reader-count" aria-live="polite"></span><button data-reader-next>下一頁 →</button></div>';
    this.surface=host.querySelector('.reading-surface');
    host.querySelector('[data-reader-prev]').onclick=()=>this.go(this.index-1);
    host.querySelector('[data-reader-next]').onclick=()=>this.go(this.index+1);
    host.querySelector('[data-reader-jump]').onchange=e=>this.go(Number(e.target.value));
    this.reflow();
    let pending;this.observer=new ResizeObserver(()=>{cancelAnimationFrame(pending);pending=requestAnimationFrame(()=>{if(this.host.isConnected&&this.surface.clientHeight>0)this.reflow()})});
    this.observer.observe(this.surface);
  }
  fits(page){return page.scrollHeight<=page.clientHeight+2&&page.scrollWidth<=page.clientWidth+2}
  split(el){
    if(el.matches('table,.cycle,.experiment-visual,.sample-chart,.process-diagram,img,svg'))return null;
    const children=[...el.childNodes].filter(n=>n.nodeType===1||n.textContent.trim());
    if(children.length>1){return children.map((node,i)=>{const clone=el.cloneNode(false);clone.append(node.cloneNode(true));if(el.tagName==='OL')clone.start=(Number(el.start)||1)+i;return clone})}
    if(children.length===1&&children[0].nodeType===1){const sub=this.split(children[0]);if(sub)return sub.map(n=>{const clone=el.cloneNode(false);clone.append(n);return clone})}
    const text=el.textContent;
    if(text.length<25||el.querySelector('img,input,textarea,button,select'))return null;
    const mid=Math.ceil(text.length/2),breaks=[...text.matchAll(/[。！？；\n]|\s+/g)].map(m=>m.index+1).filter(i=>i>text.length*.25&&i<text.length*.75);
    const cut=breaks.sort((a,b)=>Math.abs(a-mid)-Math.abs(b-mid))[0]||mid;
    return [text.slice(0,cut),text.slice(cut)].filter(Boolean).map(t=>{const clone=el.cloneNode(false);clone.textContent=t;return clone});
  }
  reflow(){
    const old=this.pages[this.index],anchor=old?.anchor,group=old?.key;
    const stage=this.surface;stage.style.visibility='hidden';this.pages=[];const css=getComputedStyle(stage);this.host.style.setProperty('--panel-space',Math.max(100,stage.clientHeight-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom))+'px');
    // Reserve enough heading space before measuring any topic, including long case titles.
    this.host.querySelector('.reader-caption').innerHTML='<h2>內容分頁</h2>';
    for(const section of this.sections){
      let page=document.createElement('div');page.className='reading-page';stage.replaceChildren(page);
      const queue=section.parts.map((html,i)=>{const t=document.createElement('template');t.innerHTML=html;const wrap=document.createElement('div');wrap.className='reading-unit';wrap.append(t.content);return {node:wrap,anchor:`${section.key}:${i}`,depth:0}});
      let anchors=[];
      const save=()=>{if(page.childElementCount){this.pages.push({key:section.key,title:section.title,subtitle:section.subtitle,html:page.innerHTML,anchor:anchors[0],anchors:[...anchors],meta:section.meta});page=document.createElement('div');page.className='reading-page';stage.replaceChildren(page);anchors=[]}};
      while(queue.length){const item=queue.shift();page.append(item.node);if(this.fits(page)){anchors.push(item.anchor);continue}item.node.remove();if(page.childElementCount){save();queue.unshift(item);continue}
        const pieces=item.depth<14?this.split(item.node):null;
        if(pieces?.length){queue.unshift(...pieces.map(n=>({node:n,anchor:item.anchor,depth:item.depth+1})));continue}
        // Accessibility fallback: unusual zoom/very short screens can scroll; nothing is hidden.
        page.append(item.node);anchors.push(item.anchor);save();
      }
      save();
    }
    if(!this.pages.length)this.pages=[{key:'empty',title:'沒有符合的資料',html:'<p class="empty">請調整搜尋條件。</p>',anchor:'empty',anchors:['empty']}];
    let next=anchor?this.pages.findIndex(p=>p.anchors?.includes(anchor)):-1;if(next<0&&group)next=this.pages.findIndex(p=>p.key===group);
    this.index=Math.max(0,Math.min(next<0?this.index:next,this.pages.length-1));stage.style.visibility='';this.render();
  }
  go(i){if(i<0||i>=this.pages.length)return;this.index=i;this.render()}
  section(key){const i=this.pages.findIndex(p=>p.key===key);if(i>=0)this.go(i)}
  render(){
    const p=this.pages[this.index];this.host.querySelector('.reader-caption').innerHTML=`<h2>${esc(p.title)}</h2>`;
    this.surface.innerHTML=`<div class="reading-page" tabindex="0">${p.html}</div>`;this.surface.scrollTop=0;
    this.host.querySelector('[data-reader-prev]').disabled=this.index===0;
    this.host.querySelector('[data-reader-next]').disabled=this.index===this.pages.length-1;
    this.host.querySelector('[data-reader-jump]').innerHTML=this.pages.map((p,i)=>`<option value="${i}" ${i===this.index?'selected':''}>${i+1}. ${esc(p.title)}</option>`).join('');
    this.host.querySelector('.reader-count').textContent=`${this.index+1} / ${this.pages.length}`;
    watchImages(this.host);this.onPage(p,this.index,this.pages.length);
  }
  destroy(){this.observer.disconnect()}
}
let activeReader=null,detailReader=null,playerReader=null;
function disposeReader(){activeReader?.destroy();activeReader=null}
function screen(title,subtitle,tools=''){
  disposeReader();app.innerHTML=`<div class="screen-shell"><div class="screen-heading"><div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div></div>${tools?`<div class="screen-tools">${tools}</div>`:''}<div class="reader-host"></div></div>`;
  return app.querySelector('.reader-host');
}
function mountSections(host,sections,opts){return new ScreenReader(host,sections,opts)}
function sourcePart(s){return `<a class="source-item" href="${safeUrl(s.url)}" target="_blank" rel="noopener"><span class="tag">${esc(s.type)}</span><strong>${esc(s.title)} ↗</strong><small>${esc(s.note)}</small></a>`}
function caseSections(id){
  const d=caseInfo(id),r=find(id).row,name=r['案例名稱'];
  return [
    {key:`${id}-story`,title:`${name}｜案例故事`,parts:[caseMedia(d),`<p>${esc(d.story)}</p>`,`<blockquote>${esc(d.question)}</blockquote>`]},
    {key:`${id}-ai`,title:`${name}｜AI 如何參與`,parts:[`<div class="flow-strip"><span>資料與問題</span><b>→</b><span>AI 分析／建議</span><b>→</b><span>人工驗證</span></div>`,`<p>${esc(d.method)}</p>`]},
    {key:`${id}-evidence`,title:`${name}｜證據與限制`,parts:[`<section class="evidence-panel"><h3>研究能支持什麼？</h3><p>${esc(d.evidence)}</p></section>`,`<p class="micro-note">內容依來源整理；未完成跨來源撤稿查核或正式核准。</p>`]},
    {key:`${id}-teaching`,title:`${name}｜教學轉化`,parts:[`<span class="tag">本站轉化建議 · 非原研究驗證結果</span>`,...d.steps.map((s,i)=>`<article class="teaching-step"><b>0${i+1}</b><p>${esc(s)}</p></article>`),`<p><b>學生產出：</b>${esc(d.output)}</p>`,...(d.safety?[`<p class="notice">${esc(d.safety)}</p>`]:[])]},
    {key:`${id}-sources`,title:`${name}｜照片與來源`,parts:[...d.sources.map(sourcePart),`<p class="micro-note">圖像權利屬原發布者。<a href="data/cases.json" target="_blank" rel="noopener">查看 V1.6 原始資料</a></p>`]}
  ].map(s=>({...s,meta:{id}}));
}
function inquirySections(){
  const sections=[];
  for(const card of inquiryCards){const template=document.createElement('template');template.innerHTML=card.html;let parts=[];
    if(card.id==='cycle'){
      const cycle=template.content.querySelector('.cycle');cycle.querySelectorAll('[data-step]').forEach(b=>{b.dataset.inquiryJump='cycle-step-'+b.dataset.step;delete b.dataset.step;b.removeAttribute('aria-pressed')});
      sections.push({key:'cycle',title:card.title,parts:[cycle.outerHTML,'<p class="micro-note">探究可往返修正，不是唯一固定順序。點步驟看說明。</p>'],meta:{topic:card.id}});
      inquirySteps.forEach((s,i)=>sections.push({key:'cycle-step-'+i,title:`探究步驟 ${i+1}｜${s[1]}`,parts:[`<div class="step-spotlight"><span>${s[0]}</span><h3>${esc(s[2])}</h3><p>${esc(s[3])}</p></div>`],meta:{topic:'cycle'}}));continue;
    }
    const root=template.content;
    for(const child of [...root.children]){
      if(child.matches('.concept-grid,.core-grid,.cer-flow,.ai-lanes,.mistake-list'))parts.push(...[...child.children].filter(c=>c.matches('article')).map(c=>c.outerHTML));
      else if(child.matches('.tool-accordions'))for(const det of child.children){const summary=det.querySelector('summary');summary?.remove();parts.push(`<article class="tool-sheet"><h3>${esc(summary?.textContent||'教師工具')}</h3>${det.innerHTML}</article>`)}
      else if(child.matches('.compare-grid'))parts.push(...[...child.children].map(c=>c.outerHTML));
      else if(child.matches('ol'))parts.push(...[...child.children].map((li,i)=>`<article class="teaching-step"><b>0${i+1}</b><p>${li.innerHTML}</p></article>`));
      else parts.push(child.outerHTML);
    }
    sections.push({key:card.id,title:card.title,parts,meta:{topic:card.id}});
  }
  sections.push({key:'references',title:'參考來源與使用說明',parts:[...inquirySources.map(([title,url])=>sourcePart({title,url,type:'教育參考',note:'原始機構出版資料'})),'<p>流程、模擬資料與規準為本站教學整理；圖解是網頁示意，非實驗照片。</p>']});
  return sections;
}
