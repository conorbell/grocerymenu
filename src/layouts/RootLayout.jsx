import { NavLink, Outlet, useLocation } from 'react-router-dom';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSound } from 'use-sound';
import Al from '../../public/hoo-ah-a.mp3';
import fiya from '../../public/dickfire.mp3';
import { useList } from '../components/functions/ListContextWrapper';
import { CreateMeal } from '../components/CreateMeal';
import { CATEGORIES as CATEGORY_KEYS } from '../lib/mealRules';
import { ChatPanel } from '../components/ChatPanel';
import { useChat } from '../components/functions/ChatContext';

// Each page gets its own flat background + headline colour (see styles.css).
// index.html has a copy of this mapping so the colour is right before the app loads.
const themeFor = (pathname) => {
  const page = pathname.split('/')[1];
  if (['breakfast', 'lunch', 'dinner', 'checkout', 'grocery', 'menu'].includes(page)) return `theme-${page}`;
  if (page === 'user') return 'theme-user';
  return 'theme-home';
};

// Beamed music notes; a diagonal strike when muted.
const SoundIcon = ({ muted }) => (
  <svg className="sound-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 17.5V5.5l11-2v12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <ellipse cx="6.5" cy="17.5" rx="2.75" ry="2.25" fill="currentColor" />
    <ellipse cx="17.5" cy="15.5" rx="2.75" ry="2.25" fill="currentColor" />
    {muted && (
      <>
        <path d="M3 3l18 18" stroke="var(--halo, #fff)" strokeWidth="5" strokeLinecap="round" />
        <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    )}
  </svg>
);

// Round chat bubble pinned to the bottom-right, with unread count + online light.
const ChatFab = () => {
  const chat = useChat();
  const { mateProfiles, onlineIds = [] } = useList();
  const { pathname } = useLocation();
  if (pathname === '/user/preview') return null; // the dev preview shows its own demo pill
  const mateOnline = mateProfiles.some((m) => onlineIds.includes(m.id));
  return (
    <button
      className={`chat-fab${chat.open ? ' is-open' : ''}`}
      onClick={chat.toggle}
      aria-expanded={chat.open}
      aria-label={`${chat.open ? 'Close' : 'Open'} chat${chat.unread ? `, ${chat.unread} unread` : ''}`}
      title="Chat"
    >
      {chat.open ? (
        <svg className="chat-fab__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg className="chat-fab__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span className="chat-fab__label">{chat.open ? 'Close' : 'Chat'}</span>
      {mateOnline && <span className="chat-fab__online" />}
      {chat.unread > 0 && <span className="chat-fab__badge">{chat.unread > 9 ? '9+' : chat.unread}</span>}
    </button>
  );
};

// Little two-line nav label, like "About / small caption".
const NavItem = ({ to, label, sub, end, onMouseEnter }) => (
  <NavLink
    to={to}
    end={end}
    onMouseEnter={onMouseEnter}
    className={({ isActive }) => `navLink${isActive ? ' active' : ''}`}
  >
    <span>{label}</span>
    <span className="navLink__sub">{sub}</span>
  </NavLink>
);

// Yellow subtitle-style caption that pops up when a meal is added. The list
// arriving from Supabase (after logging in) isn't an add, so nothing shows
// until it has loaded once.
const useAddedCaption = (mealList, listLoaded) => {
  const [caption, setCaption] = useState(null); // { title } | null
  const prevLength = useRef(null);
  const count = mealList.length;

  useEffect(() => {
    if (!listLoaded) {
      prevLength.current = null;
      return;
    }
    if (prevLength.current !== null && count > prevLength.current) {
      setCaption({ title: mealList[count - 1] });
    }
    prevLength.current = count;
  }, [count, listLoaded]);

  useEffect(() => {
    if (!caption) return undefined;
    const timer = setTimeout(() => setCaption(null), 2500);
    return () => clearTimeout(timer);
  }, [caption]);

  return caption;
};

export const RootLayout = () => {
  const [soundOn, setSoundOn] = useState(true);
  const [play] = useSound(Al, { volume: 0.5, soundEnabled: soundOn });
  const [playDick] = useSound(fiya, { volume: 0.5, soundEnabled: soundOn });
  const {
    groceryList,
    mealList,
    user,
    syncError,
    myProfile,
    profilesLoaded,
    authReady,
    listLoaded,
  } = useList();
  const [showCreate, setShowCreate] = useState(false);
  const closeCreate = useCallback(() => setShowCreate(false), []);
  const { pathname } = useLocation();
  const caption = useAddedCaption(mealList, listLoaded);

  const theme = themeFor(pathname);
  useEffect(() => {
    document.body.className = theme;
    document.documentElement.className = theme; // colours behind the page too
  }, [theme]);

  return (
    <div className="root-layout">
      <header className="site-header">
        <nav className="nav nav--left">
          <NavItem to="/" end label="Home" sub="start here" onMouseEnter={play} />
          <NavItem to="/breakfast" label="Breakfast" sub="morning" onMouseEnter={play} />
          <NavItem to="/lunch" label="Lunch" sub="midday" onMouseEnter={play} />
          <NavItem to="/dinner" label="Dinner" sub="evening" onMouseEnter={play} />
        </nav>
        <nav className="wordmark" aria-label="Grocery and menu">
          <NavLink to="/grocery" className={({ isActive }) => `wordmark__link${isActive ? ' active' : ''}`} onMouseEnter={play}>
            GROCERY
          </NavLink>
          <NavLink to="/menu" className={({ isActive }) => `wordmark__link${isActive ? ' active' : ''}`} onMouseEnter={play}>
            MENU
          </NavLink>
        </nav>
        <nav className="nav nav--right">
          <NavItem
            to="/checkout"
            label={`List${groceryList.length ? ` (${groceryList.length})` : ''}`}
            sub="to buy"
            onMouseEnter={play}
          />
          <NavItem
            to={user ? '/user' : '/user/login'}
            label={
              !authReady
                ? '\u00a0' // still reading your login: don't flash "Log in"
                : user
                ? myProfile?.display_name || (profilesLoaded ? 'Profile' : '\u00a0')
                : 'Log in'
            }
            sub={user ? 'your profile' : 'to see the menu'}
            onMouseEnter={playDick}
          />
        </nav>
      </header>

      {syncError && (
        <p className="sync-error" role="alert">
          Couldn't sync with the shared list: {syncError}
        </p>
      )}

      <main>
        <Outlet />
      </main>

      <div className="corner corner--left">
        <button
          className="sound-toggle"
          onClick={() => setSoundOn((on) => !on)}
          aria-label={soundOn ? 'Mute hover sounds' : 'Unmute hover sounds'}
          title={soundOn ? 'Mute hover sounds' : 'Unmute hover sounds'}
        >
          <SoundIcon muted={!soundOn} />
        </button>
        {user && (
          <button
            className="text-btn"
            onClick={() => setShowCreate(true)}
            aria-haspopup="dialog"
          >
            + Create meal
          </button>
        )}
      </div>

      <ChatFab />
      <ChatPanel />

      {showCreate && (
        <CreateMeal
          defaultCategory={CATEGORY_KEYS.find((key) => pathname === `/${key}`) || ''}
          onClose={closeCreate}
        />
      )}

      <div className="caption" aria-live="polite">
        {caption && (
          <p key={`${caption.title}${mealList.length}`}>[adds {caption.title} to the list]</p>
        )}
      </div>
    </div>
  );
};
