import {mkdir,readFile,writeFile,copyFile,rm,readdir} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const name of ['index.html','style.css','app.js','admin.css','admin.js','login.js'])await copyFile('web/'+name,'dist/'+name);
for(const name of await readdir('public'))await copyFile('public/'+name,'dist/'+name);
const admin=await readFile('web/admin.html','utf8'),login=await readFile('web/login.html','utf8');
await writeFile('src/pages.js','// Generated from web/*.html by npm run build.\nexport const adminPage='+JSON.stringify(admin)+';\nexport const loginPage='+JSON.stringify(login)+';\n');
await writeFile('dist/_headers','/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: default-src \'self\'; script-src \'self\'; style-src \'self\' https://fonts.googleapis.com; font-src \'self\' https://fonts.gstatic.com; connect-src \'self\' https://api.github.com; img-src \'self\' data:; object-src \'none\'; base-uri \'none\'; frame-ancestors \'none\'\n/admin*\n  X-Robots-Tag: noindex, nofollow\n');
console.log('Portfolio assets and protected admin pages built.');
