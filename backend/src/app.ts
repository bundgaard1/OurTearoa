import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import apiRouter from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// All REST endpoints live under /api (see src/routes/).
app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});