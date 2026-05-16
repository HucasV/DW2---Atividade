
const HabilidadeModel = require("../models/HabilidadeModel");
const PersonagemModel = require("../models/personagemModel");
const { calcularCusto, calcularDano } = require("../utils/rpgHelpers");
const db = require("../config/db");

async function criarJson(req, res) {
  try {
    const { nome, tipo, modo, id_personagem, descricao, tipo_acao, efeito } = req.body;
    const personagem = await PersonagemModel.findByIdAndJogador(id_personagem, req.session.userId);
    if (!personagem) return res.status(403).json({ erro: "Acesso negado" });

    const nivel = Number(personagem.nivel);
    const pontos_totais = 3 + (nivel - 1) * 2;
    const habilidades = await HabilidadeModel.findByPersonagem(id_personagem);
    const usados = habilidades.reduce((t, h) => t + Number(h.nivel || 0), 0);
    if (usados >= pontos_totais) {
      return res.status(400).json({ erro: "Sem pontos disponíveis" });
    }

    const custo = calcularCusto(1, tipo, modo, !!efeito);
    const id_habilidade = await HabilidadeModel.create({
      nome, tipo, modo, id_personagem, descricao, tipo_acao,
      custo_vida: custo.vida, custo_sanidade: custo.sanidade, efeito, is_upgradeable: 1, dano_fixo: null
    });
    const novaHabilidade = {
      id: id_habilidade,
      nome, tipo, modo, nivel: 1,
      valor: calcularDano(1, tipo), descricao, tipo_acao,
      custo_vida: custo.vida, custo_sanidade: custo.sanidade, efeito, is_upgradeable: 1
    };
    const novosUsados = usados + 1;
    const pontos_disponiveis = pontos_totais - novosUsados;
    res.json({ ok: true, habilidade: novaHabilidade, pontos_disponiveis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
}

async function uparJson(req, res) {
  try {
    const { id } = req.params;
    const h = await HabilidadeModel.findById(id);
    if (!h) return res.status(404).json({ erro: "Habilidade não encontrada" });
    const personagem = await PersonagemModel.findByIdAndJogador(h.id_personagem, req.session.userId);
    if (!personagem) return res.status(403).json({ erro: "Acesso negado" });

    const nivel = Number(personagem.nivel);
    const pontos_totais = 3 + (nivel - 1) * 2;
    const habilidades = await HabilidadeModel.findByPersonagem(h.id_personagem);
    const usados = habilidades.reduce((t, hab) => t + Number(hab.nivel || 0), 0);
    if (usados >= pontos_totais) {
      return res.status(400).json({ erro: "Sem pontos disponíveis" });
    }

    const novoNivel = Number(h.nivel) + 1;
    const custo = calcularCusto(novoNivel, h.tipo, h.modo, !!h.efeito);
    await HabilidadeModel.updateLevel(id, novoNivel, custo.vida, custo.sanidade);
    const habAtualizada = await HabilidadeModel.findById(id);
    const novoValor = calcularDano(Number(habAtualizada.nivel), habAtualizada.tipo);
    const novosUsados = usados + 1;
    const pontos_disponiveis = pontos_totais - novosUsados;
    res.json({
      ok: true,
      habilidade: { ...habAtualizada, valor: novoValor },
      pontos_disponiveis
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
}

async function diminuirJson(req, res) {
  try {
    const { id } = req.params;
    const h = await HabilidadeModel.findById(id);
    if (!h) return res.status(404).json({ erro: "Habilidade não encontrada" });
    const personagem = await PersonagemModel.findByIdAndJogador(h.id_personagem, req.session.userId);
    if (!personagem) return res.status(403).json({ erro: "Acesso negado" });
    if (h.nivel <= 1) return res.status(400).json({ erro: "Nível mínimo já atingido" });

    const novoNivel = Number(h.nivel) - 1;
    const custo = calcularCusto(novoNivel, h.tipo, h.modo, !!h.efeito);
    await HabilidadeModel.updateLevel(id, novoNivel, custo.vida, custo.sanidade);
    const habAtualizada = await HabilidadeModel.findById(id);
    const novoValor = calcularDano(Number(habAtualizada.nivel), habAtualizada.tipo);

    const nivelPersonagem = Number(personagem.nivel);
    const pontos_totais = 3 + (nivelPersonagem - 1) * 2;
    const habilidades = await HabilidadeModel.findByPersonagem(h.id_personagem);
    const usados = habilidades.reduce((t, hab) => t + Number(hab.nivel || 0), 0);
    const pontos_disponiveis = pontos_totais - usados;
    res.json({ ok: true, habilidade: { ...habAtualizada, valor: novoValor }, pontos_disponiveis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
}

async function deletarJson(req, res) {
  try {
    const { id } = req.params;
    const h = await HabilidadeModel.findById(id);
    if (!h) return res.status(404).json({ erro: "Habilidade não encontrada" });
    const personagem = await PersonagemModel.findByIdAndJogador(h.id_personagem, req.session.userId);
    if (!personagem) return res.status(403).json({ erro: "Acesso negado" });

    await HabilidadeModel.deleteById(id);
    const nivel = Number(personagem.nivel);
    const pontos_totais = 3 + (nivel - 1) * 2;
    const habilidadesRestantes = await HabilidadeModel.findByPersonagem(h.id_personagem);
    const usados = habilidadesRestantes.reduce((t, hab) => t + Number(hab.nivel || 0), 0);
    const pontos_disponiveis = pontos_totais - usados;
    res.json({ ok: true, pontos_disponiveis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
}

async function biblioteca(req, res) {
  try {
    const [gerais] = await db.query(`
      SELECT id, nome, tipo, modo, descricao, tipo_acao, efeito, dano_base 
      FROM habilidades_biblioteca 
      WHERE is_geral = 1
    `);
    const [pessoais] = await db.query(`
      SELECT id, nome, tipo, modo, descricao, tipo_acao, efeito, dano_base 
      FROM habilidades_biblioteca 
      WHERE id_jogador = ? AND is_geral = 0
    `, [req.session.userId]);
    res.json({ gerais, pessoais });
  } catch (err) {
    console.error("Erro em biblioteca:", err);
    res.status(500).json({ erro: err.message });
  }
}

async function copiarJson(req, res) {
  try {
    const { id_habilidade_biblioteca, id_personagem } = req.body;
    const [[habilidadeBase]] = await db.query(
      "SELECT * FROM habilidades_biblioteca WHERE id = ?",
      [id_habilidade_biblioteca]
    );
    if (!habilidadeBase) return res.status(404).json({ erro: "Habilidade não encontrada na biblioteca" });
    if (habilidadeBase.is_geral && habilidadeBase.id_jogador !== null && habilidadeBase.id_jogador !== req.session.userId) {
      return res.status(403).json({ erro: "Acesso negado" });
    }
    const personagem = await PersonagemModel.findByIdAndJogador(id_personagem, req.session.userId);
    if (!personagem) return res.status(404).json({ erro: "Personagem não encontrado" });

    const nivel = Number(personagem.nivel);
    const pontos_totais = 3 + (nivel - 1) * 2;
    const habilidadesAtuais = await HabilidadeModel.findByPersonagem(id_personagem);
    const usados = habilidadesAtuais.reduce((t, h) => t + Number(h.nivel || 0), 0);
    if (usados >= pontos_totais) {
      return res.status(400).json({ erro: "Sem pontos disponíveis para adicionar habilidade" });
    }

    const isUpgradeable = habilidadeBase.is_geral ? 0 : (habilidadeBase.is_upgradeable_original ? 1 : 0);
    const danoFixo = habilidadeBase.is_geral ? (habilidadeBase.dano_base || calcularDano(1, habilidadeBase.tipo)) : null;

    const id_habilidade = await HabilidadeModel.create({
      nome: habilidadeBase.nome,
      tipo: habilidadeBase.tipo,
      modo: habilidadeBase.modo,
      id_personagem,
      descricao: habilidadeBase.descricao || null,
      tipo_acao: habilidadeBase.tipo_acao || 'ativa',
      custo_vida: 0,
      custo_sanidade: 0,
      efeito: habilidadeBase.efeito || null,
      is_upgradeable: isUpgradeable,
      dano_fixo: danoFixo
    });
    const valorExibido = danoFixo || calcularDano(1, habilidadeBase.tipo);
    const novaHabilidade = {
      id: id_habilidade,
      nome: habilidadeBase.nome,
      tipo: habilidadeBase.tipo,
      modo: habilidadeBase.modo,
      nivel: 1,
      valor: valorExibido,
      descricao: habilidadeBase.descricao,
      tipo_acao: habilidadeBase.tipo_acao || 'ativa',
      custo_vida: 0,
      custo_sanidade: 0,
      efeito: habilidadeBase.efeito,
      is_upgradeable: isUpgradeable
    };
    const novosUsados = usados + 1;
    const novosPontos = pontos_totais - novosUsados;
    res.json({ ok: true, habilidade: novaHabilidade, pontos_disponiveis: novosPontos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
}

async function salvarNaBiblioteca(req, res) {
  try {
    const { id_habilidade } = req.body;
    const [[habilidade]] = await db.query("SELECT * FROM habilidades WHERE id = ?", [id_habilidade]);
    if (!habilidade) return res.status(404).json({ erro: "Habilidade não encontrada" });
    const [[personagem]] = await db.query("SELECT id_jogador FROM personagens WHERE id = ?", [habilidade.id_personagem]);
    if (!personagem || personagem.id_jogador !== req.session.userId) {
      return res.status(403).json({ erro: "Acesso negado" });
    }
    const [existe] = await db.query(
      "SELECT id FROM habilidades_biblioteca WHERE nome = ? AND id_jogador = ?",
      [habilidade.nome, req.session.userId]
    );
    if (existe.length > 0) {
      return res.status(400).json({ erro: "Essa habilidade já está na sua biblioteca" });
    }
    const danoBase = habilidade.dano_fixo || habilidade.valor || calcularDano(habilidade.nivel, habilidade.tipo);
    await db.query(
      `INSERT INTO habilidades_biblioteca 
      (nome, tipo, modo, descricao, tipo_acao, efeito, id_jogador, is_geral, nivel_base, 
       custo_vida_base, custo_sanidade_base, dano_base, is_upgradeable_original) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        habilidade.nome, habilidade.tipo, habilidade.modo, habilidade.descricao || null,
        habilidade.tipo_acao || 'ativa', habilidade.efeito || null, req.session.userId, 0,
        1, habilidade.custo_vida || 0, habilidade.custo_sanidade || 0, danoBase, habilidade.is_upgradeable
      ]
    );
    res.json({ ok: true, mensagem: "Habilidade salva na biblioteca!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
}

async function deletarBiblioteca(req, res) {
  try {
    const { id_habilidade } = req.body;
    const [habilidade] = await db.query(
      "SELECT id, id_jogador, is_geral FROM habilidades_biblioteca WHERE id = ?",
      [id_habilidade]
    );
    if (habilidade.length === 0) return res.status(404).json({ erro: "Habilidade não encontrada" });
    if (habilidade[0].is_geral === 1) return res.status(403).json({ erro: "Não é possível excluir habilidades gerais" });
    if (habilidade[0].id_jogador !== req.session.userId) return res.status(403).json({ erro: "Acesso negado" });
    await db.query("DELETE FROM habilidades_biblioteca WHERE id = ?", [id_habilidade]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
}

async function listarDivindades(req, res) {
  try {
    const [habilidades] = await db.query(
      "SELECT * FROM habilidades_divindades ORDER BY divindade, nivel"
    );
    const grouped = {};
    habilidades.forEach(h => {
      if (!grouped[h.divindade]) grouped[h.divindade] = [];
      grouped[h.divindade].push({
        id: h.id,
        nome: h.nome,
        nivel: h.nivel,
        dano: h.dano,
        tipo: h.tipo,
        descricao: h.descricao,
        efeito: h.efeito
      });
    });
    res.json({ divindades: grouped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
}
async function copiarDivindade(req, res) {
  try {
    const { id_habilidade_divindade, id_personagem } = req.body;
    const [[habDiv]] = await db.query(
      "SELECT * FROM habilidades_divindades WHERE id = ?",
      [id_habilidade_divindade]
    );
    if (!habDiv) return res.status(404).json({ erro: "Habilidade não encontrada" });

    const [[personagem]] = await db.query(
      "SELECT vida_atual, sanidade_atual, nivel FROM personagens WHERE id = ? AND id_jogador = ?",
      [id_personagem, req.session.userId]
    );
    if (!personagem) return res.status(404).json({ erro: "Personagem não encontrado" });

    
    const custoVida = Math.floor(personagem.vida_atual / 2);
    const custoSanidade = Math.floor(personagem.sanidade_atual / 2);

    
    const nivel = Number(personagem.nivel);
    const pontosTotais = 3 + (nivel - 1) * 2;
    const [habilidadesAtuais] = await db.query(
      "SELECT * FROM habilidades WHERE id_personagem = ?",
      [id_personagem]
    );
    const usados = habilidadesAtuais.reduce((t, h) => t + Number(h.nivel || 0), 0);
    if (usados >= pontosTotais) {
      return res.status(400).json({ erro: "Sem pontos disponíveis para adicionar habilidade" });
    }

    
    const [result] = await db.query(
      `INSERT INTO habilidades 
      (nome, tipo, modo, id_personagem, descricao, tipo_acao, custo_vida, custo_sanidade, efeito, is_upgradeable, dano_fixo) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        habDiv.nome,
        habDiv.tipo,
        'alvo_unico',             
        id_personagem,
        habDiv.descricao,
        'ativa',                    
        custoVida,
        custoSanidade,
        habDiv.efeito,
        0,                          
        habDiv.dano                
      ]
    );

    const novaHabilidade = {
      id: result.insertId,
      nome: habDiv.nome,
      tipo: habDiv.tipo,
      modo: 'alvo_unico',
      nivel: 1,
      valor: habDiv.dano,
      descricao: habDiv.descricao,
      tipo_acao: 'ativa',
      custo_vida: custoVida,
      custo_sanidade: custoSanidade,
      efeito: habDiv.efeito,
      is_upgradeable: 0
    };

    const novosUsados = usados + 1;
    const pontosDisponiveis = pontosTotais - novosUsados;
    console.log("Recebido:", req.body);
console.log("ID divindade:", id_habilidade_divindade, "ID personagem:", id_personagem);
console.log("Personagem encontrado?", personagem)
    res.json({ ok: true, habilidade: novaHabilidade, pontos_disponiveis: pontosDisponiveis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
}


module.exports = {
  criarJson,
  uparJson,
  diminuirJson,
  deletarJson,
  biblioteca,
  copiarJson,
  salvarNaBiblioteca,
  deletarBiblioteca,
  listarDivindades,
  copiarDivindade
};