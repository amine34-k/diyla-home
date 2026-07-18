function getWilayaName(wilaya, locale) {
  if (!wilaya) return "";
  return locale === "ar" ? wilaya.nameAr : wilaya.name;
}

function getCommuneName(commune, locale) {
  if (!commune) return "";
  return locale === "ar" ? commune.nameAr : commune.name;
}

function populateWilayas(selectEl) {
  if (!selectEl || typeof ALGERIA_LOCATIONS === "undefined") return;
  const locale = typeof getLocale === "function" ? getLocale() : "en";
  const placeholder = t("checkout.selectWilaya");
  selectEl.innerHTML = `<option value="">${placeholder}</option>`;
  ALGERIA_LOCATIONS.forEach((wilaya) => {
    const opt = document.createElement("option");
    opt.value = wilaya.code;
    opt.textContent = `${wilaya.code} — ${getWilayaName(wilaya, locale)}`;
    selectEl.appendChild(opt);
  });
}

function populateCommunes(wilayaCode, communeSelect) {
  if (!communeSelect) return;
  const locale = typeof getLocale === "function" ? getLocale() : "en";
  const placeholder = t("checkout.selectBaladiya");
  communeSelect.innerHTML = `<option value="">${placeholder}</option>`;
  communeSelect.disabled = !wilayaCode;

  if (!wilayaCode) return;

  const wilaya = ALGERIA_LOCATIONS.find((w) => w.code === wilayaCode);
  if (!wilaya) return;

  wilaya.communes.forEach((commune) => {
    const opt = document.createElement("option");
    opt.value = commune.name;
    opt.textContent = getCommuneName(commune, locale);
    opt.dataset.nameAr = commune.nameAr;
    communeSelect.appendChild(opt);
  });
}

function getCheckoutProductId() {
  const params = new URLSearchParams(window.location.search);
  return Number(params.get("product"));
}

// Items in the current order: [{ id, quantity }]. First entry is the main product.
let checkoutItems = [];

function getCheckoutTotal() {
  return checkoutItems.reduce((sum, item) => {
    const p = getProductById(item.id);
    return p ? sum + p.price * item.quantity : sum;
  }, 0);
}

function getSimilarProducts(mainId, count = 4) {
  const main = getProductById(mainId);
  if (!main) return [];
  const inOrder = new Set(checkoutItems.map((i) => i.id));
  const all = getProducts().filter((p) => !inOrder.has(p.id));
  const sameCategory = all.filter((p) => p.category === main.category);
  const others = all.filter((p) => p.category !== main.category);
  return sameCategory.concat(others).slice(0, count);
}

function renderCheckoutSummary() {
  const summary = document.getElementById("checkout-summary");
  if (!summary || !checkoutItems.length) return;

  const itemsHtml = checkoutItems
    .map((item, index) => {
      const product = getProductById(item.id);
      if (!product) return "";
      const name = getProductName(product);
      const isMain = index === 0;
      return `
        <div class="checkout-product" data-item-id="${product.id}">
          <img src="${product.image}" alt="${name}" loading="lazy">
          <div class="checkout-product-info">
            <h3>${name}</h3>
            <p class="checkout-product-meta">${getCategoryLabel(product.category)}</p>
            <p class="checkout-product-price">${formatPrice(product.price)}</p>
            <div class="checkout-qty">
              <button type="button" class="qty-minus" data-item-id="${product.id}" aria-label="${t("aria.decreaseQty")}">−</button>
              <input type="number" class="checkout-qty-input" min="1" max="99" value="${item.quantity}" readonly aria-label="${t("checkout.quantity")}">
              <button type="button" class="qty-plus" data-item-id="${product.id}" aria-label="${t("aria.increaseQty")}">+</button>
            </div>
          </div>
          ${
            isMain
              ? ""
              : `<button type="button" class="checkout-item-remove" data-item-id="${product.id}" aria-label="${t("aria.removeItem")}">×</button>`
          }
        </div>
      `;
    })
    .join("");

  const total = getCheckoutTotal();

  summary.innerHTML = `
    <div class="checkout-items">${itemsHtml}</div>
    <div class="checkout-totals">
      <div class="checkout-total-line">
        <span>${t("checkout.subtotal")}</span>
        <strong id="checkout-subtotal">${formatPrice(total)}</strong>
      </div>
      <div class="checkout-total-line checkout-total-final">
        <span>${t("checkout.total")}</span>
        <strong id="checkout-total">${formatPrice(total)}</strong>
      </div>
    </div>
    <div class="checkout-payment-note">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="6" width="20" height="12" rx="2"/>
        <path d="M2 10h20"/>
      </svg>
      <div>
        <strong>${t("checkout.paymentMethod")}</strong>
        <span>${t("checkout.codOnly")}</span>
      </div>
    </div>
  `;

  renderCheckoutSuggestions();
}

function renderCheckoutSuggestions() {
  const container = document.getElementById("checkout-quick-add");
  if (!container || !checkoutItems.length) return;

  const suggestions = getSimilarProducts(checkoutItems[0].id);
  if (!suggestions.length) {
    container.innerHTML = "";
    container.hidden = true;
    return;
  }

  const cards = suggestions
    .map((product) => {
      const name = getProductName(product);
      return `
        <div class="suggestion-card">
          <img src="${product.image}" alt="${name}" loading="lazy">
          <div class="suggestion-info">
            <span class="suggestion-name">${name}</span>
            <span class="suggestion-price">${formatPrice(product.price)}</span>
          </div>
          <button type="button" class="suggestion-add" data-product-id="${product.id}">
            + ${t("checkout.add")}
          </button>
        </div>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="checkout-quick-add-heading">
      <div>
        <span class="section-label">${t("checkout.quickAdd")}</span>
        <h2 class="checkout-suggestions-title">${t("checkout.alsoLike")}</h2>
      </div>
      <span class="checkout-quick-add-hint">${t("checkout.quickAddHint")}</span>
    </div>
    <div class="suggestion-list">${cards}</div>
  `;
  container.hidden = false;
}

function updateCheckoutTotals() {
  const total = formatPrice(getCheckoutTotal());
  const sub = document.getElementById("checkout-subtotal");
  const tot = document.getElementById("checkout-total");
  if (sub) sub.textContent = total;
  if (tot) tot.textContent = total;
}

function initCheckoutPage() {
  const form = document.getElementById("checkout-form");
  if (!form) return;

  const productId = getCheckoutProductId();
  const product = getProductById(productId);
  const emptyEl = document.getElementById("checkout-empty");
  const layout = document.getElementById("checkout-layout");
  const quickAdd = document.getElementById("checkout-quick-add");

  if (!product) {
    if (layout) layout.hidden = true;
    if (quickAdd) quickAdd.hidden = true;
    if (emptyEl) emptyEl.hidden = false;
    return;
  }

  if (emptyEl) emptyEl.hidden = true;
  if (layout) layout.hidden = false;

  checkoutItems = [{ id: product.id, quantity: 1 }];
  renderCheckoutSummary();

  const wilayaSelect = document.getElementById("checkout-wilaya");
  const baladiyaSelect = document.getElementById("checkout-baladiya");
  populateWilayas(wilayaSelect);
  populateCommunes("", baladiyaSelect);

  wilayaSelect?.addEventListener("change", () => {
    populateCommunes(wilayaSelect.value, baladiyaSelect);
  });

  document.querySelector(".checkout-page")?.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".suggestion-add");
    if (addBtn) {
      const id = Number(addBtn.dataset.productId);
      if (!checkoutItems.some((i) => i.id === id)) {
        checkoutItems.push({ id, quantity: 1 });
        renderCheckoutSummary();
        showToast(t("checkout.addedToOrder"));
      }
      return;
    }

    const removeBtn = e.target.closest(".checkout-item-remove");
    if (removeBtn) {
      const id = Number(removeBtn.dataset.itemId);
      checkoutItems = checkoutItems.filter((i) => i.id !== id);
      renderCheckoutSummary();
      return;
    }

    const minus = e.target.closest(".qty-minus");
    const plus = e.target.closest(".qty-plus");
    if (!minus && !plus) return;

    const id = Number((minus || plus).dataset.itemId);
    const item = checkoutItems.find((i) => i.id === id);
    if (!item) return;

    if (minus) item.quantity = Math.max(1, item.quantity - 1);
    if (plus) item.quantity = Math.min(99, item.quantity + 1);

    const row = document.querySelector(`.checkout-product[data-item-id="${id}"] .checkout-qty-input`);
    if (row) row.value = item.quantity;
    updateCheckoutTotals();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const errorEl = document.getElementById("checkout-error");
    const name = document.getElementById("checkout-name")?.value.trim();
    const phone = document.getElementById("checkout-phone")?.value.trim();
    const wilayaCode = wilayaSelect?.value;
    const baladiya = baladiyaSelect?.value;
    const address = document.getElementById("checkout-address")?.value.trim();
    const notes = document.getElementById("checkout-notes")?.value.trim();

    if (!name || !phone || !wilayaCode || !baladiya) {
      const message = t("checkout.fillRequired");
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.hidden = false;
      }
      form.querySelector(":invalid")?.focus();
      showToast(message);
      return;
    }

    if (errorEl) {
      errorEl.textContent = "";
      errorEl.hidden = true;
    }

    const wilaya = ALGERIA_LOCATIONS.find((w) => w.code === wilayaCode);
    const locale = typeof getLocale === "function" ? getLocale() : "en";
    const selectedOpt = baladiyaSelect?.selectedOptions?.[0];
    const baladiyaAr = selectedOpt?.dataset?.nameAr || baladiya;

    const items = checkoutItems
      .map((item) => {
        const p = getProductById(item.id);
        if (!p) return null;
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image,
          quantity: item.quantity,
        };
      })
      .filter(Boolean);

    const submitBtn = form.querySelector(".checkout-submit");
    if (submitBtn) submitBtn.disabled = true;

    const order = createOrder(items, {
      name,
      phone,
      email: "",
      wilaya: getWilayaName(wilaya, "en"),
      wilayaAr: wilaya?.nameAr || "",
      wilayaCode,
      baladiya,
      baladiyaAr,
      address,
      notes,
      paymentMethod: "cod",
    });

    (async () => {
      let telegramOk = false;
      try {
        if (typeof sendOrderToTelegram === "function" && isTelegramConfigured()) {
          const result = await sendOrderToTelegram(order);
          telegramOk = Boolean(result?.ok);
          if (!telegramOk) {
            console.warn("Telegram notify failed:", result?.error);
          }
        } else {
          console.warn("Telegram notify skipped: not configured");
        }
      } catch (err) {
        console.warn("Telegram notify failed:", err);
      } finally {
        showToast(telegramOk ? t("toast.orderSuccess") : t("toast.orderSavedLocal"));
        setTimeout(() => {
          window.location.href = "shop.html";
        }, 1400);
      }
    })();
  });
}

function refreshCheckoutLocations() {
  const wilayaSelect = document.getElementById("checkout-wilaya");
  const baladiyaSelect = document.getElementById("checkout-baladiya");
  if (!wilayaSelect || !baladiyaSelect) return;

  const selectedWilaya = wilayaSelect.value;
  const selectedBaladiya = baladiyaSelect.value;
  populateWilayas(wilayaSelect);
  if (selectedWilaya) {
    wilayaSelect.value = selectedWilaya;
    populateCommunes(selectedWilaya, baladiyaSelect);
    if (selectedBaladiya) baladiyaSelect.value = selectedBaladiya;
  } else {
    populateCommunes("", baladiyaSelect);
  }
}
