const authService = require("../services/auth.service");

async function signup(req, res, next) {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (name.length > 120 || !/^\S+@\S+\.\S+$/.test(email) || email.length > 255 || password.length < 8 || password.length > 128) {
      return res.status(400).json({
        message: "Enter a name, valid email, and password of at least 8 characters",
      });
    }

    const result = await authService.signup({ name, email, password });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

async function signin(req, res, next) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const result = await authService.signin({ email, password });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

async function googleAuth(req, res, next) {
  try {
    const credential = String(req.body.credential || "");
    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }
    const result = await authService.googleSignIn(credential);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

function me(req, res) {
  return res.json({ user: authService.publicUser(req.user) });
}

async function getOnlineUsers(req, res, next) {
  try {
    const count = await authService.getOnlineUsersCount();
    return res.json({ count });
  } catch (error) {
    return next(error);
  }
}

module.exports = { signup, signin, googleAuth, me, getOnlineUsers };
