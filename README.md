# Página Romanzo Infanti

Reprodução local da página informada, consultada em 26/09/2026. Preserva o HTML visual, os estilos, as fontes, as fotos e as sete variantes reais do anúncio.

## Executar

```sh
npm install
npm run dev
```

Abra http://localhost:5173. O servidor escuta apenas em 127.0.0.1.

## Conteúdo e interações

- Página principal com 12 fotos e seis páginas adicionais de variantes, com galerias, títulos, preços e informações próprios.
- Miniaturas, ampliação com navegação por teclado e fotos dos compradores.
- Favoritos e carrinho de demonstração persistidos no navegador; seleção de quantidade e remoção de itens.
- Ficha técnica expansível, descrição, compartilhamento, meios de pagamento, ordenação e filtro dos comentários capturados.
- Estilos originais no desktop e adaptação para telas menores.
- Recursos visuais salvos em `assets/`; nenhum script original de rastreamento ou autenticação é executado.

## Limites

É uma reprodução visual, não uma loja integrada ao Mercado Livre. O botão Comprar agora abre https://google.com na mesma aba, como teste de redirecionamento. O envio de perguntas encaminha ao anúncio original. Não há checkout, login, consulta real de CEP ou atualização de estoque/preço. As 828 avaliações são a contagem informada na fonte; foram preservados os cinco comentários e as fotos disponíveis na página inicial, não o histórico completo. O vídeo abre a origem. Recomendações e links institucionais também apontam à origem. Todas as variantes, inclusive preto/bronze, estão habilitadas para o teste; isso não representa disponibilidade real de estoque ou entrega.

A fidelidade é ao estado consultado; dados, publicidade, localização e conteúdo dinâmico podem mudar na origem. As sete variantes usam o preço de teste de R$ 67,90, inclusive no carrinho.

## Deploy na Vercel

Importe o repositório `flavialimahot5-bot/carrinhosdebabys` como novo projeto na Vercel e clique em Deploy. O arquivo `vercel.json` configura automaticamente:

- Framework: Other (site estático).
- Instalação: `npm ci`.
- Build: `npm run build`.
- Diretório de saída: `dist`.
- Diretório raiz: raiz do repositório.
- Nenhuma variável de ambiente necessária.

O build verifica as sete páginas e copia somente HTML, JavaScript, CSS e recursos para `dist`. Capturas de referência, ferramentas e dependências não são publicadas no site. As capturas ficam somente no ambiente local, fora do Git. O site publicado continua demonstrativo, sem checkout real.

Para verificar localmente: `npm ci` e `npm run build`.

## Arquivos

- `index.html`, `variant-1.html` a `variant-6.html`: páginas geradas.
- `app.js`: interações locais.
- `local.css`: controles adicionais e adaptação mobile.
- `responsive.js`: organiza os mesmos componentes conforme a largura, adiciona galeria por deslize e cabeçalho mobile, preservando estado e eventos.
- `source.json`, `source-1.json` a `source-6.json`: capturas da referência sem scripts.
- `build.mjs`: sanitiza as capturas locais, baixa recursos e gera as páginas (`npm run rebuild:reference`; requer as capturas locais).
- `package-site.mjs`: empacota o site validado em `dist` para publicação (`npm run build`).
- `asset-report.json`: fontes consultadas e falhas de download.
- `verify.mjs`: verificação estrutural (`node verify.mjs`).

O build de publicação usa os HTMLs versionados e não depende da página externa. Para regenerar o conteúdo a partir das capturas locais, faça ajustes em `build.mjs` e execute `npm run rebuild:reference`; depois versione os HTMLs resultantes. Interações e estilos podem ser editados em `app.js`, `responsive.js` e `local.css`.

## Validação responsiva

Verificados no navegador em 26/09/2026: tamanhos solicitados de 320, 375, 430, 768, 1024 e 1440 px, sem exceder a largura da página. O navegador local aplica escala própria, portanto as larguras CSS observadas foram 355, 416, 477, 853, 1137 e 1600 px. As sete variantes foram conferidas no modo mobile com galeria, título, preço, compra e cinco comentários presentes. Testados ampliação, navegação por fotos, seleção de variante, quantidade, resumo de compra, ofertas, filtro e ordenação dos comentários, além de restauração dos componentes ao retornar ao desktop. Não substitui testes em aparelhos físicos ou integração com backend.
