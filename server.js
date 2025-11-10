require('dotenv').config();

const http = require('http');
const express = require('express');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const logger = require('./utils/logger');
const errorHandler = require('./utils/errorHandler');

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function isPasswordComplex(password) {
  return passwordComplexityRegex.test(password);
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(createHttpError(429, 'Too many authentication attempts. Please try again later.'));
  },
});

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
  logger.info('Socket connected', { socketId: socket.id });

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
      logger.error('Socket authentication error', error);
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
      logger.error('Admin socket authentication error', error);
      socket.emit('admin:error', { message: 'Authentication failed.' });
    }
  });

  socket.on('disconnect', () => {
    logger.info('Socket disconnected', { socketId: socket.id });
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
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw createHttpError(401, 'Authentication required.');
    }

    const decoded = jwt.verify(token, getJwtSecret());

    const query = `
      SELECT user_id, username, public_key, encrypted_private_key
      FROM users
      WHERE user_id = $1
    `;

    const { rows } = await pool.query(query, [decoded.sub]);
    const user = rows[0];

    if (!user) {
      throw createHttpError(401, 'Invalid authentication token.');
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
    if (
      error.statusCode
    ) {
      return next(error);
    }

    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.message === 'invalid signature'
    ) {
      return next(createHttpError(401, 'Invalid authentication token.'));
    }

    if (error.message === 'JWT_SECRET environment variable is not set.') {
      return next(createHttpError(500, 'Authentication service misconfigured.'));
    }

    return next(error);
  }
}

async function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw createHttpError(401, 'Admin authentication required.');
    }

    const expectedToken = getAdminApiToken();

    if (token !== expectedToken) {
      throw createHttpError(401, 'Invalid admin credentials.');
    }

    req.admin = { isAdmin: true };
    req.token = token;
    return next();
  } catch (error) {
    if (error.statusCode) {
      return next(error);
    }

    if (error.message === 'ADMIN_API_TOKEN environment variable is not set.') {
      return next(createHttpError(500, 'Admin authentication misconfigured.'));
    }

    return next(error);
  }
}

// Placeholder controller stubs for API endpoints
async function registerUser(req, res, next) {
  try {
    const { username, password, publicKey, encryptedPrivateKey } = req.body || {};

    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      typeof publicKey !== 'string' ||
      typeof encryptedPrivateKey !== 'string'
    ) {
      throw createHttpError(
        400,
        'Invalid request body. Expected username, password, publicKey, and encryptedPrivateKey as strings.'
      );
    }

    const normalizedUsername = username.trim();

    if (!normalizedUsername || !password.trim() || !publicKey.trim() || !encryptedPrivateKey.trim()) {
      throw createHttpError(
        400,
        'All fields (username, password, publicKey, encryptedPrivateKey) are required.'
      );
    }

    if (!isPasswordComplex(password)) {
      throw createHttpError(400, 'Password does not meet complexity requirements.');
    }

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

    const newUser = rows[0];

    logger.info(`New user registered: ${newUser.username} (ID: ${newUser.user_id})`);

    return res.status(201).json({
      userId: newUser.user_id,
      username: newUser.username,
      publicKey: newUser.public_key,
      encryptedPrivateKey: newUser.encrypted_private_key,
    });
  } catch (error) {
    logger.warn(
      `Auth failure for user: ${typeof username === 'string' ? username : 'unknown'} - ${error.message}`
    );

    if (error.code === '23505') {
      return next(createHttpError(409, 'Username already exists.'));
    }

    if (!error.statusCode) {
      const sanitizedError = createHttpError(500, 'Failed to register user.');
      sanitizedError.cause = error;
      return next(sanitizedError);
    }

    return next(error);
  }
}

async function loginUser(req, res, next) {
  try {
    const { username, password } = req.body || {};

    if (typeof username !== 'string' || typeof password !== 'string') {
      throw createHttpError(400, 'Invalid request body. Expected username and password as strings.');
    }

    const normalizedUsername = username.trim();

    if (!normalizedUsername || !password.trim()) {
      throw createHttpError(400, 'Username and password are required.');
    }

    const query = `
      SELECT user_id, username, password_hash, public_key, encrypted_private_key
      FROM users
      WHERE username = $1
    `;

    const { rows } = await pool.query(query, [normalizedUsername]);

    const user = rows[0];

    if (!user) {
      throw createHttpError(401, 'Invalid credentials.');
    }

    const isPasswordValid = await argon2.verify(user.password_hash, password);

    if (!isPasswordValid) {
      throw createHttpError(401, 'Invalid credentials.');
    }

    let token;

    try {
      token = signAccessToken({
        sub: user.user_id,
        username: user.username,
      });
    } catch (error) {
      return next(createHttpError(500, 'Authentication service misconfigured.'));
    }

    logger.info(`User login successful: ${user.username} (ID: ${user.user_id})`);

    return res.json({
      token,
      userId: user.user_id,
      username: user.username,
      publicKey: user.public_key,
      encryptedPrivateKey: user.encrypted_private_key,
    });
  } catch (error) {
    logger.warn(
      `Auth failure for user: ${typeof username === 'string' ? username : 'unknown'} - ${error.message}`
    );

    if (!error.statusCode) {
      const sanitizedError = createHttpError(500, 'Failed to log in.');
      sanitizedError.cause = error;
      return next(sanitizedError);
    }

    return next(error);
  }
}

async function getAuthenticatedUser(req, res, next) {
  try {
    if (!req.user) {
      throw createHttpError(500, 'Authentication context missing.');
    }

    return res.json({
      userId: req.user.userId,
      username: req.user.username,
      publicKey: req.user.publicKey,
      encryptedPrivateKey: req.user.encryptedPrivateKey,
    });
  } catch (error) {
    return next(error);
  }
}

async function getPublicConfig(req, res, next) {
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
      throw createHttpError(404, 'Admin configuration not found.');
    }

    return res.json({
      adminPublicKey: config.admin_public_key,
    });
  } catch (error) {
    return next(error);
  }
}

async function listUsers(req, res, next) {
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
    return next(error);
  }
}

async function getUserMessages(req, res, next) {
  try {
    if (!req.user) {
      throw createHttpError(500, 'Authentication context missing.');
    }

    const { userId: currentUserId } = req.user;
    const { userId: targetUserId } = req.params;

    if (!targetUserId || typeof targetUserId !== 'string') {
      throw createHttpError(400, 'Invalid target user id.');
    }

    const userCheck = await pool.query(
      `
        SELECT user_id
        FROM users
        WHERE user_id = $1
      `,
      [targetUserId]
    );

    if (userCheck.rowCount === 0) {
      throw createHttpError(404, 'Target user not found.');
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
    return next(error);
  }
}

async function postMessage(req, res, next) {
  try {
    if (!req.user) {
      throw createHttpError(500, 'Authentication context missing.');
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
      throw createHttpError(
        400,
        'Invalid request body. Expected recipientId, payload_recipient, payload_admin, and nonce as strings.'
      );
    }

    if (
      !recipientId.trim() ||
      !resolvedPayloadRecipient.trim() ||
      !resolvedPayloadAdmin.trim() ||
      !nonce.trim()
    ) {
      throw createHttpError(400, 'All message fields (recipientId, payloads, nonce) are required.');
    }

    if (recipientId === senderId) {
      throw createHttpError(400, 'Cannot send messages to yourself.');
    }

    const recipientResult = await pool.query(
      `
        SELECT user_id, username, public_key
        FROM users
        WHERE user_id = $1
      `,
      [recipientId]
    );

    if (recipientResult.rowCount === 0) {
      throw createHttpError(404, 'Recipient not found.');
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
    return next(error);
  }
}

async function getAllMessagesForAdmin(req, res, next) {
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
    return next(error);
  }
}

// API routes
app.post('/api/v1/auth/register', authLimiter, registerUser);
app.post('/api/v1/auth/login', authLimiter, loginUser);
app.get('/api/v1/auth/me', authenticate, getAuthenticatedUser);
app.get('/api/v1/config', getPublicConfig);
app.get('/api/v1/users', authenticate, listUsers);
app.get('/api/v1/messages/:userId', authenticate, getUserMessages);
app.post('/api/v1/messages', authenticate, postMessage);
app.get('/api/v1/admin/messages', authenticateAdmin, getAllMessagesForAdmin);

// Basic health check endpoint
app.get('/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1 as result');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    error.statusCode = error.statusCode || 503;
    next(error);
  }
});

app.use(errorHandler);

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    logger.info('Server listening', { port: PORT });
  });
}

module.exports = {
  app,
  httpServer,
  io,
  pool,
};

