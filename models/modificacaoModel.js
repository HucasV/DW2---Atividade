const db = require("../config/db");

async function listarPorTipo(tipo_item, id_jogador) {
  const [gerais] = await db.query(
    "SELECT * FROM modificacoes_biblioteca WHERE tipo_item = ? AND is_geral = 1",
    [tipo_item]
  );
  const [pessoais] = await db.query(
    "SELECT * FROM modificacoes_biblioteca WHERE tipo_item = ? AND id_jogador = ? AND is_geral = 0",
    [tipo_item, id_jogador]
  );
  return { gerais, pessoais };
}

async function buscarPorId(id) {
  const [rows] = await db.query("SELECT * FROM modificacoes_biblioteca WHERE id = ?", [id]);
  return rows[0];
}

async function criarModificacao(data) {
  const { nome, tipo_item, efeito_descricao, bonus_dano, bonus_ataque, bonus_ca, atributo_adicional, is_geral, id_jogador } = data;
  const [result] = await db.query(
    `INSERT INTO modificacoes_biblioteca 
    (nome, tipo_item, efeito_descricao, bonus_dano, bonus_ataque, bonus_ca, atributo_adicional, is_geral, id_jogador)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nome, tipo_item, efeito_descricao, bonus_dano, bonus_ataque, bonus_ca, atributo_adicional, is_geral, id_jogador]
  );
  return result.insertId;
}

module.exports = { listarPorTipo, buscarPorId, criarModificacao };