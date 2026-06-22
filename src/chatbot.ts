import { randomUUID } from 'crypto';
import { Session, ConversationState, ChatResponse } from './types';
import { classifyIntent, extractOrderNumber, extractActivityKeyword } from './intents/index';
import { ORDERS, RETURN_POLICY, PRODUCT_CATEGORIES } from './data/mockData';

const sessions = new Map<string, Session>();

const MAIN_MENU_OPTIONS = [
  '📦 Track my order',
  '🔄 Returns & exchanges',
  '🏕️ Product recommendations',
  '🚚 Shipping information',
  '🧑 Talk to a human',
];

function getSession(sessionId: string): Session {
  let session = sessions.get(sessionId);
  if (!session) {
    session = {
      id: sessionId,
      state: 'IDLE',
      context: {},
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    sessions.set(sessionId, session);
  }
  session.lastActivity = new Date();
  return session;
}

function respond(
  session: Session,
  message: string,
  newState: ConversationState,
  options?: string[]
): ChatResponse {
  session.state = newState;
  return { sessionId: session.id, message, state: newState, options };
}

export function createSession(): string {
  const id = randomUUID();
  getSession(id);
  return id;
}

export function processMessage(sessionId: string, userMessage: string): ChatResponse {
  const session = getSession(sessionId);
  const text = userMessage.trim();

  // Global escape: user explicitly wants main menu
  if (/\b(menu|start over|restart|main menu|go back|back)\b/i.test(text)) {
    return respond(session, getWelcomeMessage(), 'IDLE', MAIN_MENU_OPTIONS);
  }

  switch (session.state) {
    case 'IDLE':
      return handleIdle(session, text);

    case 'AWAITING_ORDER_NUMBER':
      return handleOrderNumber(session, text);

    case 'AWAITING_RETURN_DETAIL':
      return handleReturnDetail(session, text);

    case 'AWAITING_PRODUCT_USE':
      return handleProductUse(session, text);

    case 'AWAITING_PRODUCT_CONDITIONS':
      return handleProductConditions(session, text);

    case 'HUMAN_HANDOFF':
      return handleHumanHandoff(session, text);

    case 'LIVE_AGENT':
      return handleLiveAgent(session, text);

    case 'RESOLVED':
      return handleResolved(session, text);

    default:
      return respond(session, getWelcomeMessage(), 'IDLE', MAIN_MENU_OPTIONS);
  }
}

function handleIdle(session: Session, text: string): ChatResponse {
  const intent = classifyIntent(text);

  if (intent !== 'FALLBACK') {
    session.context.fallbackCount = '0';
  }

  switch (intent) {
    case 'GREETING':
      return respond(session, getWelcomeMessage(), 'IDLE', MAIN_MENU_OPTIONS);

    case 'ORDER_TRACKING': {
      const orderNum = extractOrderNumber(text);
      if (orderNum) return lookUpOrder(session, orderNum);
      return respond(
        session,
        "I can help you track your order! 🔍 What's your order number? (e.g. 111, 222, or 333)",
        'AWAITING_ORDER_NUMBER'
      );
    }

    case 'RETURNS':
      return respond(
        session,
        `Happy to help with a return or exchange! 🔄\n\n${RETURN_POLICY.summary}\n\nDo you need help starting a return for a specific order?`,
        'AWAITING_RETURN_DETAIL',
        ['Yes, I have an order to return', 'No, just needed the policy', 'Back to menu']
      );

    case 'PRODUCT_RECOMMENDATION':
      return respond(
        session,
        "I'd love to help you find the right gear! 🏕️ What activity are you shopping for?",
        'AWAITING_PRODUCT_USE',
        ['Hiking / Trekking', 'Camping', 'Climbing', 'Winter sports', 'Something else']
      );

    case 'SHIPPING':
      return respond(
        session,
        "We offer two shipping options:\n\n" +
          "📦 **Standard**: 3–5 business days\n" +
          "⚡ **Expedited**: 1–2 business days\n\n" +
          "Expedited shipping is available at checkout. " +
          "Is there anything else I can help you with?",
        'RESOLVED',
        ['Track my order', 'Back to menu']
      );

    case 'HUMAN_HANDOFF':
      return initiateHandoff(session);

    case 'FALLBACK':
    default: {
      const count = parseInt(session.context.fallbackCount || '0', 10) + 1;
      session.context.fallbackCount = String(count);

      if (count >= 2) {
        session.context.fallbackCount = '0';
        return initiateHandoff(
          session,
          "I'm having trouble understanding. Let me connect you with a live agent who can help. 🧑‍💼"
        );
      }

      return respond(
        session,
        "I didn't understand that. Here's what I can help with — or I can connect you with a live agent:",
        'IDLE',
        [...MAIN_MENU_OPTIONS, '🧑 Connect me to a live agent']
      );
    }
  }
}

function handleOrderNumber(session: Session, text: string): ChatResponse {
  const orderNum = extractOrderNumber(text);
  if (!orderNum) {
    return respond(
      session,
      "I need a valid order number to look that up. Could you share the order number? It should be a 3-digit number like 111, 222, or 333.",
      'AWAITING_ORDER_NUMBER'
    );
  }
  return lookUpOrder(session, orderNum);
}

function lookUpOrder(session: Session, orderNum: string): ChatResponse {
  const order = ORDERS[orderNum];
  if (!order) {
    return respond(
      session,
      `I couldn't find an order with number #${orderNum}. Please double-check the number — it should appear in your confirmation email.\n\nWant to try a different order number or get more help?`,
      'IDLE',
      ['Try a different order number', 'Talk to a human', 'Back to menu']
    );
  }

  const message = order.followUp
    ? `${order.detail}\n\n${order.followUp}`
    : `${order.detail}\n\nIs there anything else I can help you with?`;

  return respond(session, message, 'RESOLVED', ['Yes, I need more help', 'Back to menu']);
}

function handleReturnDetail(session: Session, text: string): ChatResponse {
  if (/\b(no|just needed|policy only|nope)\b/i.test(text) || text.includes('No, just needed')) {
    return respond(
      session,
      "No problem! If you ever need to start a return, just come back and I'll walk you through it. 😊\n\nAnything else I can help with?",
      'RESOLVED',
      ['Yes, more help needed', 'Back to menu']
    );
  }
  if (/\b(yes|yeah|yep|sure|please|ok)\b/i.test(text) || text.includes('Yes, I have')) {
    return respond(
      session,
      `To start your return, head to our returns portal:\n👉 ${RETURN_POLICY.link}\n\nYou'll need your order number and email address. Returns must be initiated within **${RETURN_POLICY.window}**, with items **${RETURN_POLICY.condition}**.\n\nWould you like anything else?`,
      'RESOLVED',
      ['Yes, more help needed', 'Back to menu']
    );
  }
  return respond(
    session,
    "I didn't quite catch that — do you need help starting a return for a specific order?",
    'AWAITING_RETURN_DETAIL',
    ['Yes, I have an order to return', 'No, just needed the policy', 'Back to menu']
  );
}

function handleProductUse(session: Session, text: string): ChatResponse {
  const activity = extractActivityKeyword(text);
  session.context.activity = activity;

  return respond(
    session,
    `Great choice! 🏔️ For ${activity} gear — are you shopping for mild or more extreme conditions?`,
    'AWAITING_PRODUCT_CONDITIONS',
    ['Mild / casual use', 'Moderate / regular use', 'Extreme / professional use']
  );
}

function handleProductConditions(session: Session, text: string): ChatResponse {
  const activity = session.context.activity || 'general';
  const products = PRODUCT_CATEGORIES[activity] || PRODUCT_CATEGORIES['general'];

  const level = /\b(extreme|professional|pro|serious|hard)\b/i.test(text)
    ? 'top-tier'
    : /\b(moderate|regular|intermediate)\b/i.test(text)
    ? 'mid-range'
    : 'entry-level';

  return respond(
    session,
    `Based on your needs, here are our top ${level} picks for **${activity}**:\n\n${products.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nWould you like more details on any of these, or would you prefer to speak with a gear specialist?`,
    'RESOLVED',
    ['Tell me more about option 1', 'Tell me more about option 2', 'Talk to a gear specialist', 'Back to menu']
  );
}

function handleHumanHandoff(session: Session, text: string): ChatResponse {
  if (/\b(yes|yeah|connect|please|ok|sure)\b/i.test(text)) {
    return respond(
      session,
      "Connecting you now... 🔗\n\n⏳ **You've been placed in the queue.** A live agent will be with you within 2–5 minutes during business hours (Mon–Fri, 9am–6pm ET).\n\nYour session ID for reference: " + session.id.slice(0, 8).toUpperCase(),
      'LIVE_AGENT'
    );
  }
  if (/\b(no|nope|nothing|skip)\b/i.test(text)) {
    return respond(
      session,
      "Connecting you now... 🔗\n\n⏳ **You've been placed in the queue.** A live agent will be with you within 2–5 minutes during business hours (Mon–Fri, 9am–6pm ET).\n\nYour session ID for reference: " + session.id.slice(0, 8).toUpperCase(),
      'LIVE_AGENT'
    );
  }
  return initiateHandoff(session);
}

function handleLiveAgent(session: Session, text: string): ChatResponse {
  if (/\b(menu|start over|restart|main menu|go back|back)\b/i.test(text)) {
    return respond(session, getWelcomeMessage(), 'IDLE', MAIN_MENU_OPTIONS);
  }
  return respond(
    session,
    "You're connected with our live agent queue. An agent will join shortly — please hold. ⏳\n\nType **menu** if you'd like to return to the main menu.",
    'LIVE_AGENT'
  );
}

function initiateHandoff(session: Session, preamble?: string): ChatResponse {
  const message = preamble
    ? `${preamble}\n\nBefore I transfer you, is there anything you'd like me to pass along to the agent?`
    : "No problem — I'll get a live agent for you. 🧑‍💼\n\nBefore I transfer you, is there anything you'd like me to pass along to the agent?";

  return respond(session, message, 'HUMAN_HANDOFF', ["No, just connect me", "Yes, let me add a note"]);
}

function handleResolved(session: Session, text: string): ChatResponse {
  if (/\b(no|nope|done|all set|that's all|thank)\b/i.test(text) && !/\b(yes|more|help|another)\b/i.test(text)) {
    return respond(
      session,
      "Happy to help! Have a great adventure out there. 🌲 Come back anytime.\n\nType anything to start a new conversation.",
      'IDLE',
      MAIN_MENU_OPTIONS
    );
  }

  session.state = 'IDLE';
  return handleIdle(session, text);
}

function getWelcomeMessage(): string {
  return "Hey there! 👋 Welcome to **North Star Support**.\n\nI'm your outdoor gear assistant. What can I help you with today?";
}
