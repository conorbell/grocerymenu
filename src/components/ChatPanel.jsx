import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useList } from './functions/ListContextWrapper';
import { useChat, startOfDay } from './functions/ChatContext';
import { Link } from 'react-router-dom';
import { Avatar } from './Avatar';

const dayLabel = (date) => {
  const day = startOfDay(date).getTime();
  const today = startOfDay(Date.now()).getTime();
  if (day === today) return 'Today';
  if (day === today - 86400000) return 'Yesterday';
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(new Date(date).getFullYear() !== new Date().getFullYear() && { year: 'numeric' }),
  });
};

const timeLabel = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

// Group messages into [{ key, label, items }] by local calendar day.
const groupByDay = (messages) => {
  const groups = [];
  messages.forEach((m) => {
    const key = startOfDay(m.created_at).getTime();
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(m);
    else groups.push({ key, label: dayLabel(m.created_at), items: [m] });
  });
  return groups;
};

// `people` lets the dev preview supply sample profiles instead of real ones.
export const ChatPanel = ({ people: peopleOverride } = {}) => {
  const list = useList();
  const { user, myProfile, mateProfiles, onlineIds = [] } = peopleOverride || list;
  const chat = useChat();
  const [draft, setDraft] = useState('');
  const bodyRef = useRef(null);
  const stickToBottom = useRef(true);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  const me = user?.id;
  const people = useMemo(() => {
    const map = {};
    [myProfile, ...mateProfiles].filter(Boolean).forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [myProfile, mateProfiles]);
  const nameOf = (id) => (id === me ? 'You' : people[id]?.display_name || 'Party member');
  const mate = mateProfiles[0];
  const mateName = mate?.display_name || 'Party member';
  const mateOnline = mate && onlineIds.includes(mate.id);

  const groups = useMemo(() => groupByDay(chat.messages), [chat.messages]);

  // "Seen": your latest message, if someone else has read up to it.
  const myLast = [...chat.messages].reverse().find((m) => m.sender_id === me && !m.pending);
  const seen =
    myLast &&
    Object.entries(chat.reads).some(
      ([uid, at]) => uid !== me && new Date(at) >= new Date(myLast.created_at)
    );

  // Keep the view pinned to the newest message unless you've scrolled up.
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [chat.messages, chat.typingIds.length, chat.open]);

  useEffect(() => {
    if (chat.open) inputRef.current?.focus();
  }, [chat.open]);

  useEffect(() => {
    if (!chat.open) return undefined;
    const onKey = (e) => e.key === 'Escape' && chat.setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chat.open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Click/tap anywhere outside the window (other than the Chat pill) closes it.
  useEffect(() => {
    if (!chat.open) return undefined;
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      if (e.target.closest?.('.chat-fab')) return; // the pill toggles itself
      chat.setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [chat.open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!chat.open) return null;

  // Logged out (or sharing not set up): same card, with a log-in prompt.
  if (!chat.available) {
    return (
      <aside className="chat chat--locked" role="dialog" aria-label="Chat" ref={panelRef}>
        <div className="ticket__head chat__head">
          <button type="button" className="ticket__close" onClick={() => chat.setOpen(false)} aria-label="Close chat">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3 L21 21 M21 3 L3 21" />
            </svg>
          </button>
          <h2 className="chat__title">Chat</h2>
        </div>
        <div className="chat__frame">
          <div className="chat__body chat__body--locked">
            <p className="chat__note">Log in to chat with your party.</p>
            <p className="chat__locked-hint">
              Messages are shared between the two of you and saved by day.
            </p>
          </div>
          <Link className="chat__send chat__login" to="/user/login" onClick={() => chat.setOpen(false)}>
            Log in
          </Link>
        </div>
      </aside>
    );
  }

  const onScroll = () => {
    const el = bodyRef.current;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  const loadEarlier = async () => {
    const el = bodyRef.current;
    const fromBottom = el.scrollHeight - el.scrollTop;
    stickToBottom.current = false;
    await chat.loadPreviousDay();
    // keep the same message in view after older ones are added above
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight - fromBottom;
    });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    stickToBottom.current = true;
    chat.send(draft);
    setDraft('');
  };

  const notSetUp = chat.error && /relation|does not exist|schema cache/i.test(chat.error);

  return (
    <aside className="chat" role="dialog" aria-label={`Chat with ${mateName}`} ref={panelRef}>
      <div className="ticket__head chat__head">
        <button type="button" className="ticket__close" onClick={() => chat.setOpen(false)} aria-label="Close chat">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 3 L21 21 M21 3 L3 21" />
          </svg>
        </button>
        <h2 className="chat__title">{mateName}</h2>
      </div>

      <div className="chat__frame">
        <div className="chat__who-row">
          {mate && (
            <span className="party__portrait">
              <Avatar url={mate.avatar_url} name={mateName} size="tiny" />
              <span className={`party__status${mateOnline ? ' is-online' : ''}`} />
            </span>
          )}
          <span className="cell__label">{mateOnline ? 'Online now' : 'Offline'}</span>
        </div>

      <div className="chat__body" ref={bodyRef} onScroll={onScroll} aria-live="polite">
        {notSetUp ? (
          <p className="chat__note">
            Chat isn't set up yet. Run <code>supabase/chat.sql</code> in the Supabase SQL Editor.
          </p>
        ) : (
          <>
            {chat.olderDay && (
              <button type="button" className="chat__older" onClick={loadEarlier}>
                ↑ Show {dayLabel(chat.olderDay)}
              </button>
            )}
            {chat.loading && <p className="chat__note">Loading…</p>}
            {!chat.loading && groups.length === 0 && !chat.olderDay && (
              <p className="chat__note">No messages yet. Say hi to {mateName}.</p>
            )}
            {groups.map((group) => (
              <section key={group.key} className="chat__day">
                <h3 className="chat__day-label">
                  <span>{group.label}</span>
                </h3>
                {group.items.map((m, i) => {
                  const mine = m.sender_id === me;
                  const prev = group.items[i - 1];
                  // New "NAME · TIME" line when the sender changes or 5+ minutes pass.
                  const showHead =
                    !prev ||
                    prev.sender_id !== m.sender_id ||
                    new Date(m.created_at) - new Date(prev.created_at) > 5 * 60000;
                  const isMyLast = myLast && m.id === myLast.id;
                  return (
                    <div
                      key={m.id}
                      className={`msg${mine ? ' msg--mine' : ''}${m.failed ? ' msg--failed' : ''}${
                        showHead ? ' msg--head' : ''
                      }`}
                    >
                      {showHead && (
                        <span className="msg__head">
                          {nameOf(m.sender_id)} · {m.pending ? 'sending…' : timeLabel(m.created_at)}
                        </span>
                      )}
                      <p className="msg__text">
                        {m.body}
                        {mine && !m.pending && (
                          <button
                            type="button"
                            className="msg__delete"
                            aria-label="Delete message"
                            title="Delete"
                            onClick={() => chat.remove(m.id)}
                          >
                            ×
                          </button>
                        )}
                      </p>
                      {(m.failed || (isMyLast && seen)) && (
                        <span className="msg__meta">{m.failed ? "Didn't send" : 'Seen'}</span>
                      )}
                    </div>
                  );
                })}
              </section>
            ))}
            {chat.typingIds.length > 0 && (
              <p className="chat__typing">{nameOf(chat.typingIds[0])} is typing…</p>
            )}
          </>
        )}
      </div>

        <form className="chat__composer" onSubmit={submit}>
          <label className="chat__input-cell">
            <span className="cell__label">Message</span>
            <input
              className="chat__input"
              ref={inputRef}
              type="text"
              placeholder={`Say something to ${mateName}…`}
              maxLength={2000}
              value={draft}
              disabled={notSetUp}
              onChange={(e) => {
                setDraft(e.target.value);
                chat.notifyTyping();
              }}
            />
          </label>
          <button type="submit" className="chat__send" disabled={!draft.trim() || notSetUp}>
            Send
          </button>
        </form>
      </div>
    </aside>
  );
};
