import defaults from '../config/default-content.json' with {type:'json'};
import fields from '../config/fields.json' with {type:'json'};
import {validateContent} from './validation.js';
import {adminPage,loginPage} from './pages.js';
import {isAdmin,configured,sameOrigin,issueSession,correctPassword,cookie,consumeLoginAttempt} from './auth.js';
const security={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"};
const json=(data,status=200,extra={})=>Response.json(data,{status,headers:{...security,...extra}});
async function body(request){if(Number(request.headers.get('content-length')||0)>80000)throw Error('Richiesta troppo grande.');const reader=request.body?.getReader();if(!reader)return{};const chunks=[];let length=0;while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>80000){await reader.cancel();throw Error('Richiesta troppo grande.')}chunks.push(value)}const bytes=new Uint8Array(length);let pos=0;for(const c of chunks){bytes.set(c,pos);pos+=c.length}return JSON.parse(new TextDecoder().decode(bytes))}
async function readContent(env,admin){
 if(!env.DB)return json({content:defaults,revision:0,updatedAt:null,...(admin?{fields}:{}),warning:'Database da configurare: contenuti iniziali.'});
 try{const row=await env.DB.prepare('SELECT content, revision, updated_at FROM portfolio_content WHERE id = ?').bind('site').first();return json({content:row?{...defaults,...JSON.parse(row.content)}:defaults,revision:row?.revision||0,updatedAt:row?.updated_at||null,...(admin?{fields}:{})})}catch{return json({content:defaults,revision:0,updatedAt:null,...(admin?{fields}:{}),warning:'Database non pronto. Applica le migrazioni prima di salvare.'})}
}
async function saveContent(request,env){
 if(!await isAdmin(request,env))return json({error:'Accedi di nuovo all’area admin.'},401);
 if(!sameOrigin(request))return json({error:'Origine della richiesta non valida.'},403);
 let input,content;try{input=await body(request);content=validateContent(input.content);if(!Number.isSafeInteger(input.revision)||input.revision<0)throw Error('Revisione non valida.')}catch(e){return json({error:e.message||'Richiesta non valida.'},400)}
 if(!env.DB)return json({error:'Database non configurato. Nessuna modifica salvata.'},503);
 try{const next=input.revision+1,updatedAt=new Date().toISOString();const result=input.revision===0?await env.DB.prepare('INSERT INTO portfolio_content (id, content, revision, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO NOTHING').bind('site',JSON.stringify(content),next,updatedAt).run():await env.DB.prepare('UPDATE portfolio_content SET content = ?, revision = ?, updated_at = ? WHERE id = ? AND revision = ?').bind(JSON.stringify(content),next,updatedAt,'site',input.revision).run();if(!result.meta.changes)return json({error:'Contenuti modificati da un’altra scheda. Ricarica prima di salvare.'},409);return json({content,revision:next,updatedAt})}catch{return json({error:'Salvataggio non riuscito. Nessuna modifica pubblicata.'},503)}
}
async function login(request,env){
 if(!sameOrigin(request))return json({error:'Origine della richiesta non valida.'},403);
 if(!configured(env))return json({error:'Accesso non ancora configurato su Cloudflare.'},503);
 if(!env.DB)return json({error:'Database non ancora configurato.'},503);
 try{const attempt=await consumeLoginAttempt(request,env);if(!attempt.allowed)return json({error:'Troppi tentativi. Riprova più tardi.'},429,{'Retry-After':String(attempt.retryAfter)});const input=await body(request);if(!await correctPassword(input.password,env))return json({error:'Password non corretta.'},401);return json({ok:true},200,{'Set-Cookie':cookie(await issueSession(env))})}catch{return json({error:'Accesso temporaneamente non disponibile. Controlla il database.'},503)}
}
export default {async fetch(request,env){
 const path=new URL(request.url).pathname;
 if(path==='/api/content'){if(request.method==='GET')return readContent(env,await isAdmin(request,env));if(request.method==='PUT')return saveContent(request,env);return json({error:'Metodo non supportato.'},405,{'Allow':'GET, PUT'})}
 if(path==='/api/admin/login'&&request.method==='POST')return login(request,env);
 if(path==='/api/admin/logout'&&request.method==='POST'){if(!sameOrigin(request))return json({error:'Origine non valida.'},403);return json({ok:true},200,{'Set-Cookie':cookie('',0)})}
 if(path==='/admin'||path==='/admin/'){if(request.method!=='GET')return json({error:'Metodo non supportato.'},405);const admin=await isAdmin(request,env);return new Response(admin?adminPage:loginPage,{headers:{...security,'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex, nofollow'}})}
 if(path.startsWith('/api/')||path.startsWith('/admin/'))return json({error:'Pagina non trovata.'},404);
 return env.ASSETS.fetch(request);
}};
