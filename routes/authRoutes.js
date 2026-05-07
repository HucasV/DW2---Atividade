// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verificarLogin } = require("../middlewares/auth");

router.get("/cadastro", authController.exibirCadastro);
router.post("/cadastro", authController.cadastrar);
router.get("/login", authController.exibirLogin);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.get("/", verificarLogin, authController.home);

module.exports = router;