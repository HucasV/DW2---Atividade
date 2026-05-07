function verificarRole(role) {
  return (req, res, next) => {
    if (req.session.userRole !== role) {
      return res.status(403).send("Acesso negado");
    }

    next();
  };
}

module.exports = verificarRole;