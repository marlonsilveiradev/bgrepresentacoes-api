/**
 * UTILITÁRIOS JWT
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'card-flags-system'
    });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

function extractTokenFromHeader(req) {
    const authHeader = req.headers.authorization;

    if (!authHeader) return null;

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

    return parts[1];
}

module.exports = {
    generateToken,
    verifyToken,
    extractTokenFromHeader
};