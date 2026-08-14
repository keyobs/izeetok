import styles from './ChartLegend.module.scss';

interface ChartLegendItem {
  color: string;
  label: string;
}

interface ChartLegendProps {
  items: ChartLegendItem[];
}

const ChartLegend = ({ items }: ChartLegendProps) => (
  <ul className={styles.legend} data-testid="chart-legend">
    {items.map((item) => (
      <li key={item.label} className={styles.legendItem}>
        <span className={styles.swatch} style={{ background: item.color }} aria-hidden="true" />
        {item.label}
      </li>
    ))}
  </ul>
);

export default ChartLegend;
