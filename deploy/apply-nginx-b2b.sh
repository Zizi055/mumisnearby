#!/usr/bin/env bash
#
# Разделяет два домена на сервере 212.67.11.148.
#
# Что было: один серверный блок, подписанный rodnoygolos.ru. Отдельного
# блока для rodnyegolosa.ru на этой машине нет, поэтому «Родные голоса»
# попадали в тот же блок как в сервер по умолчанию — и оба домена
# показывали один и тот же сайт.
#
# Что делаем:
#   1. существующий файл переподписываем на rodnyegolosa.ru, содержимое
#      не трогаем — он и так отдаёт B2C, пусть им и остаётся;
#   2. рядом кладём новый файл для rodnoygolos.ru с корпоративными
#      правилами (b2b.html на корне, кабинет из dist-b2b, /companies/);
#   3. проверяем конфиг и перезагружаем nginx.
#
# Любая ошибка откатывает обе правки и оставляет сервер как был.
#
# Запуск на сервере:
#   bash /var/www/rodnyegolosa.ru/mumisnearby/deploy/apply-nginx-b2b.sh

set -euo pipefail

AVAIL=/etc/nginx/sites-available
ENABLED=/etc/nginx/sites-enabled
REPO=/var/www/rodnyegolosa.ru/mumisnearby
STAMP=$(date +%Y%m%d-%H%M%S)

B2C=$AVAIL/rodnyegolosa.ru
B2B=$AVAIL/rodnoygolos.ru

echo "── 1. Бэкап"
cp "$B2C" "$B2C.bak-$STAMP"
[ -f "$B2B" ] && cp "$B2B" "$B2B.bak-$STAMP"
echo "   $B2C.bak-$STAMP"

rollback() {
  echo "!! Откат"
  cp "$B2C.bak-$STAMP" "$B2C"
  if [ -f "$B2B.bak-$STAMP" ]; then cp "$B2B.bak-$STAMP" "$B2B"; else rm -f "$B2B" "$ENABLED/rodnoygolos.ru"; fi
  nginx -t && systemctl reload nginx
  echo "!! Вернули как было"
  exit 1
}
trap rollback ERR

echo "── 2. Переподписываем существующий блок на rodnyegolosa.ru"
# Меняется только имя домена: в server_name и в путях к сертификату.
# Корень /var/www/rodnyegolosa.ru/... уже с нужным именем и не трогается,
# потому что заменяем строку rodnoygolos.ru — она в путях не встречается.
sed -i 's/rodnoygolos\.ru/rodnyegolosa.ru/g' "$B2C"

echo "   строки, которые изменились:"
grep -nE "server_name|ssl_certificate" "$B2C" | sed 's/^/     /'

echo "── 3. Кладём конфиг корпоративного домена"
cp "$REPO/deploy/nginx-rodnoygolos.ru.conf" "$B2B"
ln -sf "$B2B" "$ENABLED/rodnoygolos.ru"

echo "── 4. Проверяем, что nginx читает sites-enabled маской"
# Если include перечисляет файлы поимённо, одного симлинка мало, и новый
# блок просто не подключится. nginx -t при этом пройдёт: он проверяет
# только то, что подключено.
if ! grep -qE "include .*sites-enabled/\*" /etc/nginx/nginx.conf; then
  echo "   ВНИМАНИЕ: include не по маске. Строки include:"
  grep -n "sites-enabled" /etc/nginx/nginx.conf | sed 's/^/     /'
  echo "   Допишите include для rodnoygolos.ru вручную и перезапустите скрипт."
  rollback
fi
echo "   маска на месте"

echo "── 5. Проверка и перезагрузка"
nginx -t
systemctl reload nginx

trap - ERR

echo
echo "── Готово. Проверка ответов:"
for host in rodnoygolos.ru rodnyegolosa.ru; do
  title=$(curl -sk -H "Host: $host" https://127.0.0.1/ | grep -o '<title>[^<]*' | head -1 | cut -c8-)
  printf "   %-18s %s\n" "$host" "${title:-пусто}"
done
echo
echo "Ожидаем: rodnoygolos.ru — корпоративный заголовок, rodnyegolosa.ru — «Родные голоса»."
echo "Если нет — откат: cp $B2C.bak-$STAMP $B2C && rm -f $ENABLED/rodnoygolos.ru && nginx -t && systemctl reload nginx"
