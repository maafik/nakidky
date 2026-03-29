/**
* Template Name: PhotoFolio
* Template URL: https://bootstrapmade.com/photofolio-bootstrap-photography-website-template/
* Updated: Aug 07 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  if (mobileNavToggleBtn) {
    mobileNavToggleBtn.addEventListener('click', mobileNavToogle);
  }

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader (короткая задержка — быстрее показ контента)
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.classList.add('loaded');
      setTimeout(() => preloader.remove(), 320);
    });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  if (scrollTop) {
    scrollTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
    window.addEventListener('load', toggleScrollTop);
    document.addEventListener('scroll', toggleScrollTop);
  }

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  /**
   * Initiate glightbox (только если есть элементы — меньше работы на главной)
   */
  if (typeof GLightbox !== 'undefined' && document.querySelector('.glightbox')) {
    GLightbox({ selector: '.glightbox' });
  }

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      const cfgEl = swiperElement.querySelector(".swiper-config");
      if (!cfgEl || typeof Swiper === 'undefined') return;
      let config = JSON.parse(cfgEl.innerHTML.trim());

      if (swiperElement.classList.contains("swiper-tab") && typeof initSwiperWithCustomPagination === 'function') {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

})();

let selectedItem = {};
let totalPrice = 0;

/** Клик по карточке: сначала попап с превью товара */
function openOrder(image, title, price) {
  selectedItem = { image, title, price: parseInt(price, 10) };
  totalPrice = selectedItem.price;

  document.getElementById('popupPreviewImage').src = image;
  document.getElementById('popupPreviewTitle').innerText = title;

  document.getElementById('orderPopup').style.display = 'none';

  const rearSeatCheckbox = document.getElementById('backSeatCheckbox');
  if (rearSeatCheckbox) rearSeatCheckbox.checked = false;
  const policyCheckbox = document.getElementById('policyAgree');
  const returnCheckbox = document.getElementById('returnAgree');
  if (policyCheckbox) policyCheckbox.checked = false;
  if (returnCheckbox) returnCheckbox.checked = false;
  const emailInput = document.getElementById('customerEmail');
  if (emailInput) emailInput.value = '';
  updatePrice();
  updateConsentStatus();

  const preview = document.getElementById('orderPopupPreview');
  preview.style.display = 'flex';
  preview.onclick = function (event) {
    if (event.target === preview) {
      closeOrderPreview();
    }
  };
}

function closeOrderPreview(event) {
  if (event) event.stopPropagation();
  const p = document.getElementById('orderPopupPreview');
  if (p) p.style.display = 'none';
}

/** Из превью — ко второму попапу с формой и оплатой */
function proceedToCheckoutForm(event) {
  if (event) event.stopPropagation();
  const policyCheckbox = document.getElementById('policyAgree');
  const returnCheckbox = document.getElementById('returnAgree');
  const checksOk = policyCheckbox && returnCheckbox ? (policyCheckbox.checked && returnCheckbox.checked) : true;
  if (!checksOk) {
    alert('Отметьте согласие с политикой конфиденциальности и условиями возврата.');
    return;
  }
  if (!isValidCustomerEmail()) {
    alert('Укажите корректный email для чека (54‑ФЗ).');
    return;
  }
  closeOrderPreview();
  openOrderForm();
}

function openOrderForm() {
  const popup = document.getElementById('orderPopup');
  popup.style.display = 'flex';

  document.getElementById('popupImage').src = selectedItem.image;
  document.getElementById('popupTitle').innerText = selectedItem.title;

  const fn = document.getElementById('customerFirstName');
  const ln = document.getElementById('customerLastName');
  const addr = document.getElementById('deliveryAddress');
  if (fn) fn.value = '';
  if (ln) ln.value = '';
  if (addr) addr.value = '';

  updatePrice();
  updateConsentStatus();

  popup.onclick = function (event) {
    if (event.target === popup) {
      backToProductPreview();
    }
  };
}

/** Из формы — назад к превью товара */
function backToProductPreview(event) {
  if (event) event.stopPropagation();
  document.getElementById('orderPopup').style.display = 'none';
  resetPayButtonIfLoading();

  document.getElementById('popupPreviewImage').src = selectedItem.image;
  document.getElementById('popupPreviewTitle').innerText = selectedItem.title;
  updatePrice();

  const preview = document.getElementById('orderPopupPreview');
  preview.style.display = 'flex';
  preview.onclick = function (ev) {
    if (ev.target === preview) {
      closeOrderPreview();
    }
  };
}

function updatePrice() {
  const rearSeatCheckbox = document.getElementById('backSeatCheckbox');
  if (!rearSeatCheckbox || !selectedItem || !Number.isFinite(selectedItem.price)) return;

  const addPrice = parseInt(rearSeatCheckbox.dataset.price, 10) || 0;

  totalPrice = selectedItem.price;
  if (rearSeatCheckbox.checked) {
    totalPrice += addPrice;
  }

  const priceText = `Цена: ${totalPrice} ₽`;
  const popupPriceEl = document.getElementById('popupPrice');
  const previewPriceEl = document.getElementById('popupPreviewPrice');
  if (popupPriceEl) popupPriceEl.innerText = priceText;
  if (previewPriceEl) previewPriceEl.innerText = priceText;
  updateConsentStatus();
}

function openPolicyPopup(event) {
  if (event) event.preventDefault();
  const popup = document.getElementById('policyPopup');
  if (popup) {
    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closePolicyPopup(event) {
  if (event && event.target !== event.currentTarget) return;
  const popup = document.getElementById('policyPopup');
  if (popup) {
    popup.style.display = 'none';
    document.body.style.overflow = '';
  }
}

function isValidCustomerEmail() {
  const el = document.getElementById('customerEmail');
  if (!el) return false;
  const v = el.value.trim();
  if (v === '') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isValidOrderDeliveryFields() {
  const f = document.getElementById('customerFirstName');
  const l = document.getElementById('customerLastName');
  const a = document.getElementById('deliveryAddress');
  if (!f || !l || !a) return false;
  const first = f.value.trim();
  const last = l.value.trim();
  const addr = a.value.trim();
  return first.length >= 2 && last.length >= 2 && addr.length >= 5;
}

const PAY_BUTTON_LABEL = 'Оплатить';

function resetPayButtonIfLoading() {
  const btn = document.getElementById('payButton');
  if (!btn) return;
  if (btn.textContent === 'Создаём платёж…') {
    btn.textContent = PAY_BUTTON_LABEL;
    updateConsentStatus();
  }
}

function updateConsentStatus() {
  const policyCheckbox = document.getElementById('policyAgree');
  const returnCheckbox = document.getElementById('returnAgree');
  const payButton = document.getElementById('payButton');

  if (!payButton) return;
  const checksOk = policyCheckbox && returnCheckbox ? (policyCheckbox.checked && returnCheckbox.checked) : true;
  const isAllowed = checksOk && isValidCustomerEmail() && isValidOrderDeliveryFields();

  payButton.disabled = !isAllowed;
  payButton.classList.toggle('disabled', !isAllowed);
  payButton.setAttribute('aria-disabled', (!isAllowed).toString());
}

function getPaymentEndpoints() {
  const custom =
    typeof window.PAYMENT_API_BASE === 'string' ? window.PAYMENT_API_BASE.trim().replace(/\/$/, '') : '';
  if (custom) {
    return [new URL('/api/create-payment', custom + '/').href];
  }
  const origin = window.location.origin;
  return [
    new URL('/api/create-payment', origin + '/').href,
    new URL('/create-payment.php', origin + '/').href,
    new URL('/forms/create-payment.php', origin + '/').href
  ];
}

async function startPayment() {
  const btn = document.getElementById('payButton');
  if (!btn || btn.disabled) return;

  const amount = Number(totalPrice);
  if (!Number.isFinite(amount) || amount < 1) {
    alert('Некорректная сумма заказа. Закройте окно и откройте товар заново.');
    return;
  }

  const firstName = (document.getElementById('customerFirstName') || {}).value.trim();
  const lastName = (document.getElementById('customerLastName') || {}).value.trim();
  const deliveryAddress = (document.getElementById('deliveryAddress') || {}).value.trim();
  if (!isValidOrderDeliveryFields()) {
    alert('Заполните имя, фамилию и адрес доставки.');
    return;
  }

  const body = JSON.stringify({
    amount_rub: amount,
    description: `${selectedItem.title} — ${amount} ₽`,
    return_url: 'https://irina-sketch.ru/',
    customer_email: (document.getElementById('customerEmail') || {}).value.trim(),
    customer_first_name: firstName,
    customer_last_name: lastName,
    delivery_address: deliveryAddress,
    rear_seat: !!(document.getElementById('backSeatCheckbox') || {}).checked
  });

  const endpoints = getPaymentEndpoints();

  const label = PAY_BUTTON_LABEL;
  btn.disabled = true;
  btn.textContent = 'Создаём платёж…';

  try {
    let lastHtmlUrl = '';
    for (const paymentUrl of endpoints) {
      const res = await fetch(paymentUrl, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: body
      });
      const text = await res.text();
      const trimmed = text ? text.trim() : '';

      if (trimmed.startsWith('<')) {
        lastHtmlUrl = paymentUrl;
        continue;
      }

      let data = {};
      try {
        data = trimmed ? JSON.parse(trimmed) : {};
      } catch {
        throw new Error(trimmed.slice(0, 280) || 'Некорректный ответ сервера');
      }

      if (res.ok && data.confirmation_url) {
        window.location.href = data.confirmation_url;
        return;
      }

      const hint = data.error || (data.http ? `HTTP ${data.http}` : '');
      throw new Error(hint || `Не удалось перейти к оплате (код ${res.status})`);
    }

    throw new Error(
      'Сайт отдаёт HTML вместо API оплаты (PHP не выполняется или всё уходит в index.html). ' +
        'Варианты: 1) включить PHP на хостинге и залить create-payment.php; ' +
        '2) задеплоить проект на Vercel (файл api/create-payment.js), добавить в Vercel переменные YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY, ' +
        'в index.html задать window.PAYMENT_API_BASE = "https://ваш-проект.vercel.app". ' +
        (lastHtmlUrl ? 'Последний запрос: ' + lastHtmlUrl : '')
    );
  } catch (e) {
    alert(e.message || 'Ошибка оплаты');
    btn.textContent = label;
    updateConsentStatus();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const payBtn = document.getElementById('payButton');
  if (payBtn) payBtn.addEventListener('click', startPayment);
  updateConsentStatus();
});

// Возврат с ЮKassa кнопкой «Назад»: страница из bfcache — текст «Создаём платёж…» оставался
window.addEventListener('pageshow', function () {
  resetPayButtonIfLoading();
});
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') {
    resetPayButtonIfLoading();
  }
});



// Крестик / клик вне формы — назад к превью товара
function closeOrder(event) {
  backToProductPreview(event);
}

  // Обработчик кнопки "Назад" в браузере — закрыть оба попапа
  window.onpopstate = function () {
    const form = document.getElementById('orderPopup');
    const preview = document.getElementById('orderPopupPreview');
    if (form) form.style.display = 'none';
    if (preview) preview.style.display = 'none';
    resetPayButtonIfLoading();
  };

  // Для поддержки кнопки "Назад", добавляем историю в стэк
  function handleHistory() {
    window.history.pushState({}, '');
  }

  // Вызовите эту функцию при открытии попапа
  window.addEventListener('load', handleHistory);

  function toggleItems(type) {
    const frontItems = document.getElementById('frontItems');
    const backItems = document.getElementById('backItems');
    const frontBtn = document.getElementById('frontBtn');
    const backBtn = document.getElementById('backBtn');
    if (!frontItems || !backItems) return;

    if (type === 'front') {
      frontItems.style.display = 'flex';
      backItems.style.display = 'none';
      if (frontBtn) frontBtn.classList.add('active');
      if (backBtn) backBtn.classList.remove('active');
    } else {
      backItems.style.display = 'flex';
      frontItems.style.display = 'none';
      if (backBtn) backBtn.classList.add('active');
      if (frontBtn) frontBtn.classList.remove('active');
    }
  }
  const reviewsWrapper = document.querySelector('.reviews-wrapper');
let isMouseDown = false;
let startX, scrollLeft;

if (reviewsWrapper) reviewsWrapper.addEventListener('mousedown', (e) => {
  isMouseDown = true;
  startX = e.pageX - reviewsWrapper.offsetLeft;
  scrollLeft = reviewsWrapper.scrollLeft;
  reviewsWrapper.style.cursor = 'grabbing';
});

if (reviewsWrapper) reviewsWrapper.addEventListener('mouseleave', () => {
  isMouseDown = false;
  reviewsWrapper.style.cursor = 'grab';
});

if (reviewsWrapper) reviewsWrapper.addEventListener('mouseup', () => {
  isMouseDown = false;
  reviewsWrapper.style.cursor = 'grab';
});

if (reviewsWrapper) reviewsWrapper.addEventListener('mousemove', (e) => {
  if (!isMouseDown) return;
  const x = e.pageX - reviewsWrapper.offsetLeft;
  const walk = (x - startX) * 3; // Скорость прокрутки
  reviewsWrapper.scrollLeft = scrollLeft - walk;
});

if (reviewsWrapper) reviewsWrapper.addEventListener('wheel', (e) => {
  e.preventDefault();
  reviewsWrapper.scrollLeft += e.deltaY; // Прокрутка мышью
});

