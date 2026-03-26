# Contexto do Plugin JEO - Gemini CLI (v3.5.2-experimental Master)

O JEO é uma plataforma de geojornalismo para WordPress que permite a organizações de notícias, blogueiros e ONGs publicarem matérias jornalísticas como camadas de informações em mapas digitais interativos.

**Status Atual:** Versão **3.5.2-experimental**. O projeto consolidou seu ecossistema de Inteligência Artificial, segurança de credenciais, curadoria territorial brasileira e uma experiência de usuário profissional e imersiva.

---

## 1. Visão Geral da Arquitetura

O JEO é construído com uma separação clara entre o motor de dados (PHP) e a interface de blocos interativos (React).

- **Tipo:** Plugin para WordPress.
- **Backend (PHP):** WordPress Plugin API, Programação Orientada a Objetos (OOP), Padrão Singleton, Autoloader Personalizado.
- **Frontend (JS/TS):** React, Gutenberg Blocks, `@wordpress/scripts`, Webpack.
- **Renderização de Mapas:** Suporte dual para **MapLibre GL JS** (padrão nativo v3.5+) e **Mapbox GL JS**.
- **Ambiente de Desenvolvimento:** Docker Compose (WordPress + MariaDB).

---

## 2. Ecossistema de Inteligência Artificial (v3.5.x)

O coração desta versão é o Co-Piloto Editorial de Georreferenciamento Automatizado.

### 2.1. Arquitetura de Adapters
Localizado em `src/includes/ai/`, o sistema usa o padrão **Factory/Adapter** injetado via `AI_Handler`.
- **Provedores Suportados (2026):**
  - **Google Gemini:** Utiliza `gemini-2.5-flash` (a série 1.5 foi desativada pelo Google).
  - **OpenAI:** Utiliza `gpt-4o`.
  - **DeepSeek:** Utiliza `deepseek-chat`.
- **Configuração Determinística:** Todas as chamadas são forçadas com **Temperature = 0.1** para eliminar "criatividade" e garantir precisão na extração de dados.

### 2.2. Blindagem de Prompt e Resiliência
- **Prompt API Level:** O `System Prompt` é injetado com uma cláusula de **Enforced Schema** inquebrável. Independentemente do prompt customizado pelo usuário, o código anexa instruções estritas no final exigindo apenas JSON bruto e chaves específicas: `"name", "lat", "lng", "quote"`.
- **Agressive JSON Parser:** O método `parse_json_from_text` (em `AI_Adapter.php`) utiliza Regex e busca por colchetes (`[` e `]`) para ignorar blocos de Markdown ou textos conversacionais ("Claro, aqui está o JSON...") que as LLMs costumam injetar, prevenindo erros de decodificação.

### 2.3. Sistema de RAG Leve (Base de Conhecimento)
O JEO possui uma camada de **Dicionários Territoriais Brasileiros** embarcados.
- **Localização:** `src/includes/ai/data/*.json`.
- **Funcionamento:** O sistema lê biomas, terras indígenas e quilombos (10 categorias) e injeta esse contexto como "Autoridade Geográfica" no prompt caso os termos apareçam no texto da notícia.

---

## 3. Experiência do Usuário (Settings UI)

### 3.1. Engenharia de Prompt e Assistant
- **Aba AI:** Centraliza a gestão de chaves e o refinamento do prompt.
- **Auto-Save:** O assistente de chat possui persistência em `localStorage` (`jeo_ai_assistant_context`), impedindo a perda de rascunhos durante a navegação.
- **Live Validator:** Um botão de simulação real testa o prompt contra a API antes de salvá-lo definitivamente.
- **Auto-Teste de Chave:** Ao carregar a aba, um "Hello World" formatado em JSON valida se a API Key está ativa, exibindo badges visuais de status.

### 3.2. Navegação e Performance
- **Skeleton Loader:** Implementação de transições suaves de 1 segundo entre abas com prevenção de "Flicker" (FOUC).
- **Isolamento de Hash:** A navegação via URL (`#tab-ai`) é restrita apenas ao painel principal, impedindo que cliques em modais ou previews alterem o endereço da página.

---

## 4. Persistência de Dados e Segurança

### 4.1. WordPress REST Schema (Crucial para Regressão)
O JEO utiliza o metadado `_related_point` para salvar as localizações. 
- **O Desafio:** O WordPress rejeita objetos que contenham propriedades não registradas.
- **A Solução:** O campo `_ai_quote` foi registrado formalmente no Schema REST (`class-geocode-handler.php`). O React (`index.js`) foi programado para limpar chaves temporárias (como `_selected` ou `id`) e preencher atributos nulos obrigatórios (`_geocode_country`, etc.) antes do salvamento final, garantindo que o banco de dados não recuse a atualização do post.

### 4.2. Segurança e Ciclo de Vida
- **Desativação:** Limpa obrigatoriamente as **API Keys** de todos os modelos e deleta arquivos de log físicos por privacidade.
- **Exclusão:** O arquivo `uninstall.php` remove todas as configurações globais (`jeo-settings`) do banco de dados.
- **Integridade Editorial:** Os dados geográficos salvos nos posts **nunca** são removidos na desativação ou exclusão, preservando o patrimônio histórico do site.

### 4.3. Compatibilidade PHP
- **Legacy Fix:** O plugin substituiu o uso da constante `FILTER_VALIDATE_BOOL` (PHP 8.0+) por `FILTER_VALIDATE_BOOLEAN` para garantir funcionamento perfeito em servidores rodando **PHP 7.4**.

---

## 5. Visualização e Dashboards

### 5.1. JEO Dashboard (Página Home)
Uma interface imersiva de controle editorial.
- **Cinematic Map:** Renderiza um mapa full-height (100vh) com animações em cascata (`staggered pin drop`).
- **Auto-Frame (fitBounds):** Após o carregamento, a câmera faz uma transição suave de 2.5 segundos para enquadrar todos os pins globais na tela.
- **Clickable Popups:** Exibem o trecho original da notícia (`quote`) e links diretos para visualizar ou editar a matéria.

### 5.2. Central de Boas-Vindas
- **Multi-language Docs:** A página inicial do plugin detecta arquivos `README*.md` e os renderiza em abas de idiomas automaticamente.

---

## 6. Estrutura de Menus e Navegação

A hierarquia de navegação foi travada na seguinte ordem profissional:
1. **Welcome** (Guia dinâmico e suporte multi-idioma)
2. **Dashboard** (Mapa global de impacto do projeto)
3. **Maps** (Post type de gestão de mapas)
4. **Layers** (Post type de gestão de camadas)
5. **Storymaps** (Editor de narrativas)
6. **Settings** (Painel de controle e Engenharia de IA)
7. **AI Debug Logs** (Relatórios técnicos detalhados)

---

## 7. Construção e Execução

### Build de Produção (`build.sh`)
O script de empacotamento realiza uma limpeza profunda, mas segue regras de proteção:
1. Compila Assets (Gutenberg/React).
2. Coleta todos os arquivos `README*.md` (Documentação dinâmica).
3. **Preserva arquivos SVG:** Imprescindível para o `jeo.svg` não sumir e causar Erro Fatal 404 no Menu principal.
4. **Segurança:** Remove obrigatoriamente logs de debug (`*.log`) e configurações sensíveis de desenvolvimento.
