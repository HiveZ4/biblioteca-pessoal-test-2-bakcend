const express = require('express');
const app = express();
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const PORT = process.env.PORT || 8082;

// Inicializar Prisma
const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

// Testar conexão com banco
const testConnection = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Conectado ao banco de dados PostgreSQL no Neon!");
  } catch (err) {
    console.error("❌ Erro ao conectar ao banco de dados:", err);
  }
};

testConnection();

//Cross Origin Resource Sharing
app.use(cors(corsOptions));

//built-in middleware to handle url encoded data
//data which user enters in a form
app.use(express.urlencoded({ extended: false }));

//built-in middleware for json data
app.use(express.json());

// Rotas
const authRoutes = require('./routes/api/auth');
const booksRoutes = require('./routes/api/books');

app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'API do Gerenciador de Livros funcionando!' });
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

