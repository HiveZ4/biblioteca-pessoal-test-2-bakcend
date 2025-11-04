const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../middleware/authMiddleware');

const prisma = new PrismaClient();

const authController = {
  
  // POST /api/auth/register - Registrar novo usuário
  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Validação dos campos obrigatórios
      if (!username || !email || !password) {
        return res.status(400).json({ 
          message: "Por favor, preencha todos os campos obrigatórios!" 
        });
      }

      // Validação do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          message: "Por favor, insira um email válido!" 
        });
      }

      // Validação da senha
      if (password.length < 6) {
        return res.status(400).json({ 
          message: "A senha deve ter pelo menos 6 caracteres!" 
        });
      }

      // Verificar se o usuário já existe
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email },
            { username: username }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: "Usuário ou email já existe!" 
        });
      }

      // Criptografar a senha
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Criar novo usuário
      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword
        }
      });

      // Gerar token JWT
      const token = generateToken(newUser);

      // Remover senha da resposta
      const { password: _, ...userWithoutPassword } = newUser;

      res.status(201).json({
        message: "Usuário registrado com sucesso!",
        user: userWithoutPassword,
        token
      });

    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  // POST /api/auth/login - Login do usuário
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validação dos campos obrigatórios
      if (!email || !password) {
        return res.status(400).json({ 
          message: "Por favor, preencha email e senha!" 
        });
      }

      // Buscar usuário por email
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({ 
          message: "Email ou senha incorretos!" 
        });
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ 
          message: "Email ou senha incorretos!" 
        });
      }

      // Gerar token JWT
      const token = generateToken(user);

      // Remover senha da resposta
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: "Login realizado com sucesso!",
        user: userWithoutPassword,
        token
      });

    } catch (error) {
      console.error("Erro ao fazer login:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  // GET /api/auth/me - Obter informações do usuário logado
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          created_at: true,
          updated_at: true
        }
      });

      if (!user) {
        return res.status(404).json({ 
          message: "Usuário não encontrado!" 
        });
      }

      res.json({ user });

    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  // POST /api/auth/logout - Logout (opcional, para implementação futura com blacklist)
  logout: async (req, res) => {
    try {
      // Em uma implementação completa, você adicionaria o token a uma blacklist
      // Por enquanto, apenas retornamos sucesso
      res.json({ message: "Logout realizado com sucesso!" });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
};

module.exports = authController;

