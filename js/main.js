document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initNewsletter();
  initScrollReveal();
  initBackToTop();
  init3DEffects();
  if (document.querySelector(".shop-section")) {
    initShopPage();
  } else if (document.body.dataset.page === "checkout") {
    initCheckoutPage();
  } else {
    initPageSpecific();
  }
});

window.addEventListener("localechange", () => {
  if (document.body.dataset.page === "checkout") {
    const productId = getCheckoutProductId();
    const product = getProductById(productId);
    if (product) {
      const qty = Number(document.getElementById("checkout-qty")?.value) || 1;
      renderCheckoutSummary(product, qty);
      refreshCheckoutLocations();
    }
  } else {
    initPageSpecific();
  }
  initTiltCards();
});

function initHeader() {
  const header = document.querySelector(".header");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector(".mobile-nav");

  window.addEventListener("scroll", () => {
    header?.classList.toggle("scrolled", window.scrollY > 20);
  });

  menuToggle?.addEventListener("click", () => {
    mobileNav?.classList.toggle("open");
    menuToggle.classList.toggle("active");
  });

  document.querySelectorAll(".mobile-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileNav?.classList.remove("open");
      menuToggle?.classList.remove("active");
    });
  });
}

function initNewsletter() {
  const form = document.querySelector(".newsletter-form");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = form.querySelector("input");
    if (input?.value.trim()) {
      showToast(t("toast.subscribed"));
      input.value = "";
    }
  });
}

function initPageSpecific() {
  const featuredGrid = document.querySelector(".featured .product-grid");
  if (featuredGrid) {
    renderProducts(featuredGrid, getFeaturedProducts(8));
  }

  const shopGrid = document.querySelector(".shop-section .product-grid");
  if (shopGrid) {
    const activeTab = document.querySelector(".filter-tab.active");
    const category = activeTab?.dataset.category || "all";
    const products = getProductsByCategory(category);
    renderProducts(shopGrid, products);

    const countEl = document.querySelector(".shop-count");
    if (countEl) countEl.textContent = formatProductCount(products.length);
  }
}

function initShopPage() {
  initShopFilters();
  initFromUrlCategory();
  initPageSpecific();
}

function initScrollReveal() {
  const elements = document.querySelectorAll(".reveal");
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
  );

  elements.forEach((el) => observer.observe(el));
}

function initBackToTop() {
  const btn = document.querySelector(".back-to-top");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    btn.classList.toggle("visible", window.scrollY > 500);
  });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
