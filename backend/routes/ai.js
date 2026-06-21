const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/authMiddleware');
const CarbonFootprint = require('../models/CarbonFootprint');
const Challenge = require('../models/Challenge');
const User = require('../models/User');

/* ─────────────────────────────────────────────────────────────────────────────
   STATIC DATA — used both by Gemini system prompt and local fallback
───────────────────────────────────────────────────────────────────────────── */

const TRIVIA_QUESTIONS = [
  {
    question: "Which greenhouse gas is released in large quantities by decaying organic waste in landfills?",
    options: ["Carbon Dioxide (CO2)", "Methane (CH4)", "Nitrous Oxide (N2O)", "Sulfur Hexafluoride (SF6)"],
    correct: "Methane (CH4)",
    explanation: "Organic waste in landfills decomposes under anaerobic conditions, releasing methane — a gas 28× more potent than CO₂ over 100 years."
  },
  {
    question: "What percentage of global greenhouse gas emissions comes from food production and agriculture?",
    options: ["Roughly 10%", "Roughly 26%", "Roughly 45%", "Roughly 60%"],
    correct: "Roughly 26%",
    explanation: "Food production accounts for about 26% of global GHG emissions, including land-use changes, livestock, and supply chains."
  },
  {
    question: "Which renewable energy source historically accounts for the largest share of global electricity generation?",
    options: ["Solar PV", "Wind Energy", "Hydroelectric Power", "Geothermal Power"],
    correct: "Hydroelectric Power",
    explanation: "Hydroelectric power generates about 16% of the world's electricity and remains the largest renewable source globally."
  },
  {
    question: "What is the primary objective of the international Paris Agreement?",
    options: ["Eliminate all plastic usage by 2030", "Limit global warming to well below 2°C, preferably to 1.5°C", "Mandate solar panels on all school roofs", "Tax global shipping containers"],
    correct: "Limit global warming to well below 2°C, preferably to 1.5°C",
    explanation: "The Paris Agreement, adopted in 2015, is a legally binding treaty aiming to keep global temperature rise to 1.5°C above pre-industrial levels."
  }
];

const AI_CHALLENGES = [
  { title: "Appliance Terminator", description: "Unplug all standby home electronics (TV, PC, microwave, chargers) before sleep to eliminate standby power loss.", points: 15, icon: "🔌" },
  { title: "Zero-Waste Chef", description: "Prepare a meal from local organic ingredients, use peels for compost, and generate zero food waste.", points: 20, icon: "🥗" },
  { title: "Shower Speedrun", description: "Limit your shower to under 4 minutes today. Save 20-30 liters of heated water!", points: 15, icon: "💧" },
  { title: "Single-Use Plastic Ban", description: "Use zero single-use plastic bags, bottles, or straws for the next 48 hours.", points: 20, icon: "🚫" },
  { title: "Cycle & Walk Commute", description: "Walk, jog, or cycle for any trips under 3 km instead of using a motorized vehicle.", points: 18, icon: "🚲" }
];

/* ─────────────────────────────────────────────────────────────────────────────
   GEMINI API HELPER
───────────────────────────────────────────────────────────────────────────── */

/**
 * Calls the Gemini 1.5 Flash REST API with a system context and user message.
 * Returns the raw text response from the model.
 */
async function callGemini(systemContext, userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: `${systemContext}\n\n---\nUser message: ${userMessage}` }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800,
    }
  };

  const response = await axios.post(url, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: 15000
  });

  const candidate = response.data?.candidates?.[0];
  if (!candidate) throw new Error("No candidate returned from Gemini");
  return candidate.content?.parts?.[0]?.text || "";
}

/**
 * Builds the personalized system prompt injected into every Gemini call.
 */
function buildSystemPrompt(user, footprint) {
  const name = user?.name || "Eco Learner";
  const points = user?.ecoPoints || 0;
  const streak = user?.streak?.currentStreak || 0;

  let footprintSection = "No carbon footprint has been calculated yet for this user.";
  if (footprint) {
    footprintSection = `Latest Carbon Footprint (logged ${new Date(footprint.createdAt).toLocaleDateString()}):
- Total: ${footprint.totalEmissions} tCO2e/year
- Travel: ${footprint.travelEmissions} tCO2e
- Energy: ${footprint.energyEmissions} tCO2e
- Diet: ${footprint.dietEmissions} tCO2e
- Waste: ${footprint.wasteEmissions} tCO2e`;
  }

  return `You are the AI Eco-Advisor for GreenSpark, a sustainability education platform. You are speaking with ${name}.

USER PROFILE:
- Name: ${name}
- Eco Points: ${points}
- Current Streak: ${streak} days
- ${footprintSection}

PLATFORM CONTEXT:
- GreenSpark has a Carbon Tracker, Renewable Energy Grid Simulator, Direct Air Capture Simulator, and a Waste-to-Energy Bioreactor Simulator.
- Users earn points by completing daily challenges and simulator missions.

YOUR ROLE:
- Provide expert, personalized, evidence-based sustainability advice.
- Use markdown for clear formatting (headers, bold, bullet points).
- Be encouraging, specific, and action-oriented.
- Reference the user's actual data (name, footprint, streak) whenever relevant.
- Keep responses concise but substantive (200-400 words max).

SPECIAL INSTRUCTIONS — use these tags EXACTLY when relevant:
1. If the user asks for a challenge or task, end your response with:
   [CHALLENGE_RECOMMENDED] {"title":"...","description":"...","points":15,"icon":"🌿"}
   (Generate a creative, personalized challenge based on their highest emission category if known.)

2. If the user asks for trivia, a quiz, or a test, end your response with:
   [TRIVIA_RECOMMENDED] {"question":"...","options":["A","B","C","D"],"correct":"A","explanation":"..."}
   (Generate a relevant climate/sustainability trivia question.)

Always respond in a helpful, expert, yet friendly tone. Do NOT use these tags unless the user explicitly asks for a challenge or trivia.`;
}

/**
 * Parses [CHALLENGE_RECOMMENDED] or [TRIVIA_RECOMMENDED] tags from Gemini output.
 * Returns { cleanText, attachment }.
 */
function parseGeminiResponse(rawText) {
  let cleanText = rawText;
  let attachment = null;

  // Match challenge tag
  const challengeMatch = rawText.match(/\[CHALLENGE_RECOMMENDED\]\s*(\{[\s\S]*?\})/);
  if (challengeMatch) {
    try {
      const data = JSON.parse(challengeMatch[1]);
      attachment = { type: 'challenge', data };
      cleanText = rawText.replace(challengeMatch[0], '').trim();
    } catch (e) { /* ignore parse errors, keep raw text */ }
  }

  // Match trivia tag
  const triviaMatch = rawText.match(/\[TRIVIA_RECOMMENDED\]\s*(\{[\s\S]*?\})/);
  if (triviaMatch) {
    try {
      const data = JSON.parse(triviaMatch[1]);
      attachment = { type: 'trivia', data };
      cleanText = rawText.replace(triviaMatch[0], '').trim();
    } catch (e) { /* ignore parse errors */ }
  }

  return { cleanText, attachment };
}

/* ─────────────────────────────────────────────────────────────────────────────
   LOCAL FALLBACK ENGINE (unchanged from previous version)
   Used when GEMINI_API_KEY is missing or Gemini API call fails.
───────────────────────────────────────────────────────────────────────────── */

function localFallbackResponse(lowerMessage, user, footprint) {
  let responseText = "";
  let attachment = null;

  if (lowerMessage.includes('analyze') || lowerMessage.includes('footprint') || lowerMessage.includes('carbon')) {
    if (!footprint) {
      responseText = "I checked my databases, but **I don't see any carbon footprint calculation for you yet!** 🌍\n\nHead over to the **Carbon Tracker** tab, enter your details, and click **Calculate**. Then ask me to analyze it for a personalized breakdown!";
    } else {
      const { totalEmissions, travelEmissions, energyEmissions, wasteEmissions, dietEmissions } = footprint;
      const categories = [
        { name: 'Travel', value: travelEmissions, tip: 'shifting to public transit, carpooling, or cycling' },
        { name: 'Home Energy', value: energyEmissions, tip: 'upgrading to energy-efficient appliances or solar' },
        { name: 'Waste', value: wasteEmissions, tip: 'boosting recycling and composting food waste' },
        { name: 'Diet', value: dietEmissions, tip: 'introducing more plant-based meals weekly' }
      ].sort((a, b) => b.value - a.value)[0];

      responseText = `### 🧠 Carbon Footprint Analysis\nYour annual footprint is **${totalEmissions} tCO2e**.\n\n- 🚗 Travel: ${travelEmissions} tCO2e\n- ⚡ Energy: ${energyEmissions} tCO2e\n- 🍔 Diet: ${dietEmissions} tCO2e\n- 🗑️ Waste: ${wasteEmissions} tCO2e\n\n🎯 **Top recommendation:** Your highest category is **${categories.name}**. Try **${categories.tip}** to reduce it quickly.`;
    }
  } else if (lowerMessage.includes('challenge') || lowerMessage.includes('task') || lowerMessage.includes('something to do')) {
    const ch = AI_CHALLENGES[Math.floor(Math.random() * AI_CHALLENGES.length)];
    responseText = `### 🎯 Custom Challenge Generated!\n**${ch.icon} ${ch.title}**\n${ch.description}\n\n**Reward:** +${ch.points} Eco Points — click below to accept!`;
    attachment = { type: 'challenge', data: ch };
  } else if (lowerMessage.includes('trivia') || lowerMessage.includes('quiz') || lowerMessage.includes('question')) {
    const q = TRIVIA_QUESTIONS[Math.floor(Math.random() * TRIVIA_QUESTIONS.length)];
    responseText = `### ❓ Climate Trivia\n**${q.question}**\n\nChoose your answer below:`;
    attachment = { type: 'trivia', data: q };
  } else if (lowerMessage.includes('recycle') || lowerMessage.includes('plastic') || lowerMessage.includes('waste')) {
    responseText = `### ♻️ Waste & Recycling Tips\n1. **Segregate** wet (food) from dry (paper/plastic) waste at home.\n2. **Compost** kitchen organics to create premium garden fertilizer.\n3. **Avoid single-use:** canvas bags, glass containers, metal straws.\n4. **Learn local rules** on which plastics (PET 1, HDPE 2) are recyclable in your area.`;
  } else if (lowerMessage.includes('electricity') || lowerMessage.includes('energy') || lowerMessage.includes('solar')) {
    responseText = `### ⚡ Smart Energy Saving\n1. **Unplug standby devices** — vampire load wastes up to 10% of energy bills.\n2. **Switch to LED** — 75% less energy, 25× longer life.\n3. **Set AC to 24°C** — every degree lower raises power draw by 6%.\n4. **Use natural light** and ventilation wherever possible.`;
  } else if (lowerMessage.includes('point') || lowerMessage.includes('badge') || lowerMessage.includes('certificate')) {
    responseText = `### 🏅 Points & Badge Guide\n- **Challenges:** 15-25 points each\n- **Daily Tracker:** Up to 20 points/day\n- **Lessons & Quizzes:** 10 points per lesson\n- **Certificates:** Eco Starter 🥉 at 50pts · Eco Hero 🥈 at 100pts · Eco Champion 🥇 at 200pts`;
  } else {
    responseText = `### 🌿 Hello! I'm your AI Eco-Advisor.\nHere's what I can do:\n1. **"Analyze my carbon footprint"** — personalized reduction blueprint\n2. **"Generate a challenge"** — accept it straight to your dashboard\n3. **"Start a trivia quiz"** — test your climate knowledge\n4. Ask anything like **"how do I save energy?"** for expert tips!\n\nHow can I help you today?`;
  }

  return { responseText, attachment };
}

/* ─────────────────────────────────────────────────────────────────────────────
   ROUTES
───────────────────────────────────────────────────────────────────────────── */

/**
 * @route   POST /api/ai/chat
 * @desc    Submit a user message. Uses live Gemini LLM if key is present, falls back to rule-based engine.
 * @access  Private
 */
router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required.' });

    const userId = req.user.id;
    const user = await User.findById(userId);
    const footprint = await CarbonFootprint.findOne({ userId }).sort({ createdAt: -1 });

    let responseText = "";
    let attachment = null;

    // ── GEMINI PATH ──────────────────────────────────────────────────────────
    if (process.env.GEMINI_API_KEY) {
      try {
        const systemContext = buildSystemPrompt(user, footprint);
        const rawGeminiText = await callGemini(systemContext, message);
        const parsed = parseGeminiResponse(rawGeminiText);
        responseText = parsed.cleanText;
        attachment = parsed.attachment;
      } catch (geminiErr) {
        console.warn("⚠️ Gemini API failed, falling back to local engine:", geminiErr.message);
        // Fall through to local fallback
        const fallback = localFallbackResponse(message.toLowerCase().trim(), user, footprint);
        responseText = fallback.responseText;
        attachment = fallback.attachment;
      }
    } else {
      // ── LOCAL FALLBACK PATH ────────────────────────────────────────────────
      console.log("ℹ️  GEMINI_API_KEY not set — using local rule-based engine.");
      const fallback = localFallbackResponse(message.toLowerCase().trim(), user, footprint);
      responseText = fallback.responseText;
      attachment = fallback.attachment;
    }

    res.json({
      message: responseText,
      attachment,
      userPoints: user.ecoPoints,
      userStreak: user.streak?.currentStreak || 0
    });

  } catch (err) {
    console.error("Error in AI chat handler:", err);
    res.status(500).json({ error: 'Server error in AI Advisor.' });
  }
});

/**
 * @route   POST /api/ai/accept-challenge
 * @desc    Accept an AI-generated challenge and insert it into the global challenge list
 * @access  Private
 */
router.post('/accept-challenge', auth, async (req, res) => {
  try {
    const { title, description, points, icon } = req.body;
    if (!title || !points) return res.status(400).json({ message: 'Challenge details are incomplete.' });

    let challenge = await Challenge.findOne({ title });
    if (!challenge) {
      challenge = new Challenge({ title, description, points, icon: icon || '🌍' });
      await challenge.save();
    }

    res.status(201).json({ message: 'AI challenge accepted and populated globally!', challenge });
  } catch (err) {
    console.error("Error accepting AI challenge:", err);
    res.status(500).json({ error: 'Server error while accepting challenge.' });
  }
});

module.exports = router;
