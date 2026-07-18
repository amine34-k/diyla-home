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

function renderCheckoutSummary(product, quantity) {
  const summary = document.getElementById("checkout-summary");
  if (!summary || !product) return;

  const name = getProductName(product);
  const lineTotal = product.price * quantity;

  summary.innerHTML = `
    <div class="checkout-product">
      <img src="${product.image}" alt="${name}" loading="lazy">
      <div class="checkout-product-info">
        <h3>${name}</h3>
        <p class="checkout-product-meta">${getCategoryLabel(product.category)}</p>
        <p class="checkout-product-price">${formatPrice(product.price)}</p>
      </div>
    </div>
    <div class="checkout-qty-row">
      <label for="checkout-qty">${t("checkout.quantity")}</label>
      <div class="checkout-qty">
        <button type="button" id="qty-minus" aria-label="${t("aria.decreaseQty")}">−</button>
        <input type="number" id="checkout-qty" min="1" max="99" value="${quantity}" readonly>
        <button type="button" id="qty-plus" aria-label="${t("aria.increaseQty")}">+</button>
      </div>
    </div>
    <div class="checkout-totals">
      <div class="checkout-total-line">
        <span>${t("checkout.subtotal")}</span>
        <strong id="checkout-subtotal">${formatPrice(lineTotal)}</strong>
      </div>
      <div class="checkout-total-line checkout-total-final">
        <span>${t("checkout.total")}</span>
        <strong id="checkout-total">${formatPrice(lineTotal)}</strong>
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
}

function initCheckoutPage() {
  const form = document.getElementById("checkout-form");
  if (!form) return;

  const productId = getCheckoutProductId();
  const product = getProductById(productId);
  const emptyEl = document.getElementById("checkout-empty");
  const layout = document.getElementById("checkout-layout");

  if (!product) {
    if (layout) layout.hidden = true;
    if (emptyEl) emptyEl.hidden = false;
    return;
  }

  if (emptyEl) emptyEl.hidden = true;
  if (layout) layout.hidden = false;

  let quantity = 1;
  renderCheckoutSummary(product, quantity);

  const wilayaSelect = document.getElementById("checkout-wilaya");
  const baladiyaSelect = document.getElementById("checkout-baladiya");
  populateWilayas(wilayaSelect);
  populateCommunes("", baladiyaSelect);

  wilayaSelect?.addEventListener("change", () => {
    populateCommunes(wilayaSelect.value, baladiyaSelect);
  });

  document.getElementById("checkout-summary")?.addEventListener("click", (e) => {
    const minus = e.target.closest("#qty-minus");
    const plus = e.target.closest("#qty-plus");
    if (!minus && !plus) return;

    if (minus) quantity = Math.max(1, quantity - 1);
    if (plus) quantity = Math.min(99, quantity + 1);

    const qtyInput = document.getElementById("checkout-qty");
    if (qtyInput) qtyInput.value = quantity;
    const total = formatPrice(product.price * quantity);
    const sub = document.getElementById("checkout-subtotal");
    const tot = document.getElementById("checkout-total");
    if (sub) sub.textContent = total;
    if (tot) tot.textContent = total;
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

    const qty = Number(document.getElementById("checkout-qty")?.value) || quantity;

    const items = [
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: qty,
      },
    ];

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
