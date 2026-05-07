const express = require("express");
const router = express.Router();
const { verificarLogin } = require("../middlewares/auth");
const perfilController = require("../controllers/perfilController");

router.get("/perfil", verificarLogin, perfilController.exibirPerfil);
router.post("/perfil/update", verificarLogin, perfilController.atualizarPerfil); 

module.exports = router;