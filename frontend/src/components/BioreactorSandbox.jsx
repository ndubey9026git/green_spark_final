import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/api";

/* ══════════════════════════════════════════════════════════════
   Waste-to-Energy Bioreactor Engineering Simulator
   ══════════════════════════════════════════════════════════════ */

// Biogas yield coefficients (m³ per ton of volatile solids)
const FEEDSTOCK = {
  food:  { label: "Municipal Food Waste", biogasYield: 600, vsRatio: 0.85, icon: "🍌" },
  agri:  { label: "Crop Residue / Straw",  biogasYield: 350, vsRatio: 0.72, icon: "🌾" },
  manure:{ label: "Livestock Manure",       biogasYield: 280, vsRatio: 0.65, icon: "🐄" },
};

// Temperature regimes
const TEMP_LABEL = (t) => {
  if (t < 30) return { regime: "Psychrophilic", color: "text-blue-500", efficiency: 0.40 };
  if (t < 45) return { regime: "Mesophilic",    color: "text-emerald-500", efficiency: 0.72 + (t - 30) * 0.012 };
  if (t < 60) return { regime: "Thermophilic",  color: "text-orange-500",  efficiency: 0.88 + (t - 45) * 0.004 };
  return          { regime: "Over-heated ⚠️", color: "text-red-500",     efficiency: Math.max(0.3, 0.94 - (t - 60) * 0.02) };
};

// CHP (Combined Heat & Power) constants
const BIOGAS_ENERGY_KWH_PER_M3 = 6.0;  // ~60% methane
const CHP_ELECTRICAL_EFF = 0.38;
const CHP_THERMAL_EFF   = 0.42;
const GRID_EMISSION_FACTOR = 0.42; // tons CO2 per MWh displaced
const ELECTRICITY_PRICE = 85;      // $/MWh
const HEAT_PRICE = 32;             // $/MWh thermal
const DIGESTATE_PRICE = 18;        // $/ton fertiliser

const CHALLENGES = [
  {
    id: "municipal",
    name: "Mission 1: Municipal Waste Grid",
    description: "Process a city's food waste. Generate ≥ 2.0 MWh net electricity per day with a positive daily profit margin. Minimize methane leakage.",
    targetElectricity: 2.0,
    targetProfit: 0,
    rewardPoints: 20,
  },
  {
    id: "farm",
    name: "Mission 2: Zero-Emission Farm Co-op",
    description: "Power a rural farming cooperative entirely from agricultural waste & manure. Offset ≥ 8 tons CO₂/day and achieve ≥ $800/day profit.",
    targetElectricity: 1.0,
    targetCarbonOffset: 8,
    targetProfit: 800,
    rewardPoints: 35,
  },
];

export default function BioreactorSandbox({ gameId }) {
  const navigate = useNavigate();

  // Resolve game ID dynamically if launched via direct route
  const [resolvedGameId, setResolvedGameId] = useState(gameId || null);

  useEffect(() => {
    if (!resolvedGameId) {
      const resolve = async () => {
        try {
          const res = await API.get("/games");
          const match = res.data.find(g => g.title.trim().toUpperCase() === "WASTE-TO-ENERGY BIOREACTOR");
          if (match) setResolvedGameId(match._id);
        } catch (err) {
          console.error("Failed to resolve Bioreactor game ID:", err);
        }
      };
      resolve();
    }
  }, [gameId, resolvedGameId]);

  // --- Operating Parameters ---
  const [feedFood, setFeedFood]     = useState(6);     // tons/day
  const [feedAgri, setFeedAgri]     = useState(4);     // tons/day
  const [feedManure, setFeedManure] = useState(3);     // tons/day
  const [temperature, setTemperature] = useState(37);   // °C
  const [retention, setRetention]     = useState(22);   // days

  // --- UI State ---
  const [activeChallengeId, setActiveChallengeId] = useState("municipal");
  const [message, setMessage] = useState("Welcome Bioreactor Engineer! Adjust feedstock ratios and digestion parameters.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeChallenge = useMemo(() => CHALLENGES.find(c => c.id === activeChallengeId), [activeChallengeId]);

  // ═══════ Physics Engine ═══════
  const sim = useMemo(() => {
    const tempInfo = TEMP_LABEL(temperature);

    // Retention time efficiency curve (peaks at ~25 days for mesophilic)
    const retentionEff = 1 - Math.exp(-retention / 12);

    // Biogas production per feedstock
    const calcBiogas = (tons, type) => {
      const fs = FEEDSTOCK[type];
      const vs = tons * fs.vsRatio;
      return vs * fs.biogasYield * tempInfo.efficiency * retentionEff; // m³/day
    };

    const biogasFood   = calcBiogas(feedFood, "food");
    const biogasAgri   = calcBiogas(feedAgri, "agri");
    const biogasManure = calcBiogas(feedManure, "manure");
    const totalBiogasM3 = biogasFood + biogasAgri + biogasManure;

    // Energy from biogas
    const totalEnergyKwh = totalBiogasM3 * BIOGAS_ENERGY_KWH_PER_M3;
    const electricityMwh = parseFloat(((totalEnergyKwh * CHP_ELECTRICAL_EFF) / 1000).toFixed(2));
    const thermalMwh     = parseFloat(((totalEnergyKwh * CHP_THERMAL_EFF) / 1000).toFixed(2));

    // Parasitic heating load (keeping digester at temperature)
    const totalFeed = feedFood + feedAgri + feedManure;
    const heatDemandMwh = parseFloat(((Math.max(0, temperature - 15) * 0.04 * totalFeed) / 1000 * 24).toFixed(2));
    const netElectricity = parseFloat((electricityMwh).toFixed(2));
    const netThermal = parseFloat(Math.max(0, thermalMwh - heatDemandMwh).toFixed(2));

    // Carbon offset (displacing grid power + avoiding landfill methane)
    const gridOffset = electricityMwh * GRID_EMISSION_FACTOR;
    const landfillAvoidance = totalFeed * 0.35; // ~0.35 ton CO2e per ton waste diverted from landfill
    const carbonOffset = parseFloat((gridOffset + landfillAvoidance).toFixed(1));

    // Revenue
    const electricityRevenue = electricityMwh * ELECTRICITY_PRICE;
    const heatRevenue = netThermal * HEAT_PRICE;
    const digestateRevenue = totalFeed * 0.6 * DIGESTATE_PRICE; // 60% recovery as fertilizer
    const totalRevenue = electricityRevenue + heatRevenue + digestateRevenue;

    // Operating costs
    const feedstockCost = totalFeed * 15; // $15/ton collection
    const maintenanceCost = 120 + totalFeed * 8;
    const totalCost = feedstockCost + maintenanceCost;

    const dailyProfit = parseFloat((totalRevenue - totalCost).toFixed(0));

    return {
      totalBiogasM3: parseFloat(totalBiogasM3.toFixed(0)),
      electricityMwh,
      thermalMwh,
      netElectricity,
      netThermal,
      heatDemandMwh,
      carbonOffset,
      dailyProfit,
      totalRevenue: parseFloat(totalRevenue.toFixed(0)),
      totalCost: parseFloat(totalCost.toFixed(0)),
      totalFeed,
      tempInfo,
      retentionEff: parseFloat((retentionEff * 100).toFixed(0)),
    };
  }, [feedFood, feedAgri, feedManure, temperature, retention]);

  // Challenge presets
  const handleSelectChallenge = (id) => {
    setActiveChallengeId(id);
    if (id === "municipal") {
      setFeedFood(8); setFeedAgri(2); setFeedManure(1); setTemperature(37); setRetention(22);
      setMessage("Municipal mission loaded. Maximize electricity from city food waste.");
    } else {
      setFeedFood(1); setFeedAgri(8); setFeedManure(6); setTemperature(42); setRetention(25);
      setMessage("Farm co-op mission loaded. Use agricultural waste & manure to offset carbon.");
    }
  };

  const handleSubmit = async () => {
    const ch = activeChallenge;
    if (ch.targetElectricity && sim.netElectricity < ch.targetElectricity) {
      setMessage(`❌ Net electricity (${sim.netElectricity} MWh) is below target (${ch.targetElectricity} MWh).`);
      return;
    }
    if (ch.targetCarbonOffset && sim.carbonOffset < ch.targetCarbonOffset) {
      setMessage(`❌ Carbon offset (${sim.carbonOffset} t) is below target (${ch.targetCarbonOffset} t).`);
      return;
    }
    if (ch.targetProfit !== undefined && sim.dailyProfit < ch.targetProfit) {
      setMessage(`❌ Daily profit ($${sim.dailyProfit}) is below target ($${ch.targetProfit}).`);
      return;
    }

    setIsSubmitting(true);
    setMessage("Submitting bioreactor specs to environmental board...");

    try {
      const score = ch.rewardPoints;
      await API.post(`/games/${resolvedGameId || gameId}/submit-score`, { score });
      setMessage(`🎉 SUCCESS! Bioreactor approved. Points earned: +${score}!`);
      alert(`Bioreactor Design Approved! You earned +${score} Eco Points.`);
      navigate("/learn/lessons");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to log points. Verify server connection.");
      setIsSubmitting(false);
    }
  };

  // SVG liquid animation height
  const tankFill = Math.min(1, sim.totalFeed / 25);
  const bubbleCount = Math.min(12, Math.floor(sim.totalBiogasM3 / 200));

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 p-4 md:p-6 flex flex-col items-center w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-white/70 backdrop-blur-md border border-slate-200/50 rounded-[32px] p-6 shadow-xl"
      >
        {/* ── Header ── */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div>
            <span className="text-3xl">🧬</span>
            <h1 className="text-2xl font-bold inline-block ml-2 text-slate-800">
              Waste-to-Energy Bioreactor
            </h1>
            <p className="text-xs text-slate-400 mt-1">Anaerobic Digestion & Combined Heat-Power Engineering Lab</p>
          </div>
          <button
            onClick={() => navigate("/learn/lessons")}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
          >
            ← Back to Lessons
          </button>
        </div>

        {/* ── Mission Selectors ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {CHALLENGES.map(ch => (
            <div
              key={ch.id}
              onClick={() => handleSelectChallenge(ch.id)}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                activeChallengeId === ch.id
                  ? "bg-emerald-50 border-emerald-500/80 text-emerald-950 font-medium"
                  : "bg-white border-slate-200/50 hover:bg-slate-50/50 text-slate-600"
              }`}
            >
              <div>
                <h3 className="font-bold text-sm">{ch.name}</h3>
                <p className="text-xs mt-1.5 leading-tight">{ch.description}</p>
              </div>
              <div className="flex justify-between mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>Points: +{ch.rewardPoints}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Controls & Visualization ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Feedstock & Digestion Sliders */}
          <div className="lg:col-span-1 bg-slate-100/50 border border-slate-200/40 p-5 rounded-2xl space-y-5">
            <h3 className="font-bold text-sm text-slate-700 border-b pb-2">🔧 Digester Configuration</h3>

            {/* Food Waste */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>🍌 Food Waste</span>
                <span className="font-bold">{feedFood} t/day</span>
              </div>
              <input type="range" min="0" max="15" step="0.5" value={feedFood}
                onChange={e => setFeedFood(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[9px] text-slate-400">High volatile solids, fast conversion</span>
            </div>

            {/* Agri Waste */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>🌾 Crop Residue</span>
                <span className="font-bold">{feedAgri} t/day</span>
              </div>
              <input type="range" min="0" max="15" step="0.5" value={feedAgri}
                onChange={e => setFeedAgri(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[9px] text-slate-400">Lignocellulosic, moderate biogas yield</span>
            </div>

            {/* Manure */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>🐄 Livestock Manure</span>
                <span className="font-bold">{feedManure} t/day</span>
              </div>
              <input type="range" min="0" max="12" step="0.5" value={feedManure}
                onChange={e => setFeedManure(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[9px] text-slate-400">Inoculum-rich, steady but lower yield</span>
            </div>

            {/* Temperature */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>🌡️ Digester Temperature</span>
                <span className={`font-bold ${sim.tempInfo.color}`}>{temperature}°C · {sim.tempInfo.regime}</span>
              </div>
              <input type="range" min="20" max="70" step="1" value={temperature}
                onChange={e => setTemperature(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[9px] text-slate-400">Mesophilic 30–45°C · Thermophilic 45–60°C</span>
            </div>

            {/* Retention Time */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>⏱️ Hydraulic Retention</span>
                <span className="font-bold">{retention} days ({sim.retentionEff}% eff.)</span>
              </div>
              <input type="range" min="5" max="40" step="1" value={retention}
                onChange={e => setRetention(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[9px] text-slate-400">Longer retention = more complete decomposition</span>
            </div>
          </div>

          {/* Visualization & Results */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Animated SVG Reactor */}
            <div className="bg-slate-100/50 border border-slate-200/40 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-around gap-4">
              
              <div className="text-center md:text-left">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Anaerobic Digester Vessel
                </h4>
                <p className="text-[10px] text-slate-400">Liquid level and biogas bubbles respond to your inputs</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 font-semibold">
                  <div>💧 Feed Rate: {sim.totalFeed} t/day</div>
                  <div>💨 Biogas: {sim.totalBiogasM3} m³/day</div>
                  <div>🔥 CHP Heat: {sim.thermalMwh} MWh</div>
                  <div>⚡ CHP Elec: {sim.electricityMwh} MWh</div>
                </div>
              </div>

              {/* Reactor SVG */}
              <svg width="160" height="200" viewBox="0 0 160 200" className="drop-shadow-lg">
                {/* Outer tank */}
                <rect x="20" y="20" width="120" height="160" rx="16" ry="16"
                  fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
                
                {/* Liquid slurry */}
                <rect x="22" y={180 - tankFill * 156} width="116" height={tankFill * 156} rx="14"
                  fill="url(#slurryGrad)" opacity="0.85" />

                {/* Biogas bubbles */}
                {Array.from({ length: bubbleCount }).map((_, i) => (
                  <circle
                    key={i}
                    cx={40 + (i % 4) * 25 + Math.sin(i) * 8}
                    cy={180 - tankFill * 156 - 10 - (i * 8)}
                    r={3 + (i % 3)}
                    fill="#a7f3d0"
                    opacity="0.7"
                  >
                    <animate
                      attributeName="cy"
                      values={`${180 - tankFill * 156 - 5};${30};${180 - tankFill * 156 - 5}`}
                      dur={`${2 + i * 0.3}s`}
                      repeatCount="indefinite"
                    />
                    <animate attributeName="opacity" values="0.8;0.2;0.8" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                  </circle>
                ))}

                {/* Gas dome cap */}
                <ellipse cx="80" cy="22" rx="55" ry="12" fill="#6ee7b7" opacity="0.5" />
                
                {/* Gas outlet pipe */}
                <rect x="74" y="2" width="12" height="20" rx="3" fill="#94a3b8" />
                <circle cx="80" cy="4" r="4" fill="#fbbf24">
                  <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite" />
                </circle>

                <defs>
                  <linearGradient id="slurryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#854d0e" />
                    <stop offset="40%" stopColor="#a16207" />
                    <stop offset="100%" stopColor="#713f12" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Results Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              
              {/* Electricity */}
              <div className={`p-3 border rounded-xl flex flex-col justify-center ${
                sim.netElectricity >= (activeChallenge.targetElectricity || 0) 
                  ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"
              }`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Net Electricity</p>
                <p className={`text-xl font-extrabold mt-1.5 ${
                  sim.netElectricity >= (activeChallenge.targetElectricity || 0) ? "text-green-600" : "text-slate-800"
                }`}>
                  {sim.netElectricity} <span className="text-[9px] font-bold text-slate-500">MWh</span>
                </p>
                <p className="text-[9px] text-slate-400 mt-1">CHP electrical output</p>
              </div>

              {/* Carbon Offset */}
              <div className={`p-3 border rounded-xl flex flex-col justify-center ${
                sim.carbonOffset >= (activeChallenge.targetCarbonOffset || 0)
                  ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"
              }`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Carbon Offset</p>
                <p className={`text-xl font-extrabold mt-1.5 ${
                  sim.carbonOffset >= (activeChallenge.targetCarbonOffset || 0) ? "text-green-600" : "text-slate-800"
                }`}>
                  {sim.carbonOffset} <span className="text-[9px] font-bold text-slate-500">t CO₂e</span>
                </p>
                <p className="text-[9px] text-slate-400 mt-1">Grid + landfill avoided</p>
              </div>

              {/* Profit */}
              <div className={`p-3 border rounded-xl flex flex-col justify-center ${
                sim.dailyProfit >= (activeChallenge.targetProfit || 0) 
                  ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Daily Profit</p>
                <p className={`text-xl font-extrabold mt-1.5 ${
                  sim.dailyProfit >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  ${sim.dailyProfit}
                </p>
                <p className="text-[9px] text-slate-400 mt-1">Rev ${sim.totalRevenue} − Cost ${sim.totalCost}</p>
              </div>

              {/* Biogas Volume */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Biogas Output</p>
                <p className="text-xl font-extrabold text-slate-800 mt-1.5">
                  {sim.totalBiogasM3} <span className="text-[9px] font-bold text-slate-500">m³/day</span>
                </p>
                <p className="text-[9px] text-slate-400 mt-1">~60% CH₄, 40% CO₂</p>
              </div>
            </div>

          </div>
        </div>

        {/* ── Message Log & Submit ── */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-100 p-4 rounded-2xl">
          <p className="text-xs font-semibold text-slate-700 flex-1 leading-tight">
            📢 <span className="font-bold">Plant Control Center:</span> {message}
          </p>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-tr from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-sm rounded-xl shadow-md transition disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Audit in Progress..." : "Submit Bioreactor Design"}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
