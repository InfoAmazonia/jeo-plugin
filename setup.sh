#!/bin/bash

# Interrompe o script se ocorrer algum erro
set -e

# ======================================================================
# CONFIGURAÇÃO DE AMBIENTE DE TESTE
# ======================================================================
# Use ./setup.sh --test-env <WP_TAG> para subir contêineres de teste
# Exemplo: ./setup.sh --test-env 6.4.2-php8.1-apache
TEST_ENV=false
WP_TAG="php8.2-apache"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --test-env)
            TEST_ENV=true
            WP_TAG="$2"
            shift 2
            ;;
        --help)
            echo "Uso: ./setup.sh [opções]"
            echo "Opções:"
            echo "  --test-env <tag>  Sobes o Docker para testar uma versão do WordPress e PHP"
            echo "                    (Ex: ./setup.sh --test-env php8.1-apache)"
            echo "  Sem argumentos    Sobe o ambiente padrão (PHP 8.2)"
            exit 0
            ;;
        *)
            break
            ;;
    esac
done

echo "🧪 Preparando ambiente de desenvolvimento/testes com a imagem 'wordpress:$WP_TAG'..."
export WP_IMAGE_TAG="$WP_TAG"

echo "📦 Garantindo que as dependências do Composer estão prontas (para localhost)..."
composer install --ignore-platform-reqs

echo "🚀 Reconstruindo e subindo os containers Docker..."

# Detecta se o sistema usa o novo 'docker compose' (plugin) ou o antigo 'docker-compose' (standalone)
if command -v docker-compose &> /dev/null; then
    DOCKER_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_CMD="docker compose"
else
    echo "❌ Erro: Docker Compose não encontrado no seu sistema. Por favor, instale o Docker."
    exit 1
fi

$DOCKER_CMD down
$DOCKER_CMD up -d --build

echo "✅ Ambiente local subiu com sucesso na porta 72!"
echo "👉 Acesse: http://localhost:72"
echo "🛑 Para parar depois do teste: $DOCKER_CMD down"
exit 0
