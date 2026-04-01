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

### 2.2. Model-Aware Prompt Optimization & Verbatim Mandate
- O **AI Prompt Engineer Assistant** intercepta a requisição e injeta "Regras Constitucionais" específicas dependendo do provedor ativo:
  - **Gemini:** Exige Markdown estrito e instrução passo a passo. Injeta forçosamente `responseMimeType: application/json` via `generationConfig`.
  - **OpenAI:** Otimizado com regras abstratas e concisas.
  - **DeepSeek:** Utiliza blocos de tags XML (`<rules>`) para guiar o raciocínio.
  - **Anthropic:** Abordagem negativa constitucional ("O que não fazer").
- **Verbatim Mandate:** O Assistente é proibido de resumir as regras de saída. Ele deve anexar obrigatoriamente um bloco de texto imutável (verbatim) definindo o contrato JSON do JEO, incluindo o exemplo do "Teatro Amazonas".

### 2.3. Surgical JSON Parser (Depth Balancing)
- **Resiliência contra Lixo:** O JEO utiliza um extrator de JSON via profundidade de colchetes. Ele localiza o primeiro `[` e busca o seu `]` correspondente exato. Isso ignora qualquer conteúdo extra (conversas, tópicos, keywords) que o modelo tente adicionar fora do array principal.
- **Negative Key Constraints:** O prompt do sistema proíbe explicitamente que a IA invente chaves como `"city"`, `"country"`, `"continent"` ou `"type"`. O retorno deve conter apenas as chaves do contrato: `"name"`, `"lat"`, `"lng"`, `"quote"`.

### 2.4. Cost Dashboard (Gestão de Custos)
- **Salvamento de Tokens:** O plugin utiliza a classe `AI_Logger` para persistir o consumo de tokens (`input_tokens` e `output_tokens`) no Custom Post Type privado `jeo-ai-log`.
- **Integridade:** As métricas de custo são extraídas via `$message->getUsage()` após cada interação do Agente.

---

## 3. Experiência do Usuário (Settings UI)

### 3.1. Engenharia de Prompt e Assistant
- **Aba AI:** Refinamento de prompt com Assistente de Chat e persistência em `localStorage`. A tela renderiza dinamicamente as **API Keys** e **Models** de acordo com o provedor ativado.
- **AI API Debugger:** Terminal integrado que intercepta e exibe as requisições e respostas JSON brutas. As chaves de API são anonimizadas (`AizaS*****hCuhs`) automaticamente para permitir auditoria segura.
- **Dynamic Model Fetcher:** Botão "Change Model" que consulta as APIs dos provedores em tempo real e popula um campo de busca `Select2` (Searchable & Taggable).
- **Live Validator:** Simulação real contra um texto de teste global diversificado (Paris, Manaus, Tóquio) para evitar falhas de falso-positivo em regras regionais.

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
5. **NÃO permita que a IA defina o formato de saída:** Sempre injete o contrato JSON agressivo (`enforced_schema`) para evitar que modelos "espertos" retornem objetos aninhados ou chaves inventadas.
6. **NÃO injete prompts via `$this->instructions()` no Neuron AI:** Na classe base do Neuron AI (`NeuronAI\Agent\Agent`), o método `instructions()` é um **getter** interno que não aceita argumentos e retorna o texto padrão ("You are a helpful and friendly AI..."). Para injetar o System Prompt do JEO e forçar o contrato do JSON, você **DEVE** utilizar o **setter** correto: `$this->setInstructions($prompt);`. O uso incorreto fará a LLM ignorar o esquema do JEO e gerar um JSON genérico e quebrado.
7. **NÃO remova a flag `[SKIP_ENFORCED_SCHEMA]` de ferramentas internas:** Como o JEO injeta agressivamente o contrato JSON em todas as chamadas de georreferenciamento (via `AI_Adapter::get_system_prompt()`), ferramentas internas que reaproveitam o LLM para "meta-tarefas" (como o *Prompt Generator* ou o *API Key Tester*) falharão ao usar modelos estritos como a OpenAI, pois o modelo obedecerá a regra de retornar `[]` se não achar locais geográficos reais no texto. Sempre inicie o prompt dessas ferramentas internas com `[SKIP_ENFORCED_SCHEMA]` para desativar temporariamente o contrato.

---

## 6. Fluxos de Trabalho (DevOps)

### 6.1. Ambiente de Desenvolvimento (`setup.sh`)
- Utilize `./setup.sh` para subir o ambiente em **http://localhost:8072**.
- Credenciais: `admin` / `admin`.
- **Limites Generosos (Docker):** O ambiente local está pré-configurado para suportar cargas pesadas típicas de geojornalismo e requisições longas de IA:
  - **PHP/Apache:** `memory_limit=2048M`, `upload_max_filesize=1024M`, `max_execution_time=600s`.
  - **MariaDB:** `max_allowed_packet=256M` (evita falhas ao importar bancos ou grandes camadas GeoJSON).

### 6.2. Build de Release (`build.sh`)
- Sempre gere o pacote oficial via `./build.sh`. O script injeta o `vendor` otimizado e limpa arquivos de desenvolvimento.

---
*Este guia deve ser atualizado sempre que uma mudança estrutural for implementada.*