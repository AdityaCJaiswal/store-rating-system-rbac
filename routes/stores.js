const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireUser, requireStoreOwner } = require('../middleware/auth');
const { storeValidation, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Get all stores (with filtering and sorting)
router.get('/', authenticateToken, requireUser, async (req, res) => {
  try {
    const { 
      search, 
      sortBy = 'name', 
      sortOrder = 'ASC',
      page = 1,
      limit = 10
    } = req.query;

    let query = `
      SELECT s.id, s.name, s.email, s.address, s.created_at, s.updated_at,
             COALESCE(AVG(r.rating), 0) as average_rating,
             COUNT(r.id) as total_ratings,
             u.name as owner_name
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      LEFT JOIN users u ON s.owner_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 0;

    // Filter by user role
    if (req.user.role === 'store_owner') {
      paramCount++;
      query += ` AND s.owner_id = $${paramCount}`;
      queryParams.push(req.user.id);
    }

    // Add search filter
    if (search) {
      paramCount++;
      query += ` AND (s.name ILIKE $${paramCount} OR s.address ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    query += ` GROUP BY s.id, s.name, s.email, s.address, s.created_at, s.updated_at, u.name`;

    // Add sorting
    const allowedSortFields = ['name', 'email', 'address', 'average_rating', 'total_ratings', 'created_at'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
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
    let countQuery = 'SELECT COUNT(*) FROM stores WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    // Filter by user role for count
    if (req.user.role === 'store_owner') {
      countParamCount++;
      countQuery += ` AND owner_id = $${countParamCount}`;
      countParams.push(req.user.id);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (name ILIKE $${countParamCount} OR address ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalStores = parseInt(countResult.rows[0].count);

    res.json({
      stores: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalStores / parseInt(limit)),
        totalStores,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ message: 'Server error fetching stores' });
  }
});

// Get store by ID
router.get('/:id', authenticateToken, requireUser, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT s.id, s.name, s.email, s.address, s.created_at, s.updated_at,
              COALESCE(AVG(r.rating), 0) as average_rating,
              COUNT(r.id) as total_ratings,
              u.name as owner_name, u.id as owner_id
       FROM stores s
       LEFT JOIN ratings r ON s.id = r.store_id
       LEFT JOIN users u ON s.owner_id = u.id
       WHERE s.id = $1
       GROUP BY s.id, s.name, s.email, s.address, s.created_at, s.updated_at, u.name, u.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const store = result.rows[0];

    // Get user's rating for this store if they're a regular user
    if (req.user.role === 'user') {
      const userRatingResult = await pool.query(
        'SELECT rating FROM ratings WHERE user_id = $1 AND store_id = $2',
        [req.user.id, id]
      );
      store.user_rating = userRatingResult.rows[0]?.rating || null;
    }

    res.json({ store });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ message: 'Server error fetching store' });
  }
});

// Create new store (admin only)
router.post('/', authenticateToken, requireUser, storeValidation, handleValidationErrors, async (req, res) => {
  try {
    const { name, email, address, owner_id } = req.body;

    // Only admin can create stores
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can create stores' });
    }

    // Check if store email already exists
    const existingStore = await pool.query(
      'SELECT id FROM stores WHERE email = $1',
      [email]
    );

    if (existingStore.rows.length > 0) {
      return res.status(400).json({ message: 'Store already exists with this email' });
    }

    // Verify owner exists and is a store owner
    if (owner_id) {
      const ownerResult = await pool.query(
        'SELECT id, role FROM users WHERE id = $1',
        [owner_id]
      );

      if (ownerResult.rows.length === 0) {
        return res.status(400).json({ message: 'Owner not found' });
      }

      if (ownerResult.rows[0].role !== 'store_owner') {
        return res.status(400).json({ message: 'Owner must have store_owner role' });
      }
    }

    const result = await pool.query(
      'INSERT INTO stores (name, email, address, owner_id) VALUES ($1, $2, $3, $4) RETURNING id, name, email, address, owner_id, created_at',
      [name, email, address, owner_id || null]
    );

    res.status(201).json({
      message: 'Store created successfully',
      store: result.rows[0]
    });
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ message: 'Server error creating store' });
  }
});

// Update store
router.put('/:id', authenticateToken, requireUser, storeValidation, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address, owner_id } = req.body;

    // Check if store exists
    const storeResult = await pool.query('SELECT id, owner_id FROM stores WHERE id = $1', [id]);
    if (storeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Only admin or store owner can update store
    if (req.user.role !== 'admin' && req.user.id !== storeResult.rows[0].owner_id) {
      return res.status(403).json({ message: 'You can only update your own store' });
    }

    // Check if email is already taken by another store
    if (email) {
      const existingStore = await pool.query(
        'SELECT id FROM stores WHERE email = $1 AND id != $2',
        [email, id]
      );

      if (existingStore.rows.length > 0) {
        return res.status(400).json({ message: 'Email already taken by another store' });
      }
    }

    // Verify owner exists and is a store owner (if changing owner)
    if (owner_id) {
      const ownerResult = await pool.query(
        'SELECT id, role FROM users WHERE id = $1',
        [owner_id]
      );

      if (ownerResult.rows.length === 0) {
        return res.status(400).json({ message: 'Owner not found' });
      }

      if (ownerResult.rows[0].role !== 'store_owner') {
        return res.status(400).json({ message: 'Owner must have store_owner role' });
      }
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (name) {
      paramCount++;
      updateFields.push(`name = $${paramCount}`);
      updateValues.push(name);
    }

    if (email) {
      paramCount++;
      updateFields.push(`email = $${paramCount}`);
      updateValues.push(email);
    }

    if (address) {
      paramCount++;
      updateFields.push(`address = $${paramCount}`);
      updateValues.push(address);
    }

    if (owner_id !== undefined) {
      paramCount++;
      updateFields.push(`owner_id = $${paramCount}`);
      updateValues.push(owner_id);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    paramCount++;
    updateValues.push(id);

    const query = `UPDATE stores SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING id, name, email, address, owner_id, updated_at`;
    
    const result = await pool.query(query, updateValues);

    res.json({
      message: 'Store updated successfully',
      store: result.rows[0]
    });
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({ message: 'Server error updating store' });
  }
});

// Delete store (admin only)
router.delete('/:id', authenticateToken, requireUser, async (req, res) => {
  try {
    const { id } = req.params;

    // Only admin can delete stores
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can delete stores' });
    }

    // Check if store exists
    const storeResult = await pool.query('SELECT id FROM stores WHERE id = $1', [id]);
    if (storeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }

    await pool.query('DELETE FROM stores WHERE id = $1', [id]);

    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    console.error('Delete store error:', error);
    res.status(500).json({ message: 'Server error deleting store' });
  }
});

module.exports = router;
