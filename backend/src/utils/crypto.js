const crypto = require("crypto");
const config = require("../config/env");

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

function passwordMatches(password, stored) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function issueToken(userId) {
  const payload = base64Url(
    JSON.stringify({
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    })
  );
  const signature = crypto.createHmac("sha256", config.authTokenSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyToken(token) {
  const [payload, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", config.authTokenSecret).update(payload || "").digest("base64url");
  const signatureBuffer = Buffer.from(signature || "");
  const expectedBuffer = Buffer.from(expected);
  if (
    !payload ||
    !signature ||
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new Error("Invalid session");
  }
  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (!data.sub || data.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Expired session");
  }
  return data.sub;
}

module.exports = { hashPassword, passwordMatches, issueToken, verifyToken };
