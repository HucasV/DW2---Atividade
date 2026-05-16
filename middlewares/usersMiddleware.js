app.use((req, res, next) => {
  if (req.session.userId) {
    res.locals.user = {
      id: req.session.userId,
      role: req.session.userRole
    };
  } else {
    res.locals.user = null;
  }
  next();
});

app.use(async (req, res, next) => {
  if (req.session.userId) {
    try {
      const db = require("./config/db");
      const [rows] = await db.query("SELECT id, nome, email, role, avatar FROM jogador WHERE id = ?", [req.session.userId]);
      if (rows.length > 0) {
        res.locals.user = {
          id: rows[0].id,
          nome: rows[0].nome,
          role: rows[0].role,
          avatar: rows[0].avatar
        };
      } else {
        res.locals.user = null;
      }
    } catch (err) {
      console.error(err);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});