import { useEffect } from 'react';

const PaymentRedirectPage = ({ navigate }) => {

  useEffect(() => {
    // Simulation redirection vers plateforme de paiement
    const timer = setTimeout(() => {
      navigate('payment-gateway'); 
      // ou 'payment', 'stripe', 'paypal', etc.
    }, 3000); // 3 secondes

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.loader}></div>

        <h2 style={styles.title}>Redirection en cours…</h2>
        <p style={styles.text}>
          Vous allez être redirigé vers la page de paiement sécurisée.
        </p>

        <p style={styles.subText}>
          Merci de ne pas fermer cette page.
        </p>
      </div>
    </div>
  );
};

export default PaymentRedirectPage;
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '50px',
    textAlign: 'center',
    border: '1px solid rgba(253, 216, 53, 0.3)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
    maxWidth: '450px',
  },

  title: {
    fontSize: '26px',
    color: '#FDD835',
    marginBottom: '10px',
    fontWeight: 'bold',
  },

  text: {
    fontSize: '16px',
    color: '#ddd',
    marginBottom: '10px',
  },

  subText: {
    fontSize: '13px',
    color: '#aaa',
  },

  loader: {
    width: '60px',
    height: '60px',
    border: '5px solid rgba(253, 216, 53, 0.3)',
    borderTop: '5px solid #FDD835',
    borderRadius: '50%',
    margin: '0 auto 25px',
    animation: 'spin 1s linear infinite',
  },
};
