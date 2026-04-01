# JEO Plugin - Master Architecture Guide & Mandates (v3.6.0-experimental)

Este documento é a autoridade máxima sobre a arquitetura do plugin JEO. Qualquer alteração, refatoração ou adição de funcionalidade deve respeitar estritamente as diretrizes aqui estabelecidas para garantir a estabilidade e a integridade dos dados geográficos.

---

## 1. Visão Geral e Propósito
O JEO é um framework de geojornalismo para WordPress. Ele transforma posts em camadas de dados interativos, permitindo a geolocalização manual ou automatizada (via IA) de matérias jornalísticas.

### Stack Tecnológica:
- **Backend:** PHP 8.2+ (Obrigatório), Composer para gerenciamento de dependências.
- **AI Engine:** Neuron AI Framework.
- **Frontend:** React, Gutenberg Blocks, MapLibre GL / Mapbox GL.
- **Infraestrutura Local:** Docker Compose (Apache + MariaDB, Porta 8072).

---

## 2. Motor de Inteligência Artificial (v3.6.x)

O JEO utiliza o framework **Neuron AI** como motor universal de LLM. 

### 2.1. Neuron Agent & Adapters
- **Centralização:** Toda chamada de IA deve passar pela classe `Jeo\AI\Neuron_Adapter`. Nunca faça chamadas HTTP diretas para APIs de LLM.
- **Configuração Determinística:** Todos os modelos são configurados com `temperature = 0.1` para garantir que a extração de coordenadas seja precisa e não criativa.
- **Provedores:** Suporte nativo a 10 provedores (Gemini, OpenAI, Anthropic, DeepSeek, Ollama, etc.) configuráveis na Aba AI.

### 2.2. Model-Aware Prompt Optimization
- O **AI Prompt Engineer Assistant** intercepta a requisição e injeta "Regras Constitucionais" específicas dependendo do provedor ativo:
  - **Gemini:** Exige Markdown estrito e instrução passo a passo. Injeta forçosamente `responseMimeType: application/json` via `generationConfig`.
  - **OpenAI:** Otimizado com regras abstratas e concisas.
  - **DeepSeek:** Utiliza blocos de tags XML (`<rules>`) para guiar o raciocínio.
  - **Anthropic:** Abordagem negativa constitucional ("O que não fazer").

### 2.3. Surgical JSON Parser
- O JEO utiliza um extrator de JSON via profundidade de colchetes (`depth balancing`). Ele localiza o primeiro `[` e busca o seu `]` correspondente. Isso garante que, mesmo que o modelo de IA adicione informações extras após o array (como listas de "topics"), o JEO capture apenas a lista plana de geolocalização necessária.

### 2.4. Cost Dashboard (Gestão de Custos)
- **Salvamento de Tokens:** O plugin utiliza a classe `AI_Logger` para persistir o consumo de tokens (`input_tokens` e `output_tokens`) no Custom Post Type privado `jeo-ai-log`.
- **Integridade:** As métricas de custo são extraídas via `$message->getUsage()` após cada interação do Agente.

---

## 3. Experiência do Usuário (Settings UI)

### 3.1. Engenharia de Prompt e Assistant
- **Aba AI:** Refinamento de prompt com Assistente de Chat e persistência em `localStorage`. A tela renderiza dinamicamente as **API Keys** e **Models** de acordo com o provedor ativado.
- **AI API Debugger:** Ferramenta de console flutuante integrada que intercepta e exibe as requisições e respostas JSON brutas. Permite auditoria técnica imediata. As chaves de API são anonimizadas (`AizaS*****hCuhs`) nos logs.
- **Dynamic Model Fetcher:** Botão "Change Model" que consulta as APIs dos provedores em tempo real e popula um campo de busca `Select2` com os modelos de chat disponíveis.
- **Live Validator:** Botão de simulação real contra um texto de teste global diversificado (Paris, Manaus, Tóquio).

---

## 4. Persistência de Dados e Geolocalização

### 4.1. O Metadado Mestre: `_related_point`
Todos os dados geográficos de um post são armazenados em um único metadado chamado `_related_point`.
- **Estrutura:** É um array de objetos.
- **Campos Obrigatórios:** `_geocode_lat`, `_geocode_lon`, `name`, `quote`.
- **Resiliência REST API:** O JEO força o suporte a `custom-fields` via `add_post_type_support` no hook `init:99`.

---

## 5. Mandatos de Estabilidade (O que NÃO fazer)

1. **NÃO baixe a versão do PHP:** O plugin exige **PHP 8.2**.
2. **NÃO altere o Schema do `_related_point` sem atualizar o JS.**
3. **NÃO use `file_put_contents` para logs:** Use a classe `AI_Logger`.
4. **NÃO publique a pasta `vendor` no Git.**

---

## 6. Fluxos de Trabalho (DevOps)

### 6.1. Ambiente de Desenvolvimento (`setup.sh`)
- Utilize `./setup.sh` para subir o ambiente em **http://localhost:8072**.
- Credenciais: `admin` / `admin`.

### 6.2. Build de Release (`build.sh`)
- Sempre gere o pacote oficial via `./build.sh`. O script injeta o `vendor` otimizado e limpa arquivos de desenvolvimento.

---
*Este guia deve ser atualizado sempre que uma mudança estrutural for implementada.*