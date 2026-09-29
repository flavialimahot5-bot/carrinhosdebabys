// Move the same interactive elements, preserving listeners and state at every breakpoint.
const mobileHeader=document.createElement('header');mobileHeader.className='local-mobile-header';
mobileHeader.innerHTML=`<div class="local-mobile-top"><a href="/" aria-label="Mercado Livre — início" class="local-mobile-logo"><img src="/assets/2c28cf763886dddfdb.webp" alt="Mercado Livre" width="268" height="68" loading="eager"></a><form class="local-mobile-search" role="search"><input aria-label="Buscar produtos" placeholder="Buscar produtos, marcas e muito mais…"><button aria-label="Buscar">⌕</button></form><button class="local-mobile-cart" aria-label="Abrir carrinho"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h3l3 13h11l3-9H6M9 21h.01M18 21h.01" stroke-linecap="round"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg></button></div><button class="local-mobile-delivery">⌖ Consulte as opções de entrega <span>›</span></button>`;
document.body.prepend(mobileHeader);
$('.local-mobile-cart').onclick=showCart;
$('.local-mobile-search').onsubmit=e=>{e.preventDefault();const value=$('input',e.currentTarget).value.trim();if(value)toast('Busca demonstrativa: explore as variantes deste produto.');};
$('.local-mobile-delivery').onclick=()=>modal('<h2>Opções de entrega</h2><p>Os prazos e valores exibidos são demonstrativos. A consulta de CEP não está disponível neste teste.</p>'+sourceLink('Consultar entrega'));
const mobileProduct=document.createElement('section');mobileProduct.className='local-mobile-product';mobileProduct.setAttribute('aria-label','Detalhes do produto');
const root=$('.ui-pdp-container--pdp');root.before(mobileProduct);
const slots=[['heading','.ui-pdp-container__top-wrapper'],['gallery-slot','.ui-pdp-gallery-container'],['variants','.ui-pdp-outside_variations'],['price','#price'],['buybox','#buybox-form'],['features','#ui-vpp-highlighted-specs']];
const movable=[];
for(const [name,selector] of slots){const el=$(selector);if(!el)continue;const marker=document.createComment('Original position: '+name);el.before(marker);const slot=document.createElement('div');slot.className='local-mobile-slot local-mobile-'+name;mobileProduct.append(slot);movable.push({el,marker,slot});}
const media=matchMedia('(max-width: 900px)');
function layout(){for(const {el,marker,slot} of movable){if(media.matches)slot.append(el);else marker.after(el);}document.body.classList.toggle('local-mobile',media.matches);}
media.addEventListener('change',layout);layout();

// A horizontally swipeable gallery on phones, with all original photos available.
const gallery=$('.ui-pdp-gallery');
const mobileGallery=document.createElement('div');mobileGallery.className='local-mobile-gallery';
mobileGallery.innerHTML=`<div class="local-mobile-photo-track" aria-label="Fotos do produto">${pictures.map((img,i)=>`<button class="local-mobile-photo" aria-label="Ampliar foto ${i+1} de ${pictures.length}" data-mobile-photo="${i}"><img src="${esc(img.src)}" alt="${esc(img.alt)}" loading="${i?'lazy':'eager'}"></button>`).join('')}</div><span class="local-mobile-photo-count" aria-live="polite">1 / ${pictures.length}</span><div class="local-mobile-dots">${pictures.map((_,i)=>`<button aria-label="Ir para foto ${i+1}" data-mobile-dot="${i}" class="${i===0?'active':''}"></button>`).join('')}</div><button class="local-mobile-video">▷ Ver vídeo do produto</button>`;
gallery.after(mobileGallery);
const track=$('.local-mobile-photo-track');
$$('[data-mobile-photo]').forEach(b=>b.onclick=()=>showPhoto(Number(b.dataset.mobilePhoto)));
$$('[data-mobile-dot]').forEach(b=>b.onclick=()=>track.scrollTo({left:Number(b.dataset.mobileDot)*track.clientWidth,behavior:'smooth'}));
track.addEventListener('scroll',()=>{const i=Math.round(track.scrollLeft/track.clientWidth);$('.local-mobile-photo-count').textContent=`${i+1} / ${pictures.length}`;$$('[data-mobile-dot]').forEach((b,j)=>b.classList.toggle('active',i===j));},{passive:true});
$('.local-mobile-video').onclick=()=>modal('<h2>Vídeo do produto</h2><p>O vídeo não está disponível nesta demonstração.</p>'+sourceLink('Assistir ao vídeo'));
// Recommendations arrows belong to the surrounding section, not the inner track.
$$('section.andes-carousel-snapped__container').forEach(section=>{const viewport=$('.andes-carousel-snapped',section);if(!viewport)return;$$('button[aria-label]',section).forEach(b=>{const label=b.getAttribute('aria-label');if(/Seguinte|Anterior/.test(label))b.onclick=()=>viewport.scrollBy({left:(label==='Anterior'?-1:1)*viewport.clientWidth*.8,behavior:'smooth'});});});
const emptyReview=document.createElement('p');emptyReview.className='local-empty-reviews';emptyReview.textContent='Nenhuma opinião com esta nota entre os comentários disponíveis nesta reprodução.';emptyReview.hidden=true;$('.ui-review-capability-comments')?.after(emptyReview);
$('#dropdown-button-rating')?.addEventListener('click',()=>$$('[data-rating]',content).forEach(b=>b.addEventListener('click',()=>emptyReview.hidden=!Number(b.dataset.rating)||Number(b.dataset.rating)===5)));
// Fix missing expanded controls in server-rendered variant snapshots.
$$('#highlighted_specs_attrs .ui-pdp-collapsable').filter(el=>!$('button.ui-pdp-collapsable__action',el)).forEach(el=>{const box=$('.ui-pdp-collapsable__container',el);if(!box)return;const button=document.createElement('button');button.className='local-spec-toggle';button.textContent='Conferir todas as características';button.setAttribute('aria-expanded','false');el.append(button);button.onclick=()=>{const expanded=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(expanded));el.classList.toggle('local-expanded',expanded);el.classList.toggle('ui-pdp-collapsable--is-collapsed',!expanded);box.style.maxHeight=expanded?'none':'400px';button.textContent=expanded?'Ver menos características':'Conferir todas as características';};});
