// Only a main commit with successful source+design+browser CI may be requeued.
import { pathToFileURL } from 'node:url';
const REQUIRED = Object.freeze(['Tools selector CI', 'Impeccable sitewide design gate', 'Vivlica real-browser design QA']);
export function classifyReleaseChecks(runs = [], sha = '') {
  if (!/^[0-9a-f]{40}$/i.test(sha)) return { ok: false, missing: [...REQUIRED], reason: 'invalid_sha' };
  const missing = [], failed = [], passed = [];
  for (const name of REQUIRED) {
    const matches = runs.filter(run => run.name === name && run.head_sha === sha && run.event === 'push');
    const latest = matches.sort((a,b) => (b.run_attempt || 1) - (a.run_attempt || 1) || (b.id || 0) - (a.id || 0))[0];
    if (!latest || latest.status !== 'completed') missing.push(name);
    else if (latest.conclusion !== 'success') failed.push(name);
    else passed.push(name);
  }
  return { ok: missing.length === 0 && failed.length === 0, missing, failed, passed };
}
export async function inspectReleaseChecks(sha,{fetcher=fetch,token=process.env.GITHUB_TOKEN,repository=process.env.GITHUB_REPOSITORY}={}) {
  if (!/^[0-9a-f]{40}$/i.test(sha) || !/^[\w.-]+\/[\w.-]+$/.test(repository || ''))
    return { ok: false, missing: [...REQUIRED], reason: 'invalid_source' };
  if (!token) return { ok:false, missing:[...REQUIRED], reason:'missing_read_token' };
  try {
    const url=`https://api.github.com/repos/${repository}/actions/runs?head_sha=${sha}&per_page=100`;
    const response=await fetcher(url,{headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28'},redirect:'error',signal:AbortSignal.timeout(15000)});
    if (!response.ok) return {ok:false,missing:[...REQUIRED],reason:'github_api_error',status:response.status};
    const json=await response.json();
    if (!Array.isArray(json.workflow_runs)) return {ok:false,missing:[...REQUIRED],reason:'unexpected_workflow_response'};
    return classifyReleaseChecks(json.workflow_runs,sha);
  } catch {return {ok:false,missing:[...REQUIRED],reason:'github_network_error'};}
}
async function run(){
  const sha=process.argv[2];
  const result=await inspectReleaseChecks(sha);
  console.log(JSON.stringify({...result,expectedCommit:sha}));
  if (!result.ok) process.exitCode=1;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) run().catch(()=>{console.error('CI preflight unavailable');process.exitCode=1;});
