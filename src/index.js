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

const app = express();


app.use(cors()); 
app.use(express.json());


app.use(userRoutes);
app.use(serviceRoutes);
app.use(turnoRoutes)

async function main() {
  try {
    await sequelize.sync({ force: false }); 
    console.log('Base de datos conectada y sincronizada.');
    app.listen(PORT, () => { 
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Hubo un error en la inicialización:`, error);
  }
}

main(); 