# Planejamento: Integração JEO RAG (v3.8.0-alpha)

Este documento descreve a estratégia para implementar um sistema de **Retrieval-Augmented Generation (RAG)** no JEO, permitindo que a IA consulte o acervo de posts do WordPress para responder perguntas contextuais ou auxiliar na geolocalização.

---

## 1. Arquitetura RAG no JEO

Utilizaremos o suporte nativo a RAG do framework **Neuron AI**. O sistema será composto por:

- **RAG Agent:** Uma nova classe `Jeo\AI\RAG_Agent` que estende `NeuronAI\RAG\RAG`.
- **Vector Store (Default):** `NeuronAI\RAG\VectorStore\FileVectorStore` para garantir compatibilidade com hosts compartilhados.
- **Embeddings:** Reutilização dos provedores já configurados no JEO (OpenAI, Gemini, Ollama, etc.).
- **Data Loader:** Implementação customizada para converter posts do WordPress em `NeuronAI\RAG\Document`.

---

## 2. Armazenamento (Vector Store)

### 2.1. Local File Store (Padrão)
Para funcionar em qualquer servidor, o banco de vetores será armazenado em disco:
- **Caminho:** `wp-content/uploads/jeo-ai-store/`
- **Segurança:** O diretório conterá um arquivo `.htaccess` e `index.php` para impedir listagem e acesso direto.
- **Formato:** Arquivo serializado `.store` (padrão do `FileVectorStore` do Neuron).

### 2.2. Expansão Futura
A arquitetura permitirá plugar outros bancos via interface:
- Postgres (com pgvector)
- Qdrant
- Supabase (via Postgrest/Postgres)
- Pinecone

---

## 3. Interface de Usuário (Settings UI)

Uma nova aba **"Knowledge Base"** será adicionada em *JEO Settings > AI*.

### Funcionalidades:
1.  **Status da Indexação:** Exibe quantos posts foram vetorizados e a data da última atualização.
2.  **Botão "Vetorizar Posts":** Inicia o processo de varredura e indexação via AJAX/WP-CLI.
3.  **Configuração de Provedor:** Seleção de qual modelo de embedding usar (ex: `text-embedding-3-small` da OpenAI).
4.  **Filtros de Indexação:** Escolha de quais Post Types devem ser incluídos na base de conhecimento.

---

## 4. Implementação Técnica

### 4.1. Classe `RAG_Agent`
```php
namespace Jeo\AI;

use NeuronAI\RAG\RAG;
use NeuronAI\RAG\VectorStore\FileVectorStore;
use NeuronAI\RAG\VectorStore\VectorStoreInterface;
use NeuronAI\Embeddings\EmbeddingsProviderInterface;
use NeuronAI\Providers\AIProviderInterface;

class RAG_Agent extends RAG {
    protected function ai(): AIProviderInterface {
        // Retorna o provedor configurado no JEO
        return (new Neuron_Agent_Factory())->get_provider();
    }

    protected function embeddingsProvider(): EmbeddingsProviderInterface {
        // Retorna o provedor de embeddings configurado
        return (new Neuron_Agent_Factory())->get_embeddings_provider();
    }

    protected function vectorStore(): VectorStoreInterface {
        $path = wp_upload_dir()['basedir'] . '/jeo-ai-store';
        return new FileVectorStore(directory: $path, name: 'jeo_knowledge');
    }
}
```

### 4.2. Processo de Vetorização (Ingestion)
O processo deve ser cuidadoso com recursos do servidor:
- Processamento em lotes (batches) de 10-20 posts por vez.
- Armazenamento de metadados no post (`_jeo_vectorized_at`) para evitar re-indexação desnecessária.

---

## 5. Próximos Passos
1. Criar a estrutura de diretórios em `wp-content/uploads/jeo-ai-store/`.
2. Implementar a aba "Knowledge Base" no React das configurações.
3. Desenvolver o comando WP-CLI `wp jeo ai vectorize` para testes em larga escala.

---
*Documento gerado em: 2 de Abril de 2026*
