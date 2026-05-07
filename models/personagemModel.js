// models/PersonagemModel.js
const db = require("../config/db");

async function findByIdAndJogador(id, id_jogador) {
  const [rows] = await db.query(
    "SELECT * FROM personagens WHERE id = ? AND id_jogador = ?",
    [id, id_jogador]
  );
  return rows[0];
}

async function findAllByJogador(id_jogador) {
  const [rows] = await db.query(
    "SELECT * FROM personagens WHERE id_jogador = ?",
    [id_jogador]
  );
  return rows;
}

async function create(data) {
  const {
    nome, nivel, descricao, forca, agilidade, constituicao, intelecto, atencao, estabilidade,
    vida_atual, sanidade_atual, id_jogador, imagem
  } = data;
  const [result] = await db.query(
    `INSERT INTO personagens 
    (nome, nivel, descricao, forca, agilidade, constituicao, intelecto, atencao, estabilidade, 
     vida_atual, sanidade_atual, id_jogador, imagem)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nome, nivel, descricao, forca, agilidade, constituicao, intelecto, atencao, estabilidade,
     vida_atual, sanidade_atual, id_jogador, imagem]
  );
  return result.insertId;
}

async function update(id, fields) {
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const setClause = keys.map(k => `${k} = ?`).join(", ");
  await db.query(`UPDATE personagens SET ${setClause} WHERE id = ?`, [...values, id]);
}

async function deleteById(id, id_jogador) {
  await db.query("DELETE FROM personagens WHERE id = ? AND id_jogador = ?", [id, id_jogador]);
}

module.exports = { findByIdAndJogador, findAllByJogador, create, update, deleteById };