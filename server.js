require('dotenv').config();

const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
});

// Express application setup
const app = express();
app.use(express.json());

// HTTP server & Socket.io integration
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('auth:join', async (authPayload) => {
    try {
      const token =
        typeof authPayload === 'string'
          ? authPayload
          : authPayload && typeof authPayload.token === 'string'
          ? authPayload.token
          : null;

      if (!token) {
        socket.emit('auth:error', { message: 'Missing token.' });
        return;
      }

      const decoded = jwt.verify(token, getJwtSecret());

      socket.join(decoded.sub);
      socket.emit('auth:ack', { status: 'joined', userId: decoded.sub });
    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.emit('auth:error', { message: 'Authentication failed.' });
    }
  });

  socket.on('admin:join', async (authPayload) => {
    try {
      const token =
        typeof authPayload === 'string'
          ? authPayload
          : authPayload && typeof authPayload.token === 'string'
          ? authPayload.token
          : null;

      if (!token) {
        socket.emit('admin:error', { message: 'Missing token.' });
        return;
      }

      const expectedToken = getAdminApiToken();

      if (token !== expectedToken) {
        socket.emit('admin:error', { message: 'Invalid credentials.' });
        return;
      }

      socket.join('admin');
      socket.emit('admin:ack', { status: 'joined' });
    } catch (error) {
      console.error('Admin socket authentication error:', error);
      socket.emit('admin:error', { message: 'Authentication failed.' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set.');
  }

  return secret;
}

function signAccessToken(payload) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

function getAdminApiToken() {
  const token = process.env.ADMIN_API_TOKEN;

  if (!token) {
    throw new Error('ADMIN_API_TOKEN environment variable is not set.');
  }

  return token;
}

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    const query = `
      SELECT user_id, username, public_key, encrypted_private_key
      FROM users
      WHERE user_id = $1
    `;

    const { rows } = await pool.query(query, [decoded.sub]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid authentication token.' });
    }

    req.user = {
      userId: user.user_id,
      username: user.username,
      publicKey: user.public_key,
      encryptedPrivateKey: user.encrypted_private_key,
    };
    req.token = token;
    req.jwtPayload = decoded;

    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid authentication token.' });
  }
}

async function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Admin authentication required.' });
  }

  let expectedToken;
  try {
    expectedToken = getAdminApiToken();
  } catch (error) {
    console.error('Admin authentication misconfigured:', error);
    return res.status(500).json({ message: 'Admin authentication misconfigured.' });
  }

  if (token !== expectedToken) {
    return res.status(401).json({ message: 'Invalid admin credentials.' });
  }

  req.admin = { isAdmin: true };
  req.token = token;
  return next();
}

// Placeholder controller stubs for API endpoints
async function registerUser(req, res) {
  const { username, password, publicKey, encryptedPrivateKey } = req.body || {};

  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    typeof publicKey !== 'string' ||
    typeof encryptedPrivateKey !== 'string'
  ) {
    return res.status(400).json({
      message:
        'Invalid request body. Expected username, password, publicKey, and encryptedPrivateKey as strings.',
    });
  }

  const normalizedUsername = username.trim();

  if (!normalizedUsername || !password.trim() || !publicKey.trim() || !encryptedPrivateKey.trim()) {
    return res.status(400).json({
      message: 'All fields (username, password, publicKey, encryptedPrivateKey) are required.',
    });
  }

  try {
    const passwordHash = await argon2.hash(password);

    const insertQuery = `
      INSERT INTO users (username, password_hash, public_key, encrypted_private_key)
      VALUES ($1, $2, $3, $4)
      RETURNING user_id, username, public_key, encrypted_private_key
    `;

    const { rows } = await pool.query(insertQuery, [
      normalizedUsername,
      passwordHash,
      publicKey,
      encryptedPrivateKey,
    ]);

    const createdUser = rows[0];

    return res.status(201).json({
      userId: createdUser.user_id,
      username: createdUser.username,
      publicKey: createdUser.public_key,
      encryptedPrivateKey: createdUser.encrypted_private_key,
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Username already exists.' });
    }

    console.error('Error registering user:', error);
    return res.status(500).json({ message: 'Failed to register user.' });
  }
}

async function loginUser(req, res) {
  const { username, password } = req.body || {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res
      .status(400)
      .json({ message: 'Invalid request body. Expected username and password as strings.' });
  }

  const normalizedUsername = username.trim();

  if (!normalizedUsername || !password.trim()) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const query = `
      SELECT user_id, username, password_hash, public_key, encrypted_private_key
      FROM users
      WHERE username = $1
    `;

    const { rows } = await pool.query(query, [normalizedUsername]);

    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isPasswordValid = await argon2.verify(user.password_hash, password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    let token;

    try {
      token = signAccessToken({
        sub: user.user_id,
        username: user.username,
      });
    } catch (error) {
      console.error('Error creating JWT:', error);
      return res.status(500).json({ message: 'Authentication service misconfigured.' });
    }

    return res.json({
      token,
      userId: user.user_id,
      username: user.username,
      publicKey: user.public_key,
      encryptedPrivateKey: user.encrypted_private_key,
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    return res.status(500).json({ message: 'Failed to log in.' });
  }
}

async function getAuthenticatedUser(req, res) {
  if (!req.user) {
    return res.status(500).json({ message: 'Authentication context missing.' });
  }

  return res.json({
    userId: req.user.userId,
    username: req.user.username,
    publicKey: req.user.publicKey,
    encryptedPrivateKey: req.user.encryptedPrivateKey,
  });
}

async function getPublicConfig(req, res) {
  try {
    const query = `
      SELECT admin_public_key
      FROM admin_config
      ORDER BY config_id ASC
      LIMIT 1
    `;

    const { rows } = await pool.query(query);
    const config = rows[0];

    if (!config) {
      return res.status(404).json({ message: 'Admin configuration not found.' });
    }

    return res.json({
      adminPublicKey: config.admin_public_key,
    });
  } catch (error) {
    console.error('Error fetching public config:', error);
    return res.status(500).json({ message: 'Failed to load configuration.' });
  }
}

async function listUsers(req, res) {
  try {
    const query = `
      SELECT user_id, username, public_key
      FROM users
      ORDER BY username ASC
    `;

    const { rows } = await pool.query(query);

    const users = rows.map((row) => ({
      userId: row.user_id,
      username: row.username,
      publicKey: row.public_key,
    }));

    return res.json({ users });
  } catch (error) {
    console.error('Error listing users:', error);
    return res.status(500).json({ message: 'Failed to fetch users.' });
  }
}

async function getUserMessages(req, res) {
  if (!req.user) {
    return res.status(500).json({ message: 'Authentication context missing.' });
  }

  const { userId: currentUserId } = req.user;
  const { userId: targetUserId } = req.params;

  if (!targetUserId || typeof targetUserId !== 'string') {
    return res.status(400).json({ message: 'Invalid target user id.' });
  }

  try {
    const userCheck = await pool.query(
      `
        SELECT user_id
        FROM users
        WHERE user_id = $1
      `,
      [targetUserId]
    );

    if (userCheck.rowCount === 0) {
      return res.status(404).json({ message: 'Target user not found.' });
    }

    const { rows } = await pool.query(
      `
        SELECT message_id,
               sender_id,
               recipient_id,
               payload_recipient,
               payload_admin,
               nonce,
               sent_at
        FROM messages
        WHERE (sender_id = $1 AND recipient_id = $2)
           OR (sender_id = $2 AND recipient_id = $1)
        ORDER BY sent_at ASC
      `,
      [currentUserId, targetUserId]
    );

    const messages = rows.map((row) => ({
      messageId: row.message_id,
      senderId: row.sender_id,
      recipientId: row.recipient_id,
      payloadRecipient: row.payload_recipient,
      payloadAdmin: row.payload_admin,
      nonce: row.nonce,
      sentAt: row.sent_at,
    }));

    return res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ message: 'Failed to fetch messages.' });
  }
}

async function postMessage(req, res) {
  if (!req.user) {
    return res.status(500).json({ message: 'Authentication context missing.' });
  }

  const { userId: senderId } = req.user;
  const {
    recipientId,
    payload_recipient: payloadRecipient,
    payloadRecipient: camelPayloadRecipient,
    payload_admin: payloadAdmin,
    payloadAdmin: camelPayloadAdmin,
    nonce,
  } = req.body || {};

  const resolvedPayloadRecipient =
    typeof payloadRecipient === 'string'
      ? payloadRecipient
      : typeof camelPayloadRecipient === 'string'
      ? camelPayloadRecipient
      : null;

  const resolvedPayloadAdmin =
    typeof payloadAdmin === 'string'
      ? payloadAdmin
      : typeof camelPayloadAdmin === 'string'
      ? camelPayloadAdmin
      : null;

  if (
    typeof recipientId !== 'string' ||
    typeof resolvedPayloadRecipient !== 'string' ||
    typeof resolvedPayloadAdmin !== 'string' ||
    typeof nonce !== 'string'
  ) {
    return res.status(400).json({
      message:
        'Invalid request body. Expected recipientId, payload_recipient, payload_admin, and nonce as strings.',
    });
  }

  if (!recipientId.trim() || !resolvedPayloadRecipient.trim() || !resolvedPayloadAdmin.trim() || !nonce.trim()) {
    return res
      .status(400)
      .json({ message: 'All message fields (recipientId, payloads, nonce) are required.' });
  }

  if (recipientId === senderId) {
    return res.status(400).json({ message: 'Cannot send messages to yourself.' });
  }

  try {
    const recipientResult = await pool.query(
      `
        SELECT user_id, username, public_key
        FROM users
        WHERE user_id = $1
      `,
      [recipientId]
    );

    if (recipientResult.rowCount === 0) {
      return res.status(404).json({ message: 'Recipient not found.' });
    }
    const recipientRow = recipientResult.rows[0];

    const insertQuery = `
      INSERT INTO messages (sender_id, recipient_id, payload_recipient, payload_admin, nonce)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING message_id, sender_id, recipient_id, payload_recipient, payload_admin, nonce, sent_at
    `;

    const { rows } = await pool.query(insertQuery, [
      senderId,
      recipientId,
      resolvedPayloadRecipient,
      resolvedPayloadAdmin,
      nonce,
    ]);

    const message = rows[0];

    const responsePayload = {
      messageId: message.message_id,
      senderId: message.sender_id,
      recipientId: message.recipient_id,
      payloadRecipient: message.payload_recipient,
      payloadAdmin: message.payload_admin,
      nonce: message.nonce,
      sentAt: message.sent_at,
      senderUsername: req.user.username,
      senderPublicKey: req.user.publicKey,
      recipientUsername: recipientRow.username,
      recipientPublicKey: recipientRow.public_key,
    };

    io.to(recipientId).emit('message:new', responsePayload);
    io.to(senderId).emit('message:new', responsePayload);
    io.to('admin').emit('message:new', responsePayload);

    return res.status(201).json(responsePayload);
  } catch (error) {
    console.error('Error posting message:', error);
    return res.status(500).json({ message: 'Failed to send message.' });
  }
}

async function getAllMessagesForAdmin(req, res) {
  try {
    const { rows } = await pool.query(
      `
        SELECT
          m.message_id,
          m.sender_id,
          sender.username AS sender_username,
          sender.public_key AS sender_public_key,
          m.recipient_id,
          recipient.username AS recipient_username,
          recipient.public_key AS recipient_public_key,
          m.payload_recipient,
          m.payload_admin,
          m.nonce,
          m.sent_at
        FROM messages m
        JOIN users sender ON sender.user_id = m.sender_id
        JOIN users recipient ON recipient.user_id = m.recipient_id
        ORDER BY m.sent_at ASC
      `
    );

    const messages = rows.map((row) => ({
      messageId: row.message_id,
      senderId: row.sender_id,
      senderUsername: row.sender_username,
      senderPublicKey: row.sender_public_key,
      recipientId: row.recipient_id,
      recipientUsername: row.recipient_username,
      recipientPublicKey: row.recipient_public_key,
      payloadRecipient: row.payload_recipient,
      payloadAdmin: row.payload_admin,
      nonce: row.nonce,
      sentAt: row.sent_at,
    }));

    return res.json({ messages });
  } catch (error) {
    console.error('Error fetching admin messages:', error);
    return res.status(500).json({ message: 'Failed to fetch admin messages.' });
  }
}

// API routes
app.post('/api/v1/auth/register', registerUser);
app.post('/api/v1/auth/login', loginUser);
app.get('/api/v1/auth/me', authenticate, getAuthenticatedUser);
app.get('/api/v1/config', getPublicConfig);
app.get('/api/v1/users', authenticate, listUsers);
app.get('/api/v1/messages/:userId', authenticate, getUserMessages);
app.post('/api/v1/messages', authenticate, postMessage);
app.get('/api/v1/admin/messages', authenticateAdmin, getAllMessagesForAdmin);

// Basic health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'reachable' });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ status: 'error', database: 'unreachable' });
  }
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = {
  app,
  httpServer,
  io,
  pool,
};

