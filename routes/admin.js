const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { userValidation, storeValidation, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get total users count
    const usersResult = await pool.query('SELECT COUNT(*) as total_users FROM users');
    const totalUsers = parseInt(usersResult.rows[0].total_users);

    // Get total stores count
    const storesResult = await pool.query('SELECT COUNT(*) as total_stores FROM stores');
    const totalStores = parseInt(storesResult.rows[0].total_stores);

    // Get total ratings count
    const ratingsResult = await pool.query('SELECT COUNT(*) as total_ratings FROM ratings');
    const totalRatings = parseInt(ratingsResult.rows[0].total_ratings);

    // Get users by role
    const usersByRoleResult = await pool.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);
    const usersByRole = usersByRoleResult.rows.reduce((acc, row) => {
      acc[row.role] = parseInt(row.count);
      return acc;
    }, {});

    // Get recent activity (last 10 ratings)
    const recentRatingsResult = await pool.query(`
      SELECT r.rating, r.created_at, u.name as user_name, s.name as store_name
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      JOIN stores s ON r.store_id = s.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `);

    res.json({
      statistics: {
        totalUsers,
        totalStores,
        totalRatings,
        usersByRole
      },
      recentActivity: recentRatingsResult.rows
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
});

// Create new user (admin only)
router.post('/users', authenticateToken, requireAdmin, userValidation, handleValidationErrors, async (req, res) => {
  try {
    const { name, email, password, address, role = 'user' } = req.body;

    // Validate role
    const validRoles = ['admin', 'user', 'store_owner'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be admin, user, or store_owner' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (name, email, password, address, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, address, role, created_at',
      [name, email, hashedPassword, address, role]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error creating user' });
  }
});

// Create new store (admin only)
router.post('/stores', authenticateToken, requireAdmin, storeValidation, handleValidationErrors, async (req, res) => {
  try {
    const { name, email, address, owner_id } = req.body;

    // Check if store email already exists
    const existingStore = await pool.query(
      'SELECT id FROM stores WHERE email = $1',
      [email]
    );

    if (existingStore.rows.length > 0) {
      return res.status(400).json({ message: 'Store already exists with this email' });
    }

    // Verify owner exists and is a store owner (if provided)
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

// Get all users with detailed information
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
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
      SELECT u.id, u.name, u.email, u.address, u.role, u.created_at, u.updated_at,
             COALESCE(AVG(r.rating), 0) as average_rating,
             COUNT(r.id) as total_ratings
      FROM users u
      LEFT JOIN stores s ON u.id = s.owner_id
      LEFT JOIN ratings r ON s.id = r.store_id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 0;

    // Add search filter
    if (search) {
      paramCount++;
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR u.address ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Add role filter
    if (role) {
      paramCount++;
      query += ` AND u.role = $${paramCount}`;
      queryParams.push(role);
    }

    query += ` GROUP BY u.id, u.name, u.email, u.address, u.role, u.created_at, u.updated_at`;

    // Add sorting
    const allowedSortFields = ['name', 'email', 'address', 'role', 'average_rating', 'total_ratings', 'created_at'];
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
    console.error('Get admin users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// Get all stores with detailed information
router.get('/stores', authenticateToken, requireAdmin, async (req, res) => {
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
             u.name as owner_name, u.id as owner_id
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      LEFT JOIN users u ON s.owner_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 0;

    // Add search filter
    if (search) {
      paramCount++;
      query += ` AND (s.name ILIKE $${paramCount} OR s.email ILIKE $${paramCount} OR s.address ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    query += ` GROUP BY s.id, s.name, s.email, s.address, s.created_at, s.updated_at, u.name, u.id`;

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

    if (search) {
      countParamCount++;
      countQuery += ` AND (name ILIKE $${countParamCount} OR email ILIKE $${countParamCount} OR address ILIKE $${countParamCount})`;
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
    console.error('Get admin stores error:', error);
    res.status(500).json({ message: 'Server error fetching stores' });
  }
});

// Update user role
router.put('/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['admin', 'user', 'store_owner'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be admin, user, or store_owner' });
    }

    // Check if user exists
    const userResult = await pool.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from changing their own role
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    // Update role
    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );

    res.json({
      message: 'User role updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error updating user role' });
  }
});

module.exports = router;
