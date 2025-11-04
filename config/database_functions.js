// database_functions.js

const pool = require('../config/gerenciador_livros_database'); // ajuste o caminho se necessário

const query = (text, params) => pool.query(text, params);

const getAllBooks = async () => {
  const result = await query("SELECT * FROM books ORDER BY id");
  return result.rows;
};

const getBookById = async (id) => {
  const result = await query("SELECT * FROM books WHERE id = $1", [id]);
  return result.rows[0];
};

const createBook = async (title, author, no_of_pages, published_at) => {
  const result = await query(
    "INSERT INTO books (title, author, no_of_pages, published_at) VALUES ($1, $2, $3, $4) RETURNING *",
    [title, author, no_of_pages, published_at]
  );
  return result.rows[0];
};

const updateBook = async (id, title, author, no_of_pages, published_at) => {
  const result = await query(
    "UPDATE books SET title = $1, author = $2, no_of_pages = $3, published_at = $4 WHERE id = $5 RETURNING *",
    [title, author, no_of_pages, published_at, id]
  );
  return result.rows[0];
};

const deleteBook = async (id) => {
  const result = await query("DELETE FROM books WHERE id = $1 RETURNING *", [id]);
  return result.rows[0];
};

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};
