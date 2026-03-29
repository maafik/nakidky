<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
  exit;
}

if (!function_exists('curl_init')) {
  http_response_code(500);
  echo json_encode(['error' => 'На хостинге не включён модуль PHP curl — включите его в панели или попросите поддержку.'], JSON_UNESCAPED_UNICODE);
  exit;
}

require_once __DIR__ . '/yookassa-config.php';

$raw = file_get_contents('php://input');
$input = is_string($raw) ? json_decode($raw, true) : null;
if (!is_array($input)) {
  $input = $_POST;
}

$amountRub = isset($input['amount_rub']) ? (float) $input['amount_rub'] : 0.0;
$description = isset($input['description']) ? trim((string) $input['description']) : '';
if ($description === '') {
  $description = 'Заказ накидок';
}
if (function_exists('mb_substr')) {
  $description = mb_substr($description, 0, 128);
} else {
  $description = substr($description, 0, 128);
}

$returnUrl = isset($input['return_url']) ? trim((string) $input['return_url']) : '';
if ($returnUrl === '' || !preg_match('#^https://(www\.)?irina-sketch\.ru(/|$)#', $returnUrl)) {
  $returnUrl = 'https://irina-sketch.ru/';
}

if ($amountRub < 1 || $amountRub > 500000) {
  http_response_code(400);
  echo json_encode(['error' => 'Некорректная сумма'], JSON_UNESCAPED_UNICODE);
  exit;
}

if (YOOKASSA_SECRET_KEY === '') {
  http_response_code(500);
  echo json_encode(['error' => 'Платежи не настроены'], JSON_UNESCAPED_UNICODE);
  exit;
}

$value = number_format($amountRub, 2, '.', '');

// ЮKassa рекомендует UUID для Idempotency-Key
$idempotencyKey = sprintf(
  '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
  random_int(0, 0xffff),
  random_int(0, 0xffff),
  random_int(0, 0xffff),
  random_int(0, 0x0fff) | 0x4000,
  random_int(0, 0x3fff) | 0x8000,
  random_int(0, 0xffff),
  random_int(0, 0xffff),
  random_int(0, 0xffff)
);

$payload = [
  'amount' => [
    'value' => $value,
    'currency' => 'RUB',
  ],
  'confirmation' => [
    'type' => 'redirect',
    'return_url' => $returnUrl,
  ],
  'capture' => true,
  'description' => $description,
];

$ch = curl_init('https://api.yookassa.ru/v3/payments');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'Content-Type: application/json',
    'Idempotency-Key: ' . $idempotencyKey,
    'Authorization: Basic ' . base64_encode(YOOKASSA_SHOP_ID . ':' . YOOKASSA_SECRET_KEY),
  ],
  CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 30,
]);

$response = curl_exec($ch);
$errno = curl_errno($ch);
$code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($errno !== 0 || !is_string($response)) {
  http_response_code(502);
  echo json_encode(['error' => 'Сеть недоступна, попробуйте позже'], JSON_UNESCAPED_UNICODE);
  exit;
}

$data = json_decode($response, true);
if (!is_array($data)) {
  http_response_code(502);
  echo json_encode(['error' => 'Некорректный ответ банка'], JSON_UNESCAPED_UNICODE);
  exit;
}

$confirmUrl = $data['confirmation']['confirmation_url'] ?? null;
$ok = ($code === 200 || $code === 201) && is_string($confirmUrl) && $confirmUrl !== '';
if (!$ok) {
  $msg = 'Не удалось создать платёж';
  if (isset($data['description']) && is_string($data['description']) && $data['description'] !== '') {
    $msg = $data['description'];
  } elseif (isset($data['code']) && is_string($data['code'])) {
    $msg = $data['code'];
  }
  http_response_code(502);
  echo json_encode(['error' => $msg, 'http' => $code], JSON_UNESCAPED_UNICODE);
  exit;
}

echo json_encode(['confirmation_url' => $confirmUrl], JSON_UNESCAPED_UNICODE);
