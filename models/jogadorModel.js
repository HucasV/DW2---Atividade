
const db = require("../config/db");

async function findById(id) {
  const [rows] = await db.query("SELECT id, nome, email, role, avatar FROM jogador WHERE id = ?", [id]);
  return rows[0];
}

async function findByEmail(email) {
  const [rows] = await db.query("SELECT * FROM jogador WHERE email = ?", [email]);
  return rows[0];
}

async function create({ nome, email, senhaHash, role }) {
  const [result] = await db.query(
    "INSERT INTO jogador (nome, email, senha, role) VALUES (?, ?, ?, ?)",
    [nome, email, senhaHash, role || 'jogador']
  );
  return result.insertId;
}

async function update(id, data) {
  const { nome, role, avatar } = data;
  if (avatar) {
    await db.query("UPDATE jogador SET nome = ?, role = ?, avatar = ? WHERE id = ?", [nome, role, avatar, id]);
  } else {
    await db.query("UPDATE jogador SET nome = ?, role = ? WHERE id = ?", [nome, role, id]);
  }
}

module.exports = { findById, findByEmail, create, update };