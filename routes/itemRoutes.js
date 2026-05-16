const express = require("express");
const router = express.Router();
const { verificarLogin } = require("../middlewares/auth");
const itemController = require("../controllers/itemController");

router.get("/personagens/:id_personagem/inventario", verificarLogin, itemController.listarInventario);
router.post("/personagens/:id_personagem/inventario/criar", verificarLogin, itemController.criarItem);
router.delete("/personagens/:id_personagem/inventario/:id_item", verificarLogin, itemController.deletarItem);
router.put("/personagens/:id_personagem/inventario/:id_item/equipar", verificarLogin, itemController.equiparItem);
router.post("/personagens/:id_personagem/inventario/:id_item/usar", verificarLogin, itemController.usarItem);
router.get("/modificacoes/:tipo_item", verificarLogin, itemController.listarModificacoes);
router.post("/personagens/:id_personagem/inventario/:id_item/modificacoes", verificarLogin, itemController.adicionarModificacao);
router.delete("/personagens/:id_personagem/inventario/:id_item/modificacoes/:id_modificacao", verificarLogin, itemController.removerModificacao);

module.exports = router;