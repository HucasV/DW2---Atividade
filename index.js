// app.js
const express = require("express");
const session = require("express-session");
const path = require("path");
const app = express();
const carregarUsuario = require("./middlewares/userMiddleware");
// Configurações
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use(session({
  secret: "segredo_rpg",
  resave: false,
  saveUninitialized: false
}));
app.set("view engine", "ejs");

app.use(carregarUsuario);


// Importar rotas
const authRoutes = require("./routes/authRoutes");
const perfilRoutes = require("./routes/perfilRoutes");
const personagemRoutes = require("./routes/personagemRoutes");
const habilidadeRoutes = require("./routes/habilidadeRoutes");
const campanhaRoutes = require("./routes/campanhaRoutes");
const regrasRoutes = require("./routes/regrasRoutes");

// Usar rotas
app.use(authRoutes);
app.use(perfilRoutes);
app.use(personagemRoutes);
app.use(habilidadeRoutes);
app.use(campanhaRoutes);
app.use(regrasRoutes);

const PORT = 8080;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));