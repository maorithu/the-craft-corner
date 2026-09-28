import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontSize: '3rem', margin: '0 0 10px' }}>404 🎨</h1>
      <h2>Page Not Found</h2>
      <p style={{ color: '#666', margin: '10px 0 20px' }}>
        Oops! The craft page you are looking for does not exist.
      </p>
      <Link href="/" style={{
        background: '#de9b52',
        color: '#fff',
        padding: '10px 24px',
        borderRadius: '999px',
        textDecoration: 'none',
        fontWeight: 'bold'
      }}>
        Return to Home 🏡
      </Link>
    </div>
  );
}
