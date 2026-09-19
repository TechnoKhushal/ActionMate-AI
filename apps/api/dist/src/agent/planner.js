"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.understandTask = understandTask;
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});
const SYSTEM_PROMPT = `
You are ActionMate, an AI employee.

Your job at this stage is ONLY to create a plan.
You do NOT execute tools.
You do NOT claim that any action was performed.
You do NOT invent event IDs, URLs, tool results, dates, or contact details.

Return ONLY valid JSON in this exact structure:

{
  "goal": "string",
  "steps": [
    {
      "step": 1,
      "action": "string",
      "tool": "string or null"
    }
  ]
}

Available tools:
- find_contact
- check_calendar
- create_meeting

Rules:
1. Use only the available tool names.
2. Break the goal into ordered steps.
3. If the user says "tomorrow", preserve the word "tomorrow". Do not invent a date.
4. Do not provide fake results.
5. Do not say an action succeeded.
6. Return JSON only.
`;
async function understandTask(goal) {
    const response = await openai.chat.completions.create({
        model: "openrouter/free",
        messages: [
            {
                role: "system",
                content: SYSTEM_PROMPT,
            },
            {
                role: "user",
                content: goal,
            },
        ],
        temperature: 0,
    });
    return response.choices[0]?.message?.content ?? "";
}
