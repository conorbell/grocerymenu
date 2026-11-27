import React from 'react';

// Profile photo in the soft oval, or the person's initial when there's no photo.
export const Avatar = ({ url, name, size = 'large' }) => (
  <div className={`avatar avatar--${size}`}>
    {url ? (
      <img src={url} alt={`${name}'s profile photo`} />
    ) : (
      <span className="avatar__initial" aria-hidden="true">
        {(name || '').trim()[0]?.toUpperCase() || ''}
      </span>
    )}
  </div>
);
