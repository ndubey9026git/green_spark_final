const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const checkRole = require('../middleware/checkRole');
const Game = require('../models/Game');
const GameProgress = require('../models/GameProgress');

const STUDENT_ONLY = ['student'];

/**
 * @route   GET /api/games
 * @desc    Get all available games
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const games = await Game.find().sort({ createdAt: -1 });
    res.json(games);
  } catch (err) {
    console.error('Error fetching games:', err);
    res.status(500).json({ error: 'Server error while fetching games.' });
  }
});

/**
 * @route   GET /api/games/:id
 * @desc    Get a single game by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found.' });
    }
    res.json(game);
  } catch (err) {
    console.error('Error fetching game:', err);
    res.status(500).json({ error: 'Server error while fetching game.' });
  }
});

/**
 * @route   POST /api/games/:id/submit-score
 * @desc    Submit a user's final score for a game
 * @access  Private (Student only)
 */
router.post('/:id/submit-score', auth, checkRole(STUDENT_ONLY), async (req, res) => {
  try {
    const gameId = req.params.id;
    const { score } = req.body;

    if (score === undefined || score === null) {
      return res.status(400).json({ error: 'Score is required.' });
    }

    const numericScore = Number(score);
    if (Number.isNaN(numericScore)) {
      return res.status(400).json({ error: 'Score must be a valid number.' });
    }

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found.' });
    }

    const studentId = req.user.id;
    let progress = await GameProgress.findOne({ game: gameId, student: studentId });

    if (!progress) {
      progress = new GameProgress({
        game: gameId,
        student: studentId,
        score: numericScore,
        completed: true,
      });
    } else {
      progress.score = Math.max(progress.score, numericScore);
      progress.completed = true;
    }

    await progress.save();
    res.json({ msg: 'Score submitted successfully.', score: progress.score });
  } catch (err) {
    console.error('Error submitting game score:', err);
    res.status(500).json({ error: 'Server error while submitting score.' });
  }
});

/**
 * @route   GET /api/games/:id/leaderboard
 * @desc    Get the top scores for a game
 * @access  Public
 */
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const leaderboard = await GameProgress.find({ game: req.params.id, completed: true })
      .sort({ score: -1 })
      .limit(10)
      .populate({ path: 'student', select: 'name ecoPoints' });

    res.json(leaderboard);
  } catch (err) {
    console.error('Error fetching game leaderboard:', err);
    res.status(500).json({ error: 'Server error while fetching leaderboard.' });
  }
});

module.exports = router;
