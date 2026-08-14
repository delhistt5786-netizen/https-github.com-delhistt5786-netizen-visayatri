'use client';

const STORAGE_KEY = 'visayatri_conversation_history';

const readHistory = () => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const writeHistory = (conversations) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }
  return conversations;
};

export const getConversations = () => readHistory();

export const createConversation = (title, firstMessage = '') => {
  const now = new Date().toISOString();
  const conversation = {
    id: `conversation-${Date.now()}`,
    title: title.trim() || 'New conversation',
    createdAt: now,
    updatedAt: now,
    messages: firstMessage.trim() ? [{ id: `message-${Date.now()}`, role: 'user', content: firstMessage.trim(), createdAt: now }] : [],
  };
  return writeHistory([conversation, ...readHistory()]);
};

export const addMessage = (conversationId, role, content) => {
  const now = new Date().toISOString();
  const conversations = readHistory().map((conversation) => {
    if (conversation.id !== conversationId) return conversation;
    return {
      ...conversation,
      updatedAt: now,
      messages: [...(conversation.messages || []), { id: `message-${Date.now()}`, role, content: content.trim(), createdAt: now }],
    };
  });
  return writeHistory(conversations);
};

export const deleteConversation = (conversationId) =>
  writeHistory(readHistory().filter((conversation) => conversation.id !== conversationId));

export const clearConversations = () => writeHistory([]);