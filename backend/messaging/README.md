# 📬 Telegram Bot Integration – Demo

This module sends messages to a Telegram channel through a simple Django API endpoint.  
It serves as the base for connecting scraped trading signals to Telegram.

---

## ✅ Features Implemented

- Telegram bot integration using `python-requests`
- API endpoint: `/api/telegram/send-alert/`
- Accepts `POST` requests with a `message` payload
- Uses `.env` variables for bot credentials
- Includes a management command for internal testing

---

## 📁 Structure

```
messaging/
├── services/
│   └── telegram_bot.py       # Telegram message sending logic
├── views.py                  # API endpoint logic
├── urls.py                   # Endpoint routing
├── management/
│   └── commands/
│       └── test_telegram.py  # CLI command to test message sending
```

---

## 🛠️ How It Works

1. The Telegram bot token and chat ID are stored in a `.env` file:
   ```env
   TELEGRAM_BOT_TOKEN=your-bot-token-here
   TELEGRAM_CHAT_ID=your-channel-id-here
   ```

2. Make a POST request to the endpoint:
   ```
   http://localhost:8000/api/telegram/send-alert/
   ```

   With a JSON payload:
   ```json
   {
     "message": "📢 Test signal sent from API."
   }
   ```

3. The bot sends the message to the Telegram channel.

---

## 🧪 Test via CLI

You can also test the bot locally with a dummy message using:

```bash
python manage.py test_telegram
```

---

## 🔌 Notes for Next Steps

- Once scraping endpoints are available, they will be plugged into this bot.