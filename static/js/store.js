(() => {
  const grid = document.getElementById('product-grid');
  const summary = document.getElementById('results-summary');
  const liveApiLink = document.getElementById('live-api-link');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const searchInput = document.getElementById('search-input');
  const subcategorySelect = document.getElementById('subcategory-select');
  const orderingSelect = document.getElementById('ordering-select');

  const productModal = document.getElementById('product-modal');
  const modalBody = document.getElementById('modal-body');
  const addModal = document.getElementById('add-modal');
  const addForm = document.getElementById('add-product-form');
  const addFormStatus = document.getElementById('add-form-status');

  const cartDrawer = document.getElementById('cart-drawer');
  const cartItemsEl = document.getElementById('cart-items');
  const cartCountEl = document.getElementById('cart-count');
  const cartTotalEl = document.getElementById('cart-total');

  let activeCategory = '';
  let productsCache = [];
  let cart = [];

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildApiUrl() {
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', activeCategory);
    if (subcategorySelect.value) params.set('subcategory', subcategorySelect.value);
    if (searchInput.value.trim()) params.set('search', searchInput.value.trim());
    if (orderingSelect.value) params.set('ordering', orderingSelect.value);
    const qs = params.toString();
    return qs ? `/api/products/?${qs}` : '/api/products/';
  }

  async function fetchProducts() {
    const url = buildApiUrl();
    liveApiLink.href = url;
    summary.innerHTML = `Fetching from <code>${escapeHtml(url)}</code>...`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      productsCache = data;
      renderProducts(data);
      summary.innerHTML = `Showing <strong>${data.length}</strong> product${data.length === 1 ? '' : 's'} from <code>${escapeHtml(url)}</code>`;
    } catch (err) {
      grid.innerHTML = `<div class="glass-panel" style="padding:24px;grid-column:1/-1;">Unable to load products (${escapeHtml(err.message)}).</div>`;
    }
  }

  function renderProducts(products) {
    if (!products.length) {
      grid.innerHTML = `<div class="glass-panel" style="padding:28px;grid-column:1/-1;text-align:center;">No instruments or music sheets matched your filter.</div>`;
      return;
    }

    grid.innerHTML = products
      .map((p) => {
        const thumb = p.image_url || `/static/images/products/${p.subcategory}.svg`;
        return `
          <article class="product-card glass-panel">
            <div class="card-thumb-wrap">
              <img class="card-thumb" src="${escapeHtml(thumb)}" alt="${escapeHtml(p.name)}" loading="lazy">
              ${p.is_featured ? '<span class="badge-featured">Popular</span>' : ''}
            </div>
            <div class="card-meta">
              <span>${escapeHtml(p.subcategory_display)}</span>
              <span>${escapeHtml(p.skill_level || 'All Levels')}</span>
            </div>
            <h3 class="card-title">${escapeHtml(p.name)}</h3>
            <div class="card-brand">${escapeHtml(p.brand_or_composer)} • Stock: ${p.stock}</div>
            <p class="card-desc">${escapeHtml(p.description)}</p>
            <div class="card-footer">
              <span class="card-price">${escapeHtml(p.formatted_price)}</span>
              <div class="card-actions">
                <button class="btn btn-glass btn-sm" type="button" data-view-id="${p.id}">View</button>
                <button class="btn btn-cyan btn-sm" type="button" data-add-id="${p.id}">+ Cart</button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  }

  function openQuickView(productId) {
    const p = productsCache.find((item) => item.id === productId);
    if (!p) return;
    const thumb = p.image_url || `/static/images/products/${p.subcategory}.svg`;
    modalBody.innerHTML = `
      <div class="card-thumb-wrap" style="margin-bottom:16px;">
        <img class="card-thumb" style="height:200px;" src="${escapeHtml(thumb)}" alt="${escapeHtml(p.name)}">
      </div>
      <div class="card-meta">
        <span>${escapeHtml(p.category_display)} • ${escapeHtml(p.subcategory_display)}</span>
        <span>${escapeHtml(p.skill_level)}</span>
      </div>
      <h2 id="modal-title" style="margin-bottom:6px;">${escapeHtml(p.name)}</h2>
      <p class="card-brand" style="margin-bottom:12px;">By ${escapeHtml(p.brand_or_composer)} • ${p.stock} in stock</p>
      <p style="color:var(--text-muted);margin-bottom:20px;">${escapeHtml(p.description)}</p>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
        <strong style="font-size:1.35rem;color:var(--cyan);">${escapeHtml(p.formatted_price)}</strong>
        <div style="display:flex;gap:10px;">
          <a href="/api/products/${p.id}/" target="_blank" rel="noopener" class="btn btn-glass btn-sm">API Detail</a>
          <button class="btn btn-cyan btn-sm" type="button" id="modal-add-cart">Add to Cart</button>
        </div>
      </div>
    `;
    document.getElementById('modal-add-cart').addEventListener('click', () => {
      addToCart(p.id);
      productModal.classList.add('hidden');
    });
    productModal.classList.remove('hidden');
  }

  function addToCart(productId) {
    const product = productsCache.find((p) => p.id === productId);
    if (!product) return;
    const existing = cart.find((item) => item.id === productId);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id: product.id, name: product.name, price: Number(product.price), qty: 1 });
    }
    renderCart();
  }

  function renderCart() {
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    cartCountEl.textContent = totalCount;
    cartTotalEl.textContent = `₱${totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (!cart.length) {
      cartItemsEl.innerHTML = `<p style="color:var(--text-dim);text-align:center;margin-top:24px;">Your cart is empty.</p>`;
      return;
    }

    cartItemsEl.innerHTML = cart
      .map(
        (item) => `
        <div class="cart-item glass-sub">
          <div class="cart-item-info">
            <h4>${escapeHtml(item.name)}</h4>
            <span>₱${(item.price * item.qty).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="cart-item-qty">
            <button class="qty-btn" type="button" data-qty-delta="-1" data-cart-id="${item.id}">-</button>
            <span>${item.qty}</span>
            <button class="qty-btn" type="button" data-qty-delta="1" data-cart-id="${item.id}">+</button>
          </div>
        </div>
      `
      )
      .join('');
  }

  // Event Listeners
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.category;
      fetchProducts();
    });
  });

  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(fetchProducts, 220);
  });
  subcategorySelect.addEventListener('change', fetchProducts);
  orderingSelect.addEventListener('change', fetchProducts);

  grid.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('[data-view-id]');
    if (viewBtn) return openQuickView(Number(viewBtn.dataset.viewId));

    const addBtn = e.target.closest('[data-add-id]');
    if (addBtn) {
      addToCart(Number(addBtn.dataset.addId));
      cartDrawer.classList.remove('hidden');
    }
  });

  cartItemsEl.addEventListener('click', (e) => {
    const qtyBtn = e.target.closest('[data-qty-delta]');
    if (!qtyBtn) return;
    const id = Number(qtyBtn.dataset.cartId);
    const delta = Number(qtyBtn.dataset.qtyDelta);
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter((i) => i.id !== id);
    renderCart();
  });

  function getCookie(name) {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : '';
  }

  document.getElementById('close-product-modal').addEventListener('click', () => productModal.classList.add('hidden'));
  const openAddModalBtn = document.getElementById('open-add-modal-btn');
  if (openAddModalBtn) {
    openAddModalBtn.addEventListener('click', () => addModal.classList.remove('hidden'));
  }
  document.getElementById('close-add-modal').addEventListener('click', () => addModal.classList.add('hidden'));
  document.getElementById('cart-toggle-btn').addEventListener('click', () => cartDrawer.classList.toggle('hidden'));
  document.getElementById('close-cart-btn').addEventListener('click', () => cartDrawer.classList.add('hidden'));
  document.getElementById('checkout-btn').addEventListener('click', () => {
    if (!cart.length) return;
    alert('Thank you for testing shiked6 music store!');
    cart = [];
    renderCart();
    cartDrawer.classList.add('hidden');
  });

  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(addForm);
      const payload = Object.fromEntries(formData.entries());
      payload.stock = Number(payload.stock);
      payload.image_url = `/static/images/products/${payload.subcategory}.svg`;

      addFormStatus.textContent = 'Saving to DRF API...';
      try {
        const res = await fetch('/api/products/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(JSON.stringify(errData));
        }
        addForm.reset();
        addFormStatus.textContent = 'Created! Refreshing catalog...';
        await fetchProducts();
        setTimeout(() => {
          addFormStatus.textContent = '';
          addModal.classList.add('hidden');
        }, 600);
      } catch (err) {
        addFormStatus.textContent = `Error: ${err.message}`;
      }
    });
  }

  // Initial load
  renderCart();
  fetchProducts();
})();
