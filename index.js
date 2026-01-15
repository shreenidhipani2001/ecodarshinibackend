import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'EcoDarshini Backend is running 🚀',
    status: 'OK'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
