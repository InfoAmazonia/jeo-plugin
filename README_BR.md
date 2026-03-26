# JEO

O plugin JEO atua como uma plataforma de geojornalismo que permite a organizações de notícias, blogueiros e ONGs publicarem matérias jornalísticas como camadas de informações em mapas digitais interativos.

Com o JEO, a criação da interação entre camadas de dados e informações contextuais é intuitiva e interativa. Você pode publicar matérias georreferenciadas e criar páginas ricamente desenhadas para cada uma das histórias em destaque.

Ao mesmo tempo, simplesmente inserindo os IDs de camadas hospedadas no [Mapbox](https://www.mapbox.com/), você pode gerenciar mapas sofisticados sem perder desempenho, adicionar legendas diretamente com HTML e configurar os parâmetros do mapa. Tudo diretamente no painel do WordPress.

## 🤖 O que há de novo na v3.5.1 (Georreferenciamento com IA)
O JEO agora conta com um **Co-Piloto de IA** que pode analisar autonomamente o conteúdo e o título do seu post para encontrar locais mencionados e extrair suas coordenadas exatas!

- **LLMs Suportadas:** Google Gemini (2.5 Flash), OpenAI (GPT-4o) e DeepSeek.
- **Aprovações Inteligentes:** Modal de validação visual para revisar, aprovar ou descartar as sugestões da IA antes de adicioná-as ao mapa.
- **Estúdio de Engenharia de Prompt:** Um painel de configurações dedicado onde você pode conversar com a LLM ativa para gerar Prompts de Sistema altamente otimizados e rígidos, adaptados às suas regras editoriais.
- **Dicionários de Dados Brasileiros:** Base de conhecimento embarcada com biomas, terras indígenas e territórios quilombolas para máxima precisão no contexto nacional.
- **Depuração Robusta:** Uma página dedicada de Logs de IA para inspecionar cada prompt enviado e o JSON bruto recebido.

## Configurando o ambiente local

Primeiro de tudo, clone este repositório.
Note que você NÃO pode cloná-lo diretamente no diretório `plugins` do WordPress.

1. Navegue até a pasta de plugins do seu servidor WordPress local;
2. Crie um link simbólico (symlink) apontando para a pasta `src` deste repositório:
```bash
ln -s /caminho/para/este/repositorio/src jeo
```

Se você preferir usar **Docker**, fornecemos um arquivo `docker-compose.yml` que monta automaticamente o ambiente:

```bash
docker-compose up -d
```

## Compilação de Assets (Frontend)
O JEO usa React e Webpack para os blocos do Gutenberg.

1. Instale as dependências: `npm install`
2. Inicie o modo de desenvolvimento: `npm run start`
3. Para build de produção: `npm run build`

## Deploy para Homologação/Produção
Use o script de build automatizado para gerar o pacote ZIP limpo:
```bash
./build.sh
```
