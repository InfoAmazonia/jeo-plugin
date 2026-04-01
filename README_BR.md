# JEO

O plugin JEO atua como uma plataforma de geojornalismo que permite a organizações de notícias, blogueiros e ONGs publicarem matérias jornalísticas como camadas de informações em mapas digitais interativos.

Com o JEO, a criação da interação entre camadas de dados e informações contextuais é intuitiva e interativa. Você pode publicar matérias georreferenciadas e criar páginas ricamente desenhadas para cada uma das histórias em destaque.

## 🤖 O que há de novo na v3.6.0 (Integração Neuron AI)
O JEO evoluiu suas capacidades de Inteligência Artificial ao integrar o framework **Neuron AI**, proporcionando uma experiência de georreferenciamento mais robusta, estável e transparente.

- **Motor de IA Unificado:** Agora alimentado pelo Neuron AI para interações padronizadas e saídas estruturadas (Structured Output).
- **10 LLMs Suportadas:** Google Gemini, OpenAI (GPT-4o), DeepSeek, Anthropic Claude, Ollama (Local), Mistral AI, Zhipu AI (GLM), HuggingFace, Grok (xAI) e Cohere.
- **Dashboard de Custos e Tokens:** Novo painel privado para monitorar o consumo de tokens (Input/Output) em tempo real para cada requisição de IA, armazenado nativamente no WordPress.
- **Core PHP 8.2:** Infraestrutura atualizada exigindo PHP 8.2 ou superior para máxima performance e segurança.
- **Aprovações Inteligentes:** Modal de validação visual aprimorado para revisar locais extraídos pela IA antes da publicação.
- **Base de Conhecimento Autoritativa:** Mais de 10 dicionários de dados incorporados para territórios brasileiros (Biomas, Terras Indígenas, Quilombos e mais).

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
