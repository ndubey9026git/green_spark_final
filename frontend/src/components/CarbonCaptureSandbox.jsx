import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/api";

const CHALLENGES = [
  {
    id: "industrial",
    name: "Mission 1: Heavy Industrial Offset",
    description: "Offset the carbon output of a regional manufacturing plant. Capture at least 150 tons of net-negative CO2 per day under a strict operational budget of $120 per ton.",
    targetNetCaptured: 150,
    maxCostPerTon: 120,
    rewardPoints: 20
  },
  {
    id: "pioneer",
    name: "Mission 2: Gigaton-Scale Pioneer",
    description: "Operate a premium net-negative facility. Capture at least 400 tons of net-negative CO2 per day, ensuring operational cost is under $90 per ton and grid emissions are zero.",
    targetNetCaptured: 400,
    maxCostPerTon: 90,
    rewardPoints: 35
  }
];

// Price parameters
const POWER_SAMPLES = {
  coal: { label: "Coal Grid Power", co2PerMwh: 0.95, costPerMwh: 65, icon: "🏭" },
  solar: { label: "Solar PV Grid", co2PerMwh: 0.04, costPerMwh: 35, icon: "☀️" },
  geothermal: { label: "Geothermal Grid", co2PerMwh: 0.01, costPerMwh: 55, icon: "🌋" }
};

export default function CarbonCaptureSandbox({ gameId }) {
  const navigate = useNavigate();

  // Operating Sliders
  const [fanSpeed, setFanSpeed] = useState(1500);       // RPM (0 - 3000)
  const [desorptionTemp, setDesorptionTemp] = useState(90); // °C (50 - 150)
  const [powerSource, setPowerSource] = useState("solar"); // coal, solar, geothermal
  const [storageDepth, setStorageDepth] = useState(2.0);    // km (1.0 - 4.0)

  // Game IDs
  const [resolvedGameId, setResolvedGameId] = useState(gameId || null);
  const [activeChallengeId, setActiveChallengeId] = useState("industrial");
  const [message, setMessage] = useState("Welcome Carbon Engineer! Settle your parameters to capture carbon cleanly.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeChallenge = useMemo(() => {
    return CHALLENGES.find(c => c.id === activeChallengeId);
  }, [activeChallengeId]);

  // Resolve Game ID from database on mount if loaded directly
  useEffect(() => {
    if (!resolvedGameId) {
      const resolveGameId = async () => {
        try {
          const res = await API.get("/games");
          const target = res.data.find(g => g.title.trim().toUpperCase() === "DIRECT AIR CAPTURE SIMULATOR");
          if (target) {
            setResolvedGameId(target._id);
          }
        } catch (err) {
          console.error("Failed to resolve DAC game ID:", err);
        }
      };
      resolveGameId();
    }
  }, [gameId, resolvedGameId]);

  // Sizing and physics calculator
  const simResults = useMemo(() => {
    // 1. Gross Carbon Captured (Linear with fan speed and temperature desorption yield)
    // Yield multiplier peaks at high temperature
    const tempYield = (desorptionTemp - 30) / 100;
    const fanFlowRatio = fanSpeed / 3000;
    const grossCaptured = parseFloat((fanFlowRatio * tempYield * 650).toFixed(1)); // Max ~650 tons/day

    // 2. Power Consumption
    // Fans power scales cubically with fluid dynamics velocity (RPM^3)
    const fanPowerMw = parseFloat((Math.pow(fanSpeed / 3000, 3) * 6).toFixed(2)); // Max 6MW
    // Thermal desorption heating scales linearly
    const heatPowerMw = parseFloat(((desorptionTemp - 40) * 0.05).toFixed(2)); // Max 5.5MW
    const totalPowerMw = parseFloat((fanPowerMw + heatPowerMw).toFixed(2));

    // 3. Grid Operating Footprint
    const powerDetails = POWER_SAMPLES[powerSource];
    const dailyEnergyMwh = totalPowerMw * 24;
    const plantEmissions = parseFloat((dailyEnergyMwh * powerDetails.co2PerMwh).toFixed(1));

    // 4. Net Carbon Captured (Gross captured - emissions created)
    const netCaptured = parseFloat((grossCaptured - plantEmissions).toFixed(1));

    // 5. Operating Cost per Ton
    const dailyEnergyCost = dailyEnergyMwh * powerDetails.costPerMwh;
    // Mineralization cost scales with injection depth
    const geologicalCostPerTon = storageDepth * 12 + 6;
    const dailyGeologicalCost = grossCaptured * geologicalCostPerTon;
    const totalDailyCost = dailyEnergyCost + dailyGeologicalCost;
    
    const costPerTon = grossCaptured > 0 ? parseFloat((totalDailyCost / grossCaptured).toFixed(1)) : 0;

    return {
      grossCaptured,
      totalPowerMw,
      plantEmissions,
      netCaptured,
      costPerTon,
      fanPowerMw,
      heatPowerMw
    };
  }, [fanSpeed, desorptionTemp, powerSource, storageDepth]);

  // Adjust sliders to preset challenges
  const handleSelectChallenge = (id) => {
    setActiveChallengeId(id);
    if (id === "industrial") {
      setFanSpeed(1600);
      setDesorptionTemp(100);
      setPowerSource("solar");
      setStorageDepth(2.2);
      setMessage("Industrial challenge loaded. Offset 150 tons net under a cost of $120/ton.");
    } else {
      setFanSpeed(2600);
      setDesorptionTemp(120);
      setPowerSource("geothermal");
      setStorageDepth(3.5);
      setMessage("Gigaton challenge loaded. Offset 400 tons net under $90/ton with zero fossil fuels.");
    }
  };

  const handleSubmitDesign = async () => {
    const meetsCapture = simResults.netCaptured >= activeChallenge.targetNetCaptured;
    const meetsCost = simResults.costPerTon <= activeChallenge.maxCostPerTon;
    const meetsGeog = simResults.netCaptured > 0;

    if (activeChallengeId === "pioneer" && powerSource === "coal") {
      setMessage("❌ Failed! Mission requires zero grid fossil emissions. Switch power sourcing to solar or geothermal!");
      return;
    }
    if (!meetsGeog) {
      setMessage("❌ Failed! The facility has positive net emissions (emitting more carbon than captured). Shift to a green energy supply!");
      return;
    }
    if (!meetsCapture) {
      setMessage(`❌ Failed! Net CO2 captured (${simResults.netCaptured} tons/day) is below targets (${activeChallenge.targetNetCaptured} tons/day).`);
      return;
    }
    if (!meetsCost) {
      setMessage(`❌ Failed! Operating cost ($${simResults.costPerTon}/ton) exceeds target limit of $${activeChallenge.maxCostPerTon}/ton.`);
      return;
    }

    setIsSubmitting(true);
    setMessage("Submitting DAC configuration to chemistry board...");

    try {
      const score = activeChallenge.rewardPoints;
      await API.post(`/games/${resolvedGameId}/submit-score`, { score });
      setMessage(`🎉 SUCCESS! Chemical grid approved. Net carbon captured: ${simResults.netCaptured} tons. Points earned: +${score}!`);
      alert(`Chemical Engineering Grid Approved! You earned +${score} Eco Points.`);
      navigate("/learn/lessons");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to log chemical points. Verify server state.");
      setIsSubmitting(false);
    }
  };

  // Dynamically compute vector spinning fan speeds (CSS animation duration)
  const spinDuration = useMemo(() => {
    if (fanSpeed === 0) return "0s";
    // 3000 RPM -> 0.15s rotation, 100 RPM -> 3s rotation
    const duration = parseFloat((300 / fanSpeed).toFixed(2));
    return `${Math.max(0.12, duration)}s`;
  }, [fanSpeed]);

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-white to-slate-100 min-h-screen text-slate-900 p-4 md:p-6 flex flex-col justify-between items-center w-full relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-white/90 backdrop-blur-xl border border-emerald-100 rounded-[32px] p-6 shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div>
            <span className="text-3xl">💨</span>
            <h1 className="text-2xl font-bold inline-block ml-2 text-slate-800">
              Direct Air Capture Chemical Sandbox
            </h1>
            <p className="text-xs text-slate-400 mt-1">पंजाब Department of Higher Education Environmental Chemistry Lab</p>
          </div>
          <button
            onClick={() => navigate("/learn/lessons")}
            className="px-4 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-semibold rounded-full text-xs transition"
          >
            ← Back to Lessons
          </button>
        </div>

        {/* Mission Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {CHALLENGES.map(ch => (
            <div
              key={ch.id}
              onClick={() => handleSelectChallenge(ch.id)}
              className={`p-5 rounded-[28px] border-2 cursor-pointer transition flex flex-col justify-between ${
                activeChallengeId === ch.id
                  ? "bg-emerald-50 border-emerald-500/90 text-emerald-950 font-semibold shadow-lg"
                  : "bg-white/90 border-emerald-100 hover:bg-emerald-50 text-slate-700"
              }`}
            >
              <div>
                <h3 className="font-bold text-sm">{ch.name}</h3>
                <p className="text-xs mt-1.5 leading-tight">{ch.description}</p>
              </div>
              <div className="flex justify-between mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>Capture: {ch.targetNetCaptured}t/day</span>
                <span>Max Cost: ${ch.maxCostPerTon}/t</span>
                <span>Points: +{ch.rewardPoints}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Controls and Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Engineering Controls */}
          <div className="lg:col-span-1 bg-emerald-50/80 border border-emerald-100 p-6 rounded-[28px] space-y-5">
            <h3 className="font-bold text-sm text-emerald-900 border-b border-emerald-200 pb-2">⚙️ Contactor Operations</h3>

            {/* Fan Flow */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>💨 Contactor Fans</span>
                <span className="font-bold">{fanSpeed} RPM</span>
              </div>
              <input
                type="range"
                min="0"
                max="3000"
                step="100"
                value={fanSpeed}
                onChange={(e) => setFanSpeed(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[9px] text-slate-400">Airflow velocity scales electricity load cubically</span>
            </div>

            {/* Desorption Heating */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>🔥 Desorption Sorbent Heating</span>
                <span className="font-bold">{desorptionTemp} °C</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                step="5"
                value={desorptionTemp}
                onChange={(e) => setDesorptionTemp(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[9px] text-slate-400">Heat threshold to separate CO2 from filter sorbent</span>
            </div>

            {/* Power Sourcing */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ⚡ Grid Power Sourcing
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(POWER_SAMPLES).map(key => (
                  <button
                    key={key}
                    onClick={() => setPowerSource(key)}
                    className={`py-2 px-1 text-center rounded-xl border text-[10px] font-bold transition ${
                      powerSource === key
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <div className="text-base mb-0.5">{POWER_SAMPLES[key].icon}</div>
                    <div>{key}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Storage Depth */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>🪨 Basalt Mineralization Depth</span>
                <span className="font-bold">{storageDepth} km</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="4.0"
                step="0.2"
                value={storageDepth}
                onChange={(e) => setStorageDepth(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[9px] text-slate-400">Deeper storage reduces leak risk but requires pumping power</span>
            </div>

          </div>

          {/* Plant UI & SVG Fan Animation */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Dynamic CSS Vector Fan Animation */}
            <div className="bg-slate-100/50 border border-slate-200/40 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-around gap-4">
              
              <div className="text-center md:text-left">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Air Contactor Contactor Fan Core
                </h4>
                <p className="text-[10px] text-slate-400">Spinning animation duration binds directly to RPM input</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 font-semibold">
                  <div>⚡ Fan Load: {simResults.fanPowerMw} MW</div>
                  <div>🔥 Thermal Load: {simResults.heatPowerMw} MW</div>
                </div>
              </div>

              {/* Contactor Fan SVG with rotation style */}
              <div className="relative w-32 h-32 bg-slate-200 border-4 border-slate-300 rounded-full flex items-center justify-center shadow-inner">
                {/* Fan blade */}
                <svg
                  style={{
                    animation: `spin-blade ${spinDuration} linear infinite`,
                    transformOrigin: "center"
                  }}
                  className="w-24 h-24 text-slate-600"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  {/* Custom blade lines */}
                  <rect x="11" y="2" width="2" height="8" fill="#475569" rx="1" />
                  <rect x="11" y="14" width="2" height="8" fill="#475569" rx="1" />
                  <rect x="2" y="11" width="8" height="2" fill="#475569" rx="1" />
                  <rect x="14" y="11" width="8" height="2" fill="#475569" rx="1" />
                </svg>

                {/* Atmosphere particles density */}
                <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none rounded-full flex items-center justify-center animate-pulse" />
              </div>

              <style>{`
                @keyframes spin-blade {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>

            {/* Calculations Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              
              {/* Cost Box */}
              <div className={`p-3 border rounded-xl flex flex-col justify-center ${
                simResults.costPerTon > activeChallenge.maxCostPerTon ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
              }`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Net Unit Cost</p>
                <p className={`text-lg font-extrabold mt-1.5 ${
                  simResults.costPerTon > activeChallenge.maxCostPerTon ? "text-red-600" : "text-green-600"
                }`}>
                  ${simResults.costPerTon} <span className="text-[9px] font-bold text-slate-500">/ ton</span>
                </p>
                <p className="text-[9px] text-slate-400 mt-1">Limit: ${activeChallenge.maxCostPerTon}</p>
              </div>

              {/* Net Capture Box */}
              <div className={`p-3 border rounded-xl flex flex-col justify-center ${
                simResults.netCaptured >= activeChallenge.targetNetCaptured ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"
              }`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Net CO2 Captured</p>
                <p className={`text-lg font-extrabold mt-1.5 ${
                  simResults.netCaptured >= activeChallenge.targetNetCaptured ? "text-green-600" : "text-slate-800"
                }`}>
                  {simResults.netCaptured} <span className="text-[9px] font-bold text-slate-500">t / day</span>
                </p>
                <p className="text-[9px] text-slate-400 mt-1">Goal: {activeChallenge.targetNetCaptured}t</p>
              </div>

              {/* Plant Emissions */}
              <div className={`p-3 border rounded-xl flex flex-col justify-center ${
                simResults.plantEmissions > simResults.grossCaptured ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"
              }`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Operating footprint</p>
                <p className={`text-lg font-extrabold mt-1.5 ${
                  simResults.plantEmissions > simResults.grossCaptured ? "text-red-600" : "text-slate-800"
                }`}>
                  {simResults.plantEmissions}t <span className="text-[9px] font-bold text-slate-500">/ day</span>
                </p>
                <p className="text-[9px] text-slate-400 mt-1">Grid offset CO2</p>
              </div>

              {/* Total Power MW */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Power Demand</p>
                <p className="text-lg font-extrabold text-slate-800 mt-1.5">
                  {simResults.totalPowerMw} <span className="text-[9px] font-bold text-slate-500">MW</span>
                </p>
                <p className="text-[9px] text-slate-400 mt-1">Thermal + Mechanical</p>
              </div>

            </div>

          </div>

        </div>

        {/* Message Log & Submit Bar */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-100 p-4 rounded-2xl">
          <p className="text-xs font-semibold text-slate-700 flex-1 leading-tight">
            📢 <span className="font-bold">Plant Control Center:</span> {message}
          </p>
          <button
            onClick={handleSubmitDesign}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-tr from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-sm rounded-xl shadow-md transition disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Audit in Progress..." : "Submit Plant Specification"}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
