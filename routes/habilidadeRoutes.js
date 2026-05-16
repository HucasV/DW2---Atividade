const express = require("express");
const router = express.Router();
const { verificarLogin } = require("../middlewares/auth");
const habilidadeController = require("../controllers/habilidadeController");

router.post("/habilidades/criarJson", verificarLogin, habilidadeController.criarJson);
router.post("/habilidades/:id/uparJson", verificarLogin, habilidadeController.uparJson);
router.post("/habilidades/:id/diminuirJson", verificarLogin, habilidadeController.diminuirJson);
router.post("/habilidades/:id/deletarJson", verificarLogin, habilidadeController.deletarJson);
router.get("/habilidades/biblioteca", verificarLogin, habilidadeController.biblioteca);
router.post("/habilidades/copiarJson", verificarLogin, habilidadeController.copiarJson);
router.post("/habilidades/salvarNaBiblioteca", verificarLogin, habilidadeController.salvarNaBiblioteca);
router.post("/habilidades/biblioteca/deletar", verificarLogin, habilidadeController.deletarBiblioteca);
router.get("/habilidades/divindades", verificarLogin, habilidadeController.listarDivindades);
router.post("/habilidades/copiarDivindade", verificarLogin, habilidadeController.copiarDivindade);
module.exports = router;