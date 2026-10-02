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
 // Match the requested demo delivery panel for the Preto/Bronze variant.
 if(index===6){
  const reference=load(sources[5].html);
  $('.xprod-lib-shipping-section').first().replaceWith(reference('.xprod-lib-shipping-section').first().toString());
  $('.ui-pdp-stock-and-full').first().html(reference('.ui-pdp-stock-and-full').first().html());
  if(!$('#full_icon').length){const icon=reference('#full_icon');if(icon.length)$('body').append('<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true" style="position:absolute"><defs>'+icon.toString()+'</defs></svg>');}
 }
 // Keep only the lower offer, which contains the selected purchase and delivery details.
 const sellerOffers=$('.ui-pdp-buy-box-offers__offer-list-item');
 if(sellerOffers.length>1)sellerOffers.slice(0,-1).remove();
 // Apply the requested demo price to product offers, leaving shipping and recommendations intact.
 $('.ui-pdp-price .andes-money-amount--previous,.ui-pdp-price .andes-money-amount__discount').remove();
 $('.ui-pdp-price .ui-pdp-price__subtitles').html('<p class="ui-pdp-color--BLACK ui-pdp-size--XSMALL">ou R$ 67,90 em outros meios</p>');
 $('.ui-pdp-price .andes-money-amount').each((i,e)=>{
  const amount=$(e);
  amount.attr('aria-label','67 reais com 90 centavos');
  amount.find('.andes-money-amount__fraction').text('67,90');
  amount.find('.andes-money-amount__cents,.andes-visually-hidden').remove();
  amount.find('[itemprop=price]').attr('content',testPrice);
 });
 $('body').attr('data-test-price',testPrice);
 const purchasePrice='<div class="local-purchase-price"><strong>R$ 67,90</strong><span>no Pix</span></div>';
 const mainBuybox=$('#buybox-form').first();
 if(mainBuybox.find('.ui-pdp-buy-box-offers__offer-price').length){
  mainBuybox.find('.andes-radio__label span').text('Melhor preço');
  mainBuybox.find('.ui-pdp-buy-box-offers__offer-price').html(purchasePrice);
 }else{
  mainBuybox.prepend('<div class="local-purchase-heading"><div class="local-purchase-label">Melhor preço<span aria-hidden="true">◉</span></div>'+purchasePrice+'</div>');
 }
 $('.ui-pdp-stock-information__title').text('Estoque disponível');
 // All captured variants are enabled for the user's navigation demo.
 $('.xprod-lib-custom-message').filter((i,e)=>$(e).text().includes('No momento, não podemos enviar este produto')).remove();
 $('button').filter((i,e)=>['Comprar agora','Adicionar ao carrinho'].includes($(e).text().trim())).each((i,e)=>{
  const button=$(e);
  button.removeAttr('disabled').removeAttr('aria-disabled').removeAttr('data-andes-state').removeAttr('formaction').removeClass('andes-button--disabled').attr('type','button');
  if(button.text().trim()==='Comprar agora')button.attr('data-buy-local','true');
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
 // External reference links are visual-only in the isolated demo.
 $('a[href]').each((i,e)=>{const a=$(e),href=a.attr('href');if(/^https?:/i.test(href)){a.removeAttr('href').removeAttr('target').removeAttr('rel').attr('data-local-only','true').attr('role','button').attr('tabindex','0');}});
 $('.nav-logo').attr('href','/').removeAttr('data-local-only').removeAttr('role').removeAttr('tabindex');
 $('[formaction]').removeAttr('formaction');
 $('#questions,.show-more-click,#ui-pdp-price__payments-link,.nav-search,.nav-footer-access,.nav-shortcut-menu,.clip-wrapper,.clip-picture-icon').remove();
 $('button').filter((i,e)=>/Mais detalhes e formas de entrega|Perguntar|Mostrar todas as opiniões|Mais opções/.test($(e).text())||($(e).attr('aria-label')||'').includes('Enviar para')).remove();
 $('[data-local-only]').each((i,e)=>{const el=$(e);if(el.attr('id')==='nav-cart'||el.hasClass('ui-pdp-collapsable__action'))return;el.replaceWith('<span class="'+(el.attr('class')||'')+'">'+el.html()+'</span>');});
 $('link[rel=canonical]').remove();
 $('.ui-pdp-gallery__figure__image').each((i,e)=>{const url=$(e).attr('data-zoom')||$(e).attr('src');$(e).attr('data-full-image',url).attr('src',url);});
 const jobs=[];
 $('img[src],link[rel=stylesheet],link[as=font]').each((i,e)=>jobs.push(async()=>{const el=$(e),attr=e.name==='img'?'src':'href';el.attr(attr,await asset(el.attr(attr)));}));
 $('style').each((i,e)=>jobs.push(async()=>{let css=$(e).html();const urls=[...css.matchAll(/url\(["']?(https:\/\/http2\.mlstatic\.com\/[^)'"\s]+)["']?\)/g)].map(m=>m[1]);for(const url of [...new Set(urls)])css=css.split(url).join(await asset(url));$(e).text(css);}));
 // Limit parallel downloads to avoid saturating the connection.
 for(let i=0;i<jobs.length;i+=12)await Promise.all(jobs.slice(i,i+12).map(j=>j()));
 $('meta[name=viewport]').remove();
 $('head').append(`<script type="text/javascript" id="microsoft-clarity">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "yrkm9wkpn5");
</script>`);
 $('head').append('<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/local.css?v=20261002-cards2"><script defer src="/app.js"></script><script defer src="/responsive.js"></script>');
 $('body').attr('data-variant',String(index)).attr('data-source-url',source.url).append('<dialog id="local-dialog"><button class="local-close" aria-label="Fechar">×</button><div id="local-dialog-content"></div></dialog><div id="local-toast" role="status" aria-live="polite"></div><p class="local-notice">Página independente, sem vínculo com o Mercado Livre. Conteúdo de referência; preços, estoque, frete e opiniões não são atualizados em tempo real.</p>');
 $('.ui-pdp-container__row--reviews-capability-v3').attr('id','local-reviews');
 $('.ui-pdp-review__label--link').attr('href','#local-reviews').removeAttr('target');
 await fs.writeFile(index===0?'index.html':'variant-'+index+'.html',$.html());
 console.log(`Version ${index}: ${$('h1').text()} — ${$('img').length} images`);
}
await fs.writeFile('asset-report.json',JSON.stringify({sources:sources.map(({url,label})=>({url,label})),downloaded:cache.size,failures},null,2));
console.log(`Done. ${cache.size} assets; ${failures.length} failures.`);
