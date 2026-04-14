const { getPublicPortfolioState } = require('../_lib/state');
const { methodNotAllowed, sendJson } = require('../_lib/http');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  try {
    const published = await getPublicPortfolioState();
    return sendJson(res, 200, { published });
  } catch (error) {
    return sendJson(res, 500, { error: 'Falha ao carregar estado publico.' });
  }
};
