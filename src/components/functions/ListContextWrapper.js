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
import { validateMeal, menuByCategory, newId } from '../../lib/mealRules';
import * as list from '../../lib/list';

/*
 * The Menu, the meal plan and the shopping list, shared live between
 * everyone logged in (see GLOSSARY.md for the terms).
 *
 *   menu:         Meals [{ id, title, category, servings, recipe_url, photo_url, ingredients }]
 *   plannedMeals: [{ id, title, meal_id, servings }]  (copies of Meals, ADR-0001)
 *   items:        [{ id, name, quantity, unit, checked, planned_meal_id }]
 * An item with planned_meal_id came from that Planned meal and goes away with
 * it; planned_meal_id === null means an Extra item ("paper towels").
 *
 * Everything needs you to be logged in: logged out there is no Menu or list.
 *
 * What each list change does lives in lib/list.js; this file applies it
 * locally straight away and then saves its `writes` (runWrites).
 */

const MEAL_PHOTOS = 'meal-photos';

const ListContext = createContext();

// ---------- Supabase ----------
// Save a list change's writes in order, stopping at the first error.
const runWrites = async (writes) => {
  for (const { table, insert, update, ids, delete: deleteIds, deleteAll } of writes) {
    const rows = supabase.from(table);
    let res;
    if (insert) res = await rows.insert(insert);
    else if (update) res = await rows.update(update).in('id', ids);
    else if (deleteIds) res = await rows.delete().in('id', deleteIds);
    else if (deleteAll) res = await rows.delete().not('id', 'is', null);
    if (res.error) return res;
  }
  return { error: null };
};

const fetchShared = async () => {
  const [plannedMeals, items] = await Promise.all([
    supabase.from('planned_meals').select('id, title, meal_id, servings').order('created_at'),
    supabase
      .from('grocery_items')
      .select('id, name, quantity, unit, checked, planned_meal_id, added_by')
      .order('created_at'),
  ]);
  if (plannedMeals.error) throw plannedMeals.error;
  if (items.error) throw items.error;
  return {
    plannedMeals: plannedMeals.data,
    items: items.data.map((item) => ({ ...item, quantity: Number(item.quantity) })),
  };
};

const fetchMenu = async () => {
  const { data, error } = await supabase
    .from('meals')
    .select('id, title, category, servings, recipe_url, photo_url, ingredients');
  if (error) throw error;
  return data;
};

// Storage path of one of our uploaded photo URLs, or null for anything else
// (e.g. the original menu photos served by the site from /food).
const storagePath = (bucket, url) => {
  const marker = `/object/public/${bucket}/`;
  const i = url ? url.indexOf(marker) : -1;
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split('?')[0]);
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
  const [data, setData] = useState(list.EMPTY_LIST);
  // the latest list, so back-to-back changes build on each other
  const dataRef = useRef(list.EMPTY_LIST);
  const [menu, setMenu] = useState([]);
  const [menuStatus, setMenuStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [syncError, setSyncError] = useState(null);
  const [profiles, setProfiles] = useState(loadCachedProfiles);
  // true once we have profiles from the cache or from Supabase
  const [profilesLoaded, setProfilesLoaded] = useState(() => loadCachedProfiles().length > 0);
  const [profilesError, setProfilesError] = useState(null);
  const [onlineIds, setOnlineIds] = useState([]);
  const refetchTimer = useRef(null);

  const shared = Boolean(supabase && session);

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

  const setList = useCallback((next) => {
    dataRef.current = next;
    setData(next);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setList(await fetchShared());
      setSyncError(null);
    } catch (err) {
      console.error(err);
      setSyncError(err.message || 'Could not load the shared list');
    }
  }, [setList]);

  const refreshMenu = useCallback(async () => {
    try {
      setMenu(await fetchMenu());
      setMenuStatus('ready');
    } catch (err) {
      // e.g. supabase/meals.sql hasn't been run yet
      console.error(err);
      setMenuStatus('error');
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
        setList(list.EMPTY_LIST);
        setMenu([]);
        setMenuStatus('loading');
      }
      return undefined;
    }
    refresh();
    refreshMenu();
    refreshProfiles();
    const scheduleRefresh = () => {
      clearTimeout(refetchTimer.current);
      refetchTimer.current = setTimeout(refresh, 150);
    };
    const channel = supabase
      .channel('household-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planned_meals' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_items' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, () => refreshMenu())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => refreshProfiles())
      .subscribe();
    return () => {
      clearTimeout(refetchTimer.current);
      supabase.removeChannel(channel);
    };
  }, [shared, authReady, refresh, refreshMenu, refreshProfiles, setList]);

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
  const bumpStats = ({ meals = 0, added = 0, ticked = 0, created = 0 }) => {
    const me = session?.user?.id;
    if (!shared || !me || (!meals && !added && !ticked && !created)) return;
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === me
          ? {
              ...p,
              meals_planned: (p.meals_planned || 0) + meals,
              items_added: (p.items_added || 0) + added,
              items_ticked: (p.items_ticked || 0) + ticked,
              meals_created: (p.meals_created || 0) + created,
            }
          : p
      )
    );
    supabase.rpc('bump_my_stats', { meals, added, ticked, created }).then(({ error }) => {
      if (error) console.warn('Stats not counted (have profile_stats.sql and meals.sql been run?):', error.message);
    });
  };

  const userId = session?.user?.id;

  // ---- the Menu ----
  // Upload a cropped JPEG as a Meal's photo; returns its public URL.
  const uploadMealPhoto = async (mealId, blob) => {
    const path = `${mealId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from(MEAL_PHOTOS)
      .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
    if (error) throw error;
    return supabase.storage.from(MEAL_PHOTOS).getPublicUrl(path).data.publicUrl;
  };

  // Tidy up a photo we uploaded (original /food photos are left alone).
  const removeStoredPhoto = (url) => {
    const path = storagePath(MEAL_PHOTOS, url);
    if (path) supabase.storage.from(MEAL_PHOTOS).remove([path]);
  };

  // Create (no draft.id) or update a Meal. `photo`: a cropped JPEG Blob to
  // use, null to remove the photo, undefined to leave it as it is.
  // Returns { ok, meal } or { ok: false, problems: [...] }.
  const saveMeal = async (draft, { photo } = {}) => {
    const problems = validateMeal(draft, menu);
    if (problems.length) return { ok: false, problems };
    const existing = draft.id ? menu.find((meal) => meal.id === draft.id) : null;
    const id = existing ? existing.id : newId();
    const row = {
      id,
      title: draft.title.trim(),
      category: draft.category,
      servings: Math.max(1, Math.round(Number(draft.servings) || 1)),
      recipe_url: draft.recipe_url?.trim() || null,
      photo_url: existing ? existing.photo_url : null,
      ingredients: draft.ingredients.map(({ name, quantity, unit }) => ({ name, quantity, unit })),
    };
    try {
      if (photo) row.photo_url = await uploadMealPhoto(id, photo);
      else if (photo === null) row.photo_url = null;
    } catch (err) {
      return { ok: false, problems: [`Photo didn't upload: ${err.message}`] };
    }
    const { error } = existing
      ? await supabase.from('meals').update(row).eq('id', id)
      : await supabase.from('meals').insert(row);
    if (error) {
      console.error(error);
      if (photo) removeStoredPhoto(row.photo_url);
      const message = error.code === '23505' ? `${row.title} is already on the menu.` : error.message;
      return { ok: false, problems: [message] };
    }
    if (existing && existing.photo_url !== row.photo_url) removeStoredPhoto(existing.photo_url);
    setMenu((prev) => [...prev.filter((meal) => meal.id !== id), row]);
    if (!existing) bumpStats({ created: 1 });
    return { ok: true, meal: row };
  };

  // Planned meals of it stay on the list (ADR-0001); favourites of it are
  // cleared by the database.
  const deleteMeal = async (meal) => {
    const { error } = await supabase.from('meals').delete().eq('id', meal.id);
    if (error) return { ok: false, message: error.message };
    removeStoredPhoto(meal.photo_url);
    setMenu((prev) => prev.filter((m) => m.id !== meal.id));
    return { ok: true };
  };

  // ---- the list ----
  // Apply a lib/list.js change: show it now, save it, count it.
  // Returns the change ({ alreadyPlanned } when a Meal is already planned).
  const commit = (change) => {
    if (!change || change.alreadyPlanned) return change;
    setList(change.next);
    remote(() => runWrites(change.writes));
    bumpStats(change.stats);
    return change;
  };
  const change = (op) => (...args) => commit(op(dataRef.current, ...args));

  const planMeal = (meal, servings = meal.servings) => commit(list.plan(dataRef.current, meal, servings));

  const signIn = async (email, password) => {
    if (!supabase) return { ok: false, message: 'Shared lists are not set up yet' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { ok: false, message: error.message } : { ok: true };
  };

  const signOut = () => supabase?.auth.signOut();

  // ---- profiles ----
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

  // `file` can be a photo straight from the picker (gets shrunk here) or a
  // JPEG that's already been cropped to size (`{ prepared: true }`).
  const uploadAvatar = async (file, { prepared = false } = {}) => {
    if (!userId) return { ok: false, message: 'Not logged in' };
    const previousPath = storagePath('avatars', myProfile?.avatar_url);
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

  // Favourites are Meal ids, so they survive renames.
  const isFavorite = (mealId) => Boolean(myProfile?.favorites?.includes(mealId));

  const toggleFavorite = (mealId) => {
    if (!myProfile) return;
    const current = myProfile.favorites || [];
    const favorites = current.includes(mealId)
      ? current.filter((id) => id !== mealId)
      : [...current, mealId];
    saveProfile({ favorites });
  };

  // Display names of everyone who has favourited a Meal.
  const favoritedBy = (mealId) =>
    profiles
      .filter((p) => p.favorites?.includes(mealId))
      .map((p) => (p.id === userId ? 'you' : p.display_name || 'your party member'));

  const updatePassword = async (password) => {
    if (!supabase) return { ok: false, message: 'Shared lists are not set up yet' };
    const { error } = await supabase.auth.updateUser({ password });
    return error ? { ok: false, message: error.message } : { ok: true };
  };

  const groceryList = useMemo(() => list.groupItems(data.items), [data.items]);

  const menuSorted = useMemo(() => menuByCategory(menu), [menu]);

  const value = {
    // the Menu
    menu,
    menuByCategory: menuSorted,
    menuStatus,
    mealById: (id) => menu.find((meal) => meal.id === id) || null,
    saveMeal,
    deleteMeal,
    // the list
    plannedMeals: data.plannedMeals,
    mealList: data.plannedMeals.map((meal) => meal.title),
    plannedMealFor: (mealId) => data.plannedMeals.find((p) => p.meal_id === mealId) || null,
    itemsOf: (plannedMeal) => list.itemsOf(data, plannedMeal),
    groceryList,
    planMeal,
    updatePlannedMeal: change(list.editPlanned),
    setPlannedServings: change(list.rescalePlanned),
    addItem: change(list.addExtra),
    removePlannedMeal: change(list.removePlanned),
    removeGrocery: change(list.removeGroup),
    toggleChecked: change(list.toggleGroup),
    clearChecked: change(list.clearChecked),
    clearLists: change(list.clearAll),
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
    mealCount: data.plannedMeals.length,
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
