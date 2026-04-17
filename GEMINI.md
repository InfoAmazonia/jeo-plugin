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
- **Tratamento de Abas em Formulários (Checkboxes):** Em painéis multi-abas, utilize o campo oculto `current_tab`. O `sanitize_settings` deve apenas redefinir para falso (desmarcar) os checkboxes que pertencem especificamente à aba submetida. Nunca zere todas as chaves booleanas do sistema ao salvar uma única aba.
- **Merge Obrigatório:** O `sanitize_settings` deve realizar um `array_merge` com as opções existentes para evitar que salvamentos em formulários parciais apaguem configurações de outras seções.

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

### 4.2. RAG & Processamento Background (Vector Store)
- **Desacoplamento de Embeddings:** O modelo de Embedding é 100% independente do Provedor de Chat principal. O sistema utiliza a taxonomia `provider:model` (ex: `gemini:gemini-embedding-001`). Lógicas de fallback "Automático" (Auto) são expressamente proibidas; o usuário DEVE selecionar ativamente um motor de vetorização.
- **Google Gemini Embeddings:** A API v1beta do Gemini rejeita nomes legados para embeddings. É obrigatório utilizar a nomenclatura canônica do Neuron-AI: apenas `gemini-embedding-001` ou `gemini-embedding-2-preview` são válidos. Nomes como `text-embedding-004` resultarão em erros silenciosos (404 Not Found).
- **RAG Worker:** Classe `Jeo\AI\RAG_Worker` via `WP-Cron` para vetorização automática de postagens.
- **Model Lock:** O modelo de embedding fica travado permanentemente em `.model_info` após a primeira inicialização. Trocar o modelo exige apagar (resetar) todo o banco vetorial atual.
- **Backups (Síncronos):** A geração de backups do Vector Store (`.zip`) deve ocorrer de forma **Síncrona** na API REST, sem agendamentos assíncronos no Cron. Falhas processuais (como a falta da extensão `ZipArchive` no servidor ou diretório vazio) devem retornar um objeto `\WP_Error` para fornecer feedback visual imediato na UI. Manter os últimos 3 backups no sistema.

---

## 5. Interface Administrativa (Configurações)

### 5.1. Abas Nativas (Navegação Estável)
- **Painéis Multi-Abas:** Todas as páginas de configuração do JEO devem utilizar **links reais** (`?page=...&tab=...`) para alternar conteúdos. É estritamente **proibido** utilizar jQuery/CSS para mostrar ou esconder blocos como forma de navegação entre abas. A renderização do PHP deve entregar apenas o conteúdo da `current_tab`.
- **Skeleton Loader:** Ao recarregar abas, a UI deve iniciar com um `Skeleton Loader` css/html (padrão `jeo-skeleton`) que é ocultado via Javascript quando o DOM e as dependências nativas terminam de carregar.

### 5.2. Internacionalização Rigorosa (i18n)
- **Javascript (Textos Dinâmicos):** Nenhuma string em inglês deve ser "hardcoded" em arquivos `.js` (isso quebra os arquivos `.po/.mo`). Todas as mensagens de interface, alertas, botões ou `console.log` expostos devem vir injetados do PHP via `wp_localize_script` sob a matriz `jeo_settings.i18n`. Use o formato `alert( i18n.error_fetching || 'Fallback' )`.

### 5.3. Tratamento de Modais HTML5
- Modais administrativos devem utilizar a tag nativa `<dialog class="jeo-ai-modal">`.
- **CSS Estrito para Modais:** Não utilize `display: flex` como padrão na classe global do modal para evitar sobrescrever a inatividade padrão do HTML5 (ele só deve ser flexível quando `[open]`).
- **Dimensões e Rolagem:** Modais de pré-visualização (como Dicionários RAG) devem limitar-se à tela sem expandir para todo o monitor, utilizando `max-width`, `max-height: 85vh` e uma área interna restrita com `overflow-y: auto`.

### 5.4. AI Debug Console
- Terminal flutuante para auditoria técnica de Requests/Responses em tempo real presente na página do **JEO AI**.

### 5.5. Prevenção de Deadlocks (UX Blocks)
- **Telas Restritas:** Painéis de erro globais (`.jeo-rag-blocked-overlay`) jamais devem sobrepor e bloquear elementos de formulário (`<select>`, `<input>`) necessários para que o usuário corrija o próprio erro listado. O bloqueio só deve restringir botões de execução e relatórios.

---

## 6. Fluxos de DevOps

### 6.1. Build de Release (`build.sh`)
- Injeta a pasta `vendor` na raiz e limpa arquivos de desenvolvimento.

### 6.2. Versionamento
- Siga rigorosamente o SemVer. Versão atual: **3.6.5**.

---
*Este guia é a defesa contra o caos técnico. Respeite os mandatos ou o sistema falhará.*