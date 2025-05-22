import express from 'express';
import { PORT } from "./config.js";
import userRoutes from "../routes/user.routes.js";

const app = express();

app.listen(PORT);
app.use(userRoutes);
console.log(`Server listening on port ${PORT}`);