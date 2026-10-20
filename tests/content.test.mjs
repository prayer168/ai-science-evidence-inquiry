import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=n=>JSON.parse(readFileSync(new URL('../data/'+n+'.json',import.meta.url),'utf8').replace(/^\uFEFF/,''));
const cases=read('cases'),details=read('case-details');
test('Every existing case has substantive narrative, teaching steps and traceable sources',()=>{
  assert.equal(Object.keys(details).length,cases.length);
  for(const r of cases){const d=details[r['案例ID']];assert.ok(d,r['案例ID']);for(const k of ['story','method','evidence','question','output'])assert.ok(d[k]?.length>10,k+' '+r['案例ID']);assert.equal(d.steps.length,3);assert.ok(d.sources.length);for(const s of d.sources){assert.equal(new URL(s.url).protocol,'https:');assert.ok(s.note)}}
});
test('Local case images exist; remote images always have provenance and captions',()=>{
  for(const d of Object.values(details)){if(!d.image)continue;for(const k of ['url','source','credit','caption','kind'])assert.ok(d.image[k]);if(d.image.url.startsWith('assets/'))assert.ok(readFileSync(new URL('../'+d.image.url,import.meta.url)).length>1000);assert.equal(new URL(d.image.source).protocol,'https:')}
});
test('Critical context prevents age, causality and simulation overclaims',()=>{
  assert.match(details['AISC-0003'].evidence,/國中生/);assert.match(details['AISC-0006'].evidence,/沒有國小/);assert.match(details['AISC-0009'].evidence,/正負一級/);
  const inquiry=readFileSync(new URL('../inquiry.js',import.meta.url),'utf8');assert.match(inquiry,/數據全為教學模擬/);assert.match(inquiry,/不是所有研究/);assert.match(inquiry,/不高於40°C/);
});
test('All five teaching templates export editable content without invented results',()=>{
  const downloads=[];
  const context=vm.createContext({downloadText:(name,body,type)=>downloads.push({name,body,type})});
  vm.runInContext(readFileSync(new URL('../inquiry.js',import.meta.url),'utf8'),context);
  for(const key of ['question','variables','records','cer','rubric'])vm.runInContext(`downloadTemplate('${key}')`,context);
  assert.equal(downloads.length,5);
  for(const d of downloads){assert.match(d.name,/\.md$/);assert.ok(d.body.length>60);assert.match(d.type,/markdown/)}
  assert.match(downloads[2].body,/實測／模擬/);
  assert.match(downloads[4].body,/總分8分/);
});
