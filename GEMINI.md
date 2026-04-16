# JEO Plugin - Master Architecture Guide & Mandates (v3.6.5)

Este documento é a autoridade máxima sobre a arquitetura do plugin JEO. Qualquer alteração, refatoração ou adição de funcionalidade deve respeitar estritamente as diretrizes aqui estabelecidas para garantir a estabilidade e a integridade dos dados geográficos.

---

## 1. Visão Geral e Propósito
O JEO é um framework de geojornalismo para WordPress. Ele transforma posts em camadas de dados interativos, permitindo a geolocalização manual ou automatizada (via IA) de matérias jornalísticas.

---

## 2. Mandatos de Integridade Técnica (Prevenção de Regressões)

### 2.1. Padrão de Nomenclatura de Geodata
- **Longitude:** O sufixo padrão para longitude em todo o sistema (PHP, JS, REST e Database) é estritamente `lng`. O uso de `lon` é obsoleto e proibido em novos desenvolvimentos.
- **Normalização Automática:** Todo input de coordenadas deve ser validado para evitar `NaN`. Use `parseFloat` e verifique `isNaN()` antes de passar dados para Leaflet ou Mapbox.
- **Migração em Runtime (Legacy Data):** Componentes que carregam metadados do banco devem implementar um mapeamento imediato no `constructor`: se existir `_geocode_lon` mas não `_geocode_lng`, o valor deve ser transferido para a chave nova para garantir compatibilidade.

### 2.2. Registry-First Mandate (Configurações)
- Toda nova opção de configuração **DEVE** ser registrada em três lugares no arquivo `Jeo\Settings`:
  1. No array `$default_options` do método `init()`.
  2. No método `get_option()` (merge com defaults).
  3. No método `sanitize_settings()` (persistência segura).
- **Merge Obligatório:** O `sanitize_settings` deve realizar um `array_merge` com as opções existentes para evitar que salvamentos em formulários parciais (multi-abas) apaguem configurações de outras seções.

---

## 3. Motor de Inteligência Artificial (AI Engine)

### 3.1. Neuron Agent & Universal Adapters
- **Centralização:** Toda chamada de IA deve passar pela classe `Jeo\AI\Neuron_Adapter`. Nunca faça chamadas HTTP diretas. 
- **O Contrato JSON Imutável:** Toda extração deve retornar um array plano de objetos com: `name`, `lat`, `lng`, `quote`, `confidence`.

### 3.2. Lógica de Relevância e Corte (UI/UX)
- **Corte de Confiança:** High (>=75%) -> Primário; Medium (35-74%) -> Secundário; Low (<35%) -> Desabilitado.
- **Interface:** Utilizar `ToggleControl` (Switcher) para alternar relevância.

### 3.3. Enriquecimento de Geodata (Enrichment)
- **Dados Estruturados:** O enriquecimento (Reverse Geocode) deve extrair: **Rua** (`address`), **Número** (`address_number`), **CEP** (`postcode`), Bairro, Cidade, Estado e País.
- **Visualização:** Dados enriquecidos aparecem em verde ("Verified Address") abaixo do contexto da IA em azul.

---

## 4. Persistência e Segurança

### 4.1. Cofre de API Keys (Security Vault)
- **Máscara de Visualização:** Chaves salvas devem ser exibidas como `AAAAA**********ZZZZZ` em inputs do tipo `text` com atributo `readonly`.
- **Fluxo de Edição:** O botão "Set New Key" deve limpar o campo, remover o `readonly` e trocar o tipo para `password`.
- **Proteção de Sanitização:** O backend deve detectar a string de máscara (`********`) e abortar a atualização daquele campo específico, preservando o segredo original no banco.
- **Tráfego Seguro:** O JavaScript não deve enviar chaves mascaradas via AJAX. O backend deve recuperar o segredo interno se o parâmetro `api_key` estiver ausente.

### 4.2. RAG & Processamento Background
- **RAG Worker:** Classe `Jeo\AI\RAG_Worker` via `WP-Cron` para vetorização automática.
- **Model Lock:** O modelo de embedding é travado em `.model_info` na primeira inicialização. Troca de modelo exige reset manual.
- **Backups:** Manter os últimos 3 backups `.zip` do Vector Store.

---

## 5. Interface Administrativa

### 5.1. Menu JEO AI (v3.6.5+)
- **Localização:** Submenu do JEO, posicionado após "Dashboard" e antes de "Maps".
- **Abas Nativas:** Navegação via links reais (`?page=...&tab=...`) para garantir estabilidade de carregamento de scripts e assets (Select2, Modais).
- **AI Debug Console:** Terminal flutuante para auditoria técnica de Requests/Responses em tempo real.

---

## 6. Fluxos de DevOps

### 6.1. Build de Release (`build.sh`)
- Injeta a pasta `vendor` na raiz e limpa arquivos de desenvolvimento.

### 6.2. Versionamento
- Siga rigorosamente o SemVer. Versão atual: **3.6.5**.

---
*Este guia é a defesa contra o caos técnico. Respeite os mandatos ou o sistema falhará.*