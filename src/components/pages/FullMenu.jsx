import React from 'react';
import { Link } from 'react-router-dom';
import { useList } from '../functions/ListContextWrapper';
import { CATEGORIES } from '../../lib/mealRules';
import { SignInPrompt } from '../SignInPrompt';
import { HeartIcon } from '../HeartIcon';
import { ingredientLabel } from '../../lib/ingredients';

// The whole menu at a glance (read-only). Each section links to its page
// for adding dishes to the list.
const FullMenu = () => {
  const { authReady, user, menuStatus: status, menuByCategory: byCategory, plannedMealFor, myProfile } = useList();
  const favorites = myProfile?.favorites || [];

  if (authReady && !user) return <SignInPrompt heading="MENU" />;

  return (
    <section className="page full-menu">
      <h1 className="display">MENU</h1>
      <p className="list-mode">Everything we cook, at a glance.</p>

      {status === 'loading' && <p className="menu-note">Loading the menu…</p>}
      {status === 'error' && (
        <p className="menu-note">Couldn't load the menu. Has supabase/meals.sql been run?</p>
      )}

      <div className="full-menu__sections">
        {CATEGORIES.map((key) => {
          const meals = byCategory[key] || [];
          if (status !== 'ready') return null;
          return (
            <section key={key} className="full-menu__section">
              <h2 className="section-label full-menu__heading">
                <Link to={`/${key}`}>
                  {key} <span className="section-label__count">{meals.length}</span>
                </Link>
              </h2>
              <ul className="menu-list">
                {meals.map((meal) => {
                  const planned = plannedMealFor(meal.id);
                  const fav = favorites.includes(meal.id);
                  return (
                    <li key={meal.id} className="full-menu__row">
                      <span className="menu-row__line">
                        <span className="menu-row__name">{meal.title}</span>
                        {fav && (
                          <span className="heart is-on heart--inline full-menu__fav" title="Favourite">
                            <HeartIcon filled />
                          </span>
                        )}
                        <span className="leader" aria-hidden="true" />
                        <span className="menu-row__action">
                          {planned ? 'on list' : ''}
                        </span>
                      </span>
                      <span className="menu-row__ingredients">{meal.ingredients.map(ingredientLabel).join(' · ')}</span>
                    </li>
                  );
                })}
              </ul>
              <Link className="full-menu__more" to={`/${key}`}>
                Add from {key} →
              </Link>
            </section>
          );
        })}
      </div>
    </section>
  );
};

export default FullMenu;
