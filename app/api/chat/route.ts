import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { systemInstruction } from "@/lib/qna";

const MODEL = "gemini-3.5-flash";
const MAX_MESSAGES = 12;
const MAX_CHARS = 500;

interface ChatMessage {
  from: "bot" | "user";
  text: string;
}

function parseMessages(body: unknown): ChatMessage[] | null {
  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw)) return null;

  const messages = raw
    .filter(
      (m): m is ChatMessage =>
        (m?.from === "user" || m?.from === "bot") && typeof m?.text === "string" && m.text.trim() !== "",
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({ from: m.from, text: m.text.slice(0, MAX_CHARS) }));

  // Gemini yêu cầu lượt cuối là của người dùng.
  if (messages.length === 0 || messages[messages.length - 1].from !== "user") return null;
  return messages;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_Key;
  if (!apiKey) {
    return Response.json({ error: "Chưa cấu hình GEMINI_API_Key trong file .env." }, { status: 500 });
  }

  const messages = parseMessages(await request.json().catch(() => null));
  if (!messages) {
    return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  // Bỏ lời chào ban đầu của bot (lượt đầu không phải của người dùng) để lịch sử bắt đầu từ người dùng.
  const firstUser = messages.findIndex((m) => m.from === "user");
  const contents = messages.slice(firstUser).map((m) => ({
    role: m.from === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.2,
        // Phần "suy nghĩ" của model cũng tính vào maxOutputTokens, nên để rộng và giảm suy nghĩ xuống tối thiểu,
        // nếu không câu trả lời sẽ bị cắt giữa chừng.
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return Response.json({ error: "Gemini không trả về nội dung." }, { status: 502 });
    }
    return Response.json({ reply: text });
  } catch (err) {
    console.error("Gemini error:", err);
    return Response.json({ error: "Không gọi được Gemini lúc này." }, { status: 502 });
  }
}
