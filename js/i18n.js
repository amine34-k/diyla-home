const LOCALE_KEY = "diyla-locale";
const LOCALES = { en: LOCALE_EN, ar: LOCALE_AR };
const RTL_LOCALES = ["ar"];

let currentLocale = getStoredLocale();

function getStoredLocale() {
  const stored = localStorage.getItem(LOCALE_KEY);
  if (stored && LOCALES[stored]) return stored;
  const browser = (navigator.language || "en").slice(0, 2);
  return LOCALES[browser] ? browser : "en";
}

function getLocale() {
  return currentLocale;
}

function isRTL() {
  return RTL_LOCALES.includes(currentLocale);
}

function t(key, params = {}) {
  const keys = key.split(".");
  let value = LOCALES[currentLocale];

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }

  if (value === undefined) {
    value = keys.reduce((obj, k) => obj?.[k], LOCALES.en);
  }

  if (typeof value !== "string") return key;

  return Object.entries(params).reduce(
    (str, [param, val]) => str.replace(`{${param}}`, val),
    value
  );
}

function applyDocumentLocale() {
  const html = document.documentElement;
  html.lang = currentLocale;
  html.dir = isRTL() ? "rtl" : "ltr";
  document.title = t(
    document.body?.dataset.page === "shop"
      ? "meta.shopTitle"
      : document.body?.dataset.page === "checkout"
        ? "meta.checkoutTitle"
        : "meta.homeTitle"
  );

  const desc = document.querySelector('meta[name="description"]');
  if (desc) {
    desc.content = t(
      document.body?.dataset.page === "shop"
        ? "meta.shopDescription"
        : document.body?.dataset.page === "checkout"
          ? "meta.checkoutDescription"
          : "meta.homeDescription"
    );
  }
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
  });

  const switcher = document.getElementById("lang-switcher");
  if (switcher) switcher.value = currentLocale;
}

function setLocale(locale) {
  if (!LOCALES[locale] || locale === currentLocale) return;
  currentLocale = locale;
  localStorage.setItem(LOCALE_KEY, locale);
  applyDocumentLocale();
  applyTranslations();
  window.dispatchEvent(new CustomEvent("localechange"));
}

function formatProductCount(count) {
  const key = count === 1 ? "shop.productCountOne" : "shop.productCount";
  return t(key, { count });
}

function initI18n() {
  applyDocumentLocale();
  applyTranslations();

  const switcher = document.getElementById("lang-switcher");
  switcher?.addEventListener("change", (e) => setLocale(e.target.value));
}

if (document.documentElement) {
  document.documentElement.lang = currentLocale;
  document.documentElement.dir = isRTL() ? "rtl" : "ltr";
}

document.addEventListener("DOMContentLoaded", initI18n);
