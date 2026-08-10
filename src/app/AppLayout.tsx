import { NavLink, Outlet } from 'react-router';
import styles from './AppLayout.module.scss';

const NAV_ITEMS = [
  { to: '/evaluation', label: 'Évaluation' },
  { to: '/draws', label: 'Tirages' },
  { to: '/geometry', label: 'Géométrie' },
];

const AppLayout = () => {
  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <main className={styles.content} data-testid="app-content">
        <Outlet />
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
