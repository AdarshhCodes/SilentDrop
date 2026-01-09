import { useEffect, useState, useRef } from "react";

function RiskMeter({ value }) {
  const radius = 70;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  const [animatedValue, setAnimatedValue] = useState(0);
  const [animationDone, setAnimationDone] = useState(false);
  const hasAnimated = useRef(false);

  useEffect(() => {
  if (hasAnimated.current) return;
  hasAnimated.current = true;

  let startTime = null;
  const duration = 1200;

  const animate = (time) => {
    if (!startTime) startTime = time;
    const progress = Math.min((time - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(eased * value);

    setAnimatedValue(currentValue);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      setAnimationDone(true);
    }
  };

  requestAnimationFrame(animate);
}, [value]);

 
  const strokeDashoffset =
    circumference - (animatedValue / 100) * circumference;

  let color = "stroke-green-500";
  let label = "Healthy Rhythm";

  if (value >= 70) {
    color = "stroke-red-500";
    label = "High Strain Detected";
  } else if (value >= 40) {
    color = "stroke-yellow-400";
    label = "Pushing Hard";
  }

  return (
    <div className="relative flex items-center justify-center">
      {/* SVG */}
      <svg height={radius * 2} width={radius * 2}
      style={{transform: "rotate(-90deg)"}}>
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
          className={`transition-[stroke] duration-300 ease-out ${color}`}
        />
      </svg>

      {/* Centered Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-3xl font-bold">
          {animatedValue}%
        </p>

        {animationDone && (
          <p className="text-sm text-gray-400 opacity-0 animate-fadeIn">
  {label}
</p>

        )}
      </div>
    </div>
  );
}

export default RiskMeter;
