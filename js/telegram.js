const TELEGRAM_CONFIG_KEY = "diyla-telegram";

// Default credentials (can be overridden in Admin → Settings)
const TELEGRAM_DEFAULTS = {
  botToken: "8754943324:AAGRXPgGVYG21WXZwAW1J1V1ATQGGGhYjYc",
  chatId: "8509770974",
};

function getTelegramConfig() {
  try {
    const stored = JSON.parse(localStorage.getItem(TELEGRAM_CONFIG_KEY));
    if (stored?.botToken && stored?.chatId) {
      return {
        botToken: stored.botToken,
        chatId: String(stored.chatId),
      };
    }
  } catch {
    /* use defaults */
  }
  return { ...TELEGRAM_DEFAULTS };
}

function saveTelegramConfig(config) {
  localStorage.setItem(
    TELEGRAM_CONFIG_KEY,
    JSON.stringify({
      botToken: (config.botToken || "").trim(),
      chatId: String(config.chatId || "").trim(),
    })
  );
}

function isTelegramConfigured() {
  const { botToken, chatId } = getTelegramConfig();
  return Boolean(botToken && chatId);
}

function formatOrderTelegramMessage(order) {
  const c = order.customer || {};
  const items = (order.items || [])
    .map((item) => `• ${item.name} × ${item.quantity} — ${formatPrice(item.price * item.quantity)}`)
    .join("\n");

  const location = [c.wilayaCode ? `${c.wilayaCode} — ${c.wilaya}` : c.wilaya, c.baladiya]
    .filter(Boolean)
    .join(" / ");

  const lines = [
    "🛒 New Order — Diyla Home",
    "",
    `🧾 Order: #${order.id}`,
    `👤 Customer: ${c.name || "—"}`,
    `📞 Phone: ${c.phone || "—"}`,
    `📍 Wilaya: ${location || "—"}`,
    `🏠 Address: ${c.address || "—"}`,
  ];

  if (c.notes) {
    lines.push(`📝 Notes: ${c.notes}`);
  }

  lines.push(
    "",
    "Items:",
    items,
    "",
    `💰 Total: ${formatPrice(order.total)}`,
    "💳 Payment: Cash on Delivery",
    `🕒 Date: ${formatDate(order.createdAt)}`
  );

  return lines.join("\n");
}

async function sendTelegramMessage(text) {
  const { botToken, chatId } = getTelegramConfig();
  if (!botToken || !chatId) {
    return { ok: false, error: "Telegram is not configured" };
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    return { ok: false, error: data.description || "Failed to send Telegram message" };
  }

  return { ok: true };
}

async function sendOrderToTelegram(order) {
  if (!isTelegramConfigured()) {
    return { ok: false, error: "Telegram is not configured" };
  }
  return sendTelegramMessage(formatOrderTelegramMessage(order));
}

async function sendTelegramTestMessage() {
  return sendTelegramMessage(
    "✅ Diyla Home\nTelegram is connected. You will receive new orders here."
  );
}
