@echo off
chcp 65001 >nul

REM ============ 配置区域 ============
set SERVER_USER=root
set SERVER_IP=47.94.183.229
set SERVER_PATH=/var/www/muyu
REM ==================================

echo 打包项目...
call npm run build

echo 上传到服务器...
scp -r dist/* %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%

echo 部署完成！
pause
