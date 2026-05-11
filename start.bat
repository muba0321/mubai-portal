@echo off
chcp 65001 >nul
echo ========================================
echo   SRE Portal 前端启动脚本
echo ========================================
echo.

cd /d "%~dp0"

:: 检查 Node.js
echo [1/4] 检查 Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js (>= 20.10.0)
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo Node.js 版本: %NODE_VERSION%
echo.

:: 检查 pnpm
echo [2/4] 检查 pnpm...
pnpm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] 未检测到 pnpm，正在全局安装...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        echo [错误] pnpm 安装失败，请手动运行: npm install -g pnpm
        pause
        exit /b 1
    )
)
for /f "tokens=*" %%i in ('pnpm -v') do set PNPM_VERSION=%%i
echo pnpm 版本: %PNPM_VERSION%
echo.

:: 检查 node_modules
echo [3/4] 检查依赖...
if not exist "node_modules" (
    echo [提示] 检测到 node_modules 目录不存在，正在安装依赖...
    pnpm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败，请检查网络或手动运行: pnpm install
        pause
        exit /b 1
    )
    echo 依赖安装完成!
) else (
    echo node_modules 已存在
)
echo.

:: 启动开发服务器
echo [4/4] 启动开发服务器...
echo.
echo ========================================
echo   访问地址: http://localhost:3000
echo ========================================
echo.

pnpm dev
