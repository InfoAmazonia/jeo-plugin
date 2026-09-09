# Issue: Geração de Contexto por IA (AI Context Assistant)

## Resumo
Implementação de um assistente editorial de IA integrado à barra lateral do editor Gutenberg. A funcionalidade sugere novos parágrafos para incorporar ao artigo com base no conteúdo já escrito, no acervo RAG vetorizado do site e em instruções complementares do usuário via chat.

---

## Objetivo
Auxiliar editorialmente a escrita de posts no WordPress, enriquecendo o conteúdo com:
- Parágrafos sugeridos contextualmente pela IA
- Referências e links para artigos do acervo do site (via RAG)
- Chat conversacional multi-turn para refinamento iterativo

---

## O que foi implementado

### 1. Painel na sidebar do editor (Gutenberg)
- Nova aba **"AI Context"** na sidebar Documento do editor
- Interface compacta com opção de expandir para modal maior
- Botão **"Generate Suggestions"** para iniciar a geração (não é automático)
- Textarea para chat com atalho `Ctrl+Enter` para enviar
- Sessão persistente — fecha/reabre a metabox ou atualiza a página sem perder o contexto

### 2. Sugestões de parágrafos
- Cards com o texto sugerido
- **"Insert into article"** — insere como bloco `core/paragraph` no editor, com links HTML inline para posts referenciados
- **"Copy"** — copia o texto como rich text (HTML com links) ou texto puro (fallback)
- Links inteligentes: palavras ou títulos de artigos do acervo mencionados no parágrafo viram links clicáveis

### 3. Chat multi-turn com histórico
- Após a primeira geração, o usuário pode dar instruções complementares
- Exemplos: *"deixe mais curto"*, *"foco em aspectos ambientais"*, *"adicione contexto histórico"*
- Histórico de conversa persistido em `post_meta`

### 4. Configuração customizável
- Nova aba **"Context Assistant"** em **JEO → AI Configuration**
- Campo textarea para editar o `system prompt` da IA (`ai_context_prompt`)
- Se vazio, usa o prompt padrão embutido no código

---

## Arquitetura técnica

### Stack utilizada
- **Backend**: PHP 8.2+ com `hacklabr/ai-assistant` + `neuron-ai`
- **Frontend**: React 18 + `@wordpress/scripts` (Webpack 5)
- **RAG**: `FileVectorStore` (`jeo_knowledge`) com `RAG_Agent`
- **Structured Output**: DTO `Context_Generation_Output` com schema nativo

### Padrão arquitetural
Baseado na mesma arquitetura do **Minimap**:
- `AssistantConfig` com `outputClass`, `conversationStorage`, `learningStorage`, `userMemoryStorage`
- `Tool_Registry` para registro centralizado de tools
- `ConversationStore` + `WP_Storage` para persistência em `post_meta`
- `SubAgentConfig` para o `post_analyzer`

---

## Endpoints REST

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| `POST` | `/jeo/v1/context/setup` | Gera sugestões iniciais a partir do conteúdo do post | `edit_posts` |
| `POST` | `/jeo/v1/context/chat` | Chat multi-turn para refinamento | `edit_posts` |
| `GET` | `/jeo/v1/context/state?post_id={id}` | Carrega estado persistido (histórico + sugestões) | `edit_posts` |

---

## Fluxo de dados

```
┌─────────────────┐     POST /context/setup     ┌──────────────────┐
│  Editor (JS)    │ ───────────────────────────> │ Context_Handler  │
│  Gutenberg      │                            │  (PHP)           │
│                 │ <────────────────────────── │                  │
└─────────────────┘     {paragraphs, refs}      └────────┬─────────┘
         │                                               │
         │                                               ▼
         │                                      ┌──────────────────┐
         │                                      │  Context_Agent   │
         │                                      │  (Assistant)     │
         │                                      │                  │
         │                                      │  • retrieve_knowledge
         │                                      │  • get_post_content
         │                                      │  • post_analyzer (sub-agent)
         │                                      └──────────────────┘
         │                                               │
         │                                               ▼
         │                                      ┌──────────────────┐
         │                                      │  RAG_Agent       │
         │                                      │  (jeo_knowledge) │
         │                                      └──────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Persistência em post_meta:                                         │
│  • _jeo_ai_context_conversation_id  → UUID da thread                │
│  • _jeo_ai_context_last_response    → últimas sugestões + refs      │
│  • _jeo_ai_conversation_{uuid}      → histórico completo (via WP_Storage) │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Arquivos criados

### Backend (PHP)
| Arquivo | Descrição |
|---------|-----------|
| `src/includes/ai/class-retrieve-knowledge-tool.php` | Tool NeuronAI para busca semântica no `jeo_knowledge` |
| `src/includes/ai/class-context-generation-output.php` | DTO de structured output (parágrafos, referências, mensagens) |
| `src/includes/ai/class-context-agent.php` | Factory do Assistant com prompt editorial, tools e sub-agent |
| `src/includes/ai/class-context-handler.php` | REST handler com endpoints setup/chat/state + persistência |
| `src/includes/ai/settings/tab-context.php` | Template da aba de configuração do system prompt |

### Frontend (JS)
| Arquivo | Descrição |
|---------|-----------|
| `src/js/src/context-sidebar/index.js` | Entry point — registra plugin Gutenberg |
| `src/js/src/context-sidebar/context-chat-panel.js` | Painel de chat, estado e API calls |
| `src/js/src/context-sidebar/suggested-paragraphs.js` | Cards de parágrafos + linkify + insert/copy |
| `src/js/src/context-sidebar/context-sidebar.css` | Estilos do painel, chat, sugestões e modal |

### Documentação
| Arquivo | Descrição |
|---------|-----------|
| `.architecture/ai/README.md` | Seção "AI Context Assistant" com fluxo Mermaid |
| `AGENTS.md` | Convenções e pontos de regressão da feature |

---

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `src/includes/ai/class-tool-registry.php` | Registra `retrieve_knowledge` |
| `src/includes/class-jeo.php` | Registra/enfileira asset `jeo-context-sidebar` |
| `src/includes/loaders.php` | Adiciona `jeo_context_handler()` |
| `src/includes/settings/class-settings.php` | Default + sanitize de `ai_context_prompt` |
| `src/includes/ai/class-ai-settings.php` | Adiciona tab "Context Assistant" |
| `src/includes/ai/settings/main-page.php` | Case para incluir `tab-context.php` |
| `webpack.config.js` | Entry point `contextSidebar` |

---

## Configurações

### Post types habilitados
A feature respeita a configuração existente `enabled_post_types` (mesma regra da geolocalização e minimap). O painel só aparece para post types habilitados em **JEO Settings → General**.

### Prompt customizável
- Caminho: **JEO → AI Configuration → Context Assistant**
- Opção: `ai_context_prompt` (textarea)
- Comportamento: vazio = prompt padrão; preenchido = sobrescreve completamente

---

## Decisões de design

| Decisão | Justificativa |
|---------|---------------|
| **Setup manual** (botão "Generate Suggestions") | Evita chamadas desnecessárias à API toda vez que o painel abre |
| **Structured output** (`Context_Generation_Output`) | Garante que a IA sempre retorne parágrafos formatados corretamente |
| **Persistência em `post_meta`** | Funciona entre dispositivos e sessões de browser |
| **Links inline nos parágrafos** | Experiência editorial mais fluida — o autor vê o link no contexto do texto |
| **Copy como rich text** | Preserva links ao colar em editores externos (Word, Google Docs, etc.) |
| **Inserção como `core/paragraph`** | Integração nativa com o Gutenberg, sem blocos customizados |
| **Sem nova config de post type** | Reutiliza `enabled_post_types` existente para manter simplicidade |

---

## Próximos passos sugeridos

- [ ] **Inserção na posição do cursor**: hoje insere no final do documento; permitir inserir onde o cursor está
- [ ] **Múltiplas sessões por post**: permitir criar/gerenciar várias "conversas" de contexto no mesmo post
- [ ] **Histórico de versões**: salvar snapshots de sugestões para comparar diferentes iterações
- [ ] **Avaliação de sugestões**: thumbs up/down para feedback e fine-tuning do prompt
- [ ] **Taxonomias no contexto**: incluir categorias/tags do post no analysis do `post_analyzer`
- [ ] **Preview de links**: tooltip com resumo do artigo referenciado ao hover
- [ ] **Testes unitários Jest**: cobrir os componentes React da sidebar

---

## Labels sugeridos
`feature`, `ai`, `editorial`, `gutenberg`, `rag`
