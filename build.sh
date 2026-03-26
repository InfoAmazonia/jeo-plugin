#!/bin/bash

# Interrompe o script se ocorrer algum erro
set -e

PLUGIN_SLUG="jeo"
VERSION="3.5.3-experimental"
ZIP_NAME="${PLUGIN_SLUG}-${VERSION}.zip"
BUILD_DIR=".build-tmp"

echo "🚀 Iniciando o build do plugin JEO ($VERSION) para Homologação..."

echo "📦 Instalando dependências do Node (npm)..."
npm install

echo "🏗️ Compilando assets do Frontend/Gutenberg para produção..."
npm run build

echo "🐘 Instalando dependências do Composer (sem pacotes de dev)..."
composer install --no-dev --optimize-autoloader

echo "🧹 Preparando diretório temporário de empacotamento..."
rm -rf $BUILD_DIR
rm -f $ZIP_NAME
mkdir -p $BUILD_DIR/$PLUGIN_SLUG

echo "📋 Copiando arquivos do plugin..."
# O diretório 'src' é a raiz do nosso plugin no WordPress
cp -a src/. $BUILD_DIR/$PLUGIN_SLUG/

# Copia todos os arquivos README de documentação para a Welcome Page
cp README*.md $BUILD_DIR/$PLUGIN_SLUG/ 2>/dev/null || true

echo "🗑️ Removendo arquivos de desenvolvimento do pacote final..."
# Remove a pasta de código-fonte JS bruto, mas guarda a pasta de ícones se precisar
if [ -d "$BUILD_DIR/$PLUGIN_SLUG/js/src" ]; then
    find $BUILD_DIR/$PLUGIN_SLUG/js/src -type f ! -name "*.svg" ! -name "*.png" ! -name "*.jpg" -delete
    find $BUILD_DIR/$PLUGIN_SLUG/js/src -type d -empty -delete
fi

# Remove arquivos de configuração de dev indesejados que possam estar no src/
find $BUILD_DIR/$PLUGIN_SLUG -name ".editorconfig" -type f -delete
find $BUILD_DIR/$PLUGIN_SLUG -name ".wporg-ignore" -type f -delete
find $BUILD_DIR/$PLUGIN_SLUG -name "*.log" -type f -delete

echo "🗜️ Zipando os arquivos em $ZIP_NAME..."
cd $BUILD_DIR
# Cria o zip de forma silenciosa (-q) e recursiva (-r)
zip -q -r ../$ZIP_NAME $PLUGIN_SLUG/
cd ..

echo "🧹 Limpando diretório temporário..."
rm -rf $BUILD_DIR

echo "✅ Build concluído com sucesso!"
echo "➡️  Arquivo gerado: $ZIP_NAME"
echo "Agora você pode enviar este arquivo pelo painel do WordPress em Homologação."
