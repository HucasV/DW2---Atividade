const express = require("express");

const app = express();

app.set('view engine', 'ejs');

/*app.get("/", function (req, res) {
  res.send("<h1>bem vindo ao meu primeiro site em node.js</h1>");
});

 app.get("/2", function (req, res) {
  res.send("<h1>bem vindo a segunda pagina</h1>");
}); */

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/clientes", function (req, res) {
  const listaClientes = ['jorge', 'douglas', 'luiz', 'demiurgo']
  res.render("clientes", {
    listaClientes : listaClientes
  });
})

app.get("/clientes/:clientes", function (req, res) {
  const clientes = req.params.clientes;
  res.render("detalhesClientes", {
    clientes:clientes,
  });
})

app.get("/Produtos", function (req, res) {
  const listaProdutos = ['celular', 'computador', 'tablet', 'demiurgo']
  res.render("Produtos", {
    listaProdutos : listaProdutos
  });
})

app.get("/Produtos/:produto", function (req, res) {
  const produto = req.params.produto;
  res.render("detalhesProduto", {
    produto:produto,
  });
})

app.get("/Servicos", function (req, res) {
  res.render("Servicos");
})


const port = 8080;
app.listen(port, (error) => {
  if (error) {
    console.log(`ocorreu um erro ao iniciar o servidor! ${error}`);
  } else {
    console.log(
      `Servidor iniciado com sucesso no endereço http://localhost:${port}`,
    );
  }
});
