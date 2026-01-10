function MiniTrendChart({ data }) {
  if (!Array.isArray(data) || data.length < 2) {
    return (
      <p className="text-sm text-gray-400">
        Not enough data yet to show a trend.
      </p>
    );
  };
  const width = 300;
  const height = 120;
  const padding = 20;

  const values = data.map(d => d.burnoutRisk);
  const max = 100;
  const min = 0;

  const points = data.map((d, i) => {
    const x =
      padding +
      (i / (data.length - 1)) * (width - padding * 2);

    const y =
      height -
      padding -
      ((d.burnoutRisk - min) / (max - min)) *
        (height - padding * 2);

    return `${x},${y}`;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-28"
      preserveAspectRatio="none"
    >
      {/* baseline */}
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="#e5e7eb"
        strokeWidth="1"
      />

      {/* trend line */}
      <polyline
        fill="none"
        stroke="#6366f1"
        strokeWidth="2"
        points={points.join(" ")}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* points */}
      {points.map((p, i) => {
        const [x, y] = p.split(",");
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3"
            fill="#6366f1"
          />
        );
      })}
    </svg>
  );
}

export default MiniTrendChart;
