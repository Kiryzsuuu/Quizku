require('dotenv').config();
const express   = require('express');
const http      = require('http');
const { Server }= require('socket.io');
const mongoose  = require('mongoose');
const path      = require('path');
const cors      = require('cors');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*', methods: ['GET','POST'] } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/quiz',     require('./routes/quiz'));
app.use('/api/session',  require('./routes/session'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/comments', require('./routes/comment'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/bgm',      require('./routes/bgm'));

require('./socket')(io);

async function seedAdmin() {
  const User = require('./models/User');
  try {
    const existing = await User.findOne({ email: 'maskiryz23@gmail.com' });
    if (!existing) {
      await User.create({
        name: 'Admin Quizku',
        email: 'maskiryz23@gmail.com',
        password: 'opet123',
        role: 'admin',
        avatar: '管'
      });
      console.log('[Seed] Admin maskiryz23@gmail.com dibuat');
    } else if (existing.role !== 'admin') {
      existing.role = 'admin';
      existing.avatar = '管';
      await existing.save();
      console.log('[Seed] maskiryz23@gmail.com diupgrade ke admin');
    }
  } catch (err) {
    console.error('[Seed] Gagal seed admin:', err.message);
  }
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('[MongoDB] Terhubung');
    await seedAdmin();
    server.listen(process.env.PORT || 3000, () => {
      console.log(`[Server] Berjalan di http://localhost:${process.env.PORT || 3000}`);
    });
  })
  .catch(err => {
    console.error('[MongoDB] Gagal terhubung:', err.message);
    process.exit(1);
  });
