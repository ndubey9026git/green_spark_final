// src/components/BooksSection.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/api';
import { API_BASE } from '../config';
import BackToLearnButton from './BackToLearnButton'; // ✅ UPDATED

const BooksSection = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const res = await API.get('/media/books');
                setBooks(res.data);
            } catch (err) {
                console.error('Error fetching books:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchBooks();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    if (loading) return <p className="loading-message">Loading books...</p>;

    return (
        <motion.div 
            className="media-section-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="section-header-with-button">
                <h3>Books 📖</h3>
                <BackToLearnButton /> {/* ✅ UPDATED */}
            </div>
            <AnimatePresence>
                {books.length === 0 ? (
                    <p className="no-content-message">No books available yet.</p>
                ) : (
                    <motion.div className="media-grid">
                        {books.map((book) => (
                            <motion.div 
                                key={book._id} 
                                className="media-card book-card"
                                variants={itemVariants}
                                whileHover={{ scale: 1.03 }}
                            >
                                <h4>{book.title}</h4>
                                <p>{book.description}</p>
                                <a
                                    href={`${API_BASE.replace(/\/api\/?$/, '')}${book.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="media-link"
                                >
                                    Download Book
                                </a>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default BooksSection;