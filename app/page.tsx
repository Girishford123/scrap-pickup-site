export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'sans-serif',
      background: 'linear-gradient(to bottom, #f3f4f6, #ffffff)'
    }}>
      <div style={{
        maxWidth: '800px',
        textAlign: 'center',
        background: 'white',
        padding: '3rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#1f2937'
        }}>
          Ford Special Market
        </h1>
        
        <h2 style={{
          fontSize: '1.875rem',
          color: '#4b5563',
          marginBottom: '2rem'
        }}>
          Scrap Pickup Request System
        </h2>
        
        <p style={{
          fontSize: '1.125rem',
          color: '#6b7280',
          marginBottom: '2rem',
          lineHeight: '1.75'
        }}>
          Schedule a scrap material pickup for your facility. 
          Our team will contact you to confirm the details.
        </p>
        
        <a
          href="/request-pickup"
          style={{
            display: 'inline-block',
            padding: '1rem 2rem',
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'white',
            background: '#2563eb',
            borderRadius: '6px',
            textDecoration: 'none',
            cursor: 'pointer'
          }}
        >
          Request a Pickup
        </a>
        
        <div style={{
          marginTop: '3rem',
          paddingTop: '2rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <a 
            href="/admin/login" 
            style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              textDecoration: 'none'
            }}
          >
            Admin Login
          </a>
        </div>
      </div>
    </div>
  );
}