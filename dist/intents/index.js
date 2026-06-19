"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyIntent = classifyIntent;
exports.extractOrderNumber = extractOrderNumber;
exports.extractActivityKeyword = extractActivityKeyword;
const PATTERNS = {
    ORDER_TRACKING: [
        /\b(order|package|parcel|shipment|delivery|track|where.*(my|is)|status)\b/i,
        /\b(arrived|shipped|shipping|dispatch|dispatched)\b/i,
        /\border\s*#?\s*\d+/i,
    ],
    RETURNS: [
        /\b(return|refund|exchange|send back|sending back|wrong|broken|damaged|defective|not happy|unhappy)\b/i,
        /\b(return policy|how do i return|can i return|want to return)\b/i,
    ],
    PRODUCT_RECOMMENDATION: [
        /\b(recommend|suggestion|suggest|looking for|need a|help me find|what.*(should|would|do you)|best)\b/i,
        /\b(buy|purchase|shop|product|gear|equipment|tent|boot|jacket|bag|pack|backpack)\b/i,
    ],
    HUMAN_HANDOFF: [
        /\b(human|agent|person|real person|representative|rep|staff|speak to|talk to|connect me)\b/i,
        /\b(help me|not helping|useless|frustrated|escalate|manager|supervisor)\b/i,
    ],
    GREETING: [
        /^\s*(hi|hello|hey|howdy|good (morning|afternoon|evening)|what's up|sup|yo)\s*[!.]?\s*$/i,
    ],
    FALLBACK: [],
};
function classifyIntent(message) {
    for (const [intent, patterns] of Object.entries(PATTERNS)) {
        if (intent === 'FALLBACK')
            continue;
        if (patterns.some((p) => p.test(message))) {
            return intent;
        }
    }
    return 'FALLBACK';
}
function extractOrderNumber(message) {
    const match = message.match(/\b(\d{3,})\b/);
    return match ? match[1] : null;
}
function extractActivityKeyword(message) {
    if (/\b(hik|trek|trail|walk)\b/i.test(message))
        return 'hiking';
    if (/\b(camp|backpack|outdoor sleep)\b/i.test(message))
        return 'camping';
    if (/\b(climb|boulder|mountain)\b/i.test(message))
        return 'climbing';
    if (/\b(winter|snow|ski|cold)\b/i.test(message))
        return 'winter';
    return 'general';
}
