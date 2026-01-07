function RiskMeter({ value }) {
  const radius = 70;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  const strokeDashoffset =
    circumference - (value / 100) * circumference;

  let color = "stroke-green-500";
  let label = "Healthy";

  if (value >= 70) {
    color = "stroke-red-500";
    label = "Burnout Likely";
  } else if (value >= 40) {
    color = "stroke-yellow-400";
    label = "At Risk";
  }

  return (
    <div className="relative flex items-center justify-center">
      {/* SVG */}
      <svg height={radius * 2} width={radius * 2}>
        {/* Background ring */}
        <circle
          stroke="#374151"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />

        {/* Progress ring */}
        <circle
          strokeLinecap="round"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={`transition-all duration-700 ease-out ${color}`}
        />
      </svg>

      {/* Centered Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-3xl font-bold">
          {value}%
        </p>
        <p className="text-sm text-gray-400">
          {label}
        </p>
      </div>
    </div>
  );
}

export default RiskMeter;
