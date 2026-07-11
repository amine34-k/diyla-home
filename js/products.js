const PRODUCTS_KEY = "diyla-products-dzd";

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Oslo Linen Sofa",
    category: "furniture",
    price: 174000,
    originalPrice: null,
    badge: "New",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
  },
  {
    id: 2,
    name: "Walnut Dining Table",
    category: "furniture",
    price: 120000,
    originalPrice: 147000,
    badge: "Sale",
    image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80",
  },
  {
    id: 3,
    name: "Velvet Accent Chair",
    category: "furniture",
    price: 60000,
    originalPrice: null,
    badge: null,
    image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&q=80",
  },
  {
    id: 4,
    name: "Minimalist Bookshelf",
    category: "furniture",
    price: 44000,
    originalPrice: null,
    badge: null,
    image: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600&q=80",
  },
  {
    id: 5,
    name: "Ceramic Vase Set",
    category: "decor",
    price: 12000,
    originalPrice: null,
    badge: "Bestseller",
    image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600&q=80",
  },
  {
    id: 6,
    name: "Woven Wall Mirror",
    category: "decor",
    price: 21000,
    originalPrice: null,
    badge: null,
    image: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&q=80",
  },
  {
    id: 7,
    name: "Linen Throw Pillows",
    category: "decor",
    price: 9000,
    originalPrice: 11500,
    badge: "Sale",
    image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80",
  },
  {
    id: 8,
    name: "Brass Candle Holders",
    category: "decor",
    price: 6000,
    originalPrice: null,
    badge: null,
    image: "https://images.unsplash.com/photo-1602874801006-ad338e28eac3?w=600&q=80",
  },
  {
    id: 9,
    name: "Marble Cutting Board",
    category: "kitchenware",
    price: 11000,
    originalPrice: null,
    badge: "New",
    image: "https://images.unsplash.com/photo-1594040220019-7831e8d0c511?w=600&q=80",
  },
  {
    id: 10,
    name: "Copper Cookware Set",
    category: "kitchenware",
    price: 47000,
    originalPrice: 58000,
    badge: "Sale",
    image: "https://images.unsplash.com/photo-1584990347449-7f54d2f1f3f7?w=600&q=80",
  },
  {
    id: 11,
    name: "Artisan Dinner Plates",
    category: "kitchenware",
    price: 16000,
    originalPrice: null,
    badge: null,
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&q=80",
  },
  {
    id: 12,
    name: "Glass Storage Jars",
    category: "kitchenware",
    price: 5500,
    originalPrice: null,
    badge: "Bestseller",
    image: "https://images.unsplash.com/photo-1604881991728-f8add4f476f8?w=600&q=80",
  },
];

function getCategoryLabel(category) {
  return t(`categoryLabels.${category}`);
}

function getProductName(product) {
  const p = typeof product === "object" ? product : getProductById(product);
  if (!p) return "";
  const names = getLocale() === "ar" ? LOCALE_AR.products : LOCALE_EN.products;
  return names?.[p.id] || p.name;
}

function getBadgeLabel(badge) {
  return badge ? t(`badges.${badge}`) : "";
}

function loadProducts() {
  try {
    const stored = localStorage.getItem(PRODUCTS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    /* fall through */
  }
  return [...DEFAULT_PRODUCTS];
}

function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function getProducts() {
  return loadProducts();
}

function resetProducts() {
  localStorage.removeItem(PRODUCTS_KEY);
}

function getNextProductId() {
  const products = getProducts();
  return products.length ? Math.max(...products.map((p) => p.id)) + 1 : 1;
}

function addProduct(product) {
  const products = getProducts();
  const newProduct = { ...product, id: getNextProductId() };
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
}

function updateProduct(id, updates) {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === Number(id));
  if (index === -1) return null;
  products[index] = { ...products[index], ...updates, id: Number(id) };
  saveProducts(products);
  return products[index];
}

function deleteProduct(id) {
  const products = getProducts().filter((p) => p.id !== Number(id));
  saveProducts(products);
}

function formatPrice(amount) {
  const locale = getLocale() === "ar" ? "ar-DZ" : "fr-DZ";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getProductById(id) {
  return getProducts().find((p) => p.id === Number(id));
}

function getProductsByCategory(category) {
  const products = getProducts();
  if (!category || category === "all") return products;
  return products.filter((p) => p.category === category);
}

function getFeaturedProducts(count = 8) {
  return getProducts().slice(0, count);
}
