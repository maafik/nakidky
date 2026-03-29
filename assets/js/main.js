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

function openOrder(image, title, price) {
  // сохраняем выбранный товар
  selectedItem = { image, title, price: parseInt(price, 10) };

  // показываем попап
  const popup = document.getElementById('orderPopup');
  popup.style.display = 'flex';

  // подставляем данные
  document.getElementById('popupImage').src = image;
  document.getElementById('popupTitle').innerText = title;

  // сбрасываем чекбокс
  const rearSeatCheckbox = document.getElementById('backSeatCheckbox');
  rearSeatCheckbox.checked = false;
  const policyCheckbox = document.getElementById('policyAgree');
  const returnCheckbox = document.getElementById('returnAgree');
  if (policyCheckbox) policyCheckbox.checked = false;
  if (returnCheckbox) returnCheckbox.checked = false;
  const emailInput = document.getElementById('customerEmail');
  if (emailInput) emailInput.value = '';

  // ставим базовую цену для товара
  totalPrice = selectedItem.price;

  updatePrice();
  updateConsentStatus();

  // закрытие по клику вне окна
  popup.onclick = function (event) {
    if (event.target === popup) {
      closeOrder();
    }
  };
}

function updatePrice() {
  const rearSeatCheckbox = document.getElementById('backSeatCheckbox');
  const addPrice = parseInt(rearSeatCheckbox.dataset.price, 10) || 0;

  totalPrice = selectedItem.price;
  if (rearSeatCheckbox.checked) {
    totalPrice += addPrice;
  }

  document.getElementById('popupPrice').innerText = `Цена: ${totalPrice} ₽`;
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

function updateConsentStatus() {
  const policyCheckbox = document.getElementById('policyAgree');
  const returnCheckbox = document.getElementById('returnAgree');
  const payButton = document.getElementById('payButton');

  if (!payButton) return;
  const checksOk = policyCheckbox && returnCheckbox ? (policyCheckbox.checked && returnCheckbox.checked) : true;
  const isAllowed = checksOk && isValidCustomerEmail();

  payButton.disabled = !isAllowed;
  payButton.classList.toggle('disabled', !isAllowed);
  payButton.setAttribute('aria-disabled', (!isAllowed).toString());
}

async function startPayment() {
  const btn = document.getElementById('payButton');
  if (!btn || btn.disabled) return;

  const origin = window.location.origin;
  const path = window.location.pathname.replace(/\/[^/]+$/, '') || '';
  const base = path === '' ? `${origin}/` : `${origin}${path.endsWith('/') ? path : path + '/'}`;
  const paymentUrl = new URL('forms/create-payment.php', base).href;
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Создаём платёж…';

  try {
    const res = await fetch(paymentUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        amount_rub: totalPrice,
        description: `${selectedItem.title} — ${totalPrice} ₽`,
        return_url: 'https://irina-sketch.ru/',
        customer_email: (document.getElementById('customerEmail') || {}).value.trim()
      })
    });
    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(
        text && text.indexOf('<') === 0
          ? 'Сервер вернул HTML вместо ответа оплаты — проверьте, что PHP включён и файл forms/create-payment.php доступен.'
          : (text.slice(0, 280) || 'Некорректный ответ сервера')
      );
    }
    if (!res.ok || !data.confirmation_url) {
      const hint = data.error || (data.http ? `HTTP ${data.http}` : '');
      throw new Error(hint || `Не удалось перейти к оплате (код ${res.status})`);
    }
    window.location.href = data.confirmation_url;
  } catch (e) {
    alert(e.message || 'Ошибка оплаты');
    btn.textContent = label;
    updateConsentStatus();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const payBtn = document.getElementById('payButton');
  if (payBtn) payBtn.addEventListener('click', startPayment);
});



// Закрытие попапа
function closeOrder(event) {
  document.getElementById('orderPopup').style.display = 'none';
}


  // Обработчик кнопки "Назад" в браузере
  window.onpopstate = function () {
    closeOrder();
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

