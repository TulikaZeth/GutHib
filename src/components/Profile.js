'use client';

import { useEffect, useState } from 'react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/[...auth0]/profile')
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#ffffff', textAlign: 'center' }}>LOADING...</div>;
  if (!user || !user.email) return null;

  return (
    <div className="profile-container">
      <div className="profile-info">
        <div className="profile-item">USER: {user.name}</div>
        <div className="profile-item">EMAIL: {user.email}</div>
      </div>
    </div>
  );
}
