import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase } from '../../lib/supabase';
import { useList } from './ListContextWrapper';

/*
 * Household chat (supabase/chat.sql).
 * - History is organised by day: opens with the last few days, and
 *   loadPreviousDay() pulls in the next earlier day that has messages.
 * - New messages / deletes arrive live (postgres_changes).
 * - "typing…" goes over a Broadcast channel (nothing stored).
 * - chat_reads stores when each person last read the chat → unread + "Seen".
 */

export const ChatContext = createContext(null);

const INITIAL_DAYS = 3;
const TYPING_MS = 3000;

export const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const byTime = (a, b) => new Date(a.created_at) - new Date(b.created_at);

export const ChatProvider = ({ children }) => {
  const { shared, user } = useList();
  const me = user?.id;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadedFrom, setLoadedFrom] = useState(null); // start of the earliest loaded day
  const [olderDay, setOlderDay] = useState(null); // date of the next earlier message, if any
  const [reads, setReads] = useState({}); // user_id -> last_read_at
  const [typing, setTyping] = useState({}); // user_id -> expires at (ms)
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef(null);
  const lastTypingSent = useRef(0);

  // Is there an earlier message before `before`? Remember its day for the button.
  const findOlderDay = useCallback(async (before) => {
    const { data, error: err } = await supabase
      .from('messages')
      .select('created_at')
      .lt('created_at', before.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);
    if (err) return;
    setOlderDay(data?.[0] ? startOfDay(data[0].created_at) : null);
  }, []);

  const loadReads = useCallback(async () => {
    const { data, error: err } = await supabase.from('chat_reads').select('user_id, last_read_at');
    if (err) return;
    setReads(Object.fromEntries(data.map((r) => [r.user_id, r.last_read_at])));
  }, []);

  // ---- initial load + live updates ----
  useEffect(() => {
    if (!shared || !me) {
      setMessages([]);
      setReads({});
      setOpen(false);
      return undefined;
    }
    let cancelled = false;

    const from = startOfDay(Date.now() - (INITIAL_DAYS - 1) * 86400000);
    setLoading(true);
    supabase
      .from('messages')
      .select('id, sender_id, body, created_at')
      .gte('created_at', from.toISOString())
      .order('created_at', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        setLoading(false);
        if (err) {
          setError(err.message);
          return;
        }
        setError(null);
        setMessages(data);
        setLoadedFrom(from);
        findOlderDay(from);
      });
    loadReads();

    const channel = supabase
      .channel('household-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, ({ new: row }) =>
        setMessages((prev) =>
          prev.some((m) => m.id === row.id)
            ? prev.map((m) => (m.id === row.id ? row : m))
            : [...prev, row].sort(byTime)
        )
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, ({ old }) =>
        setMessages((prev) => prev.filter((m) => m.id !== old.id))
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_reads' }, ({ new: row }) => {
        if (row?.user_id) setReads((prev) => ({ ...prev, [row.user_id]: row.last_read_at }));
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.user_id && payload.user_id !== me) {
          setTyping((prev) => ({ ...prev, [payload.user_id]: Date.now() + TYPING_MS }));
        }
      })
      .subscribe();
    channelRef.current = channel;

    return () => {
      cancelled = true;
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [shared, me, findOlderDay, loadReads]);

  // Clear "typing…" once it goes stale.
  useEffect(() => {
    const ids = Object.keys(typing);
    if (!ids.length) return undefined;
    const t = setInterval(() => {
      const now = Date.now();
      setTyping((prev) => {
        const next = Object.fromEntries(Object.entries(prev).filter(([, until]) => until > now));
        return Object.keys(next).length === Object.keys(prev).length ? prev : next;
      });
    }, 500);
    return () => clearInterval(t);
  }, [typing]);

  // ---- actions ----
  const loadPreviousDay = async () => {
    if (!olderDay || !loadedFrom) return;
    const dayStart = olderDay;
    const { data, error: err } = await supabase
      .from('messages')
      .select('id, sender_id, body, created_at')
      .gte('created_at', dayStart.toISOString())
      .lt('created_at', loadedFrom.toISOString())
      .order('created_at', { ascending: true });
    if (err) {
      setError(err.message);
      return;
    }
    setMessages((prev) => [...data, ...prev.filter((m) => !data.some((d) => d.id === m.id))]);
    setLoadedFrom(dayStart);
    findOlderDay(dayStart);
  };

  const send = async (text) => {
    const body = text.trim();
    if (!body || !me) return;
    const msg = { id: newId(), sender_id: me, body, created_at: new Date().toISOString(), pending: true };
    setMessages((prev) => [...prev, msg]);
    const { error: err } = await supabase.from('messages').insert({ id: msg.id, body });
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, pending: false, failed: Boolean(err) } : m))
    );
    if (err) setError(err.message);
  };

  const remove = async (id) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    await supabase.from('messages').delete().eq('id', id);
  };

  const notifyTyping = () => {
    const now = Date.now();
    if (!channelRef.current || now - lastTypingSent.current < 1500) return;
    lastTypingSent.current = now;
    channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: me } });
  };

  const markRead = useCallback(async () => {
    if (!me) return;
    const now = new Date().toISOString();
    setReads((prev) => ({ ...prev, [me]: now }));
    await supabase.from('chat_reads').upsert({ user_id: me, last_read_at: now });
  }, [me]);

  // While the chat is open, everything in it counts as read.
  const latestId = messages[messages.length - 1]?.id;
  useEffect(() => {
    if (open && shared && me && !error) markRead();
  }, [open, latestId, shared, me, error, markRead]);

  const myLastRead = reads[me] ? new Date(reads[me]) : null;
  const unread = useMemo(
    () =>
      messages.filter(
        (m) => m.sender_id !== me && (!myLastRead || new Date(m.created_at) > myLastRead)
      ).length,
    [messages, me, myLastRead]
  );

  const typingIds = Object.keys(typing);

  const value = {
    available: Boolean(shared && me),
    open,
    setOpen,
    toggle: () => setOpen((o) => !o),
    messages,
    loading,
    error,
    olderDay,
    loadPreviousDay,
    send,
    remove,
    notifyTyping,
    typingIds,
    reads,
    unread: open ? 0 : unread,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within a ChatProvider');
  return ctx;
};
