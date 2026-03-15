import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}
const db = new Database(path.join(dbDir, 'app.db'));

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  CREATE TABLE IF NOT EXISTS menu (
    date TEXT,
    type TEXT, -- 'midi' or 'soir'
    dishId TEXT,
    dishName TEXT,
    PRIMARY KEY (date, type)
  );
  CREATE TABLE IF NOT EXISTS grocery_list (
    id TEXT PRIMARY KEY,
    name TEXT,
    checked INTEGER DEFAULT 0,
    alreadyHave INTEGER DEFAULT 0
  );
`);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/settings', (req, res) => {
    const stmt = db.prepare('SELECT * FROM settings');
    const rows = stmt.all();
    const settings = rows.reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
    res.json(settings);
  });

  app.post('/api/settings', (req, res) => {
    const { key, value } = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    stmt.run(key, value);
    io.emit('settings_updated', { key, value });
    res.json({ success: true });
  });

  app.get('/api/menu', (req, res) => {
    const stmt = db.prepare('SELECT * FROM menu');
    res.json(stmt.all());
  });

  app.post('/api/menu', (req, res) => {
    const { date, type, dishId, dishName, ingredients } = req.body;
    
    // Update menu
    const stmt = db.prepare('INSERT OR REPLACE INTO menu (date, type, dishId, dishName) VALUES (?, ?, ?, ?)');
    stmt.run(date, type, dishId, dishName);
    
    // Add ingredients to grocery list
    if (ingredients && Array.isArray(ingredients)) {
      const insertGrocery = db.prepare('INSERT OR IGNORE INTO grocery_list (id, name, checked, alreadyHave) VALUES (?, ?, 0, 0)');
      const updateGrocery = db.prepare('UPDATE grocery_list SET checked = 0, alreadyHave = 0 WHERE id = ?');
      
      const transaction = db.transaction((ings) => {
        for (const ing of ings) {
          const id = ing.toLowerCase().trim();
          const info = db.prepare('SELECT * FROM grocery_list WHERE id = ?').get(id);
          if (info) {
             updateGrocery.run(id);
          } else {
             insertGrocery.run(id, ing.trim());
          }
        }
      });
      transaction(ingredients);
    }
    
    io.emit('menu_updated');
    io.emit('grocery_updated');
    res.json({ success: true });
  });

  app.delete('/api/menu', (req, res) => {
    const { date, type } = req.body;
    const stmt = db.prepare('DELETE FROM menu WHERE date = ? AND type = ?');
    stmt.run(date, type);
    io.emit('menu_updated');
    res.json({ success: true });
  });

  app.get('/api/grocery', (req, res) => {
    const stmt = db.prepare('SELECT * FROM grocery_list');
    res.json(stmt.all());
  });

  app.post('/api/grocery', (req, res) => {
    const { items } = req.body;
    if (items && Array.isArray(items)) {
      const insertGrocery = db.prepare('INSERT OR IGNORE INTO grocery_list (id, name, checked, alreadyHave) VALUES (?, ?, 0, 0)');
      const updateGrocery = db.prepare('UPDATE grocery_list SET checked = 0, alreadyHave = 0 WHERE id = ?');
      
      const transaction = db.transaction((ings) => {
        for (const ing of ings) {
          const id = ing.toLowerCase().trim();
          const info = db.prepare('SELECT * FROM grocery_list WHERE id = ?').get(id);
          if (info) {
             updateGrocery.run(id);
          } else {
             insertGrocery.run(id, ing.trim());
          }
        }
      });
      transaction(items);
      io.emit('grocery_updated');
    }
    res.json({ success: true });
  });

  app.put('/api/grocery', (req, res) => {
    const { id, checked, alreadyHave } = req.body;
    
    const updates = [];
    const params = [];
    if (checked !== undefined) {
      updates.push('checked = ?');
      params.push(checked ? 1 : 0);
    }
    if (alreadyHave !== undefined) {
      updates.push('alreadyHave = ?');
      params.push(alreadyHave ? 1 : 0);
    }
    
    if (updates.length > 0) {
      params.push(id);
      const stmt = db.prepare(`UPDATE grocery_list SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(...params);
      io.emit('grocery_updated');
    }
    
    res.json({ success: true });
  });

  app.delete('/api/grocery', (req, res) => {
    const { id } = req.body;
    const stmt = db.prepare('DELETE FROM grocery_list WHERE id = ?');
    stmt.run(id);
    io.emit('grocery_updated');
    res.json({ success: true });
  });
  
  app.post('/api/grocery/clear', (req, res) => {
    const stmt = db.prepare('DELETE FROM grocery_list');
    stmt.run();
    io.emit('grocery_updated');
    res.json({ success: true });
  });

  // Socket.io connections
  io.on('connection', (socket) => {
    console.log('Client connected');
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
