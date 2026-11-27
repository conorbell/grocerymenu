// DEV ONLY: /user/preview shows the profile page with sample data, so it can be
// looked at without Supabase or logging in. Not included in production builds.
import React, { useState } from 'react';
import { ChatContext } from '../../functions/ChatContext';
import { ChatPanel } from '../../ChatPanel';
import { ProfileCard, EditProfile, Command, PartyHud, SettingsPanel } from './Account';
import cat1 from '../../../../public/cats/cat-1.jpg';

const me = {
  id: 'me',
  display_name: 'Conor',
  bio: 'Will eat anything with chili crisp on it. Signature dish: frozen pizza, but make it fancy.',
  avatar_url: null,
  cook_willingness: 4,
  eat_willingness: 9,
  favorites: ['Fish Tacos', 'Carne Asada', 'Overnight Oats'],
  meals_planned: 12,
  items_added: 64,
  items_ticked: 41,
};

const mate = {
  id: 'mate',
  display_name: 'Sam',
  bio: 'Head chef, sous chef and dishwasher (allegedly).',
  avatar_url: cat1,
  cook_willingness: 8,
  eat_willingness: 6,
  favorites: ['Shrimp Cumin Ginger', 'Fish Tacos'],
  meals_planned: 25,
  items_added: 110,
  items_ticked: 97,
};

// ---- sample chat (fake data, nothing is sent anywhere) ----
const ago = (days, h, m) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const SAMPLE_MESSAGES = [
  { id: 'm1', sender_id: 'mate', body: 'are we doing tacos this week?', created_at: ago(1, 18, 2) },
  { id: 'm2', sender_id: 'me', body: 'yes!! adding fish tacos now', created_at: ago(1, 18, 5) },
  { id: 'm3', sender_id: 'mate', body: 'can you grab limes on the way home', created_at: ago(0, 9, 41) },
  { id: 'm4', sender_id: 'mate', body: 'and the good tortillas pls', created_at: ago(0, 9, 42) },
  { id: 'm5', sender_id: 'me', body: 'on it 🫡', created_at: ago(0, 10, 3) },
];
const OLDER_DAY = [
  { id: 'o1', sender_id: 'me', body: 'we are out of eggs again', created_at: ago(4, 8, 15) },
  { id: 'o2', sender_id: 'mate', body: 'adding them to the list', created_at: ago(4, 8, 20) },
];

const ChatDemo = ({ people }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(SAMPLE_MESSAGES);
  const [olderLoaded, setOlderLoaded] = useState(false);
  const value = {
    available: true,
    open,
    setOpen,
    toggle: () => setOpen((o) => !o),
    messages,
    loading: false,
    error: null,
    olderDay: olderLoaded ? null : new Date(OLDER_DAY[0].created_at),
    loadPreviousDay: async () => {
      setMessages((m) => [...OLDER_DAY, ...m]);
      setOlderLoaded(true);
    },
    send: (text) =>
      setMessages((m) => [
        ...m,
        { id: `n${m.length}`, sender_id: 'me', body: text.trim(), created_at: new Date().toISOString() },
      ]),
    remove: (id) => setMessages((m) => m.filter((x) => x.id !== id)),
    retry: () => {},
    notifyTyping: () => {},
    typingIds: ['mate'],
    reads: { mate: new Date().toISOString() },
    unread: 0,
  };
  return (
    <ChatContext.Provider value={value}>
      {/* same bubble as the real app (sample unread badge + online light) */}
      <button
        type="button"
        className={`chat-fab${open ? ' is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        <svg className="chat-fab__icon" viewBox="0 0 24 24" aria-hidden="true">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          ) : (
            <path
              d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          )}
        </svg>
        <span className="chat-fab__label">{open ? 'Close' : 'Chat'}</span>
        <span className="chat-fab__online" />
        {!open && <span className="chat-fab__badge">2</span>}
      </button>
      <ChatPanel people={people} />
    </ChatContext.Provider>
  );
};

export const ProfilePreview = () => {
  const [editing, setEditing] = useState(false);
  const [removed, setRemoved] = useState([]);
  const [inspectId, setInspectId] = useState('me');
  const [allocating, setAllocating] = useState(false);
  const [statPoints, setStatPoints] = useState({ strength: 2, magic: 1 });
  const mine = {
    ...me,
    favorites: me.favorites.filter((t) => !removed.includes(t)),
    stat_points: statPoints,
  };

  return (
    <section className="page account">
      <p className="sync-error">Preview with sample data, only on your local dev app. Nothing here saves.</p>
      <h1 className="display">PROFILE</h1>

      <PartyHud
        members={[
          { profile: mine, fallbackName: 'Conor' },
          { profile: mate, fallbackName: 'Party member' },
        ]}
        selectedId={inspectId}
        onSelect={setInspectId}
        onlineIds={['mate']}
        meId="me"
      />

      {inspectId === 'me' ? (
        <ProfileCard
          profile={mine}
          fallbackName="Conor"
          mine
          onRemoveFavorite={(t) => setRemoved((r) => [...r, t])}
          allocating={allocating}
          onSaveAllocation={async (points) => {
            setStatPoints(points);
            return { ok: true };
          }}
          onCloseAllocation={() => setAllocating(false)}
        >
          <Command onClick={() => setEditing(true)}>Edit profile</Command>
          <Command onClick={() => setAllocating(true)}>Allocate stats</Command>
          <Command onClick={() => {}}>See the list</Command>
          <Command
            onClick={() => {
              const el = document.getElementById('account-settings');
              if (el) {
                el.open = true;
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          >
            Settings
          </Command>
        </ProfileCard>
      ) : (
        <ProfileCard profile={mate} fallbackName="Party member" />
      )}

      {inspectId === 'me' && (
        <SettingsPanel
          email="you@example.com"
          createdAt="2026-11-26T18:02:31Z"
          lastSignIn="2026-11-26T19:10:00Z"
          listStats={{ meals: 3, toBuy: 12, ticked: 4, mine: 9 }}
          onSignOut={() => {}}
        />
      )}

      <ChatDemo
        people={{ user: { id: 'me' }, myProfile: mine, mateProfiles: [mate], onlineIds: ['mate'] }}
      />

      {editing && <EditProfile profile={mine} fallbackName="Conor" onClose={() => setEditing(false)} />}
    </section>
  );
};
