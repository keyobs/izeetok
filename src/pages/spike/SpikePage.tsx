import { useEffect, useState } from 'react';
import type { SpatialEmbedding } from '../../domain/geometry/SpatialEmbedding.ts';
import { parseFdjCsv } from '../../infrastructure/csv/parseFdjCsv.ts';
import { buildSpatialEmbeddings } from '../../application/buildSpatialEmbeddings.ts';
import PointCloudScene from '../../spike/PointCloudScene.tsx';

const CSV_URL = `${import.meta.env.BASE_URL}results/euromillions_202002.csv`;

const SpikePage = () => {
  const [embeddings, setEmbeddings] = useState<SpatialEmbedding[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(CSV_URL)
      .then((response) => response.text())
      .then((csvText) => {
        if (cancelled) return;
        const draws = parseFdjCsv(csvText);
        setEmbeddings(buildSpatialEmbeddings(draws));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!embeddings) return null;

  return <PointCloudScene embeddings={embeddings} />;
};

export default SpikePage;
