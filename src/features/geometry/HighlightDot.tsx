interface HighlightDotProps {
  cx?: number;
  cy?: number;
}

const HighlightDot = ({ cx, cy }: HighlightDotProps) => (
  <circle cx={cx} cy={cy} r={7} fill="var(--accent-reference)" stroke="var(--bg)" strokeWidth={2} />
);

export default HighlightDot;
