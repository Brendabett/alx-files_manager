import express from 'express';
import { env } from 'process';
import router from './routes';

const port = env.PORT ? env.PORT : 5000;
const app = express();

app.use(express.json());
app.use(router);

app.listen(port, () => console.log(`Server connected at port ${port}`));
