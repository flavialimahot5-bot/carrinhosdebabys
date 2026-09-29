import fs from 'node:fs';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
for(let i=0;i<7;i++){
 const filename=i?`variant-${i}.html`:'index.html';const $=load(fs.readFileSync(filename,'utf8'));
 assert.equal($('h1').length,1,`${filename}: missing title`);
 const buybox=$('#buybox-form').first();
 assert.equal(buybox.find('.local-purchase-price strong').text(),'R$ 67,90',`${filename}: purchase price`);
 assert.ok(buybox.text().includes('Estoque disponível'),`${filename}: available stock`);
 assert.ok(buybox.text().includes('Melhor preço'),`${filename}: offer label`);
 const buyButtons=$('button[data-buy-url]');
 assert.ok(buyButtons.length,`${filename}: purchase button`);
 buyButtons.each((_,e)=>{assert.equal($(e).attr('disabled'),undefined);assert.equal($(e).attr('data-buy-url'),'https://google.com');});
 $('.ui-pdp-price .andes-money-amount__fraction').each((_,e)=>assert.equal($(e).text(),'67,90',`${filename}: visible decimal comma`));
 assert.equal($('.ui-pdp-outside_variations__thumbnails__item').length,7);
 assert.ok($('.ui-pdp-gallery__figure__image').length>=6);
 assert.equal($('script').length,2);assert.equal($('script').first().attr('src'),'/app.js');assert.equal($('script').last().attr('src'),'/responsive.js');
 assert.equal($('iframe').length,0);
 assert.equal($('a[href^="http"],a[href^="//"],[formaction],form[action]').length,0,`${filename}: external navigation removed`);
 $('img[src^="/assets/"],link[href^="/assets/"]').each((_,e)=>{const url=$(e).attr(e.name==='img'?'src':'href');assert.ok(fs.existsSync('.'+url),url);});
 $('.ui-pdp-outside_variations__thumbnails__item').each((_,e)=>{const url=$(e).attr('href');assert.ok(url==='/'||/^\/variant-[1-6]\.html$/.test(url),url);});
 console.log(`PASS ${filename}: ${$('.ui-pdp-gallery__figure__image').length} photos, 7 variants, local assets`);
}
assert.deepEqual(JSON.parse(fs.readFileSync('asset-report.json')).failures,[]);
console.log('PASS asset downloads and script isolation');
