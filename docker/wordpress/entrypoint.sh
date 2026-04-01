#!/bin/bash

if [ ! -f /installed ]; then
    wp --allow-root --path=/var/www/html core install --url=http://localhost:8072/ \
		--admin_user=admin --admin_password=admin --admin_email=admin@localhost.local \
		--title='JEO Development'

	# Ensure a valid theme is active (sometimes the latest WP install leaves it missing or breaks)
	wp --allow-root --path=/var/www/html theme activate twentytwentyfive || true

	wp --allow-root --path=/var/www/html plugin list
	wp --allow-root --path=/var/www/html plugin activate jeo

	touch /installed
fi

exec "$@"
