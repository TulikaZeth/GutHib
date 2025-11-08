import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "GUTHUB - GitHub Issue Matcher",
  description: "Find GitHub issues that match your skills and interests",
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <body style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        margin: 0,
        padding: 0,
      }}>
        <Header />
        <main style={{
          flex: 1,
          paddingTop: '80px',
          width: '100%',
        }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}