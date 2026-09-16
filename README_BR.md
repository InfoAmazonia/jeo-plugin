# JEO

O plugin JEO atua como uma plataforma de geojornalismo que permite a organizações de notícias, blogueiros e ONGs publicarem matérias jornalísticas como camadas de informações em mapas digitais interativos.

Com o JEO, a criação da interação entre camadas de dados e informações contextuais é intuitiva e interativa. Você pode publicar matérias georreferenciadas e criar páginas ricamente desenhadas para cada uma das histórias em destaque.

## 🤖 O que há de novo na v3.6.5 (RAG & Knowledge Base)
O JEO evoluiu consideravelmente sua integração com o framework Neuron AI, introduzindo uma arquitetura nativa de **Retrieval-Augmented Generation (RAG)** que converte o conteúdo do WordPress no seu cérebro semântico e territorial privado.

- **Base de Conhecimento RAG:** Vetorize seus posts já publicados em massa via WP-CLI (`wp jeo ai vectorize`) gravando um banco de dados inteligente direto no disco (FileVectorStore).
- **Recuperação Semântica (Retrieval):** Valide os modelos no painel do JEO usando busca por linguagem natural que encontra similaridade algorítmica de Cosseno sem precisar depender das tags do WordPress.
- **Camada de Isolamento RAG:** Dois bancos físicos criados por padrão. Um de produção (`jeo_knowledge.store`) e um temporário para amostragem/testes de random posts (`jeo_knowledge_test.store`).
- **Flexibilidade de Embeddings:** Confie nos defaults inteligentes (`text-embedding-3-small`, `nomic-embed-text`) ou insira o identificador oficial do provedor que quer testar entre os 10+ modelos (Google Gemini, OpenAI, Ollama, DeepSeek).
- **Estimativa de Custos RAG:** O painel "AI Logs" agora conta a conversão de caracteres e estima os tokens gastos em Ingestion (armazenamento) e Retrieval (busca semântica).
- **Motor Unificado Atualizado:** Interceptador de APIs ainda exigindo PHP 8.2 e injetando regras constitucionais por provedor para garantir o melhor Structured Output geográfico.

## 🕹️ Navegando no Painel JEO
O menu administrativo do WordPress está organizado para um fluxo de trabalho geo-editorial profissional:
1. **Boas-vindas:** Sua documentação viva e guia de primeiros passos.
2. **Experimental (Dashboard):** Uma visão geral de todo o seu impacto geolocalizado.
3. **Mapas:** Gerencie suas instâncias e layouts de mapa.
4. **Camadas:** Conecte suas fontes de dados (Mapbox, TileLayers, etc).
5. **Mapas de História (Storymaps):** Crie narrativas imersivas em formato scroll-telling.
6. **Configurações:** Configuração global para Provedores de IA (10 opções), Geocodificadores e Mapas.
7. **Logs de IA (Custos):** Dashboard detalhado de consumo de tokens e auditoria técnica.

---

## 🛠️ Configurando o Ambiente Local (Desenvolvimento)

A maneira mais fácil de desenvolver o JEO é usando nossa stack moderna do Docker.

### Pré-requisitos:
- Docker e Docker Compose (v2+)
- PHP 8.2+ e Composer (instalados localmente para dependências)

### Início Rápido:
1. Clone o repositório:
   ```bash
   git clone git@github.com:InfoAmazonia/jeo-plugin.git
   cd jeo-plugin
   ```
2. Execute o script de setup:
   ```bash
   ./setup.sh
   ```
3. Acesse seu site local:
   👉 **http://localhost:8072/wp-admin** (Usuário: `admin` / Senha: `admin`)

### Testando Compatibilidade:
Você pode testar o JEO contra diferentes versões de WordPress ou PHP usando os parâmetros de setup:
```bash
./setup.sh --test-env 6.9-php8.5-apache
```

---

## 🏗️ Build & Produção
O JEO usa React e Webpack para os blocos do Gutenberg e requer o Composer para as funcionalidades de IA.

### Gerando um Pacote de Release:
Para gerar um arquivo `.zip` limpo e pronto para produção para upload manual no WordPress:
```bash
./build.sh
```
*Este script compilará os assets, instalará dependências otimizadas e empacotará o plugin em um arquivo zip.*

### Desenvolvimento Manual (Sem Docker):
1. Instale dependências do Node: `npm install`
2. Instale dependências do PHP: `composer install`
3. Inicie o monitor de desenvolvimento: `npm run start`
4. Compile os assets: `npm run build`

---
**Mantido por InfoAmazonia / hacklab/**
