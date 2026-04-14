const { requireAuth } = require('../_lib/auth');
const { discardDraft } = require('../_lib/state');
const { methodNotAllowed, parseJsonBody, sendJson } = require('../_lib/http');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  const session = requireAuth(req, res);
  if (!session) return;

  let body;
  try {
    body = await parseJsonBody(req);
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }

  try {
    const state = await discardDraft(body || {});
    return sendJson(res, 200, { state });
  } catch (error) {
    return sendJson(res, 500, { error: 'Falha ao descartar rascunho.' });
  }
};
