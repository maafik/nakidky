<?php
/**
 * ЮKassa: shop ID и секретный ключ.
 * Секрет лучше задать переменной окружения YOOKASSA_SECRET_KEY на хостинге
 * или положить в yookassa-secret.php (см. .gitignore), не публикуя в открытый репозиторий.
 */
if (!defined('YOOKASSA_SHOP_ID')) {
  define('YOOKASSA_SHOP_ID', getenv('YOOKASSA_SHOP_ID') ?: '1235468');
}

if (!defined('YOOKASSA_SECRET_KEY')) {
  $secret = getenv('YOOKASSA_SECRET_KEY');
  if (($secret === false || $secret === '') && is_readable(__DIR__ . '/yookassa-secret.php')) {
    $loaded = require __DIR__ . '/yookassa-secret.php';
    $secret = is_string($loaded) ? $loaded : '';
  }
  define('YOOKASSA_SECRET_KEY', is_string($secret) ? $secret : '');
}
