const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_TOKEN;
const CHAT_ID = import.meta.env.VITE_MY_CHAT_ID;

export const sendTelegramMessage = async (text) => {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("Telegram Token or Chat ID is missing in .env file");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      }),
    });
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
  }
};

export const getTelegramUpdates = async (offset) => {
  if (!BOT_TOKEN) return [];

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=0`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.ok) {
      return data.result;
    }
    return [];
  } catch (error) {
    console.error("Failed to get updates:", error);
    return [];
  }
};