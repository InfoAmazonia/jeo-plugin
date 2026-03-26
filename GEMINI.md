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
  - **Auto-Teste de API:** Ao abrir a aba, o sistema roda silenciosamente um "Hello World" formatado em JSON para validar a chave do provedor escolhido, exibindo um badge visual ("Active" ou "Error") e impedindo o salvamento do painel se a chave estiver vazia.
  - **Checkbox "Use Custom Prompt":** Permite testar diferentes prompts e ocultar/bloquear a caixa de texto caso o usuário queira voltar ao comportamento padrão do JEO sem deletar suas anotações temporárias.
  - **Live Validator ("Validate Custom Prompt"):** Um botão abaixo da caixa de texto permite disparar um teste fictício com a IA configurada para garantir que as alterações no JSON não quebrarão o parser.
  - **Assistente de Prompt:** Uma caixa de chat aciona a rota REST `/ai-chat-prompt-generator`. A LLM ativa se transforma num *Engenheiro de Prompt Especialista no JEO* e gera uma string perfeita. O texto possui auto-save em `localStorage` (`jeo_ai_assistant_context`).
- **Tradução Dinâmica (`gettext`):** As configurações de IA são traduzidas em tempo real para `pt_BR` (`class-ai-handler.php`), evitando recompilar os `.mo`.
- **Skeleton Loader (1s):** As abas usam `location.hash` (`#tab-ai`). Ao recarregar a tela, um *Skeleton Loader* bloqueante oculta toda a UI (incluindo o botão de "Save Changes", que possui um `margin-top: 50px` fluido) por 1 segundo, resultando num carregamento e transição sem *Flicker*.
- **Nova Tela (AI Debug Logs):** Submenu do JEO que exibe as últimas interações (paginada em 25, com busca) e traz botões "View Details" abrindo modais formatados em Pretty-JSON.

### 3. Editor do Gutenberg (Frontend - React)
- **Botão Dinâmico:** O botão na barra lateral de Geolocalização reage ao PHP exibindo, por exemplo, "Georeference with OpenAI (GPT)".
- **Modal de Revisão (Cards Modernos):** Quando a IA devolve resultados, o sistema **não salva automaticamente**. Um Modal exibe checkboxes, o Nome, as Coordenadas e o **Trecho Exato (`quote`)**.
- **Persistência Rigorosa:** Ao aprovar, o React limpa campos de controle (`_selected`) e salva o objeto perfeitamente formatado no banco, incluindo o campo `_ai_quote` (adicionado ao Schema REST do WP `register_post_meta`). Isso garante compatibilidade nativa com o banco de dados.

### 4. A Nova Home (JEO Dashboard)
O JEO agora possui uma Dashboard imersiva de "Boas-Vindas" (`toplevel_page_jeo-main-menu`), substituindo redirecionamentos antigos.
- **Tela Cheia (100vh):** O dashboard sobrepõe a UI padrão do WordPress (removendo rodapés e *scrolls* extras) para exibir um mapa em tela cheia do site.
- **Integração MapLibre:** A configuração padrão de motor de mapa foi revertida para `maplibregl`. A Dashboard sempre usa MapLibre a menos que haja um token explícito do Mapbox.
- **Interface Flutuante (Header Box):** Possui um *Card* minimizável que se contrai em um ícone (JEO Logo), despoluindo a tela.
- **Endpoint `/all-pins` Autenticado:** Uma requisição AJAX (`X-WP-Nonce`) carrega rapidamente uma query de SQL limpa (ignorando `get_posts`) que devolve todos os pontos do site e seus respectivos links de edição, eliminando pontos matematicamente idênticos (arredondamento de 5 casas).
- **Animação e Popups:** Os marcadores caem do topo (`staggered drop animation`) e são clicáveis. O *Popup* gerado mostra a *Quote* (o trecho original onde a IA encontrou a menção) e dois botões de atalho: "View Post" e "Edit Post".

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