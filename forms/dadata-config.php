<?php
/**
 * DaData: API-ключ и секрет для подсказок адресов.
 */
if (!defined('DADATA_API_KEY')) {
  $apiKey = getenv('DADATA_API_KEY');
  $secretKey = getenv('DADATA_SECRET_KEY');
  if (($apiKey === false || $apiKey === '') && is_readable(__DIR__ . '/dadata-secret.php')) {
    $loaded = require __DIR__ . '/dadata-secret.php';
    if (is_array($loaded)) {
      $apiKey = $loaded['api_key'] ?? '';
      $secretKey = $loaded['secret_key'] ?? '';
    }
  }
  define('DADATA_API_KEY', is_string($apiKey) ? $apiKey : '');
  define('DADATA_SECRET_KEY', is_string($secretKey) ? $secretKey : '');
}
