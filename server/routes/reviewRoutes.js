// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const Review = require('../models/review');

// GET /api/reviews?roomId=...
router.get('/', async (req, res) => {
  const { roomId } = req.query;

  try {
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }

    const reviews = await Review.find({ roomId });
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error });
  }
});

// GET /api/reviews/average?roomId=...
router.get('/average', async (req, res) => {
  const { roomId } = req.query;

  try {
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }

    const reviews = await Review.find({ roomId });
    if (reviews.length === 0) {
      return res.status(200).json({ average: 0, totalReviews: 0 });
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    res.status(200).json({ average: averageRating, totalReviews: reviews.length });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating average rating', error });
  }
});

// POST /api/reviews
router.post('/', async (req, res) => {
  const { roomId, userName, rating, comment } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const newReview = new Review({
      roomId,
      userName,
      rating,
      comment,
      image,
    });

    await newReview.save();
    res.status(201).json({ message: 'Review submitted successfully', review: newReview });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting review', error });
  }
});

module.exports = router;