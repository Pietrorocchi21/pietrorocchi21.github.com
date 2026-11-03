import {spawnSync} from 'node:child_process';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cli=path.join(root,'node_modules/wrangler/bin/wrangler.js');
function run(args,capture=false){const r=spawnSync(process.execPath,[cli,...args],{cwd:root,env:{...process.env,CI:'true',WRANGLER_SEND_METRICS:'false'},encoding:'utf8',stdio:capture?['ignore','pipe','inherit']:'inherit'});if(r.error)throw r.error;if(r.status!==0)throw Error('Cloudflare command failed: '+args.join(' '));return r.stdout}
export function selectDatabase(databases,name){const matches=databases.filter(d=>d.name===name);if(matches.length!==1||typeof matches[0].uuid!=='string'||!/^[a-fA-F0-9-]{36}$/.test(matches[0].uuid))throw Error('Database non trovato o ambiguo: '+name);return matches[0].uuid}
async function deploy(){const config=JSON.parse(await readFile(path.join(root,'wrangler.jsonc'),'utf8')),name=config.d1_databases[0].database_name;
 let list=JSON.parse(run(['d1','list','--json'],true));if(!list.some(d=>d.name===name)){run(['d1','create',name]);list=JSON.parse(run(['d1','list','--json'],true))}
 config.d1_databases[0].database_id=selectDatabase(list,name);const temporary=path.join(root,'.cloudflare-deploy.json');await writeFile(temporary,JSON.stringify(config,null,2));
 try{run(['d1','migrations','apply','DB','--remote','--config',temporary]);run(['deploy','--config',temporary])}finally{await unlink(temporary).catch(()=>{})}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))deploy().catch(e=>{console.error(e.message);process.exitCode=1});
