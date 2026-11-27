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
import { resizeImage } from '../../lib/image';

/*
 * The meal plan + grocery list.
 *
 * Data model (same shape locally and in Supabase):
 *   meals: [{ id, title }]
 *   items: [{ id, name, quantity, unit, checked, planned_meal_id }]
 * An item with planned_meal_id came from that meal and goes away with it;
 * planned_meal_id === null means a standalone item ("paper towels").
 *
 * Logged out (or Supabase not configured): stored in this browser.
 * Logged in: stored in Supabase and shared live between everyone logged in.
 */

const STORAGE_KEY = 'grocerymenu:lists:v2';
const OLD_STORAGE_KEY = 'grocerymenu:lists';
const EMPTY = { meals: [], items: [] };

const ListContext = createContext();

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const round = (n) => Math.round(n * 100) / 100;

const extractQuantity = (text) => {
  const match = String(text).match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
};

// Ingredients can be strings ("2 small potatoes") or { name, quantity, unit }.
const toItem = (ingredient, multiplier = 1, plannedMealId = null) => {
  const isObject = ingredient && typeof ingredient === 'object';
  const name = String(isObject ? ingredient.name || '' : ingredient).trim();
  const quantity = isObject
    ? Number(ingredient.quantity) > 0
      ? Number(ingredient.quantity)
      : 1
    : extractQuantity(name);
  return {
    id: newId(),
    name,
    unit: isObject ? String(ingredient.unit || '').trim() : '',
    quantity: round(quantity * multiplier),
    checked: false,
    planned_meal_id: plannedMealId,
  };
};

const groupKey = (item) => `${item.name.toLowerCase()}|${item.unit || ''}`;

// "500 g", "2 cups"; plain counts show as "×3".
export const formatAmount = ({ quantity, unit }) => {
  if (!unit) return `×${quantity}`;
  const plural =
    quantity !== 1 &&
    /^(cup|can|bunch|clove|pack|slice|jar|bag|bottle|head)$/.test(unit);
  return `${quantity} ${unit}${plural ? (unit === 'bunch' ? 'es' : 's') : ''}`;
};

// ---------- browser storage ----------
const loadLocal = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.meals) && Array.isArray(saved.items)) return saved;

    // Migrate the older { mealList: [titles], groceryList: [{name,quantity,unit}] } format.
    const old = JSON.parse(localStorage.getItem(OLD_STORAGE_KEY));
    if (old) {
      return {
        meals: (old.mealList || []).map((title) => ({ id: newId(), title })),
        // Old lists never recorded which meal an item came from; mark them so
        // they aren't shown as standalone "extra" items.
        items: (old.groceryList || []).map((g) => ({ ...toItem(g), legacy: true })),
      };
    }
  } catch {
    // ignore unreadable storage
  }
  return EMPTY;
};

const saveLocal = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage unavailable (private mode etc.) - lists just won't persist
  }
};

// ---------- Supabase ----------
const fetchShared = async () => {
  const [meals, items] = await Promise.all([
    supabase.from('planned_meals').select('id, title').order('created_at'),
    supabase
      .from('grocery_items')
      .select('id, name, quantity, unit, checked, planned_meal_id, added_by')
      .order('created_at'),
  ]);
  if (meals.error) throw meals.error;
  if (items.error) throw items.error;
  return {
    meals: meals.data,
    items: items.data.map((item) => ({ ...item, quantity: Number(item.quantity) })),
  };
};

// Profiles are cached on the device so names/photos show instantly on the
// next visit (then refresh from Supabase in the background).
const PROFILES_KEY = 'grocerymenu:profiles';
const loadCachedProfiles = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(PROFILES_KEY));
    return Array.isArray(cached) ? cached : [];
  } catch {
    return [];
  }
};
const saveCachedProfiles = (rows) => {
  try {
    if (rows) localStorage.setItem(PROFILES_KEY, JSON.stringify(rows));
    else localStorage.removeItem(PROFILES_KEY);
  } catch {
    // storage unavailable — fine, we just won't have the instant start
  }
};

const ListProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [localData, setLocalData] = useState(loadLocal);
  const [sharedData, setSharedData] = useState(EMPTY);
  const [syncError, setSyncError] = useState(null);
  const [profiles, setProfiles] = useState(loadCachedProfiles);
  // true once we have profiles from the cache or from Supabase
  const [profilesLoaded, setProfilesLoaded] = useState(() => loadCachedProfiles().length > 0);
  const [profilesError, setProfilesError] = useState(null);
  const [onlineIds, setOnlineIds] = useState([]);
  const refetchTimer = useRef(null);

  const shared = Boolean(supabase && session);
  const data = shared ? sharedData : localData;
  const setData = shared ? setSharedData : setLocalData;

  useEffect(() => saveLocal(localData), [localData]);

  // ---- auth ----
  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    try {
      setSharedData(await fetchShared());
      setSyncError(null);
    } catch (err) {
      console.error(err);
      setSyncError(err.message || 'Could not load the shared list');
    }
  }, []);

  const refreshProfiles = useCallback(async () => {
    const { data: rows, error } = await supabase
      .from('profiles')
      .select('*'); // '*' so newer columns (e.g. the stats counters) are optional
    if (error) {
      // e.g. supabase/profiles.sql hasn't been run yet
      console.error(error);
      setProfilesError(error.message);
      return;
    }
    setProfiles(rows);
    setProfilesLoaded(true);
    saveCachedProfiles(rows);
    setProfilesError(null);
  }, []);

  // ---- load + live updates while logged in ----
  useEffect(() => {
    if (!shared) {
      // Only forget profiles once we know you're actually logged out
      // (not during the split second before the session is read).
      if (authReady) {
        setProfiles([]);
        setProfilesLoaded(false);
        saveCachedProfiles(null);
      }
      return undefined;
    }
    refresh();
    refreshProfiles();
    const scheduleRefresh = () => {
      clearTimeout(refetchTimer.current);
      refetchTimer.current = setTimeout(refresh, 150);
    };
    const channel = supabase
      .channel('household-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planned_meals' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_items' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => refreshProfiles())
      .subscribe();
    return () => {
      clearTimeout(refetchTimer.current);
      supabase.removeChannel(channel);
    };
  }, [shared, authReady, refresh, refreshProfiles]);

  // ---- who's online right now (Supabase Presence) ----
  useEffect(() => {
    const me = session?.user?.id;
    if (!shared || !me) {
      setOnlineIds([]);
      return undefined;
    }
    const presence = supabase.channel('household-presence', {
      config: { presence: { key: me } },
    });
    presence
      .on('presence', { event: 'sync' }, () => setOnlineIds(Object.keys(presence.presenceState())))
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') presence.track({ online_at: new Date().toISOString() });
      });
    return () => {
      supabase.removeChannel(presence);
    };
  }, [shared, session?.user?.id]);

  // Run a Supabase write after an optimistic local update; resync on failure.
  const remote = useCallback(
    async (write) => {
      if (!shared) return;
      const { error } = await write();
      if (error) {
        console.error(error);
        setSyncError(error.message);
        refresh();
      }
    },
    [shared, refresh]
  );

  // Lifetime counters for the character sheet (supabase/profile_stats.sql).
  // Only counted on the shared list; failures are harmless.
  const bumpStats = ({ meals = 0, added = 0, ticked = 0 }) => {
    const me = session?.user?.id;
    if (!shared || !me || (!meals && !added && !ticked)) return;
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === me
          ? {
              ...p,
              meals_planned: (p.meals_planned || 0) + meals,
              items_added: (p.items_added || 0) + added,
              items_ticked: (p.items_ticked || 0) + ticked,
            }
          : p
      )
    );
    supabase.rpc('bump_my_stats', { meals, added, ticked }).then(({ error }) => {
      if (error) console.warn('Stats not counted (has profile_stats.sql been run?):', error.message);
    });
  };

  // ---- actions ----
  const addMeal = (title, ingredients = [], multiplier = 1) => {
    const meal = { id: newId(), title };
    const newItems = ingredients
      .flat(Infinity)
      .map((ing) => toItem(ing, multiplier, meal.id))
      .filter((item) => item.name);
    setData((prev) => ({ meals: [...prev.meals, meal], items: [...prev.items, ...newItems] }));
    remote(async () => {
      const res = await supabase.from('planned_meals').insert(meal);
      if (res.error || !newItems.length) return res;
      return supabase.from('grocery_items').insert(newItems);
    });
    bumpStats({ meals: 1, added: newItems.length });
  };

  // Standalone items (not tied to a meal).
  const addToGroceryList = (ingredients = [], multiplier = 1) => {
    const newItems = ingredients
      .flat(Infinity)
      .map((ing) => toItem(ing, multiplier, null))
      .filter((item) => item.name);
    if (!newItems.length) return;
    setData((prev) => ({ ...prev, items: [...prev.items, ...newItems] }));
    remote(() => supabase.from('grocery_items').insert(newItems));
    bumpStats({ added: newItems.length });
  };

  const addItem = (item) => addToGroceryList([item]);

  const removeMeal = (index) => {
    const meal = data.meals[index];
    if (!meal) return;
    setData((prev) => ({
      meals: prev.meals.filter((m) => m.id !== meal.id),
      items: prev.items.filter((item) => item.planned_meal_id !== meal.id),
    }));
    // grocery items for the meal are removed by ON DELETE CASCADE
    remote(() => supabase.from('planned_meals').delete().eq('id', meal.id));
  };

  const removeGrocery = (group) => {
    const ids = new Set(group.ids);
    setData((prev) => ({ ...prev, items: prev.items.filter((item) => !ids.has(item.id)) }));
    remote(() => supabase.from('grocery_items').delete().in('id', group.ids));
  };

  const toggleChecked = (group) => {
    const ids = new Set(group.ids);
    const checked = !group.checked;
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (ids.has(item.id) ? { ...item, checked } : item)),
    }));
    remote(() => supabase.from('grocery_items').update({ checked }).in('id', group.ids));
    if (checked) bumpStats({ ticked: 1 });
  };

  const clearChecked = () => {
    const ids = data.items.filter((item) => item.checked).map((item) => item.id);
    if (!ids.length) return;
    setData((prev) => ({ ...prev, items: prev.items.filter((item) => !item.checked) }));
    remote(() => supabase.from('grocery_items').delete().in('id', ids));
  };

  const clearLists = () => {
    setData(EMPTY);
    remote(async () => {
      const res = await supabase.from('grocery_items').delete().not('id', 'is', null);
      if (res.error) return res;
      return supabase.from('planned_meals').delete().not('id', 'is', null);
    });
  };

  const signIn = async (email, password) => {
    if (!supabase) return { ok: false, message: 'Shared lists are not set up yet' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { ok: false, message: error.message } : { ok: true };
  };

  const signOut = () => supabase?.auth.signOut();

  // ---- profiles ----
  const userId = session?.user?.id;
  const myProfile = useMemo(() => {
    if (!userId) return null;
    const row = profiles.find((p) => p.id === userId);
    return {
      id: userId,
      display_name: '',
      bio: '',
      avatar_url: null,
      cook_willingness: 5,
      eat_willingness: 5,
      favorites: [],
      ...row,
    };
  }, [profiles, userId]);
  const mateProfiles = useMemo(
    () => profiles.filter((p) => p.id !== userId),
    [profiles, userId]
  );

  // Partial update of your own profile (creates the row the first time).
  const saveProfile = async (fields) => {
    if (!userId) return { ok: false, message: 'Not logged in' };
    const row = { id: userId, ...fields }; // updated_at is set by the database
    setProfiles((prev) => {
      const existing = prev.find((p) => p.id === userId) || {};
      return [...prev.filter((p) => p.id !== userId), { ...existing, ...row }];
    });
    const { error } = await supabase.from('profiles').upsert(row);
    if (error) {
      console.error(error);
      refreshProfiles();
      return { ok: false, message: error.message };
    }
    return { ok: true };
  };

  // Storage path of one of our avatar URLs ("<user id>/<timestamp>.jpg").
  const avatarPath = (url) => {
    const marker = '/object/public/avatars/';
    const i = url ? url.indexOf(marker) : -1;
    return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split('?')[0]);
  };

  // `file` can be a photo straight from the picker (gets shrunk here) or a
  // JPEG that's already been cropped to size (`{ prepared: true }`).
  const uploadAvatar = async (file, { prepared = false } = {}) => {
    if (!userId) return { ok: false, message: 'Not logged in' };
    const previousPath = avatarPath(myProfile?.avatar_url);
    try {
      const blob = prepared ? file : await resizeImage(file);
      const path = `${userId}/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
      if (error) return { ok: false, message: error.message };
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const saved = await saveProfile({ avatar_url: urlData.publicUrl });
      // Tidy up: remove the photo this one replaced (only ever in your own folder).
      if (saved.ok && previousPath && previousPath.startsWith(`${userId}/`)) {
        supabase.storage.from('avatars').remove([previousPath]);
      }
      return saved;
    } catch (err) {
      return { ok: false, message: err.message || 'Could not upload that photo' };
    }
  };

  const isFavorite = (title) => Boolean(myProfile?.favorites?.includes(title));

  const toggleFavorite = (title) => {
    if (!myProfile) return;
    const current = myProfile.favorites || [];
    const favorites = current.includes(title)
      ? current.filter((t) => t !== title)
      : [...current, title];
    saveProfile({ favorites });
  };

  // Display names of everyone who has favourited a meal.
  const favoritedBy = (title) =>
    profiles
      .filter((p) => p.favorites?.includes(title))
      .map((p) => (p.id === userId ? 'you' : p.display_name || 'your party member'));

  const updatePassword = async (password) => {
    if (!supabase) return { ok: false, message: 'Shared lists are not set up yet' };
    const { error } = await supabase.auth.updateUser({ password });
    return error ? { ok: false, message: error.message } : { ok: true };
  };

  // Same ingredient + unit shows as one line with the quantities added up.
  const groceryList = useMemo(() => {
    const groups = new Map();
    data.items.forEach((item) => {
      const key = groupKey(item);
      const group = groups.get(key);
      if (group) {
        group.quantity = round(group.quantity + item.quantity);
        group.ids.push(item.id);
        group.checked = group.checked && item.checked;
        group.extra = group.extra || (!item.planned_meal_id && !item.legacy);
      } else {
        groups.set(key, {
          key,
          name: item.name,
          unit: item.unit || '',
          quantity: item.quantity,
          ids: [item.id],
          checked: item.checked,
          extra: !item.planned_meal_id && !item.legacy,
        });
      }
    });
    return [...groups.values()];
  }, [data.items]);

  const value = {
    // data
    meals: data.meals,
    mealList: data.meals.map((meal) => meal.title),
    groceryList,
    // actions
    addMeal,
    addToGroceryList,
    addItem,
    removeMeal,
    removeGrocery,
    toggleChecked,
    clearChecked,
    clearLists,
    // sharing / auth
    sharingAvailable: Boolean(supabase),
    shared,
    authReady,
    user: session?.user || null,
    signIn,
    signOut,
    updatePassword,
    // profiles
    myProfile,
    mateProfiles,
    onlineIds,
    toBuyCount: groceryList.filter((item) => !item.checked).length,
    mealCount: data.meals.length,
    profilesError,
    profilesLoaded,
    saveProfile,
    uploadAvatar,
    isFavorite,
    toggleFavorite,
    favoritedBy,
    myItemCount: session ? data.items.filter((item) => item.added_by === session.user.id).length : 0,
    syncError,
  };

  return <ListContext.Provider value={value}>{children}</ListContext.Provider>;
};

const useList = () => {
  const context = useContext(ListContext);
  if (!context) {
    throw new Error('useList must be used within a list provider');
  }
  return context;
};

export { ListProvider, useList };
