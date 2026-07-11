function showToast(message) {
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

function goToCheckout(productId) {
  window.location.href = `checkout.html?product=${productId}`;
}

function renderProductCard(product) {
  const name = getProductName(product);
  const badgeClass = product.badge === "Sale" ? "sale" : "";
  const badge = product.badge
    ? `<span class="product-badge ${badgeClass}">${getBadgeLabel(product.badge)}</span>`
    : "";

  const originalPrice = product.originalPrice
    ? `<span class="original">${formatPrice(product.originalPrice)}</span>`
    : "";

  return `
    <article class="product-card tilt-card" data-category="${product.category}">
      <div class="product-card-inner">
        <div class="product-image-wrap">
          ${badge}
          <img src="${product.image}" alt="${name}" loading="lazy">
          <div class="product-shine"></div>
          <button type="button" class="product-quick-add" onclick="goToCheckout(${product.id})">${t("checkout.orderNow")}</button>
        </div>
        <div class="product-info">
          <div class="product-category">${getCategoryLabel(product.category)}</div>
          <h3 class="product-name">${name}</h3>
          <div class="product-price">
            <span class="current">${formatPrice(product.price)}</span>
            ${originalPrice}
          </div>
        </div>
      </div>
      <div class="product-card-shadow"></div>
    </article>
  `;
}

function renderProducts(container, products) {
  if (!container) return;
  container.innerHTML = products.map(renderProductCard).join("");
  if (typeof bindTiltCards === "function") {
    bindTiltCards(container.querySelectorAll(".tilt-card"));
  }
}

function initShopFilters() {
  const tabs = document.querySelectorAll(".filter-tab");
  const grid = document.querySelector(".product-grid");
  const countEl = document.querySelector(".shop-count");

  if (!tabs.length || !grid) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const category = tab.dataset.category;
      const products = getProductsByCategory(category);
      renderProducts(grid, products);

      if (countEl) {
        countEl.textContent = formatProductCount(products.length);
      }
    });
  });
}

function initFromUrlCategory() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  if (!category) return;

  const tab = document.querySelector(`.filter-tab[data-category="${category}"]`);
  if (tab) tab.click();
}
