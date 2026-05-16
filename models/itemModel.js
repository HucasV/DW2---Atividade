const db = require("../config/db");

async function findAllByPersonagem(id_personagem) {
  const [rows] = await db.query("SELECT * FROM inventario WHERE id_personagem = ? ORDER BY tipo, nome", [id_personagem]);
  return rows;
}

async function findById(id, id_personagem) {
  const [rows] = await db.query("SELECT * FROM inventario WHERE id = ? AND id_personagem = ?", [id, id_personagem]);
  return rows[0];
}

async function create(data) {
  const { id_personagem, nome, tipo, descricao, dado_dano, atributo_acerto, bonus_acerto, margem_critico, multiplicador_critico, bonus_ca, usos_maximos, usos_restantes, imagem } = data;
  const [result] = await db.query(
    `INSERT INTO inventario 
    (id_personagem, nome, tipo, descricao, dado_dano, atributo_acerto, bonus_acerto, margem_critico, multiplicador_critico, bonus_ca, usos_maximos, usos_restantes, imagem) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id_personagem, nome, tipo, descricao, dado_dano, atributo_acerto, bonus_acerto, margem_critico, multiplicador_critico, bonus_ca, usos_maximos, usos_restantes, imagem]
  );
  return result.insertId;
}

async function update(id, fields) {
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const setClause = keys.map(k => `${k} = ?`).join(", ");
  await db.query(`UPDATE inventario SET ${setClause} WHERE id = ?`, [...values, id]);
}

async function deleteById(id, id_personagem) {
  await db.query("DELETE FROM inventario WHERE id = ? AND id_personagem = ?", [id, id_personagem]);
}

async function equiparItem(id, equipado) {
  await db.query("UPDATE inventario SET esta_equipado = ? WHERE id = ?", [equipado ? 1 : 0, id]);
}

// ========== BIBLIOTECA DE ITENS ==========
async function listarBiblioteca(id_jogador) {
  const [gerais] = await db.query(
    "SELECT * FROM itens_biblioteca WHERE is_geral = 1"
  );
  const [pessoais] = await db.query(
    "SELECT * FROM itens_biblioteca WHERE id_jogador = ? AND is_geral = 0",
    [id_jogador]
  );
  return { gerais, pessoais };
}

async function buscarPorId(id) {
  const [rows] = await db.query("SELECT * FROM itens_biblioteca WHERE id = ?", [id]);
  return rows[0];
}

async function criarItemBiblioteca(data) {
  const { nome, tipo, descricao, dano, atributo_ataque, margem_critico, multiplicador_critico, bonus_ataque, bonus_ca, usos_maximos, is_geral, id_jogador } = data;
  const [result] = await db.query(
    `INSERT INTO itens_biblioteca 
    (nome, tipo, descricao, dano, atributo_ataque, margem_critico, multiplicador_critico, bonus_ataque, bonus_ca, usos_maximos, is_geral, id_jogador)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nome, tipo, descricao, dano, atributo_ataque, margem_critico, multiplicador_critico, bonus_ataque, bonus_ca, usos_maximos, is_geral, id_jogador]
  );
  return result.insertId;
}

module.exports = {
  findAllByPersonagem,
  findById,
  create,
  update,
  deleteById,
  equiparItem,
  listarBiblioteca,
  buscarPorId,
  criarItemBiblioteca
};