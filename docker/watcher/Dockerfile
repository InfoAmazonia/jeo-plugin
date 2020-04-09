FROM node:12

LABEL mantainer "hacklab/ <contato@hacklab.com.br>"

COPY docker/watcher/entrypoint.sh /entrypoint.sh

ENTRYPOINT /entrypoint.sh

RUN chmod +x /entrypoint.sh

RUN mkdir /app

WORKDIR /app
