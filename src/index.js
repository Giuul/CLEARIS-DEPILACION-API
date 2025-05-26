import express from 'express';
import { PORT } from "./config.js";
import { sequelize } from './db.js';
import "./models/User.js"
import "./models/Service.js"
import "./models/Turno.js"
import userRoutes from "./routes/user.routes.js"
import serviceRoutes from "./routes/service.routes.js"
import turnoRoutes from "./routes/turno.routes.js"

const app = express();

try {
    app.listen(PORT);
    app.use(userRoutes);
    app.use(serviceRoutes);
    app.use(turnoRoutes) 
    await sequelize.sync();
    console.log(`Server listening on port ${PORT}`);
} catch (error) {
    console.log(`There was an error on initialization`,);
}