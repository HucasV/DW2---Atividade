const multer = require("multer");
const path = require("path");

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

module.exports = { upload, uploadAvatar };