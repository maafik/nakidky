<?php
/**
 * Секрет ЮKassa: сначала переменная окружения YOOKASSA_SECRET_KEY (предпочтительно на хостинге),
 * иначе значение ниже (при утечке ключа перевыпустите в личном кабинете ЮKassa).
 */
$fromEnv = getenv('YOOKASSA_SECRET_KEY');
if (is_string($fromEnv) && $fromEnv !== '') {
  return $fromEnv;
}
return 'live_vLWWa0BaRiEUVQCdZzJMHCSGcuhFt6oziZstn3dCXYA';
