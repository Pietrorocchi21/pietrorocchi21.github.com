const encoder=new TextEncoder();
export const cookieName='__Host-portfolio_admin';
export const sessionTTL=8*60*60;
export function configured(env){return typeof env.ADMIN_PASSWORD==='string'&&env.ADMIN_PASSWORD.length>=16&&typeof env.SESSION_SECRET==='string'&&env.SESSION_SECRET.length>=32}
async function key(env){return crypto.subtle.importKey('raw',encoder.encode(env.SESSION_SECRET+'\0'+env.ADMIN_PASSWORD),{name:'HMAC',hash:'SHA-256'},false,['sign','verify'])}
function b64(bytes){return btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'')}
function unb64(s){if(!/^[A-Za-z0-9_-]+$/.test(s))throw Error();const v=s.replaceAll('-','+').replaceAll('_','/');return Uint8Array.from(atob(v+'='.repeat((4-v.length%4)%4)),c=>c.charCodeAt(0))}
export async function issueSession(env,now=Date.now()){
 const data=b64(encoder.encode(JSON.stringify({sub:'owner',exp:Math.floor(now/1000)+sessionTTL,nonce:crypto.randomUUID()})));
 return data+'.'+b64(await crypto.subtle.sign('HMAC',await key(env),encoder.encode(data)));
}
export async function isAdmin(request,env,now=Date.now()){
 if(!configured(env))return false;
 try{const cookie=request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(!cookie||cookie.length>1024)return false;
 const [data,signature,extra]=cookie.split('.');if(extra||!data||!signature)return false;
 if(!await crypto.subtle.verify('HMAC',await key(env),unb64(signature),encoder.encode(data)))return false;
 const payload=JSON.parse(new TextDecoder().decode(unb64(data)));const seconds=Math.floor(now/1000);
 return payload.sub==='owner'&&Number.isSafeInteger(payload.exp)&&payload.exp>seconds&&payload.exp<=seconds+sessionTTL;
 }catch{return false}
}
export function cookie(token,maxAge=sessionTTL){return `${cookieName}=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`}
export async function correctPassword(candidate,env){
 if(!configured(env)||typeof candidate!=='string'||candidate.length>1024)return false;
 const k=await key(env),a=new Uint8Array(await crypto.subtle.sign('HMAC',k,encoder.encode(candidate))),b=new Uint8Array(await crypto.subtle.sign('HMAC',k,encoder.encode(env.ADMIN_PASSWORD)));let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;
}
export function sameOrigin(request){return request.headers.get('origin')===new URL(request.url).origin&&request.headers.get('content-type')?.split(';')[0]==='application/json'}
export async function consumeLoginAttempt(request,env,now=Date.now()){
 // Buckets are HMAC-derived so the database never stores visitor IP addresses.
 const window=Math.floor(now/900000),expires=(window+1)*900000;
 const raw=request.headers.get('cf-connecting-ip')||'local';
 const ip=b64(await crypto.subtle.sign('HMAC',await key(env),encoder.encode(raw)));
 const limits=[{id:`ip:${window}:${ip}`,max:10},{id:`all:${window}`,max:100}];
 const results=await env.DB.batch(limits.map(l=>env.DB.prepare('INSERT INTO login_limits (bucket, attempts, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET attempts = attempts + 1 WHERE attempts < ? RETURNING attempts').bind(l.id,expires,l.max)));
 // Bounded cleanup keeps stale throttle records from accumulating.
 await env.DB.prepare('DELETE FROM login_limits WHERE bucket IN (SELECT bucket FROM login_limits WHERE expires_at < ? LIMIT 200)').bind(now-900000).run();
 return {allowed:results.every(r=>r.results?.length===1),retryAfter:Math.max(1,Math.ceil((expires-now)/1000))};
}
