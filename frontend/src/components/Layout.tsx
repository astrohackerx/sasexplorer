import { Link, Outlet, useLocation } from 'react-router-dom';

export function Layout() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '/credentials') {
      return location.pathname.startsWith('/credential');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            <img src="/logo.svg" alt="SAS" className="brand-logo" />
          </Link>
          <div className="nav-content">
            <div className="nav-links">
            <Link
              to="/"
              className={`nav-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}
            >
              Home
            </Link>
            <Link
              to="/credentials"
              className={`nav-link ${isActive('/credentials') ? 'active' : ''}`}
            >
              Credentials
            </Link>
            <Link
              to="/schemas"
              className={`nav-link ${isActive('/schema') ? 'active' : ''}`}
            >
              Schemas
            </Link>
            <Link
              to="/attestations"
              className={`nav-link ${isActive('/attestation') ? 'active' : ''}`}
            >
              Attestations
            </Link>
            </div>
            <div className="nav-actions">
              <a
                href="https://attest.solana.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link-external"
              >
                Docs
              </a>
              <a
                href="https://github.com/solana-foundation/solana-attestation-service"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link-external"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </nav>
      <div className="hero-banner">
        <div className="hero-content">
          <h1 className="hero-title">Solana Attestation Service Explorer</h1>
          <p className="hero-description">
           Explore, manage, verify attestations and credentials seamlessly on the Solana blockchain. Open-source <a href="https://github.com/astrohackerx/sasexplorer" target="_blank">SAS explorer</a>
          </p>
         
        </div>
      </div>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-content">
          <p>Solana Attestation Service Explorer</p>
          <div className="footer-links">
            <a
              href="https://attest.solana.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Documentation
            </a>
            <a
              href="https://github.com/solana-foundation/solana-attestation-service"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/sas-lib"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              NPM Package
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
