import React, { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import { cropImage } from '../../../lib/image';
import { Link, Navigate } from 'react-router-dom';
import { useList } from '../../functions/ListContextWrapper';
import { HeartIcon } from '../../HeartIcon';
import { Avatar } from '../../Avatar';
import { rpgStats, cleanPoints } from '../../../lib/rpgStats';

// ---------- helpers ----------
const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

const nameFromEmail = (email = '') => {
  const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\d+$/, '').trim();
  return name ? name[0].toUpperCase() + name.slice(1) : 'You';
};

const COOK_LABELS = [
  [0, 'Cereal counts as dinner'],
  [3, 'Will boil pasta'],
  [5, 'Weeknight regular'],
  [8, 'Happy at the stove'],
  [10, "Chef's kiss"],
];
const EAT_LABELS = [
  [0, 'Bird appetite'],
  [3, 'Picky'],
  [5, "I'll try it"],
  [8, 'Seconds, please'],
  [10, 'Bottomless pit'],
];
const labelFor = (labels, value) =>
  labels.reduce((found, [min, text]) => (value >= min ? text : found), labels[0][1]);

// ---------- small pieces ----------

const Scale = ({ label, value, labels }) => (
  <div className="scale">
    <div className="scale__head">
      <span className="section-label">{label}</span>
      <span className="scale__value">
        {value}/10 · <em>{labelFor(labels, value)}</em>
      </span>
    </div>
    <div className="scale__pips" role="meter" aria-valuemin={0} aria-valuemax={10} aria-valuenow={value} aria-label={label}>
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={`scale__pip${i < value ? ' is-on' : ''}`} />
      ))}
    </div>
  </div>
);

const Favorites = ({ titles = [], editable, onRemove }) => (
  <div className="favorites">
    <h3 className="section-label">
      Favourites <span className="section-label__count">{titles.length || ''}</span>
    </h3>
    {titles.length === 0 ? (
      <p className="menu-note">
        {editable ? (
          <>
            Nothing yet. Tap the heart next to a dish on <Link to="/breakfast">breakfast</Link>,{' '}
            <Link to="/lunch">lunch</Link> or <Link to="/dinner">dinner</Link>.
          </>
        ) : (
          'No favourites yet.'
        )}
      </p>
    ) : (
      <ul className="menu-list">
        {titles.map((title) => (
          <li key={title} className="list-row">
            <span className="list-row__name">{title}</span>
            <span className="leader" aria-hidden="true" />
            {editable ? (
              <button className="heart is-on" aria-label={`Remove ${title} from favourites`} onClick={() => onRemove(title)}>
                <HeartIcon filled />
              </button>
            ) : (
              <span className="heart is-on" aria-hidden="true">
                <HeartIcon filled />
              </span>
            )}
          </li>
        ))}
      </ul>
    )}
  </div>
);

const Bar = ({ value, max, label }) => (
  <span
    className="sheet__bar"
    role="meter"
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={max}
    aria-valuenow={value}
  >
    <span style={{ width: `${Math.round((value / max) * 100)}%` }} />
  </span>
);

// RPG-style character sheet. `children` = the Commands (only on your own).
// While `allocating`, the stats window turns into the stat-point screen.
export const ProfileCard = ({
  profile,
  fallbackName,
  children,
  mine,
  onRemoveFavorite,
  allocating = false,
  onSaveAllocation,
  onCloseAllocation,
}) => {
  const { toBuyCount = 0, mealCount = 0 } = useList();
  const name = profile.display_name || fallbackName;
  const [draft, setDraft] = useState(null);
  const [allocError, setAllocError] = useState(null);
  const [savingAlloc, setSavingAlloc] = useState(false);

  // Start a fresh draft from the saved points each time allocate mode opens.
  useEffect(() => {
    setDraft(allocating ? cleanPoints(profile.stat_points) : null);
    setAllocError(null);
  }, [allocating]); // eslint-disable-line react-hooks/exhaustive-deps

  const rpg = rpgStats(profile, {
    toBuy: toBuyCount,
    mealsPlanned: mealCount,
    pointsOverride: draft ?? undefined,
  });
  const saved = cleanPoints(profile.stat_points);
  const changePoint = (key, delta) =>
    setDraft((d) => {
      const next = { ...d, [key]: Math.max(0, (d[key] || 0) + delta) };
      if (!next[key]) delete next[key];
      return next;
    });
  const draftChanged = draft && JSON.stringify(draft) !== JSON.stringify(saved);

  const saveAllocation = async () => {
    setSavingAlloc(true);
    const res = await onSaveAllocation(draft);
    setSavingAlloc(false);
    if (res?.ok === false) setAllocError(res.message || 'Could not save your stat points');
    else onCloseAllocation();
  };

  return (
    <article className={`profile${mine ? ' profile--mine' : ' profile--mate'}`}>
      <div className="sheet">
        {/* top window: who + vitals */}
        <section className="window sheet__top">
          <Avatar url={profile.avatar_url} name={name} size={mine ? 'large' : 'medium'} />
          <div className="sheet__who">
            <h2 className="profile__name">{name}</h2>
            <p className="sheet__class">{rpg.className}</p>
            <p className={`profile__bio${profile.bio ? '' : ' is-empty'}`}>
              {profile.bio || (mine ? 'No bio yet. Tell your party what you’re about.' : 'No bio yet.')}
            </p>
          </div>
          <dl className="sheet__vitals">
            <div className="sheet__row">
              <dt>LV</dt>
              <dd>{rpg.level}</dd>
            </div>
            <div className="sheet__row">
              <dt>HP</dt>
              <dd>
                {rpg.hp}<span className="sheet__max">/ {rpg.hpMax}</span>
              </dd>
            </div>
            <Bar value={rpg.hp} max={rpg.hpMax} label="HP" />
            <div className="sheet__row">
              <dt>MP</dt>
              <dd>
                {rpg.mp}<span className="sheet__max">/ {rpg.mpMax}</span>
              </dd>
            </div>
            <Bar value={rpg.mp} max={rpg.mpMax} label="MP" />
            <div className="sheet__row sheet__row--exp">
              <dt>Current EXP</dt>
              <dd>{rpg.exp}</dd>
            </div>
            <div className="sheet__row">
              <dt>For next level</dt>
              <dd>{rpg.nextLevelIn}</dd>
            </div>
          </dl>
        </section>

        {/* bottom window: stats + commands */}
        <section
          className={`window sheet__bottom${children ? '' : ' sheet__bottom--solo'}${
            allocating ? ' is-allocating' : ''
          }`}
        >
          <div className="sheet__stats-wrap">
            {allocating && (
              <p className="points-banner">
                <span className="section-label">Points to spend</span>
                <span className="points-banner__num">{rpg.pointsLeft}</span>
              </p>
            )}
            <ul className="sheet__stats">
              {rpg.stats.map((stat) => (
                <li key={stat.key} className="list-row">
                  <span className="sheet__stat-name">{stat.label}</span>
                  <span className="leader" aria-hidden="true" />
                  <span className="sheet__stat-value">
                    {stat.value}
                    {stat.bonus > 0 && <span className="sheet__bonus"> (+{stat.bonus})</span>}
                  </span>
                  {allocating && (
                    <span className="stepper">
                      <button
                        type="button"
                        aria-label={`Take a point from ${stat.label}`}
                        disabled={!stat.bonus}
                        onClick={() => changePoint(stat.key, -1)}
                      >
                        −
                      </button>
                      <button
                        type="button"
                        aria-label={`Add a point to ${stat.label}`}
                        disabled={rpg.pointsLeft <= 0}
                        onClick={() => changePoint(stat.key, 1)}
                      >
                        +
                      </button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {allocating && (
              <div className="alloc-actions">
                <button
                  type="button"
                  className="text-btn"
                  disabled={!Object.keys(draft || {}).length}
                  onClick={() => setDraft({})}
                >
                  Reset all
                </button>
                <span className="alloc-actions__spacer" />
                <button type="button" className="text-btn" onClick={onCloseAllocation}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="pill pill--solid"
                  disabled={!draftChanged || savingAlloc}
                  onClick={saveAllocation}
                >
                  {savingAlloc ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
            {allocError && <p className="form-message">{allocError}</p>}
          </div>
          {children && (
            <div className="sheet__commands">
              <h3 className="section-label">Commands</h3>
              <div className="window window--inner">{children}</div>
            </div>
          )}
        </section>

        {/* third window: traits + favourites */}
        <section className="window sheet__extras">
          <div className="sheet__scales">
            <h3 className="section-label">Traits</h3>
            <Scale label="Willingness to cook" value={profile.cook_willingness ?? 5} labels={COOK_LABELS} />
            <Scale label="Willingness to eat" value={profile.eat_willingness ?? 5} labels={EAT_LABELS} />
          </div>
          <Favorites titles={profile.favorites} editable={mine} onRemove={onRemoveFavorite} />
        </section>
      </div>
    </article>
  );
};

// ---------- MMO-style party frames: click one to inspect that member ----------
export const PartyHud = ({ members, selectedId, onSelect, onlineIds = [], meId }) => {
  const { toBuyCount = 0, mealCount = 0 } = useList();
  return (
    <section className="party" aria-label="Party">
      <h2 className="section-label party__title">
        Party <span className="section-label__count">{members.length}</span>
      </h2>
      <div className="party__frames" role="tablist">
        {members.map(({ profile, fallbackName }, i) => {
          const rpg = rpgStats(profile, { toBuy: toBuyCount, mealsPlanned: mealCount });
          const name = profile.display_name || fallbackName;
          const online = onlineIds.includes(profile.id);
          const selected = profile.id === selectedId;
          return (
            <button
              key={profile.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`window party__frame${selected ? ' is-selected' : ''}`}
              onClick={() => onSelect(profile.id)}
            >
              <span className="party__portrait">
                <Avatar url={profile.avatar_url} name={name} size="tiny" />
                <span
                  className={`party__status${online ? ' is-online' : ''}`}
                  title={online ? 'Online now' : 'Offline'}
                />
              </span>
              <span className="party__info">
                <span className="party__name">
                  {i === 0 && <span className="party__leader" title="Party leader">★</span>}
                  {name}
                  {profile.id === meId && <span className="party__you">you</span>}
                </span>
                <span className="party__meta">
                  LV {rpg.level} · {rpg.className}
                </span>
                <span className="party__bar party__bar--hp">
                  <span className="party__bar-label">HP</span>
                  <Bar value={rpg.hp} max={rpg.hpMax} label={`${name} HP`} />
                  <span className="party__bar-num">
                    {rpg.hp}/{rpg.hpMax}
                  </span>
                </span>
                <span className="party__bar party__bar--mp">
                  <span className="party__bar-label">MP</span>
                  <Bar value={rpg.mp} max={rpg.mpMax} label={`${name} MP`} />
                  <span className="party__bar-num">
                    {rpg.mp}/{rpg.mpMax}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

// A Commands-menu entry (▶ cursor on hover/focus, like an RPG menu).
export const Command = ({ to, onClick, children }) =>
  to ? (
    <Link className="command" to={to}>
      {children}
    </Link>
  ) : (
    <button type="button" className="command" onClick={onClick}>
      {children}
    </button>
  );

// ---------- photo crop step: drag to reposition, slider/pinch to zoom ----------
const PhotoCropper = ({ src, initial, onCancel, onDone }) => {
  const [crop, setCrop] = useState(initial?.crop || { x: 0, y: 0 });
  const [zoom, setZoom] = useState(initial?.zoom || 1);
  const [area, setArea] = useState(null);
  const onCropComplete = useCallback((_percent, pixels) => setArea(pixels), []);

  return (
    <div className="cell cell--full cell--cropper">
      <span className="cell__label">Drag to reposition · pinch or slide to zoom</span>
      <div className="cropper">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          minZoom={1}
          maxZoom={4}
          aspect={4 / 5}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="cropper__controls">
        <span className="cropper__zoom-label" aria-hidden="true">−</span>
        <input
          type="range"
          min="1"
          max="4"
          step="0.01"
          value={zoom}
          aria-label="Zoom"
          onChange={(e) => setZoom(Number(e.target.value))}
        />
        <span className="cropper__zoom-label" aria-hidden="true">+</span>
      </div>
      <div className="cropper__actions">
        <button type="button" className="text-btn" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="pill"
          disabled={!area}
          onClick={() => onDone({ area, crop, zoom })}
        >
          Use photo
        </button>
      </div>
    </div>
  );
};

// ---------- edit form (same ruled-ticket style as Create meal) ----------
export const EditProfile = ({ profile, fallbackName, onClose }) => {
  const { saveProfile, uploadAvatar } = useList();
  const [name, setName] = useState(profile.display_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [cook, setCook] = useState(profile.cook_willingness ?? 5);
  const [eat, setEat] = useState(profile.eat_willingness ?? 5);
  const [photo, setPhoto] = useState(null); // cropped JPEG ready to upload
  const [preview, setPreview] = useState(profile.avatar_url);
  const [rawFile, setRawFile] = useState(null); // photo as picked, before cropping
  const [rawUrl, setRawUrl] = useState(null);
  const [cropping, setCropping] = useState(false);
  const [lastCrop, setLastCrop] = useState(null); // so "Adjust" reopens where you left it
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (cropping) setCropping(false);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, cropping]);

  // Object URL for the cropper while a picked photo is around.
  useEffect(() => {
    if (!rawFile) return undefined;
    const url = URL.createObjectURL(rawFile);
    setRawUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [rawFile]);

  const pickPhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again
    if (!file) return;
    setStatus(null);
    setLastCrop(null);
    setRawFile(file);
    setCropping(true);
  };

  const finishCrop = async ({ area, crop, zoom }) => {
    try {
      setPhoto(await cropImage(rawFile, area));
      setLastCrop({ crop, zoom });
      setCropping(false);
    } catch (err) {
      setStatus(err.message);
    }
  };

  // Show the cropped photo straight away.
  useEffect(() => {
    if (!photo) return undefined;
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    if (photo) {
      const up = await uploadAvatar(photo, { prepared: true });
      if (!up.ok) {
        setSaving(false);
        return setStatus(`Photo didn't upload: ${up.message}`);
      }
    }
    const res = await saveProfile({
      display_name: name.trim() || null,
      bio: bio.trim() || null,
      cook_willingness: Number(cook),
      eat_willingness: Number(eat),
    });
    setSaving(false);
    if (res.ok) onClose();
    else setStatus(res.message);
  };

  return (
    <div className="modal-layer">
      <div className="ticket" role="dialog" aria-labelledby="edit-profile-title">
        <div className="ticket__head">
          <button type="button" className="ticket__close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3 L21 21 M21 3 L3 21" />
            </svg>
          </button>
          <h2 id="edit-profile-title">Edit Profile</h2>
        </div>

        <form className="ticket__grid" onSubmit={handleSubmit}>
          {cropping && rawUrl ? (
            <PhotoCropper
              src={rawUrl}
              initial={lastCrop}
              onCancel={() => setCropping(false)}
              onDone={finishCrop}
            />
          ) : (
            <div className="cell cell--full cell--photo">
              <Avatar url={preview} name={name || fallbackName} size="small" />
              <div className="photo-pick">
                <span className="cell__label">Photo</span>
                <div className="photo-pick__links">
                  <label className="photo-pick__btn">
                    {preview ? 'Change photo' : 'Add a photo'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                      onChange={pickPhoto}
                    />
                  </label>
                  {rawFile && (
                    <button type="button" className="photo-pick__btn" onClick={() => setCropping(true)}>
                      Adjust
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <label className="cell cell--full">
            <span className="cell__label">Display name</span>
            <input
              type="text"
              maxLength={40}
              placeholder={fallbackName}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="cell cell--full cell--tall">
            <span className="cell__label">Bio</span>
            <textarea
              rows={3}
              maxLength={280}
              placeholder="Snack philosophy, food crimes, signature dish…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <span className="cell__hint">{280 - bio.length} left</span>
          </label>

          <label className="cell cell--full cell--range">
            <span className="cell__label">Willingness to cook</span>
            <input type="range" min="0" max="10" value={cook} onChange={(e) => setCook(e.target.value)} />
            <span className="cell__value">
              {cook} · {labelFor(COOK_LABELS, Number(cook))}
            </span>
          </label>

          <label className="cell cell--full cell--range">
            <span className="cell__label">Willingness to eat</span>
            <input type="range" min="0" max="10" value={eat} onChange={(e) => setEat(e.target.value)} />
            <span className="cell__value">
              {eat} · {labelFor(EAT_LABELS, Number(eat))}
            </span>
          </label>

          {status && <p className="cell cell--full cell--error">{status}</p>}

          <button type="submit" className="cell cell--full ticket__submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ---------- account settings (password etc.) ----------
export const ChangePassword = () => {
  const { updatePassword } = useList();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setMessage('Use at least 8 characters.');
    if (password !== confirm) return setMessage("Those passwords don't match.");
    setSaving(true);
    const res = await updatePassword(password);
    setSaving(false);
    if (res.ok) {
      setPassword('');
      setConfirm('');
      setMessage('Password updated.');
    } else {
      setMessage(res.message || "Couldn't update the password.");
    }
  };

  return (
    <>
      <form className="pw-form" onSubmit={handleSubmit}>
        <label className="pw-form__cell">
          <span className="pw-form__label">New password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <label className="pw-form__cell">
          <span className="pw-form__label">Again</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </label>
        <button className="pw-form__submit" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Update'}
        </button>
      </form>
      <p className="pw-form__message" aria-live="polite">
        {message}
      </p>
    </>
  );
};

// ---------- account settings window (yours only) ----------
const InfoRow = ({ label, value }) => (
  <li className="list-row">
    <span className="settings__label">{label}</span>
    <span className="leader" aria-hidden="true" />
    <span className="settings__value">{value}</span>
  </li>
);

export const SettingsPanel = ({ email, createdAt, lastSignIn, listStats, onSignOut }) => (
  <details className="window settings" id="account-settings">
    <summary className="section-label">Account settings</summary>

    <div className="settings__grid">
      <div>
        <h3 className="section-label">Your account</h3>
        <ul className="menu-list">
          <InfoRow label="Email" value={email} />
          <InfoRow label="Member since" value={formatDate(createdAt)} />
          <InfoRow label="Last signed in" value={formatDate(lastSignIn)} />
        </ul>
      </div>
      <div>
        <h3 className="section-label">The shared list</h3>
        <ul className="menu-list">
          <InfoRow label="Meals planned" value={listStats.meals} />
          <InfoRow label="Things to buy" value={listStats.toBuy} />
          <InfoRow label="Ticked off" value={listStats.ticked} />
          <InfoRow label="Added by you" value={listStats.mine} />
        </ul>
      </div>
    </div>

    <h3 className="section-label">Change password</h3>
    <ChangePassword />

    <div className="settings__footer">
      <button type="button" className="pill" onClick={onSignOut}>
        Log out
      </button>
    </div>
  </details>
);

// ---------- page ----------
export const Account = () => {
  const {
    sharingAvailable,
    authReady,
    user,
    signOut,
    groceryList,
    mealList,
    myItemCount,
    myProfile,
    mateProfiles,
    profilesError,
    toggleFavorite,
    onlineIds,
    saveProfile,
    profilesLoaded,
  } = useList();
  const [editing, setEditing] = useState(false);
  const [inspectId, setInspectId] = useState(null); // null = yourself
  const [allocating, setAllocating] = useState(false);
  const openSettings = () => {
    const el = document.getElementById('account-settings');
    if (!el) return;
    el.open = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!authReady) return <p className="menu-note">Loading…</p>;
  if (!sharingAvailable || !user) return <Navigate to="/user/login" replace />;

  // Until profiles arrive, show no name rather than flashing the email-based one.
  const fallbackName = profilesLoaded ? nameFromEmail(user.email) : '';
  const inspected = mateProfiles.find((m) => m.id === inspectId) || myProfile;
  const ticked = groceryList.filter((item) => item.checked).length;

  return (
    <section className="page account">
      <h1 className="display">PROFILE</h1>

      {profilesError && (
        <p className="sync-error" role="alert">
          Profiles aren't set up yet. Run <code>supabase/profiles.sql</code> in the Supabase SQL
          Editor. ({profilesError})
        </p>
      )}

      <PartyHud
        members={[
          { profile: myProfile, fallbackName },
          ...mateProfiles.map((mate) => ({
            profile: mate,
            fallbackName: profilesLoaded ? 'Party member' : '',
          })),
        ]}
        selectedId={inspected.id}
        onSelect={(id) => setInspectId(id === myProfile.id ? null : id)}
        onlineIds={onlineIds}
        meId={myProfile.id}
      />

      {inspected.id === myProfile.id ? (
        <ProfileCard
          profile={myProfile}
          fallbackName={fallbackName}
          mine
          onRemoveFavorite={toggleFavorite}
          allocating={allocating}
          onSaveAllocation={(points) => saveProfile({ stat_points: points })}
          onCloseAllocation={() => setAllocating(false)}
        >
          {!profilesError && <Command onClick={() => setEditing(true)}>Edit profile</Command>}
          {!profilesError && (
            <Command onClick={() => setAllocating(true)}>Allocate stats</Command>
          )}
          <Command to="/checkout">See the list</Command>
          <Command onClick={() => openSettings()}>Settings</Command>
        </ProfileCard>
      ) : (
        <ProfileCard key={inspected.id} profile={inspected} fallbackName="Party member" />
      )}

      {/* settings are yours only, so hide them while inspecting someone else */}
      {inspected.id === myProfile.id && (
        <SettingsPanel
          email={user.email}
          createdAt={user.created_at}
          lastSignIn={user.last_sign_in_at}
          listStats={{
            meals: mealList.length,
            toBuy: groceryList.length - ticked,
            ticked,
            mine: myItemCount,
          }}
          onSignOut={signOut}
        />
      )}

      {editing && (
        <EditProfile profile={myProfile} fallbackName={fallbackName} onClose={() => setEditing(false)} />
      )}
    </section>
  );
};
