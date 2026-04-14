const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const methodNotAllowed = (res, allowedMethods) => {
  res.setHeader('Allow', allowedMethods.join(', '));
  return sendJson(res, 405, { error: 'Metodo nao permitido.' });
};

const parseJsonBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error('JSON invalido no corpo da requisicao.');
  }
};

module.exports = {
  sendJson,
  methodNotAllowed,
  parseJsonBody,
};
