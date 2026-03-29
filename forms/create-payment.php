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

$customerEmail = isset($input['customer_email']) ? trim((string) $input['customer_email']) : '';
if ($customerEmail === '' || !filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['error' => 'Укажите корректный email — на него уйдёт чек (54‑ФЗ).'], JSON_UNESCAPED_UNICODE);
  exit;
}

$firstName = isset($input['customer_first_name']) ? trim((string) $input['customer_first_name']) : '';
$lastName = isset($input['customer_last_name']) ? trim((string) $input['customer_last_name']) : '';
$deliveryAddress = isset($input['delivery_address']) ? trim((string) $input['delivery_address']) : '';
$rearSeat = !empty($input['rear_seat']);
$lenFn = function_exists('mb_strlen') ? 'mb_strlen' : 'strlen';
if ($lenFn($firstName) < 2 || $lenFn($lastName) < 2 || $lenFn($deliveryAddress) < 5) {
  http_response_code(400);
  echo json_encode(['error' => 'Укажите имя, фамилию и адрес доставки'], JSON_UNESCAPED_UNICODE);
  exit;
}

if (!is_finite($amountRub) || $amountRub < 1 || $amountRub > 500000) {
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

$vatCode = 1;
if (defined('YOOKASSA_VAT_CODE')) {
  $vatCode = (int) constant('YOOKASSA_VAT_CODE');
}

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
  'metadata' => [
    'customer_first_name' => function_exists('mb_substr') ? mb_substr($firstName, 0, 200) : substr($firstName, 0, 200),
    'customer_last_name' => function_exists('mb_substr') ? mb_substr($lastName, 0, 200) : substr($lastName, 0, 200),
    'delivery_address' => function_exists('mb_substr') ? mb_substr($deliveryAddress, 0, 500) : substr($deliveryAddress, 0, 500),
    'rear_seat' => $rearSeat ? 'yes' : 'no',
  ],
  'receipt' => [
    'customer' => [
      'email' => $customerEmail,
    ],
    'items' => [
      [
        'description' => $description,
        'quantity' => '1.00',
        'amount' => [
          'value' => $value,
          'currency' => 'RUB',
        ],
        'vat_code' => $vatCode,
        'payment_mode' => 'full_payment',
        'payment_subject' => 'commodity',
      ],
    ],
  ],
];

$ch = curl_init('https://api.yookassa.ru/v3/payments');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'Content-Type: application/json',
    // В API ЮKassa именно Idempotence-Key (не Idempotency)
    'Idempotence-Key: ' . $idempotencyKey,
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
  if (isset($data['parameter']) && is_string($data['parameter']) && $data['parameter'] !== '') {
    $msg .= ' (' . $data['parameter'] . ')';
  }
  http_response_code(502);
  echo json_encode(['error' => $msg, 'http' => $code], JSON_UNESCAPED_UNICODE);
  exit;
}

$tgToken = getenv('TELEGRAM_BOT_TOKEN') ?: '';
$tgChat = getenv('TELEGRAM_CHAT_ID') ?: '';
if ($tgToken !== '' && $tgChat !== '') {
  $tgText = "🛒 Новый заказ (платёж создан, клиент переходит к оплате)\n"
    . 'Товар: ' . $description . "\n"
    . 'Сумма: ' . (string) (int) round($amountRub) . " ₽\n"
    . 'Имя: ' . $firstName . "\n"
    . 'Фамилия: ' . $lastName . "\n"
    . 'Email: ' . $customerEmail . "\n"
    . 'Адрес: ' . $deliveryAddress . "\n"
    . 'Задний ряд (+2000 ₽): ' . ($rearSeat ? 'да' : 'нет');
  $tgPayload = json_encode(
    [
      'chat_id' => $tgChat,
      'text' => $tgText,
      'disable_web_page_preview' => true,
    ],
    JSON_UNESCAPED_UNICODE
  );
  if (is_string($tgPayload)) {
    $chTg = curl_init('https://api.telegram.org/bot' . $tgToken . '/sendMessage');
    curl_setopt_array($chTg, [
      CURLOPT_POST => true,
      CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $tgPayload,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => 10,
    ]);
    curl_exec($chTg);
    curl_close($chTg);
  }
}

echo json_encode(['confirmation_url' => $confirmUrl], JSON_UNESCAPED_UNICODE);
