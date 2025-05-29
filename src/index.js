import express from 'express';
import cors from 'cors';
import { PORT } from "./config.js";
import { sequelize } from './db.js';
import "./models/User.js"
import "./models/Service.js"
import "./models/Turno.js"
import userRoutes from "./routes/user.routes.js"
import serviceRoutes from "./routes/service.routes.js"
import turnoRoutes from "./routes/turno.routes.js"
import loginRoutes from "./routes/login.routes.js"

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(userRoutes);
app.use(serviceRoutes);
app.use(turnoRoutes);
app.use(loginRoutes);

async function main() {
  try {
    await sequelize.sync({ force: false });
    console.log('Base de datos conectada y sincronizada.');

    app.listen(3000, () => console.log('Server on 3000'));

  } catch (error) {
    console.error(`Hubo un error en la inicialización:`, error);
  }
}


main(); 