@echo off
REM Vulcan - start all services. Paths resolve from this file's folder, so it works on any machine.
set ROOT=%~dp0
REM Trust the Windows certificate store (needed on networks with HTTPS inspection) and force UTF-8 for Python logs.
set MAVEN_OPTS=-Djavax.net.ssl.trustStoreType=Windows-ROOT
set PYTHONUTF8=1

echo Starting Vulcan Services from %ROOT% ...

start "Auth Service (8081)" cmd /k "cd /d "%ROOT%backend\auth-service" && .\mvnw.cmd spring-boot:run"
timeout /t 5

start "Worker Service (8082)" cmd /k "cd /d "%ROOT%backend\worker-service" && .\mvnw.cmd spring-boot:run"
timeout /t 5

start "Attendance Service (8083)" cmd /k "cd /d "%ROOT%backend\attendance-service" && .\mvnw.cmd spring-boot:run"
timeout /t 5

start "Equipment Service (8084)" cmd /k "cd /d "%ROOT%backend\equipment-service" && .\mvnw.cmd spring-boot:run"
timeout /t 5

start "Task Service (8085)" cmd /k "cd /d "%ROOT%backend\task-service" && .\mvnw.cmd spring-boot:run"
timeout /t 5

start "Payroll Service (8086)" cmd /k "cd /d "%ROOT%backend\payroll-service" && .\mvnw.cmd spring-boot:run"
timeout /t 5

start "Site Survey Service (8087)" cmd /k "cd /d "%ROOT%backend\site-survey-service" && .\mvnw.cmd spring-boot:run"
timeout /t 5

start "Analytics Service (8088)" cmd /k "cd /d "%ROOT%backend\analytics-service" && .\mvnw.cmd spring-boot:run"
timeout /t 5

start "AI Face Detection (9000)" cmd /k "cd /d "%ROOT%ai-services" && venv\Scripts\python.exe -m uvicorn main:app --reload --port 9000"

echo All services starting...
