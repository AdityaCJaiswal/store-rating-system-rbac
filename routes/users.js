const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireUser } = require('../middleware/auth');
const { userValidation, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Get all users (with filtering and sorting)
router.get('/', authenticateToken, requireUser, async (req, res) => {
  try {
    const { 
      search, 
      role, 
      sortBy = 'name', 
      sortOrder = 'ASC',
      page = 1,
      limit = 10
    } = req.query;

    let query = `
      SELECT id, name, email, address, role, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 0;

    // Add search filter
    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR address ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Add role filter
    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      queryParams.push(role);
    }

    // Add sorting
    const allowedSortFields = ['name', 'email', 'address', 'role', 'created_at'];
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
    let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (name ILIKE $${countParamCount} OR email ILIKE $${countParamCount} OR address ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (role) {
      countParamCount++;
      countQuery += ` AND role = $${countParamCount}`;
      countParams.push(role);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalUsers = parseInt(countResult.rows[0].count);

    res.json({
      users: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, requireUser, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.address, u.role, u.created_at, u.updated_at,
              COALESCE(AVG(r.rating), 0) as average_rating
       FROM users u
       LEFT JOIN stores s ON u.id = s.owner_id
       LEFT JOIN ratings r ON s.id = r.store_id
       WHERE u.id = $1
       GROUP BY u.id, u.name, u.email, u.address, u.role, u.created_at, u.updated_at`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    
    // If user is a store owner, get their store details
    if (user.role === 'store_owner') {
      const storeResult = await pool.query(
        'SELECT id, name, email, address FROM stores WHERE owner_id = $1',
        [id]
      );
      user.store = storeResult.rows[0] || null;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
});

// Update user profile
router.put('/:id', authenticateToken, requireUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address } = req.body;

    // Check if user exists
    const userResult = await pool.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only allow users to update their own profile (unless admin)
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'You can only update your own profile' });
    }

    // Validate input
    if (name && (name.length < 20 || name.length > 60)) {
      return res.status(400).json({ message: 'Name must be between 20 and 60 characters' });
    }
    if (address && address.length > 400) {
      return res.status(400).json({ message: 'Address must not exceed 400 characters' });
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (name) {
      paramCount++;
      updateFields.push(`name = $${paramCount}`);
      updateValues.push(name);
    }

    if (address) {
      paramCount++;
      updateFields.push(`address = $${paramCount}`);
      updateValues.push(address);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    paramCount++;
    updateValues.push(id);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING id, name, email, address, role, updated_at`;
    
    const result = await pool.query(query, updateValues);

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireUser, async (req, res) => {
  try {
    const { id } = req.params;

    // Only admin can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can delete users' });
    }

    // Check if user exists
    const userResult = await pool.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

module.exports = router;
