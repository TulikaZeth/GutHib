import OrgSidebar from '@/components/OrgSidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function OrgDashboardLayout({ children }) {
  return (
    <>
      <Header />
      <OrgSidebar />
      <main style={{
        marginLeft: '280px',
        marginTop: '88px',
        minHeight: 'calc(100vh - 88px)',
        background: '#ffffff',
        padding: '2rem',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
        }}>
          {children}
        </div>
      </main>
    </>
  );
}
