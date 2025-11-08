import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div style={{ 
      display: 'flex', 
      position: 'relative',
      width: '100%',
      minHeight: 'calc(100vh - 80px)', // Full height minus header
    }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          marginLeft: '250px',
          padding: '2rem',
          background: '#000000',
          transition: 'margin-left 0.3s ease',
          width: '100%',
          maxWidth: 'calc(100% - 250px)',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </main>
    </div>
  );
}
