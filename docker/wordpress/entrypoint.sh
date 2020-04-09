#!/bin/bash

if [ ! -f /installed ]; then
    wp --allow-root --path=/var/www/html core install --url=http://localhost/ \
		--admin_user=admin --admin_password=admin --admin_email=admin@localhost.local \
		--title='JEO Development'

	wp --allow-root --path=/var/www/html plugin list

	wp --allow-root --path=/var/www/html plugin activate jeo

	wp --allow-root --path=/var/www/html jeo fixtures update

	touch /installed
fi

exec "$@"
