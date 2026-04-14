const { verifySessionToken } = require('../_lib/auth');
const { methodNotAllowed, sendJson } = require('../_lib/http');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return sendJson(res, 401, { valid: false, error: 'Token ausente.' });
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return sendJson(res, 401, { valid: false, error: 'Token invalido.' });
  }

  const session = verifySessionToken(token);
  if (!session) {
    return sendJson(res, 401, { valid: false, error: 'Sessao invalida ou expirada.' });
  }

  return sendJson(res, 200, {
    valid: true,
    expiresAt: session.exp * 1000,
    role: session.role || 'admin',
  });
};
