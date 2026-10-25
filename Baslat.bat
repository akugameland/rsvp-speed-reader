@echo off
rem Hizli Okuma: kucuk yerel sunucuyu baslatir; sunucu hazir olunca tarayicida acar.
rem Kutuphane tarayicida bu adrese bagli saklanir; programi hep bu dosyayla ac.
setlocal
rem Guvenlik: komutlari bu klasorde arama (sahte python.exe calismasin)
set NoDefaultCurrentDirectoryInExePath=1
cd /d "%~dp0"
start "Hizli Okuma sunucusu - kapatirsan program durur" /min python -I sunucu.py --ac
