const express = require("express");
const session = require("express-session");
const db = require("./db");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // <-- ESSENCIAL PARA FETCH JSON
app.use(express.static("public"));
// ======================
// UPLOAD (MULTER)
// ======================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    const nomeUnico = Date.now() + path.extname(file.originalname);
    cb(null, nomeUnico);
  }
});

const upload = multer({ storage });

// ======================
// CONFIG
// ======================
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: "segredo_rpg",
  resave: false,
  saveUninitialized: false
}));

app.set("view engine", "ejs");

function calcularCusto(nivel, tipo, modo, temEfeito) {
  // Por padrão, habilidades passivas serão tratadas separadamente (custo 0)
  let custo = 1; // base para ativas
  if (tipo === 'cura') custo++;      // cura gasta mais
  if (modo === 'area') custo++;      // área gasta mais
  custo += Math.floor((nivel - 1) / 2); // +1 a cada 2 níveis
  if (temEfeito) custo++;            // efeito especial custa mais
  return { vida: 0, sanidade: custo };
}
// ======================
// FUNÇÕES AUXILIARES (ATRIBUTOS)
// ======================
function calcularPontosAtributoTotais(nivel) {
  return 21 + (nivel - 1) * 2;
}
function calcularPontosGastos(forca, agilidade, constituicao, intelecto, atencao, estabilidade) {
  return (forca - 1) + (agilidade - 1) + (constituicao - 1) + (intelecto - 1) + (atencao - 1) + (estabilidade - 1);
}
// ======================
// MIDDLEWARE LOGIN
// ======================
function verificarLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  next();
}
// ======================
// MIDDLEWARE - DADOS DO USUÁRIO PARA AS VIEWS
// ======================
app.use(async (req, res, next) => {
  if (req.session.userId) {
    try {
      const [[usuario]] = await db.query(
        "SELECT id, nome, email, role, avatar FROM jogador WHERE id = ?",
        [req.session.userId]
      );
      res.locals.user = usuario;
    } catch (err) {
      console.error("Erro ao buscar usuário:", err);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});

// ======================
// LOGIN
// ======================
app.get("/login", (req, res) => {
  res.render("login", { erro: null });
});

app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  const [usuarios] = await db.query(
    "SELECT * FROM jogador WHERE email = ?",
    [email]
  );

  if (usuarios.length === 0) {
    return res.render("login", { erro: "Usuário não encontrado" });
  }

  const usuario = usuarios[0];

  if (senha.trim() !== usuario.senha) {
    return res.render("login", { erro: "Senha incorreta" });
  }

  req.session.userId = usuario.id;
  req.session.userRole = usuario.role;
  res.redirect("/");
});

// ======================
// CADASTRO
// ======================
app.get("/cadastro", (req, res) => {
  res.render("cadastro");
});

app.post("/cadastro", async (req, res) => {
  const { nome, email, senha, role } = req.body;
  try {
    await db.query(
      "INSERT INTO jogador (nome, email, senha, role) VALUES (?, ?, ?, ?)",
      [nome, email, senha, role || 'jogador']
    );
    res.redirect("/login");
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.send("Email já cadastrado");
    }
    res.send("Erro ao cadastrar");
  }
});


// ======================
// LOGOUT
// ======================
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// ======================
// HOME
// ======================
app.get("/", verificarLogin, (req, res) => {
  res.render("home");
});

// ======================
// Regras
// ======================

app.get("/regras", verificarLogin, async (req, res) =>{
  const regras = [
    "Sistema baseado em 1d20 + atributo",
    "Vitalidade = 10 + Vigor",
    "Testes de imunidade evitam mutação"
  ];

  res.render("regras", {
    regras: regras
  });
});

// ======================
// PERFIL DO USUÁRIO
// ======================
app.get("/perfil", verificarLogin, async (req, res) => {
  const [[usuario]] = await db.query(
    "SELECT id, nome, email, role, avatar FROM jogador WHERE id = ?",
    [req.session.userId]
  );
  res.render("perfil", { usuario });
});

// Configuração para upload de avatar
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/avatars/");
  },
  filename: function (req, file, cb) {
    const nomeUnico = Date.now() + path.extname(file.originalname);
    cb(null, nomeUnico);
  }
});
const uploadAvatar = multer({ storage: avatarStorage });

app.post("/perfil/update", verificarLogin, uploadAvatar.single("avatar"), async (req, res) => {
  try {
    const { nome, role } = req.body;
    const avatar = req.file ? req.file.filename : null;

    // Valida se o role é válido
    const roleValido = (role === 'jogador' || role === 'mestre');
    if (!roleValido) {
      return res.status(400).send("Papel inválido.");
    }

    // Atualiza nome e avatar se fornecidos
    if (nome) {
      await db.query("UPDATE jogador SET nome = ? WHERE id = ?", [nome, req.session.userId]);
    }
    if (avatar) {
      await db.query("UPDATE jogador SET avatar = ? WHERE id = ?", [avatar, req.session.userId]);
    }
    // Atualiza o papel
    await db.query("UPDATE jogador SET role = ? WHERE id = ?", [role, req.session.userId]);

    // Atualiza também a sessão (opcional)
    req.session.userRole = role;

    res.redirect("/perfil");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao atualizar perfil");
  }
});


// ======================
// PERSONAGENS
// ======================
app.get("/personagens", verificarLogin, async (req, res) => {
  const [personagens] = await db.query(
    "SELECT * FROM personagens WHERE id_jogador = ?",
    [req.session.userId]
  );

  res.render("personagens", { personagens });
});
// ======================
// CRIAR PERSONAGEM
// ======================
app.post("/personagens", verificarLogin, upload.single("imagem"), async (req, res) => {
  try {
    // Força o nível para 1 (sempre)
    const nivel = 1;

    const {
      nome, descricao,
      forca, agilidade, constituicao,
      intelecto, atencao, estabilidade
    } = req.body;

    // Converte atributos para número, mínimo 1
    const forcaNum = Math.max(1, Number(forca) || 1);
    const agilidadeNum = Math.max(1, Number(agilidade) || 1);
    const constituicaoNum = Math.max(1, Number(constituicao) || 1);
    const intelectoNum = Math.max(1, Number(intelecto) || 1);
    const atencaoNum = Math.max(1, Number(atencao) || 1);
    const estabilidadeNum = Math.max(1, Number(estabilidade) || 1);

    // Pontos totais para nível 1 = 21
    const pontosTotais = 21;
    const pontosGastos = (forcaNum - 1) + (agilidadeNum - 1) + (constituicaoNum - 1) +
                         (intelectoNum - 1) + (atencaoNum - 1) + (estabilidadeNum - 1);

    if (pontosGastos > pontosTotais) {
      return res.status(400).send("Pontos de atributo excedidos. Máximo é 21.");
    }

    // Calcula vida e sanidade iniciais (nível 1)
    const vidaMax = 10 + constituicaoNum + forcaNum + (nivel * 6);
    const sanidadeMax = 5 + estabilidadeNum + (nivel * 3);

    const imagem = req.file ? req.file.filename : null;

    await db.query(
      `INSERT INTO personagens 
      (nome, nivel, descricao, forca, agilidade, constituicao, intelecto, atencao, estabilidade, 
       vida_atual, sanidade_atual, id_jogador, imagem)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome, nivel, descricao,
        forcaNum, agilidadeNum, constituicaoNum,
        intelectoNum, atencaoNum, estabilidadeNum,
        vidaMax, sanidadeMax,
        req.session.userId,
        imagem
      ]
    );

    res.redirect("/personagens");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro interno ao criar personagem");
  }
});
app.get("/personagens/novo", verificarLogin, (req, res) => {
  res.render("novoPersonagem", {
    pontos_disponiveis_atributo: 21,
    pontos_totais_atributo: 21,
    nivel: 1
  });
});

app.get("/personagens/:id/dadosJson", verificarLogin, async (req, res) => {
  try {
    const id = req.params.id;
    const [[personagem]] = await db.query(
      "SELECT * FROM personagens WHERE id = ? AND id_jogador = ?",
      [id, req.session.userId]
    );
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
      vida_max: vida_max,
      sanidade_atual: personagem.sanidade_atual,
      sanidade_max: sanidade_max,
      pontos_disponiveis_atributo: pontos_disponiveis_atributo
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
});;
// ======================
// DETALHE PERSONAGEM
// ======================
app.get("/personagens/:id", verificarLogin, async (req, res) => {
  const id = req.params.id;

  const [[personagem]] = await db.query(
    "SELECT * FROM personagens WHERE id = ? AND id_jogador = ?",
    [id, req.session.userId]
  );

  if (!personagem) {
    return res.send("Personagem não encontrado");
  }

  const nivel = Number(personagem.nivel);;
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
// Se existir um valor customizado no banco, usa ele
if (personagem.vida_max_custom && personagem.vida_max_custom > 0) {
  vida_max = personagem.vida_max_custom;
}
let sanidade_max = 5 + estabilidade + (nivel * 3);
if (personagem.sanidade_max_custom && personagem.sanidade_max_custom > 0) {
  sanidade_max = personagem.sanidade_max_custom;
}
  const [habilidades] = await db.query(
    "SELECT * FROM habilidades WHERE id_personagem = ?",
    [id]
  );

const habilidadesComValor = habilidades.map(h => ({
  ...h,
  valor: h.dano_fixo || calcularDano(Number(h.nivel), h.tipo)
}));

  const pontos_totais = 3 + (nivel - 1) * 2;

  const pontos_usados = habilidades.reduce((t, h) => {
    return t + Number(h.nivel || 0);
  }, 0);

  const pontos_disponiveis = pontos_totais - pontos_usados;

res.render("detalhesPersonagem", {
  personagem,
  vida_max,
  sanidade_max,
  habilidades: habilidadesComValor,
  pontos_disponiveis, // já existente das habilidades
  pontos_disponiveis_atributo, // novo
  pontos_totais_atributo,
  pontos_gastos_atributo
});
  console.log("===== DETALHES PERSONAGEM =====");
console.log("ID:", id);
console.log("Nível no banco:", personagem.nivel);
console.log("Força:", forca, "Constituição:", constituicao);
console.log("Vida máxima calculada:", vida_max);
console.log("Pontos totais (nível):", 3 + (nivel - 1) * 2);
console.log("Pontos usados (habilidades):", pontos_usados);
console.log("Pontos disponíveis:", pontos_disponiveis);
console.log("personagem.nivel (bruto):", personagem.nivel);
console.log("nivel após conversão:", nivel);
console.log("vida_max calculada:", vida_max);
console.log("================================");

  
});

app.post("/personagens/:id/xp/add", verificarLogin, async (req, res) => {
  const { id } = req.params;
  const xp = Number(req.body.xp || 0);
  console.log(`Adicionando ${xp} XP ao personagem ${id}`);

  const [[p]] = await db.query(
    "SELECT * FROM personagens WHERE id = ? AND id_jogador = ?",
    [id, req.session.userId]
  );
  if (!p) return res.send("Personagem não encontrado");

  const novoXP = (p.xp || 0) + xp;
  const novoNivel = Math.floor(novoXP / 100);
  console.log(`XP antigo: ${p.xp}, novo XP: ${novoXP}, nível antigo: ${p.nivel}, novo nível: ${novoNivel}`);

  // Atualiza XP e nível
  await db.query(
    "UPDATE personagens SET xp = ?, nivel = ? WHERE id = ?",
    [novoXP, novoNivel, id]
  );

  // Se o nível mudou, recalcular vida e sanidade usando os valores atuais (p) e o novo nível
  if (novoNivel !== p.nivel) {
    console.log("Nível mudou! Recalculando máximos...");
    const forca = Number(p.forca) || 0;
    const constituicao = Number(p.constituicao) || 0;
    const estabilidade = Number(p.estabilidade) || 0;
    let vida_max = 10 + constituicao + forca + (novoNivel * 6);
    if (p.vida_max_custom && !isNaN(p.vida_max_custom) && p.vida_max_custom > 0) {
      vida_max = p.vida_max_custom;
    }
    const sanidade_max = 5 + estabilidade + (novoNivel * 3);
    // Cura total ao subir
    let novaVida = vida_max;
    let novaSanidade = sanidade_max;
    await db.query(
      "UPDATE personagens SET vida_atual = ?, sanidade_atual = ? WHERE id = ?",
      [novaVida, novaSanidade, id]
    );
    console.log(`[recalcular] Personagem ${id}: nível ${novoNivel} -> vida_max=${vida_max}, sanidade_max=${sanidade_max}, vida_atual ajustada para ${novaVida}`);
  }

  res.redirect("/personagens/" + id);
});

app.post("/personagens/:id/xp/remove", verificarLogin, async (req, res) => {
  const { id } = req.params;
  const xp = Number(req.body.xp || 0);

  const [[p]] = await db.query(
    "SELECT * FROM personagens WHERE id = ? AND id_jogador = ?",
    [id, req.session.userId]
  );
  if (!p) return res.send("Personagem não encontrado");

  let novoXP = (p.xp || 0) - xp;
  if (novoXP < 0) novoXP = 0;
  const novoNivel = Math.floor(novoXP / 100);

  await db.query(
    "UPDATE personagens SET xp = ?, nivel = ? WHERE id = ?",
    [novoXP, novoNivel, id]
  );

  if (novoNivel !== p.nivel) {
    const forca = Number(p.forca) || 0;
    const constituicao = Number(p.constituicao) || 0;
    const estabilidade = Number(p.estabilidade) || 0;

    let vida_max = 10 + constituicao + forca + (novoNivel * 6);
    if (p.vida_max_custom && !isNaN(p.vida_max_custom) && p.vida_max_custom > 0) {
      vida_max = p.vida_max_custom;
    }
    const sanidade_max = 5 + estabilidade + (novoNivel * 3);

    // Ao diminuir de nível, apenas limita a vida atual se ultrapassar o novo máximo
    let novaVida = Math.min(p.vida_atual, vida_max);
    let novaSanidade = Math.min(p.sanidade_atual, sanidade_max);

    await db.query(
      "UPDATE personagens SET vida_atual = ?, sanidade_atual = ? WHERE id = ?",
      [novaVida, novaSanidade, id]
    );
    console.log(`[recalcular] Personagem ${id}: novo nível ${novoNivel} -> vida_max=${vida_max}, vida_atual limitada para ${novaVida}`);
  }

  res.redirect("/personagens/" + id);
});



// ======================
// CRIAR PERSONAGEM
// ======================
app.post("/personagens", verificarLogin, upload.single("imagem"), async (req, res) => {
  const {
    nome, nivel, descricao,
    forca, agilidade, constituicao,
    intelecto, atencao, estabilidade
  } = req.body;

  const imagem = req.file ? req.file.filename : null;

  const vida = 10 + Number(constituicao) + Number(forca) + (Number(nivel) * 6);
  const energia = 5 + Number(constituicao) + (Number(nivel) * 3);

  await db.query(
    `INSERT INTO personagens 
    (nome, nivel, descricao, forca, agilidade, constituicao, intelecto, atencao, estabilidade, vida_atual, sanidade_atual, id_jogador, imagem)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nome, nivel, descricao,
      forca, agilidade, constituicao,
      intelecto, atencao, estabilidade,
      vida, energia,
      req.session.userId,
      imagem
    ]
  );

  res.redirect("/personagens");
});

// ======================
// VIDA
// ======================
app.post("/personagens/:id/dano", verificarLogin, async (req, res) => {
  const { id } = req.params;
  const dano = Number(req.body.dano || 0);

  const [[p]] = await db.query(
    "SELECT vida_atual, forca, constituicao, nivel FROM personagens WHERE id = ? AND id_jogador = ?",
    [id, req.session.userId]
  );

  if (!p) return res.send("Personagem não encontrado");

  const vida_max = 10 + Number(p.constituicao) + Number(p.forca) + (Number(p.nivel) * 6);
  let novaVida = Number(p.vida_atual) - dano;

  if (novaVida < 0) novaVida = 0;
  if (novaVida > vida_max) novaVida = vida_max; // seguro

  await db.query(
    "UPDATE personagens SET vida_atual = ? WHERE id = ?",
    [novaVida, id]
  );

  res.redirect("/personagens/" + id);
});

app.post("/personagens/:id/cura", verificarLogin, async (req, res) => {
  const { id } = req.params;
  const cura = Number(req.body.cura || 0);

  const [[p]] = await db.query(
    "SELECT vida_atual, forca, constituicao, nivel FROM personagens WHERE id = ? AND id_jogador = ?",
    [id, req.session.userId]
  );

  if (!p) return res.send("Personagem não encontrado");

  const vida_max = 10 + Number(p.constituicao) + Number(p.forca) + (Number(p.nivel) * 6);
  let novaVida = Number(p.vida_atual) + cura;

  if (novaVida > vida_max) novaVida = vida_max;

  await db.query(
    "UPDATE personagens SET vida_atual = ? WHERE id = ?",
    [novaVida, id]
  );

  res.redirect("/personagens/" + id);
});
// Dano de sanidade
// Dano de sanidade (-1)
app.post("/personagens/:id/danoSanidade", verificarLogin, async (req, res) => {
  const { id } = req.params;
  const dano = Number(req.body.dano || 0);

  const [[p]] = await db.query(
    "SELECT sanidade_atual, estabilidade, nivel FROM personagens WHERE id = ? AND id_jogador = ?",
    [id, req.session.userId]
  );

  if (!p) return res.send("Personagem não encontrado");

  const sanidade_max = 5 + Number(p.estabilidade) + (Number(p.nivel) * 3);
  let novaSanidade = Number(p.sanidade_atual) - dano;

  if (novaSanidade < 0) novaSanidade = 0;
  if (novaSanidade > sanidade_max) novaSanidade = sanidade_max;

  await db.query(
    "UPDATE personagens SET sanidade_atual = ? WHERE id = ?",
    [novaSanidade, id]
  );

  res.redirect("/personagens/" + id);
});

// Cura de sanidade (+1)
app.post("/personagens/:id/curaSanidade", verificarLogin, async (req, res) => {
  const { id } = req.params;
  const cura = Number(req.body.cura || 0);

  const [[p]] = await db.query(
    "SELECT sanidade_atual, estabilidade, nivel FROM personagens WHERE id = ? AND id_jogador = ?",
    [id, req.session.userId]
  );

  if (!p) return res.send("Personagem não encontrado");

  const sanidade_max = 5 + Number(p.estabilidade) + (Number(p.nivel) * 3);
  let novaSanidade = Number(p.sanidade_atual) + cura;

  if (novaSanidade > sanidade_max) novaSanidade = sanidade_max;

  await db.query(
    "UPDATE personagens SET sanidade_atual = ? WHERE id = ?",
    [novaSanidade, id]
  );

  res.redirect("/personagens/" + id);
});

// Edição manual de sanidade (opcional)
// Rota para edição via JSON (AJAX) – SANIDADE
app.post("/personagens/:id/editarSanidadeJson", verificarLogin, async (req, res) => {
   console.log("Body recebido (sanidade):", req.body);
  try {
    const { id } = req.params;
    const { sanidade_atual, sanidade_max_custom } = req.body;

    const [[personagem]] = await db.query(
      "SELECT * FROM personagens WHERE id = ? AND id_jogador = ?",
      [id, req.session.userId]
    );
    if (!personagem) {
      return res.status(404).json({ erro: "Personagem não encontrado" });
    }

    if (sanidade_atual !== undefined) {
      let novaSanidade = Number(sanidade_atual);
      let sanidadeMax = personagem.sanidade_max_custom ||
                        (5 + Number(personagem.estabilidade) + (Number(personagem.nivel) * 3));
      if (novaSanidade > sanidadeMax) novaSanidade = sanidadeMax;
      if (novaSanidade < 0) novaSanidade = 0;
      await db.query("UPDATE personagens SET sanidade_atual = ? WHERE id = ?", [novaSanidade, id]);
      return res.json({ ok: true });
    }

    if (sanidade_max_custom !== undefined) {
      let novoMax = Number(sanidade_max_custom);
      if (novoMax < 1) novoMax = 1;
      await db.query("UPDATE personagens SET sanidade_max_custom = ? WHERE id = ?", [novoMax, id]);
      // Ajusta a sanidade atual se estiver acima do novo máximo
      if (personagem.sanidade_atual > novoMax) {
        await db.query("UPDATE personagens SET sanidade_atual = ? WHERE id = ?", [novoMax, id]);
      }
      return res.json({ ok: true });
    }

    res.status(400).json({ erro: "Nenhum campo válido" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
});

app.post("/personagens/:id/editarVida", verificarLogin, async (req, res) => {
   console.log("Body recebido (vida):", req.body);
  const { id } = req.params;
  const { vida_atual } = req.body;

  // Busca os dados necessários para calcular a vida máxima
  const [[p]] = await db.query(
    "SELECT forca, constituicao, nivel FROM personagens WHERE id = ? AND id_jogador = ?",
    [id, req.session.userId]
  );

  if (!p) return res.send("Personagem não encontrado");

  const vida_max = 10 + Number(p.constituicao) + Number(p.forca) + (Number(p.nivel) * 6);
  let novaVida = Number(vida_atual);

  // Limita entre 0 e a vida máxima
  if (novaVida > vida_max) novaVida = vida_max;
  if (novaVida < 0) novaVida = 0;

  await db.query(
    "UPDATE personagens SET vida_atual = ? WHERE id = ?",
    [novaVida, id]
  );

  res.redirect("/personagens/" + id);
});

// Rota para edição via JSON (AJAX)
app.post("/personagens/:id/editarVidaJson", verificarLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const { vida_atual, vida_max_custom } = req.body;

    const [[personagem]] = await db.query(
      "SELECT * FROM personagens WHERE id = ? AND id_jogador = ?",
      [id, req.session.userId]
    );
    if (!personagem) {
      return res.status(404).json({ erro: "Personagem não encontrado" });
    }

    if (vida_atual !== undefined) {
      let novaVida = Number(vida_atual);
      let vidaMax = personagem.vida_max_custom || 
                    (10 + Number(personagem.constituicao) + Number(personagem.forca) + (Number(personagem.nivel) * 6));
      if (novaVida > vidaMax) novaVida = vidaMax;
      if (novaVida < 0) novaVida = 0;
      await db.query("UPDATE personagens SET vida_atual = ? WHERE id = ?", [novaVida, id]);
      return res.json({ ok: true });
    }

    if (vida_max_custom !== undefined) {
      let novoMax = Number(vida_max_custom);
      if (novoMax < 1) novoMax = 1;
      await db.query("UPDATE personagens SET vida_max_custom = ? WHERE id = ?", [novoMax, id]);
      if (personagem.vida_atual > novoMax) {
        await db.query("UPDATE personagens SET vida_atual = ? WHERE id = ?", [novoMax, id]);
      }
      return res.json({ ok: true });
    }

    res.status(400).json({ erro: "Nenhum campo válido" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
});

// ======================
// DELETAR PERSONAGEM
// ======================
app.post("/personagens/:id/delete", verificarLogin, async (req, res) => {
  const { id } = req.params;

  await db.query(
    "DELETE FROM personagens WHERE id = ? AND id_jogador = ?",
    [id, req.session.userId]
  );

  res.redirect("/personagens");
});

// ======================
// Atributos
// ======================

// Calcular pontos totais baseado no nível
app.post("/personagens/:id/atributo/:tipo/:operacao", verificarLogin, async (req, res) => {

  const { id, tipo, operacao } = req.params;
  const tiposPermitidos = ["forca", "agilidade", "constituicao", "intelecto", "atencao", "estabilidade"];
  if (!tiposPermitidos.includes(tipo)) return res.status(400).json({ erro: "Atributo inválido" });
  if (!["aumentar", "diminuir"].includes(operacao)) return res.status(400).json({ erro: "Operação inválida" });

  try {
    const [[p]] = await db.query(
      "SELECT * FROM personagens WHERE id = ? AND id_jogador = ?",
      [id, req.session.userId]
    );
    if (!p) return res.status(404).json({ erro: "Personagem não encontrado" });

    const nivel = Number(p.nivel);
    const valorAtual = Number(p[tipo]) || 1;

    // Validação de limites
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

    // Atualiza o atributo
    const novoValor = operacao === "aumentar" ? valorAtual + 1 : valorAtual - 1;
    await db.query(`UPDATE personagens SET ${tipo} = ? WHERE id = ?`, [novoValor, id]);

    // Busca o personagem atualizado
    const [[pAtualizado]] = await db.query(
      "SELECT * FROM personagens WHERE id = ? AND id_jogador = ?",
      [id, req.session.userId]
    );
    const novaForca = Number(pAtualizado.forca);
    const novaConst = Number(pAtualizado.constituicao);
    const novoNivel = Number(pAtualizado.nivel);
    const novaEstab = Number(pAtualizado.estabilidade);

    // Recalcula vida e sanidade máximas
    let novaVidaMax = 10 + novaConst + novaForca + (novoNivel * 6);
    if (pAtualizado.vida_max_custom && pAtualizado.vida_max_custom > 0) novaVidaMax = pAtualizado.vida_max_custom;
    let novaSanidadeMax = 5 + novaEstab + (novoNivel * 3);
    if (pAtualizado.sanidade_max_custom && pAtualizado.sanidade_max_custom > 0) novaSanidadeMax = pAtualizado.sanidade_max_custom;

    // Ajusta vida e sanidade atuais para não ultrapassarem os novos máximos
    let novaVida = Math.min(Number(pAtualizado.vida_atual), novaVidaMax);
    let novaSanidade = Math.min(Number(pAtualizado.sanidade_atual), novaSanidadeMax);

    await db.query(
      "UPDATE personagens SET vida_atual = ?, sanidade_atual = ? WHERE id = ?",
      [novaVida, novaSanidade, id]
    );

    // Recalcula pontos de atributo disponíveis
    const pontosTotais = calcularPontosAtributoTotais(novoNivel);
    const novosGastos = calcularPontosGastos(
      novaForca, Number(pAtualizado.agilidade), novaConst,
      Number(pAtualizado.intelecto), Number(pAtualizado.atencao), novaEstab
    );
    const novosPontosAtributo = pontosTotais - novosGastos;
    // Retorna os dados atualizados para o front-end
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
      console.log(`Rota de atributo chamada: ${id} / ${tipo} / ${operacao}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
});

// ======================
// HABILIDADES CRIAR
// ======================
app.post("/habilidades/criarJson", verificarLogin, async (req, res) => {
  try {
    const { nome, tipo, modo, id_personagem, descricao, tipo_acao, efeito } = req.body;
    const [[personagem]] = await db.query(
      "SELECT nivel FROM personagens WHERE id = ? AND id_jogador = ?",
      [id_personagem, req.session.userId]
    );
    if (!personagem) return res.status(403).json({ erro: "Acesso negado" });

    const nivel = Number(personagem.nivel);
    const pontos_totais = 3 + (nivel - 1) * 2;
    const [habilidades] = await db.query(
      "SELECT * FROM habilidades WHERE id_personagem = ?",
      [id_personagem]
    );
    const usados = habilidades.reduce((t, h) => t + Number(h.nivel || 0), 0);
    if (usados >= pontos_totais) {
      return res.status(400).json({ erro: "Sem pontos disponíveis" });
    }

    // Calcular custo
    const custo = calcularCusto(1, tipo, modo, !!efeito);
    const [result] = await db.query(
      `INSERT INTO habilidades 
      (nome, tipo, modo, id_personagem, descricao, tipo_acao, custo_vida, custo_sanidade, efeito, is_upgradeable) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome, tipo, modo, id_personagem, descricao, tipo_acao, custo.vida, custo.sanidade, efeito || null, 1]
    );

    const novaHabilidade = {
      id: result.insertId,
      nome,
      tipo,
      modo,
      nivel: 1,
      valor: calcularDano(1, tipo),
      descricao,
      tipo_acao,
      custo_vida: custo.vida,
      custo_sanidade: custo.sanidade,
      efeito,
      is_upgradeable: 1
    };
    
    const novosUsados = usados + 1;
    const pontos_disponiveis = pontos_totais - novosUsados;
    res.json({ ok: true, habilidade: novaHabilidade, pontos_disponiveis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
});

// ======================
// HABILIDADES UPAR
// ======================
app.post("/habilidades/:id/uparJson", verificarLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const [[h]] = await db.query("SELECT * FROM habilidades WHERE id = ?", [id]);
    if (!h) return res.status(404).json({ erro: "Habilidade não encontrada" });

    const id_personagem = h.id_personagem;
    const [[personagem]] = await db.query(
      "SELECT * FROM personagens WHERE id = ? AND id_jogador = ?",
      [id_personagem, req.session.userId]
    );
    if (!personagem) return res.status(403).json({ erro: "Acesso negado" });

    const nivel = Number(personagem.nivel);
    const pontos_totais = 3 + (nivel - 1) * 2;
    const [habilidades] = await db.query(
      "SELECT * FROM habilidades WHERE id_personagem = ?",
      [id_personagem]
    );
    const usados = habilidades.reduce((t, hab) => t + Number(hab.nivel || 0), 0);
    if (usados >= pontos_totais) {
      return res.status(400).json({ erro: "Sem pontos disponíveis" });
    }

    const novoNivel = Number(h.nivel) + 1;
    await db.query("UPDATE habilidades SET nivel = nivel + 1 WHERE id = ?", [id]);

    // Recalcular custo com o novo nível
    const custo = calcularCusto(novoNivel, h.tipo, h.modo, !!h.efeito);
    await db.query(
      "UPDATE habilidades SET custo_vida = ?, custo_sanidade = ? WHERE id = ?",
      [custo.vida, custo.sanidade, id]
    );

    const [[habAtualizada]] = await db.query("SELECT * FROM habilidades WHERE id = ?", [id]);
    const novoValor = calcularDano(Number(habAtualizada.nivel), habAtualizada.tipo);
    const novosUsados = usados + 1;
    const pontos_disponiveis = pontos_totais - novosUsados;

    res.json({
      ok: true,
      habilidade: { ...habAtualizada, valor: novoValor, custo_vida: custo.vida, custo_sanidade: custo.sanidade },
      pontos_disponiveis
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
});

// ======================
// HABILIDADES Diminuir (JSON)
// ======================
app.post("/habilidades/:id/diminuirJson", verificarLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const [[habilidade]] = await db.query("SELECT * FROM habilidades WHERE id = ?", [id]);
    if (!habilidade) return res.status(404).json({ erro: "Habilidade não encontrada" });

    const id_personagem = habilidade.id_personagem;
    const [[personagem]] = await db.query(
      "SELECT * FROM personagens WHERE id = ? AND id_jogador = ?",
      [id_personagem, req.session.userId]
    );
    if (!personagem) return res.status(403).json({ erro: "Acesso negado" });

    if (habilidade.nivel <= 1) {
      return res.status(400).json({ erro: "Nível mínimo já atingido" });
    }

    await db.query("UPDATE habilidades SET nivel = nivel - 1 WHERE id = ?", [id]);
    const [[habAtualizada]] = await db.query("SELECT * FROM habilidades WHERE id = ?", [id]);
    const novoValor = calcularDano(Number(habAtualizada.nivel), habAtualizada.tipo);

    const nivelPersonagem = Number(personagem.nivel);
    const pontos_totais = 3 + (nivelPersonagem - 1) * 2;
    const [habilidades] = await db.query(
      "SELECT * FROM habilidades WHERE id_personagem = ?",
      [id_personagem]
    );
    const usados = habilidades.reduce((t, hab) => t + Number(hab.nivel || 0), 0);
    const pontos_disponiveis = pontos_totais - usados;

    res.json({
      ok: true,
      habilidade: { ...habAtualizada, valor: novoValor },
      pontos_disponiveis
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
});
// ======================
// Deletar habilidade (JSON)
// ======================
app.post("/habilidades/:id/deletarJson", verificarLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const [[habilidade]] = await db.query("SELECT * FROM habilidades WHERE id = ?", [id]);
    if (!habilidade) return res.status(404).json({ erro: "Habilidade não encontrada" });

    const id_personagem = habilidade.id_personagem;
    const [[personagem]] = await db.query(
      "SELECT * FROM personagens WHERE id = ? AND id_jogador = ?",
      [id_personagem, req.session.userId]
    );
    if (!personagem) return res.status(403).json({ erro: "Acesso negado" });

    // Deleta a habilidade
    await db.query("DELETE FROM habilidades WHERE id = ?", [id]);

    // Recalcula pontos disponíveis do personagem
    const nivel = Number(personagem.nivel);
    const pontos_totais = 3 + (nivel - 1) * 2;
    const [habilidadesRestantes] = await db.query(
      "SELECT * FROM habilidades WHERE id_personagem = ?",
      [id_personagem]
    );
    const usados = habilidadesRestantes.reduce((t, h) => t + Number(h.nivel || 0), 0);
    const pontos_disponiveis = pontos_totais - usados;

    res.json({ ok: true, pontos_disponiveis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
});



app.get("/habilidades/biblioteca", verificarLogin, async (req, res) => {
  try {
    const [gerais] = await db.query(
  "SELECT id, nome, tipo, modo, descricao, tipo_acao, efeito, dano_base FROM habilidades_biblioteca WHERE is_geral = 1"
);
const [pessoais] = await db.query(
  "SELECT id, nome, tipo, modo, descricao, tipo_acao, efeito, dano_base FROM habilidades_biblioteca WHERE id_jogador = ? AND is_geral = 0",
  [req.session.userId]
);
    res.json({ gerais, pessoais });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
});

app.post("/habilidades/copiarJson", verificarLogin, async (req, res) => {
  try {
    const { id_habilidade_biblioteca, id_personagem } = req.body;
    const [[habilidadeBase]] = await db.query(
      "SELECT * FROM habilidades_biblioteca WHERE id = ?",
      [id_habilidade_biblioteca]
    );
    if (!habilidadeBase) return res.status(404).json({ erro: "Habilidade não encontrada na biblioteca" });

    if (!habilidadeBase.is_geral && habilidadeBase.id_jogador !== req.session.userId) {
      return res.status(403).json({ erro: "Acesso negado" });
    }

    const [[personagem]] = await db.query(
      "SELECT nivel FROM personagens WHERE id = ? AND id_jogador = ?",
      [id_personagem, req.session.userId]
    );
    if (!personagem) return res.status(404).json({ erro: "Personagem não encontrado" });

    const nivel = Number(personagem.nivel);
    const pontos_totais = 3 + (nivel - 1) * 2;
    const [habilidadesAtuais] = await db.query(
      "SELECT * FROM habilidades WHERE id_personagem = ?",
      [id_personagem]
    );
    const usados = habilidadesAtuais.reduce((t, h) => t + Number(h.nivel || 0), 0);
    if (usados >= pontos_totais) {
      return res.status(400).json({ erro: "Sem pontos disponíveis para adicionar habilidade" });
    }

    const danoFixo = habilidadeBase.dano_base || calcularDano(1, habilidadeBase.tipo);
    const [result] = await db.query(
      `INSERT INTO habilidades 
      (nome, tipo, modo, id_personagem, descricao, tipo_acao, custo_vida, custo_sanidade, efeito, is_upgradeable, dano_fixo) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        habilidadeBase.nome,
        habilidadeBase.tipo,
        habilidadeBase.modo,
        id_personagem,
        habilidadeBase.descricao || null,
        habilidadeBase.tipo_acao || 'ativa',
        0, 0,
        habilidadeBase.efeito || null,
        0,
        danoFixo
      ]
    );

    const novaHabilidade = {
      id: result.insertId,
      nome: habilidadeBase.nome,
      tipo: habilidadeBase.tipo,
      modo: habilidadeBase.modo,
      nivel: 1,
      valor: danoFixo,
      descricao: habilidadeBase.descricao,
      tipo_acao: habilidadeBase.tipo_acao || 'ativa',
      custo_vida: 0,
      custo_sanidade: 0,
      efeito: habilidadeBase.efeito,
      is_upgradeable: 0
    };
    const novosUsados = usados + 1;
    const novosPontos = pontos_totais - novosUsados;
    res.json({ ok: true, habilidade: novaHabilidade, pontos_disponiveis: novosPontos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
});

app.post("/habilidades/biblioteca/criar", verificarLogin, async (req, res) => {
  try {
    const { nome, tipo, modo, is_geral } = req.body;
    // Somente admin poderia criar geral, mas vamos permitir qualquer um criar geral? Melhor não.
    // Vamos considerar que "is_geral" só pode ser true se o usuário for admin. Para simplificar, guardamos como do usuário.
    const id_jogador = is_geral ? null : req.session.userId;
    await db.query(
      "INSERT INTO habilidades_biblioteca (nome, tipo, modo, is_geral, id_jogador) VALUES (?, ?, ?, ?, ?)",
      [nome, tipo, modo, is_geral || false, id_jogador]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
});

app.post("/habilidades/salvarNaBiblioteca", verificarLogin, async (req, res) => {
  try {
    const { id_habilidade } = req.body; // <- note: id_habilidade, não habilidade
    // Buscar a habilidade original
    const [[habilidade]] = await db.query(
      "SELECT * FROM habilidades WHERE id = ?",
      [id_habilidade]
    );
    if (!habilidade) return res.status(404).json({ erro: "Habilidade não encontrada" });

    // Verificar se o jogador é dono do personagem dessa habilidade
    const [[personagem]] = await db.query(
      "SELECT id_jogador FROM personagens WHERE id = ?",
      [habilidade.id_personagem]
    );
    if (!personagem || personagem.id_jogador !== req.session.userId) {
      return res.status(403).json({ erro: "Acesso negado" });
    }

    // Verificar se a habilidade já não está na biblioteca do jogador
    const [existe] = await db.query(
      "SELECT id FROM habilidades_biblioteca WHERE nome = ? AND id_jogador = ?",
      [habilidade.nome, req.session.userId]
    );
    if (existe.length > 0) {
      return res.status(400).json({ erro: "Essa habilidade já está na sua biblioteca" });
    }

    // Determinar o dano base (fixo) a ser salvo
    const danoBase = habilidade.dano_fixo || habilidade.valor || calcularDano(habilidade.nivel, habilidade.tipo);

    // Inserir na biblioteca
    await db.query(
      `INSERT INTO habilidades_biblioteca 
      (nome, tipo, modo, descricao, tipo_acao, efeito, id_jogador, is_geral, nivel_base, custo_vida_base, custo_sanidade_base, dano_base) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        habilidade.nome,
        habilidade.tipo,
        habilidade.modo,
        habilidade.descricao || null,
        habilidade.tipo_acao || 'ativa',
        habilidade.efeito || null,
        req.session.userId,
        0, // is_geral = false (pessoal)
        1, // nivel_base padrão
        habilidade.custo_vida || 0,
        habilidade.custo_sanidade || 0,
        danoBase
      ]
    );
    res.json({ ok: true, mensagem: "Habilidade salva na biblioteca!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
});


// Rota para buscar habilidades agrupadas por divindade
app.get("/habilidades/divindades", verificarLogin, async (req, res) => {
  try {
    const [habilidades] = await db.query(
      "SELECT * FROM habilidades_divindades ORDER BY divindade, nivel"
    );
    // Agrupar por divindade
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
});

// Rota para copiar habilidade de divindade para o personagem
app.post("/habilidades/copiarDivindade", verificarLogin, async (req, res) => {
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
    const pontos_totais = 3 + (nivel - 1) * 2;
    const [habilidadesAtuais] = await db.query(
      "SELECT * FROM habilidades WHERE id_personagem = ?",
      [id_personagem]
    );
    const usados = habilidadesAtuais.reduce((t, h) => t + Number(h.nivel || 0), 0);
    if (usados >= pontos_totais) {
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
    const novosPontos = pontos_totais - novosUsados;
    res.json({ ok: true, habilidade: novaHabilidade, pontos_disponiveis: novosPontos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
});

// ======================
// DELETAR HABILIDADE DA BIBLIOTECA PESSOAL
// ======================
app.post("/habilidades/biblioteca/deletar", verificarLogin, async (req, res) => {
  try {
    const { id_habilidade } = req.body;
    // Verifica se a habilidade pertence ao usuário logado e não é geral
    const [habilidade] = await db.query(
      "SELECT id, id_jogador, is_geral FROM habilidades_biblioteca WHERE id = ?",
      [id_habilidade]
    );
    if (habilidade.length === 0) {
      return res.status(404).json({ erro: "Habilidade não encontrada" });
    }
    if (habilidade[0].is_geral === 1) {
      return res.status(403).json({ erro: "Não é possível excluir habilidades gerais" });
    }
    if (habilidade[0].id_jogador !== req.session.userId) {
      return res.status(403).json({ erro: "Acesso negado" });
    }

    await db.query("DELETE FROM habilidades_biblioteca WHERE id = ?", [id_habilidade]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno" });
  }
});
// ======================
// FUNÇÃO RPG
// ======================
function calcularDano(nivel, tipo) {
  const base = {
    dano: ["1d4", "1d6", "1d8"],
    cura: ["1d6", "1d8", "1d10"],
    area: ["1d4", "1d6", "1d8"]
  };

  if (nivel <= 3) {
    return base[tipo]?.[nivel - 1] || "1d6";
  }

  const extra = nivel - 3;
  const qtd = 1 + Math.ceil(extra / 2);
  const dado = extra % 2 === 1 ? 6 : 8;

  return `${qtd}d${dado}`;
}

// ======================
// SERVER
// ======================
const port = 8080;

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});