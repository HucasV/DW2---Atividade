const express = require("express");

const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');

// HOME
app.get("/", function (req, res) {
  const mapa = {img: "img/Mapa1.webp"}
  res.render("home");
});

// PERSONAGENS
app.get("/personagens", function (req, res) {
  const personagens = [
    { nome: "Yumei", classe: "Euclid", descricao: "a aparência de uma jovem humana do sexo feminino, estimada entre 18 e 22 anos, com traços asiáticos comuns. O cabelo da entidade é naturalmente dividido em duas cores distintas: preto e branco, sem evidência de pigmentação artificia", img: "img/Yumei.webp"},
    { nome: "Doren", classe: "Euclid", descricao: "SCP-1618 é um indivíduo humanoide do sexo masculino, de aparência ███, identificado como ██████. A idade aparente do objeto é estimada em ███ anos, embora exames fisiológicos indiquem inconsistências que impedem confirmação precisa.", img:"img/doren.webp" },
    { nome: "Mizuichi", classe: "Keter", descricao: "uma entidade humanoide de constituição esguia que assume a aparência de um homem adulto Características visuais notáveis incluem: Cabelos longos, segmentados em múltiplas estruturas semelhantes a tentáculos. Olhos permanentemente obscurecidos pelos fios capilares. Presença de um organismo cefalóide aderido à região craniana, descrito como uma água-viva de coloração preta e vermelha, dotada de dentição e apêndices móveis.", img:"img/mizuichi.webp" }
  ];

  res.render("personagens", {
    personagens: personagens
  });
});

// DETALHE DO PERSONAGEM
app.get("/personagens/:nome", function (req, res) {
  const nome = req.params.nome;

  res.render("detalhesPersonagem", {
    nome: nome
  });
});

// REGRAS
app.get("/regras", function (req, res) {
  const regras = [
    "Sistema baseado em 1d20 + atributo",
    "Vitalidade = 10 + Vigor",
    "Testes de imunidade evitam mutação"
  ];

  res.render("regras", {
    regras: regras
  });
});

// HISTÓRIA
app.get("/historia", function (req, res) {

  const historia = "A historia do mundo";

  res.render("historia", {
    historia: historia
  });
});

const port = 8080;
app.listen(port, (error) => {
  if (error) {
    console.log(`ocorreu um erro ao iniciar o servidor! ${error}`);
  } else {
    console.log(`Servidor iniciado com sucesso em http://localhost:${port}`);
  }
});