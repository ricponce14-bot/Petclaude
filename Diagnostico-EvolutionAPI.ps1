Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSTICO COMPLETO - LADRIDO" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Estado de contenedores
Write-Host "[1/5] Estado de contenedores Docker..." -ForegroundColor Yellow
$containers = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@204.168.155.151 "docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
Write-Host $containers
Write-Host ""

# 2. Logs de Evolution API (ultimas 30 lineas)
Write-Host "[2/5] Ultimas 30 lineas de logs de Evolution API..." -ForegroundColor Yellow
$logs = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@204.168.155.151 "docker logs evolution-api --tail 30 2>&1"
Write-Host $logs
Write-Host ""

# 3. Verificar si el puerto 8080 responde DENTRO del servidor
Write-Host "[3/5] Probando si Evolution API responde internamente..." -ForegroundColor Yellow
$internal = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@204.168.155.151 "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080 2>&1"
Write-Host "Codigo HTTP interno: $internal"
Write-Host ""

# 4. Verificar el puerto 8080 desde afuera
Write-Host "[4/5] Probando puerto 8080 desde tu computadora..." -ForegroundColor Yellow
$external = Test-NetConnection -ComputerName 204.168.155.151 -Port 8080 -WarningAction SilentlyContinue
Write-Host "Puerto 8080 abierto desde afuera: $($external.TcpTestSucceeded)"
Write-Host ""

# 5. Contenido del docker-compose.yml
Write-Host "[5/5] Contenido actual de docker-compose.yml..." -ForegroundColor Yellow
$compose = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@204.168.155.151 "cat /root/evolution-api/docker-compose.yml"
Write-Host $compose
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSTICO FINALIZADO" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
