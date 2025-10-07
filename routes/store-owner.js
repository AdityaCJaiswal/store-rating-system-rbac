const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireStoreOwner } = require('../middleware/auth');

const router = express.Router();

// Get store owner dashboard statistics
router.get('/dashboard', authenticateToken, requireStoreOwner, async (req, res) => {
  try {
    // Get the store owner's store with ratings
    const storeResult = await pool.query(`
      SELECT s.id, s.name, s.email, s.address, s.created_at,
             COALESCE(AVG(r.rating), 0) as average_rating,
             COUNT(r.id) as total_ratings
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      WHERE s.owner_id = $1
      GROUP BY s.id, s.name, s.email, s.address, s.created_at
    `, [req.user.id]);

    if (storeResult.rows.length === 0) {
      return res.status(404).json({ 
        message: 'No store found for this owner',
        totalRatings: 0,
        averageRating: 0
      });
    }

    const store = storeResult.rows[0];

    res.json({
      store: {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address
      },
      totalRatings: parseInt(store.total_ratings),
      averageRating: parseFloat(store.average_rating)
    });
  } catch (error) {
    console.error('Store owner dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
});

module.exports = router;

