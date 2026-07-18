const PANEL_TITLES = {
  overview: "Overview",
  products: "Products",
  orders: "Orders",
  settings: "Settings",
};

document.addEventListener("DOMContentLoaded", () => {
  if (!requireAuth()) return;

  initSidebar();
  initNavigation();
  initProductModal();
  initOrderModal();
  initSettings();
  renderAll();

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    logout();
    window.location.href = "login.html";
  });

  const session = JSON.parse(sessionStorage.getItem("diyla-admin-session"));
  const userEl = document.getElementById("admin-user");
  if (userEl && session) userEl.textContent = session.email;
});

function initSidebar() {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("sidebar-toggle");
  const scrim = document.getElementById("sidebar-scrim");
  const closeSidebar = () => {
    sidebar?.classList.remove("open");
    scrim?.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
  };

  toggle?.addEventListener("click", () => {
    const isOpen = sidebar?.classList.toggle("open");
    scrim?.classList.toggle("open", Boolean(isOpen));
    toggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
  });
  scrim?.addEventListener("click", closeSidebar);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSidebar();
  });
}

function initNavigation() {
  document.querySelectorAll(".admin-nav a[data-panel]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      switchPanel(link.dataset.panel);
      document.getElementById("sidebar")?.classList.remove("open");
      document.getElementById("sidebar-scrim")?.classList.remove("open");
      document.getElementById("sidebar-toggle")?.setAttribute("aria-expanded", "false");
    });
  });

  document.querySelectorAll("[data-goto]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      switchPanel(el.dataset.goto);
    });
  });
}

function switchPanel(panel) {
  document.querySelectorAll(".admin-panel").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".admin-nav a").forEach((a) => a.classList.remove("active"));

  document.getElementById(`panel-${panel}`)?.classList.add("active");
  document.querySelector(`.admin-nav a[data-panel="${panel}"]`)?.classList.add("active");
  document.getElementById("page-title").textContent = PANEL_TITLES[panel] || panel;
}

function renderAll() {
  renderStats();
  renderRecentOrders();
  renderCategoryBreakdown();
  renderProductsTable();
  renderOrdersTable();
}

function renderStats() {
  const products = getProducts();
  const orders = getOrders();
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const pending = orders.filter((o) => o.status === "pending").length;

  document.getElementById("stats-grid").innerHTML = `
    <div class="stat-card accent">
      <div class="stat-card-label">Total Revenue</div>
      <div class="stat-card-value">${formatPrice(revenue)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-label">Total Orders</div>
      <div class="stat-card-value">${orders.length}</div>
      <div class="stat-card-change">${pending} pending</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-label">Products</div>
      <div class="stat-card-value">${products.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-label">Categories</div>
      <div class="stat-card-value">3</div>
      <div class="stat-card-change">Furniture, Decor, Kitchen</div>
    </div>
  `;
}

function renderRecentOrders() {
  const container = document.getElementById("recent-orders");
  const orders = getOrders().slice(0, 5);

  if (!orders.length) {
    container.innerHTML = `<div class="empty-state"><p>No orders yet</p></div>`;
    return;
  }

  container.innerHTML = orders
    .map(
      (o) => `
    <div class="recent-order-item">
      <div>
        <strong>#${o.id}</strong>
        <span style="display:block">${o.customer.name}</span>
      </div>
      <div style="text-align:right">
        <strong>${formatPrice(o.total)}</strong>
        <span class="badge-pill ${o.status}" style="display:block;margin-top:0.25rem">${o.status}</span>
      </div>
    </div>
  `
    )
    .join("");
}

function renderCategoryBreakdown() {
  const products = getProducts();
  const categories = ["furniture", "decor", "kitchenware"];
  const total = products.length || 1;

  document.getElementById("category-breakdown").innerHTML = categories
    .map((cat) => {
      const count = products.filter((p) => p.category === cat).length;
      const pct = Math.round((count / total) * 100);
      return `
      <div class="category-bar">
        <div class="category-bar-header">
          <span>${CATEGORY_LABELS[cat]}</span>
          <span>${count} (${pct}%)</span>
        </div>
        <div class="category-bar-track">
          <div class="category-bar-fill" style="width:${pct}%"></div>
        </div>
      </div>
    `;
    })
    .join("");
}

function renderProductsTable() {
  const products = getProducts();
  const tbody = document.getElementById("products-table");
  const countEl = document.getElementById("product-count");
  if (countEl) countEl.textContent = products.length;

  if (!products.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><p>No products. Add your first product!</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = products
    .map(
      (p) => `
    <tr>
      <td>
        <div class="table-product">
          <img src="${p.image}" alt="${escapeHtml(p.name)}">
          <div>
            <strong>${escapeHtml(p.name)}</strong>
            <span>ID: ${p.id}</span>
          </div>
        </div>
      </td>
      <td><span class="badge-pill ${p.category}">${CATEGORY_LABELS[p.category]}</span></td>
      <td>
        <strong>${formatPrice(p.price)}</strong>
        ${p.originalPrice ? `<br><span style="font-size:0.8rem;color:var(--color-muted);text-decoration:line-through">${formatPrice(p.originalPrice)}</span>` : ""}
      </td>
      <td>${p.badge ? `<span class="badge-pill">${escapeHtml(p.badge)}</span>` : "—"}</td>
      <td>
        <div class="table-actions">
          <button type="button" class="btn-icon" onclick="editProduct(${p.id})" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button type="button" class="btn-icon danger" onclick="confirmDeleteProduct(${p.id})" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

function renderOrdersTable() {
  const orders = getOrders();
  const tbody = document.getElementById("orders-table");
  const countEl = document.getElementById("order-count");
  if (countEl) countEl.textContent = orders.length;

  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><p>No orders yet. Orders appear when customers checkout.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = orders
    .map(
      (o) => `
    <tr>
      <td><strong>#${o.id}</strong></td>
      <td>
        <strong>${escapeHtml(o.customer.name)}</strong><br>
        <span style="font-size:0.8rem;color:var(--color-muted)">${escapeHtml(
          o.customer.phone || o.customer.email || "—"
        )}</span>
        ${
          o.customer.wilaya
            ? `<br><span style="font-size:0.75rem;color:var(--color-muted)">${escapeHtml(
                o.customer.baladiya
                  ? `${o.customer.wilaya} / ${o.customer.baladiya}`
                  : o.customer.wilaya
              )}</span>`
            : ""
        }
      </td>
      <td>${o.items.reduce((s, i) => s + i.quantity, 0)} items</td>
      <td><strong>${formatPrice(o.total)}</strong></td>
      <td>
        <select class="order-status-select" data-order-id="${o.id}" style="padding:0.35rem 0.5rem;border:1px solid var(--color-border);border-radius:4px;font-size:0.8rem">
          ${ORDER_STATUSES.map((s) => `<option value="${s}" ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </td>
      <td style="font-size:0.85rem;color:var(--color-stone)">${formatDate(o.createdAt)}</td>
      <td>
        <div class="table-actions">
          <button type="button" class="btn-icon" onclick="viewOrder(${o.id})" title="View">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button type="button" class="btn-icon danger" onclick="confirmDeleteOrder(${o.id})" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join("");

  document.querySelectorAll(".order-status-select").forEach((select) => {
    select.addEventListener("change", () => {
      updateOrderStatus(select.dataset.orderId, select.value);
      showAdminToast("Order status updated");
      renderStats();
      renderRecentOrders();
    });
  });
}

function initProductModal() {
  const modal = document.getElementById("product-modal");
  const form = document.getElementById("product-form");
  const imageInput = document.getElementById("product-image");
  const preview = document.getElementById("image-preview");

  document.getElementById("add-product-btn")?.addEventListener("click", () => openProductModal());
  document.getElementById("modal-close")?.addEventListener("click", closeProductModal);
  document.getElementById("modal-cancel")?.addEventListener("click", closeProductModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeProductModal();
  });

  imageInput?.addEventListener("input", () => {
    if (imageInput.value) {
      preview.src = imageInput.value;
      preview.style.display = "block";
    } else {
      preview.style.display = "none";
    }
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("product-id").value;
    const data = {
      name: document.getElementById("product-name").value.trim(),
      category: document.getElementById("product-category").value,
      price: parseInt(document.getElementById("product-price").value, 10),
      originalPrice: parseInt(document.getElementById("product-original").value, 10) || null,
      badge: document.getElementById("product-badge").value || null,
      image: document.getElementById("product-image").value.trim(),
      images: document
        .getElementById("product-images")
        .value.split(/\r?\n/)
        .map((url) => url.trim())
        .filter(Boolean),
    };

    if (id) {
      updateProduct(id, data);
      showAdminToast("Product updated");
    } else {
      addProduct(data);
      showAdminToast("Product added");
    }

    closeProductModal();
    renderAll();
  });
}

function openProductModal(product = null) {
  const modal = document.getElementById("product-modal");
  const preview = document.getElementById("image-preview");
  document.getElementById("modal-title").textContent = product ? "Edit Product" : "Add Product";
  document.getElementById("product-id").value = product?.id || "";
  document.getElementById("product-name").value = product?.name || "";
  document.getElementById("product-category").value = product?.category || "furniture";
  document.getElementById("product-price").value = product?.price || "";
  document.getElementById("product-original").value = product?.originalPrice || "";
  document.getElementById("product-badge").value = product?.badge || "";
  document.getElementById("product-image").value = product?.image || "";
  document.getElementById("product-images").value = Array.isArray(product?.images)
    ? product.images.join("\n")
    : "";

  if (product?.image) {
    preview.src = product.image;
    preview.style.display = "block";
  } else {
    preview.style.display = "none";
  }

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("product-name")?.focus();
}

function closeProductModal() {
  const modal = document.getElementById("product-modal");
  modal?.classList.remove("open");
  modal?.setAttribute("aria-hidden", "true");
  document.getElementById("product-form")?.reset();
  document.getElementById("product-id").value = "";
  document.getElementById("image-preview").style.display = "none";
}

function editProduct(id) {
  const product = getProductById(id);
  if (product) openProductModal(product);
}

function confirmDeleteProduct(id) {
  const product = getProductById(id);
  if (product && confirm(`Delete "${product.name}"? This cannot be undone.`)) {
    deleteProduct(id);
    showAdminToast("Product deleted");
    renderAll();
  }
}

function initOrderModal() {
  const modal = document.getElementById("order-modal");
  document.getElementById("order-modal-close")?.addEventListener("click", closeOrderModal);
  document.getElementById("order-modal-cancel")?.addEventListener("click", closeOrderModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeOrderModal();
  });
}

function viewOrder(id) {
  const order = getOrders().find((o) => o.id === Number(id));
  if (!order) return;

  const c = order.customer || {};
  const paymentLabel = order.paymentMethod === "cod" || !order.paymentMethod
    ? "Cash on Delivery"
    : escapeHtml(order.paymentMethod);
  const phoneLine = c.phone
    ? `<p style="margin-bottom:0.5rem"><strong>Phone:</strong> ${escapeHtml(c.phone)}</p>`
    : "";
  const emailLine = c.email
    ? `<p style="margin-bottom:0.5rem"><strong>Email:</strong> ${escapeHtml(c.email)}</p>`
    : "";
  const locationLine =
    c.wilaya || c.baladiya
      ? `<p style="margin-bottom:0.5rem"><strong>Location:</strong> ${escapeHtml(
          [c.wilayaCode ? `${c.wilayaCode} — ${c.wilaya}` : c.wilaya, c.baladiya]
            .filter(Boolean)
            .join(" / ")
        )}</p>`
      : "";
  const addressLine = c.address
    ? `<p style="margin-bottom:0.5rem"><strong>Address:</strong> ${escapeHtml(c.address)}</p>`
    : "";
  const notesLine = c.notes
    ? `<p style="margin-bottom:1rem"><strong>Notes:</strong> ${escapeHtml(c.notes)}</p>`
    : "";

  document.getElementById("order-modal-title").textContent = `Order #${order.id}`;
  document.getElementById("order-modal-body").innerHTML = `
    <p style="margin-bottom:0.5rem"><strong>Customer:</strong> ${escapeHtml(c.name || "—")}</p>
    ${phoneLine}
    ${emailLine}
    ${locationLine}
    ${addressLine}
    ${notesLine}
    <p style="margin-bottom:0.5rem"><strong>Payment:</strong> ${paymentLabel}</p>
    <p style="margin-bottom:0.5rem"><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
    <p style="margin-bottom:1rem"><strong>Status:</strong> <span class="badge-pill ${order.status}">${order.status}</span></p>
    <table class="admin-table" style="margin-bottom:1rem">
      <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
      <tbody>
        ${order.items
          .map(
            (i) => `
          <tr>
            <td>${escapeHtml(i.name)}</td>
            <td>${i.quantity}</td>
            <td>${formatPrice(i.price * i.quantity)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
    <p style="text-align:right;font-size:1.1rem"><strong>Total: ${formatPrice(order.total)}</strong></p>
  `;
  document.getElementById("order-modal").classList.add("open");
  document.getElementById("order-modal").setAttribute("aria-hidden", "false");
  document.getElementById("order-modal-close")?.focus();
}

function closeOrderModal() {
  const modal = document.getElementById("order-modal");
  modal?.classList.remove("open");
  modal?.setAttribute("aria-hidden", "true");
}

function confirmDeleteOrder(id) {
  if (confirm(`Delete order #${id}?`)) {
    deleteOrder(id);
    showAdminToast("Order deleted");
    renderAll();
  }
}

function initSettings() {
  document.getElementById("reset-products-btn")?.addEventListener("click", () => {
    if (confirm("Reset all products to defaults? Your custom products will be lost.")) {
      resetProducts();
      showAdminToast("Products reset to defaults");
      renderAll();
    }
  });

  initTelegramSettings();
}

function initTelegramSettings() {
  const form = document.getElementById("telegram-settings-form");
  const tokenInput = document.getElementById("telegram-bot-token");
  const chatInput = document.getElementById("telegram-chat-id");
  const statusEl = document.getElementById("telegram-status");
  const testBtn = document.getElementById("telegram-test-btn");
  if (!form || !tokenInput || !chatInput) return;

  const config = getTelegramConfig();
  tokenInput.value = config.botToken || "";
  chatInput.value = config.chatId || "";
  updateTelegramStatus(statusEl);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    saveTelegramConfig({
      botToken: tokenInput.value,
      chatId: chatInput.value,
    });
    updateTelegramStatus(statusEl);
    showAdminToast("Telegram settings saved");
  });

  testBtn?.addEventListener("click", async () => {
    saveTelegramConfig({
      botToken: tokenInput.value,
      chatId: chatInput.value,
    });
    updateTelegramStatus(statusEl);

    if (!isTelegramConfigured()) {
      showAdminToast("Enter bot token and chat ID first");
      return;
    }

    testBtn.disabled = true;
    try {
      const result = await sendTelegramTestMessage();
      showAdminToast(result.ok ? "Test message sent — check Telegram" : result.error);
    } catch {
      showAdminToast("Could not reach Telegram. Check your connection.");
    } finally {
      testBtn.disabled = false;
    }
  });
}

function updateTelegramStatus(statusEl) {
  if (!statusEl) return;
  if (isTelegramConfigured()) {
    statusEl.textContent = "Status: connected — new orders will be sent to Telegram.";
    statusEl.style.color = "var(--color-brand)";
  } else {
    statusEl.textContent = "Status: not configured — orders are saved locally only.";
    statusEl.style.color = "var(--color-stone)";
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showAdminToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2500);
}
