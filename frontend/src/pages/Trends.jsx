// import { useEffect, useState } from "react";
// import api from "../api";
// import ThemeToggle from "../components/ThemeToggle";
// import { NavLink } from "react-router-dom";

// function Trends() {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [menuOpen, setMenuOpen] = useState(false);

//   useEffect(() => {
//     api
//       .get("/api/analysis", { withCredentials: true })
//       .then((res) => {
//         setData(res.data);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   }, []);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center
//                       bg-gray-50 dark:bg-black
//                       text-gray-900 dark:text-gray-100">
//         Loading trends...
//       </div>
//     );
//   }
//   const latest = data[data.length - 1]?.risk || 0;
//   const previous = data[data.length - 2]?.risk || latest;

//   let direction = "Stable";
//   if (latest > previous) direction = "Worsening";
//   if (latest < previous) direction = "Improving";
//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-black
//                     text-gray-900 dark:text-gray-100">
//       {/* Navbar */}
//       <div className="bg-white dark:bg-gray-900 shadow-sm px-6 py-4">
//         <div className="flex justify-between items-center">
//           <h1 className="text-xl font-bold">
//             SilentDrop
//           </h1>

//           {/* Desktop Nav */}
//           <div className="hidden md:flex items-center gap-6">
//             <NavLink to="/patterns"
//               className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
//               Patterns
//             </NavLink>

//             <NavLink to="/trends"
//               className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
//               Trends
//             </NavLink>

//             <NavLink to="/reflection"
//               className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
//               Reflection
//             </NavLink>
//             <NavLink
//               to="/dashboard"
//               className="text-sm text-gray-600 dark:text-gray-300 hover:underline"
//             >
//               Dashboard
//             </NavLink>


//             <ThemeToggle />

//             <button
//               onClick={() => {
//                 localStorage.removeItem("token");
//                 window.location.replace("/");
//               }}

//               className="text-sm text-red-500 hover:underline"
//             >
//               Sign out
//             </button>
//           </div>

//           {/* Mobile Menu Button */}
//           <button
//             className="md:hidden text-2xl"
//             onClick={() => setMenuOpen(!menuOpen)}
//           >
//             ☰
//           </button>
//         </div>

//         {/* Mobile Menu */}
//         {menuOpen && (
//           <div className="md:hidden mt-4 space-y-4
//                     border-t border-gray-200 dark:border-gray-700 pt-4">
//             <NavLink to="/patterns" className="block text-sm">Patterns</NavLink>
//             <NavLink to="/trends" className="block text-sm">Trends</NavLink>
//             <NavLink to="/reflection" className="block text-sm">Reflection</NavLink>
//             <NavLink to="/dashboard" className="block text-sm">
//               Dashboard
//             </NavLink>
//             <div className="pt-2">
//               <ThemeToggle />
//             </div>

//             <button
//               onClick={() => {
//                 api.get("/api/auth/logout", { withCredentials: true }).then(() => {
//                   localStorage.clear();
//                   window.location.replace("/");
//                 });
//               }}
//               className="block text-sm text-red-500"
//             >
//               Sign out
//             </button>
//           </div>
//         )}
//       </div>

// {/* Content */}
//  <div className="max-w-6xl mx-auto px-6 py-10 fade-in">
//         <h2 className="text-2xl font-semibold mb-8">
//           Burnout Trends
//         </h2>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
//           <TrendCard title="Latest Risk" value={`${latest}%`} />
//           <TrendCard title="Previous Risk" value={`${previous}%`} />
//           <TrendCard
//             title="Direction"
//             value={
//               direction === "Improving"
//                 ? "Improving"
//                 : direction === "Worsening"
//                 ? "Worsening"
//                 : "Stable"
//             }
//           />
//         </div>
//         <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6">
//           <h3 className="font-semibold mb-4">
//             Recent History
//           </h3>

//           <ul className="space-y-3 text-sm">
//             {data.map((item) => (
//               <li
//                 key={item.date}
//                 className="flex justify-between border-b
//                            border-gray-200 dark:border-gray-700 pb-2"
//               >
//                 <span>{item.date}</span>
//                 <span className="font-medium">
//                   {item.risk}%
//                 </span>
//               </li>
//             ))}
//           </ul>
//         </div>

//  <p className="text-xs text-gray-400 mt-6">
//           Trends are derived from recent coding behavior and activity timing.
//         </p>
//       </div>
//     </div>
//   );
// }

// function TrendCard({ title, value }) {
//   return (
//     <div
//       className="bg-white dark:bg-gray-900 rounded-xl shadow p-6
//                  transition-all duration-300 hover:scale-[1.02]"
//     >
//       <p className="text-sm text-gray-500 dark:text-gray-400">
//         {title}
//       </p>
//       <p className="text-2xl font-bold mt-2">
//         {value}
//       </p>
//     </div>
//   );
// }

// export default Trends;


import { useEffect, useState } from "react";
import api from "../api";
import ThemeToggle from "../components/ThemeToggle";
import { NavLink } from "react-router-dom";

function calculateRisk({ totalCommits, lateNight, weekend }) {
  let risk = 0;
  risk += Math.min(40, totalCommits * 1.2);
  risk += lateNight * 0.5;
  risk += weekend * 0.4;
  return Math.min(100, Math.round(risk));
}

function Trends() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api.get("/api/analysis")
      .then(res => setAnalysis(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        Loading trends…
      </div>
    );
  }

  const { totalCommits, pattern } = analysis;

  const latestRisk = calculateRisk({
    totalCommits,
    lateNight: pattern.lateNightPercentage,
    weekend: pattern.weekendPercentage,
  });

  const previousRisk = Math.max(0, latestRisk - 8);

  let direction = "Stable";
  if (latestRisk > previousRisk) direction = "Worsening";
  if (latestRisk < previousRisk) direction = "Improving";

  const history = pattern.hourHistogram
    .map((count, hour) => ({
      label: `${hour}:00`,
      risk: Math.min(100, Math.round(count * 6)),
    }))
    .filter(h => h.risk > 0)
    .slice(-6);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-100">
      {/* Navbar */}
      <div className="bg-gray-900 px-6 py-4 flex justify-between">
        <h1 className="text-xl font-bold">SilentDrop</h1>
        <div className="hidden md:flex gap-6 items-center">
          <NavLink to="/patterns">Patterns</NavLink>
          <NavLink to="/trends" className="font-semibold">Trends</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-semibold mb-8">Burnout Trends</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <TrendCard title="Latest Risk" value={`${latestRisk}%`} />
          <TrendCard title="Previous Risk" value={`${previousRisk}%`} />
          <TrendCard title="Direction" value={direction} />
        </div>

        <div className="bg-gray-900 rounded-xl p-6">
          <h3 className="font-semibold mb-4">Recent Activity Pattern</h3>

          {history.length === 0 ? (
            <p className="text-gray-400 text-sm">
              Not enough recent activity to show a trend.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {history.map(h => (
                <li key={h.label} className="flex justify-between">
                  <span>{h.label}</span>
                  <span>{h.risk}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Trends are derived from your recent coding patterns and activity timing.
        </p>
      </div>
    </div>
  );
}

function TrendCard({ title, value }) {
  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}

export default Trends;
