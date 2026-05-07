// models/HabilidadeModel.js
const db = require("../config/db");

async function findById(id) {
  const [rows] = await db.query("SELECT * FROM habilidades WHERE id = ?", [id]);
  return rows[0];
}

async function findByPersonagem(id_personagem) {
  const [rows] = await db.query("SELECT * FROM habilidades WHERE id_personagem = ?", [id_personagem]);
  return rows;
}

async function create(data) {
  const { nome, tipo, modo, id_personagem, descricao, tipo_acao, custo_vida, custo_sanidade, efeito, is_upgradeable, dano_fixo } = data;
  const [result] = await db.query(
    `INSERT INTO habilidades 
    (nome, tipo, modo, id_personagem, descricao, tipo_acao, custo_vida, custo_sanidade, efeito, is_upgradeable, dano_fixo) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nome, tipo, modo, id_personagem, descricao, tipo_acao, custo_vida, custo_sanidade, efeito, is_upgradeable, dano_fixo]
  );
  return result.insertId;
}

async function updateLevel(id, novoNivel, custoVida, custoSanidade) {
  await db.query(
    "UPDATE habilidades SET nivel = ?, custo_vida = ?, custo_sanidade = ? WHERE id = ?",
    [novoNivel, custoVida, custoSanidade, id]
  );
}

async function deleteById(id) {
  await db.query("DELETE FROM habilidades WHERE id = ?", [id]);
}

module.exports = { findById, findByPersonagem, create, updateLevel, deleteById };