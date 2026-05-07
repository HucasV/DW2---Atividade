// middlewares/userMiddleware.js
const jogadorModel = require("../models/JogadorModel");

async function carregarUsuario(req, res, next) {
  if (req.session.userId) {
    try {
      const usuario = await jogadorModel.findById(req.session.userId);
      res.locals.user = usuario || null;
    } catch (err) {
      console.error("Erro ao buscar usuário:", err);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
}

module.exports = carregarUsuario;