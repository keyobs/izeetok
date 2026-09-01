import styles from './DataLoadError.module.scss';

interface DataLoadErrorProps {
  onRetry: () => void;
}

const DataLoadError = ({ onRetry }: DataLoadErrorProps) => (
  <div className={styles.error} data-testid="data-load-error">
    <p className={styles.message}>Impossible de charger l'historique des tirages.</p>
    <button type="button" onClick={onRetry} data-testid="data-load-error-retry-button">
      Réessayer
    </button>
  </div>
);

export default DataLoadError;
