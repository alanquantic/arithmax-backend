/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { initializeRoutes } from './routes/routes';
dotenv.config();
const app = express();

const port = process.env.PORT ?? 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.get('/', (req, res) =>
  res.status(200).json({
    message: 'API running',
  })
);

app.listen(port, async () => {
  initializeRoutes(app);

  const prisma = new PrismaClient();

  await prisma
    .$connect()
    .then(() => {
      console.log('Conexión a la base de datos establecida');
    })
    .catch((error: Error) => {
      console.error('Error al conectar a la base de datos:', error);
    });
});
