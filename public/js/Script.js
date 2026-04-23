
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

document.addEventListener('DOMContentLoaded', function() {
  let cropper = null;

  const inputImagem = document.getElementById('inputImagem');
  const imagemCropper = document.getElementById('imagemCropper');
  const cropperContainer = document.getElementById('cropperContainer');
  const btnSelecionar = document.getElementById('selecionarImagemBtn');
  const btnAplicar = document.getElementById('aplicarCropBtn');
  const canvasPreview = document.getElementById('canvasPreview');
  const previewArea = document.getElementById('previewArea');
  const hiddenInput = document.getElementById('avatarCropped');

  if (!btnSelecionar) {
    console.error('Botão de selecionar imagem não encontrado');
    return;
  }

  // Abrir seletor de arquivos
  btnSelecionar.addEventListener('click', () => {
    inputImagem.click();
  });

  // Quando arquivo é selecionado
  inputImagem.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      imagemCropper.src = e.target.result;
      cropperContainer.style.display = 'block';
      if (cropper) cropper.destroy();
      cropper = new Cropper(imagemCropper, {
        aspectRatio: 1 / 1,   // Quadrado
        viewMode: 1,
        autoCropArea: 0.8,
        dragMode: 'move',
        cropBoxResizable: true,
        background: false,
      });
    };
    reader.readAsDataURL(file);
  });

  // Aplicar recorte
  btnAplicar.addEventListener('click', () => {
    if (!cropper) {
      alert('Selecione uma imagem primeiro.');
      return;
    }
    const croppedCanvas = cropper.getCroppedCanvas({
      width: 300,
      height: 300,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });
    if (!croppedCanvas) {
      alert('Falha ao gerar recorte.');
      return;
    }
    // Exibir preview
    canvasPreview.width = 150;
    canvasPreview.height = 150;
    const ctx = canvasPreview.getContext('2d');
    ctx.drawImage(croppedCanvas, 0, 0, 150, 150);
    previewArea.style.display = 'block';

    // Converter para base64 e armazenar
    const base64Image = croppedCanvas.toDataURL('image/jpeg', 0.9);
    hiddenInput.value = base64Image;
    alert('Recorte aplicado! A imagem será salva ao enviar o formulário.');
  });
});