import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import ErrorBoundary from '../components/errorBoundary/ErrorBoundary.tsx';
import styles from './AppLayout.module.scss';

const NAV_ITEMS = [
  { to: '/evaluation', label: 'Évaluation' },
  { to: '/geometry', label: 'Géométrie' },
  { to: '/laboratory', label: 'Laboratoire' },
  { to: '/discovery', label: 'Discovery' },
  { to: '/draws', label: 'Tirages' },
];

const AppLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isMenuOpen) return;

    const closeIfOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', closeIfOutside);
    return () => document.removeEventListener('mousedown', closeIfOutside);
  }, [isMenuOpen]);

  return (
    <div className={styles.layout}>
      <nav className={styles.nav} ref={navRef}>
        <span className={styles.brand}>Geometry Lab</span>
        <button
          type="button"
          className={styles.navToggle}
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setIsMenuOpen((previous) => !previous)}
          data-testid="nav-toggle-button"
        >
          <span className={styles.navToggleBar} />
          <span className={styles.navToggleBar} />
          <span className={styles.navToggleBar} />
        </button>
        <div
          className={isMenuOpen ? `${styles.navLinks} ${styles.navLinksOpen}` : styles.navLinks}
          data-testid="nav-links"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <main className={styles.content} data-testid="app-content">
        <ErrorBoundary key={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <footer className={styles.disclaimer} data-testid="non-predictive-disclaimer">
        Toutes les combinaisons EuroMillions valides ont la même probabilité théorique lors d'un
        tirage équitable. Cette application analyse des structures historiques et des hypothèses
        expérimentales ; elle ne prédit aucun tirage et ne garantit aucun gain.
      </footer>
    </div>
  );
};

export default AppLayout;
