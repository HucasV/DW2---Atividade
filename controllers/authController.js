// controllers/authController.js
const bcrypt = require("bcrypt");
const JogadorModel = require("../models/JogadorModel");

async function exibirCadastro(req, res) {
  res.render("cadastro", { erro: null });
}

async function cadastrar(req, res) {
  const { nome, email, senha, role } = req.body;
  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(senha, saltRounds);
    await JogadorModel.create({ nome, email, senhaHash: hash, role });
    res.redirect("/login");
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.send("Email já cadastrado");
    }
    console.error(err);
    res.send("Erro ao cadastrar");
  }
}

async function exibirLogin(req, res) {
  res.render("login", { erro: null });
}

async function login(req, res) {
  const { email, senha } = req.body;
  const usuario = await JogadorModel.findByEmail(email);
  if (!usuario) {
    return res.render("login", { erro: "Usuário não encontrado" });
  }
  const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
  if (!senhaCorreta) {
    return res.render("login", { erro: "Senha incorreta" });
  }
  req.session.userId = usuario.id;
  req.session.userRole = usuario.role;
  res.redirect("/");
}

function logout(req, res) {
  req.session.destroy();
  res.redirect("/login");
}

function home(req, res) {
  res.render("home", { user: { id: req.session.userId, role: req.session.userRole } });
}

module.exports = { exibirCadastro, cadastrar, exibirLogin, login, logout, home };