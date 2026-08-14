import type { BubbleVariant } from './Bubble.tsx';
import Bubble from './Bubble.tsx';
import styles from './NumberChain.module.scss';

interface NumberChainProps {
  numbers: readonly number[];
  variant?: BubbleVariant;
}

/** Numbers as Bubbles linked by arrows labelled with the gap between them. */
const NumberChain = ({ numbers, variant = 'number' }: NumberChainProps) => (
  <div className={styles.chain}>
    {numbers.map((value, index) => (
      <span key={`${value}-${index}`} className={styles.step}>
        {index > 0 && (
          <span className={styles.arrow} aria-hidden="true">
            <span className={styles.gapValue}>{value - numbers[index - 1]}</span>
            <span className={styles.arrowLine}>→</span>
          </span>
        )}
        <Bubble value={value} variant={variant} />
      </span>
    ))}
  </div>
);

export default NumberChain;
