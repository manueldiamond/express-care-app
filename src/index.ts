import app from './app';
import { initNotificationSocket } from './socket';
import http from 'http';

const PORT = Number(process.env.PORT) || 3000;
const server = http.createServer(app);
initNotificationSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
