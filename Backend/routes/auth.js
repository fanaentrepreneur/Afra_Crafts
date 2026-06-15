import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim()) return res.status(400).json({ error: 'Username is required' });

  const normalized = username.trim().toLowerCase();
  const user = await User.findOne({ username: normalized, role: 'admin' });

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!password) return res.status(400).json({ error: 'Password is required' });

  const valid = await bcrypt.compare(password, user.passwordHash || '');
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  res.json({ role: user.role, username: user.fullName, rawUsername: user.username });
});

router.put('/change-password', async (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword) {
    return res.status(400).json({ error: 'Username and new password are required' });
  }
  const user = await User.findOne({ username: username.trim().toLowerCase(), role: 'admin' });
  if (!user) return res.status(404).json({ error: 'Admin not found' });

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: 'Password updated successfully' });
});

export default router;
