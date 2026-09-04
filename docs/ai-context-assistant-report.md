# 🚀 Entrega: AI Context Assistant

## O que é
Novo assistente editorial de IA na sidebar do editor Gutenberg. Gera sugestões de parágrafos e referências com base no conteúdo do artigo + acervo do site.

## Como usar
1. Abrir um post (tipo habilitado nas configurações do JEO)
2. Na sidebar **AI Context**, clicar em **"Generate Suggestions"**
3. Receber parágrafos sugeridos com links inline para artigos do acervo
4. Inserir direto no artigo ou copiar (com rich text)
5. Refinar via chat: "deixe mais curto", "foco em X", etc.

## Principais funcionalidades
✅ Geração contextual com RAG (acervo vetorizado do site)  
✅ Chat multi-turn com histórico persistente (sobrevive refresh de página)  
✅ Links inteligentes: títulos de artigos do acervo viram links no texto  
✅ Expandir para modal maior (melhor experiência de chat)  
✅ Prompt customizável em **JEO → AI Configuration → Context Assistant**  

## Arquitetura
- Mesma stack do Minimap (`hacklabr/ai-assistant` + `neuron-ai`)
- 3 endpoints REST: `/context/setup`, `/context/chat`, `/context/state`
- Estado persistido em `post_meta`

## Arquivos principais
```
src/includes/ai/class-context-{agent,handler,generation-output,retrieve-knowledge-tool}.php
src/js/src/context-sidebar/
```

## Próximos passos na fila
- Inserir na posição do cursor (hoje vai pro final)
- Thumbs up/down para fine-tuning do prompt
- Testes unitários Jest

---

📎 User documentation: `docs/ai-context-assistant.md`
