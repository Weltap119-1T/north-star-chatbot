"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRODUCT_CATEGORIES = exports.SHIPPING = exports.RETURN_POLICY = exports.ORDERS = void 0;
exports.ORDERS = {
    '111': {
        status: 'Shipped',
        detail: 'Your order #111 has been shipped and is arriving tomorrow. 📦',
        followUp: undefined,
    },
    '222': {
        status: 'Processing',
        detail: 'Your order #222 is currently processing and will ship within the next 24 hours. 🔄',
        followUp: undefined,
    },
    '333': {
        status: 'Delivered',
        detail: 'Your order #333 has been delivered. 🎉',
        followUp: 'Did your order arrive in good condition? If you have any issues, I can help with a return or exchange.',
    },
};
exports.RETURN_POLICY = {
    window: '30 days',
    condition: 'unused, in original packaging',
    link: 'https://northstargear.com/returns',
    summary: `Our return policy allows returns within **30 days** of purchase. Items must be unused and in their original packaging. To start your return, visit: https://northstargear.com/returns`,
};
exports.SHIPPING = {
    standard: '3–5 business days',
    expedited: '1–2 business days',
    summary: `We offer two shipping options:\n• **Standard**: 3–5 business days\n• **Expedited**: 1–2 business days`,
};
exports.PRODUCT_CATEGORIES = {
    hiking: ['Trail Runner Pro Boots', 'Trekking Pole Set', 'Day Hike Backpack 25L'],
    camping: ['4-Season Dome Tent', 'Sleeping Bag (-10°C)', 'Camp Kitchen Kit'],
    climbing: ['Climbing Harness', 'Chalk Bag', 'Approach Shoes'],
    winter: ['Insulated Parka', 'Thermal Base Layer Set', 'Ski Gloves Pro'],
    general: ['Multi-Tool Knife', 'Hydration Bladder 2L', 'Headlamp 350 Lumen'],
};
