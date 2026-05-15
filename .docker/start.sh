#!/usr/bin/env bash
# JEO Development Environment
# Starts WordPress + MariaDB containers for local plugin development.
# The src/ directory is mounted live into the WordPress plugins folder.

cd "$(dirname "$0")"

echo "Starting JEO development environment..."
echo "WordPress will be available at http://localhost:8081"
echo "MariaDB will be available at localhost:3307"
echo ""

docker compose up -d

# Fix uploads directory permissions so WordPress can write media/import files.
docker compose exec -T jeo-dev-wordpress chown -R www-data:www-data /var/www/html/wp-content/uploads 2>/dev/null || true

# Fix plugin directory permissions so WordPress can delete the plugin during uninstall.
# In Docker dev, the host UID owns the files; we grant write access to 'others'.
docker compose exec -T jeo-dev-wordpress chmod -R o+w /var/www/html/wp-content/plugins/jeo 2>/dev/null || true

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ JEO dev environment is running."
    echo "   WordPress: http://localhost:8081"
    echo "   DB:        localhost:3307 (user: jeo / password: jeo / database: jeo)"
    echo ""
    echo "First-run setup:"
    echo "  1. Open http://localhost:8081"
    echo "  2. Complete WordPress installation"
    echo "  3. Activate the JEO plugin from wp-admin"
    echo ""
    echo "Logs:  docker compose -f .docker/docker-compose.yml logs -f"
    echo "Stop:  docker compose -f .docker/docker-compose.yml down"
    echo "Shell: docker exec -it jeo-dev-wordpress bash"
else
    echo "❌ Failed to start containers."
    exit 1
fi
