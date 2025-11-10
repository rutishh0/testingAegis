function normalizeMeta(meta) {
  if (meta instanceof Error) {
    return {
      name: meta.name,
      message: meta.message,
      stack: meta.stack,
    };
  }

  if (meta === undefined) {
    return undefined;
  }

  if (meta === null) {
    return null;
  }

  if (Array.isArray(meta)) {
    return meta.map((item) => normalizeMeta(item));
  }

  if (typeof meta === 'object') {
    return meta;
  }

  return { value: meta };
}

function emit(level, consoleMethod, message, meta) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message: typeof message === 'string' ? message : String(message),
  };

  const normalizedMeta = normalizeMeta(meta);
  if (normalizedMeta !== undefined) {
    entry.meta = normalizedMeta;
  }

  consoleMethod(entry);
}

function info(message, meta) {
  emit('INFO', console.log, message, meta);
}

function warn(message, meta) {
  emit('WARN', console.warn, message, meta);
}

function error(message, meta) {
  emit('ERROR', console.error, message, meta);
}

module.exports = {
  info,
  warn,
  error,
};

