# Comissão de Festas — Registo de pedidos

PWA leve para registar pedidos nos eventos da Comissão de Festas 2026/2027 de Duas Igrejas, Penafiel. Funciona sem backend: cada dispositivo mantém o seu próprio catálogo e os seus próprios pedidos em IndexedDB.

A interface móvel usa vistas separadas para categorias e artigos, seleção de quantidade em painel inferior e uma barra fixa para consultar o pedido. É possível manter vários pedidos abertos em simultâneo (por exemplo, Pedido 1, Pedido 2 ou Mesa 1), alternar entre eles e concluir/eliminar apenas o pedido ativo.

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
