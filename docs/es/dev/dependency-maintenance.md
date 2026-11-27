# Mantenimiento de dependencias

JEO usa el mantenimiento de dependencias nativo de GitHub para las actualizaciones
rutinarias y mantiene la lógica personalizada del repositorio limitada a las
verificaciones de lanzamiento y de runtime específicas del plugin.

## Mantenimiento automatizado

- Dependabot abre pull requests semanales contra `develop` para actualizaciones de
  npm, Composer y GitHub Actions.
- Dependency Review se ejecuta en los pull requests y falla cuando un cambio de
  dependencia introduce una vulnerabilidad de severidad alta o mayor.
- `npm audit --package-lock-only` y `composer audit --locked` siguen siendo los
  comandos locales para revisar los lockfiles actuales.

## Revisión de pull requests de actualización

1. Verifica si la actualización es un cambio patch, minor, major o de GitHub Action.
2. Revisa el resultado de Dependency Review en busca de avisos recién introducidos.
3. Ejecuta las verificaciones locales pertinentes:
   - Actualización de npm o del frontend: `npm ci`, `npm run build`,
     `npm run build:report` y `npm run test:unit`.
   - Actualización de PHP o Composer: `composer install`, `composer audit --locked`,
     `vendor/bin/phpcs --standard=phpcs.xml.dist` y
     `vendor/bin/phpcs --standard=phpcs-compat.xml.dist`.
   - Actualización sensible al runtime: ejecuta la prueba de humo de WordPress o
     espera el workflow WordPress Smoke Tests.
4. Para las actualizaciones major, confirma que los flujos de editor, mapa, mapa
   narrativo, Discovery, geocodificación y renderizado público que toca el paquete
   siguen comportándose correctamente.

## Overrides

El bloque `overrides` de `package.json` está reservado para fijaciones temporales
de seguridad, compatibilidad o paquetes locales. Cada override debe eliminarse
cuando la dependencia upstream ya no lo necesite.

Al añadir o cambiar un override, incluye el motivo y la condición de eliminación
en la descripción del pull request. Revisa los overrides activos después de
actualizaciones major de `@wordpress/scripts`, Gutenberg, React o webpack.
