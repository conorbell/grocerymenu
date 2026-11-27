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
 * - History is organised by day: opens with the last few days (or back to
 *   your last read, so the unread count is right), and loadPreviousDay()
 *   pulls in the next earlier day that has messages.
 * - New messages / deletes arrive live (postgres_changes). Phones drop the
 *   live connection when they sleep, so the loaded days are re-fetched when
 *   the connection comes back and when the app returns to the foreground.
 * - "typing…" goes over a Broadcast channel (nothing stored).
 * - chat_reads stores the newest message each person has read (server
 *   time, so phone clocks don't matter) → unread + "Seen".
 */

export const ChatContext = createContext(null);

const INITIAL_DAYS = 3;
const MAX_UNREAD_DAYS = 14; // how far back we'll load to count unread messages
const TYPING_MS = 3000;
const DAY_MS = 86400000;

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

// Server rows win; keep local messages the server doesn't have yet (sending / failed).
const mergeLocal = (server, prev) => {
  const ids = new Set(server.map((m) => m.id));
  const local = prev.filter((m) => (m.pending || m.failed) && !ids.has(m.id));
  return [...server, ...local].sort(byTime);
};

export const ChatProvider = ({ children }) => {
  const { shared, user } = useList();
  const me = user?.id;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadedFrom, setLoadedFrom] = useState(null); // start of the earliest loaded day
  const [olderDay, setOlderDay] = useState(null); // date of the next earlier message, if any
  const [reads, setReads] = useState({}); // user_id -> last_read_at
  const [typing, setTyping] = useState({}); // user_id -> expires at (ms)
  const [error, setError] = useState(null); // couldn't load / reach the chat
  const [loading, setLoading] = useState(false);
  const channelRef = useRef(null);
  const lastTypingSent = useRef(0);
  const loadedFromRef = useRef(null);

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
    if (err) return null;
    const map = Object.fromEntries(data.map((r) => [r.user_id, r.last_read_at]));
    setReads(map);
    return map;
  }, []);

  // (Re)load everything from `from` onwards and merge it with what's on screen.
  const fetchFrom = useCallback(
    async (from) => {
      const { data, error: err } = await supabase
        .from('messages')
        .select('id, sender_id, body, created_at')
        .gte('created_at', from.toISOString())
        .order('created_at', { ascending: true });
      if (err) {
        setError(err.message);
        return false;
      }
      setError(null);
      setMessages((prev) => mergeLocal(data, prev));
      return true;
    },
    []
  );

  // Catch up after the phone slept or the connection dropped.
  const resync = useCallback(() => {
    if (!loadedFromRef.current) return;
    fetchFrom(loadedFromRef.current);
    loadReads();
  }, [fetchFrom, loadReads]);

  // ---- initial load + live updates ----
  useEffect(() => {
    if (!shared || !me) {
      setMessages([]);
      setReads({});
      setOpen(false);
      setLoading(false);
      loadedFromRef.current = null;
      return undefined;
    }
    let cancelled = false;

    (async () => {
      setLoading(true);
      const readMap = await loadReads();
      if (cancelled) return;
      // Normally the last few days; further back if you haven't read since.
      let from = startOfDay(Date.now() - (INITIAL_DAYS - 1) * DAY_MS);
      const myRead = readMap?.[me] ? startOfDay(readMap[me]) : null;
      const floor = startOfDay(Date.now() - (MAX_UNREAD_DAYS - 1) * DAY_MS);
      if (myRead && myRead < from) from = myRead < floor ? floor : myRead;
      const ok = await fetchFrom(from);
      if (cancelled) return;
      setLoading(false);
      if (!ok) return;
      loadedFromRef.current = from;
      setLoadedFrom(from);
      findOlderDay(from);
    })();

    let subscribedOnce = false;
    const channel = supabase
      .channel('household-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, ({ new: row }) => {
        // their message landed, so they've stopped typing
        setTyping((prev) => {
          if (!prev[row.sender_id]) return prev;
          const next = { ...prev };
          delete next[row.sender_id];
          return next;
        });
        setMessages((prev) =>
          prev.some((m) => m.id === row.id)
            ? prev.map((m) => (m.id === row.id ? row : m)).sort(byTime)
            : [...prev, row].sort(byTime)
        );
      })
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
      .subscribe((status) => {
        // SUBSCRIBED fires again after a reconnect: fetch what we missed.
        if (status !== 'SUBSCRIBED') return;
        if (subscribedOnce) resync();
        subscribedOnce = true;
      });
    channelRef.current = channel;

    const onVisible = () => document.visibilityState === 'visible' && resync();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', resync);

    return () => {
      cancelled = true;
      channelRef.current = null;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', resync);
      supabase.removeChannel(channel);
    };
  }, [shared, me, fetchFrom, findOlderDay, loadReads, resync]);

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
    loadedFromRef.current = dayStart;
    setLoadedFrom(dayStart);
    findOlderDay(dayStart);
  };

  const deliver = async (msg) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, pending: true, failed: false } : m))
    );
    const { error: err } = await supabase.from('messages').insert({ id: msg.id, body: msg.body });
    // 23505 = already saved (an earlier try got through but its reply was lost)
    const failed = Boolean(err) && err.code !== '23505';
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, pending: false, failed } : m)));
  };

  const send = async (text) => {
    const body = text.trim();
    if (!body || !me) return;
    const msg = { id: newId(), sender_id: me, body, created_at: new Date().toISOString(), pending: true };
    setMessages((prev) => [...prev, msg]);
    await deliver(msg);
  };

  const retry = (id) => {
    const msg = messages.find((m) => m.id === id);
    if (msg?.failed) deliver(msg);
  };

  const remove = async (id) => {
    const msg = messages.find((m) => m.id === id);
    if (!msg) return;
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (msg.failed) return; // never reached the server
    const { error: err } = await supabase.from('messages').delete().eq('id', id);
    if (err) setMessages((prev) => (prev.some((m) => m.id === id) ? prev : [...prev, msg].sort(byTime)));
  };

  const notifyTyping = () => {
    const now = Date.now();
    if (!channelRef.current || now - lastTypingSent.current < 1500) return;
    lastTypingSent.current = now;
    channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: me } });
  };

  // Mark read up to the newest delivered message, using its server timestamp.
  const latestSaved = [...messages].reverse().find((m) => !m.pending && !m.failed);
  const latestAt = latestSaved?.created_at;
  const myReadAt = reads[me];
  useEffect(() => {
    if (!open || !shared || !me || !latestAt) return;
    if (myReadAt && new Date(myReadAt) >= new Date(latestAt)) return;
    setReads((prev) => ({ ...prev, [me]: latestAt }));
    supabase.from('chat_reads').upsert({ user_id: me, last_read_at: latestAt }).then(() => {});
  }, [open, shared, me, latestAt, myReadAt]);

  const myLastRead = myReadAt ? new Date(myReadAt) : null;
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
    retry,
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
