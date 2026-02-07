# Masderiv Chatbot

Next.js chatbot UI with a configurable API base URL.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Optional: set the API base URL:
   ```bash
   echo "NEXT_PUBLIC_CHATBOT_API_URL=https://hr-rag-1v1j.onrender.com" > .env.local
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```

## Notes

- The UI calls `POST /chat` on the API base URL.
- Health status checks `GET /healthz`.
