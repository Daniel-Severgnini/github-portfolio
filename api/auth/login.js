const {
  MAX_ATTEMPTS,
  LOCK_SECONDS,
  clearAttemptState,
  createSessionToken,
  getClientIp,
  getDashboardPassword,
  getLockStatus,
  registerFailedAttempt,
} = require('../_lib/auth');
const { methodNotAllowed, parseJsonBody, sendJson } = require('../_lib/http');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return methodNotAllowed(res, ['POST']);
    }

    const ip = getClientIp(req);
    const lockStatus = await getLockStatus(ip);
    if (lockStatus.locked) {
      return sendJson(res, 429, {
        error: 'Login temporariamente bloqueado.',
        lockUntil: lockStatus.lockUntil,
        attemptsLeft: 0,
      });
    }

    let body;
    try {
      body = await parseJsonBody(req);
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }

    const password = String(body.password || '');
    if (password !== getDashboardPassword()) {
      const failedAttempt = await registerFailedAttempt(ip);
      if (failedAttempt.locked) {
        return sendJson(res, 429, {
          error: `Muitas tentativas incorretas. Bloqueado por ${LOCK_SECONDS / 60} minutos.`,
          lockUntil: failedAttempt.lockUntil,
          attemptsLeft: 0,
        });
      }

      return sendJson(res, 401, {
        error: 'Senha incorreta.',
        attemptsLeft: failedAttempt.attemptsLeft,
        maxAttempts: MAX_ATTEMPTS,
      });
    }

    await clearAttemptState(ip);
    const session = createSessionToken('admin');

    return sendJson(res, 200, {
      token: session.token,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    return sendJson(res, 500, { error: 'Falha ao autenticar no servidor.' });
  }
};
