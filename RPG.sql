create database if not exists RPG;
use RPG;
create table if not EXISTS jogador(
id int auto_increment primary key,
nome varchar(255),
/* preciso de um sistema que verifica email e senha*/
email varchar(255) unique,
senha varchar(255)
);
create table if not EXISTS personagens(
id int auto_increment primary key,
Nome VARCHAR(255),
Nivel int,
descricao LONGTEXT,
forca int,
agilidade int,
constituicao int,
intelecto int,
atencao int,
estabilidade int,
vida_atual int,
sanidade_atual int,
id_jogador int,
    FOREIGN KEY (id_jogador) REFERENCES Jogador(id)
        ON DELETE CASCADE  
);

/* decidi salvar a vida, para calcular dano internamente, a questão, é que não sei como fazer, o node salvar a vida atual, e enviar para o banco*/

SELECT * FROM jogador;
ALTER TABLE personagens ADD imagem VARCHAR(255);



CREATE TABLE habilidades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255),
  nivel INT DEFAULT 1,
  tipo VARCHAR(50), -- dano ou cura
  modo VARCHAR(50), -- singular ou area
  id_personagem INT,

  FOREIGN KEY (id_personagem) REFERENCES personagens(id)
    ON DELETE CASCADE
);

ALTER TABLE personagens ADD xp INT DEFAULT 0;
SELECT id, nome, nivel FROM personagens;
ALTER TABLE personagens ADD COLUMN vida_max_custom INT DEFAULT NULL;

SELECT id, nome, nivel, forca, constituicao, vida_atual, vida_max_custom 
FROM personagens WHERE id = 5;

ALTER TABLE personagens CHANGE Nivel nivel INT;

ALTER TABLE personagens CHANGE Nome nome VARCHAR(255);
ALTER TABLE personagens CHANGE Descricao descricao LONGTEXT;
-- e assim por diante...

ALTER TABLE personagens ADD COLUMN sanidade_max_custom INT DEFAULT NULL;

CREATE TABLE habilidades_biblioteca (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  tipo ENUM('dano', 'cura') NOT NULL,
  modo ENUM('alvo_unico', 'area') NOT NULL,
  nivel_base INT DEFAULT 1,
  is_geral BOOLEAN DEFAULT FALSE,
  id_jogador INT NULL, -- se não for geral, pertence a um jogador
  FOREIGN KEY (id_jogador) REFERENCES jogador(id) ON DELETE CASCADE
);

-- Tabela habilidades (personagem)
ALTER TABLE habilidades 
ADD COLUMN descricao TEXT,
ADD COLUMN tipo_acao ENUM('ativa', 'passiva') DEFAULT 'ativa',
ADD COLUMN custo_vida INT DEFAULT 0,
ADD COLUMN custo_sanidade INT DEFAULT 0,
ADD COLUMN efeito TEXT;

-- Tabela habilidades_biblioteca (para reutilização)
ALTER TABLE habilidades_biblioteca 
ADD COLUMN descricao TEXT,
ADD COLUMN tipo_acao ENUM('ativa', 'passiva') DEFAULT 'ativa',
ADD COLUMN custo_vida_base INT DEFAULT 0,
ADD COLUMN custo_sanidade_base INT DEFAULT 0,
ADD COLUMN efeito TEXT;

CREATE TABLE habilidades_divindades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  divindade VARCHAR(50) NOT NULL, -- 'Rei inforcado', 'Rei Escarlate', 'Mekhane', 'Mentora'
  nivel INT NOT NULL, -- 1 a 4
  nome VARCHAR(100) NOT NULL,
  dano VARCHAR(50), -- ex: '5d10', '6d8', '0' para sem dano
  tipo ENUM('dano', 'cura', 'efeito') DEFAULT 'dano',
  descricao TEXT,
  efeito TEXT,
  custo_tipo ENUM('vida', 'sanidade', 'ambos') DEFAULT 'ambos', -- 'ambos' = metade de cada
  -- Como o custo é dinâmico, não armazenamos valores fixos
  is_geral BOOLEAN DEFAULT 1 -- pois são gerais
);


-- Tabela de habilidades das divindades
CREATE TABLE IF NOT EXISTS habilidades_divindades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  divindade VARCHAR(50) NOT NULL,
  nivel INT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  dano VARCHAR(50),
  tipo ENUM('dano', 'cura', 'efeito') DEFAULT 'dano',
  descricao TEXT,
  efeito TEXT,
  custo_tipo ENUM('vida', 'sanidade', 'ambos') DEFAULT 'ambos',
  is_geral BOOLEAN DEFAULT 1
);

-- Inserir habilidades (vou resumir alguns exemplos, você completa com os dados fornecidos)
INSERT INTO habilidades_divindades (divindade, nivel, nome, dano, tipo, descricao, efeito, custo_tipo) VALUES
('Rei inforcado', 1, 'Decadencia', '5d10', 'dano', 'Uma habilidade de 5d10 de dano em alvo único, o alvo fica sobre "decadência do rei" perdendo 1 de modificador de ataque e defesa por turno, ao passar em um teste de vigor DT 20+vigor, gasta metade', 'perda de modificador', 'ambos'),
('Rei inforcado', 2, 'Corromper', '4d10+15', 'dano', 'Uma vez por sessão, você pode corromper algo com o toque do rei.', 'Inimigos ou objetos corrompidos ficam com desvantagem em testes físicos', 'ambos'),
('Rei inforcado', 3, 'Decomposição onírica', '5d8', 'dano', 'Corrompe a mente do alvo, dando dano extremo e apagando um momento da vida dele', 'Apaga uma memória (efeito aleatório nos atributos)', 'ambos'),
('Rei inforcado', 4, 'Profanar', '8d10+20', 'dano', 'Dano extremo, o alvo se torna um ser profano, o mundo o rejeita', 'Anula cura passiva, desvantagem em testes até deixar de ser profano', 'ambos'),

('Rei Escarlate', 1, 'Fúria Escarlate', '6d10', 'dano', 'Gera uma erupção escarlate que destrói inimigos', 'Nenhum', 'ambos'),
('Rei Escarlate', 2, 'Lodo Vermelho', '8d10', 'dano', 'Cria uma poça de lodo vermelho que prende o alvo', 'Deixa o alvo preso, com desvantagem em testes de agilidade', 'ambos'),
('Rei Escarlate', 3, 'Fúria do Rei', '3d10', 'efeito', 'Aumento de todo dano em 3d10', 'Aumento nos atributos de força, vigor e agilidade em 3', 'ambos'),
('Rei Escarlate', 4, 'DESTRUIR, DESTRUIR, DESTRUIR', '2d100', 'dano', 'O usuário explode, tudo a sua volta vira pura destruição', 'DESTRUIR, DESTRUIR, DESTRUIR', 'ambos'),

('Mekhane', 1, 'Metal Cinético', '3d10', 'dano', 'Permite manipular livremente o metal, de forma passiva ou ofensiva', 'Essa habilidade não tem custo', 'ambos'),  -- mas custo será metade mesmo assim? ajuste depois
('Mekhane', 2, 'Mecanizado', '0', 'efeito', 'Mecaniza qualquer parte do corpo, concedendo vantagem e +5 em testes', 'Vantagem e +5 em testes', 'ambos'),
('Mekhane', 3, 'Microrrobôs', '4d10+20', 'cura', 'Cria robôs microscópicos que curam o alvo', 'O alvo recebe RD permanente não acumulativa de +10', 'ambos'),
('Mekhane', 4, 'Mundo de Metal', '10d10', 'dano', 'Escolhe um alvo que vira sucata, partes metálicas e enferrujadas', 'Desmembra 1 membro (exceto cabeça)', 'ambos'),

('Mentora', 1, 'Arrancar Página', '6d8', 'dano', 'A Mentora arranca a página da história de alguém', 'Deixa exausto com desvantagem até descansar. Essa habilidade não tem custo', 'ambos'),
('Mentora', 2, 'Ler', '0', 'efeito', 'Lê uma página do livro sobre algo ou alguém', 'Faça uma pergunta, o mestre deve responder verdadeiramente (uma vez por item/pessoa)', 'ambos'),
('Mentora', 3, 'Invocar Biblioteca', 'acumulativo', 'dano', 'Cria uma biblioteca que acumula informação na mente do alvo', 'O alvo recebe dano contínuo', 'ambos'),
('Mentora', 4, 'Reescrever História', '0', 'efeito', 'Recria uma parte inteira da história de algo ou alguém', 'O alvo recebe qualquer efeito permanente (positivo ou negativo) ou perde algo permanentemente. O usuário perde metade da vida e sanidade permanentemente', 'ambos');

ALTER TABLE habilidades ADD COLUMN custo_vida INT DEFAULT 0;

-- Adiciona coluna de papel (jogador ou mestre)
ALTER TABLE jogador ADD COLUMN role ENUM('jogador', 'mestre') DEFAULT 'jogador';

-- Adiciona coluna para avatar (foto de perfil)
ALTER TABLE jogador ADD COLUMN avatar VARCHAR(255) DEFAULT NULL;

-- Adiciona coluna para controlar se a habilidade pode ser upada
ALTER TABLE habilidades ADD COLUMN is_upgradeable BOOLEAN DEFAULT TRUE;

-- Adiciona coluna de dano base na biblioteca (para armazenar o dano fixo)
ALTER TABLE habilidades_biblioteca ADD COLUMN dano_base VARCHAR(50) DEFAULT NULL;

ALTER TABLE habilidades ADD COLUMN dano_fixo VARCHAR(50) DEFAULT NULL;

-- Tabela de campanhas
CREATE TABLE campanhas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  id_mestre INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_mestre) REFERENCES jogador(id) ON DELETE CASCADE
);

-- Tabela de associação jogador <-> campanha (quem participa como jogador)
CREATE TABLE campanha_jogadores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_campanha INT NOT NULL,
  id_jogador INT NOT NULL,
  FOREIGN KEY (id_campanha) REFERENCES campanhas(id) ON DELETE CASCADE,
  FOREIGN KEY (id_jogador) REFERENCES jogador(id) ON DELETE CASCADE,
  UNIQUE KEY (id_campanha, id_jogador)
);

-- Tabela de associação personagem <-> campanha (qual personagem cada jogador usa na campanha)
CREATE TABLE campanha_personagens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_campanha INT NOT NULL,
  id_jogador INT NOT NULL,
  id_personagem INT NOT NULL,
  FOREIGN KEY (id_campanha) REFERENCES campanhas(id) ON DELETE CASCADE,
  FOREIGN KEY (id_jogador) REFERENCES jogador(id) ON DELETE CASCADE,
  FOREIGN KEY (id_personagem) REFERENCES personagens(id) ON DELETE CASCADE,
  UNIQUE KEY (id_campanha, id_jogador)  -- um jogador só pode ter um personagem por campanha
);

CREATE TABLE solicitacoes_campanha (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_campanha INT,
  id_jogador INT,
  status ENUM('pendente', 'aceita', 'recusada') DEFAULT 'pendente',
  data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_campanha) REFERENCES campanhas(id) ON DELETE CASCADE,
  FOREIGN KEY (id_jogador) REFERENCES jogador(id) ON DELETE CASCADE
);

ALTER TABLE habilidades_biblioteca ADD COLUMN is_upgradeable_original TINYINT(1) DEFAULT 1;