import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useList } from '../../functions/ListContextWrapper';
import { HeartIcon } from '../../HeartIcon';
import { ingredientLabel } from '../../../lib/ingredients';

// "src/food/rigatoni.png" in the data -> served by the API at "/food/rigatoni.png"
const imageUrl = (img) => (img ? `/food/${img.split('/').pop()}` : null);

const MealRow = ({ meal, onPreview }) => {
  const {
    addMeal,
    mealList,
    myProfile,
    profilesError,
    isFavorite,
    toggleFavorite,
    favoritedBy,
    sharingAvailable,
    user,
  } = useList();
  const navigate = useNavigate();
  const timesAdded = mealList.filter((title) => title === meal.title).length;
  // Favourites live on your profile, so they need you to be logged in.
  const canFavorite = Boolean(myProfile) && !profilesError;
  const favorite = canFavorite && isFavorite(meal.title);
  const lovers = canFavorite ? favoritedBy(meal.title) : [];

  const handleAdd = () => {
    addMeal(meal.title, meal.ingredients);
    onPreview(meal);
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
          <span className="menu-row__action">
            {timesAdded ? `×${timesAdded}` : 'add'}
          </span>
        </span>
        <span className="menu-row__ingredients">
          {meal.ingredients.map(ingredientLabel).join(' · ')}
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
      {sharingAvailable && !user && (
        <button
          className="heart"
          aria-label={`Log in to favourite ${meal.title}`}
          title="Log in to save favourites"
          onClick={() => navigate('/user/login')}
        >
          <HeartIcon />
        </button>
      )}
      {canFavorite && (
        <button
          className={`heart${favorite ? ' is-on' : ''}`}
          aria-pressed={favorite}
          aria-label={favorite ? `Unfavourite ${meal.title}` : `Favourite ${meal.title}`}
          title={favorite ? 'Remove from favourites' : 'Add to favourites'}
          onClick={() => toggleFavorite(meal.title)}
        >
          <HeartIcon filled={favorite} />
        </button>
      )}
    </li>
  );
};

export const MealMenu = ({ category, title }) => {
  const [meals, setMeals] = useState([]);
  const [status, setStatus] = useState('loading');
  const [preview, setPreview] = useState(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setPreview(null);
    fetch(`/api/${category}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((food) => {
        if (cancelled) return;
        setMeals(Array.isArray(food) ? food : []);
        setStatus('ready');
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  const showPreview = (meal) => {
    setPreviewFailed(false);
    setPreview(meal);
  };
  const previewSrc = imageUrl(preview?.img);

  return (
    <section className="page menu-page">
      <h1 className="display">MENU</h1>

      <div className="menu-sheet">
        <h2 className="section-label">
          {title} <span className="section-label__count">{meals.length || ''}</span>
        </h2>

        {status === 'loading' && <p className="menu-note">Loading meals…</p>}
        {status === 'error' && (
          <p className="menu-note">
            Couldn't load meals. Is the server running (<code>npm start</code>)?
          </p>
        )}
        {status === 'ready' && meals.length === 0 && (
          <p className="menu-note">No {category} meals yet.</p>
        )}

        <ul className="menu-list">
          {meals.map((meal) => (
            <MealRow
              key={meal._id || meal.id || meal.title}
              meal={meal}
              onPreview={showPreview}
            />
          ))}
        </ul>
        {status === 'ready' && meals.length > 0 && (
          <p className="menu-note">Tap a dish to put it on your list.</p>
        )}
      </div>

      {previewSrc && !previewFailed && (
        <div className="thumb">
          <img
            src={previewSrc}
            alt={preview.title}
            onError={() => setPreviewFailed(true)}
          />
        </div>
      )}
    </section>
  );
};
