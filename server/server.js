// server.js — Express backend for AI suggestions + Multilingual Personal Assistant
require('dotenv').config();
const express = require('express');
// const bodyParser = require('body-parser');
const cors = require('cors');
const https = require('https');
const rateLimit = require('express-rate-limit');
const mongoose = require("mongoose");
const queryRoutes = require("./routes/queryRoutes");
const app = express();


// 🔐 Validate Gemini API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("❌ FATAL: GEMINI_API_KEY missing in .env!");
  console.error("→ Create .env file with: GEMINI_API_KEY=your_actual_key");
  process.exit(1);
}
console.log("✅ GEMINI_API_KEY loaded.");

// 🌐 CORS: Allow trusted origins
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://localhost:3000',
  // Add production domains later:
  // 'https://yourdomain.com'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
// app.use(express.json());
// app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));


// 🛡 Rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "🧘 Too many requests. Please pause and reflect.",
  standardHeaders: true,
  legacyHeaders: false,
});
console.log("Loaded MONGO_URI:", process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Atlas Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

app.use("/api", queryRoutes);  

// ================================
// 🌐 IMPROVED Language Detection
// ================================
function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'en-US';
  const clean = text.trim();
  if (clean === '') return 'en-US';

  const lower = clean.toLowerCase();

  // ✅ 1. Script-based detection (most reliable)
  if (/[ऀ-ॿ]/.test(text)) return 'hi-IN';     // Devanagari → Hindi
  if (/[অ-৾]/.test(text)) return 'bn-IN';     // Bengali
  if (/[ཀ-ྼༀ-ཿ]/.test(text)) return 'bo-IN';  // Tibetan
  if (/[一-龯]/.test(text)) return 'zh-CN';   // Chinese
  if (/[가-힣]/.test(text)) return 'ko-KR';   // Korean
  if (/[ぁ-んァ-ン]/.test(text)) return 'ja-JP'; // Japanese
  if (/[\u0600-\u06FF]/.test(text)) return 'ar-SA'; // Arabic
  if (/[а-яёА-ЯЁ]/.test(text)) return 'ru-RU';     // Russian (include ё and uppercase)

  // ✅ 2. Latin-script languages (require word boundaries)
  if (/(^|\s)(hola|gracias|por favor)($|\s)/i.test(lower)) return 'es-ES';
  if (/(^|\s)(bonjour|merci|s'il vous plaît)($|\s)/i.test(lower)) return 'fr-FR';
  if (/(^|\s)(hallo|danke|bitte)($|\s)/i.test(lower)) return 'de-DE';
  if (/(^|\s)(olá|obrigado)($|\s)/i.test(lower)) return 'pt-BR';
  if (/(^|\s)(ciao|grazie|per favore)($|\s)/i.test(lower)) return 'it-IT';

  // ✅ 3. Hinglish: Must have Hindi words AND length > 3
  const hasHindiWords = /(?:hai|ho|raha|kya|kyun|kahan|kaise|mat|na|bhi|to|aur|lekin|par|agar|tab|isliye|kyunki|dikha|jana|sab|karo|chahiye)/.test(lower);
  if (hasHindiWords && clean.length > 3 && /[a-zA-Z]/.test(text)) {
    return 'hi-IN';
  }

  // ✅ 4. Common short English words → force English
  if (/^(hi|hello|hey|ok|okay|yes|no|thanks|thank you|please|help|sorry|bye|goodbye|namaste)$/i.test(clean)) {
    return 'en-US';
  }

  return 'en-US';
}

app.post('/detect-language', (req, res) => {
  const { text } = req.body;
  const langCode = detectLanguage(text);
  console.log(`[LANG] "${String(text || '').substring(0, 30)}..." → ${langCode}`);
  res.json({ languageCode: langCode });
});

// ================================
// 🌍 Language Instruction Mapper
// ================================
function getLanguageInstruction(langCode) {
  const map = {
    'hi-IN': 'Hindi (hi-IN) using Devanagari script',
    'ne-NP': 'Nepali (ne-NP) using Devanagari script',
    'bo-IN': 'Tibetan (bo-IN) using Tibetan script',
    'bn-IN': 'Bengali (bn-IN) using Bengali script',
    'es-ES': 'Spanish (es-ES)',
    'fr-FR': 'French (fr-FR)',
    'de-DE': 'German (de-DE)',
    'pt-BR': 'Portuguese (pt-BR)',
    'ja-JP': 'Japanese (ja-JP)',
    'ko-KR': 'Korean (ko-KR)',
    'zh-CN': 'Chinese (zh-CN)',
    'ar-SA': 'Arabic (ar-SA) using Arabic script',
    'ru-RU': 'Russian (ru-RU)',
    'it-IT': 'Italian (it-IT)',
    'en-US': 'English (en-US)'
  };
  return map[langCode] || 'English (en-US)';
}

// ================================
// 🤖 Gemini API Caller (v1) — RESTORED TO YOUR ORIGINAL LOGIC
// ================================
function callGemini(prompt, res) {
  const postData = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }]
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    // 🔥 RESTORED: Use /v1 for gemini-2.5-flash (your original model)
    path: `/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (apiRes) => {
    let data = '';
    apiRes.on('data', (chunk) => { data += chunk; });
    apiRes.on('end', () => {
      console.log(`[Gemini] Status: ${apiRes.statusCode}`);

      if (apiRes.statusCode !== 200) {
        try {
          const err = JSON.parse(data);
          console.error("[Gemini Error]:", err.error?.message || data);
        } catch (e) {
          console.error("[HTTP Error]:", data);
        }
        return res.status(500).json({ answer: "I'm having trouble connecting. Please try again." });
      }

      try {
        const parsed = JSON.parse(data);

        if (parsed.error) {
          console.error("[API Error]:", parsed.error);
          return res.json({ answer: "I can't assist with that." });
        }

        const promptFeedback = parsed.promptFeedback;
        if (promptFeedback?.blockReason) {
          console.warn("[Blocked] Reason:", promptFeedback.blockReason);
          return res.json({ answer: "I'm not qualified to advise on that." });
        }

        const answer = parsed.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!answer) {
          console.warn("[No Answer]:", parsed);
          return res.json({ answer: "I'm not sure how to help with that." });
        }

        const clean = answer
          .replace(/^["'\s]+|["'\s]+$/g, '')
          .replace(/\n+/g, ' ')
          .trim() || "I'm reflecting on your question.";

        res.json({ answer: clean });
      } catch (err) {
        console.error("[Parse Error]:", err.message);
        res.status(500).json({ answer: "Unexpected response format." });
      }
    });
  });

  req.on('error', (e) => {
    console.error("[Network Error]:", e.message);
    res.status(500).json({ answer: "Connection failed. Please check your network." });
  });

  req.write(postData);
  req.end();
}

// ================================
// 💬 Assistant Endpoint — ENHANCED FOR CAREER CONTEXT
// ================================
app.post('/ask', apiLimiter, (req, res) => {
  const { question, languageCode } = req.body;

  if (!question || typeof question !== 'string' || question.trim() === '') {
    return res.status(400).json({ answer: "Please ask a valid question." });
  }

  const cleanQuestion = question.trim().substring(0, 1000);
  const detectedLang = languageCode || detectLanguage(cleanQuestion);
  const languageInstruction = getLanguageInstruction(detectedLang);

  console.log(`[ASK] Question: "${cleanQuestion}"`);
  console.log(`[ASK] Language: ${detectedLang} → ${languageInstruction}`);

  // ✅ RESTORED YOUR ORIGINAL PROMPT STRUCTURE — only enhanced with career focus
  const prompt = `
You are a helpful assistant for personal and professional growth.
Provide practical, concise advice (1–4 sentences) on career, communication, mindfulness, or productivity.

STRICT RULE: Your entire response must be in ${languageInstruction}. Do not use any other language, not even a single word.

Never give medical, legal, or financial advice.
If unsure or unsafe, respond with: "I'm not qualified to advise on that."

Question: ${cleanQuestion}
`;

  callGemini(prompt, res);
});

// ================================
// 📄 Resume Suggestion Endpoint — UNCHANGED
// ================================
app.post('/api/gemini-suggest', apiLimiter, (req, res) => {
  const userText = (req.body.text || '').trim();
  if (!userText) {
    return res.status(400).json({ error: 'No text provided' });
  }

  const cleanText = userText.substring(0, 2000);
  const prompt = `Improve grammar, clarity, and professionalism for this resume snippet:\n\n${cleanText}`;
  callGemini(prompt, res);
});

// ================================
// 🚀 Start Server
// ================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`✨ Endpoints: POST /ask, POST /detect-language, POST /api/gemini-suggest`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
});
