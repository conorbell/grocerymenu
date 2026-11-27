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
import {
  validateMeal,
  planMeal as planMealRule,
  editPlannedMeal,
  rescalePlannedMeal,
  menuByCategory,
  toItem,
  round,
  newId,
} from '../../lib/mealRules';

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
 */

const EMPTY = { plannedMeals: [], items: [] };
const MEAL_PHOTOS = 'meal-photos';

const ListContext = createContext();

const groupKey = (item) => `${item.name.toLowerCase()}|${item.unit || ''}`;

// "500 g", "2 cups"; plain counts show as "×3".
export const formatAmount = ({ quantity, unit }) => {
  if (!unit) return `×${quantity}`;
  const plural =
    quantity !== 1 &&
    /^(cup|can|bunch|clove|pack|slice|jar|bag|bottle|head)$/.test(unit);
  return `${quantity} ${unit}${plural ? (unit === 'bunch' ? 'es' : 's') : ''}`;
};

// ---------- Supabase ----------
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
  const [sharedData, setSharedData] = useState(EMPTY);
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
  const data = shared ? sharedData : EMPTY;
  const setData = setSharedData;

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
        setSharedData(EMPTY);
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
  }, [shared, authReady, refresh, refreshMenu, refreshProfiles]);

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
    if (!shared) return { ok: false, problems: ['Log in to change the menu.'] };
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
      ingredients: draft.ingredients
        .filter((ing) => String(ing.name || '').trim())
        .map((ing) => ({
          name: ing.name.trim(),
          quantity: round(Number(ing.quantity) > 0 ? Number(ing.quantity) : 1),
          unit: String(ing.unit || '').trim(),
        })),
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
    setProfiles((prev) =>
      prev.map((p) => (p.favorites?.includes(meal.id) ? { ...p, favorites: p.favorites.filter((f) => f !== meal.id) } : p))
    );
    return { ok: true };
  };

  // ---- the list ----
  // Put a Meal on the list for `servings`. Returns { ok } or, when it's
  // already there, { alreadyPlanned } (a Meal is planned at most once).
  const planMeal = (meal, servings = meal.servings) => {
    const result = planMealRule(meal, servings, data.plannedMeals);
    if (result.alreadyPlanned) return result;
    const { plannedMeal, items } = result;
    setData((prev) => ({
      plannedMeals: [...prev.plannedMeals, plannedMeal],
      items: [...prev.items, ...items],
    }));
    remote(async () => {
      const res = await supabase.from('planned_meals').insert(plannedMeal);
      if (res.error || !items.length) return res;
      return supabase.from('grocery_items').insert(items);
    });
    bumpStats({ meals: 1, added: items.length });
    return { ok: true, plannedMeal };
  };

  const itemsOf = (plannedMeal) => data.items.filter((item) => item.planned_meal_id === plannedMeal.id);

  // Save the Planned meal edit form ({ servings, rows }). Never touches the Meal.
  const updatePlannedMeal = (plannedMeal, changes) => {
    const edit = editPlannedMeal(plannedMeal, itemsOf(plannedMeal), changes);
    const updated = new Map(edit.updates.map((item) => [item.id, item]));
    const deleted = new Set(edit.deletes);
    setData((prev) => ({
      plannedMeals: prev.plannedMeals.map((p) => (p.id === plannedMeal.id ? edit.plannedMeal : p)),
      items: [
        ...prev.items.filter((item) => !deleted.has(item.id)).map((item) => updated.get(item.id) || item),
        ...edit.inserts,
      ],
    }));
    remote(async () => {
      const writes = [];
      if (edit.plannedMeal.servings !== plannedMeal.servings) {
        writes.push(supabase.from('planned_meals').update({ servings: edit.plannedMeal.servings }).eq('id', plannedMeal.id));
      }
      if (edit.deletes.length) writes.push(supabase.from('grocery_items').delete().in('id', edit.deletes));
      if (edit.inserts.length) writes.push(supabase.from('grocery_items').insert(edit.inserts));
      edit.updates.forEach(({ id, name, quantity, unit }) =>
        writes.push(supabase.from('grocery_items').update({ name, quantity, unit }).eq('id', id))
      );
      const results = await Promise.all(writes);
      return results.find((res) => res.error) || { error: null };
    });
    if (edit.inserts.length) bumpStats({ added: edit.inserts.length });
  };

  // Change how many a Planned meal serves; every quantity scales (ticks kept).
  const setPlannedServings = (plannedMeal, servings) => {
    const { items } = rescalePlannedMeal(plannedMeal, itemsOf(plannedMeal), servings);
    updatePlannedMeal(plannedMeal, { servings, rows: items });
  };

  // Extra items (not tied to a Planned meal).
  const addItem = (ingredient) => {
    const item = toItem(ingredient, 1, null);
    if (!item.name) return;
    setData((prev) => ({ ...prev, items: [...prev.items, item] }));
    remote(() => supabase.from('grocery_items').insert(item));
    bumpStats({ added: 1 });
  };

  const removePlannedMeal = (plannedMeal) => {
    setData((prev) => ({
      plannedMeals: prev.plannedMeals.filter((m) => m.id !== plannedMeal.id),
      items: prev.items.filter((item) => item.planned_meal_id !== plannedMeal.id),
    }));
    // grocery items for the meal are removed by ON DELETE CASCADE
    remote(() => supabase.from('planned_meals').delete().eq('id', plannedMeal.id));
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
        group.extra = group.extra || !item.planned_meal_id;
      } else {
        groups.set(key, {
          key,
          name: item.name,
          unit: item.unit || '',
          quantity: item.quantity,
          ids: [item.id],
          checked: item.checked,
          extra: !item.planned_meal_id,
        });
      }
    });
    return [...groups.values()];
  }, [data.items]);

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
    itemsOf,
    groceryList,
    planMeal,
    updatePlannedMeal,
    setPlannedServings,
    addItem,
    removePlannedMeal,
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
