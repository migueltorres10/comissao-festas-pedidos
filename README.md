# Comissão de Festas — Registo de pedidos

PWA leve para registar pedidos nos eventos da Comissão de Festas 2026/2027 de Duas Igrejas, Penafiel. Funciona sem backend: cada dispositivo mantém o seu próprio catálogo e os seus próprios pedidos em IndexedDB.

A interface móvel usa vistas separadas para categorias e artigos, seleção de quantidade em painel inferior e uma barra fixa para consultar o pedido. O ecrã principal usa a área útil `100dvh`, sem scroll da página: as grelhas/listas e os painéis têm scroll interno apenas quando necessário. É possível manter vários pedidos abertos em simultâneo (por exemplo, Pedido 1, Pedido 2 ou Mesa 1), alternar entre eles e concluir/eliminar apenas o pedido ativo.

No iPhone, «Pedidos (N)» abre a lista de pedidos em curso e «+ Novo» permite criar um pedido por mesa, nome ou sem identificação. O nome pode ser alterado posteriormente. A aplicação avisa quando já existe uma mesa aberta, evitando duplicações acidentais.

No painel «Ver pedido», as ações de limpar e concluir atuam diretamente sobre o pedido móvel ativo. Se existirem muitas categorias ou artigos, a deslocação ocorre apenas dentro da respetiva grelha/lista; a página principal mantém o cabeçalho e a barra inferior fixos.

Categorias e artigos aparecem em duas colunas no telemóvel, com cartões compactos. O contentor de scroll ocupa toda a largura: a barra de deslocação do navegador fica na margem direita, com o espaçamento aplicado apenas aos cartões. Abrir um painel e adicionar unidades conserva a posição da lista.

Ao tocar em «Concluir», abre-se o painel «Receber e concluir» com o campo «Valor recebido» focado e `inputmode="decimal"` para o teclado numérico decimal do iPhone. O troco é calculado enquanto se escreve e aparece em destaque. Valores insuficientes não permitem concluir. «Confirmar e concluir» retira apenas esse pedido; «Voltar» mantém-no aberto.

## Administração

O botão de configuração abre o acesso local de administrador. Na primeira utilização é definido um PIN com pelo menos quatro dígitos; apenas o hash SHA-256 é guardado no dispositivo. O modo administrador permite gerir categorias, artigos, preços, estados, ícones, ordem e importação/exportação. Para artigos sem preço confirmado, deixe o preço vazio: ficam como «Preço por definir» e não podem ser adicionados a pedidos.

Esta proteção é local ao dispositivo e não equivale a autenticação centralizada. Os voluntários utilizam por defeito o modo operacional e não veem os controlos de edição.

O catálogo publicado inclui os artigos e preços fornecidos pelo responsável em 20/10/2026: 75 opções de venda, incluindo Favaios com cerveja pequeno e as doses de 2,5 cl de Beirão, CRF, Croft e Whisky. Chiclas, chupas, gomas e rebuçados são vendidos à unidade. Mantêm-se as seis categorias existentes: Cafetaria, Cervejaria, Destilados e Vinhos, Sumos e Águas, Snack e Petiscos. Os alimentos da segunda lista fornecida estão em Petiscos; os restantes snacks ficam em Snack. Os valores podem ser alterados no modo administrador. Não é criado histórico financeiro.

A revisão `menu-2026-10-20-1` atualiza uma única vez o catálogo de cada instalação quando essa instalação recebe a nova versão publicada. Mantém as categorias existentes, os identificadores dos artigos correspondentes, o PIN, os artigos personalizados não pertencentes à demonstração e os pedidos em curso com os seus nomes/preços originais. Os artigos antigos de demonstração não presentes na nova lista saem do catálogo, mas continuam nos pedidos onde já foram adicionados. Os novos pedidos usam os novos preços. Edições administrativas posteriores não são repostas ao reiniciar.

Como a aplicação é estática e sem servidor, uma alteração feita dentro do administrador de um dispositivo fica nesse dispositivo. Para distribuir alterações aos restantes telemóveis, exporte o catálogo e importe-o em cada dispositivo; para alterar o catálogo publicado por defeito é necessário atualizar e republicar o projeto.

## Desenvolvimento

```bash
npm install
npm run dev
```

Verificação local:

```bash
npm test
npm run build
npx playwright install webkit chromium
npm run test:ui
```

Os testes de interface usam WebKit com emulação de iPhone nas dimensões 320×568, 375×667, 390×844, 430×932, 768×1024 e 1280×800. Incluem um catálogo sintético de 12 categorias e 30 artigos, medição de `scrollHeight/clientHeight/scrollTop`, interação com o último cartão, preservação de posição, recebimento/troco, isolamento dos pedidos, persistência, administração e funcionamento offline. Verificam também as 75 opções reais, nomes compridos sem sobreposição e a atualização de uma instalação antiga com pedido aberto. Um teste Chromium adicional envia um gesto tátil real pelo protocolo de input. As capturas ficam em `test-results/`, fora do versionamento. A emulação não reproduz a interface física do teclado nem as barras do Safari num iPhone real.

O Service Worker `pedidos-v13` pré-carrega o JavaScript e CSS da build, remove apenas caches de versões anteriores da aplicação e preserva IndexedDB. Ao obter uma nova versão num dispositivo já controlado, a aplicação espera pela gravação pendente antes de recarregar. A navegação online procura a versão publicada; offline usa a última versão instalada.

## Catálogo e utilização

Na área «Configuração» podem ser geridas categorias e artigos. O catálogo pode ser exportado para JSON e importado noutro dispositivo. A importação valida a versão e substitui apenas o catálogo; os pedidos abertos são preservados, incluindo artigos que entretanto deixem de existir no catálogo. Os preços dos artigos já adicionados ficam guardados no próprio pedido.

Os dados são guardados apenas no dispositivo e navegador em utilização. O armazenamento pode ser eliminado pelas definições do navegador; recomenda-se exportar cópias do catálogo antes de trocar de dispositivo ou limpar dados.

## Instalação

- iPhone/iPad: abrir a publicação no Safari, tocar em «Partilhar» e escolher «Adicionar ao ecrã principal».
- Android: abrir no Chrome e escolher «Instalar aplicação» quando for apresentado o aviso.
- Computador: abrir no Chrome/Edge e usar o ícone de instalação na barra de endereço; também pode ser usado diretamente no navegador.

## Publicação

O workflow `.github/workflows/deploy.yml` compila e publica no GitHub Pages após cada push para `main`. É necessário ativar Pages com origem «GitHub Actions» nas definições do repositório e manter o repositório privado apenas se o plano GitHub da conta suportar Pages nesse contexto.

Não são incluídos pagamentos, faturação, stocks, clientes, contas, sincronização ou base de dados remota.
