
function mostrarPersonagem(nome, classe, descricao, img) {
  document.getElementById("detalhes").innerHTML = `
    <h2>${nome}</h2>
    <img src="/${img}" class="img-personagem">
    <p><strong>Classe:</strong> ${classe}</p>
    <p>${descricao}</p>
  `;
}


function toggleNPC(id) {
  const el = document.getElementById(id);

  if (el.style.display === "block") {
    el.style.display = "none";
  } else {
    el.style.display = "block";
  }
}
