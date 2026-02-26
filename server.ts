import express from 'express';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'liime_secret_key_123';

// Database setup
const db = new Database('liime.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    password TEXT,
    name TEXT,
    avatar TEXT,
    is_verified INTEGER DEFAULT 0,
    verification_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Add username column if it doesn't exist (for existing DBs)
try {
  db.exec('ALTER TABLE users ADD COLUMN username TEXT UNIQUE');
} catch (e) {
  // Ignore if column already exists
}

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased for avatars

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_USE_SSL === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// API Routes
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, username, avatar } = req.body;
  
  if (!username || !username.startsWith('@')) {
    return res.status(400).json({ error: 'Username must start with @' });
  }

  try {
    // Check if user already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(email, username) as any;
    
    if (existingUser) {
      if (existingUser.is_verified) {
        return res.status(400).json({ error: 'Email or username already exists' });
      }
      
      // If user exists but is not verified, update their info and resend code
      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      db.prepare('UPDATE users SET password = ?, name = ?, username = ?, avatar = ?, verification_code = ? WHERE email = ?')
        .run(hashedPassword, name, username, avatar || null, verificationCode, email);

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: 'Liime Verification Code',
          text: `Your verification code is: ${verificationCode}`,
          html: `<h1>Welcome to Liime!</h1><p>Your verification code is: <strong>${verificationCode}</strong></p>`,
        });
      } catch (mailError) {
        console.error('Failed to send email:', mailError);
      }

      return res.json({ message: 'Verification code resent. Please check your email.', email });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const id = Math.random().toString(36).substring(2, 15);

    const insert = db.prepare('INSERT INTO users (id, email, username, password, name, avatar, verification_code) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insert.run(id, email, username, hashedPassword, name, avatar || null, verificationCode);

    // Send email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Liime Verification Code',
        text: `Your verification code is: ${verificationCode}`,
        html: `<h1>Welcome to Liime!</h1><p>Your verification code is: <strong>${verificationCode}</strong></p>`,
      });
    } catch (mailError) {
      console.error('Failed to send email:', mailError);
    }

    res.json({ message: 'Registration successful. Please check your email for verification code.', email });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT' || error.message?.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/verify', (req, res) => {
  const { email, code } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  
  if (!user || user.verification_code !== code) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }

  db.prepare('UPDATE users SET is_verified = 1, verification_code = NULL WHERE email = ?').run(email);
  
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, name: user.name, avatar: user.avatar } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  
  if (!user || !user.is_verified) {
    return res.status(400).json({ error: 'User not found or not verified' });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(400).json({ error: 'Invalid password' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, name: user.name, avatar: user.avatar } });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_verified = 1').get(email) as any;
  
  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  db.prepare('UPDATE users SET verification_code = ? WHERE email = ?').run(verificationCode, email);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Liime Password Reset',
      text: `Your password reset code is: ${verificationCode}`,
      html: `<h1>Liime Password Reset</h1><p>Your code is: <strong>${verificationCode}</strong></p>`,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }

  res.json({ message: 'Reset code sent to email' });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  
  if (!user || user.verification_code !== code) {
    return res.status(400).json({ error: 'Invalid code' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  db.prepare('UPDATE users SET password = ?, verification_code = NULL WHERE email = ?').run(hashedPassword, email);
  
  res.json({ message: 'Password updated successfully' });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT id, username, name, avatar FROM users WHERE id = ?').get(decoded.id) as any;
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/api/users/search', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  const query = req.query.q as string;
  if (!query) return res.json([]);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const users = db.prepare(`
      SELECT id, username, name, avatar 
      FROM users 
      WHERE (username LIKE ? OR name LIKE ?) AND id != ? AND is_verified = 1
      LIMIT 20
    `).all(`%${query}%`, `%${query}%`, decoded.id);
    
    res.json(users);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/users/update', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { name, username, avatar } = req.body;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (username) {
      const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, decoded.id);
      if (existing) return res.status(400).json({ error: 'Username already taken' });
    }

    db.prepare('UPDATE users SET name = COALESCE(?, name), username = COALESCE(?, username), avatar = COALESCE(?, avatar) WHERE id = ?')
      .run(name, username, avatar, decoded.id);
      
    const user = db.prepare('SELECT id, username, name, avatar FROM users WHERE id = ?').get(decoded.id);
    res.json(user);
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Invalid token' });
    } else {
      console.error('Update error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Liime server running on http://localhost:${PORT}`);
  });
}

startServer();
