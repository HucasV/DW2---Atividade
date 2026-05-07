const express = require("express");
const router = express.Router();

const solicitacaoController = require("../controllers/solicitacaoController");
const verificarLogin = require("../middlewares/auth");

router.get("/", verificarLogin, solicitacaoController.listar);

router.get(
  "/minhas",
  verificarLogin,
  solicitacaoController.paginaSolicitacoes
);

router.post(
  "/:id/aceitar",
  verificarLogin,
  solicitacaoController.aceitar
);

router.post(
  "/:id/recusar",
  verificarLogin,
  solicitacaoController.recusar
);

module.exports = router;