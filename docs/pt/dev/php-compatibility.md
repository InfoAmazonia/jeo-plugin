# Compatibilidade com PHP

Este repositório mantém duas camadas de validação de compatibilidade com PHP:

- Verificações estáticas de compatibilidade para PHP `8.0` até `8.5`.
- Testes de smoke do WordPress para as combinações de PHP e WordPress que atualmente oferecemos suporte ou monitoramos.

## Resumo da política

Validado em 21 de maio de 2026.

- Suporte principal: PHP `8.2`, `8.3` e `8.4`.
- Monitoramento experimental: PHP `8.5`.
- Gate estável do WordPress: `WordPress 7.0` em PHP `8.2`, `8.3` e `8.4`.
- Gate experimental do WordPress: `WordPress 7.0` em PHP `8.5`.
- Cobertura de compatibilidade retroativa: `WordPress 6.6` em PHP `8.0` e `8.1`.

## Automação

- Verificações estáticas: `.github/workflows/php-compat.yml`
- Testes de smoke do WordPress: `.github/workflows/wordpress-smoke.yml`

## Como o PHP 8.5 é coberto

- O `phpcs-compat.xml.dist` executa o PHPCompatibilityWP contra o código-fonte do plugin com `testVersion` definido como PHP `8.0-8.5`.
- O `.github/workflows/php-compat.yml` executa esse ruleset do PHPCompatibilityWP como gate estático de compatibilidade com PHP do repositório.
- O `.github/workflows/wordpress-smoke.yml` inclui um job experimental de smoke em PHP `8.5` para o `WordPress 7.0`.
- O `scripts/wordpress-smoke.sh` respeita o `WP_CLI_PHP`, de modo que o mesmo smoke de runtime pode ser executado localmente contra o PHP `8.5`.
- O suporte estável do `wp-cli` ao PHP `8.5` ainda está planejado upstream. Essa incompatibilidade é o motivo pelo qual o PHP `8.5` continua experimental na política de CI deste repositório.

## Comandos locais

Execute as verificações estáticas de compatibilidade com PHP localmente:

```bash
composer install --no-interaction --no-progress --prefer-dist
vendor/bin/phpcs --standard=phpcs-compat.xml.dist
```

Execute o teste de smoke do WordPress localmente com um runtime de PHP explícito:

```bash
WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php \
WP_DB_HOST=localhost \
WP_DB_NAME=wordpress \
WP_DB_USER=your-user \
WP_DB_PASSWORD='' \
WP_VERSION=7.0 \
bash scripts/wordpress-smoke.sh
```

O script de smoke agora respeita o `WP_CLI_PHP` diretamente, o que evita que o `wp` do Homebrew use por padrão o binário `php` ativo no `PATH`.
O repositório em si está atualmente limpo no PHP `8.5`, mas o `wp-cli` 2.12.0 ainda emite ruído de deprecações de terceiros nesse runtime, então o PHP `8.5` continua sendo uma linha de runtime experimental.

## Status atual

- As verificações estáticas do PHPCompatibilityWP estão verdes para PHP `8.0` até `8.5`.
- O smoke local do WordPress no PHP `8.5` passa, mas ainda registra deprecações de terceiros do `wp-cli` e das bibliotecas empacotadas nele.
- Mantenha o PHP `8.5` experimental no CI até que esses logs de terceiros parem de obscurecer o sinal de runtime.
