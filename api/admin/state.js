const { requireAuth } = require('../_lib/auth');
const { getAdminPortfolioState } = require('../_lib/state');
const { methodNotAllowed, sendJson } = require('../_lib/http');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const session = requireAuth(req, res);
  if (!session) return;

  try {
    const state = await getAdminPortfolioState();
    return sendJson(res, 200, { state });
  } catch (error) {
    return sendJson(res, 500, { error: 'Falha ao carregar estado administrativo.' });
  }
};
