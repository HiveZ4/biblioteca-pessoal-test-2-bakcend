const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const createTable = async () => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS "Book" (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        no_of_pages INTEGER NOT NULL,
        published_at TIMESTAMP(3) NOT NULL,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await pool.query(createTableQuery);
    console.log("✅ Tabela Book criada com sucesso!");
    
    // Também criar a tabela com nome minúsculo para compatibilidade
    const createTableQueryLower = `
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        no_of_pages INTEGER NOT NULL,
        published_at TIMESTAMP(3) NOT NULL,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await pool.query(createTableQueryLower);
    console.log("✅ Tabela books criada com sucesso!");
    
    await pool.end();
  } catch (error) {
    console.error("❌ Erro ao criar tabela:", error);
  }
};

createTable();

