import React from 'react';
import { Link } from 'react-router-dom';

// Shown instead of the Menu and the list when nobody is logged in.
export const SignInPrompt = ({ heading }) => (
  <section className="page">
    <h1 className="display">{heading}</h1>
    <p className="menu-note">
      The menu and the shared list are only for the party. <Link to="/user/login">Log in</Link> to see them.
    </p>
  </section>
);
