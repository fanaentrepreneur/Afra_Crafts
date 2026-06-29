import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import connectDB from './config/db.js';
import User from './models/User.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import authRoutes from './routes/auth.js';
import offerRoutes from './routes/offers.js';
const app = express();
const PORT = process.env.PORT || 5000;

connectDB().then(seedAdmin);

async function seedAdmin() {
  try {
    const existing = await User.findOne({ role: 'admin' });
    if (!existing) {
      const hash = await bcrypt.hash('afraadmin123', 10);
      await User.create({ username: 'afraadmin', fullName: 'Afra Admin', passwordHash: hash, role: 'admin' });
      console.log('✓ Default admin seeded  username=afraadmin  password=afraadmin123');
    }
  } catch (e) {
    console.error('Seed error:', e.message);
  }
}

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://192.168.131.143:5173'
];

if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
}));

app.use(express.json({ limit: '20mb' }));

app.get('/', (req, res) => res.json({ message: 'Afra Crafts backend is running' }));

app.use('/api/auth',       authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/offers',     offerRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
