/* Local interactions, intentionally independent of marketplace accounts and APIs. */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const dialog=$('#local-dialog'),content=$('#local-dialog-content');
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let toastTimer;function toast(message){const el=$('#local-toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),4000);}
function modal(html){content.innerHTML=html;if(!dialog.open)dialog.showModal();}
$('.local-close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
document.addEventListener('submit',e=>e.preventDefault());

const testPrice=document.body.dataset.testPrice;
const testPriceLabel=testPrice?Number(testPrice).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):null;
const sourceLink=()=>'<p class="local-muted">Recurso externo indisponível nesta demonstração.</p>';

// Original radio-based gallery, with keyboard-accessible full-screen photo viewer.
const pictures=$$('.ui-pdp-gallery__figure__image');let activePictures=pictures,photoIndex=0;
function showPhoto(index,images=pictures){activePictures=images;photoIndex=(index+images.length)%images.length;const img=images[photoIndex];modal(`<div class="local-photo"><img src="${esc(img.src)}" alt="${esc(img.alt)}"><div class="local-photo-controls"><button aria-label="Foto anterior" id="photo-prev">❮</button><span>${photoIndex+1} / ${images.length}</span><button aria-label="Próxima foto" id="photo-next">❯</button></div><div class="local-photo-thumbs">${images.map((p,i)=>`<button data-photo="${i}" class="${i===photoIndex?'selected':''}" aria-label="Ver foto ${i+1}"><img src="${esc(p.src)}" alt=""></button>`).join('')}</div></div>`);$('#photo-prev').onclick=()=>showPhoto(photoIndex-1,images);$('#photo-next').onclick=()=>showPhoto(photoIndex+1,images);$$('[data-photo]',content).forEach(b=>b.onclick=()=>showPhoto(Number(b.dataset.photo),images));}
pictures.forEach((img,i)=>{img.tabIndex=0;img.style.cursor='zoom-in';img.addEventListener('click',()=>showPhoto(i));img.addEventListener('keydown',e=>{if(e.key==='Enter')showPhoto(i);});});
$$('.ui-pdp-gallery__label').forEach(label=>{const radio=document.getElementById(label.htmlFor);const select=()=>{if(radio)radio.checked=true;};label.addEventListener('mouseenter',select);label.addEventListener('click',e=>{e.preventDefault();select();if(label.querySelector('[class*=remaining]')||label.innerText.trim())showPhoto(6);});});
$$('.clip-wrapper,.clip-picture-icon').forEach(el=>el.addEventListener('click',()=>modal(`<h2>Vídeo do produto</h2><p>O vídeo não está disponível nesta demonstração.</p>${sourceLink('Assistir no Mercado Livre')}`)));
document.addEventListener('keydown',e=>{if(dialog.open&&$('#photo-next')){if(e.key==='ArrowRight')showPhoto(photoIndex+1,activePictures);if(e.key==='ArrowLeft')showPhoto(photoIndex-1,activePictures);}});
const reviewPictures=$$('img[alt^="Foto do produto compartilhada"]');reviewPictures.forEach((img,i)=>{img.style.cursor='zoom-in';img.tabIndex=0;img.onclick=()=>showPhoto(i,reviewPictures);img.onkeydown=e=>{if(e.key==='Enter')showPhoto(i,reviewPictures);};});

// Favorites and cart are saved only in this browser.
const favorite=$('.ui-pdp-bookmark button');const favoriteKey='romanzo-favorite-'+document.body.dataset.variant;
function favoriteState(value){if(!favorite)return;favorite.setAttribute('aria-checked',String(value));favorite.setAttribute('aria-label',value?'Remover dos favoritos':'Adicionar aos favoritos');favorite.classList.toggle('local-favorited',value);}
favoriteState(read(favoriteKey,false));favorite?.addEventListener('click',e=>{e.preventDefault();const value=favorite.getAttribute('aria-checked')!=='true';favoriteState(value);write(favoriteKey,value);toast(value?'Produto adicionado aos favoritos':'Produto removido dos favoritos');});
let quantity=1;
const availableQuantity=Math.min(25,Number($('.ui-pdp-buybox__quantity__available')?.textContent.match(/\d+/)?.[0])||5);
$('#quantity-selector')?.addEventListener('click',()=>{modal('<h2>Selecione a quantidade</h2><div class="local-options">'+Array.from({length:availableQuantity},(_,i)=>`<button data-quantity="${i+1}">${i+1} ${i===0?'unidade':'unidades'}</button>`).join('')+'</div>');$$('[data-quantity]').forEach(b=>b.onclick=()=>{quantity=Number(b.dataset.quantity);$('.ui-pdp-buybox__quantity__selected').textContent=quantity+(quantity===1?' unidade':' unidades');$('#quantity-selector').setAttribute('aria-label','Quantidade: '+quantity);dialog.close();});});
function cart(){return read('romanzo-cart',[]).map(p=>testPriceLabel?{...p,price:testPriceLabel}:p);}
function updateCart(){const n=cart().reduce((sum,p)=>sum+p.quantity,0);const c=$('#nav-cart');if(c){c.setAttribute('aria-label',n+' produtos em seu carrinho');let badge=$('.local-cart-count',c);if(!badge){badge=document.createElement('span');badge.className='local-cart-count';c.append(badge);}badge.textContent=n||'';}}
function currentProduct(){return {id:document.body.dataset.variant,title:$('h1').textContent,variant:$('.ui-pdp-outside_variations__title__value')?.textContent||'',image:pictures[0]?.src,quantity,price:testPriceLabel||$('.ui-pdp-price__second-line .andes-money-amount')?.getAttribute('aria-label')||$('.ui-pdp-price').textContent.trim(),url:location.pathname};}
function addCart(){const items=cart(),product=currentProduct(),existing=items.find(x=>x.id===product.id);if(existing)existing.quantity+=quantity;else items.push(product);write('romanzo-cart',items);updateCart();toast('Produto adicionado ao carrinho de demonstração');}
function showCart(){const items=cart();modal(`<h2>Seu carrinho</h2><p class="local-muted">Demonstração local · nenhuma compra será realizada.</p>${items.length?items.map(p=>`<div class="local-cart-item"><img src="${esc(p.image)}" alt=""><div><a href="${esc(p.url)}">${esc(p.title)}</a><p>${esc(p.variant)} · ${p.quantity} unidade(s)</p><p>${esc(p.price)}</p><button class="local-text" data-remove="${esc(p.id)}">Remover</button></div></div>`).join(''):'<p>Seu carrinho está vazio.</p>'}`);$$('[data-remove]').forEach(b=>b.onclick=()=>{write('romanzo-cart',cart().filter(p=>p.id!==b.dataset.remove));updateCart();showCart();});}
$('#nav-cart')?.addEventListener('click',e=>{e.preventDefault();showCart();});updateCart();
$$('button').filter(b=>b.textContent.trim()==='Adicionar ao carrinho').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();addCart();}));
$$('button[data-buy-url]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();window.location.assign(b.dataset.buyUrl);}));

// Expand the captured specifications and description without inventing data.
$('#see-more-button-hs-features')?.addEventListener('click',e=>{e.preventDefault();$('#highlighted_specs_attrs')?.scrollIntoView({behavior:'smooth'});});
$$('button.ui-pdp-collapsable__action').forEach(button=>button.addEventListener('click',()=>{const parent=button.closest('.ui-pdp-collapsable');const expanded=parent.classList.toggle('local-expanded');parent.classList.toggle('ui-pdp-collapsable--is-collapsed',!expanded);const box=$('.ui-pdp-collapsable__container',parent);box.style.maxHeight=expanded?'none':'400px';button.setAttribute('aria-expanded',String(expanded));button.textContent=expanded?'Ver menos características':'Conferir todas as características';}));
$('.ui-vpp-highlighted-specs__features-list-toggle')?.addEventListener('click',()=>{const specs=$('#highlighted_specs_attrs');specs?.scrollIntoView({behavior:'smooth'});$('.ui-pdp-collapsable__action',specs)?.click();});
$$('a').filter(a=>a.textContent.trim()==='Ver descrição completa').forEach(a=>a.onclick=e=>{e.preventDefault();const description=$('#description');description.classList.toggle('local-expanded');a.textContent='Descrição completa';});
$('#link__label')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);toast('Link copiado!');}catch{modal(`<h2>Compartilhar</h2><input readonly aria-label="Link da página" value="${esc(location.href)}">`);}});
$('#ui-pdp-price__payments-link')?.addEventListener('click',e=>{e.preventDefault();const section=$$('.ui-pdp-container__row').find(x=>x.className.includes('payment-methods'));modal('<h2>Meios de pagamento</h2>'+(section?.innerHTML||'<p>Pix, cartões de crédito e boleto bancário.</p>')+'<p class="local-muted">Condições capturadas do anúncio. Confirme valores e parcelamento na loja.</p>');});
$$('button').filter(b=>/Mais detalhes e formas de entrega/.test(b.textContent)).forEach(b=>b.onclick=()=>modal(`<h2>Formas de entrega</h2><p>Os prazos e valores exibidos são demonstrativos. A consulta de CEP não está disponível neste teste.</p>${sourceLink('Consultar entrega')}`));
$$('button').filter(b=>b.textContent.trim()==='Seguir').forEach(b=>b.onclick=()=>{const following=b.textContent.trim()==='Seguindo';b.textContent=following?'Seguir':'Seguindo';b.setAttribute('aria-pressed',String(!following));toast(following?'Loja removida da sua lista local':'Loja adicionada à sua lista local');});

// Review interactions apply only to the captured, real review excerpts.
$$('.ui-review-capability-valorizations__button-like').forEach((button,i)=>{const count=button.querySelector('[class*=count]');const key='romanzo-review-like-'+i;const initial=Number(count?.textContent)||0;const apply=value=>{button.setAttribute('aria-checked',String(value));button.classList.toggle('local-liked',value);if(count)count.textContent=initial+(value?1:0);};apply(read(key,false));button.onclick=()=>{const value=button.getAttribute('aria-checked')!=='true';write(key,value);apply(value);};});
$$('.ui-review-capability-comments__comment__content__read-more').forEach(b=>b.onclick=()=>{b.parentElement.classList.add('local-expanded');b.hidden=true;});
$('.show-more-click')?.addEventListener('click',()=>modal(`<h2>Opiniões do produto</h2><p>A página original informa 828 avaliações e 407 comentários. Esta reprodução preserva os comentários que estavam disponíveis na página consultada.</p>${sourceLink('Ver todas as opiniões na origem')}`));
$('#dropdown-button-orderCriteria')?.addEventListener('click',()=>{modal('<h2>Ordenar opiniões</h2><div class="local-options"><button data-sort="relevance">Mais relevantes</button><button data-sort="recent">Mais recentes</button></div>');$$('[data-sort]').forEach(b=>b.onclick=()=>{const reviews=$$('.ui-review-capability-comments__comment');reviews.sort((a,b)=>b.dataset.reviewIndex-a.dataset.reviewIndex);if(b.dataset.sort==='relevance')reviews.reverse();reviews.forEach(r=>r.parentElement.parentElement.append(r.parentElement));dialog.close();toast('Opiniões exibidas por '+(b.dataset.sort==='recent'?'mais recentes':'relevância'));});});
$$('.ui-review-capability-comments__comment').forEach((r,i)=>r.dataset.reviewIndex=i);
$('#dropdown-button-rating')?.addEventListener('click',()=>{modal('<h2>Filtrar por qualificação</h2><div class="local-options">'+[0,5,4,3,2,1].map(n=>`<button data-rating="${n}">${n?n+' estrelas':'Todas as qualificações'}</button>`).join('')+'</div>');$$('[data-rating]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.rating);$$('.ui-review-capability-comments__comment').forEach(r=>r.hidden=n!==0&&n!==5);dialog.close();if(n&&n!==5)toast('Nenhuma opinião com esta nota nos comentários capturados.');});});
$$('button').filter(b=>b.textContent.trim()==='Perguntar').forEach(b=>b.onclick=()=>{const input=$('#questions input')||$('input[aria-label="questions-ai-form-input"]');if(!input?.value.trim()){input?.focus();toast('Digite uma pergunta sobre o produto.');return;}modal(`<h2>Sua pergunta</h2><p>${esc(input.value)}</p><p>Pergunta demonstrativa. Nenhuma mensagem foi enviada.</p>${sourceLink('Abrir perguntas no Mercado Livre')}`);});

// Original horizontal cards can also be browsed using their arrow controls.
$$('.andes-carousel-snapped').forEach(carousel=>{const track=$('.andes-carousel-snapped__wrapper',carousel)||$('.andes-carousel-snapped__container',carousel);if(!track)return;track.style.overflowX='auto';$$('button',carousel).filter(b=>/Seguinte|Anterior/.test(b.getAttribute('aria-label')||'')).forEach(b=>b.onclick=()=>track.scrollBy({left:(/Anterior/.test(b.getAttribute('aria-label'))?-1:1)*track.clientWidth*.85,behavior:'smooth'}));});
$$('form.nav-search').forEach(form=>form.addEventListener('submit',()=>{const q=$('input',form)?.value.trim();if(q)toast('Busca demonstrativa: explore as variantes deste produto.');}));
// Keep the two seller offers mutually exclusive and preserve their captured prices.
const offers=$$('.ui-pdp-buy-box-offers__offer-list-item');
const offerDetails=$('.ui-pdp-buy-box-offers__offer-list-children');
const priceContainer=$('#price .ui-pdp-price__main-container');
const initialPrice=priceContainer?.innerHTML;
const originalOffer=offers.find(o=>$('input[type=radio]',o)?.checked);
offers.forEach(offer=>{
 const radio=$('input[type=radio]',offer);if(!radio)return;
 radio.name='local-seller-offer';
 radio.addEventListener('change',()=>{
  offers.forEach(o=>{const selected=o===offer;o.classList.toggle('ui-pdp-buy-box-offers__offer-list-item--SELECTED',selected);o.classList.toggle('ui-pdp-buy-box-offers__offer-list-item--NOT-SELECTED',!selected);o.style.maxHeight=selected?'none':'108px';});
  if(priceContainer)priceContainer.innerHTML=offer===originalOffer?initialPrice:$('.ui-pdp-price__main-container',offer).innerHTML;
  if(offerDetails){$('.ui-pdp-buy-box-offers__offer-content',offer).append(offerDetails);const shipping=$('.xprod-lib-shipping-section',offerDetails);if(shipping)shipping.hidden=offer!==originalOffer;let note=$('.local-offer-note',offerDetails);if(!note){note=document.createElement('p');note.className='local-offer-note';note.textContent='Consulte o prazo de entrega desta oferta no anúncio original.';offerDetails.prepend(note);}note.hidden=offer===originalOffer;}
  toast('Oferta selecionada');
 });
});
const reviews=$$('.ui-review-capability-comments__comment');
reviews.forEach((review,i)=>{const date=$('[class*=date-container]',review)?.textContent||'';const number=Number(date.match(/\d+/)?.[0])||1;review.dataset.ageMonths=date.includes('ano')?number*12:number;review.dataset.originalOrder=i;});
$('#dropdown-button-orderCriteria')?.addEventListener('click',()=>{
 $$('[data-sort]',content).forEach(button=>button.onclick=()=>{const order=button.dataset.sort;[...reviews].sort((a,b)=>order==='recent'?Number(a.dataset.ageMonths)-Number(b.dataset.ageMonths):Number(a.dataset.originalOrder)-Number(b.dataset.originalOrder)).forEach(r=>r.parentElement.parentElement.append(r.parentElement));dialog.close();toast(order==='recent'?'Opiniões mais recentes primeiro':'Opiniões mais relevantes primeiro');});
});
$$('button').filter(b=>(b.getAttribute('aria-label')||'').includes('Enviar para')).forEach(b=>b.onclick=()=>modal('<h2>Local de entrega</h2><p>O endereço exibido pertence à consulta de referência. A consulta de outro CEP não está disponível neste teste.</p>'+sourceLink('Consultar meu CEP')));
$('#nav-footer-access-switch')?.addEventListener('click',()=>modal('<h2>Sobre esta página</h2><p>Reprodução visual local do anúncio Romanzo Infanti, consultado em 26/09/2026. As funções de carrinho e favoritos são demonstrativas e ficam apenas neste navegador.</p>'+sourceLink()));
offers.forEach(offer=>offer.addEventListener('click',event=>{if(event.target.closest('button,a,select,input'))return;const radio=$('input[type=radio]',offer);if(radio&&!radio.checked){radio.checked=true;radio.dispatchEvent(new Event('change',{bubbles:true}));}}));

// Preserve local handlers while keeping reference-only controls on this page.
document.addEventListener('click',e=>{const control=e.target.closest('[data-local-only]');if(control&&!e.defaultPrevented)e.preventDefault();});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-local-only]')){e.preventDefault();e.target.click();}});
