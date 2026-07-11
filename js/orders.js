const ORDERS_KEY = "diyla-orders";

function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function createOrder(items, customer = {}) {
  const orders = getOrders();
  const order = {
    id: orders.length ? Math.max(...orders.map((o) => o.id)) + 1 : 1001,
    items: items.map((item) => ({ ...item })),
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    status: "pending",
    paymentMethod: customer.paymentMethod || "cod",
    customer: {
      name: customer.name || "Guest Customer",
      phone: customer.phone || "",
      email: customer.email || "",
      wilaya: customer.wilaya || "",
      wilayaAr: customer.wilayaAr || "",
      wilayaCode: customer.wilayaCode || "",
      baladiya: customer.baladiya || "",
      baladiyaAr: customer.baladiyaAr || "",
      address: customer.address || "",
      notes: customer.notes || "",
    },
    createdAt: new Date().toISOString(),
  };
  orders.unshift(order);
  saveOrders(orders);
  return order;
}

function updateOrderStatus(orderId, status) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === Number(orderId));
  if (!order) return null;
  order.status = status;
  saveOrders(orders);
  return order;
}

function deleteOrder(orderId) {
  const orders = getOrders().filter((o) => o.id !== Number(orderId));
  saveOrders(orders);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
