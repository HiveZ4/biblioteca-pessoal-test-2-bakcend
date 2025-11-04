const express = require('express');
const router = express.Router();
const bookController = require('../../controllers/bookController');
const { authenticateToken } = require('../../middleware/authMiddleware');

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas CRUD
router.get('/', bookController.getBooks);
router.post('/addBook', bookController.addBook);
router.get('/editBook/:id', bookController.getBook);
router.put('/editBook/:id', bookController.updateBook);
router.delete('/:id', bookController.deleteBook);

// Nova rota para atualizar apenas o progresso
router.patch('/:id/progress', bookController.updateProgress);
router.patch('/:id/rating', bookController.updateRating);

module.exports = router;