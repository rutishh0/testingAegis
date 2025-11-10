const logger = require('./logger');

function errorHandler(err, req, res, next) {
  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message =
    typeof err.message === 'string' && err.message.trim().length > 0
      ? err.message
      : 'An unexpected error occurred.';

  logger.error(message, err);

  res.status(statusCode).json({
    error: true,
    message,
  });
}

module.exports = errorHandler;

