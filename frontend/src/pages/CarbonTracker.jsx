import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import API from "../api/api";
import AIEcoAdvisor from "../components/AIEcoAdvisor";

// Styled background particles component
const BackgroundGlowOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div 
      className="absolute rounded-full bg-gradient-to-tr from-green-300 to-emerald-400 opacity-20 blur-[100px]"
      style={{
        width: "450px",
        height: "450px",
        top: "-10%",
        left: "5%",
        animation: "float-orb-1 25s infinite ease-in-out"
      }}
    />
    <div 
      className="absolute rounded-full bg-gradient-to-tr from-lime-300 to-teal-400 opacity-20 blur-[120px]"
      style={{
        width: "500px",
        height: "500px",
        bottom: "-5%",
        right: "5%",
        animation: "float-orb-2 30s infinite ease-in-out"
      }}
    />
    <style>{`
      @keyframes float-orb-1 {
        0% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(40px, -60px) scale(1.08); }
        66% { transform: translate(-30px, 30px) scale(0.95); }
        100% { transform: translate(0px, 0px) scale(1); }
      }
      @keyframes float-orb-2 {
        0% { transform: translate(0px, 0px) scale(1.05); }
        50% { transform: translate(-50px, 50px) scale(0.92); }
        100% { transform: translate(0px, 0px) scale(1.05); }
      }
    `}</style>
  </div>
);

// Leaf particle for habit completion splash
const LeafParticle = ({ x, y, delay }) => (
  <motion.span
    initial={{ opacity: 1, scale: 0, x: 0, y: 0, rotate: 0 }}
    animate={{ 
      opacity: 0, 
      scale: [1, 1.2, 0.8],
      x: x, 
      y: y,
      rotate: Math.random() * 360 
    }}
    transition={{ duration: 1.2, ease: "easeOut", delay }}
    className="absolute text-xl pointer-events-none select-none z-50 text-green-500"
  >
    🌿
  </motion.span>
);

export default function CarbonTracker() {
  const [calculatorTab, setCalculatorTab] = useState("travel");
  const [inputs, setInputs] = useState({
    travelDistance: 50,
    vehicleType: "car",
    electricity: 120,
    cylinders: 1,
    diet: "vegetarian",
    waste: 5,
    recycleRate: 40
  });

  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [todayHabits, setTodayHabits] = useState([]);
  const [ecoPoints, setEcoPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [toast, setToast] = useState(null);
  
  // Particles state for logging splash
  const [particles, setParticles] = useState([]);

  // AI assistant toggle
  const [chatbotOpen, setChatbotOpen] = useState(false);

  // 3D Globe references
  const globeContainerRef = useRef(null);
  const globeRef = useRef(null);
  const atmosphereRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const res = await API.get("/carbon/history");
      setHistory(res.data || []);
      if (res.data && res.data.length > 0) {
        // Hydrate with latest entry as current results
        const latest = res.data[0];
        setResults({
          calculation: latest,
          comparisons: {
            indiaAverage: 1.9,
            globalAverage: 4.5,
            userTotal: latest.totalEmissions,
            status: latest.totalEmissions <= 1.9 ? 'Eco Champion' : latest.totalEmissions <= 4.5 ? 'Average' : 'High Footprint'
          },
          recommendations: latest.totalEmissions > 4.5 ? [
            { category: "High Footprint", text: "Your emissions exceed global targets. Shift transport to public/electric options and increase your home recycling rate." }
          ] : [
            { category: "Good Progress", text: "You have a low carbon impact. Focus on maintaining your meat-less meals and local habits!" }
          ]
        });
        
        // Match form inputs
        if (latest.inputs) {
          setInputs(latest.inputs);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTodayHabits = async () => {
    try {
      const res = await API.get("/carbon/today");
      setTodayHabits(res.data.actions || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await API.get("/auth/profile");
      setEcoPoints(res.data.ecoPoints);
      setStreak(res.data.streak?.currentStreak || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchTodayHabits();
    fetchProfile();

    // Listen for AI challenge updates
    const handleChallengeUpdate = () => {
      fetchProfile();
    };
    window.addEventListener("challengeAccepted", handleChallengeUpdate);
    return () => window.removeEventListener("challengeAccepted", handleChallengeUpdate);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Setup Three.js 3D Globe
  useEffect(() => {
    if (!globeContainerRef.current) return;
    
    // Clear inner HTML first
    globeContainerRef.current.innerHTML = "";
    const width = 280;
    const height = 280;

    // Create Scene, Camera, and transparent Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    globeContainerRef.current.appendChild(renderer.domElement);

    // Get color based on user emissions
    const emissionsVal = results?.calculation?.totalEmissions || 3.0;
    let colorVal = 0x22c55e; // Green
    if (emissionsVal > 1.9 && emissionsVal <= 4.5) {
      colorVal = 0xeab308; // Yellow
    } else if (emissionsVal > 4.5) {
      colorVal = 0xef4444; // Red
    }

    // Globe geometry
    const geometry = new THREE.SphereGeometry(2, 32, 32);
    const material = new THREE.MeshLambertMaterial({
      color: colorVal,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);
    globeRef.current = globe;

    // Outer atmosphere shell (glowing ring grid)
    const atmosGeometry = new THREE.SphereGeometry(2.3, 16, 16);
    const atmosMaterial = new THREE.MeshBasicMaterial({
      color: colorVal,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const atmosphere = new THREE.Mesh(atmosGeometry, atmosMaterial);
    scene.add(atmosphere);
    atmosphereRef.current = atmosphere;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Render loop
    let reqId;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      if (globeRef.current) {
        globeRef.current.rotation.y += 0.005;
        globeRef.current.rotation.x += 0.002;
      }
      if (atmosphereRef.current) {
        atmosphereRef.current.rotation.y -= 0.003;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Mouse drag interaction logic
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = () => { isDragging = true; };
    const handleMouseMove = (e) => {
      const deltaMove = {
        x: e.offsetX - previousMousePosition.x,
        y: e.offsetY - previousMousePosition.y
      };

      if (isDragging && globeRef.current) {
        const deltaRotationQuaternion = new THREE.Quaternion()
          .setFromEuler(new THREE.Euler(
            (deltaMove.y * 0.01) * (Math.PI / 180),
            (deltaMove.x * 0.01) * (Math.PI / 180),
            0,
            'XYZ'
          ));
        globeRef.current.quaternion.multiplyQuaternions(deltaRotationQuaternion, globeRef.current.quaternion);
      }

      previousMousePosition = {
        x: e.offsetX,
        y: e.offsetY
      };
    };
    const handleMouseUp = () => { isDragging = false; };

    const canvas = renderer.domElement;
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // Cleanup
    return () => {
      cancelAnimationFrame(reqId);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      renderer.dispose();
    };
  }, [results]);

  const handleCalculate = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/carbon/calculate", inputs);
      setResults(res.data);
      showToast("✨ Carbon footprint calculated!");
      fetchHistory();
    } catch (err) {
      console.error(err);
      showToast("❌ Calculation failed.");
    }
  };

  const handleHabitToggle = (habitKey) => {
    if (todayHabits.includes(habitKey)) {
      setTodayHabits(todayHabits.filter((k) => k !== habitKey));
    } else {
      setTodayHabits([...todayHabits, habitKey]);
    }
  };

  const submitDailyHabits = async () => {
    try {
      const res = await API.post("/carbon/track-daily", { actions: todayHabits });
      setEcoPoints(res.data.totalPoints);
      setStreak(res.data.streak?.currentStreak || 0);
      showToast(`🎉 Points logged! Total Points: ${res.data.totalPoints}`);
      
      // Generate particles splash
      const newParticles = Array.from({ length: 15 }).map((_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 200,
        y: -100 - Math.random() * 150,
        delay: Math.random() * 0.2
      }));
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 2000);
      
    } catch (err) {
      console.error(err);
      showToast("❌ Logging failed.");
    }
  };

  const DAILY_HABITS_LIST = [
    { key: "walk_cycle", label: "🚲 Walked or cycled instead of motor transit", points: "+5" },
    { key: "energy", label: "🔌 Unplugged appliances & minimized grid load", points: "+5" },
    { key: "diet", label: "🥗 Ate entirely plant-based/vegetarian meals today", points: "+5" },
    { key: "recycle", label: "♻️ Segregated and composted household waste", points: "+5" },
    { key: "water", label: "💧 Kept shower under 4 mins / reduced water waste", points: "+5" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative overflow-x-hidden flex flex-col justify-between">
      {/* Visual background gradient orbs */}
      <BackgroundGlowOrbs />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Navigation Header */}
        <header className="flex flex-wrap justify-between items-center gap-4 bg-white/85 backdrop-blur-xl border border-emerald-100 p-4 rounded-[32px] shadow-2xl mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌿</span>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-emerald-800">
              GreenSpark Tracker
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold bg-emerald-50 text-emerald-800 px-4 py-1.5 rounded-full border border-emerald-100/50">
              🔥 {streak} Days
            </div>
            <div className="text-sm font-semibold bg-green-50 text-green-800 px-4 py-1.5 rounded-full border border-green-100/50">
              ⭐ {ecoPoints} pts
            </div>
            <Link 
              to="/grid-simulator" 
              className="px-4 py-1.5 bg-white/80 hover:bg-white text-slate-700 font-bold rounded-2xl shadow-sm text-xs md:text-sm transition"
            >
              🎮 Grid
            </Link>
            <Link 
              to="/dac-simulator" 
              className="px-4 py-1.5 bg-white/80 hover:bg-white text-slate-700 font-bold rounded-2xl shadow-sm text-xs md:text-sm transition"
            >
              💨 DAC
            </Link>
            <Link 
              to="/dashboard" 
              className="px-4 py-1.5 bg-gradient-to-tr from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold rounded-2xl shadow-sm text-xs md:text-sm transition"
            >
              Dashboard
            </Link>
          </div>
        </header>

        {/* Dynamic Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Interactive Carbon Calculator */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/50 backdrop-blur-xl border border-white/40 p-6 rounded-[32px] shadow-xl relative"
            >
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-2">
                📊 Carbon Footprint Calculator
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Calculate your annual carbon footprint using real environmental science ratios.
              </p>

              {/* Calculator Form Category Tabs */}
              <div className="flex gap-2 p-1.5 bg-slate-200/50 rounded-2xl mb-6">
                {["travel", "energy", "diet", "waste"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setCalculatorTab(tab)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition capitalize ${
                      calculatorTab === tab 
                        ? "bg-white text-emerald-800 shadow-md"
                        : "text-slate-500 hover:bg-white/30"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Form Fields */}
              <form onSubmit={handleCalculate} className="space-y-6 min-h-[180px]">
                <AnimatePresence mode="wait">
                  {calculatorTab === "travel" && (
                    <motion.div
                      key="travel"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Weekly Travel Distance ({inputs.travelDistance} km)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="500"
                          step="10"
                          value={inputs.travelDistance}
                          onChange={(e) => setInputs({ ...inputs, travelDistance: parseInt(e.target.value) })}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Primary Mode of Transportation
                        </label>
                        <select
                          value={inputs.vehicleType}
                          onChange={(e) => setInputs({ ...inputs, vehicleType: e.target.value })}
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        >
                          <option value="car">Personal Car (Gasoline)</option>
                          <option value="electric">Electric Vehicle</option>
                          <option value="bus">Public Bus</option>
                          <option value="train">Metro / Railway Train</option>
                          <option value="walk_cycle">Walk or Cycle (Zero Emission)</option>
                        </select>
                      </div>
                    </motion.div>
                  )}

                  {calculatorTab === "energy" && (
                    <motion.div
                      key="energy"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Monthly Electricity Consumption ({inputs.electricity} kWh)
                        </label>
                        <input
                          type="number"
                          value={inputs.electricity}
                          onChange={(e) => setInputs({ ...inputs, electricity: parseInt(e.target.value) || 0 })}
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                          LPG Cylinders Consumed per Month ({inputs.cylinders} cylinders)
                        </label>
                        <input
                          type="number"
                          value={inputs.cylinders}
                          onChange={(e) => setInputs({ ...inputs, cylinders: parseInt(e.target.value) || 0 })}
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        />
                      </div>
                    </motion.div>
                  )}

                  {calculatorTab === "diet" && (
                    <motion.div
                      key="diet"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Dietary Preferences
                        </label>
                        <select
                          value={inputs.diet}
                          onChange={(e) => setInputs({ ...inputs, diet: e.target.value })}
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        >
                          <option value="heavy_meat">Heavy Meat Consumer</option>
                          <option value="average_meat">Average Meat / Mixed Diet</option>
                          <option value="vegetarian">Vegetarian (Dairy, no meat)</option>
                          <option value="vegan">100% Plant-based / Vegan</option>
                        </select>
                      </div>
                    </motion.div>
                  )}

                  {calculatorTab === "waste" && (
                    <motion.div
                      key="waste"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Weekly Household Waste Production ({inputs.waste} kg)
                        </label>
                        <input
                          type="number"
                          value={inputs.waste}
                          onChange={(e) => setInputs({ ...inputs, waste: parseInt(e.target.value) || 0 })}
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Household Recycling Rate ({inputs.recycleRate}%)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={inputs.recycleRate}
                          onChange={(e) => setInputs({ ...inputs, recycleRate: parseInt(e.target.value) })}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-tr from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold rounded-2xl shadow-md transition transform active:scale-[0.98]"
                >
                  Calculate Footprint & Get AI Blueprint
                </button>
              </form>
            </motion.div>

            {/* Calculations History Charts */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/50 backdrop-blur-xl border border-white/40 p-6 rounded-[32px] shadow-xl"
            >
              <h3 className="text-xl font-bold mb-4">📈 Footprint History Trend</h3>
              {history.length === 0 ? (
                <p className="text-slate-500 text-sm">No historical records found. Complete a calculation to see your trend!</p>
              ) : (
                <div className="relative">
                  {/* Clean responsive SVG Bar Chart */}
                  <svg className="w-full h-48 bg-slate-100/50 border border-slate-200/50 rounded-2xl p-4" viewBox="0 0 500 150">
                    {/* Grid lines */}
                    <line x1="40" y1="20" x2="480" y2="20" stroke="#e2e8f0" strokeDasharray="3" />
                    <line x1="40" y1="65" x2="480" y2="65" stroke="#e2e8f0" strokeDasharray="3" />
                    <line x1="40" y1="110" x2="480" y2="110" stroke="#e2e8f0" />

                    {/* Bar drawings */}
                    {history.slice(0, 5).reverse().map((entry, idx) => {
                      const maxVal = Math.max(...history.map(e => e.totalEmissions), 5.0);
                      const barWidth = 40;
                      const spacing = 75;
                      const startX = 60 + idx * spacing;
                      const heightRatio = entry.totalEmissions / maxVal;
                      const barHeight = Math.max(10, heightRatio * 90);
                      const yPos = 110 - barHeight;

                      const isGreen = entry.totalEmissions <= 1.9;
                      const fillCol = isGreen ? "#22c55e" : entry.totalEmissions <= 4.5 ? "#eab308" : "#ef4444";

                      return (
                        <g key={entry._id}>
                          <rect
                            x={startX}
                            y={yPos}
                            width={barWidth}
                            height={barHeight}
                            rx="4"
                            fill={fillCol}
                            className="transition-all duration-700"
                          />
                          <text
                            x={startX + barWidth / 2}
                            y={yPos - 5}
                            textAnchor="middle"
                            className="text-[10px] font-bold fill-slate-600"
                          >
                            {entry.totalEmissions}t
                          </text>
                          <text
                            x={startX + barWidth / 2}
                            y="125"
                            textAnchor="middle"
                            className="text-[8px] fill-slate-400 font-semibold"
                          >
                            {new Date(entry.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </motion.div>
          </div>

          {/* Column 2: 3D Visualization, Summary & Daily Habits Tracker */}
          <div className="space-y-8">
            
            {/* Visual 3D Globe & Calculator Output Summary */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white/50 backdrop-blur-xl border border-white/40 p-6 rounded-[32px] shadow-xl flex flex-col items-center text-center relative"
            >
              <h3 className="text-lg font-bold text-slate-800 mb-1">🌍 Your Virtual Carbon Globe</h3>
              <p className="text-xs text-slate-400 mb-4">Click and drag to rotate the globe</p>
              
              {/* ThreeJS Container */}
              <div 
                ref={globeContainerRef} 
                className="w-[280px] h-[280px] flex items-center justify-center cursor-grab active:cursor-grabbing relative"
              />

              {results ? (
                <div className="w-full mt-4 space-y-4">
                  <div className="p-4 bg-white/80 rounded-2xl border border-slate-200/50">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Annual Carbon Footprint</p>
                    <p className="text-4xl font-extrabold text-slate-800 my-1">{results.calculation.totalEmissions} <span className="text-lg font-bold text-slate-500">tCO2e</span></p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                      results.calculation.totalEmissions <= 1.9
                        ? "bg-green-100 text-green-700"
                        : results.calculation.totalEmissions <= 4.5
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {results.comparisons.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-slate-100/50 border border-slate-200/30 rounded-xl">
                      <p className="text-slate-400">India Average</p>
                      <p className="font-bold text-slate-700 mt-0.5">1.9 tCO2e</p>
                    </div>
                    <div className="p-3 bg-slate-100/50 border border-slate-200/30 rounded-xl">
                      <p className="text-slate-400">Global Average</p>
                      <p className="font-bold text-slate-700 mt-0.5">4.5 tCO2e</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-100/50 border border-dashed border-slate-200 rounded-2xl w-full text-sm text-slate-500">
                  Submit a calculation to project emissions.
                </div>
              )}
            </motion.div>

            {/* Daily Habit Checklist */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/50 backdrop-blur-xl border border-white/40 p-6 rounded-[32px] shadow-xl relative"
            >
              {/* Render float particles on daily logs */}
              {particles.map((p) => (
                <LeafParticle key={p.id} x={p.x} y={p.y} delay={p.delay} />
              ))}

              <h3 className="text-xl font-bold mb-1">🌿 Daily Sustainability Habits</h3>
              <p className="text-xs text-slate-500 mb-4">
                Log completed habits to directly gain Eco Points (up to +20 points/day).
              </p>

              <div className="space-y-3">
                {DAILY_HABITS_LIST.map((habit) => {
                  const isChecked = todayHabits.includes(habit.key);
                  return (
                    <div 
                      key={habit.key}
                      onClick={() => handleHabitToggle(habit.key)}
                      className={`flex justify-between items-center p-3 rounded-2xl border-2 transition cursor-pointer select-none ${
                        isChecked 
                          ? "bg-green-50/90 border-green-500/80 text-green-950 font-semibold" 
                          : "bg-white border-slate-200/70 text-slate-700 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Swallowed: handled by container click
                          className="w-4.5 h-4.5 rounded border-slate-300 text-green-600 focus:ring-green-500 pointer-events-none"
                        />
                        <span className="text-xs md:text-sm">{habit.label}</span>
                      </div>
                      <span className={`text-xs font-extrabold ${isChecked ? "text-green-700" : "text-slate-400"}`}>
                        {habit.points}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={submitDailyHabits}
                className="w-full mt-5 py-3 bg-gradient-to-tr from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-2xl shadow-md transition transform active:scale-[0.98]"
              >
                Log Today's Green Action List
              </button>
            </motion.div>

          </div>

        </div>

      </div>

      {/* Advanced AI chatbot helper */}
      <AIEcoAdvisor isOpen={chatbotOpen} onToggle={() => setChatbotOpen(prev => !prev)} />
      
      {/* Toast popup */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-24 left-1/2 bg-slate-900/90 backdrop-blur-md text-white border border-green-500/30 px-5 py-3 rounded-2xl shadow-2xl z-50 text-sm font-semibold"
          >
            🌿 {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom design elements */}
      <footer className="w-full text-center py-6 text-xs text-slate-400 z-10 border-t border-slate-200 bg-white/20 backdrop-blur-md">
        Powered by GreenSpark AI - Punjab Department of Higher Education Project
      </footer>
    </div>
  );
}
