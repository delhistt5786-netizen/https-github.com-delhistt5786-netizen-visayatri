'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock3, MessageSquare, Plus, Search, Send, Trash2, UserRound, Bot, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addMessage,
  clearConversations,
  createConversation,
  deleteConversation,
  getConversations,
} from '../../lib/conversationHistory';

const formatDate = (date) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));

export default function HistoryPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [reply, setReply] = useState('');
  const [replyRole, setReplyRole] = useState('user');

  useEffect(() => {
    const saved = getConversations();
    setConversations(saved);
    setSelectedId(saved[0]?.id || null);
  }, []);

  const filteredConversations = useMemo(() => conversations.filter((conversation) => {
    const query = search.toLowerCase();
    return conversation.title.toLowerCase().includes(query) || (conversation.messages || []).some((message) => message.content.toLowerCase().includes(query));
  }), [conversations, search]);

  const selected = conversations.find((conversation) => conversation.id === selectedId) || null;

  const refresh = (next, id = selectedId) => {
    setConversations(next);
    setSelectedId(id || next[0]?.id || null);
  };

  const handleCreate = (event) => {
    event.preventDefault();
    if (!newTitle.trim() && !newMessage.trim()) return;
    const next = createConversation(newTitle, newMessage);
    refresh(next, next[0].id);
    setNewTitle('');
    setNewMessage('');
    setShowNew(false);
    toast.success('Conversation saved locally');
  };

  const handleReply = (event) => {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    const next = addMessage(selected.id, replyRole, reply);
    refresh(next, selected.id);
    setReply('');
    toast.success('Message added to history');
  };

  const handleDelete = () => {
    if (!selected) return;
    const next = deleteConversation(selected.id);
    refresh(next);
    toast.success('Conversation deleted');
  };

  const handleClear = () => {
    if (!conversations.length || !window.confirm('Delete all locally saved conversations?')) return;
    clearConversations();
    refresh([]);
    toast.success('Local history cleared');
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">Private workspace</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] text-slate-900">Conversation history</h1>
            <p className="mt-3 max-w-xl text-slate-600">Keep Copilot- or Claude-style notes and chats on this device. Nothing is sent to a server.</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleClear} disabled={!conversations.length} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40">
              <Trash2 className="h-4 w-4" /> Clear all
            </button>
            <button type="button" onClick={() => setShowNew(true)} className="btn-primary">
              <Plus className="h-5 w-5" /> New conversation
            </button>
          </div>
        </div>

        <div className="grid min-h-[620px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[340px_1fr]">
          <aside className="border-b border-slate-200 bg-slate-50/70 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search history" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-400" />
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{filteredConversations.length} conversations</p>
            </div>
            <div className="max-h-[530px] overflow-y-auto p-2">
              {filteredConversations.length ? filteredConversations.map((conversation) => (
                <button key={conversation.id} type="button" onClick={() => setSelectedId(conversation.id)} className={`mb-1 w-full rounded-2xl p-4 text-left transition ${selectedId === conversation.id ? 'bg-white shadow-sm ring-1 ring-orange-200' : 'hover:bg-white'}`}>
                  <div className="flex items-start gap-3">
                    <MessageSquare className={`mt-0.5 h-4 w-4 shrink-0 ${selectedId === conversation.id ? 'text-orange-500' : 'text-slate-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">{conversation.title}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{conversation.messages?.at(-1)?.content || 'No messages yet'}</p>
                      <p className="mt-2 text-[11px] text-slate-400">{formatDate(conversation.updatedAt)} · {conversation.messages?.length || 0} messages</p>
                    </div>
                  </div>
                </button>
              )) : (
                <div className="px-5 py-14 text-center">
                  <Clock3 className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-600">No local history yet</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Create a conversation to start building your archive.</p>
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-[620px] flex-col">
            {selected ? (
              <>
                <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-8">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-slate-900">{selected.title}</h2>
                    <p className="mt-1 text-xs text-slate-400">Saved on this device · {formatDate(selected.createdAt)}</p>
                  </div>
                  <button type="button" onClick={handleDelete} aria-label="Delete conversation" title="Delete conversation" className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </header>
                <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-8">
                  {selected.messages?.length ? selected.messages.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${message.role === 'assistant' ? '' : 'flex-row-reverse'}`}>
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${message.role === 'assistant' ? 'bg-slate-900 text-white' : 'bg-orange-100 text-orange-600'}`}>
                        {message.role === 'assistant' ? <Bot className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                      </div>
                      <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'assistant' ? 'bg-slate-100 text-slate-700' : 'bg-orange-500 text-white'}`}>
                        {message.content}
                      </div>
                    </div>
                  )) : <p className="py-16 text-center text-sm text-slate-400">This conversation has no messages yet.</p>}
                </div>
                <form onSubmit={handleReply} className="border-t border-slate-200 p-4 sm:p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <select value={replyRole} onChange={(event) => setReplyRole(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 outline-none">
                      <option value="user">You</option>
                      <option value="assistant">Assistant</option>
                    </select>
                    <span className="text-xs text-slate-400">Add a message to this local record</span>
                  </div>
                  <div className="flex gap-2">
                    <textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={2} placeholder="Write or paste a message..." className="min-w-0 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400" />
                    <button type="submit" aria-label="Save message" title="Save message" className="self-end rounded-xl bg-slate-900 p-3 text-white transition hover:bg-slate-700"><Send className="h-4 w-4" /></button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="rounded-2xl bg-orange-100 p-4 text-orange-600"><MessageSquare className="h-8 w-8" /></div>
                <h2 className="mt-5 text-xl font-bold text-slate-900">Your local conversations</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Start a record for a Copilot or Claude conversation and keep it available offline in this browser.</p>
                <button type="button" onClick={() => setShowNew(true)} className="btn-primary mt-6"><Plus className="h-5 w-5" /> New conversation</button>
              </div>
            )}
          </section>
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
          <form onSubmit={handleCreate} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between">
              <div><p className="text-sm font-semibold text-orange-500">Local archive</p><h2 className="mt-1 text-2xl font-black text-slate-900">New conversation</h2></div>
              <button type="button" onClick={() => setShowNew(false)} aria-label="Close" title="Close" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <label className="mt-6 block text-sm font-semibold text-slate-700">Title<input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="e.g. UAE visa requirements" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-orange-400" /></label>
            <label className="mt-4 block text-sm font-semibold text-slate-700">First message <span className="font-normal text-slate-400">(optional)</span><textarea value={newMessage} onChange={(event) => setNewMessage(event.target.value)} rows={4} placeholder="Paste the first message from your conversation..." className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-orange-400" /></label>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowNew(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" className="btn-primary">Save locally</button></div>
          </form>
        </div>
      )}
    </div>
  );
}