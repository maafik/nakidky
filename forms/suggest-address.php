<?php
/**
 * Подсказки адресов по России (DaData) — PHP для хостинга с PHP.
 */
require_once __DIR__ . '/dadata-config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
  exit;
}

$apiKey = DADATA_API_KEY;
if ($apiKey === '') {
  http_response_code(500);
  echo json_encode(['error' => 'DADATA_API_KEY не задан на хостинге'], JSON_UNESCAPED_UNICODE);
  exit;
}

$q = isset($_GET['q']) ? trim((string) $_GET['q']) : '';
if (mb_strlen($q) < 2) {
  echo json_encode(['suggestions' => []], JSON_UNESCAPED_UNICODE);
  exit;
}

$payload = json_encode([
  'query' => $q,
  'count' => 10,
  'locations' => [['country_iso_code' => 'RU']],
], JSON_UNESCAPED_UNICODE);

$ch = curl_init('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'Content-Type: application/json',
    'Accept: application/json',
    'Authorization: Token ' . $apiKey,
  ],
  CURLOPT_POSTFIELDS => $payload,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 20,
]);

$response = curl_exec($ch);
$code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if (!is_string($response) || $code < 200 || $code >= 300) {
  http_response_code(502);
  echo json_encode(['error' => 'Ошибка сервиса подсказок адресов'], JSON_UNESCAPED_UNICODE);
  exit;
}

$data = json_decode($response, true);
$suggestions = [];
if (is_array($data) && !empty($data['suggestions']) && is_array($data['suggestions'])) {
  foreach ($data['suggestions'] as $item) {
    if (!is_array($item)) continue;
    $value = trim((string) ($item['value'] ?? $item['unrestricted_value'] ?? ''));
    if ($value === '') continue;
    $postal = '';
    if (!empty($item['data']) && is_array($item['data']) && !empty($item['data']['postal_code'])) {
      $postal = (string) $item['data']['postal_code'];
    }
    $flat = '';
    if (!empty($item['data']) && is_array($item['data']) && !empty($item['data']['flat'])) {
      $flat = trim((string) $item['data']['flat']);
    }
    $hasFlat = $flat !== '' || (bool) preg_match(
      '/(?:^|[,\s])(?:кв\.?|квартира|кварт\.?|оф\.?|офис|пом\.?|помещ\.?|apt\.?)\s*[0-9]+/iu',
      $value
    );
    $suggestions[] = [
      'value' => $value,
      'postal_code' => $postal,
      'has_flat' => $hasFlat,
    ];
  }
}

echo json_encode(['suggestions' => $suggestions], JSON_UNESCAPED_UNICODE);
