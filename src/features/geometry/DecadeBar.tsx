interface DecadeBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  payload?: { hasReference: boolean };
}

const DecadeBar = ({ x = 0, y = 0, width = 0, height = 0, fill, payload }: DecadeBarProps) => (
  <g>
    <rect x={x} y={y} width={width} height={height} fill={fill} />
    {payload?.hasReference && (
      <circle cx={x + width / 2} cy={y - 8} r={5} fill="var(--accent-reference)" stroke="var(--bg)" strokeWidth={1.5} />
    )}
  </g>
);

export default DecadeBar;
