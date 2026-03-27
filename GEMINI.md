# Contexto do Plugin JEO - Gemini CLI (v3.5.4-experimental Master)

O JEO é uma plataforma de geojornalismo para WordPress que permite a organizações de notícias, blogueiros e ONGs publicarem matérias jornalísticas como camadas de informações em mapas digitais interativos.

**Status Atual:** Versão **3.5.4-experimental**. O projeto consolidou seu ecossistema de Inteligência Artificial, segurança de credenciais, curadoria territorial brasileira, expandiu o suporte a múltiplos motores de renderização e implementou integração dinâmica e universal para Custom Post Types (ACF, Pods, etc).

---

## 1. Visão Geral da Arquitetura

O JEO é construído com uma separação clara entre o motor de dados (PHP) e a interface de blocos interativos (React).

- **Tipo:** Plugin para WordPress.
- **Backend (PHP):** WordPress Plugin API, Programação Orientada a Objetos (OOP), Padrão Singleton, Autoloader Personalizado.
- **Frontend (JS/TS):** React, Gutenberg Blocks, `@wordpress/scripts`, Webpack.
- **Renderização de Mapas:** Suporte trial para **MapLibre GL JS** (padrão nativo v3.5+), **Mapbox GL JS** e **Google Maps JS API**.
- **Ambiente de Desenvolvimento:** Docker Compose (WordPress + MariaDB).

---

## 2. Ecossistema de Inteligência Artificial (v3.5.x)

O coração desta versão é o Co-Piloto Editorial de Georreferenciamento Automatizado.

### 2.1. Arquitetura de Adapters
Localizado em `src/includes/ai/`, o sistema usa o padrão **Factory/Adapter** injetado via `AI_Handler`.
- **Provedores Suportados (2026):**
  - **Google Gemini:** Utiliza `gemini-2.5-flash`.
  - **OpenAI:** Utiliza `gpt-4o`.
  - **DeepSeek:** Utiliza `deepseek-chat`.
- **Configuração Determinística:** Todas as chamadas são forçadas com **Temperature = 0.1**.

### 2.2. Blindagem de Prompt e Resiliência
- **Prompt API Level:** Injeção de cláusula de **Enforced Schema** inquebrável no final de qualquer prompt customizado, garantindo retorno obrigatório de `"name", "lat", "lng", "quote"`. 
- **Agressive JSON Parser:** Método `parse_json_from_text` (em `AI_Adapter.php`) utiliza Regex para ignorar lixo conversacional e extrair apenas o array de objetos.

### 2.3. Sistema de RAG Leve (Base de Conhecimento)
- **Localização:** `src/includes/ai/data/*.json`.
- **Dicionários Territoriais:** 10 categorias embarcadas (Biomas, TIs, Quilombos, etc.) que agem como autoridade geográfica durante o georreferenciamento por IA. Injetado dinamicamente caso o termo seja detectado no texto.

---

## 3. Experiência do Usuário (Settings UI)

### 3.1. Engenharia de Prompt e Assistant
- **Aba AI:** Refinamento de prompt com Assistente de Chat e persistência em `localStorage` (`jeo_ai_assistant_context`).
- **Live Validator:** Botão de simulação real antes do salvamento definitivo.
- **Auto-Teste de Chave:** Validação instantânea de API Keys ao carregar a aba. Bloqueia o salvamento do painel caso a chave do provedor ativo esteja vazia.

### 3.2. Configuração Universal de Post Types
- **Integração Dinâmica:** O JEO detecta automaticamente `Custom Post Types` públicos registrados no sistema (nativos, ACF, Pods ou via código).
- **Settings UI:** A gestão ocorre por meio de `checkboxes` dinâmicos na página de configurações, substituindo o antigo input estático (texto). A interface filtra tipos internos como `map` e `map-layer` para segurança.

### 3.3. Navegação e Performance
- **Skeleton Loader:** Transições suaves de 1 segundo entre abas.
- **Knowledge Base:** Gestão de dicionários com Visualizer Unificado (Listagem e Raw JSON) em modal de 85vh e Download Seguro.

---

## 4. Persistência de Dados e Segurança

### 4.1. WordPress REST Schema
- **Injeção Tardia (Priority 99):** O registro do esquema de geolocalização e metadados R.E.S.T. (incluindo `_geocode_lat`, `_ai_quote`, etc.) ocorre no gancho `init` tardiamente. Isso garante a vinculação perfeita com CPTs registrados por outros plugins.
- **Propriedades Registradas:** O campo `_ai_quote` está integrado ao Schema do `_related_point`, permitindo salvar o contexto original da IA no banco de dados. O React limpa chaves impuras antes de submeter ao WP REST API.

### 4.2. Segurança e Ciclo de Vida
- **Desativação:** Limpa **API Keys** e logs físicos. Exibe alerta de confirmação em JS na tela de plugins.
- **Exclusão:** `uninstall.php` remove as configurações globais (`jeo-settings`).
- **Integridade:** Metadados geográficos dos posts são mantidos permanentemente.

### 4.3. Compatibilidade PHP
- **Legacy Fix:** Suporte total para **PHP 7.4** via `FILTER_VALIDATE_BOOLEAN`.

---

## 5. Visualização e Dashboards

### 5.1. JEO Dashboard (Experimental)
- **Cinematic Map:** Tela cheia (100vh) com animações `staggered drop` e transição `fitBounds` automática para enquadrar todos os pins globais.
- **Multi-Renderer:** Detecta e renderiza Mapbox GL, MapLibre ou Google Maps nativamente.

### 5.2. Central de Boas-Vindas
- **Multi-language Docs:** Renderização dinâmica de arquivos `README*.md` em abas de idiomas. Serve como a página default de entrada do plugin.

### 5.3. Suporte Multi-Motor (v3.5.3+)
- **Motores:** MapLibre GL JS, Mapbox GL JS e Google Maps JS API.
- **Geocodificadores:** Nominatim, Google Maps e Mapbox Geocoding.

---

## 6. Estrutura de Menus e Navegação Profissional

A hierarquia de navegação foi travada para garantir uma experiência de produto "premium", respeitando a tradução dinâmica (`pt_BR`):

1. **Welcome / Boas-vindas (Default):** Documentação viva multi-idioma.
2. **Experimental (Dashboard):** Visualização global de impacto.
3. **Maps / Mapas:** Gestão de mapas customizados.
4. **Layers / Camadas:** Gestão de camadas geográficas.
5. **Storymaps / Mapas de História:** Editor de narrativas espaciais.
6. **Settings / Configurações:** Painel central.
7. **AI Debug Logs / Logs de Depuração IA:** Histórico técnico de LLM.

---

## 7. Construção e Execução

### Build de Produção (`build.sh`)
- Compila Assets (Gutenberg/React).
- Coleta arquivos `README*.md`.
- Preserva ícones essenciais (`jeo.svg`) para evitar erro 404 no menu.
- Limpeza de logs e configs de desenvolvimento.
