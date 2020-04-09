FROM wordpress

RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar && \
	chmod +x wp-cli.phar && \
	mv wp-cli.phar /usr/local/bin/wp

COPY docker/wordpress/entrypoint.sh /entrypoint.sh

RUN sed -i '$ d' /usr/local/bin/docker-entrypoint.sh

RUN cat /entrypoint.sh >> /usr/local/bin/docker-entrypoint.sh
