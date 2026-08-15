import type { CSSProperties } from 'react';
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import type { DiscoveryPageViewModel } from './useDiscoveryPage.ts';
import styles from './DiscoveryPage.module.scss';

const CLUSTER_COLORS = ['#7dd3fc', '#fbbf6b', '#b9a3fb', '#5fe0b5', '#f2707d', '#93c5fd', '#fcd34d', '#c4b5fd'];

const colorForCluster = (clusterId: string): string => {
  const index = Number(clusterId) % CLUSTER_COLORS.length;
  return CLUSTER_COLORS[index];
};

const DiscoveryScreen = ({ isLoading, discovery, scatterSeriesByCluster }: DiscoveryPageViewModel) => (
  <div className={styles.page}>
    <h1>Discovery Engine</h1>
    <p className={styles.note}>
      Le système recherche quelles caractéristiques structurent réellement l'historique plutôt que de fixer des
      pondérations arbitraires. Hypothèse nulle : les tirages sont compatibles avec un processus aléatoire
      indépendant ; toute structure détectée est comparée à cette référence.
    </p>

    {isLoading && <p>Chargement...</p>}

    {discovery && (
      <>
        <section className={styles.section} data-testid="null-hypothesis">
          <h2>Réel vs hasard</h2>
          <div className={styles.metrics}>
            <p>
              Score de silhouette (historique réel) : <strong>{discovery.clustering.silhouetteScore.toFixed(3)}</strong>
            </p>
            <p>
              Score de silhouette (historique synthétique aléatoire) :{' '}
              <strong>{discovery.nullHypothesisComparison.syntheticSilhouetteScore.toFixed(3)}</strong>
            </p>
            <p>
              {discovery.nullHypothesisComparison.realShowsMoreStructure
                ? 'Le réel montre une structure de clustering plus marquée que le hasard, sur cette mesure.'
                : 'Aucun signal robuste détecté : le réel ne montre pas plus de structure que le hasard, sur cette mesure.'}
            </p>
            <p>
              Variance expliquée (PC1, PC2, PC3) :{' '}
              <strong>{discovery.pca.explainedVariance.map((v) => `${(v * 100).toFixed(1)}%`).join(' · ')}</strong>
            </p>
            <p>
              Features exclues : <strong>{discovery.normalization.excludedFeatures.length}</strong> (quasi-constantes
              ou redondantes, voir le modèle de normalisation)
            </p>
          </div>
        </section>

        <section className={styles.section} data-testid="carte">
          <h2>Carte (PC1 × PC2)</h2>
          <p className={styles.note}>
            Chaque point est un tirage historique projeté par PCA. La couleur encode la famille (cluster) découverte,
            pas une prédiction.
          </p>
          <div className={styles.legend}>
            {discovery.families.map((family) => (
              <span key={family.clusterId} className={styles.legendItem}>
                <span
                  className={styles.legendSwatch}
                  style={{ background: colorForCluster(String(family.clusterId)) }}
                />
                {family.label}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={420}>
            <ScatterChart>
              <CartesianGrid stroke="var(--border)" />
              <XAxis dataKey="x" name="PC1" type="number" stroke="var(--text-muted)" fontSize={12} />
              <YAxis dataKey="y" name="PC2" type="number" stroke="var(--text-muted)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }} />
              {scatterSeriesByCluster.map(([clusterId, points]) => (
                <Scatter key={clusterId} data={points} fill={colorForCluster(clusterId)} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </section>

        <section className={styles.section} data-testid="familles">
          <h2>Familles ({discovery.clustering.k})</h2>
          <div className={styles.familiesGrid}>
            {discovery.families.map((family) => (
              <div
                key={family.clusterId}
                className={styles.familyCard}
                data-testid="family-card"
                style={{ '--family-accent': colorForCluster(String(family.clusterId)) } as CSSProperties}
              >
                <div className={styles.familyHeader}>
                  <h3>{family.label}</h3>
                  <span
                    className={`${styles.stabilityBadge} ${family.isStable ? styles.stable : styles.unstable}`}
                    data-testid="stability-badge"
                  >
                    {family.isStable ? 'stable' : 'instable'}
                  </span>
                </div>
                <p>{family.description || 'Pas de trait dominant identifié'}</p>
                <p className={styles.note}>
                  Fréquence : {(family.frequency * 100).toFixed(1)}% — Stabilité bootstrap :{' '}
                  {(family.stability * 100).toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
        </section>
      </>
    )}
  </div>
);

export default DiscoveryScreen;
