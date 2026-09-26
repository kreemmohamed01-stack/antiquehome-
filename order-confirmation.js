/* =========================================================
   ANTIQUE HOME — ORDER CONFIRMATION / RECEIPT
   Reads the order collected by checkout.js from sessionStorage
   and renders the printable receipt. Falls back to a generic
   placeholder order if none is found (e.g. page opened directly).
   ========================================================= */

(function () {
  'use strict';

  function fmt(n) { return 'EGP ' + Math.round(n).toLocaleString('en-US'); }

  function loadOrder() {
    try {
      var raw = sessionStorage.getItem('ah_last_order');
      if (raw) return JSON.parse(raw);
    } catch (err) { /* ignore */ }
    return null;
  }

  var order = loadOrder();

  // fallback demo order so the page never renders empty if visited directly
  if (!order) {
    order = {
      orderNumber: 'AH-00000000',
      orderDate: new Date().toISOString(),
      email: '—', fullName: '—', phone: '—',
      governorate: '', city: '', address: '—',
      delivery: 'Standard Delivery (2–4 Business Days)',
      payment: 'InstaPay',
      notes: '',
      items: [],
      subtotal: 0, shipping: 0, discount: 0, total: 0
    };
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  setText('ocOrderNumber', order.orderNumber);
  setText('ocOrderDate', new Date(order.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));

  setText('ocFullName', order.fullName || '—');
  setText('ocEmail', order.email || '—');
  setText('ocPhone', order.phone || '—');
  setText('ocAddress', order.address || '—');
  var cityGov = [order.city, order.governorate].filter(Boolean).join(', ');
  setText('ocCityGov', cityGov || '—');
  setText('ocDelivery', order.delivery || '—');
  setText('ocPayment', order.payment || '—');

  if (order.notes) {
    setText('ocNotes', order.notes);
    var notesWrap = document.getElementById('ocNotesWrap');
    if (notesWrap) notesWrap.hidden = false;
  }

  var itemsBody = document.getElementById('ocItems');
  if (itemsBody) {
    if (order.items && order.items.length) {
      order.items.forEach(function (item) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td><div class="receipt__itemName">' +
            (item.img ? '<img class="receipt__itemImg" src="' + item.img + '" alt="" />' : '') +
            '<span>' + item.name + (item.meta ? '<span class="receipt__itemMeta">' + item.meta + '</span>' : '') + '</span>' +
          '</div></td>' +
          '<td>' + item.qty + '</td>' +
          '<td>' + fmt(item.price) + '</td>' +
          '<td>' + fmt(item.price * item.qty) + '</td>';
        itemsBody.appendChild(tr);
      });
    } else {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="4" style="text-align:center;color:var(--ink-400);padding:20px 0;">No items found for this order.</td>';
      itemsBody.appendChild(tr);
    }
  }

  setText('ocSubtotal', fmt(order.subtotal));
  setText('ocShipping', order.shipping === 0 ? 'Free' : fmt(order.shipping));
  setText('ocTotal', fmt(order.total));

  if (order.discount && order.discount > 0) {
    setText('ocDiscount', '-' + fmt(order.discount));
    var discRow = document.getElementById('ocDiscountRow');
    if (discRow) discRow.hidden = false;
  }

  /* ---------------------------------------------------------
     print
     --------------------------------------------------------- */

  var printBtn = document.getElementById('ocPrint');
  if (printBtn) {
    printBtn.addEventListener('click', function () {
      window.print();
    });
  }
})();
