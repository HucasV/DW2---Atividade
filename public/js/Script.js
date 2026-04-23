
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
 const con = document.querySelector('[name="constituicao"]');
  const forca = document.querySelector('[name="forca"]');
  const preview = document.getElementById("previewVida");

  function atualizar() {
    const vida = 10 + Number(con.value || 0) + Number(forca.value || 0);
    preview.innerText = "Vida inicial: " + vida;
  }

  con.addEventListener("input", atualizar);
  forca.addEventListener("input", atualizar);

  