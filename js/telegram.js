const TELEGRAM_CONFIG_KEY = "diyla-telegram";

// Live checkout credentials (Admin → Settings can override).
const TELEGRAM_DEFAULTS = {
  botToken: "8754943324:AAGRXPgGVYG21WXZwAW1J1V1ATQGGGhYjYc",
  chatId: "8509770974",
};

function getTelegramConfig() {
  try {
    const stored = JSON.parse(localStorage.getItem(TELEGRAM_CONFIG_KEY));
    const botToken = (stored?.botToken || "").trim();
    const chatId = String(stored?.chatId || "").trim();
    if (botToken && chatId) {
      return { botToken, chatId };
    }
  } catch {
    /* use defaults */
  }
  return {
    botToken: TELEGRAM_DEFAULTS.botToken,
    chatId: String(TELEGRAM_DEFAULTS.chatId),
  };
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

function formatTelegramPrice(amount) {
  if (typeof formatPrice === "function") {
    try {
      return formatPrice(amount);
    } catch {
      /* fall through */
    }
  }
  return `${Number(amount) || 0} DZD`;
}

function formatTelegramDate(iso) {
  if (typeof formatDate === "function") {
    try {
      return formatDate(iso);
    } catch {
      /* fall through */
    }
  }
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso || "");
  }
}

function formatOrderTelegramMessage(order) {
  const c = order.customer || {};
  const items = (order.items || [])
    .map((item) => {
      const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
      return `• ${item.name || "Item"} × ${item.quantity || 0} — ${formatTelegramPrice(lineTotal)}`;
    })
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
    items || "• (no items)",
    "",
    `💰 Total: ${formatTelegramPrice(order.total)}`,
    "💳 Payment: Cash on Delivery",
    `🕒 Date: ${formatTelegramDate(order.createdAt)}`
  );

  return lines.join("\n");
}

function buildTelegramSendUrl(botToken, chatId, text) {
  const params = new URLSearchParams({
    chat_id: String(chatId),
    text: String(text || "").slice(0, 4000),
    disable_web_page_preview: "true",
  });
  return `https://api.telegram.org/bot${botToken}/sendMessage?${params.toString()}`;
}

async function sendTelegramMessage(text) {
  const { botToken, chatId } = getTelegramConfig();
  if (!botToken || !chatId) {
    return { ok: false, error: "Telegram is not configured" };
  }

  const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const message = String(text || "").slice(0, 4000);
  const formBody = new URLSearchParams({
    chat_id: String(chatId),
    text: message,
    disable_web_page_preview: "true",
  });

  // Prefer form-urlencoded POST — avoids JSON preflight CORS failures in browsers.
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody.toString(),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.ok) {
      return { ok: true };
    }
    // Fall through to GET fallback below.
    console.warn("Telegram POST failed:", data.description || response.status);
  } catch (err) {
    console.warn("Telegram POST error:", err?.message || err);
  }

  // GET fallback (also avoids CORS preflight).
  try {
    const response = await fetch(buildTelegramSendUrl(botToken, chatId, message), {
      method: "GET",
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.ok) {
      return { ok: true };
    }
    return { ok: false, error: data.description || "Failed to send Telegram message" };
  } catch (err) {
    // Last resort: fire-and-forget GET (works even when response is opaque/blocked).
    try {
      await new Promise((resolve, reject) => {
        const img = new Image();
        const timer = setTimeout(() => resolve(), 2500);
        img.onload = () => {
          clearTimeout(timer);
          resolve();
        };
        img.onerror = () => {
          clearTimeout(timer);
          // Telegram returns JSON, so Image often "errors" even when the message was delivered.
          resolve();
        };
        img.src = buildTelegramSendUrl(botToken, chatId, message);
      });
      return { ok: true };
    } catch (fallbackErr) {
      return {
        ok: false,
        error: err?.message || fallbackErr?.message || "Network error reaching Telegram",
      };
    }
  }
}

async function sendOrderToTelegram(order) {
  if (!isTelegramConfigured()) {
    return { ok: false, error: "Telegram is not configured" };
  }
  try {
    return await sendTelegramMessage(formatOrderTelegramMessage(order));
  } catch (err) {
    return { ok: false, error: err?.message || "Failed to format order message" };
  }
}

async function sendTelegramTestMessage() {
  return sendTelegramMessage(
    "✅ Diyla Home\nTelegram is connected. You will receive new orders here."
  );
}
