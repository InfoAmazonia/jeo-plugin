ARG WP_IMAGE_TAG=php8.2-apache
FROM wordpress:${WP_IMAGE_TAG}

# Configurações generosas do PHP para ambiente de desenvolvimento (JEO)
RUN echo "upload_max_filesize = 1024M\n\
post_max_size = 1024M\n\
memory_limit = 2048M\n\
max_execution_time = 600\n\
max_input_time = 600\n\
max_input_vars = 5000\n" > /usr/local/etc/php/conf.d/uploads-jeo.ini

# Configuração do Timeout no Apache para não cortar requisições longas
RUN sed -i 's/^Timeout 300/Timeout 600/' /etc/apache2/apache2.conf

RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar && \
	chmod +x wp-cli.phar && \
	mv wp-cli.phar /usr/local/bin/wp

COPY docker/wordpress/entrypoint.sh /entrypoint.sh

RUN sed -i '$ d' /usr/local/bin/docker-entrypoint.sh

RUN cat /entrypoint.sh >> /usr/local/bin/docker-entrypoint.sh
