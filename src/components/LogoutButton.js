'use client';

export default function LogoutButton() {
  return (
    <a 
      href="/api/auth/logout" 
      className="nav-button"
      style={{ 
        display: 'inline-block', 
        marginTop: '1.5rem',
        textDecoration: 'none'
      }}
    >
      LOGOUT
    </a>
  );
}
