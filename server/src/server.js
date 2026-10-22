import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

const { PORT = 5001, MONGO_URI, JWT_SECRET } = process.env;

if (!MONGO_URI || !JWT_SECRET) {
  console.error('Missing MONGO_URI or JWT_SECRET. Copy .env.example to .env and fill them in.');
  process.exit(1);
}

await connectDB(MONGO_URI);
app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
