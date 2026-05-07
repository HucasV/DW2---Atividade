// controllers/personagemController.js
const PersonagemModel = require("../models/PersonagemModel");
const HabilidadeModel = require("../models/HabilidadeModel");
const { calcularPontosAtributoTotais, calcularPontosGastos, calcularDano } = require("../utils/rpgHelpers");

async function listar(req, res) {
  const personagens = await PersonagemModel.findAllByJogador(req.session.userId);
  res.render("personagens", { personagens });
}

async function mostrarFormNovo(req, res) {
  res.render("novoPersonagem", {
    pontos_disponiveis_atributo: 21,
    pontos_totais_atributo: 21,
    nivel: 1
  });
}

async function criar(req, res) {
  try {
    const nivel = 1;
    const {
      nome, descricao,
      forca, agilidade, constituicao,
      intelecto, atencao, estabilidade
    } = req.body;

    const forcaNum = Math.max(1, Number(forca) || 1);
    const agilidadeNum = Math.max(1, Number(agilidade) || 1);
    const constituicaoNum = Math.max(1, Number(constituicao) || 1);
    const intelectoNum = Math.max(1, Number(intelecto) || 1);
    const atencaoNum = Math.max(1, Number(atencao) || 1);
    const estabilidadeNum = Math.max(1, Number(estabilidade) || 1);

    const pontosTotais = 21;
    const pontosGastos = (forcaNum-1)+(agilidadeNum-1)+(constituicaoNum-1)+(intelectoNum-1)+(atencaoNum-1)+(estabilidadeNum-1);
    if (pontosGastos > pontosTotais) {
      return res.status(400).send("Pontos de atributo excedidos. Máximo é 21.");
    }

    const vidaMax = 10 + constituicaoNum + forcaNum + (nivel * 6);
    const sanidadeMax = 5 + estabilidadeNum + (nivel * 3);
    const imagem = req.file ? req.file.filename : null;

    await PersonagemModel.create({
      nome, nivel, descricao,
      forca: forcaNum, agilidade: agilidadeNum, constituicao: constituicaoNum,
      intelecto: intelectoNum, atencao: atencaoNum, estabilidade: estabilidadeNum,
      vida_atual: vidaMax, sanidade_atual: sanidadeMax,
      id_jogador: req.session.userId, imagem
    });
    res.redirect("/personagens");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro interno ao criar personagem");
  }
}

async function detalhes(req, res) {
  const id = req.params.id;
  const personagem = await PersonagemModel.findByIdAndJogador(id, req.session.userId);
  if (!personagem) return res.send("Personagem não encontrado");

  const nivel = Number(personagem.nivel);
  const forca = Number(personagem.forca) || 1;
  const agilidade = Number(personagem.agilidade) || 1;
  const constituicao = Number(personagem.constituicao) || 1;
  const intelecto = Number(personagem.intelecto) || 1;
  const atencao = Number(personagem.atencao) || 1;
  const estabilidade = Number(personagem.estabilidade) || 1;

  const pontos_totais_atributo = calcularPontosAtributoTotais(nivel);
  const pontos_gastos_atributo = calcularPontosGastos(forca, agilidade, constituicao, intelecto, atencao, estabilidade);
  const pontos_disponiveis_atributo = pontos_totais_atributo - pontos_gastos_atributo;

  let vida_max = 10 + constituicao + forca + (nivel * 6);
  if (personagem.vida_max_custom && personagem.vida_max_custom > 0) vida_max = personagem.vida_max_custom;
  let sanidade_max = 5 + estabilidade + (nivel * 3);
  if (personagem.sanidade_max_custom && personagem.sanidade_max_custom > 0) sanidade_max = personagem.sanidade_max_custom;

  const habilidades = await HabilidadeModel.findByPersonagem(id);
  const habilidadesComValor = habilidades.map(h => ({
    ...h,
    valor: h.dano_fixo || calcularDano(Number(h.nivel), h.tipo)
  }));

  const pontos_totais_habs = 3 + (nivel - 1) * 2;
  const pontos_usados = habilidades.reduce((t, h) => t + Number(h.nivel || 0), 0);
  const pontos_disponiveis_habs = pontos_totais_habs - pontos_usados;

  res.render("detalhesPersonagem", {
    personagem,
    vida_max,
    sanidade_max,
    habilidades: habilidadesComValor,
    pontos_disponiveis: pontos_disponiveis_habs,
    pontos_disponiveis_atributo,
    pontos_totais_atributo,
    pontos_gastos_atributo
  });
}

async function adicionarXP(req, res) {
  const { id } = req.params;
  const xp = Number(req.body.xp || 0);
  const p = await PersonagemModel.findByIdAndJogador(id, req.session.userId);
  if (!p) return res.send("Personagem não encontrado");

  const novoXP = (p.xp || 0) + xp;
  const novoNivel = Math.floor(novoXP / 100);
  await PersonagemModel.update(id, { xp: novoXP, nivel: novoNivel });

  if (novoNivel !== p.nivel) {
    const forca = Number(p.forca) || 0;
    const constituicao = Number(p.constituicao) || 0;
    const estabilidade = Number(p.estabilidade) || 0;
    let vida_max = 10 + constituicao + forca + (novoNivel * 6);
    if (p.vida_max_custom && !isNaN(p.vida_max_custom) && p.vida_max_custom > 0) vida_max = p.vida_max_custom;
    const sanidade_max = 5 + estabilidade + (novoNivel * 3);
    await PersonagemModel.update(id, { vida_atual: vida_max, sanidade_atual: sanidade_max });
  }
  res.redirect(`/personagens/${id}`);
}

async function removerXP(req, res) {
  const { id } = req.params;
  const xp = Number(req.body.xp || 0);
  const p = await PersonagemModel.findByIdAndJogador(id, req.session.userId);
  if (!p) return res.send("Personagem não encontrado");

  let novoXP = (p.xp || 0) - xp;
  if (novoXP < 0) novoXP = 0;
  const novoNivel = Math.floor(novoXP / 100);
  await PersonagemModel.update(id, { xp: novoXP, nivel: novoNivel });

  if (novoNivel !== p.nivel) {
    const forca = Number(p.forca) || 0;
    const constituicao = Number(p.constituicao) || 0;
    const estabilidade = Number(p.estabilidade) || 0;
    let vida_max = 10 + constituicao + forca + (novoNivel * 6);
    if (p.vida_max_custom && !isNaN(p.vida_max_custom) && p.vida_max_custom > 0) vida_max = p.vida_max_custom;
    const sanidade_max = 5 + estabilidade + (novoNivel * 3);
    let novaVida = Math.min(p.vida_atual, vida_max);
    let novaSanidade = Math.min(p.sanidade_atual, sanidade_max);
    await PersonagemModel.update(id, { vida_atual: novaVida, sanidade_atual: novaSanidade });
  }
  res.redirect(`/personagens/${id}`);
}

async function dadosJson(req, res) {
  try {
    const id = req.params.id;
    const personagem = await PersonagemModel.findByIdAndJogador(id, req.session.userId);
    if (!personagem) return res.status(404).json({ erro: "Personagem não encontrado" });

    const nivel = Number(personagem.nivel);
    const forca = Number(personagem.forca) || 1;
    const constituicao = Number(personagem.constituicao) || 1;
    const estabilidade = Number(personagem.estabilidade) || 1;
    const agilidade = Number(personagem.agilidade) || 1;
    const intelecto = Number(personagem.intelecto) || 1;
    const atencao = Number(personagem.atencao) || 1;

    let vida_max = 10 + constituicao + forca + (nivel * 6);
    if (personagem.vida_max_custom && personagem.vida_max_custom > 0) vida_max = personagem.vida_max_custom;
    let sanidade_max = 5 + estabilidade + (nivel * 3);
    if (personagem.sanidade_max_custom && personagem.sanidade_max_custom > 0) sanidade_max = personagem.sanidade_max_custom;

    const pontos_totais_atributo = 21 + (nivel - 1) * 2;
    const pontos_gastos_atributo = (forca-1)+(agilidade-1)+(constituicao-1)+(intelecto-1)+(atencao-1)+(estabilidade-1);
    const pontos_disponiveis_atributo = pontos_totais_atributo - pontos_gastos_atributo;

    res.json({
      vida_atual: personagem.vida_atual,
      vida_max,
      sanidade_atual: personagem.sanidade_atual,
      sanidade_max,
      pontos_disponiveis_atributo
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
}

async function danoJson(req, res) {
  const { id } = req.params;
  const dano = Number(req.body.dano);
  const p = await PersonagemModel.findByIdAndJogador(id, req.session.userId);
  if (!p) return res.status(404).json({ erro: "Personagem não encontrado" });
  const vida_max = 10 + Number(p.constituicao) + Number(p.forca) + (Number(p.nivel) * 6);
  let novaVida = Number(p.vida_atual) - dano;
  if (novaVida < 0) novaVida = 0;
  if (novaVida > vida_max) novaVida = vida_max;
  await PersonagemModel.update(id, { vida_atual: novaVida });
  res.json({ ok: true });
}

async function curaJson(req, res) {
  const { id } = req.params;
  const cura = Number(req.body.cura);
  const p = await PersonagemModel.findByIdAndJogador(id, req.session.userId);
  if (!p) return res.status(404).json({ erro: "Personagem não encontrado" });
  const vida_max = 10 + Number(p.constituicao) + Number(p.forca) + (Number(p.nivel) * 6);
  let novaVida = Number(p.vida_atual) + cura;
  if (novaVida > vida_max) novaVida = vida_max;
  await PersonagemModel.update(id, { vida_atual: novaVida });
  res.json({ ok: true });
}

async function danoSanidadeJson(req, res) {
  const { id } = req.params;
  const dano = Number(req.body.dano) || 0;
  const p = await PersonagemModel.findByIdAndJogador(id, req.session.userId);
  if (!p) return res.status(404).json({ erro: "Personagem não encontrado" });
  const sanidade_max = 5 + Number(p.estabilidade) + (Number(p.nivel) * 3);
  let novaSanidade = Number(p.sanidade_atual) - dano;
  if (novaSanidade < 0) novaSanidade = 0;
  if (novaSanidade > sanidade_max) novaSanidade = sanidade_max;
  await PersonagemModel.update(id, { sanidade_atual: novaSanidade });
  res.json({ ok: true });
}

async function curaSanidadeJson(req, res) {
  const { id } = req.params;
  const cura = Number(req.body.cura) || 0;
  const p = await PersonagemModel.findByIdAndJogador(id, req.session.userId);
  if (!p) return res.status(404).json({ erro: "Personagem não encontrado" });
  const sanidade_max = 5 + Number(p.estabilidade) + (Number(p.nivel) * 3);
  let novaSanidade = Number(p.sanidade_atual) + cura;
  if (novaSanidade > sanidade_max) novaSanidade = sanidade_max;
  await PersonagemModel.update(id, { sanidade_atual: novaSanidade });
  res.json({ ok: true });
}

async function editarVidaJson(req, res) {
  try {
    const { id } = req.params;
    const { vida_atual, vida_max_custom } = req.body;
    const personagem = await PersonagemModel.findByIdAndJogador(id, req.session.userId);
    if (!personagem) return res.status(404).json({ erro: "Personagem não encontrado" });

    if (vida_atual !== undefined) {
      let novaVida = Number(vida_atual);
      let vidaMax = personagem.vida_max_custom || (10 + Number(personagem.constituicao) + Number(personagem.forca) + (Number(personagem.nivel) * 6));
      if (novaVida > vidaMax) novaVida = vidaMax;
      if (novaVida < 0) novaVida = 0;
      await PersonagemModel.update(id, { vida_atual: novaVida });
      return res.json({ ok: true });
    }
    if (vida_max_custom !== undefined) {
      let novoMax = Number(vida_max_custom);
      if (novoMax < 1) novoMax = 1;
      await PersonagemModel.update(id, { vida_max_custom: novoMax });
      if (personagem.vida_atual > novoMax) {
        await PersonagemModel.update(id, { vida_atual: novoMax });
      }
      return res.json({ ok: true });
    }
    res.status(400).json({ erro: "Nenhum campo válido" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
}

async function editarSanidadeJson(req, res) {
  try {
    const { id } = req.params;
    const { sanidade_atual, sanidade_max_custom } = req.body;
    const personagem = await PersonagemModel.findByIdAndJogador(id, req.session.userId);
    if (!personagem) return res.status(404).json({ erro: "Personagem não encontrado" });

    if (sanidade_atual !== undefined) {
      let novaSanidade = Number(sanidade_atual);
      let sanidadeMax = personagem.sanidade_max_custom || (5 + Number(personagem.estabilidade) + (Number(personagem.nivel) * 3));
      if (novaSanidade > sanidadeMax) novaSanidade = sanidadeMax;
      if (novaSanidade < 0) novaSanidade = 0;
      await PersonagemModel.update(id, { sanidade_atual: novaSanidade });
      return res.json({ ok: true });
    }
    if (sanidade_max_custom !== undefined) {
      let novoMax = Number(sanidade_max_custom);
      if (novoMax < 1) novoMax = 1;
      await PersonagemModel.update(id, { sanidade_max_custom: novoMax });
      if (personagem.sanidade_atual > novoMax) {
        await PersonagemModel.update(id, { sanidade_atual: novoMax });
      }
      return res.json({ ok: true });
    }
    res.status(400).json({ erro: "Nenhum campo válido" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
}

async function removerPersonagem(req, res) {
  const { id } = req.params;
  await PersonagemModel.deleteById(id, req.session.userId);
  res.redirect("/personagens");
}

async function aumentarAtributo(req, res) {
  const { id, tipo, operacao } = req.params;
  // Implementação completa conforme original, usando PersonagemModel.update
  // (código omitido por brevidade, mas igual ao original)
  // Por limite de caracteres, será necessário replicar a lógica completa.
  // Aqui vou colocar a mesma lógica do original usando o model.
  try {
    const tiposPermitidos = ["forca", "agilidade", "constituicao", "intelecto", "atencao", "estabilidade"];
    if (!tiposPermitidos.includes(tipo)) return res.status(400).json({ erro: "Atributo inválido" });
    if (!["aumentar", "diminuir"].includes(operacao)) return res.status(400).json({ erro: "Operação inválida" });

    const p = await PersonagemModel.findByIdAndJogador(id, req.session.userId);
    if (!p) return res.status(404).json({ erro: "Personagem não encontrado" });

    const nivel = Number(p.nivel);
    const valorAtual = Number(p[tipo]) || 1;

    if (operacao === "diminuir" && valorAtual <= 1) {
      return res.status(400).json({ erro: "Valor mínimo é 1" });
    }
    if (operacao === "aumentar") {
      const pontosTotais = calcularPontosAtributoTotais(nivel);
      const pontosGastosAtuais = calcularPontosGastos(
        Number(p.forca), Number(p.agilidade), Number(p.constituicao),
        Number(p.intelecto), Number(p.atencao), Number(p.estabilidade)
      );
      const pontosDisponiveis = pontosTotais - pontosGastosAtuais;
      if (pontosDisponiveis <= 0) {
        return res.status(400).json({ erro: "Sem pontos de atributo disponíveis" });
      }
    }

    const novoValor = operacao === "aumentar" ? valorAtual + 1 : valorAtual - 1;
    await PersonagemModel.update(id, { [tipo]: novoValor });

    const pAtualizado = await PersonagemModel.findByIdAndJogador(id, req.session.userId);
    const novaForca = Number(pAtualizado.forca);
    const novaConst = Number(pAtualizado.constituicao);
    const novoNivel = Number(pAtualizado.nivel);
    const novaEstab = Number(pAtualizado.estabilidade);

    let novaVidaMax = 10 + novaConst + novaForca + (novoNivel * 6);
    if (pAtualizado.vida_max_custom && pAtualizado.vida_max_custom > 0) novaVidaMax = pAtualizado.vida_max_custom;
    let novaSanidadeMax = 5 + novaEstab + (novoNivel * 3);
    if (pAtualizado.sanidade_max_custom && pAtualizado.sanidade_max_custom > 0) novaSanidadeMax = pAtualizado.sanidade_max_custom;

    let novaVida = Math.min(Number(pAtualizado.vida_atual), novaVidaMax);
    let novaSanidade = Math.min(Number(pAtualizado.sanidade_atual), novaSanidadeMax);
    await PersonagemModel.update(id, { vida_atual: novaVida, sanidade_atual: novaSanidade });

    const pontosTotais = calcularPontosAtributoTotais(novoNivel);
    const novosGastos = calcularPontosGastos(
      novaForca, Number(pAtualizado.agilidade), novaConst,
      Number(pAtualizado.intelecto), Number(pAtualizado.atencao), novaEstab
    );
    const novosPontosAtributo = pontosTotais - novosGastos;

    res.json({
      ok: true,
      atributo: tipo,
      novoValor,
      vida_atual: novaVida,
      vida_max: novaVidaMax,
      sanidade_atual: novaSanidade,
      sanidade_max: novaSanidadeMax,
      pontos_disponiveis_atributo: novosPontosAtributo,
      pontos_totais_atributo: pontosTotais
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
}

module.exports = {
  listar,
  mostrarFormNovo,
  criar,
  detalhes,
  adicionarXP,
  removerXP,
  dadosJson,
  danoJson,
  curaJson,
  danoSanidadeJson,
  curaSanidadeJson,
  editarVidaJson,
  editarSanidadeJson,
  removerPersonagem,
  aumentarAtributo
};