/*
 * GERENCIADOR DE LIVROS - IMPLEMENTAÇÃO COMPLETA COM POSTGRESQL (NEON)
 * 
 * Este arquivo contém toda a implementação necessária para migrar o projeto
 * de gerenciador de livros do sistema JSON para PostgreSQL hospedado no Neon.
 * 
 * INSTRUÇÕES DE USO:
 * 1. Instale as dependências: npm install pg dotenv
 * 2. Configure o arquivo .env com sua string de conexão do Neon
 * 3. Execute o script SQL de criação do banco (seção SQL SCRIPTS)
 * 4. Substitua o controller existente pelo código da seção CONTROLLER
 * 5. Adicione a configuração do banco na seção DATABASE CONFIG
 */

// ============================================================================
// SEÇÃO 1: CONFIGURAÇÃO DO BANCO DE DADOS
// ============================================================================

const { Pool } = require("pg");
require("dotenv").config();

// Configuração da conexão com PostgreSQL (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Função para testar a conexão
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Conectado ao banco de dados PostgreSQL no Neon!");
    client.release();
  } catch (err) {
    console.error("❌ Erro ao conectar ao banco de dados:", err);
  }
};

// Função genérica para executar queries
const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error("Erro ao executar query:", err);
    throw err;
  }
};

// ============================================================================
// SEÇÃO 2: FUNÇÕES DO BANCO DE DADOS
// ============================================================================

// Função para obter todos os livros
const getAllBooks = async () => {
  const result = await query("SELECT * FROM books ORDER BY id");
  return result.rows;
};

// Função para obter um livro por ID
const getBookById = async (id) => {
  const result = await query("SELECT * FROM books WHERE id = $1", [id]);
  return result.rows[0];
};

// Função para criar um novo livro
const createBook = async (title, author, no_of_pages, published_at) => {
  const result = await query(
    "INSERT INTO books (title, author, no_of_pages, published_at) VALUES ($1, $2, $3, $4) RETURNING *",
    [title, author, no_of_pages, published_at]
  );
  return result.rows[0];
};

// Função para atualizar um livro
const updateBook = async (id, title, author, no_of_pages, published_at) => {
  const result = await query(
    "UPDATE books SET title = $1, author = $2, no_of_pages = $3, published_at = $4 WHERE id = $5 RETURNING *",
    [title, author, no_of_pages, published_at, id]
  );
  return result.rows[0];
};

// Função para deletar um livro
const deleteBook = async (id) => {
  const result = await query("DELETE FROM books WHERE id = $1 RETURNING *", [id]);
  return result.rows[0];
};

// ============================================================================
// SEÇÃO 3: CONTROLLER ATUALIZADO
// ============================================================================

// Controller para gerenciar operações dos livros
const booksController = {
  
  // GET /api/books - Obter todos os livros
  getAllBooks: async (req, res) => {
    try {
      const books = await getAllBooks();
      res.json(books);
    } catch (error) {
      console.error("Erro ao buscar livros:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  // GET /api/books/editBook/:id - Obter um livro específico
  getBook: async (req, res) => {
    try {
      const book = await getBookById(parseInt(req.params.id));
      if (!book) {
        return res.status(404).json({ message: `Livro com ID ${req.params.id} não encontrado!` });
      }
      res.json(book);
    } catch (error) {
      console.error("Erro ao buscar livro:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  // POST /api/books/addBook - Criar novo livro
  createNewBook: async (req, res) => {
    try {
      const { title, author, bookPages, publishDate } = req.body;

      // Validação dos campos obrigatórios
      if (!title || !author || !bookPages || !publishDate) {
        return res.status(400).json({ message: "Por favor, insira todos os detalhes necessários!" });
      }

      // Validação do número de páginas
      const no_of_pages = parseInt(bookPages);
      if (isNaN(no_of_pages) || no_of_pages <= 0) {
        return res.status(400).json({ message: "Número de páginas deve ser um número positivo!" });
      }

      // Validação da data
      const published_at = new Date(publishDate);
      if (isNaN(published_at.getTime())) {
        return res.status(400).json({ message: "Data de publicação inválida!" });
      }

      const newBook = await createBook(
        title, 
        author, 
        no_of_pages, 
        published_at.toISOString().split("T")[0]
      );
      
      res.status(201).json({ 
        message: "Livro adicionado!", 
        book: newBook 
      });
    } catch (error) {
      console.error("Erro ao criar livro:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  // PUT /api/books/editBook/:id - Atualizar livro
  updateBook: async (req, res) => {
    try {
      const { id, title, author, no_of_pages, published_at } = req.body;

      // Verificar se o livro existe
      const existingBook = await getBookById(parseInt(id));
      if (!existingBook) {
        return res.status(404).json({ message: `Book ID ${id} not found` });
      }

      // Validação dos campos obrigatórios
      if (!title || !author || !no_of_pages || !published_at) {
        return res.status(400).json({ message: "Por favor, não deixe campos vazios!" });
      }

      // Validação do número de páginas
      const pages = parseInt(no_of_pages);
      if (isNaN(pages) || pages <= 0) {
        return res.status(400).json({ message: "Número de páginas deve ser um número positivo!" });
      }

      // Validação da data
      const pubDate = new Date(published_at);
      if (isNaN(pubDate.getTime())) {
        return res.status(400).json({ message: "Data de publicação inválida!" });
      }

      const updatedBook = await updateBook(
        parseInt(id), 
        title, 
        author, 
        pages, 
        pubDate.toISOString().split("T")[0]
      );

      res.json({ 
        message: "Livro atualizado!", 
        book: updatedBook 
      });
    } catch (error) {
      console.error("Erro ao atualizar livro:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  // DELETE /api/books/:id - Deletar livro
  deleteBook: async (req, res) => {
    try {
      const deletedBook = await deleteBook(parseInt(req.params.id));
      if (!deletedBook) {
        return res.status(404).json({ message: `Book ID ${req.params.id} not found` });
      }
      res.json({ 
        message: "Livro excluído!", 
        book: deletedBook 
      });
    } catch (error) {
      console.error("Erro ao deletar livro:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
};

// ============================================================================
// SEÇÃO 4: SCRIPT DE MIGRAÇÃO DE DADOS
// ============================================================================

// Função para migrar dados do JSON existente para PostgreSQL
const migrateFromJSON = async (jsonFilePath) => {
  try {
    const fs = require("fs");
    const existingBooks = JSON.parse(fs.readFileSync(jsonFilePath, "utf8"));
    
    console.log(`Migrando ${existingBooks.length} livros do JSON para PostgreSQL...`);
    
    for (const book of existingBooks) {
      await createBook(
        book.title,
        book.author,
        book.no_of_pages,
        book.published_at
      );
    }
    
    console.log("✅ Migração concluída com sucesso!");
  } catch (error) {
    console.error("❌ Erro na migração:", error);
  }
};

// ============================================================================
// SEÇÃO 5: INICIALIZAÇÃO E TESTES
// ============================================================================

// Função para inicializar o banco de dados
const initializeDatabase = async () => {
  try {
    await testConnection();
    console.log("🚀 Sistema de banco de dados inicializado!");
  } catch (error) {
    console.error("❌ Erro ao inicializar banco de dados:", error);
  }
};

// Exportações para uso no projeto
module.exports = {
  // Configuração do banco
  pool,
  query,
  testConnection,
  
  // Funções CRUD
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  
  // Controller
  booksController,
  
  // Utilitários
  migrateFromJSON,
  initializeDatabase
};

