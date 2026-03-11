$yamlContent = @"
services:
  evolution-api:
    image: evoapicloud/evolution-api:v2.3.7
    container_name: evolution-api
    restart: always
    network_mode: host
    environment:
      - SERVER_URL=http://204.168.155.151:8080
      - SERVER_PORT=8080
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=B111244CC4F84DC598F7FF2B0AB30472
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
      - ADMIN_PASSWORD=admin
      - LOG_LEVEL=ERROR,WARN,DEBUG,INFO,LOG,VERBOSE,DARK,WEBHOOKS
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://evo:evopass@127.0.0.1:5432/evolution?schema=public
      - DATABASE_CONNECTION_CLIENT_NAME=evolution_m
      - RABBITMQ_ENABLED=false
      - WEBSOCKET_ENABLED=false
      - CACHE_REDIS_ENABLED=false
    volumes:
      - evolution_instances:/evolution/instances
      - evolution_store:/evolution/store

  postgres:
    image: postgres:15-alpine
    container_name: evo-postgres
    restart: always
    ports:
      - `"5432:5432`"
    environment:
      - POSTGRES_USER=evo
      - POSTGRES_PASSWORD=evopass
      - POSTGRES_DB=evolution
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  evolution_instances:
  evolution_store:
  postgres_data:

"@

$yamlContent > .\docker-compose.yml
Write-Host "1. Archivo generado con imagen evoapicloud/evolution-api:v2.3.7 y sin CONFIG_SESSION_PHONE_VERSION"
scp -o StrictHostKeyChecking=no .\docker-compose.yml root@204.168.155.151:/root/evolution-api/docker-compose.yml
Write-Host "2. Archivo transferido a Hetzner."
ssh -o StrictHostKeyChecking=no root@204.168.155.151 "cd /root/evolution-api && docker compose down && docker compose pull && docker compose up -d"
Write-Host "3. Evolution API v2.3.7 redesplegada correctamente."
