const bcrypt = require('bcryptjs');

class User {
    constructor(db) {
        this.db = db;
    }

    /**
     * Create a new user
     * @param {Object} userData - User data including email, password, firstName, lastName
     * @returns {Promise<Object>} - Created user object (without password)
     */
    async create({ email, password, firstName, lastName }) {
        try {
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Insert user into database
            const [result] = await this.db.execute(
                'INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)',
                [email, hashedPassword, firstName, lastName]
            );

            return {
                id: result.insertId,
                email,
                firstName,
                lastName
            };
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * Find a user by email
     * @param {string} email - User email
     * @returns {Promise<Object|null>} - User object or null if not found
     */
    async findByEmail(email) {
        try {
            const [rows] = await this.db.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    /**
     * Find a user by ID
     * @param {number} id - User ID
     * @returns {Promise<Object|null>} - User object or null if not found
     */
    async findById(id) {
        try {
            const [rows] = await this.db.execute(
                'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = ?',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error finding user by id:', error);
            throw error;
        }
    }

    /**
     * Verify user password
     * @param {string} password - Plain text password
     * @param {string} hashedPassword - Hashed password from database
     * @returns {Promise<boolean>} - True if password matches, false otherwise
     */
    async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    /**
     * Update user profile
     * @param {number} id - User ID
     * @param {Object} userData - Updated user data
     * @returns {Promise<Object>} - Updated user object
     */
    async update(id, { firstName, lastName, email }) {
        try {
            await this.db.execute(
                'UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?',
                [firstName, lastName, email, id]
            );
            return await this.findById(id);
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    async changePassword(id, newPassword) {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            
            await this.db.execute(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashedPassword, id]
            );
            return true;
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }
}

module.exports = User; 