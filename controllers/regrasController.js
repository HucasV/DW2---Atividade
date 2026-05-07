// controllers/regrasController.js
function exibirRegras(req, res) {
  const regras = [
    "Sistema baseado em 1d20 + atributo",
    "Vitalidade = 10 + Vigor",
    "Testes de imunidade evitam mutação"
  ];
  res.render("regras", { regras });
}

module.exports = { exibirRegras };