// src/components/VideoPlayer.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api/api';
import { API_BASE } from '../config';
import BackToLearnButton from './BackToLearnButton';
import './VideoPlayer.css'; // Don't forget to create this file!

const VideoPlayer = () => {
    const { id } = useParams();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const res = await API.get(`/media/videos/${id}`);
                setVideo(res.data);
            } catch (err) {
                console.error('Error fetching video:', err);
                navigate('/learn/lessons'); // Redirect if video not found
            } finally {
                setLoading(false);
            }
        };
        fetchVideo();
    }, [id, navigate]);

    if (loading) {
        return <div className="loading-message">Loading video...</div>;
    }

    if (!video) {
        return <div className="error-message">Video not found.</div>;
    }

    return (
        <motion.div 
            className="video-player-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="video-header">
                <BackToLearnButton />
                <h1 className="video-title">{video.title}</h1>
            </div>
            
            <motion.div 
                className="video-player"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <video controls width="100%" height="auto" src={`${API_BASE.replace(/\/api\/?$/, '')}${video.url}`}>
                    Your browser does not support the video tag.
                </video>
            </motion.div>
            
            <p className="video-description">{video.description}</p>
        </motion.div>
    );
};

export default VideoPlayer;