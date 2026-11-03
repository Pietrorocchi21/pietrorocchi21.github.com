import fields from '../config/fields.json' with { type: 'json' };
export function validateContent(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Contenuto non valido.');
 const data=input,out={};
 for(const f of fields){const value=data[f.key];if(typeof value!=='string'||value.length>(f.type==='textarea'?4000:500))throw Error('Controlla il campo: '+f.label);out[f.key]=value.trim();if(f.type==='url'&&out[f.key]){let u;try{u=new URL(out[f.key])}catch{throw Error('URL non valido: '+f.label)}if(u.protocol!=='https:'||u.username||u.password)throw Error('Usa un URL HTTPS: '+f.label)}if(f.type==='email'&&out[f.key]&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out[f.key]))throw Error('Email non valida.')}
 if(!out.firstName||!out.lastName||!out.latin||!out.projectButton)throw Error('Nome, cognome, motto e testo del pulsante sono obbligatori.');
 if(!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(out.githubUsername))throw Error('Username GitHub non valido.');
 for(const [k,hosts] of Object.entries({instagram:['instagram.com','www.instagram.com'],tiktok:['tiktok.com','www.tiktok.com'],projectRepo:['github.com','www.github.com']}))if(out[k]&&!hosts.includes(new URL(out[k]).hostname))throw Error('Dominio non valido: '+k);
 return out;
}
