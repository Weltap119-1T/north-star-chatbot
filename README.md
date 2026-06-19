# 🌲 North Star Support Bot

A customer support chatbot for North Star Gear — an outdoor apparel and camping gear e-commerce brand. Built as part of the Upwork Talent Accelerator: AI Chatbot Developer project.

## Features

- **Order Tracking** — Look up orders #111, #222, #333 with simulated statuses
- **Returns & Exchanges** — Policy explanation and returns portal link
- **Product Recommendations** — Activity-based product suggestions via 2-question flow
- **Human Handoff** — Graceful escalation to live agent state
- **Fallback Handling** — Clear unrecognised input responses with menu recovery
- **Intent Recognition** — Keyword/pattern-based classifier handling natural language variations

## Setup

**Requirements:** Node.js 18+

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Or build and run
npm run build && npm start
```

Then open: [http://localhost:3000](http://localhost:3000)

## Demo Test Cases

Use these to test all required scenarios:

| Scenario | Input to try |
|---|---|
| Order tracking (shipped) | "Where is my order?" → enter `111` |
| Order tracking (processing) | "Track my package" → enter `222` |
| Order tracking (delivered) | "Has my order arrived?" → enter `333` |
| Invalid order | Any other number e.g. `999` |
| Returns | "I want to return something" |
| Product recommendation | "I need some gear" |
| Human handoff | "I want to speak to a human" |
| Fallback | "asdfghjkl" |
| Return to menu | "menu" or "start over" |

## Project Structure

```
src/
├── server.ts          # Express server & API routes
├── chatbot.ts         # Conversation state machine
├── types.ts           # TypeScript type definitions
├── intents/
│   └── index.ts       # Intent classifier & extractors
└── data/
    └── mockData.ts    # Orders, return policy, products

public/
└── index.html         # Chat UI (self-contained)
```

## Architecture

- **Backend:** Node.js + Express + TypeScript
- **Intent Recognition:** Regex pattern matching — no external API dependency
- **State Machine:** Session-based conversation flow with 6 states
- **Frontend:** Vanilla JS chat interface, no build step required

## Deliverables

- ✅ Working chatbot (this repository)
- ✅ All 4 core use cases covered
- ✅ Fallback handling implemented
- ✅ Mock order data (#111, #222, #333)
- ✅ Return policy and shipping info
- ✅ Human handoff flow
- ✅ Video demo (see submission document)
