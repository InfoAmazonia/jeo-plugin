# Contexto do Plugin JEO - Gemini CLI (v3.6.0-experimental Master)

O JEO é uma plataforma de geojornalismo para WordPress que permite a organizações de notícias, blogueiros e ONGs publicarem matérias jornalísticas como camadas de informações em mapas digitais interativos.

**Status Atual:** Versão **3.6.0-experimental**. O projeto consolidou seu ecossistema de Inteligência Artificial implementando o framework **Neuron AI** para suporte universal a 10 modelos de LLM, modernizou a stack Docker para testes locais multiplataforma e implementou um Dashboard de Custos via CPT para métricas de tokens.

---

## 1. Visão Geral da Arquitetura

O JEO é construído com uma separação clara entre o motor de dados (PHP) e a interface de blocos interativos (React).

- **Tipo:** Plugin para WordPress.
- **Backend (PHP):** WordPress Plugin API, Composer (Neuron AI), OOP, Singleton.
- **Frontend (JS/TS):** React, Gutenberg Blocks, `@wordpress/scripts`, Webpack.
- **Renderização de Mapas:** Suporte para **MapLibre GL JS** (padrão nativo v3.5+), **Mapbox GL JS** e **Google Maps JS API**.
- **Ambiente de Desenvolvimento:** Docker Compose moderno (WordPress dinâmico + MariaDB com Healthcheck, porta 8072).

---

## 2. Ecossistema de Inteligência Artificial (v3.6.0+)

O coração desta versão é o Co-Piloto Editorial de Georreferenciamento Automatizado, agora alimentado pelo ecossistema **Neuron AI**.

### 2.1. Arquitetura Neuron AI
Localizado em `src/includes/ai/`, o sistema utiliza o `Neuron_Agent` que unifica as chamadas HTTP e formatação de Prompt.
- **Provedores Suportados (10 modelos dinâmicos via Settings):**
  - **Google Gemini**
  - **OpenAI**
  - **DeepSeek**
  - **Anthropic Claude**
  - **Ollama** (Suporte a endpoint local/customizado via URL)
  - **Mistral AI**
  - **Zhipu AI (GLM)**
  - **HuggingFace Inference**
  - **Grok (xAI)**
  - **Cohere**
- **Configuração Determinística:** O JEO injeta `['temperature' => 0.1]` em todos os provedores nativamente via Neuron Parameters para manter o foco na extração de coordenadas e não em alucinações.

### 2.2. Cost Dashboard (Log de Tokens)
- **AI Logger (CPT):** Uma classe `AI_Logger` registra de forma invisível um Custom Post Type chamado `jeo-ai-log`.
- **Métricas:** Toda execução do Neuron extrai o `$message->getUsage()` capturando e persistindo no banco de dados os *Input Tokens* e *Output Tokens* gastos, permitindo o monitoramento de custos reais do publicador (Dashboard AI Logs).

### 2.3. Blindagem de Prompt e Resiliência
- **Prompt API Level:** Injeção de cláusula de **Enforced Schema** inquebrável no final de qualquer prompt customizado, garantindo retorno obrigatório de `"name", "lat", "lng", "quote"`. 
- **Agressive JSON Parser:** Método `parse_json_from_text` foi mantido como camada de resiliência extra (fallback) ao Structured Output nativo, utilizando Regex para ignorar lixo conversacional e extrair apenas o array de objetos geográficos.

---

## 3. Experiência do Usuário (Settings UI)

### 3.1. Engenharia de Prompt e Assistant
- **Aba AI:** Refinamento de prompt com Assistente de Chat e persistência em `localStorage` (`jeo_ai_assistant_context`). A tela renderiza dinamicamente as **API Keys** e **Models** de acordo com o provedor ativado usando JS limpo.
- **Live Validator:** Botão de simulação real antes do salvamento definitivo.
- **Auto-Teste de Chave:** Validação instantânea das chaves via endpoint REST (`/jeo/v1/ai-test-key`), que interage dinamicamente com o novo Adaptador do Neuron antes de salvar.

### 3.2. Configuração Universal de Post Types
- **Integração Dinâmica:** O JEO detecta automaticamente `Custom Post Types` públicos registrados no sistema (nativos, ACF, Pods ou via código).
- **Settings UI:** A gestão ocorre por meio de `checkboxes` dinâmicos na página de configurações. A interface filtra tipos internos como `map` e `map-layer` para segurança.

---

## 4. Persistência de Dados e Segurança

### 4.1. WordPress REST Schema
- **Injeção Tardia e Força de Suporte (Priority 99):** O registro do esquema de geolocalização e metadados R.E.S.T. ocorre no gancho `init` tardiamente, forçando suporte a `custom-fields` dinâmicos em CPTs do sistema.

### 4.2. Segurança e Ciclo de Vida
- **Desativação:** Exibe alerta de confirmação em JS na tela de plugins. A desativação não apaga o Banco, mas o plugin destrói os posts `jeo-ai-log` sob demanda pela interface do Dashboard de Custos, caso o usuário limpe os logs.

### 4.3. Compatibilidade PHP 8.2+
- **Proteção WSOD (White Screen of Death):** O arquivo raiz (`jeo.php`) exige estritamente **PHP 8.2 ou superior**. Caso o servidor seja legado, o JEO barra sua própria ativação via *Graceful Degradation* e emite um alerta administrativo, protegendo o site do usuário de falhas fataales por causa das tipagens rígidas do Neuron AI e do Composer.

---

## 5. Visualização e Dashboards

### 5.1. JEO Dashboard (Experimental)
- **Cinematic Map:** Tela cheia (100vh) com animações `staggered drop` e transição `fitBounds` automática para enquadrar todos os pins globais.
- **Multi-Renderer:** Detecta e renderiza Mapbox GL, MapLibre ou Google Maps nativamente.

### 5.2. Suporte Multi-Motor (v3.6+)
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
7. **AI Debug Logs / Logs de Depuração IA:** Histórico técnico de LLM e **Dashboard de Custos**.

---

## 7. Construção, Testes e Execução

A arquitetura de desenvolvimento (CLI) foi dividida em dois vetores robustos para maximizar retrocompatibilidade.

### 7.1. Setup Local & Testes Múltiplos (`setup.sh`)
Script utilitário focado 100% no desenvolvedor. Roda o composer, descobre a versão correta do docker-compose e mapeia os volumes transparentemente para a porta `8072`.
- **Uso Padrão (PHP 8.2):** `./setup.sh`
- **Uso Retrocompatibilidade/Evolução:** Aceita parâmetros dinâmicos de imagens do Docker Hub.
  - Exemplo: `./setup.sh --test-env 6.9-php8.5-apache`

### 7.2. Build de Produção (`build.sh`)
Rotina CI/CD pura para empacotar a release isolada para upload no Painel do WordPress.
- Executa npm build (Webpack).
- Roda o Composer apenas para arquivos em produção (`--no-dev --optimize-autoloader`), agregando o Neuron à pasta `/vendor/` do plugin sem poluir o sistema do usuário.
- Empacota o `.zip` (`jeo-3.6.0-experimental.zip`).