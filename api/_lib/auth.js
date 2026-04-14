const crypto = require('crypto');
const { getRedis } = require('./redis');
const { sendJson } = require('./http');

const AUTH_ATTEMPT_KEY_PREFIX = 'portfolio:auth:attempts:';
const TOKEN_TTL_SECONDS = 8 * 60 * 60;
const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 10 * 60;

const memoryAttempts = new Map();

const getDashboardPassword = () => {
  return process.env.DASHBOARD_PASSWORD || process.env.REACT_APP_DASHBOARD_PASSWORD || '181547615';
};

const getTokenSecret = () => {
  return process.env.AUTH_TOKEN_SECRET || 'CHANGE_THIS_SECRET_IN_VERCEL';
};

const base64UrlEncode = (data) => {
  const input = typeof data === 'string' ? data : JSON.stringify(data);
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const base64UrlDecode = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(normalized + padding, 'base64').toString('utf8');
};

const signToken = (payload) => {
  const header = base64UrlEncode({ alg: 'HS256', typ: 'JWT' });
  const body = base64UrlEncode(payload);
  const unsignedToken = `${header}.${body}`;

  const signature = crypto
    .createHmac('sha256', getTokenSecret())
    .update(unsignedToken)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return `${unsignedToken}.${signature}`;
};

const createSessionToken = (role = 'admin') => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAtSeconds = nowSeconds + TOKEN_TTL_SECONDS;

  return {
    token: signToken({
      sub: 'dashboard-admin',
      role,
      iat: nowSeconds,
      exp: expiresAtSeconds,
    }),
    expiresAt: expiresAtSeconds * 1000,
  };
};

const verifySessionToken = (token) => {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const unsignedToken = `${header}.${payload}`;

  const expectedSignature = crypto
    .createHmac('sha256', getTokenSecret())
    .update(unsignedToken)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  if (signature !== expectedSignature) return null;

  try {
    const decoded = JSON.parse(base64UrlDecode(payload));
    if (!decoded?.exp) return null;
    if (decoded.exp * 1000 <= Date.now()) return null;
    return decoded;
  } catch (error) {
    return null;
  }
};

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return req.socket?.remoteAddress || 'unknown';
};

const getAttemptKey = (ip) => `${AUTH_ATTEMPT_KEY_PREFIX}${ip}`;

const readAttemptState = async (ip) => {
  const redis = getRedis();
  const key = getAttemptKey(ip);

  if (redis) {
    const raw = await redis.get(key);
    if (!raw) return { attempts: 0, lockUntil: 0 };

    try {
      if (typeof raw === 'string') return JSON.parse(raw);
      return raw;
    } catch (error) {
      return { attempts: 0, lockUntil: 0 };
    }
  }

  return memoryAttempts.get(key) || { attempts: 0, lockUntil: 0 };
};

const writeAttemptState = async (ip, state) => {
  const redis = getRedis();
  const key = getAttemptKey(ip);

  if (redis) {
    const ttl = state.lockUntil > Date.now() ? LOCK_SECONDS : 60 * 60;
    await redis.set(key, JSON.stringify(state), { ex: ttl });
    return;
  }

  memoryAttempts.set(key, state);
};

const clearAttemptState = async (ip) => {
  const redis = getRedis();
  const key = getAttemptKey(ip);

  if (redis) {
    await redis.del(key);
    return;
  }

  memoryAttempts.delete(key);
};

const registerFailedAttempt = async (ip) => {
  const current = await readAttemptState(ip);
  const now = Date.now();

  if (current.lockUntil > now) {
    return {
      locked: true,
      lockUntil: current.lockUntil,
      attempts: current.attempts,
      attemptsLeft: 0,
    };
  }

  const attempts = (current.attempts || 0) + 1;

  if (attempts >= MAX_ATTEMPTS) {
    const lockUntil = now + LOCK_SECONDS * 1000;
    await writeAttemptState(ip, { attempts, lockUntil });
    return {
      locked: true,
      lockUntil,
      attempts,
      attemptsLeft: 0,
    };
  }

  await writeAttemptState(ip, { attempts, lockUntil: 0 });
  return {
    locked: false,
    lockUntil: 0,
    attempts,
    attemptsLeft: MAX_ATTEMPTS - attempts,
  };
};

const getLockStatus = async (ip) => {
  const current = await readAttemptState(ip);
  const now = Date.now();

  if (current.lockUntil > now) {
    return {
      locked: true,
      lockUntil: current.lockUntil,
      attemptsLeft: 0,
    };
  }

  if (current.lockUntil && current.lockUntil <= now) {
    await clearAttemptState(ip);
  }

  return {
    locked: false,
    lockUntil: 0,
    attemptsLeft: MAX_ATTEMPTS - (current.attempts || 0),
  };
};

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
};

const requireAuth = (req, res) => {
  const token = getBearerToken(req);
  const session = verifySessionToken(token);

  if (!session) {
    sendJson(res, 401, { error: 'Nao autorizado.' });
    return null;
  }

  return session;
};

module.exports = {
  MAX_ATTEMPTS,
  LOCK_SECONDS,
  getDashboardPassword,
  createSessionToken,
  verifySessionToken,
  getClientIp,
  getLockStatus,
  registerFailedAttempt,
  clearAttemptState,
  requireAuth,
};
