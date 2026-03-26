# Contexto do Plugin JEO - Gemini CLI (v3.5.0 Final)

O JEO é uma plataforma de geojornalismo para WordPress que permite a organizações de notícias, blogueiros e ONGs publicarem matérias jornalísticas como camadas de informações em mapas digitais interativos.

**Status Atual:** O projeto atingiu a versão de produção **3.5.0** (substituindo a antiga 3.0.0-rc.3), consolidando o Georreferenciamento Automatizado via IA como funcionalidade nativa.

## Visão Geral do Projeto

- **Tipo:** Plugin para WordPress
- **Propósito:** Plataforma de geojornalismo interativa focada no editor Gutenberg.
- **Principais Tecnologias:**
    - **Backend:** PHP (WordPress Plugin API, OOP, Custom Autoloader).
    - **Frontend:** JavaScript e TypeScript (React, Gutenberg Blocks, `@wordpress/scripts`).
    - **Mapas:** MapLibre GL JS, Mapbox GL JS e suporte estendido via React Map GL e Leaflet.
    - **Estilização:** CSS/Sass integrado ao fluxo do Webpack.
    - **Ambiente de Desenvolvimento:** Docker Compose (WordPress + MariaDB).

## Georreferenciamento com IA (Feature Estável v3.5.0)

O sistema agora é capaz de analisar autonomamente o título e o conteúdo dos posts para identificar locais mencionados e extrair suas coordenadas, agindo como um "Co-Piloto Editorial".

### 1. Arquitetura Restritiva e Segura (Backend - PHP)
- **Localização:** `src/includes/ai/`
- **Padrão Adapters:** Chamadas a LLMs usam a abstração `AI_Adapter` injetada via `AI_Handler`.
- **Provedores (Modelos Otimizados de 2026):**
  - **Google Gemini:** Utiliza `gemini-2.5-flash` (A série 1.5 foi desativada pelo Google).
  - **OpenAI:** Utiliza `gpt-4o`.
  - **DeepSeek:** Utiliza `deepseek-chat`.
- **Prevenção de Alucinação (Temperature = 0.1):** Todos os provedores são chamados com baixíssima temperatura para forçar consistência de API.
- **Prompt API Level:** O `System Prompt` padrão foi configurado para ser agressivo: rejeita textos conversacionais e força o formato estrutural `[{"name": "...", "lat": 0, "lng": 0, "quote": "..."}]`. O campo "quote" garante que a IA prove de onde tirou a coordenada.
- **Parser de Matrizes (Blindagem de JSON):** A classe base rastreia blocos de Markdown e atua limpando lixo extra (buscando apenas blocos que iniciam e terminam com `[` e `]`).

### 2. Interface de Configuração (Settings) e Engenharia de Prompt
- **Aba AI (v3.5) Refatorada:** Gerencia as chaves de API e foca no **System Prompt**.
  - **Checkbox "Use Custom Prompt":** Permite testar diferentes prompts e ocultar/bloquear a caixa de texto caso o usuário queira voltar ao comportamento padrão do JEO sem deletar suas anotações temporárias.
  - **Live Validator ("Validate Custom Prompt"):** Um botão abaixo da caixa de texto permite disparar um teste fictício com a IA configurada para garantir que as alterações no JSON não quebrarão o parser.
  - **Assistente de Prompt:** Uma caixa de chat (com suporte a `Enter` ou `Shift+Enter`) aciona a rota REST `/ai-chat-prompt-generator`. A LLM ativa se transforma num *Engenheiro de Prompt Especialista no JEO* e cospe uma string perfeita que já preenche a tela. O texto digitado pelo usuário possui auto-save em `localStorage` (`jeo_ai_assistant_context`), impedindo a perda de raciocínios complexos durante a navegação entre as abas.
- **Tradução Dinâmica (`gettext`):** As configurações de IA são traduzidas em tempo real para `pt_BR` (`class-ai-handler.php`), evitando recompilar os `.mo`.
- **Skeleton Loader (1s):** As abas usam `location.hash` (`#tab-ai`). Ao recarregar a tela, um *Skeleton Loader* bloqueante (com *Easter Egg* da v4.0) oculta toda a UI (incluindo o botão de "Save Changes", que possui um `margin-top: 50px` fluido) por 1 segundo, resultando num carregamento e transição sem *Flicker*.
- **Nova Tela (AI Debug Logs):** Foi criada uma página própria em *WP List Table* (Submenu do JEO) que exibe as últimas interações. É paginada (25 por tela), possui caixa de Busca e traz botões "View Details", que abrem o *Input* e *Output* limpos através de `<dialog>` modais formatados em Pretty-JSON.

### 3. Editor do Gutenberg (Frontend - React)
- **Botão Dinâmico:** O botão na barra lateral de Geolocalização (em `src/js/src/posts-sidebar/index.js`) reage ao PHP exibindo, por exemplo, "Georeference with OpenAI (GPT)".
- **Modal de Revisão (Cards Modernos):** Quando a IA devolve resultados, o sistema **não salva automaticamente** os metadados. Um Modal elegante intercepta a ação. Ele exibe cards brancos minimalistas contendo:
  - Checkboxes (selecionáveis individualmente).
  - O Nome e as Coordenadas geográficas.
  - Um `<blockquote>` formatado e em itálico que mostra o **Trecho Exato** do post onde a IA encontrou a menção (`quote`).
- Somente após a aprovação humana ("Save Selected Locations"), a marcação é gravada de forma aditiva na tela e o *quote* é expurgado para não poluir o banco de dados.

## Construção e Execução

### 1. Ambiente Local de Dev
```bash
# Subir ambiente (WP + MariaDB)
docker-compose up -d

# Compilar assets JS/React em tempo real
npm install
npm run start
```
*A pasta `src/` é montada como um volume via Docker diretamente no caminho do plugin.*

### 2. Deploy Seguro para Produção (`build.sh`)
O script `build.sh` compila e zipa a versão oficial **3.5.0**.

```bash
./build.sh
```
**Regras do Deploy (Evitando 404 e Vazamentos):**
1. Faz `npm run build` e `composer install --no-dev --optimize-autoloader`.
2. Cria o arquivo `jeo-3.5.0.zip` mantendo a estrutura da pasta `src/`.
3. **Limpeza Cirúrgica:** Exclui pastas pesadas (`js/src/`), **mas preserva os arquivos SVG** (como `jeo.svg`), o que previne Erros Fatais 404 no Menu raiz do WordPress.
4. **Segurança:** Remove obrigatoriamente arquivos sensíveis, como o log do debug da IA (`*.log`) e configurações (`.editorconfig`).