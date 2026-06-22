'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createSession, processMessage } = require('../dist/chatbot');
const { classifyIntent } = require('../dist/intents/index');
const { RETURN_POLICY } = require('../dist/data/mockData');

function chat(messages) {
  const sessionId = createSession();
  return messages.map((message) => processMessage(sessionId, message));
}

function last(responses) {
  return responses[responses.length - 1];
}

describe('SHIPPING intent and responses', () => {
  const shippingQueries = [
    'How long does shipping take?',
    'What shipping options do you have?',
    'Do you offer express delivery?',
    'When will my package arrive?',
  ];

  for (const query of shippingQueries) {
    it(`classifies "${query}" as SHIPPING (not ORDER_TRACKING)`, () => {
      const intent = classifyIntent(query);
      assert.equal(intent, 'SHIPPING', `Expected SHIPPING, got ${intent}`);
      assert.notEqual(intent, 'ORDER_TRACKING');
    });

    it(`responds correctly to "${query}"`, () => {
      const response = last(chat([query]));
      assert.equal(response.state, 'RESOLVED');
      assert.match(response.message, /Standard.*3.5 business days/s);
      assert.match(response.message, /Expedited.*1.2 business days/s);
      assert.deepEqual(response.options, ['Track my order', 'Back to menu']);
    });
  }
});

describe('ORDER TRACKING', () => {
  it('order 111 — shipped, arriving tomorrow', () => {
    const response = last(chat(['Track my order', '111']));
    assert.match(response.message, /shipped/i);
    assert.match(response.message, /tomorrow/i);
    assert.equal(response.state, 'RESOLVED');
  });

  it('order 222 — processing, ships in 24 hours', () => {
    const response = last(chat(['Where is my order?', '222']));
    assert.match(response.message, /processing/i);
    assert.match(response.message, /24 hours/i);
    assert.equal(response.state, 'RESOLVED');
  });

  it('order 333 — delivered with follow-up', () => {
    const response = last(chat(['Has my order arrived?', '333']));
    assert.match(response.message, /delivered/i);
    assert.match(response.message, /good condition|return or exchange/i);
    assert.equal(response.state, 'RESOLVED');
  });

  it('unknown order returns invalid-order response', () => {
    const response = last(chat(['Track my order', '999']));
    assert.match(response.message, /couldn't find an order/i);
    assert.equal(response.state, 'IDLE');
  });
});

describe('RETURNS AND EXCHANGES', () => {
  it('states 30-day returns, unused items, original packaging', () => {
    const response = last(chat(['I want to return something']));
    assert.equal(response.state, 'AWAITING_RETURN_DETAIL');
    assert.match(response.message, /30 days/i);
    assert.match(response.message, /unused/i);
    assert.match(response.message, /original packaging/i);
  });

  it('provides returns portal link when starting a return', () => {
    const response = last(chat(['I want to return something', 'Yes, I have an order to return']));
    assert.match(response.message, new RegExp(RETURN_POLICY.link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.equal(response.state, 'RESOLVED');
  });
});

describe('PRODUCT RECOMMENDATIONS', () => {
  const hikingProducts = /Trail Runner Pro Boots|Trekking Pole Set|Day Hike Backpack/;

  function hikingRecommendations(activityInput) {
    return chat(['I need some gear', activityInput, 'Moderate / regular use']);
  }

  it('asks clarifying questions then recommends category products', () => {
    const responses = chat(['I need some gear', 'trail hiking', 'Moderate / regular use']);
    assert.match(responses[0].message, /activity/i);
    assert.equal(responses[0].state, 'AWAITING_PRODUCT_USE');
    assert.match(responses[1].message, /conditions|mild|extreme/i);
    assert.equal(responses[1].state, 'AWAITING_PRODUCT_CONDITIONS');
    assert.match(responses[2].message, /hiking/i);
    assert.match(responses[2].message, hikingProducts);
    assert.equal(responses[2].state, 'RESOLVED');
  });

  it('maps menu option "Hiking / Trekking" to hiking products', () => {
    const responses = hikingRecommendations('Hiking / Trekking');
    assert.match(responses[1].message, /hiking gear/i);
    assert.match(responses[2].message, /hiking/i);
    assert.match(responses[2].message, hikingProducts);
    assert.equal(responses[2].state, 'RESOLVED');
  });

  it('maps typed "hiking" to hiking products', () => {
    const responses = hikingRecommendations('hiking');
    assert.match(responses[2].message, /hiking/i);
    assert.match(responses[2].message, hikingProducts);
    assert.equal(responses[2].state, 'RESOLVED');
  });

  it('maps typed "trekking" to hiking products', () => {
    const responses = hikingRecommendations('trekking');
    assert.match(responses[2].message, /hiking/i);
    assert.match(responses[2].message, hikingProducts);
    assert.equal(responses[2].state, 'RESOLVED');
  });

  it('maps typed "trail hiking" to hiking products', () => {
    const responses = hikingRecommendations('trail hiking');
    assert.match(responses[2].message, /hiking/i);
    assert.match(responses[2].message, hikingProducts);
    assert.equal(responses[2].state, 'RESOLVED');
  });
});

describe('HUMAN HANDOFF', () => {
  it('reaches LIVE_AGENT after explicit handoff request', () => {
    const responses = chat(['I want to speak to a person', 'No, just connect me']);
    assert.equal(responses[0].state, 'HUMAN_HANDOFF');
    assert.equal(responses[1].state, 'LIVE_AGENT');
    assert.match(responses[1].message, /queue|live agent/i);
  });
});

describe('FALLBACK', () => {
  it('clearly says it did not understand and offers menu or escalation', () => {
    const response = last(chat(['asdfghjkl']));
    assert.equal(response.state, 'IDLE');
    assert.match(response.message, /didn't understand/i);
    assert.ok(response.options && response.options.length > 0);
    assert.ok(
      response.options.some((o) => /menu|Track|Returns|Shipping|human|agent/i.test(o)),
      'Expected menu options or escalation'
    );
  });
});

describe('GENERAL FLOW', () => {
  it('main-menu Shipping information option triggers shipping response', () => {
    const response = last(chat(['🚚 Shipping information']));
    assert.equal(classifyIntent('🚚 Shipping information'), 'SHIPPING');
    assert.equal(response.state, 'RESOLVED');
    assert.match(response.message, /Standard.*3.5 business days/s);
  });

  it('user can return to main menu after resolved conversation', () => {
    const responses = chat(['How long does shipping take?', 'Back to menu']);
    assert.equal(responses[0].state, 'RESOLVED');
    assert.equal(responses[1].state, 'IDLE');
    assert.match(responses[1].message, /Welcome to \*\*North Star Support\*\*/);
    assert.ok(responses[1].options.includes('🚚 Shipping information'));
  });
});

describe('INTENT PATTERN SANITY', () => {
  it('order tracking queries stay ORDER_TRACKING when not shipping-info', () => {
    assert.equal(classifyIntent('Where is my order?'), 'ORDER_TRACKING');
    assert.equal(classifyIntent('Track my package'), 'ORDER_TRACKING');
    assert.notEqual(classifyIntent('Where is my order?'), 'SHIPPING');
  });
});
