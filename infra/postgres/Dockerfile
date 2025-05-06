FROM postgres:16-alpine AS builder

RUN apk add --no-cache build-base linux-headers python3-dev py3-pip py3-virtualenv && \
    python3 -m venv /venv

WORKDIR /venv

COPY requirements.txt .
RUN ./bin/pip install --no-cache-dir -r requirements.txt

FROM postgres:16-alpine

COPY --from=builder /venv /venv

RUN apk add --no-cache python3 su-exec gettext && \
    mkdir -p /venv/etc /var/lib/postgresql/data && \
    chown postgres:postgres /var/lib/postgresql/data && \
    chmod 0700 /var/lib/postgresql/data 

COPY pgsql-entrypoint.sh /usr/local/bin/pgsql-entrypoint.sh
RUN chmod +x /usr/local/bin/pgsql-entrypoint.sh

WORKDIR /var/lib/postgresql

EXPOSE 5432 8008

ENTRYPOINT ["pgsql-entrypoint.sh"]