import assert from 'node:assert/strict';
import { readFileSync,writeFileSync,existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const data=JSON.parse(readFileSync(`${root}evidence/measurements.json`,'utf8'));
const q=(xs,p=.5)=>[...xs].sort((a,b)=>a-b)[Math.ceil((xs.length-1)*p)];
const ms=n=>(n/1000).toFixed(3),pct=n=>(n*100).toFixed(1);
const rows=[];const line=s=> { rows.push(s);console.log(s); };
assert.equal(data.commit,'99eee23e12ee78428d9435b7d4d74f736da96118');
for(const s of data.sources) { assert.match(s.sha256,/^[0-9a-f]{64}$/);assert.ok(s.url.includes(data.commit)); }
line(`Source: ${data.repository} @ ${data.commit}`);
line('Verification scope: archived data and recorded successful traces; no new GPU timing');
line('');line('| host待機数 | job p50 ms | GPU区間の合計 p50 ms | 完了後のscalar読取 p50 µs |');
line('|---:|---:|---:|---:|');
const signatures=new Set(),inputs=new Set();
for(const r of data.cooperation) {
  inputs.add(r.inputHash);
  for(const t of r.trials) {assert.equal(t.dispatches,63);signatures.add(t.dispatchSignature);}
  const waits=r.trials[0].hostWaits;assert.ok(r.trials.every(t=>t.hostWaits===waits));
  line(`| ${waits} | ${ms(q(r.trials.map(t=>t.jobUs)))} | ${ms(q(r.trials.map(t=>t.gpuUs)))} | ${q(r.trials.map(t=>t.cpuReadUs)).toFixed(3)} |`);
}
assert.equal(signatures.size,1);assert.equal(inputs.size,1);
let traces=0;
line('');line('| 出力 | slot | native batch p50 ms | API p50 ms | Metal保持容量 MiB |');
line('|---|---:|---:|---:|---:|');
for(const r of data.scheduling) {
  for(const trial of r.trials) {
    const previous=new Map();
    for(const f of trial.traces) {
      assert.ok(f.gpuCompletedUs<=f.consumeBeginUs&&f.consumeBeginUs<=f.consumeEndUs);
      if(previous.has(f.slot)) assert.ok(previous.get(f.slot)<=f.prepareBeginUs,'slot reused before CPU consumption');
      previous.set(f.slot,f.consumeEndUs);traces++;
    }
  }
  if(r.maxInFlight===1||r.maxInFlight===3)
    line(`| ${r.output} | ${r.maxInFlight} | ${ms(q(r.trials.map(t=>t.nativeUs)))} | ${ms(q(r.trials.map(t=>t.apiUs)))} | ${(Math.max(...r.trials.map(t=>t.peakBytes))/1048576).toFixed(2)} |`);
}
line(`Recorded ownership traces: ${traces}, reuse follows CPU consumption`);
assert.equal(new Set([...data.compactBefore,...data.compactAfter].map(r=>r.inputHash)).size,1);
line('');line('| CPU実装の段階 | CPU best ms | GPU copy込み ms | CPU / GPU |');
line('|---|---:|---:|---:|');
for(const [label,group] of [['分岐あり・試行1',data.compactBefore],['分岐なし・試行5',data.compactAfter]]) {
  assert.ok(group.every(r=>r.verified));assert.equal(new Set(group.map(r=>r.inputHash)).size,1);
  const cpu=Math.min(...group.filter(r=>r.mode.startsWith('cpu')).map(r=>q(r.samples))),gpu=q(group.find(r=>r.mode==='gpu-upload').samples);
  line(`| ${label} | ${ms(cpu)} | ${ms(gpu)} | ${(cpu/gpu).toFixed(2)} |`);
}

function fit(c,thresholds) {
  const controls=c.evaluations.filter(r=>r.variant!=='auto'),automatic=c.evaluations.filter(r=>r.variant==='auto');
  assert.ok(c.evaluations.every(r=>r.verified));
  for(const r of c.evaluations) assert.ok(Number.isFinite(r.serviceUs)&&r.serviceUs>0&&Number.isFinite(r.apiUs)&&r.apiUs>0);
  assert.equal(new Set(c.evaluations.map(r=>`${r.checksum}/${r.resultCount}`)).size,1);
  const modes=[...new Set(controls.map(r=>r.mode))],costs=Object.fromEntries(modes.map(m=>[m,q(controls.filter(r=>r.mode===m).map(r=>r.serviceUs))]));
  const apis=Object.fromEntries(modes.map(m=>[m,q(controls.filter(r=>r.mode===m).map(r=>r.apiUs))]));
  assert.ok(modes.every(m=>controls.filter(r=>r.mode===m).length===automatic.length));
  const best=Math.min(...Object.values(costs)),competitive=modes.filter(m=>costs[m]<=best*(1+thresholds.relativeTolerance)+thresholds.absoluteToleranceUs);
  const steady=automatic.filter(r=>!['calibrating','explore','queue'].includes(r.reason));
  return {count:automatic.length,steadyCount:steady.length,steadyGood:steady.filter(r=>competitive.includes(r.mode)).length,
    good:automatic.filter(r=>competitive.includes(r.mode)).length,
    regret:automatic.reduce((a,r)=>a+Math.max(0,costs[r.mode]-best),0)/(automatic.length*best),
    auto:q(automatic.map(r=>r.apiUs)),cpu:Math.min(...modes.filter(m=>m.startsWith('cpu')).map(m=>apis[m])),
    gpu:apis[modes.find(m=>m.startsWith('gpu'))],competitive};
}
const summaries=[];let decisions=0,steady=0,good=0,allGood=0;
line('');line('| ケース | CPU best ms | GPU ms | auto ms | 定常 fit |');
line('|---|---:|---:|---:|---:|');
for(const c of data.fitCurrent.cases) {
  if(c.spec.distribution!=='hot') assert.notEqual(c.inputHash,c.trainingHash);
  const s=fit(c,data.fitCurrent.thresholds);assert.equal(s.count,96);assert.equal(s.steadyGood,s.steadyCount);
  assert.ok(s.regret<=.15&&s.auto<=Math.min(s.cpu,s.gpu)*1.25+20);
  summaries.push({name:c.name,...s});decisions+=s.count;steady+=s.steadyCount;good+=s.steadyGood;allGood+=s.good;
  line(`| ${c.name} | ${ms(s.cpu)} | ${ms(s.gpu)} | ${ms(s.auto)} | ${pct(s.steadyGood/s.steadyCount)}% |`);
}
line(`Fit: ${summaries.length} cases, ${decisions} automatic decisions, ${good}/${steady} steady competitive choices`);
line(`All decisions: ${allGood}/${decisions}; max estimated regret ${pct(Math.max(...summaries.map(s=>s.regret)))}%`);
line('');
for(const [name,dataset] of [['trial2/merkle',data.fitFailure],['trial3/compact',data.fitAggressive]]) {
  const s=fit(dataset.cases[0],dataset.thresholds);assert.equal(dataset.passed,false);
  line(`Failure ${name}: steady fit ${pct(s.steadyGood/s.steadyCount)}%, estimated regret ${pct(s.regret)}%`);
}

const labels={'tea-small':'TEA 小','tea-large':'TEA 大','tea-resident':'TEA 常駐','dependent-walk':'単一鎖',compact:'圧縮',
  'histogram-hot':'hot 集計','histogram-balanced':'常駐集計',merkle:'Merkle'};
const figure={
  $schema:'https://vega.github.io/schema/vega-lite/v6.json',width:300,height:260,
  title:{text:'GPU / CPU の API 時間比',subtitle:'破線の左で GPU が速い',fontSize:16,subtitleFontSize:13},
  data:{values:summaries.map(s=>({name:s.name,label:labels[s.name],ratio:s.gpu/s.cpu,faster:s.gpu<s.cpu?'GPUが速い':'CPUが速い'}))},
  layer:[{mark:{type:'rule',strokeDash:[5,4],color:'#64748b'},encoding:{x:{datum:1}}},
    {mark:{type:'point',filled:true,size:110},encoding:{
      x:{field:'ratio',type:'quantitative',scale:{type:'log',domain:[.25,32]},axis:{title:'同じ処理の CPU best = 1',values:[.25,.5,1,2,4,8,16,32],format:'~g'}},
      y:{field:'label',type:'nominal',sort:summaries.map(s=>labels[s.name]),axis:{title:null,labelLimit:140}},
      color:{field:'faster',type:'nominal',scale:{domain:['GPUが速い','CPUが速い'],range:['#1d4ed8','#b45309']},legend:null},
      tooltip:[{field:'name'},{field:'ratio',format:'.2f'}]}}],
  config:{background:'white',axis:{labelFontSize:14,titleFontSize:14},view:{stroke:null}}
};
const figureFacts={labels:['GPU / CPU の API 時間比','破線の左で GPU が速い','同じ処理の CPU best = 1',...Object.values(labels)],forbidden:[]};
const ownershipFacts={labels:['CPU 準備','GPU 実行','CPU 消費','再利用可'],edges:['prepare->gpu','gpu->consume','consume->reuse'],forbidden:['GPU完了で再利用']};
function generated(path,value) {
  const text=typeof value==='string'?value:JSON.stringify(value,null,2)+'\n';
  if(process.argv.includes('--write')) writeFileSync(`${root}${path}`,text);
  else assert.equal(readFileSync(`${root}${path}`,'utf8'),text,`${path} differs from recorded evidence`);
}
generated('figures/placement.vl.json',figure);generated('figures/placement.facts.json',figureFacts);
generated('figures/ownership.facts.json',ownershipFacts);
for(const [path,excerpt] of Object.entries(data.sourceExcerpts)) generated(`evidence/${path.split('/').pop().replace('.h','.txt')}`,excerpt.text+'\n');
if(process.argv.includes('--check-prose')) {
  const prose=readFileSync(`${root}README.md`,'utf8');
  for(const row of rows.filter(s=>s.startsWith('| ')&&!s.startsWith('|---'))) assert.ok(prose.includes(row),`Document table differs: ${row}`);
}
