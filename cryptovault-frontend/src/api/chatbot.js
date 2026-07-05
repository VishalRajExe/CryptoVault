import client from './client';

// Maps to com.vishal.controller.ChatBotController. Requires gemini.api.key to
// be configured on the backend (application.properties) - if it isn't, this
// will fail with a 500 and the chat widget shows that as a normal error.
//
// The /chat/bot endpoint returns ResponseEntity<String> — Axios may or may not
// JSON-parse this depending on the Content-Type header the backend sends.
// We normalise the response to always return a plain string.
export const sendChatMessage = async (prompt) => {
  const r = await client.post('/chat/bot', { prompt });
  const data = r.data;

  // If it's already a string, return as-is
  if (typeof data === 'string') return data;

  // If backend wrapped it in an object (ApiResponse, etc.), try known keys
  if (data && typeof data === 'object') {
    return (
      data.message ||
      data.response ||
      data.answer ||
      data.text ||
      data.reply ||
      data.content ||
      data.data ||
      JSON.stringify(data)
    );
  }

  return String(data ?? 'No response received.');
};
