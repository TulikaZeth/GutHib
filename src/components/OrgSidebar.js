'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function OrgSidebar() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { name: 'ADD REPOSITORIES', path: '/org/dashboard/add-repos' },
    { name: 'MY REPOSITORIES', path: '/org/dashboard/repos' },
    { name: 'CREATE ISSUE', path: '/org/dashboard/create-issue' },
    { name: 'ISSUE ASSIGNMENTS', path: '/org/dashboard/assignments' },
    { name: 'PROFILE', path: '/org/dashboard/profile' },
  ];

  return (
    <aside style={{
      position: 'fixed',
      left: 0,
      top: '88px',
      width: isMobile ? '100%' : '280px',
      height: isMobile ? 'auto' : 'calc(100vh - 88px)',
      background: '#ffffff',
      borderRight: isMobile ? 'none' : '2px solid #000000',
      borderBottom: isMobile ? '2px solid #000000' : 'none',
      overflowY: 'auto',
      zIndex: 1000,
      padding: '2rem 0',
    }}>
      <nav>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                style={{
                  display: 'block',
                  padding: '1.25rem 2rem',
                  color: pathname === item.path ? '#ffffff' : '#000000',
                  background: pathname === item.path ? '#000000' : '#ffffff',
                  textDecoration: 'none',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  letterSpacing: '1.5px',
                  borderBottom: '2px solid #000000',
                  transition: 'all 0.2s ease',
                }}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
