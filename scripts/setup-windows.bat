@echo off
REM SPFx Offline Environment Setup Script for Windows
REM This script sets up a complete offline SPFx development environment

echo ============================================
echo SPFx Offline Environment Setup for Windows
echo ============================================
echo.

REM Get the script directory
set SCRIPT_DIR=%~dp0
set ENV_ROOT=%SCRIPT_DIR%..

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed!
    echo.
    echo Please install Node.js 18.x from one of these files in the node-installers folder:
    echo   - node-v18.20.5-x64.msi (recommended - Windows Installer)
    echo   - node-v18.20.5-win-x64.zip (portable version)
    echo.
    echo After installing, run this script again.
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js version: %NODE_VERSION%

REM Check if npm is available
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo npm is not available. Please reinstall Node.js.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo npm version: %NPM_VERSION%
echo.

REM Extract global-packages node_modules if needed
echo Checking global packages...
if not exist "%ENV_ROOT%\global-packages\node_modules" (
    echo Extracting global-packages node_modules...
    cd /d "%ENV_ROOT%\global-packages"
    if exist "node_modules.zip" (
        powershell -command "Expand-Archive -Path 'node_modules.zip' -DestinationPath '.' -Force"
        echo Global packages extracted successfully.
    ) else (
        echo Warning: node_modules.zip not found in global-packages folder.
    )
) else (
    echo Global packages already extracted.
)
echo.

REM Extract sample-project node_modules if needed
echo Checking sample project dependencies...
if not exist "%ENV_ROOT%\sample-project\sample-spfx\node_modules" (
    echo Extracting sample-project node_modules...
    cd /d "%ENV_ROOT%\sample-project\sample-spfx"
    
    REM Check if split files exist and combine them
    if exist "node_modules.zip.part_aa" (
        echo Combining split zip files...
        copy /b node_modules.zip.part_* node_modules.zip
        echo Combined successfully.
    )
    
    if exist "node_modules.zip" (
        powershell -command "Expand-Archive -Path 'node_modules.zip' -DestinationPath '.' -Force"
        echo Sample project dependencies extracted successfully.
    ) else (
        echo Warning: node_modules.zip not found in sample-project/sample-spfx folder.
    )
) else (
    echo Sample project dependencies already extracted.
)
echo.

REM Install global packages from tgz files
echo Installing global SPFx development tools...
cd /d "%ENV_ROOT%\global-packages"

echo Installing Yeoman (yo)...
call npm install -g yo-6.0.0.tgz --offline 2>nul
if %ERRORLEVEL% neq 0 (
    echo Attempting alternative installation method...
    call npm install -g yo-6.0.0.tgz
)

echo Installing Gulp CLI...
call npm install -g gulp-cli-3.1.0.tgz --offline 2>nul
if %ERRORLEVEL% neq 0 (
    call npm install -g gulp-cli-3.1.0.tgz
)

echo Installing SharePoint Generator...
call npm install -g microsoft-generator-sharepoint-1.22.1.tgz --offline 2>nul
if %ERRORLEVEL% neq 0 (
    call npm install -g microsoft-generator-sharepoint-1.22.1.tgz
)

echo.
echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo Installed tools:
echo   - Yeoman (yo): For scaffolding projects
echo   - Gulp CLI: For running build tasks
echo   - SharePoint Generator: For creating SPFx projects
echo.
echo To verify installation, run:
echo   yo --version
echo   gulp --version
echo.
echo To work with the sample SPFx project:
echo   cd sample-project\sample-spfx
echo   gulp serve
echo.
echo To create a new SPFx project:
echo   mkdir my-new-project
echo   cd my-new-project
echo   yo @microsoft/sharepoint
echo.
pause
