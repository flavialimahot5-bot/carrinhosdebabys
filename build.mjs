import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {load} from 'cheerio';

// The saved DOM is a point-in-time visual reference. No marketplace scripts run locally.
const raw=JSON.parse(await fs.readFile('source.json','utf8'));
const sources=Array.isArray(raw)?raw:[raw];
if(!Array.isArray(raw))for(let i=1;i<=6;i++){try{sources.push(JSON.parse(await fs.readFile(`source-${i}.json`,'utf8')));}catch{}}
await fs.mkdir('assets',{recursive:true});
const cache=new Map();const failures=[];
async function asset(url){
 if(!url||!url.startsWith('https://http2.mlstatic.com/'))return url;
 if(cache.has(url))return cache.get(url);
 const task=(async()=>{
  let ext=path.extname(new URL(url).pathname)||'.bin';
  const name=crypto.createHash('sha256').update(url).digest('hex').slice(0,18)+ext;
  const target='assets/'+name;
  try{await fs.access(target);return '/'+target;}catch{}
  try{const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(r.status);
   let data=Buffer.from(await r.arrayBuffer());
   if(ext==='.css'){let css=data.toString();const urls=[...css.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)].map(m=>m[1]).filter(u=>!u.startsWith('data:')&&!u.startsWith('#'));
    for(const u of [...new Set(urls)]){const absolute=new URL(u,url).href;const local=await asset(absolute);css=css.split(u).join(local);}data=Buffer.from(css);}
   await fs.writeFile(target,data);return '/'+target;
  }catch(e){failures.push({url,error:String(e)});return url;}
 })();cache.set(url,task);return task;
}
const ids=sources.map(s=>new URL(s.url).pathname.split('/').pop());
const testPrice='67.90';
for(let index=0;index<sources.length;index++){
 const source=sources[index];const $=load(source.html);
 // Apply the requested demo price to product offers, leaving shipping and recommendations intact.
 $('.ui-pdp-price .andes-money-amount--previous,.ui-pdp-price .andes-money-amount__discount').remove();
 $('.ui-pdp-price .ui-pdp-price__subtitles').html('<p class="ui-pdp-color--BLACK ui-pdp-size--XSMALL">ou R$ 67,90 em outros meios</p>');
 $('.ui-pdp-price .andes-money-amount').each((i,e)=>{
  const amount=$(e);
  amount.attr('aria-label','67 reais com 90 centavos');
  amount.find('.andes-money-amount__fraction').text('67');
  if(!amount.find('.andes-money-amount__cents').length)amount.append('<span class="andes-visually-hidden" aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true">90</span>');
  amount.find('.andes-money-amount__cents').text('90');
  amount.find('[itemprop=price]').attr('content',testPrice);
 });
 $('body').attr('data-test-price',testPrice);
 // All captured variants are enabled for the user's navigation demo.
 $('.xprod-lib-custom-message').filter((i,e)=>$(e).text().includes('No momento, não podemos enviar este produto')).remove();
 $('button').filter((i,e)=>['Comprar agora','Adicionar ao carrinho'].includes($(e).text().trim())).each((i,e)=>{
  const button=$(e);
  button.removeAttr('disabled').removeAttr('aria-disabled').removeAttr('data-andes-state').removeAttr('formaction').removeClass('andes-button--disabled').attr('type','button');
  if(button.text().trim()==='Comprar agora')button.attr('data-buy-url','https://google.com');
 });
 $('.ui-pdp-action-icon--undefined').removeClass('ui-pdp-action-icon--undefined').addClass('ui-pdp-action-icon--BLUE');
 $('script,iframe,noscript,link[rel=prefetch],link[rel=preconnect],link[rel=dns-prefetch],meta[http-equiv],input[type=hidden],#g_id_onload,.grecaptcha-badge').remove();
 $('*').each((i,e)=>{for(const key of Object.keys(e.attribs||{})){if(key.startsWith('on')||key==='nonce')$(e).removeAttr(key);}});
 $('link[rel=canonical]').attr('href',source.url);
 $('img').removeAttr('srcset').removeAttr('is');
 $('img[src]').each((i,e)=>{const url=$(e).attr('src');if(url.startsWith('http')&&!url.startsWith('https://http2.mlstatic.com/'))$(e).remove();});
 $('link[rel=stylesheet]').each((i,e)=>{if(!($(e).attr('href')||'').startsWith('https://http2.mlstatic.com/'))$(e).remove();});
 $('form').removeAttr('action').removeAttr('method');
 $('video').each((i,e)=>{const v=$(e);v.removeAttr('autoplay');if((v.attr('src')||'').startsWith('blob:'))v.remove();});
 $('a[href]').each((i,e)=>{const a=$(e),href=a.attr('href');if(!href.startsWith('#')&&!href.startsWith('javascript:')){const url=new URL(href,source.url);const id=url.pathname.split('/').pop();if(a.hasClass('ui-pdp-outside_variations__thumbnails__item')&&ids.includes(id)){a.attr('href',id===ids[0]?'/':'/variant-'+ids.indexOf(id)+'.html');}else{a.attr('href',url.href).attr('target','_blank').attr('rel','noopener noreferrer');}}});
 $('.ui-pdp-gallery__figure__image').each((i,e)=>{const url=$(e).attr('data-zoom')||$(e).attr('src');$(e).attr('data-full-image',url).attr('src',url);});
 const jobs=[];
 $('img[src],link[rel=stylesheet],link[as=font]').each((i,e)=>jobs.push(async()=>{const el=$(e),attr=e.name==='img'?'src':'href';el.attr(attr,await asset(el.attr(attr)));}));
 $('style').each((i,e)=>jobs.push(async()=>{let css=$(e).html();const urls=[...css.matchAll(/url\(["']?(https:\/\/http2\.mlstatic\.com\/[^)'"\s]+)["']?\)/g)].map(m=>m[1]);for(const url of [...new Set(urls)])css=css.split(url).join(await asset(url));$(e).text(css);}));
 // Limit parallel downloads to avoid saturating the connection.
 for(let i=0;i<jobs.length;i+=12)await Promise.all(jobs.slice(i,i+12).map(j=>j()));
 $('meta[name=viewport]').remove();
 $('head').append('<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/local.css"><script defer src="/app.js"></script><script defer src="/responsive.js"></script>');
 $('body').attr('data-variant',String(index)).attr('data-source-url',source.url).append('<dialog id="local-dialog"><button class="local-close" aria-label="Fechar">×</button><div id="local-dialog-content"></div></dialog><div id="local-toast" role="status" aria-live="polite"></div><p class="local-notice">Reprodução local para demonstração. Conteúdo consultado em 26/09/2026. Sem vínculo com o Mercado Livre. Preços, estoque, frete e opiniões não são atualizados em tempo real.</p>');
 $('.ui-pdp-container__row--reviews-capability-v3').attr('id','local-reviews');
 $('.ui-pdp-review__label--link').attr('href','#local-reviews').removeAttr('target');
 await fs.writeFile(index===0?'index.html':'variant-'+index+'.html',$.html());
 console.log(`Version ${index}: ${$('h1').text()} — ${$('img').length} images`);
}
await fs.writeFile('asset-report.json',JSON.stringify({sources:sources.map(({url,label})=>({url,label})),downloaded:cache.size,failures},null,2));
console.log(`Done. ${cache.size} assets; ${failures.length} failures.`);
