const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');
const { authenticateToken } = require('../../middleware/authMiddleware');

// POST /api/auth/register - Registrar novo usuário
router.post('/register', authController.register);

// POST /api/auth/login - Login do usuário
router.post('/login', authController.login);

// GET /api/auth/me - Obter perfil do usuário logado (rota protegida)
router.get('/me', authenticateToken, authController.getProfile);

// POST /api/auth/logout - Logout do usuário (rota protegida)
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;

