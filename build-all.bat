@echo off
REM Vulcan - build every backend service once (downloads dependencies on first run).
setlocal enabledelayedexpansion
set ROOT=%~dp0
set FAILED=

for %%s in (auth-service worker-service attendance-service equipment-service task-service payroll-service site-survey-service analytics-service) do (
  echo.
  echo ==================================================
  echo   Building %%s
  echo ==================================================
  cd /d "%ROOT%backend\%%s"
  call .\mvnw.cmd -DskipTests package
  if errorlevel 1 set FAILED=!FAILED! %%s
)

echo.
echo ==================================================
if "!FAILED!"=="" (
  echo   ALL SERVICES BUILT SUCCESSFULLY
) else (
  echo   FAILED:!FAILED!
)
echo ==================================================
