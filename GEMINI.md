# JEO Plugin - Master Architecture Guide & Mandates (v3.6.0-experimental)

Este documento é a autoridade máxima sobre a arquitetura do plugin JEO. Qualquer alteração, refatoração ou adição de funcionalidade deve respeitar estritamente as diretrizes aqui estabelecidas para garantir a estabilidade e a integridade dos dados geográficos.

---

## 1. Visão Geral e Propósito
O JEO é um framework de geojornalismo para WordPress. Ele transforma posts em camadas de dados interativos, permitindo a geolocalização manual ou automatizada (via IA) de matérias jornalísticas.

### Stack Tecnológica:
- **Backend:** PHP 8.2+ (Obrigatório), Composer para gerenciamento de dependências.
- **AI Engine:** Neuron AI Framework.
- **Frontend:** React, Gutenberg Blocks, MapLibre GL / Mapbox GL.
- **Infraestrutura Local:** Docker Compose (Apache + MariaDB).

---

## 2. Motor de Inteligência Artificial (v3.6.x)

O JEO utiliza o framework **Neuron AI** como motor universal de LLM. 

### 2.1. Neuron Agent & Adapters
- **Centralização:** Toda chamada de IA deve passar pela classe `Jeo\AI\Neuron_Adapter`. Nunca faça chamadas HTTP diretas para APIs de LLM.
- **Configuração Determinística:** Todos os modelos são configurados com `temperature = 0.1` para garantir que a extração de coordenadas seja precisa e não criativa.
- **Provedores:** Suporte nativo a 10 provedores (Gemini, OpenAI, Anthropic, DeepSeek, Ollama, etc.) configuráveis na Aba AI.

### 2.2. Cost Dashboard (Gestão de Custos)
- **Salvamento de Tokens:** O plugin utiliza a classe `AI_Logger` para persistir o consumo de tokens (`input_tokens` e `output_tokens`) no Custom Post Type privado `jeo-ai-log`.
- **Integridade:** As métricas de custo são extraídas via `$message->getUsage()` após cada interação do Agente.

---

## 3. Persistência de Dados e Geolocalização

### 3.1. O Metadado Mestre: `_related_point`
Todos os dados geográficos de um post são armazenados em um único metadado chamado `_related_point`.
- **Estrutura:** É um array (que pode ser multidimensional para múltiplos pontos).
- **Campos Obrigatórios:** `_geocode_lat`, `_geocode_lon`.
- **Campo de Contexto IA:** `_ai_quote` (Armazena o trecho do texto que originou o ponto).
- **Resiliência REST API:** Para que o Gutenberg salve esses dados, o Post Type **DEVE** ter suporte a `custom-fields`. O JEO força isso via `add_post_type_support( $type, 'custom-fields' )` no hook `init:99`.

### 3.2. Geocodificadores (PHP)
- Localizados em `src/includes/geocode/geocoders/`.
- Suporta Nominatim (OpenStreetMap), Google Maps e Mapbox.

---

## 4. Mandatos de Estabilidade (O que NÃO fazer)

Para manter a integridade do plugin, siga estas proibições estritas:

1. **NÃO baixe a versão do PHP:** O plugin agora utiliza tipagens rígidas e bibliotecas do Composer que exigem **PHP 8.2**. Baixar essa trava no `jeo.php` causará falhas fatais em produção.
2. **NÃO altere o Schema do `_related_point` sem atualizar o JS:** O frontend React (especialmente o `posts-sidebar`) depende da estrutura exata das chaves do objeto meta para renderizar os pins.
3. **NÃO use `file_put_contents` para logs:** Use a classe `AI_Logger`. Escrever arquivos no disco quebra em ambientes de hospedagem moderna (read-only filesystems como WP Engine ou VIP).
4. **NÃO remova o `parent::init()` em Singletons:** O JEO usa o Trait `Singleton` que gerencia a instância. Sempre inicialize via `protected function init()`.
5. **NÃO publique a pasta `vendor` no Git:** O repositório deve conter apenas o `composer.json`. A pasta `vendor` é gerada pelo script `setup.sh` (dev) ou injetada pelo `build.sh` (produção).

---

## 5. Fluxos de Trabalho (DevOps)

### 5.1. Ambiente de Desenvolvimento (`setup.sh`)
- Utilize `./setup.sh` para subir o ambiente.
- O site local roda sempre em **http://localhost:8072**.
- Credenciais padrão: `admin` / `admin`.

### 5.2. Testes de Compatibilidade
- Utilize `./setup.sh --test-env [TAG]` para validar o plugin em diferentes versões de PHP ou WordPress antes de lançar uma release.

### 5.3. Build de Release (`build.sh`)
- Sempre gere o pacote oficial via `./build.sh`.
- Este script limpa logs, remove códigos-fonte JS brutos e garante que apenas o necessário (incluindo o `vendor` otimizado) vá para o ZIP final.

---

## 6. Convenções de Código
- **Namespace:** Sempre utilize o namespace `Jeo` (ou sub-namespaces como `Jeo\AI`).
- **Traduções:** Utilize as funções de i18n do WordPress (`__()`, `_e()`, etc.).
- **Segurança:** Sempre verifique `current_user_can('manage_options')` em páginas de configurações e utilize `check_admin_referer()` em ações de formulário.

---
*Este guia deve ser atualizado sempre que uma mudança estrutural for implementada.*