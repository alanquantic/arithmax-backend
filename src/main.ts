/* eslint-disable no-console */
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { prisma } from './lib/prisma';
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

initializeRoutes(app);

async function start() {
  try {
    await prisma.$connect();
    console.log('Conexión a la base de datos establecida');

    app.listen(port, () => {
      console.log(`Servidor escuchando en http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error al iniciar la aplicación:', error);
    process.exit(1);
  }
}

start();
