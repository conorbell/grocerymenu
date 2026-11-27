import React from 'react';
import { Link } from 'react-router-dom';
import { useList } from '../functions/ListContextWrapper';
import { useAllMeals, CATEGORIES } from '../../lib/useAllMeals';
import { HeartIcon } from '../HeartIcon';
import { ingredientLabel } from '../../lib/ingredients';

// The whole menu at a glance (read-only). Each section links to its page
// for adding dishes to the list.
const FullMenu = () => {
  const { status, byCategory } = useAllMeals();
  const { mealList, myProfile } = useList();
  const favorites = myProfile?.favorites || [];

  return (
    <section className="page full-menu">
      <h1 className="display">MENU</h1>
      <p className="list-mode">Everything we cook, at a glance.</p>

      {status === 'loading' && <p className="menu-note">Loading the menu…</p>}
      {status === 'error' && (
        <p className="menu-note">Couldn't load the menu. Is the server running?</p>
      )}

      <div className="full-menu__sections">
        {CATEGORIES.map(({ key, label, path }) => {
          const meals = byCategory[key] || [];
          if (status !== 'ready') return null;
          return (
            <section key={key} className="full-menu__section">
              <h2 className="section-label full-menu__heading">
                <Link to={path}>
                  {label} <span className="section-label__count">{meals.length}</span>
                </Link>
              </h2>
              <ul className="menu-list">
                {meals.map((meal) => {
                  const planned = mealList.filter((t) => t === meal.title).length;
                  const fav = favorites.includes(meal.title);
                  return (
                    <li key={meal._id || meal.id || meal.title} className="full-menu__row">
                      <span className="menu-row__line">
                        <span className="menu-row__name">{meal.title}</span>
                        {fav && (
                          <span className="heart is-on heart--inline full-menu__fav" title="Favourite">
                            <HeartIcon filled />
                          </span>
                        )}
                        <span className="leader" aria-hidden="true" />
                        <span className="menu-row__action">
                          {planned ? `on list${planned > 1 ? ` ×${planned}` : ''}` : ''}
                        </span>
                      </span>
                      <span className="menu-row__ingredients">{meal.ingredients.map(ingredientLabel).join(' · ')}</span>
                    </li>
                  );
                })}
              </ul>
              <Link className="full-menu__more" to={path}>
                Add from {label.toLowerCase()} →
              </Link>
            </section>
          );
        })}
      </div>
    </section>
  );
};

export default FullMenu;
