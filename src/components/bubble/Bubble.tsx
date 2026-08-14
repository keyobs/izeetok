import styles from './Bubble.module.scss';

export type BubbleVariant = 'number' | 'star' | 'highlight';

interface BubbleProps {
  value: number;
  variant?: BubbleVariant;
}

const VARIANT_CLASSES: Record<BubbleVariant, string> = {
  number: styles.number,
  star: styles.star,
  highlight: styles.highlight,
};

const Bubble = ({ value, variant = 'number' }: BubbleProps) => (
  <span className={`${styles.bubble} ${VARIANT_CLASSES[variant]}`} data-testid="bubble">
    {value}
  </span>
);

export default Bubble;
