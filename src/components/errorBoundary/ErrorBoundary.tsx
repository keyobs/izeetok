import { Component } from 'react';
import type { ReactNode } from 'react';
import styles from './ErrorBoundary.module.scss';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// React has no hook equivalent for catching render errors (still true as of
// React 19), so this is the one place a class component is the right tool.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('ErrorBoundary caught an error', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className={styles.fallback} data-testid="error-boundary-fallback">
          <p className={styles.message}>Quelque chose s'est mal passé sur cette page.</p>
          <button type="button" onClick={this.handleRetry} data-testid="error-boundary-retry-button">
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
