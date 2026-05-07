// controllers/perfilController.js
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const JogadorModel = require("../models/JogadorModel");

// Garantir que o diretório de avatares existe
const avatarsDir = path.join(__dirname, "../public/uploads/avatars");
if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
}

async function exibirPerfil(req, res) {
  const usuario = await JogadorModel.findById(req.session.userId);
  res.render("perfil", { usuario });
}

async function atualizarPerfil(req, res) {
  try {
    const { nome, role, avatarCropped } = req.body;
    if (!nome) return res.status(400).send("Nome é obrigatório.");

    let avatarFilename = null;
    if (avatarCropped && avatarCropped.startsWith('data:image')) {
      // Remove o cabeçalho base64
      const base64Data = avatarCropped.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      avatarFilename = `avatar_${Date.now()}.jpg`;
      const caminho = path.join(avatarsDir, avatarFilename);
      await sharp(buffer).jpeg({ quality: 85 }).toFile(caminho);
      
      // Opcional: deletar avatar antigo? (buscar o avatar atual do usuário e deletar o arquivo)
      const usuarioAtual = await JogadorModel.findById(req.session.userId);
      if (usuarioAtual && usuarioAtual.avatar) {
        const oldAvatarPath = path.join(avatarsDir, usuarioAtual.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
    }

    // Atualiza no banco
    await JogadorModel.update(req.session.userId, { nome, role, avatar: avatarFilename });
    
    // Atualiza a sessão com o novo role
    req.session.userRole = role;
    
    res.redirect("/perfil");
  } catch (err) {
    console.error("Erro ao atualizar perfil:", err);
    res.status(500).send("Erro interno");
  }
}

module.exports = { exibirPerfil, atualizarPerfil };