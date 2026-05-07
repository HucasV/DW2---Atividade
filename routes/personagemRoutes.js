// routes/personagemRoutes.js
const express = require("express");
const router = express.Router();
const { verificarLogin } = require("../middlewares/auth");
const personagemController = require("../controllers/personagemController");
const { upload } = require("../config/multer");

router.get("/personagens", verificarLogin, personagemController.listar);
router.get("/personagens/novo", verificarLogin, personagemController.mostrarFormNovo);
router.post("/personagens", verificarLogin, upload.single("imagem"), personagemController.criar);
router.get("/personagens/:id", verificarLogin, personagemController.detalhes);
router.post("/personagens/:id/delete", verificarLogin, personagemController.removerPersonagem);
router.post("/personagens/:id/xp/add", verificarLogin, personagemController.adicionarXP);
router.post("/personagens/:id/xp/remove", verificarLogin, personagemController.removerXP);
router.get("/personagens/:id/dadosJson", verificarLogin, personagemController.dadosJson);
router.post("/personagens/:id/danoJson", verificarLogin, personagemController.danoJson);
router.post("/personagens/:id/curaJson", verificarLogin, personagemController.curaJson);
router.post("/personagens/:id/danoSanidadeJson", verificarLogin, personagemController.danoSanidadeJson);
router.post("/personagens/:id/curaSanidadeJson", verificarLogin, personagemController.curaSanidadeJson);
router.post("/personagens/:id/editarVidaJson", verificarLogin, personagemController.editarVidaJson);
router.post("/personagens/:id/editarSanidadeJson", verificarLogin, personagemController.editarSanidadeJson);
router.post("/personagens/:id/atributo/:tipo/:operacao", verificarLogin, personagemController.aumentarAtributo);

module.exports = router;