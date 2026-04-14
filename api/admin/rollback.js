const { requireAuth } = require('../_lib/auth');
const { rollbackPublished } = require('../_lib/state');
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

  const snapshotId = body.snapshotId;
  if (!snapshotId || typeof snapshotId !== 'string') {
    return sendJson(res, 400, { error: 'snapshotId e obrigatorio.' });
  }

  try {
    const state = await rollbackPublished(snapshotId);
    return sendJson(res, 200, { state });
  } catch (error) {
    return sendJson(res, 404, { error: error.message || 'Snapshot nao encontrado.' });
  }
};
