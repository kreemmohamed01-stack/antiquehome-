/* =========================================================
   ANTIQUE HOME — SHOP / CATEGORY LISTING
   Filter, sort, grid/list view, pagination — client-side only,
   works against the .pcard markup rendered in each category page.
   Loaded after script.js (so the shared header/menu/drawer/cart
   wiring in script.js already applies on this page too).
   ========================================================= */

(function () {
  'use strict';

  var grid = document.getElementById('shopGrid');
  if (!grid) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PAGE_SIZE = 8;
  var state = { sort: 'newest', page: 1 };

  var allCards = Array.prototype.slice.call(grid.querySelectorAll('.pcard'));

  /* ---------------------------------------------------------
     sort
     --------------------------------------------------------- */

  function priceOf(card) { return parseFloat(card.getAttribute('data-price')) || 0; }
  function nameOf(card) { return (card.getAttribute('data-name') || '').toLowerCase(); }

  function sortCards(list) {
    var copy = list.slice();
    if (state.sort === 'price-asc') copy.sort(function (a, b) { return priceOf(a) - priceOf(b); });
    else if (state.sort === 'price-desc') copy.sort(function (a, b) { return priceOf(b) - priceOf(a); });
    else if (state.sort === 'name-asc') copy.sort(function (a, b) { return nameOf(a).localeCompare(nameOf(b)); });
    // 'newest' keeps document order (already newest-first in markup)
    return copy;
  }

  /* ---------------------------------------------------------
     render: sort → paginate → show/hide + reorder in the DOM
     --------------------------------------------------------- */

  function render() {
    var sorted = sortCards(allCards);
    var totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;

    var start = (state.page - 1) * PAGE_SIZE;
    var visible = sorted.slice(start, start + PAGE_SIZE);
    var visibleSet = visible.reduce(function (set, el) { set.add(el); return set; }, new Set());

    // reorder into the grid in sorted order, then toggle visibility
    // for the current page only
    visible.forEach(function (card) { grid.appendChild(card); });
    sorted.forEach(function (card) {
      card.classList.toggle('is-hidden', !visibleSet.has(card));
    });
    // cards beyond the sorted set (filtered out) stay appended too,
    // hidden, so filter state survives a sort change
    sorted.forEach(function (card) { grid.appendChild(card); });
    sorted.forEach(function (card) {
      var passesFilter = !card.hasAttribute('data-filtered-out');
      card.classList.toggle('is-hidden', !passesFilter || !visibleSet.has(card));
    });

    renderPager(totalPages);
    var countEl = document.getElementById('shopCount');
    if (countEl) {
      var activeTotal = sorted.filter(function (c) { return !c.hasAttribute('data-filtered-out'); }).length;
      countEl.textContent = activeTotal + (activeTotal === 1 ? ' Product' : ' Products');
    }
  }

  /* ---------------------------------------------------------
     pagination controls
     --------------------------------------------------------- */

  var pager = document.getElementById('shopPager');

  function renderPager(totalPages) {
    if (!pager) return;
    pager.innerHTML = '';
    if (totalPages <= 1) return;

    function makeBtn(label, page, opts) {
      opts = opts || {};
      var b = document.createElement('button');
      b.type = 'button';
      if (opts.html) b.innerHTML = label; else b.textContent = label;
      if (page === state.page) b.classList.add('is-active');
      b.addEventListener('click', function () {
        state.page = page;
        render();
        grid.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      });
      return b;
    }

    var prevSvg = '<svg viewBox="0 0 20 14" aria-hidden="true"><line x1="19" y1="7" x2="2" y2="7"></line><polyline points="7.4,1.6 1.6,7 7.4,12.4"></polyline></svg>';
    var nextSvg = '<svg viewBox="0 0 20 14" aria-hidden="true"><line x1="1" y1="7" x2="18" y2="7"></line><polyline points="12.6,1.6 18.4,7 12.6,12.4"></polyline></svg>';

    var prevBtn = makeBtn(prevSvg, Math.max(1, state.page - 1), { html: true });
    prevBtn.setAttribute('aria-label', 'Previous page');
    if (state.page === 1) prevBtn.disabled = true;
    pager.appendChild(prevBtn);

    for (var p = 1; p <= totalPages; p++) {
      if (totalPages > 6 && p !== 1 && p !== totalPages && Math.abs(p - state.page) > 1) {
        if (p === 2 || p === totalPages - 1) {
          var dots = document.createElement('span');
          dots.className = 'pager__dots';
          dots.textContent = '…';
          pager.appendChild(dots);
        }
        continue;
      }
      pager.appendChild(makeBtn(String(p), p));
    }

    var nextBtn = makeBtn(nextSvg, Math.min(totalPages, state.page + 1), { html: true });
    nextBtn.setAttribute('aria-label', 'Next page');
    if (state.page === totalPages) nextBtn.disabled = true;
    pager.appendChild(nextBtn);
  }

  /* ---------------------------------------------------------
     sort controls — desktop dropdown + mobile sheet share state
     --------------------------------------------------------- */

  var sortLabels = {
    'newest': 'Newest',
    'price-asc': 'Price: Low to High',
    'price-desc': 'Price: High to Low',
    'name-asc': 'Name: A–Z'
  };

  function setSort(value) {
    state.sort = value;
    state.page = 1;
    document.querySelectorAll('[data-sort-value]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-sort-value') === value);
    });
    document.querySelectorAll('.js-sort-label').forEach(function (el) {
      el.textContent = sortLabels[value] || sortLabels.newest;
    });
    render();
  }

  document.querySelectorAll('[data-sort-value]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setSort(btn.getAttribute('data-sort-value'));
      var pop = btn.closest('.sort-pop');
      if (pop) pop.setAttribute('data-open', 'false');
      var sheet = btn.closest('.sheet');
      if (sheet) sheet.setAttribute('data-open', 'false');
    });
  });

  var sortPop = document.getElementById('sortPop');
  var sortToggle = document.getElementById('sortToggle');
  if (sortPop && sortToggle) {
    sortToggle.addEventListener('click', function () {
      var open = sortPop.getAttribute('data-open') !== 'true';
      sortPop.setAttribute('data-open', open ? 'true' : 'false');
      sortToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!sortPop.contains(e.target) && e.target !== sortToggle) {
        sortPop.setAttribute('data-open', 'false');
        sortToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------------------------------------------------------
     view toggle — grid / list (desktop)
     --------------------------------------------------------- */

  document.querySelectorAll('[data-view]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var view = btn.getAttribute('data-view');
      grid.classList.toggle('is-list', view === 'list');
      document.querySelectorAll('[data-view]').forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
      });
    });
  });

  /* ---------------------------------------------------------
     filters — category (single-select), price max, color,
     material, size (multi-select checkboxes)
     --------------------------------------------------------- */

  var activeFilters = { color: null, materials: [], sizes: [], maxPrice: null };

  function sizeOf(card) { return parseFloat(card.getAttribute('data-size')) || 0; }

  function applyFilters() {
    allCards.forEach(function (card) {
      var ok = true;

      if (activeFilters.maxPrice !== null && priceOf(card) > activeFilters.maxPrice) ok = false;

      if (ok && activeFilters.color) {
        var colors = (card.getAttribute('data-color') || '').split(',');
        if (colors.indexOf(activeFilters.color) === -1) ok = false;
      }

      if (ok && activeFilters.materials.length) {
        var mat = (card.getAttribute('data-material') || '').toLowerCase();
        if (activeFilters.materials.indexOf(mat) === -1) ok = false;
      }

      if (ok && activeFilters.sizes.length) {
        var s = sizeOf(card);
        var bucket = s < 20 ? 'small' : (s <= 40 ? 'medium' : 'large');
        if (activeFilters.sizes.indexOf(bucket) === -1) ok = false;
      }

      if (ok) card.removeAttribute('data-filtered-out');
      else card.setAttribute('data-filtered-out', '');
    });
    state.page = 1;
    render();
  }

  function wireFilterGroup(root) {
    if (!root) return;

    var swatches = root.querySelectorAll('.filters__swatch');
    swatches.forEach(function (sw) {
      sw.addEventListener('click', function () {
        var color = sw.getAttribute('data-color');
        var isOn = sw.getAttribute('aria-pressed') === 'true';
        document.querySelectorAll('.filters__swatch').forEach(function (s) { s.setAttribute('aria-pressed', 'false'); });
        activeFilters.color = isOn ? null : color;
        if (!isOn) {
          document.querySelectorAll('.filters__swatch[data-color="' + color + '"]').forEach(function (s) {
            s.setAttribute('aria-pressed', 'true');
          });
        }
        applyFilters();
      });
    });

    var range = root.querySelector('.filters__range');
    if (range) {
      range.addEventListener('input', function () {
        activeFilters.maxPrice = parseFloat(range.value);
        document.querySelectorAll('.filters__range').forEach(function (r) { if (r !== range) r.value = range.value; });
        document.querySelectorAll('.js-price-max').forEach(function (el) {
          el.textContent = 'EGP ' + Number(range.value).toLocaleString('en-US') + (Number(range.value) >= parseFloat(range.max) ? '+' : '');
        });
        applyFilters();
      });
    }

    root.querySelectorAll('input[data-material]').forEach(function (chk) {
      chk.addEventListener('change', function () {
        syncCheckGroup('material', 'data-material', 'materials');
      });
    });
    root.querySelectorAll('input[data-size]').forEach(function (chk) {
      chk.addEventListener('change', function () {
        syncCheckGroup('size', 'data-size', 'sizes');
      });
    });
  }

  function syncCheckGroup(kind, attr, stateKey) {
    var checked = Array.prototype.slice.call(document.querySelectorAll('input[' + attr + ']:checked'))
      .map(function (el) { return el.getAttribute(attr).toLowerCase(); });
    // de-dupe (same control exists in sidebar + mobile sheet)
    activeFilters[stateKey] = checked.filter(function (v, i) { return checked.indexOf(v) === i; });

    // keep sidebar and sheet checkboxes mirrored
    document.querySelectorAll('input[' + attr + ']').forEach(function (el) {
      el.checked = activeFilters[stateKey].indexOf(el.getAttribute(attr).toLowerCase()) !== -1;
    });
    applyFilters();
  }

  wireFilterGroup(document.querySelector('.filters'));
  document.querySelectorAll('.sheet .filters__group').forEach(function (g) { wireFilterGroup(g.closest('.sheet')); });

  document.querySelectorAll('.js-clear-filters').forEach(function (btn) {
    btn.addEventListener('click', function () {
      activeFilters = { color: null, materials: [], sizes: [], maxPrice: null };
      document.querySelectorAll('.filters__swatch').forEach(function (s) { s.setAttribute('aria-pressed', 'false'); });
      document.querySelectorAll('input[data-material], input[data-size]').forEach(function (el) { el.checked = false; });
      document.querySelectorAll('.filters__range').forEach(function (r) { r.value = r.max; });
      document.querySelectorAll('.js-price-max').forEach(function (el) { el.textContent = 'EGP 5,000+'; });
      applyFilters();
    });
  });

  /* ---------------------------------------------------------
     mobile sheets (filter / sort)
     --------------------------------------------------------- */

  function wireSheet(openId, sheetId, closeSelector) {
    var openBtn = document.getElementById(openId);
    var sheet = document.getElementById(sheetId);
    if (!openBtn || !sheet) return;

    function open() { sheet.setAttribute('data-open', 'true'); document.body.style.overflow = 'hidden'; }
    function close() { sheet.setAttribute('data-open', 'false'); document.body.style.overflow = ''; }

    openBtn.addEventListener('click', open);
    sheet.querySelectorAll(closeSelector).forEach(function (el) { el.addEventListener('click', close); });
  }

  wireSheet('filterOpen', 'filterSheet', '.sheet__scrim, .sheet__close, .js-apply-filters');
  wireSheet('sortOpen', 'sortSheet', '.sheet__scrim, .sheet__close');

  /* ---------------------------------------------------------
     category active-state (sidebar / mobile chip list)
     highlights the current page's own category link
     --------------------------------------------------------- */

  var here = document.body.getAttribute('data-category');
  if (here) {
    document.querySelectorAll('.filters__cats li[data-cat]').forEach(function (li) {
      li.classList.toggle('is-active', li.getAttribute('data-cat') === here);
    });
  }

  /* ---------------------------------------------------------
     initial render
     --------------------------------------------------------- */

  render();
})();
