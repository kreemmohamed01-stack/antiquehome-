/* =========================================================
   ANTIQUE HOME — CHECKOUT PAGE
   Delivery/payment selection, live order summary totals,
   promo code, terms gate on submit.
   ========================================================= */

(function () {
  'use strict';

  var SHIPPING_STANDARD = 100;
  var SHIPPING_PICKUP = 0;

  var itemsList = document.getElementById('chkItems');
  var subtotalEl = document.getElementById('chkSubtotal');
  var shippingEl = document.getElementById('chkShipping');
  var totalEl = document.getElementById('chkTotal');
  var submitTotalEl = document.getElementById('chkSubmitTotal');

  var currentShipping = SHIPPING_STANDARD;
  var discount = 0;

  function fmt(n) { return 'EGP ' + Math.round(n).toLocaleString('en-US'); }

  function recalc() {
    if (!itemsList) return;
    var subtotal = 0;
    itemsList.querySelectorAll('.chk__item').forEach(function (li) {
      var price = parseFloat(li.getAttribute('data-price')) || 0;
      var qty = parseInt(li.getAttribute('data-qty'), 10) || 1;
      subtotal += price * qty;
      var priceEl = li.querySelector('.chk__itemPrice b');
      if (priceEl) priceEl.textContent = Math.round(price * qty).toLocaleString('en-US');
    });

    var total = Math.max(0, subtotal - discount) + currentShipping;

    if (subtotalEl) subtotalEl.textContent = fmt(subtotal);
    if (shippingEl) shippingEl.textContent = currentShipping === 0 ? 'Free' : fmt(currentShipping);
    if (totalEl) totalEl.textContent = fmt(total);
    if (submitTotalEl) submitTotalEl.textContent = fmt(total);
  }

  /* ---------------------------------------------------------
     item quantity + remove
     --------------------------------------------------------- */

  if (itemsList) {
    itemsList.addEventListener('click', function (e) {
      var stepBtn = e.target.closest('.qty__btn');
      if (stepBtn) {
        var li = stepBtn.closest('.chk__item');
        var numEl = li.querySelector('.qty__num');
        var qty = parseInt(li.getAttribute('data-qty'), 10) || 1;
        var step = parseInt(stepBtn.getAttribute('data-step'), 10) || 0;
        qty = Math.max(1, qty + step);
        li.setAttribute('data-qty', String(qty));
        if (numEl) numEl.textContent = String(qty);
        recalc();
        return;
      }
      var removeBtn = e.target.closest('.chk__itemRemove');
      if (removeBtn) {
        var item = removeBtn.closest('.chk__item');
        if (item) {
          item.style.opacity = '0';
          setTimeout(function () {
            item.remove();
            recalc();
          }, 150);
        }
      }
    });
  }

  /* ---------------------------------------------------------
     delivery option -> shipping cost
     --------------------------------------------------------- */

  document.querySelectorAll('input[name="delivery"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      document.querySelectorAll('input[name="delivery"]').forEach(function (r) {
        r.closest('.chk__radioCard').classList.toggle('is-active', r.checked);
      });
      currentShipping = radio.value === 'pickup' ? SHIPPING_PICKUP : SHIPPING_STANDARD;
      recalc();
    });
  });

  /* ---------------------------------------------------------
     payment method -> show matching panel
     --------------------------------------------------------- */

  var panels = {
    instapay: document.getElementById('payInstapay'),
    cod: document.getElementById('payCod'),
    card: document.getElementById('payCard')
  };

  function showPanel(value) {
    Object.keys(panels).forEach(function (key) {
      var el = panels[key];
      if (el) el.hidden = key !== value;
    });
  }

  document.querySelectorAll('input[name="payment"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      document.querySelectorAll('input[name="payment"]').forEach(function (r) {
        r.closest('.chk__payCard').classList.toggle('is-active', r.checked);
      });
      showPanel(radio.value);
    });
  });

  /* ---------------------------------------------------------
     promo code
     --------------------------------------------------------- */

  var promoForm = document.getElementById('chkPromoForm');
  var promoInput = document.getElementById('chkPromoInput');
  var promoNote = document.getElementById('chkPromoNote');

  if (promoForm) {
    promoForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var code = (promoInput && promoInput.value || '').trim().toUpperCase();
      if (!code) return;
      if (code === 'WELCOME10') {
        discount = 0; // percentage handled below for clarity of message only
        if (promoNote) { promoNote.textContent = 'Code applied — 10% off your order.'; promoNote.style.color = ''; }
      } else {
        if (promoNote) { promoNote.textContent = 'This code is not valid.'; promoNote.style.color = '#a33'; }
      }
      recalc();
    });
  }

  /* ---------------------------------------------------------
     terms gate + place order
     --------------------------------------------------------- */

  var agree = document.getElementById('chkAgree');
  var placeOrder = document.getElementById('chkPlaceOrder');

  function collectOrder() {
    var items = [];
    if (itemsList) {
      itemsList.querySelectorAll('.chk__item').forEach(function (li) {
        var price = parseFloat(li.getAttribute('data-price')) || 0;
        var qty = parseInt(li.getAttribute('data-qty'), 10) || 1;
        var name = (li.querySelector('.chk__itemTop h3') || {}).textContent || '';
        var meta = (li.querySelector('.chk__itemTop p') || {}).textContent || '';
        var img = (li.querySelector('.chk__itemMedia img') || {}).getAttribute('src') || '';
        items.push({ name: name, meta: meta, img: img, price: price, qty: qty });
      });
    }

    var subtotal = items.reduce(function (sum, it) { return sum + it.price * it.qty; }, 0);
    var total = Math.max(0, subtotal - discount) + currentShipping;

    var paymentRadio = document.querySelector('input[name="payment"]:checked');
    var paymentLabels = { instapay: 'InstaPay', cod: 'Cash on Delivery', card: 'Debit Card' };
    var deliveryRadio = document.querySelector('input[name="delivery"]:checked');
    var deliveryLabels = { standard: 'Standard Delivery (2–4 Business Days)', pickup: 'Store Pickup' };

    var fields = document.querySelectorAll('.chk__col--left .chk__field input, .chk__col--left .chk__field select');
    var email = fields[0] ? fields[0].value : '';
    var fullName = fields[1] ? fields[1].value : '';
    var phone = fields[2] ? fields[2].value : '';
    var governorate = fields[3] ? fields[3].value : '';
    var city = fields[4] ? fields[4].value : '';
    var address = fields[5] ? fields[5].value : '';
    var notesEl = document.querySelector('.chk__field--textarea textarea');

    var orderNumber = 'AH-' + Date.now().toString().slice(-8);
    var orderDate = new Date().toISOString();

    return {
      orderNumber: orderNumber,
      orderDate: orderDate,
      email: email, fullName: fullName, phone: phone,
      governorate: governorate, city: city, address: address,
      delivery: deliveryLabels[deliveryRadio ? deliveryRadio.value : 'standard'],
      payment: paymentLabels[paymentRadio ? paymentRadio.value : 'instapay'],
      notes: notesEl ? notesEl.value : '',
      items: items,
      subtotal: subtotal,
      shipping: currentShipping,
      discount: discount,
      total: total
    };
  }

  if (placeOrder) {
    placeOrder.addEventListener('click', function () {
      if (agree && !agree.checked) {
        agree.closest('.chk__agree').style.color = '#a33';
        agree.focus();
        return;
      }
      placeOrder.disabled = true;
      placeOrder.querySelector('span').textContent = 'Placing your order…';

      var order = collectOrder();
      try {
        sessionStorage.setItem('ah_last_order', JSON.stringify(order));
      } catch (err) { /* storage unavailable — confirmation page will show generic state */ }

      setTimeout(function () {
        window.location.href = 'order-confirmation.html';
      }, 900);
    });
  }

  recalc();
})();
