const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireUser } = require('../middleware/auth');
const { ratingValidation, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Submit or update rating for a store
router.post('/:storeId', authenticateToken, requireUser, ratingValidation, handleValidationErrors, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { rating } = req.body;

    // Only regular users can submit ratings
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only regular users can submit ratings' });
    }

    // Check if store exists
    const storeResult = await pool.query('SELECT id FROM stores WHERE id = $1', [storeId]);
    if (storeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if user already rated this store
    const existingRating = await pool.query(
      'SELECT id, rating FROM ratings WHERE user_id = $1 AND store_id = $2',
      [req.user.id, storeId]
    );

    if (existingRating.rows.length > 0) {
      // Update existing rating
      const result = await pool.query(
        'UPDATE ratings SET rating = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND store_id = $3 RETURNING id, rating, created_at, updated_at',
        [rating, req.user.id, storeId]
      );

      res.json({
        message: 'Rating updated successfully',
        rating: result.rows[0]
      });
    } else {
      // Create new rating
      const result = await pool.query(
        'INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3) RETURNING id, rating, created_at, updated_at',
        [req.user.id, storeId, rating]
      );

      res.status(201).json({
        message: 'Rating submitted successfully',
        rating: result.rows[0]
      });
    }
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ message: 'Server error submitting rating' });
  }
});

// Get user's rating for a specific store
router.get('/:storeId/user', authenticateToken, requireUser, async (req, res) => {
  try {
    const { storeId } = req.params;

    // Only regular users can view their own ratings
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only regular users can view their ratings' });
    }

    const result = await pool.query(
      'SELECT id, rating, created_at, updated_at FROM ratings WHERE user_id = $1 AND store_id = $2',
      [req.user.id, storeId]
    );

    if (result.rows.length === 0) {
      return res.json({ rating: null });
    }

    res.json({ rating: result.rows[0] });
  } catch (error) {
    console.error('Get user rating error:', error);
    res.status(500).json({ message: 'Server error fetching user rating' });
  }
});

// Get all ratings for a store (store owner and admin only)
router.get('/:storeId', authenticateToken, requireUser, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { 
      sortBy = 'created_at', 
      sortOrder = 'DESC',
      page = 1,
      limit = 10
    } = req.query;

    // Check if store exists
    const storeResult = await pool.query('SELECT id, owner_id FROM stores WHERE id = $1', [storeId]);
    if (storeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Only store owner or admin can view all ratings
    if (req.user.role !== 'admin' && req.user.id !== storeResult.rows[0].owner_id) {
      return res.status(403).json({ message: 'Only store owner or admin can view all ratings' });
    }

    let query = `
      SELECT r.id, r.rating, r.created_at, r.updated_at,
             u.name as user_name, u.email as user_email
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = $1
    `;
    const queryParams = [storeId];
    let paramCount = 1;

    // Add sorting
    const allowedSortFields = ['rating', 'created_at', 'updated_at', 'user_name'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortField} ${sortDirection}`;

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    queryParams.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    queryParams.push(offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM ratings WHERE store_id = $1',
      [storeId]
    );
    const totalRatings = parseInt(countResult.rows[0].count);

    // Get average rating
    const avgResult = await pool.query(
      'SELECT COALESCE(AVG(rating), 0) as average_rating FROM ratings WHERE store_id = $1',
      [storeId]
    );

    res.json({
      ratings: result.rows,
      average_rating: parseFloat(avgResult.rows[0].average_rating),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRatings / parseInt(limit)),
        totalRatings,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get store ratings error:', error);
    res.status(500).json({ message: 'Server error fetching store ratings' });
  }
});

// Delete rating (user can delete their own rating)
router.delete('/:storeId', authenticateToken, requireUser, async (req, res) => {
  try {
    const { storeId } = req.params;

    // Only regular users can delete their own ratings
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only regular users can delete their ratings' });
    }

    const result = await pool.query(
      'DELETE FROM ratings WHERE user_id = $1 AND store_id = $2 RETURNING id',
      [req.user.id, storeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    res.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({ message: 'Server error deleting rating' });
  }
});

// Get user's all ratings
router.get('/user/all', authenticateToken, requireUser, async (req, res) => {
  try {
    const { 
      sortBy = 'created_at', 
      sortOrder = 'DESC',
      page = 1,
      limit = 10
    } = req.query;

    // Only regular users can view their own ratings
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only regular users can view their ratings' });
    }

    let query = `
      SELECT r.id, r.rating, r.created_at, r.updated_at,
             s.name as store_name, s.address as store_address
      FROM ratings r
      JOIN stores s ON r.store_id = s.id
      WHERE r.user_id = $1
    `;
    const queryParams = [req.user.id];
    let paramCount = 1;

    // Add sorting
    const allowedSortFields = ['rating', 'created_at', 'updated_at', 'store_name'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortField} ${sortDirection}`;

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    queryParams.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    queryParams.push(offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM ratings WHERE user_id = $1',
      [req.user.id]
    );
    const totalRatings = parseInt(countResult.rows[0].count);

    res.json({
      ratings: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRatings / parseInt(limit)),
        totalRatings,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get user ratings error:', error);
    res.status(500).json({ message: 'Server error fetching user ratings' });
  }
});

module.exports = router;
