import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: 'white', color: '#1a1208',
          border: '1px solid #ede8e0', borderRadius: '12px',
          fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '14px',
          boxShadow: '0 8px 24px rgba(26,18,8,0.1)',
        },
        success: { iconTheme: { primary: '#2d9e6b', secondary: 'white' } },
        error: { iconTheme: { primary: '#dc2626', secondary: 'white' } },
      }} />
    </>
  );
}
