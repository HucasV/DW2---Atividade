// middlewares/auth.js
function verificarLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  next();
}

module.exports = { verificarLogin };