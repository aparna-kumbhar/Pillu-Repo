const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'universe_super_secret_jwt_key_2024_pillu_repo';

/**
 * Middleware: verifies JWT token from Authorization header.
 * Usage: router.get('/protected', authenticate, handler)
 */
const authenticate = (req, res, next) => {
	const authHeader = req.headers['authorization'] || req.headers['Authorization'];
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ message: 'Authorization token required' });
	}

	const token = authHeader.split(' ')[1];
	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		req.user = decoded; // { id, role, instituteId, ... }
		next();
	} catch (err) {
		if (err.name === 'TokenExpiredError') {
			return res.status(401).json({ message: 'Session expired, please log in again', expired: true });
		}
		return res.status(401).json({ message: 'Invalid token' });
	}
};

/**
 * Helper: generate a JWT token
 */
const generateToken = (payload) => {
	return jwt.sign(payload, JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN || '30d',
	});
};

module.exports = { authenticate, generateToken };
