import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api/api';
import BackToLearnButton from './BackToLearnButton';
import RecycleRush from './RecycleRush'; 
import EcoCitySimulator from './EcoCitySimulator';
import EcosystemSimulator from './EcosystemSimulator';
import GreenGridSandbox from './GreenGridSandbox';
import CarbonCaptureSandbox from './CarbonCaptureSandbox';
import BioreactorSandbox from './BioreactorSandbox';
import './GamePlayer.css';

const GamePlayer = () => {
    const { id } = useParams();
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGame = async () => {
            try {
                // Fetches game data using the ID from the URL
                const res = await API.get(`/games/${id}`);
                setGame(res.data);
            } catch (err) {
                console.error('Error fetching game:', err);
                navigate('/learn/lessons');
            } finally {
                setLoading(false);
            }
        };
        fetchGame();
    }, [id, navigate]);

    if (loading) {
        return <div className="loading-message">Loading game...</div>;
    }

    if (!game) {
        return <div className="error-message">Game not found.</div>;
    }

    const renderGameContent = () => {
      // Normalize title for reliable component matching, preventing casing errors
      const title = game.title.trim().toUpperCase();
      
      // 1. Check for Internal Games (Custom React Components)
      if (title === "RECYCLE RUSH") {
          return <RecycleRush gameId={game._id} />;
      }
      if (title === "ECO-CITY BUILDER: 3D MISSION") {
          return <EcoCitySimulator gameId={game._id} gameData={game} />;
      }
      if (title === "ECOSYSTEM BALANCE SIMULATOR" || title === "ECOSYSTEM SIMULATOR") {
          return <EcosystemSimulator gameId={game._id} />;
      }
      if (title === "RENEWABLE ENERGY GRID SIMULATOR" || title === "RENEWABLE ENERGY GRID ENGINEERING SIMULATOR" || title === "GREEN GRID SIMULATOR") {
          return <GreenGridSandbox gameId={game._id} />;
      }
      if (title === "WASTE-TO-ENERGY BIOREACTOR") {
            return <BioreactorSandbox gameId={game._id} />;
        }
      if (title === "DIRECT AIR CAPTURE SIMULATOR" || title === "CARBON CAPTURE SIMULATOR" || title === "DIRECT AIR CAPTURE CHEMICAL SANDBOX") {
          return <CarbonCaptureSandbox gameId={game._id} />;
      }
      
      // 2. Check for External Games (iFrame Embed)
      const isExternalUrl = game.gameUrl && (game.gameUrl.startsWith('http') || game.gameUrl.startsWith('//'));

      if (isExternalUrl) {
          // Embed external content inside an iframe
          return (
              <iframe 
                  src={game.gameUrl}
                  title={game.title}
                  className="game-iframe"
                  allow="fullscreen"
                  frameBorder="0"
              ></iframe>
          );
      }
      
      // 3. Fallback
      return (
          <div className="placeholder-game">
              <p>Game content is either missing or the title does not match an internal component.</p>
              <p>Title: **{game.title}**</p>
          </div>
      );
    };

    return (
        <motion.div 
            className="game-player-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="game-header">
                <BackToLearnButton />
                <h1 className="game-title">{game.title}</h1>
            </div>
            
            <motion.div 
                className="game-content"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {renderGameContent()}
            </motion.div>
            
            <div className="score-area">
              <p>Game Description: {game.description}</p>
              <p className="text-sm text-gray-500">Note: External games cannot track your score directly unless they are custom-integrated.</p>
            </div>
        </motion.div>
    );
};

export default GamePlayer;
