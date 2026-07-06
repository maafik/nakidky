<?php
/**
 * Ключи DaData: сначала переменные окружения DADATA_API_KEY / DADATA_SECRET_KEY,
 * иначе значения ниже (при утечке перевыпустите в личном кабинете dadata.ru).
 */
$fromEnvKey = getenv('DADATA_API_KEY');
$fromEnvSecret = getenv('DADATA_SECRET_KEY');
if (is_string($fromEnvKey) && $fromEnvKey !== '') {
  return [
    'api_key' => $fromEnvKey,
    'secret_key' => is_string($fromEnvSecret) ? $fromEnvSecret : '',
  ];
}
return [
  'api_key' => 'da132461d3aaab9884d83c7eacc7bc7b2a25e84e',
  'secret_key' => '6143278d759b8485cab51d4dd4ca62557fe83171',
];
