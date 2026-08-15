import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { drawRepository } from '../../api/drawRepositoryInstance.ts';
import type { DiscoveryConfig } from './discoverStructure.ts';
import { discoverStructure } from './discoverStructure.ts';
import type { Draw } from '../../analysis/draw/Draw.ts';
import styles from './DiscoveryPage.module.scss';

const EMPTY_DRAWS: Draw[] = [];

const DISCOVERY_CONFIG: DiscoveryConfig = {
  kCandidates: [2, 3, 4, 5, 6, 7, 8],
  neighborCount: 10,
  bootstrapIterations: 20,
  seed: 42,
};

const CLUSTER_COLORS = ['#7dd3fc', '#fbbf6b', '#b9a3fb', '#5fe0b5', '#f2707d', '#93c5fd', '#fcd34d', '#c4b5fd'];

const colorForCluster = (clusterId: string): string => {
  const index = Number(clusterId) % CLUSTER_COLORS.length;
  return CLUSTER_COLORS[index];
};

const DiscoveryPage = () => {
  const drawsQuery = useQuery({ queryKey: ['draws', 'all'], queryFn: () => drawRepository.getAll() });
  const draws = drawsQuery.data ?? EMPTY_DRAWS;

  const discovery = useMemo(() => (draws.length > 0 ? discoverStructure(draws, DISCOVERY_CONFIG) : null), [draws]);

  const scatterSeriesByCluster = useMemo(() => {
    if (!discovery) return [];
    const byCluster = new Map<string, { x: number; y: number; drawId: string }[]>();
    for (const embedding of discovery.embeddings) {
      const clusterId = embedding.clusterId ?? 'none';
      const points = byCluster.get(clusterId) ?? [];
      points.push({ x: embedding.coordinates.x, y: embedding.coordinates.y, drawId: embedding.drawId });
      byCluster.set(clusterId, points);
    }
    return [...byCluster.entries()].sort(([a], [b]) => Number(a) - Number(b));
  }, [discovery]);

  return (
    <div className={styles.page}>
      <h1>Discovery Engine</h1>
      <p className={styles.note}>
        Le système recherche quelles caractéristiques structurent réellement l'historique plutôt que de fixer des
        pondérations arbitraires. Hypothèse nulle : les tirages sont compatibles avec un processus aléatoire
        indépendant ; toute structure détectée est comparée à cette référence.
      </p>

      {drawsQuery.isLoading && <p>Chargement...</p>}

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
};

export default DiscoveryPage;
