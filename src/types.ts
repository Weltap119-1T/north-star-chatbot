export type ConversationState =
  | 'IDLE'
  | 'AWAITING_ORDER_NUMBER'
  | 'AWAITING_RETURN_DETAIL'
  | 'AWAITING_PRODUCT_USE'
  | 'AWAITING_PRODUCT_CONDITIONS'
  | 'HUMAN_HANDOFF'
  | 'LIVE_AGENT'
  | 'RESOLVED';

export type Intent =
  | 'ORDER_TRACKING'
  | 'RETURNS'
  | 'PRODUCT_RECOMMENDATION'
  | 'HUMAN_HANDOFF'
  | 'GREETING'
  | 'FALLBACK';

export interface Session {
  id: string;
  state: ConversationState;
  context: Record<string, string>;
  createdAt: Date;
  lastActivity: Date;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
}

export interface ChatResponse {
  sessionId: string;
  message: string;
  state: ConversationState;
  options?: string[];
}

export interface OrderRecord {
  status: string;
  detail: string;
  followUp?: string;
}
