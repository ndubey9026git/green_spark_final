const express = require('express');
const router = express.Router();
// Standardized middleware imports
const auth = require('../middleware/authMiddleware'); 
const checkRole = require('../middleware/checkRole'); 
const multer = require('multer');
const path = require('path');

const Video = require('../models/Video');
const Book = require('../models/Book');
const Note = require('../models/Note');

const ADMIN_TEACHER = ['admin', 'teacher'];

// Configure Multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // The 'uploads/' folder must exist in your backend root
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });


// --- Video Routes ---
// @route   POST /api/media/videos
// @desc    Upload a new video (supports both URL and file upload)
// @access  Admin and Teacher
router.post('/videos', auth, checkRole(ADMIN_TEACHER), upload.single('file'), async (req, res) => {
    const { title, description, url } = req.body;
    let videoUrl = url;

    // Check for a file upload
    if (req.file) {
        videoUrl = `/uploads/${req.file.filename}`;
    }

    try {
        const newVideo = new Video({
            title,
            description,
            url: videoUrl,
            uploadedBy: req.user.id
        });
        await newVideo.save();
        res.status(201).json(newVideo);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while uploading video.' });
    }
});

// @route   GET /api/media/videos
// @desc    Get all videos
// @access  Public
router.get('/videos', async (req, res) => {
    try {
        const videos = await Video.find().sort({ createdAt: -1 });
        res.json(videos);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching videos.' });
    }
});

// @route   GET /api/media/videos/:id
// @desc    Get a single video
// @access  Public
router.get('/videos/:id', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) {
            return res.status(404).json({ msg: 'Video not found' });
        }
        res.json(video);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching video.' });
    }
});


// --- Book Routes ---
// @route   POST /api/media/books
// @desc    Upload a new book (supports both URL and file upload)
// @access  Admin and Teacher
router.post('/books', auth, checkRole(ADMIN_TEACHER), upload.single('file'), async (req, res) => {
    const { title, description, fileUrl } = req.body;
    let bookFileUrl = fileUrl;

    // Check for a file upload
    if (req.file) {
        bookFileUrl = `/uploads/${req.file.filename}`;
    }

    try {
        const newBook = new Book({
            title,
            description,
            fileUrl: bookFileUrl,
            uploadedBy: req.user.id
        });
        await newBook.save();
        res.status(201).json(newBook);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while uploading book.' });
    }
});

// @route   GET /api/media/books
// @desc    Get all books
// @access  Public
router.get('/books', async (req, res) => {
    try {
        const books = await Book.find().sort({ createdAt: -1 });
        res.json(books);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching books.' });
    }
});

// --- Notes Routes ---
// @route   POST /api/media/notes
// @desc    Upload a new note
// @access  Admin and Teacher
router.post('/notes', auth, checkRole(ADMIN_TEACHER), async (req, res) => {
    const { title, content } = req.body;
    try {
        const newNote = new Note({
            title,
            content,
            uploadedBy: req.user.id
        });
        await newNote.save();
        res.status(201).json(newNote);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while uploading note.' });
    }
});

// @route   GET /api/media/notes
// @desc    Get all notes
// @access  Public
router.get('/notes', async (req, res) => {
    try {
        const notes = await Note.find().sort({ createdAt: -1 });
        res.json(notes);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching notes.' });
    }
});

module.exports = router;