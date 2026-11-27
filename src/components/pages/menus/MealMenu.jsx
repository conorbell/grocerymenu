import React, { useCallback, useState } from 'react';
import { useList } from '../../functions/ListContextWrapper';
import { HeartIcon } from '../../HeartIcon';
import { CreateMeal } from '../../CreateMeal';
import { PhotoReel } from '../../PhotoReel';
import { SignInPrompt } from '../../SignInPrompt';
import { ingredientLabel } from '../../../lib/ingredients';
import { CATEGORIES } from '../../../lib/mealRules';

// How many to plan a Meal for; fixed once it's on the list (ADR-0003).
const ServingsPicker = ({ meal, servings, setServings }) => (
  <span className="stepper" role="group" aria-label={`Servings of ${meal.title} to add`}>
    <span className="stepper__label">add for</span>
    <button
      type="button"
      className="stepper__btn"
      aria-label="One fewer serving"
      disabled={servings <= 1}
      onClick={() => setServings(servings - 1)}
    >
      −
    </button>
    <span className="stepper__value">{servings}</span>
    <button
      type="button"
      className="stepper__btn"
      aria-label="One more serving"
      disabled={servings >= 50}
      onClick={() => setServings(servings + 1)}
    >
      +
    </button>
  </span>
);

const MealRow = ({ meal, onPreview, onEdit }) => {
  const { planMeal, removePlannedMeal, plannedMealFor, myProfile, profilesError, isFavorite, toggleFavorite, favoritedBy } = useList();
  const [note, setNote] = useState(null);
  const [servings, setServings] = useState(meal.servings);
  const planned = plannedMealFor(meal.id);
  const canFavorite = Boolean(myProfile) && !profilesError;
  const favorite = canFavorite && isFavorite(meal.id);
  const lovers = canFavorite ? favoritedBy(meal.id) : [];

  const handleAdd = () => {
    onPreview(meal);
    const result = planMeal(meal, servings);
    setNote(result.alreadyPlanned ? 'Already on the list.' : null);
  };

  return (
    <li className="menu-row">
      <button
        className="menu-row__button"
        onClick={handleAdd}
        onMouseEnter={() => onPreview(meal)}
        onFocus={() => onPreview(meal)}
      >
        <span className="menu-row__line">
          <span className="menu-row__name">{meal.title}</span>
          <span className="leader" aria-hidden="true" />
          <span className="menu-row__action">{planned ? 'on list' : 'add'}</span>
        </span>
        <span className="menu-row__ingredients">
          {meal.ingredients.map(ingredientLabel).join(' · ')}
          {' · '}serves {meal.servings}
          {lovers.length > 0 && (
            <span className="menu-row__loved">
              {' · '}
              <span className="heart is-on heart--inline">
                <HeartIcon filled />
              </span>{' '}
              {lovers.join(' & ')}
            </span>
          )}
        </span>
      </button>
      <span className="menu-row__tools">
        {planned ? (
          <span>added for {planned.servings}</span>
        ) : (
          <ServingsPicker meal={meal} servings={servings} setServings={setServings} />
        )}
        {planned && (
          <button
            type="button"
            className="menu-row__link"
            aria-label={`Remove ${meal.title} from the list (its items stay)`}
            onClick={() => {
              setNote(null);
              removePlannedMeal(planned);
            }}
          >
            remove from list
          </button>
        )}
        {meal.recipe_url && (
          <a className="menu-row__link" href={meal.recipe_url} target="_blank" rel="noopener noreferrer">
            recipe ↗
          </a>
        )}
        <button type="button" className="menu-row__link" onClick={() => onEdit(meal)}>
          edit
        </button>
        {note && planned && (
          <span className="menu-row__note" role="status">
            {note}
          </span>
        )}
      </span>
      {canFavorite && (
        <button
          className={`heart${favorite ? ' is-on' : ''}`}
          aria-pressed={favorite}
          aria-label={favorite ? `Unfavourite ${meal.title}` : `Favourite ${meal.title}`}
          title={favorite ? 'Remove from favourites' : 'Add to favourites'}
          onClick={() => toggleFavorite(meal.id)}
        >
          <HeartIcon filled={favorite} />
        </button>
      )}
    </li>
  );
};

export const MealMenu = ({ category, title }) => {
  const { authReady, user, menuByCategory, menuStatus: status } = useList();
  const [preview, setPreview] = useState(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [editing, setEditing] = useState(null);
  const [reelFrom, setReelFrom] = useState(null); // Meal id the photo reel starts at
  const closeReel = useCallback(() => setReelFrom(null), []);
  const meals = menuByCategory[category] || [];
  const photoMeals = CATEGORIES.flatMap((key) => menuByCategory[key] || []).filter((meal) => meal.photo_url);

  if (authReady && !user) return <SignInPrompt heading={title.toUpperCase()} />;

  const showPreview = (meal) => {
    setPreviewFailed(false);
    setPreview(meal);
  };
  const previewSrc = preview?.photo_url || null;

  return (
    <section className="page menu-page">
      <h1 className="display">{title.toUpperCase()}</h1>
      {meals.length > 0 && (
        <p className="list-mode">
          {meals.length} {meals.length === 1 ? 'dish' : 'dishes'}
        </p>
      )}

      <div className="menu-sheet">

        {status === 'loading' && <p className="menu-note">Loading meals…</p>}
        {status === 'error' && (
          <p className="menu-note">
            Couldn't load the menu. Has <code>supabase/meals.sql</code> been run?
          </p>
        )}
        {status === 'ready' && meals.length === 0 && (
          <p className="menu-note">No {category} meals yet.</p>
        )}

        <ul className="menu-list">
          {meals.map((meal) => (
            <MealRow key={meal.id} meal={meal} onPreview={showPreview} onEdit={setEditing} />
          ))}
        </ul>
        {status === 'ready' && meals.length > 0 && (
          <p className="menu-note">Tap a dish to put it on your list. New dishes: + Create meal.</p>
        )}
      </div>

      {previewSrc && !previewFailed && (
        <button
          type="button"
          className="thumb"
          aria-label={`See ${preview.title} and every other meal photo`}
          onClick={() => setReelFrom(preview.id)}
        >
          <img
            src={previewSrc}
            alt={preview.title}
            onError={() => setPreviewFailed(true)}
          />
        </button>
      )}

      {reelFrom && <PhotoReel meals={photoMeals} startId={reelFrom} onClose={closeReel} />}

      {editing && <CreateMeal meal={editing} onClose={() => setEditing(null)} />}
    </section>
  );
};
