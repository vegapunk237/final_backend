import { useState } from 'react';

const HomePage = ({ navigate }) => {
  const services = [
    {
      icon: "📚",
      title: "Cours Particuliers",
      description: "Des cours personnalisés adaptés aux besoins de chaque élève",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400"
    },
    {
      icon: "👨‍🏫",
      title: "Enseignants Qualifiés",
      description: "Une équipe d'enseignants expérimentés et passionnés",
      image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400"
    },
    {
      icon: "📅",
      title: "Horaires Flexibles",
      description: "Planifiez vos cours selon votre disponibilité",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400"
    },
    {
      icon: "🏆",
      title: "Suivi Personnalisé",
      description: "Un suivi régulier des progrès de chaque élève",
      image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400"
    }
  ];

  const features = [
    { icon: "✓", title: "1er cours gratuit", desc: "sans engagement" },
    { icon: "💰", title: "-50%", desc: "crédit d'impôt immédiat" },
    { icon: "⏰", title: "Flexible", desc: "horaires à la carte" },
    { icon: "🎓", title: "100%", desc: "professeurs certifiés" }
  ];

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection}>
            <div style={styles.logoCircle}>
              <span style={styles.logoText}>KH</span>
            </div>
            <div>
              <h1 style={styles.brandName}>KH PERFECTION</h1>
              <p style={styles.brandTagline}>Votre succès, notre mission</p>
            </div>
          </div>
          
          <button onClick={() => navigate('login')} style={styles.loginBtn}>
            <span>Connexion</span>
            <span style={styles.arrow}>→</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroText}>
            <h2 style={styles.heroTitle}>
              Bienvenue chez <span style={styles.highlight}>KH Perfection</span>
            </h2>
            <p style={styles.heroSubtitle}>
              La plateforme qui connecte parents, élèves et enseignants pour un apprentissage de qualité
            </p>
            <div style={styles.heroBadge}>
              <span style={styles.badgeText}>-50% immédiatement avec le crédit d'impôt</span>
            </div>
            <div style={styles.ctaButtons}>
              <button onClick={() => navigate('parent-signup')} style={styles.primaryBtn}>
                Je suis Parent
              </button>
              <button onClick={() => navigate('teacher-signup')} style={styles.secondaryBtn}>
                Je suis Enseignant
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section style={styles.servicesSection}>
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Nos Services</h2>
            <p style={styles.sectionSubtitle}>
              Découvrez comment KH Perfection peut vous aider à atteindre vos objectifs éducatifs
            </p>
          </div>

          <div style={styles.servicesGrid}>
            {services.map((service, index) => (
              <div key={index} style={styles.serviceCard}>
                <div style={styles.serviceImageContainer}>
                  <img 
                    src={service.image} 
                    alt={service.title}
                    style={styles.serviceImage}
                    onError={(e) => e.target.style.display = 'none'}
                  />
                  <div style={styles.serviceIcon}>{service.icon}</div>
                </div>
                <div style={styles.serviceContent}>
                  <h3 style={styles.serviceTitle}>{service.title}</h3>
                  <p style={styles.serviceDesc}>{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.featuresSection}>
        <div style={styles.container}>
          <h2 style={styles.featuresSectionTitle}>Pourquoi nous choisir ?</h2>
          <div style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} style={styles.featureCard}>
                <div style={styles.featureIcon}>{feature.icon}</div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDesc}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={styles.stepsSection}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitleDark}>Comment ça marche ?</h2>
          <p style={styles.stepsSubtitle}>4 étapes simples pour commencer</p>
          <div style={styles.stepsGrid}>
            {[
              { num: "1", title: "Inscrivez-vous", desc: "Créez votre compte en quelques clics" },
              { num: "2", title: "Choisissez", desc: "Sélectionnez votre enseignant idéal" },
              { num: "3", title: "Planifiez", desc: "Réservez vos cours à votre convenance" },
              { num: "4", title: "Progressez", desc: "Atteignez vos objectifs avec succès" }
            ].map((step, i) => (
              <div key={i} style={styles.stepCard}>
                <div style={styles.stepNumber}>{step.num}</div>
                <h3 style={styles.stepTitle}>{step.title}</h3>
                <p style={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <div style={styles.container}>
          <h2 style={styles.ctaTitle}>Prêt à commencer ?</h2>
          <p style={styles.ctaSubtitle}>
            Rejoignez notre communauté et découvrez une nouvelle façon d'apprendre
          </p>
          <button onClick={() => navigate('login')} style={styles.ctaButton}>
            Commencer maintenant →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerLogo}>
            <div style={styles.footerLogoCircle}>KH</div>
            <span style={styles.footerBrand}>KH PERFECTION</span>
          </div>
          <div style={styles.footerInfo}>
            <p>📞 06 14 14 47 44</p>
            <p>✉️ contact@khperfection.fr</p>
            <p>🌐 www.khperfection.com</p>
          </div>
          <div style={styles.socialLinks}>
            <span>Facebook</span>
            <span>LinkedIn</span>
            <span>Instagram</span>
            <span>TikTok</span>
          </div>
          <p style={styles.copyright}>© 2025 KH Perfection. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

const styles = {
  pageContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    color: '#fff',
  },
  header: {
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(253, 216, 53, 0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  logoCircle: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FDD835 0%, #8B3A93 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 15px rgba(253, 216, 53, 0.4)',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#fff',
  },
  brandName: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#FDD835',
    margin: 0,
  },
  brandTagline: {
    fontSize: '12px',
    color: '#aaa',
    margin: 0,
  },
  loginBtn: {
    padding: '12px 28px',
    background: 'linear-gradient(135deg, #FDD835 0%, #FFC107 100%)',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '25px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 15px rgba(253, 216, 53, 0.3)',
    transition: 'all 0.3s ease',
  },
  arrow: {
    fontSize: '18px',
  },
  hero: {
    padding: '100px 20px',
    background: 'linear-gradient(135deg, rgba(139, 58, 147, 0.1) 0%, rgba(253, 216, 53, 0.1) 100%)',
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    maxWidth: '1000px',
    margin: '0 auto',
    textAlign: 'center',
  },
  heroText: {
    position: 'relative',
    zIndex: 2,
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '20px',
    lineHeight: '1.2',
  },
  highlight: {
    background: 'linear-gradient(135deg, #FDD835 0%, #8B3A93 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '20px',
    color: '#ccc',
    marginBottom: '30px',
    lineHeight: '1.6',
  },
  heroBadge: {
    display: 'inline-block',
    padding: '15px 30px',
    background: 'linear-gradient(135deg, #8B3A93 0%, #6B2C73 100%)',
    borderRadius: '30px',
    marginBottom: '40px',
    boxShadow: '0 4px 20px rgba(139, 58, 147, 0.4)',
  },
  badgeText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#FDD835',
  },
  ctaButtons: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryBtn: {
    padding: '16px 40px',
    background: 'linear-gradient(135deg, #8B3A93 0%, #6B2C73 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '30px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(139, 58, 147, 0.4)',
    transition: 'all 0.3s ease',
  },
  secondaryBtn: {
    padding: '16px 40px',
    background: 'linear-gradient(135deg, #FDD835 0%, #FFC107 100%)',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '30px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(253, 216, 53, 0.4)',
    transition: 'all 0.3s ease',
  },
  servicesSection: {
    padding: '80px 20px',
    background: '#16213e',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '60px',
  },
  sectionTitle: {
    fontSize: '40px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#FDD835',
  },
  sectionSubtitle: {
    fontSize: '18px',
    color: '#aaa',
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '30px',
  },
  serviceCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '20px',
    overflow: 'hidden',
    border: '1px solid rgba(253, 216, 53, 0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  serviceImageContainer: {
    height: '200px',
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, rgba(139, 58, 147, 0.3) 0%, rgba(253, 216, 53, 0.3) 100%)',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0.7,
  },
  serviceIcon: {
    position: 'absolute',
    bottom: '15px',
    right: '15px',
    width: '60px',
    height: '60px',
    background: 'rgba(253, 216, 53, 0.9)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '30px',
  },
  serviceContent: {
    padding: '25px',
  },
  serviceTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#FDD835',
  },
  serviceDesc: {
    fontSize: '14px',
    color: '#ccc',
    lineHeight: '1.6',
  },
  featuresSection: {
    padding: '80px 20px',
    background: 'linear-gradient(135deg, #FDD835 0%, #FFC107 100%)',
  },
  featuresSectionTitle: {
    fontSize: '40px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '60px',
    color: '#1a1a2e',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '30px',
  },
  featureCard: {
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '40px 30px',
    borderRadius: '20px',
    textAlign: 'center',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
  },
  featureIcon: {
    fontSize: '50px',
    marginBottom: '20px',
  },
  featureTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#8B3A93',
  },
  featureDesc: {
    fontSize: '14px',
    color: '#666',
  },
  stepsSection: {
    padding: '80px 20px',
    background: '#1a1a2e',
  },
  sectionTitleDark: {
    fontSize: '40px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '15px',
    color: '#FDD835',
  },
  stepsSubtitle: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#aaa',
    marginBottom: '60px',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '30px',
  },
  stepCard: {
    textAlign: 'center',
    padding: '30px',
  },
  stepNumber: {
    width: '80px',
    height: '80px',
    margin: '0 auto 20px',
    background: 'linear-gradient(135deg, #FDD835 0%, #8B3A93 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#fff',
    boxShadow: '0 4px 20px rgba(253, 216, 53, 0.4)',
  },
  stepTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#FDD835',
  },
  stepDesc: {
    fontSize: '14px',
    color: '#aaa',
  },
  ctaSection: {
    padding: '100px 20px',
    background: 'linear-gradient(135deg, #8B3A93 0%, #6B2C73 100%)',
    textAlign: 'center',
  },
  ctaTitle: {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#fff',
  },
  ctaSubtitle: {
    fontSize: '20px',
    color: '#FDD835',
    marginBottom: '40px',
  },
  ctaButton: {
    padding: '18px 50px',
    background: 'linear-gradient(135deg, #FDD835 0%, #FFC107 100%)',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '30px',
    fontSize: '20px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 8px 30px rgba(253, 216, 53, 0.4)',
    transition: 'all 0.3s ease',
  },
  footer: {
    background: '#0a0a0a',
    padding: '50px 20px',
    borderTop: '2px solid rgba(253, 216, 53, 0.2)',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    textAlign: 'center',
  },
  footerLogo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '30px',
  },
  footerLogoCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FDD835 0%, #8B3A93 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  footerBrand: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#FDD835',
  },
  footerInfo: {
    marginBottom: '20px',
    color: '#aaa',
  },
  socialLinks: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    marginBottom: '20px',
    color: '#FDD835',
    fontSize: '14px',
  },
  copyright: {
    color: '#666',
    fontSize: '14px',
  },
};
