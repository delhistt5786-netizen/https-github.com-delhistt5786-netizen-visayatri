const jwt = require('jsonwebtoken');

/**
 * Short-lived signed file tokens (section 40: "signed/temporary document
 * URLs"). Authorization is checked once, at mint time, by whichever
 * authenticated route calls signFileToken — the token itself is the
 * credential after that, so the actual file-serving route (GET
 * /api/files/serve/:token) can stay unauthenticated but still safe: it's
 * unguessable (HMAC-signed) and expires quickly.
 */
const FILE_TOKEN_TTL_SECONDS = 10 * 60; // 10 minutes — long enough to load a page, short enough to limit exposure if a URL leaks

function signFileToken(absolutePath) {
  return jwt.sign({ p: absolutePath }, process.env.JWT_SECRET, { expiresIn: FILE_TOKEN_TTL_SECONDS });
}

function verifyFileToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded.p;
}

module.exports = { signFileToken, verifyFileToken, FILE_TOKEN_TTL_SECONDS };
