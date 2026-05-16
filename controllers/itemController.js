const ItemModel = require("../models/itemModel");
const PersonagemModel = require("../models/personagemModel");
const { rollDice, rollD20 } = require("../utils/diceRoller");

async function listarInventario(req, res) {
  const id_personagem = req.params.id;
  const itens = await ItemModel.findAllByPersonagem(id_personagem);
  res.json(itens);
}

async function criarItem(req, res) {
  try {
    const { id_personagem } = req.params;
    const personagem = await PersonagemModel.findByIdAndJogador(id_personagem, req.session.userId);
    if (!personagem) return res.status(403).json({ erro: "Acesso negado" });

    const { nome, tipo, descricao, dado_dano, atributo_acerto, bonus_acerto, margem_critico, multiplicador_critico, bonus_ca, usos_maximos, imagem } = req.body;
    
    const usos_restantes = usos_maximos ? usos_maximos : null;
    
    const id_item = await ItemModel.create({
      id_personagem, nome, tipo, descricao, dado_dano, atributo_acerto, bonus_acerto, margem_critico, multiplicador_critico, bonus_ca, usos_maximos, usos_restantes, imagem
    });
    
    res.json({ ok: true, id: id_item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao criar item" });
  }
}

async function deletarItem(req, res) {
  try {
    const { id_personagem, id_item } = req.params;
    await ItemModel.deleteById(id_item, id_personagem);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao deletar item" });
  }
}

async function equiparItem(req, res) {
  try {
    const { id_personagem, id_item } = req.params;
    const { equipado } = req.body;
    // Validação: só pode equipar 1 arma e 1 proteção? (opcional)
    await ItemModel.equiparItem(id_item, equipado);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao equipar item" });
  }
}

async function usarItem(req, res) {
  try {
    const { id_personagem, id_item } = req.params;
    const item = await ItemModel.findById(id_item, id_personagem);
    if (!item) return res.status(404).json({ erro: "Item não encontrado" });
    
    // Se for anomalo, verificar usos
    if (item.tipo === 'anomalo' && item.usos_restantes !== null && item.usos_restantes <= 0) {
      return res.status(400).json({ erro: "Este item não tem mais usos" });
    }
    
    let resultado = null;
    let acerto = null;
    
    if (item.tipo === 'arma') {
      // Rolar acerto: 1d20 + atributo (força/agilidade) + bonus_acerto
      const personagem = await PersonagemModel.findByIdAndJogador(id_personagem, req.session.userId);
      const atributoValor = item.atributo_acerto === 'forca' ? personagem.forca : personagem.agilidade;
      const modificador = atributoValor + (item.bonus_acerto || 0);
      const rolagemAcerto = rollD20(modificador);
      acerto = rolagemAcerto;
      
      // Se acertou (margem de critico? Vamos considerar que acerta se rolagem crua >= 1, mas critico se rolagem crua >= margem_critico)
      const ehCritico = rolagemAcerto.roll >= (item.margem_critico || 20);
      
      // Rolar dano
      let danoRoll = { total: 0, rolls: [] };
      if (item.dado_dano) {
        danoRoll = rollDice(item.dado_dano);
        if (ehCritico) {
          // Multiplica o dano pelo multiplicador de critico (ex: 2x, 3x)
          const multiplicador = item.multiplicador_critico || 2;
          danoRoll.total = danoRoll.total * multiplicador;
          // Opcional: também multiplicar cada dado individualmente para exibição
        }
      }
      
      resultado = { acerto: rolagemAcerto, dano: danoRoll, ehCritico };
    } else {
      // Para outros tipos, apenas aplica efeito (cura, bônus, etc.) - podemos expandir
      resultado = { mensagem: "Item usado com sucesso" };
    }
    
    // Se for anomalo, reduz usos
    if (item.tipo === 'anomalo' && item.usos_restantes !== null) {
      const novosUsos = item.usos_restantes - 1;
      await ItemModel.update(id_item, { usos_restantes: novosUsos });
      resultado.usos_restantes = novosUsos;
    }
    
    res.json({ ok: true, item, resultado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao usar item" });
  }
}

async function listarModificacoes(req, res) {
  const { tipo_item } = req.params;
  const modificacoes = await ItemModel.getModificacoesBase(tipo_item);
  res.json(modificacoes);
}

async function adicionarModificacao(req, res) {
  try {
    const { id_personagem, id_item } = req.params;
    const { id_modificacao } = req.body;
    await ItemModel.addModificacao(id_item, id_modificacao);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao adicionar modificação" });
  }
}

async function removerModificacao(req, res) {
  try {
    const { id_personagem, id_item } = req.params;
    const { id_modificacao } = req.body;
    await ItemModel.removeModificacao(id_item, id_modificacao);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao remover modificação" });
  }
}

module.exports = { listarInventario, criarItem, deletarItem, equiparItem, usarItem, listarModificacoes, adicionarModificacao, removerModificacao };