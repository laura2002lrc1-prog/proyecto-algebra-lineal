import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'data.sqlite');
const db = new Database(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS ejercicios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria TEXT NOT NULL,
    titulo TEXT NOT NULL,
    enunciado TEXT NOT NULL,
    respuesta TEXT
  );
`);

// Seed opcional (solo si la tabla está vacía)
const count = db.prepare('SELECT COUNT(*) as c FROM ejercicios').get().c;
if (count === 0) {
  const seed = db.transaction(() => {
    const ins = db.prepare(
      'INSERT INTO ejercicios (categoria, titulo, enunciado, respuesta) VALUES (?, ?, ?, ?)'
    );

    // VECTORES Y ESPACIOS
    ins.run(
      'VECTORES Y ESPACIOS',
      'Norma y distancia',
      'Sea v = (3, -4). Calcula ||v|| y la distancia entre el origen y v.',
      '||v|| = 5; distancia = 5'
    );

    ins.run(
      'VECTORES Y ESPACIOS',
      'Producto escalar',
      'Calcula ( [1,2,3] · [4,0,-1] ).',
      '1'
    );

    ins.run(
      'VECTORES Y ESPACIOS',
      'Proyección (idea)',
      'Para u=(1,0) y w=(3,4), calcula la proyección de w sobre u.',
      'proj_u(w) = (3,0)'
    );

    // MATRICES Y SISTEMAS
    ins.run(
      'MATRICES Y SISTEMAS',
      'Determinante 2x2',
      'Para A = [[2,5],[1,3]], calcula det(A).',
      'det(A)=2*3-5*1=1'
    );

    ins.run(
      'MATRICES Y SISTEMAS',
      'Rango y determinante',
      'Para A = [[1,2],[2,4]], calcula det(A) y el rango.',
      'det = 0, rango = 1'
    );

    ins.run(
      'MATRICES Y SISTEMAS',
      'Sistema lineal (solución)',
      'Resuelve:\n' +
      'x + y = 3\n' +
      'x - y = 1',
      'x=2, y=1'
    );

    // TRANSFORMACIONES
    ins.run(
      'TRANSFORMACIONES',
      'Rotación 2D',
      'Escribe la matriz de rotación de ángulo θ en R^2.',
      '[[cos(θ), -sin(θ)],[sin(θ), cos(θ)]]'
    );

    ins.run(
      'TRANSFORMACIONES',
      'Escalamiento',
      'Transformación T(x,y)=(2x,-y). Escribe la matriz asociada en la base canónica.',
      '[[2,0],[0,-1]]'
    );

    ins.run(
      'TRANSFORMACIONES',
      'Reflexión',
      'Encuentra la matriz de la reflexión respecto del eje x (en R^2).',
      '[[1,0],[0,-1]]'
    );
  });
  seed();
}

app.get('/api/ejercicios', (req, res) => {
  const { categoria } = req.query;
  let rows;

  if (categoria) {
    rows = db
      .prepare('SELECT id, categoria, titulo, enunciado, respuesta FROM ejercicios WHERE categoria = ? ORDER BY id DESC')
      .all(categoria);
  } else {
    rows = db
      .prepare('SELECT id, categoria, titulo, enunciado, respuesta FROM ejercicios ORDER BY id DESC')
      .all();
  }

  res.json({ ok: true, data: rows });
});

app.post('/api/ejercicios', (req, res) => {
  const { categoria, titulo, enunciado, respuesta } = req.body || {};
  if (!categoria || !titulo || !enunciado) {
    return res.status(400).json({ ok: false, error: 'categoria, titulo y enunciado son requeridos' });
  }

  const info = db
    .prepare('INSERT INTO ejercicios (categoria, titulo, enunciado, respuesta) VALUES (@categoria, @titulo, @enunciado, @respuesta)')
    .run({ categoria, titulo, enunciado, respuesta: respuesta ?? null });

  const row = db
    .prepare('SELECT id, categoria, titulo, enunciado, respuesta FROM ejercicios WHERE id = ?')
    .get(info.lastInsertRowid);

  res.json({ ok: true, data: row });
});

app.delete('/api/ejercicios/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ ok: false, error: 'id inválido' });
  }

  const info = db.prepare('DELETE FROM ejercicios WHERE id = ?').run(id);
  res.json({ ok: true, deleted: info.changes });
});

const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});

