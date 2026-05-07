const multer = require("multer");
const path = require("path");

const storagePersonagem = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const storageAvatar = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/avatars/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const uploadPersonagem = multer({
  storage: storagePersonagem
});

const uploadAvatar = multer({
  storage: storageAvatar
});

module.exports = {
  uploadPersonagem,
  uploadAvatar
};