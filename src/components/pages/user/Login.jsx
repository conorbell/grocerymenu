import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useList } from '../../functions/ListContextWrapper';

export const Login = () => {
  const { sharingAvailable, user, signIn } = useList();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await signIn(email.trim(), password);
    if (!res.ok) setError(res.message || 'Login failed');
    setSubmitting(false);
  };

  if (!sharingAvailable) {
    return (
      <section className="page">
        <h1 className="display">HELLO</h1>
        <p className="statement">
          Shared lists aren't switched on yet, so your list lives in this browser for now.
        </p>
        <p className="small-print">
          To share it, add <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> to{' '}
          <code>.env</code> (see <code>supabase/schema.sql</code>) and restart the app.
        </p>
      </section>
    );
  }

  // Already logged in: go to the account page.
  if (user) return <Navigate to="/user" replace />;

  return (
    <section className="page">
      <h1 className="display">HELLO</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          <span className="section-label">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          <span className="section-label">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="pill" type="submit" disabled={submitting}>
          {submitting ? 'Checking…' : 'Log in'}
        </button>
        {error && <p className="form-message">{error}</p>}
      </form>
      <p className="small-print">
        Log in to share one grocery list. Without logging in, your list is saved in this
        browser only.
      </p>
    </section>
  );
};
