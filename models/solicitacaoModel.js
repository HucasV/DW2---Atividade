// models/SolicitacaoModel.js
const db = require("../config/db");

async function create(id_campanha, id_jogador) {
  const [result] = await db.query(
    "INSERT INTO solicitacoes_campanha (id_campanha, id_jogador) VALUES (?, ?)",
    [id_campanha, id_jogador]
  );
  return result.insertId;
}

async function findPendentesByJogador(id_jogador) {
  const [rows] = await db.query(`
    SELECT s.id, c.nome as campanha_nome, c.id as campanha_id
    FROM solicitacoes_campanha s
    JOIN campanhas c ON s.id_campanha = c.id
    WHERE s.id_jogador = ? AND s.status = 'pendente'
  `, [id_jogador]);
  return rows;
}

async function existsPendente(id_campanha, id_jogador) {
  const [rows] = await db.query(
    "SELECT id FROM solicitacoes_campanha WHERE id_campanha = ? AND id_jogador = ? AND status = 'pendente'",
    [id_campanha, id_jogador]
  );
  return rows.length > 0;
}

async function aceitar(id) {
  await db.query("UPDATE solicitacoes_campanha SET status = 'aceita' WHERE id = ?", [id]);
}

async function recusar(id) {
  await db.query("UPDATE solicitacoes_campanha SET status = 'recusada' WHERE id = ?", [id]);
}

async function findById(id) {
  const [rows] = await db.query("SELECT id_campanha, id_jogador FROM solicitacoes_campanha WHERE id = ? AND status = 'pendente'", [id]);
  return rows[0];
}

module.exports = { create, findPendentesByJogador, existsPendente, aceitar, recusar, findById };