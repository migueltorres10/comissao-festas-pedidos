# Comissão de Festas — Registo de pedidos

PWA leve para registar pedidos nos eventos da Comissão de Festas 2026/2027 de Duas Igrejas, Penafiel. Funciona sem backend: cada dispositivo mantém o seu próprio catálogo e os seus próprios pedidos em IndexedDB.

A interface móvel usa vistas separadas para categorias e artigos, seleção de quantidade em painel inferior e uma barra fixa para consultar o pedido. O ecrã principal usa a área útil `100dvh`, sem scroll da página: as grelhas/listas e os painéis têm scroll interno apenas quando necessário. É possível manter vários pedidos abertos em simultâneo (por exemplo, Pedido 1, Pedido 2 ou Mesa 1), alternar entre eles e concluir/eliminar apenas o pedido ativo.

No iPhone, «Pedidos (N)» abre a lista de pedidos em curso e «+ Novo» permite criar um pedido por mesa, nome ou sem identificação. O nome pode ser alterado posteriormente. A aplicação avisa quando já existe uma mesa aberta, evitando duplicações acidentais.

No painel «Ver pedido», as ações de limpar e concluir atuam diretamente sobre o pedido móvel ativo. Se existirem muitas categorias ou artigos, a deslocação ocorre apenas dentro da respetiva grelha/lista; a página principal mantém o cabeçalho e a barra inferior fixos.

## Administração

O botão de configuração abre o acesso local de administrador. Na primeira utilização é definido um PIN com pelo menos quatro dígitos; apenas o hash SHA-256 é guardado no dispositivo. O modo administrador permite gerir categorias, artigos, preços, estados, ícones, ordem e importação/exportação. Para artigos sem preço confirmado, deixe o preço vazio: ficam como «Preço por definir» e não podem ser adicionados a pedidos.

Esta proteção é local ao dispositivo e não equivale a autenticação centralizada. Os voluntários utilizam por defeito o modo operacional e não veem os controlos de edição.

## Desenvolvimento

```bash
npm install
npm run dev
```

Verificação local:

```bash
npm test
npm run build
```

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
