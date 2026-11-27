# Compatibilidad con PHP

Este repositorio mantiene dos capas de validación de compatibilidad con PHP:

- Verificaciones estáticas de compatibilidad para PHP `8.0` a `8.5`.
- Pruebas de humo (smoke tests) de WordPress para las combinaciones de PHP y WordPress que actualmente soportamos o monitoreamos.

## Resumen de la política

Validado el 21 de mayo de 2026.

- Soporte principal: PHP `8.2`, `8.3` y `8.4`.
- Monitoreo experimental: PHP `8.5`.
- Gate estable de WordPress: `WordPress 7.0` con PHP `8.2`, `8.3` y `8.4`.
- Gate experimental de WordPress: `WordPress 7.0` con PHP `8.5`.
- Cobertura de retrocompatibilidad: `WordPress 6.6` con PHP `8.0` y `8.1`.

## Automatización

- Verificaciones estáticas: `.github/workflows/php-compat.yml`
- Pruebas de humo de WordPress: `.github/workflows/wordpress-smoke.yml`

## Cómo se cubre PHP 8.5

- `phpcs-compat.xml.dist` ejecuta PHPCompatibilityWP contra el código fuente del plugin con `testVersion` establecido en PHP `8.0-8.5`.
- `.github/workflows/php-compat.yml` ejecuta ese ruleset de PHPCompatibilityWP como gate estático de compatibilidad con PHP del repositorio.
- `.github/workflows/wordpress-smoke.yml` incluye un job de prueba de humo experimental de PHP `8.5` para `WordPress 7.0`.
- `scripts/wordpress-smoke.sh` respeta `WP_CLI_PHP`, de modo que la misma prueba de humo en runtime se puede ejecutar localmente contra PHP `8.5`.
- El soporte estable de `wp-cli` para PHP `8.5` todavía está planificado upstream. Ese desajuste es la razón por la que PHP `8.5` sigue siendo experimental en la política de CI de este repositorio.

## Comandos locales

Ejecuta localmente las verificaciones estáticas de compatibilidad con PHP:

```bash
composer install --no-interaction --no-progress --prefer-dist
vendor/bin/phpcs --standard=phpcs-compat.xml.dist
```

Ejecuta localmente la prueba de humo de WordPress con un runtime de PHP explícito:

```bash
WP_CLI_PHP=/opt/homebrew/opt/php@8.4/bin/php \
WP_DB_HOST=localhost \
WP_DB_NAME=wordpress \
WP_DB_USER=your-user \
WP_DB_PASSWORD='' \
WP_VERSION=7.0 \
bash scripts/wordpress-smoke.sh
```

Ahora el script de prueba de humo respeta `WP_CLI_PHP` directamente, lo que evita que el `wp` de Homebrew use por defecto el binario `php` activo de `PATH`.
El repositorio en sí está actualmente limpio bajo PHP `8.5`, pero `wp-cli` 2.12.0 todavía emite ahí ruido de deprecaciones de terceros, así que PHP `8.5` sigue siendo una línea de runtime experimental.

## Estado actual

- Las verificaciones estáticas de PHPCompatibilityWP están en verde para PHP `8.0` a `8.5`.
- La prueba de humo local de WordPress pasa en PHP `8.5`, pero todavía registra deprecaciones de terceros de `wp-cli` y sus bibliotecas incluidas.
- Mantén PHP `8.5` como experimental en el CI hasta que esos registros de terceros dejen de ocultar la señal del runtime.
