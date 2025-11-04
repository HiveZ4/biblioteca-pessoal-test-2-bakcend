const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Formatar data para armazenar apenas a data (sem horário)
const formatDate = (dateString) => {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Calcular status baseado no progresso
const calculateStatus = (currentPage, totalPages) => {
  if (currentPage === 0) return 'Quero Ler';
  if (currentPage >= totalPages) return 'Lido';
  return 'Lendo';
};

// Listar livros do usuário
exports.getBooks = async (req, res) => {
  try {
    const userId = req.user.id;
    const books = await prisma.book.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });

    // Formatar resposta com progresso calculado
    const booksWithProgress = books.map(book => ({
      ...book,
      progress: book.no_of_pages > 0 
        ? Math.round((book.current_page / book.no_of_pages) * 100) 
        : 0,
      published_at: book.published_at.toISOString().split('T')[0],
      start_date: book.start_date ? book.start_date.toISOString().split('T')[0] : null,
      finish_date: book.finish_date ? book.finish_date.toISOString().split('T')[0] : null
    }));

    res.json(booksWithProgress);
  } catch (error) {
    console.error('Erro ao buscar livros:', error);
    res.status(500).json({ message: 'Erro ao buscar livros' });
  }
};

// Adicionar novo livro
exports.addBook = async (req, res) => {
  try {
    const { 
      title, 
      author,
      cover_image = null,
      no_of_pages, 
      published_at, 
      current_page = 0,
      genre = null,
      notes = null,
      start_date = null,
      finish_date = null
    } = req.body;
    const userId = req.user.id;

    // Validações
    if (!title || !author || !no_of_pages || !published_at) {
      return res.status(400).json({ message: 'Preencha todos os campos obrigatórios' });
    }

    if (current_page > no_of_pages) {
      return res.status(400).json({ 
        message: 'A página atual não pode ser maior que o total de páginas' 
      });
    }

    const status = calculateStatus(current_page, no_of_pages);

    const book = await prisma.book.create({
      data: {
        title,
        author,
        cover_image,
        no_of_pages: parseInt(no_of_pages),
        current_page: parseInt(current_page),
        published_at: formatDate(published_at),
        genre,
        notes,
        start_date: start_date ? formatDate(start_date) : null,
        finish_date: finish_date ? formatDate(finish_date) : null,
        status,
        user_id: userId
      }
    });

    res.status(201).json({
      ...book,
      progress: Math.round((book.current_page / book.no_of_pages) * 100),
      published_at: book.published_at.toISOString().split('T')[0],
      start_date: book.start_date ? book.start_date.toISOString().split('T')[0] : null,
      finish_date: book.finish_date ? book.finish_date.toISOString().split('T')[0] : null
    });
  } catch (error) {
    console.error('Erro ao adicionar livro:', error);
    res.status(500).json({ message: 'Erro ao adicionar livro' });
  }
};

// Obter livro específico
exports.getBook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const book = await prisma.book.findFirst({
      where: { 
        id: parseInt(id),
        user_id: userId 
      }
    });

    if (!book) {
      return res.status(404).json({ message: 'Livro não encontrado' });
    }

    res.json({
      ...book,
      progress: Math.round((book.current_page / book.no_of_pages) * 100),
      published_at: book.published_at.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Erro ao buscar livro:', error);
    res.status(500).json({ message: 'Erro ao buscar livro' });
  }
};

// Atualizar livro
exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      author,
      cover_image,
      no_of_pages, 
      published_at, 
      current_page,
      genre,
      notes,
      start_date,
      finish_date
    } = req.body;
    const userId = req.user.id;

    // Verificar se o livro pertence ao usuário
    const existingBook = await prisma.book.findFirst({
      where: { 
        id: parseInt(id),
        user_id: userId 
      }
    });

    if (!existingBook) {
      return res.status(404).json({ message: 'Livro não encontrado' });
    }

    // Validar página atual
    if (current_page !== undefined && current_page > no_of_pages) {
      return res.status(400).json({ 
        message: 'A página atual não pode ser maior que o total de páginas' 
      });
    }

    const finalCurrentPage = current_page !== undefined ? current_page : existingBook.current_page;
    const status = calculateStatus(finalCurrentPage, no_of_pages);

    const book = await prisma.book.update({
      where: { id: parseInt(id) },
      data: {
        title,
        author,
        cover_image: cover_image !== undefined ? cover_image : existingBook.cover_image,
        no_of_pages: parseInt(no_of_pages),
        current_page: parseInt(finalCurrentPage),
        published_at: formatDate(published_at),
        genre: genre !== undefined ? genre : existingBook.genre,
        notes: notes !== undefined ? notes : existingBook.notes,
        start_date: start_date !== undefined ? (start_date ? formatDate(start_date) : null) : existingBook.start_date,
        finish_date: finish_date !== undefined ? (finish_date ? formatDate(finish_date) : null) : existingBook.finish_date,
        status
      }
    });

    res.json({
      ...book,
      progress: Math.round((book.current_page / book.no_of_pages) * 100),
      published_at: book.published_at.toISOString().split('T')[0],
      start_date: book.start_date ? book.start_date.toISOString().split('T')[0] : null,
      finish_date: book.finish_date ? book.finish_date.toISOString().split('T')[0] : null
    });
  } catch (error) {
    console.error('Erro ao atualizar livro:', error);
    res.status(500).json({ message: 'Erro ao atualizar livro' });
  }
};

// Atualizar apenas o progresso de leitura
exports.updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { current_page } = req.body;
    const userId = req.user.id;

    const book = await prisma.book.findFirst({
      where: { 
        id: parseInt(id),
        user_id: userId 
      }
    });

    if (!book) {
      return res.status(404).json({ message: 'Livro não encontrado' });
    }

    if (current_page > book.no_of_pages) {
      return res.status(400).json({ 
        message: 'A página atual não pode ser maior que o total de páginas' 
      });
    }

    const status = calculateStatus(current_page, book.no_of_pages);

    const updatedBook = await prisma.book.update({
      where: { id: parseInt(id) },
      data: { 
        current_page: parseInt(current_page),
        status
      }
    });

    res.json({
      ...updatedBook,
      progress: Math.round((updatedBook.current_page / updatedBook.no_of_pages) * 100),
      published_at: updatedBook.published_at.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
    res.status(500).json({ message: 'Erro ao atualizar progresso' });
  }
};

// Atualizar avaliação do livro
exports.updateRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const userId = req.user.id;

    // Validar rating
    if (rating < 0 || rating > 5) {
      return res.status(400).json({ 
        message: 'A avaliação deve ser entre 0 e 5 estrelas' 
      });
    }

    const book = await prisma.book.findFirst({
      where: { 
        id: parseInt(id),
        user_id: userId 
      }
    });

    if (!book) {
      return res.status(404).json({ message: 'Livro não encontrado' });
    }

    const updatedBook = await prisma.book.update({
      where: { id: parseInt(id) },
      data: { rating: parseInt(rating) }
    });

    res.json({
      ...updatedBook,
      progress: Math.round((updatedBook.current_page / updatedBook.no_of_pages) * 100),
      published_at: updatedBook.published_at.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    res.status(500).json({ message: 'Erro ao atualizar avaliação' });
  }
};

// Deletar livro
exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const book = await prisma.book.findFirst({
      where: { 
        id: parseInt(id),
        user_id: userId 
      }
    });

    if (!book) {
      return res.status(404).json({ message: 'Livro não encontrado' });
    }

    await prisma.book.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Livro removido com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar livro:', error);
    res.status(500).json({ message: 'Erro ao deletar livro' });
  }
};