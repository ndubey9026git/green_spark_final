import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/api";

// 24-hour normalized profiles (0 to 1 scaling factors)
const LOAD_CURVE = [45, 40, 38, 36, 40, 50, 70, 85, 90, 85, 80, 75, 78, 80, 75, 70, 76, 92, 100, 95, 85, 72, 60, 50];
const SOLAR_CURVE = [0, 0, 0, 0, 0, 0.05, 0.25, 0.55, 0.8, 0.95, 1.0, 0.98, 0.85, 0.65, 0.4, 0.15, 0.01, 0, 0, 0, 0, 0, 0, 0];
const WIND_CURVE = [0.45, 0.48, 0.5, 0.52, 0.5, 0.45, 0.38, 0.3, 0.25, 0.2, 0.22, 0.26, 0.32, 0.3, 0.34, 0.4, 0.44, 0.5, 0.58, 0.55, 0.5, 0.44, 0.4, 0.42];

// Grid Scaling Constants
const GRID_PEAK_DEMAND_MW = 120; // Maximum peak load in MW
const BATTERY_ROUNDTRIP_EFFICIENCY = 0.90; // 90% efficiency

// Capital Cost Constants ($ Millions)
const SOLAR_COST_PER_10MW = 0.8;
const WIND_COST_PER_10MW = 1.2;
const BATTERY_COST_PER_10MWH = 0.6;
const BIOMASS_COST_PER_10MW = 0.4;

const CHALLENGES = [
  {
    id: "rural",
    name: "Mission 1: Rural Microgrid Electrification",
    description: "Connect a rural district. Keep clean energy share above 80%, ensure 0 hours of blackouts, and do not exceed the $6 Million budget.",
    budget: 6.0,
    targetCleanShare: 80,
    maxBlackouts: 0,
    rewardPoints: 20
  },
  {
    id: "industrial",
    name: "Mission 2: Smart Industrial Zero-Emission Grid",
    description: "Provide high-capacity green power. Clean energy share must exceed 98% with 0 blackouts. Budget is capped at $14 Million.",
    budget: 14.0,
    targetCleanShare: 98,
    maxBlackouts: 0,
    rewardPoints: 35
  }
];

export default function GreenGridSandbox({ gameId }) {
  const navigate = useNavigate();
  const [resolvedGameId, setResolvedGameId] = useState(gameId || null);

  useEffect(() => {
    if (!resolvedGameId) {
      const resolveGameId = async () => {
        try {
          const res = await API.get("/games");
          const target = res.data.find(g => g.title.trim().toUpperCase() === "RENEWABLE ENERGY GRID SIMULATOR");
          if (target) {
            setResolvedGameId(target._id);
          }
        } catch (err) {
          console.error("Failed to resolve Grid Simulator game ID:", err);
        }
      };
      resolveGameId();
    }
  }, [gameId, resolvedGameId]);

  // Capacities
  const [solar, setSolar] = useState(80);      // MW
  const [wind, setWind] = useState(60);        // MW
  const [battery, setBattery] = useState(150);  // MWh
  const [biomass, setBiomass] = useState(40);    // MW

  // Challenge Selection
  const [activeChallengeId, setActiveChallengeId] = useState("rural");
  const [message, setMessage] = useState("Welcome Grid Engineer! Drag the sliders to configure your grid.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeChallenge = useMemo(() => {
    return CHALLENGES.find(c => c.id === activeChallengeId);
  }, [activeChallengeId]);

  // Simulation calculator
  const simResults = useMemo(() => {
    const hourlyData = [];
    let totalDemandMwh = 0;
    let totalSolarMwh = 0;
    let totalWindMwh = 0;
    let totalBiomassMwh = 0;
    let totalCurtailedMwh = 0;
    let totalBlackoutMwh = 0;
    let blackoutHours = 0;

    let batteryState = 0; // Current battery charge in MWh

    for (let h = 0; h < 24; h++) {
      // 1. Calculate hourly load
      const load = parseFloat(((LOAD_CURVE[h] / 100) * GRID_PEAK_DEMAND_MW).toFixed(1));
      totalDemandMwh += load;

      // 2. Calculate green generation
      const solarGen = parseFloat((solar * SOLAR_CURVE[h]).toFixed(1));
      const windGen = parseFloat((wind * WIND_CURVE[h]).toFixed(1));
      totalSolarMwh += solarGen;
      totalWindMwh += windGen;

      const totalGreen = solarGen + windGen;
      const netLoad = load - totalGreen;

      let batteryCharge = 0;
      let batteryDischarge = 0;
      let biomassBurn = 0;
      let curCurtailed = 0;
      let curBlackout = 0;

      if (netLoad < 0) {
        // Excess green power -> Charge battery
        const excess = -netLoad;
        const remainingCapacity = battery - batteryState;
        const maxChargeAmount = remainingCapacity / BATTERY_ROUNDTRIP_EFFICIENCY;
        
        batteryCharge = Math.min(excess, maxChargeAmount);
        batteryState += batteryCharge * BATTERY_ROUNDTRIP_EFFICIENCY;
        curCurtailed = excess - batteryCharge;
        totalCurtailedMwh += curCurtailed;
      } else if (netLoad > 0) {
        // Power deficit -> Discharge battery
        const deficit = netLoad;
        batteryDischarge = Math.min(deficit, batteryState);
        batteryState -= batteryDischarge;

        const remainingDeficit = deficit - batteryDischarge;
        if (remainingDeficit > 0) {
          // Biomass backup generator
          biomassBurn = Math.min(remainingDeficit, biomass);
          totalBiomassMwh += biomassBurn;

          const unmet = remainingDeficit - biomassBurn;
          if (unmet > 0) {
            curBlackout = unmet;
            totalBlackoutMwh += unmet;
            blackoutHours++;
          }
        }
      }

      hourlyData.push({
        hour: h,
        load,
        solar: solarGen,
        wind: windGen,
        greenGen: totalGreen,
        batterySoC: parseFloat(batteryState.toFixed(1)),
        batteryDischarge: parseFloat(batteryDischarge.toFixed(1)),
        biomassBurn: parseFloat(biomassBurn.toFixed(1)),
        blackout: parseFloat(curBlackout.toFixed(1)),
        curtailed: parseFloat(curCurtailed.toFixed(1))
      });
    }

    // Cost calculations
    const capitalCost = parseFloat((
      (solar * SOLAR_COST_PER_10MW / 10) +
      (wind * WIND_COST_PER_10MW / 10) +
      (battery * BATTERY_COST_PER_10MWH / 10) +
      (biomass * BIOMASS_COST_PER_10MW / 10)
    ).toFixed(2));

    // CO2 calculations (biomass emits ~0.4 kg CO2 per kWh = 400 tons per GWh)
    const dailyEmissions = parseFloat(((totalBiomassMwh * 400) / 1000).toFixed(2));

    const totalGreenMwh = totalSolarMwh + totalWindMwh + (totalDemandMwh - totalBiomassMwh - totalBlackoutMwh - totalSolarMwh - totalWindMwh);
    const cleanEnergyShare = parseFloat(((1 - (totalBiomassMwh / totalDemandMwh)) * 100).toFixed(1));

    // Stability evaluation
    const isStable = blackoutHours === 0;

    return {
      hourlyData,
      capitalCost,
      dailyEmissions,
      cleanEnergyShare,
      blackoutHours,
      totalBlackoutMwh: parseFloat(totalBlackoutMwh.toFixed(1)),
      totalDemandMwh: parseFloat(totalDemandMwh.toFixed(1)),
      isStable
    };
  }, [solar, wind, battery, biomass]);

  // Budget checks
  const budgetRatio = activeChallenge ? (simResults.capitalCost / activeChallenge.budget) * 100 : 0;
  const isBudgetExceeded = activeChallenge ? simResults.capitalCost > activeChallenge.budget : false;

  // Render SVG charts
  const svgPaths = useMemo(() => {
    if (!simResults.hourlyData.length) return {};
    
    const width = 500;
    const height = 150;
    const padding = 10;
    const usableHeight = height - 2 * padding;
    const spacing = (width - 2 * padding) / 23;

    const maxVal = Math.max(
      ...simResults.hourlyData.map(d => d.load),
      ...simResults.hourlyData.map(d => d.greenGen),
      100
    );

    const getX = (h) => padding + h * spacing;
    const getY = (v) => height - padding - (v / maxVal) * usableHeight;

    let loadPath = `M ${getX(0)} ${getY(simResults.hourlyData[0].load)}`;
    let greenPath = `M ${getX(0)} ${getY(simResults.hourlyData[0].greenGen)}`;
    let biomassPath = `M ${getX(0)} ${getY(simResults.hourlyData[0].biomassBurn)}`;
    let batteryPath = `M ${getX(0)} ${getY((simResults.hourlyData[0].batterySoC / battery) * maxVal || 0)}`;

    for (let h = 1; h < 24; h++) {
      const data = simResults.hourlyData[h];
      loadPath += ` L ${getX(h)} ${getY(data.load)}`;
      greenPath += ` L ${getX(h)} ${getY(data.greenGen)}`;
      biomassPath += ` L ${getX(h)} ${getY(data.biomassBurn)}`;
      
      const batRatio = battery > 0 ? (data.batterySoC / battery) : 0;
      batteryPath += ` L ${getX(h)} ${getY(batRatio * maxVal)}`;
    }

    return { loadPath, greenPath, biomassPath, batteryPath, getX, getY };
  }, [simResults, battery]);

  // Load scenarios
  const handleSelectChallenge = (id) => {
    setActiveChallengeId(id);
    if (id === "rural") {
      setSolar(50);
      setWind(40);
      setBattery(80);
      setBiomass(30);
      setMessage("Rural mission loaded. Minimize budget, secure 80% clean energy, and avoid blackouts.");
    } else {
      setSolar(180);
      setWind(120);
      setBattery(350);
      setBiomass(20);
      setMessage("Industrial mission loaded. Heavy clean energy target (98%+). Minimize backup biomass usage.");
    }
  };

  const handleSubmitDesign = async () => {
    const meetsClean = simResults.cleanEnergyShare >= activeChallenge.targetCleanShare;
    const meetsBlackouts = simResults.blackoutHours <= activeChallenge.maxBlackouts;
    const meetsBudget = simResults.capitalCost <= activeChallenge.budget;

    if (!meetsClean) {
      setMessage(`❌ Failed! Clean energy share (${simResults.cleanEnergyShare}%) is below target (${activeChallenge.targetCleanShare}%).`);
      return;
    }
    if (!meetsBlackouts) {
      setMessage(`❌ Failed! Grid is unstable. You have ${simResults.blackoutHours} hours of blackouts.`);
      return;
    }
    if (!meetsBudget) {
      setMessage(`❌ Failed! Budget exceeded. Cost is $${simResults.capitalCost}M, limit is $${activeChallenge.budget}M.`);
      return;
    }

    setIsSubmitting(true);
    setMessage("Submitting design to department audit...");

    try {
      // Calculate reward points based on challenge definition
      const score = activeChallenge.rewardPoints;
      const res = await API.post(`/games/${resolvedGameId || gameId}/submit-score`, { score });
      setMessage(`🎉 SUCCESS! Design approved. Grid is clean and stable. Points earned: +${score}!`);
      alert(`Engineering Design Approved! You earned +${score} Eco Points.`);
      navigate("/learn/lessons");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to log engineering points. Verify server state.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 p-4 md:p-6 flex flex-col justify-between items-center w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-white/70 backdrop-blur-md border border-slate-200/50 rounded-[32px] p-6 shadow-xl"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div>
            <span className="text-3xl">⚡</span>
            <h1 className="text-2xl font-bold inline-block ml-2 text-slate-800">
              Renewable Grid Engineering Simulator
            </h1>
            <p className="text-xs text-slate-400 mt-1"> پنجاب Department of Higher Education Sustainability Sandbox</p>
          </div>
          <button
            onClick={() => navigate("/learn/lessons")}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
          >
            ← Back to Lessons
          </button>
        </div>

        {/* Mission Scenario Selection */}
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
                <span>Budget: ${ch.budget}M</span>
                <span>Clean: {ch.targetCleanShare}%</span>
                <span>Points: +{ch.rewardPoints}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Simulator Engine */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Sizing Sliders Panel */}
          <div className="lg:col-span-1 bg-slate-100/50 border border-slate-200/40 p-5 rounded-2xl space-y-5">
            <h3 className="font-bold text-sm text-slate-700 border-b pb-2">🔧 Capacity Sizing Saws</h3>

            {/* Solar */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>☀️ Solar PV Array</span>
                <span className="font-bold">{solar} MW</span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="5"
                value={solar}
                onChange={(e) => setSolar(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[9px] text-slate-400">$0.8M per 10MW</span>
            </div>

            {/* Wind */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>💨 Wind Turbines</span>
                <span className="font-bold">{wind} MW</span>
              </div>
              <input
                type="range"
                min="0"
                max="250"
                step="5"
                value={wind}
                onChange={(e) => setWind(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[9px] text-slate-400">$1.2M per 10MW</span>
            </div>

            {/* Battery */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>🔋 Battery Storage</span>
                <span className="font-bold">{battery} MWh</span>
              </div>
              <input
                type="range"
                min="0"
                max="600"
                step="10"
                value={battery}
                onChange={(e) => setBattery(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[9px] text-slate-400">$0.6M per 10MWh</span>
            </div>

            {/* Biomass */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>🔥 Biomass Backup</span>
                <span className="font-bold">{biomass} MW</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={biomass}
                onChange={(e) => setBiomass(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[9px] text-slate-400">$0.4M per 10MW</span>
            </div>
          </div>

          {/* Visualization SVG Chart & Calculations */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* SVG Load Balancing Line Graph */}
            <div className="bg-slate-100/50 border border-slate-200/40 p-4 rounded-2xl relative">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                24-Hour Load Balance Simulation Curve
              </h4>
              
              <svg className="w-full h-44" viewBox="0 0 500 150">
                {/* Horizontal reference lines */}
                <line x1="10" y1="10" x2="490" y2="10" stroke="#cbd5e1" strokeDasharray="3" />
                <line x1="10" y1="75" x2="490" y2="75" stroke="#e2e8f0" strokeDasharray="3" />
                <line x1="10" y1="140" x2="490" y2="140" stroke="#94a3b8" />

                {/* SVG Curves */}
                {svgPaths.loadPath && (
                  <>
                    {/* Load Curve */}
                    <path d={svgPaths.loadPath} fill="none" stroke="#64748b" strokeWidth="2.5" />
                    {/* Green Generation Curve */}
                    <path d={svgPaths.greenPath} fill="none" stroke="#10b981" strokeWidth="2.5" />
                    {/* Biomass Backup Burn Curve */}
                    <path d={svgPaths.biomassPath} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2" />
                    {/* Battery State of Charge (SoC) */}
                    <path d={svgPaths.batteryPath} fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.7" />
                  </>
                )}
              </svg>

              {/* Legends */}
              <div className="flex justify-center gap-4 text-[10px] font-bold text-slate-500 mt-2">
                <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-slate-500 inline-block" /> Hourly Load</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-emerald-500 inline-block" /> Solar + Wind</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-blue-500 inline-block" /> Battery SoC</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 border-t border-dashed border-red-500 inline-block" /> Biomass backup</span>
              </div>
            </div>

            {/* Calculations Summary Panel */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              
              {/* Cost Box */}
              <div className={`p-3 border rounded-xl flex flex-col justify-center ${
                isBudgetExceeded ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"
              }`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Capital Cost</p>
                <p className={`text-xl font-extrabold mt-1.5 ${isBudgetExceeded ? "text-red-600" : "text-slate-800"}`}>
                  ${simResults.capitalCost}M
                </p>
                <p className="text-[9px] text-slate-400 mt-1">Limit: ${activeChallenge.budget}M</p>
              </div>

              {/* Clean Share Box */}
              <div className={`p-3 border rounded-xl flex flex-col justify-center ${
                simResults.cleanEnergyShare >= activeChallenge.targetCleanShare 
                  ? "bg-green-50 border-green-200" 
                  : "bg-slate-50 border-slate-200"
              }`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Clean Energy Share</p>
                <p className={`text-xl font-extrabold mt-1.5 ${
                  simResults.cleanEnergyShare >= activeChallenge.targetCleanShare ? "text-green-600" : "text-slate-800"
                }`}>
                  {simResults.cleanEnergyShare}%
                </p>
                <p className="text-[9px] text-slate-400 mt-1">Goal: {activeChallenge.targetCleanShare}%</p>
              </div>

              {/* Blackouts Box */}
              <div className={`p-3 border rounded-xl flex flex-col justify-center ${
                !simResults.isStable ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
              }`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Grid Blackouts</p>
                <p className={`text-xl font-extrabold mt-1.5 ${!simResults.isStable ? "text-red-600" : "text-green-600"}`}>
                  {simResults.blackoutHours} Hours
                </p>
                <p className="text-[9px] text-slate-400 mt-1">Limit: 0 Hours</p>
              </div>

              {/* Emissions Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Daily Emissions</p>
                <p className="text-xl font-extrabold text-slate-800 mt-1.5">
                  {simResults.dailyEmissions}t <span className="text-xs font-semibold text-slate-500">CO2</span>
                </p>
                <p className="text-[9px] text-slate-400 mt-1">From backup combustion</p>
              </div>

            </div>

          </div>

        </div>

        {/* Message Log & Submit Bar */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-100 p-4 rounded-2xl">
          <p className="text-xs font-semibold text-slate-700 flex-1 leading-tight">
            📢 <span className="font-bold">Grid Controller Status:</span> {message}
          </p>
          <button
            onClick={handleSubmitDesign}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-tr from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-sm rounded-xl shadow-md transition disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Audit in Progress..." : "Submit Engineering Design"}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
