# Contexto do Plugin JEO - Gemini CLI (v3.5.3-experimental Master)

O JEO é uma plataforma de geojornalismo para WordPress que permite a organizações de notícias, blogueiros e ONGs publicarem matérias jornalísticas como camadas de informações em mapas digitais interativos.

**Status Atual:** Versão **3.5.3-experimental**. O projeto consolidou seu ecossistema de Inteligência Artificial, segurança de credenciais, curadoria territorial brasileira e expandiu o suporte a múltiplos motores de renderização e geocodificação.

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
- **Prompt API Level:** Injeção de cláusula de **Enforced Schema** inquebrável. 
- **Agressive JSON Parser:** Método `parse_json_from_text` (em `AI_Adapter.php`) utiliza Regex para ignorar lixo conversacional e extrair apenas o array de objetos.

### 2.3. Sistema de RAG Leve (Base de Conhecimento)
- **Localização:** `src/includes/ai/data/*.json`.
- **Dicionários Territoriais:** 10 categorias embarcadas (Biomas, TIs, Quilombos, etc.) que agem como autoridade geográfica durante o georreferenciamento por IA.

---

## 3. Experiência do Usuário (Settings UI)

### 3.1. Engenharia de Prompt e Assistant
- **Aba AI:** Refinamento de prompt com Assistente de Chat e persistência em `localStorage`.
- **Live Validator:** Botão de simulação real antes do salvamento definitivo.
- **Auto-Teste de Chave:** Validação instantânea de API Keys ao carregar a aba.

### 3.2. Navegação e Performance
- **Skeleton Loader:** Transições suaves de 1 segundo entre abas.
- **Knowledge Base:** Gestão de dicionários com Visualizer (Listagem e Raw JSON) e Download.

---

## 4. Persistência de Dados e Segurança

### 4.1. WordPress REST Schema
- **Propriedades Registradas:** O campo `_ai_quote` está integrado ao Schema do `_related_point`, permitindo salvar o contexto original da IA no banco de dados.

### 4.2. Segurança e Ciclo de Vida
- **Desativação:** Limpa **API Keys** e logs físicos.
- **Exclusão:** `uninstall.php` remove as configurações globais (`jeo-settings`).
- **Integridade:** Metadados geográficos dos posts são mantidos permanentemente.

### 4.3. Compatibilidade PHP
- **Legacy Fix:** Suporte total para **PHP 7.4** via `FILTER_VALIDATE_BOOLEAN`.

---

## 5. Visualização e Dashboards

### 5.1. JEO Dashboard (Página Home)
- **Cinematic Map:** Tela cheia (100vh) com animações `staggered drop` e transição `fitBounds` automática.
- **Multi-Renderer:** Detecta e renderiza Mapbox GL, MapLibre ou Google Maps nativamente na Home.

### 5.2. Central de Boas-Vindas
- **Multi-language Docs:** Renderização dinâmica de arquivos `README*.md` em abas de idiomas.

### 5.3. Suporte Multi-Motor (v3.5.3+)
O JEO agora suporta uma tríade de serviços líderes:
- **Motores de Renderização:** MapLibre GL JS, Mapbox GL JS e Google Maps JS API.
- **Geocodificadores (Busca de Endereços):**
  - **Nominatim:** Open-source (OSM).
  - **Google Maps Geocoding:** Alta precisão global (requer Google Cloud API Key). Normalização robusta de dados geográficos (cidade, estado, país).
  - **Mapbox Geocoding:** Otimizado para o ecossistema JEO (requer Mapbox API Key). Suporte para geocodificação permanente.

---

## 6. Estrutura de Menus e Navegação

1. **Welcome** (Default)
2. **Dashboard**
3. **Maps**
4. **Layers**
5. **Storymaps**
6. **Settings**
7. **AI Debug Logs**

---

## 7. Construção e Execução

### Build de Produção (`build.sh`)
- Compila Assets (Gutenberg/React).
- Preserva ícones essenciais (`jeo.svg`).
- Limpeza de logs e configs de desenvolvimento.
