// Optional refresh from the pinned source checkout. Verification needs only the
// committed projection, not this checkout or an Apple GPU.
import { readFileSync,writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(process.argv[2]??'.');
const commit='99eee23e12ee78428d9435b7d4d74f736da96118';
if(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()!==commit) throw Error('Use the pinned Metalic commit');
const sources=[];
function source(name) {
  const path=`measurements/${name}.json`,bytes=readFileSync(resolve(root,path));
  const data=JSON.parse(bytes);sources.push({path,sha256:createHash('sha256').update(bytes).digest('hex'),measuredAt:data.measuredAt,
    url:`https://github.com/mizchi/metalic/blob/${commit}/${path}`});return data;
}
function fit(data,names) {
  return {policy:data.policy,seed:data.holdoutSeed,passed:data.passed,thresholds:data.thresholds,
    cases:data.cases.filter(c=>!names||names.includes(c.name)).map(c=>({name:c.name,spec:c.spec,placement:c.placement,
      inputHash:c.inputHash,trainingHash:c.trainingHash,heldInputChanged:c.heldInputChanged,
      trainingUs:c.trainingUs,prepareUs:c.prepareUs,reservedBytes:c.reservedBytes,
      training:c.training.map(r=>({mode:r.mode,serviceUs:r.serviceUs})),
      evaluations:c.evaluations.map(r=>({round:r.round,variant:r.variant,mode:r.result.mode,reason:r.result.decision.reason,
        serviceUs:r.result.serviceUs,apiUs:r.apiUs,verified:r.result.verified,checksum:r.result.checksum,resultCount:r.result.resultCount}))}))};
}
const cooperation=source('apple-m5-cooperation-trial1').records.filter(r=>r.functions===256).map(r=>({
  feedbackEvery:r.feedbackEvery,inputHash:r.inputHash,trials:r.trials.map(t=>({jobUs:t.jobUs,gpuUs:t.gpuUs,cpuReadUs:t.cpuReadUs,
    hostWaits:t.hostWaits,dispatches:t.dispatches,dispatchSignature:t.dispatchSignature}))}));
const scheduling=source('apple-m5-scheduling-trial1').records.filter(r=>r.functions===256).map(r=>({output:r.output,
  maxInFlight:r.maxInFlight,batchSize:r.batchSize,trials:r.trials.map(t=>({apiUs:t.apiWallUs,nativeUs:t.batch.wallUs,peakBytes:t.batch.peakBufferBytes,
    traces:t.traces.map(f=>({sequence:f.sequence,slot:f.slot,prepareBeginUs:f.prepareBeginUs,gpuCompletedUs:f.gpuCompletedUs,
      consumeBeginUs:f.consumeBeginUs,consumeEndUs:f.consumeEndUs}))}))}));
function compact(data) {return data.records.filter(r=>r.algorithm==='compact-u32'&&r.count===16777216).map(r=>({
  mode:r.mode,inputHash:r.inputHash,verified:r.verified,samples:r.samples.map(s=>s.elapsedUs)}));}
const compactBefore=compact(source('apple-m5-workloads-trial1')),compactAfter=compact(source('apple-m5-workloads-trial5'));
const fitCurrent=fit(source('apple-m5-fit-trial4'));
const fitFailure=fit(source('apple-m5-fit-trial2'),['merkle']);
const fitAggressive=fit(source('apple-m5-fit-trial3'),['compact']);
const sourceExcerpts={};
for(const [path,begin,end] of [['native/flight.h','    wait(); // No host reads','    consumed=true;'],
  ['native/batch.h','      auto& flight=pending.front();','      pending.pop_front(); // CPU objects no longer refer to the arena.']]) {
  const text=readFileSync(resolve(root,path),'utf8'),start=text.indexOf(begin),stop=text.indexOf(end,start)+end.length;
  if(start<0||stop<end.length) throw Error('Ownership source excerpt changed');
  sourceExcerpts[path]={sha256:createHash('sha256').update(text).digest('hex'),url:`https://github.com/mizchi/metalic/blob/${commit}/${path}`,text:text.slice(start,stop)};
}
const data={schema:1,repository:'mizchi/metalic',commit,recordedEnvironment:{device:'Apple M5',cpuLogical:10,macOS:'26.6.2',msl:'4.0'},
  sources,notes:['Projection of archived measurements; not a new hardware run.','fitCurrent contains all eight cases and every held-out sample.',
    'Other sections contain the stated selected cases; unrelated fields and repeated traces are omitted.',
    'Raw source SHA-256 identifies provenance; the projection is not a cryptographic proof of the omitted source contents.'],
  sourceExcerpts,cooperation,scheduling,compactBefore,compactAfter,fitCurrent,fitFailure,fitAggressive};
writeFileSync(fileURLToPath(new URL('../evidence/measurements.json',import.meta.url)),JSON.stringify(data,null,2)+'\n');
console.log(`Extracted ${sources.length} pinned archives; ${fitCurrent.cases.length} held-out fit cases`);
