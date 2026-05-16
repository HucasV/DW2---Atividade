const express = require("express");
const router = express.Router();
const { verificarLogin } = require("../middlewares/auth");
const regrasController = require("../controllers/regrasController");

router.get("/regras", verificarLogin, regrasController.exibirRegras);

module.exports = router;