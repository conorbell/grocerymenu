const authController = {};

const TOKEN = 'poN&p75';

const readCookie = (req, name) => {
  const header = req.headers.cookie || '';
  const match = header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
};

authController.verifyUser = (req, res, next) => {
  const { user, pass } = req.body || {};
  if (
    (user === 'chiquita banana' && pass === 'chiquitabanana') ||
    (user === 'c' && pass === 'c')
  ) {
    return next();
  }
  return res.status(401).json({ message: 'Wrong username or password' });
};

authController.setCookie = (req, res, next) => {
  res.cookie('token', TOKEN, { httpOnly: true, sameSite: 'lax' });
  return next();
};

authController.verifyCookie = (req, res, next) => {
  if (readCookie(req, 'token') === TOKEN) return next();
  return res.status(401).json({ message: 'Please log in first' });
};

module.exports = authController;
