#!/bin/bash

# Ensure wp-content/uploads and jeo-ai-store exist and have proper permissions
mkdir -p /var/www/html/wp-content/uploads/jeo-ai-store
chown -R www-data:www-data /var/www/html/wp-content/uploads
chmod -R 775 /var/www/html/wp-content/uploads

if [ ! -f /installed ]; then
    wp --allow-root --path=/var/www/html core install --url=http://localhost:${JEO_PORT:-8077}/ \
		--admin_user=admin --admin_password=admin --admin_email=admin@localhost.local \
		--title='JEO Development'

	# Ensure a valid theme is active (sometimes the latest WP install leaves it missing or breaks)
	wp --allow-root --path=/var/www/html theme activate twentytwentyfive || true

	wp --allow-root --path=/var/www/html plugin list
	wp --allow-root --path=/var/www/html plugin activate jeo

	touch /installed
fi

exec "$@"
