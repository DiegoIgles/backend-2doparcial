require('dotenv').config();
const cors = require('cors');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const socketHandler = require('./sockets/socketHandler');
const userRoutes = require('./routes/userRoutes');
const sequelize = require('./config/database');
const projectRoutes = require('./routes/ProjectRoutes');
const proyectoClaseRoutes = require('./routes/proyectoClase');

const ProyectoUI = require('./models/ProyectoUI');
const User = require('./models/user');
const ProyectoClase = require('./models/ProyectoClase');

const app = express();
const server = http.createServer(app);

// Habilitar CORS de forma dinámica
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', 
  methods: ['GET', 'POST']
}));

// Middleware para parsear JSON
app.use(express.json());

// Definir las rutas de la API
app.use('/api', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/proyecto-clase', proyectoClaseRoutes);

// Conectar los WebSockets
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  }
});

// Conectar el manejo de eventos WebSocket
socketHandler(io);

// Definir las relaciones entre los modelos
ProyectoUI.hasMany(User, { foreignKey: 'proyectoId' });
User.belongsTo(ProyectoUI, { foreignKey: 'proyectoId' });

ProyectoClase.hasMany(User, { foreignKey: 'proyectoClaseId' });
User.belongsTo(ProyectoClase, { foreignKey: 'proyectoClaseId' });

// Sincronizar la base de datos y luego iniciar el servidor
sequelize.sync({ force: false })
  .then(() => {
    
    const PORT = process.env.PORT || 4000; // 👈 Aquí el cambio importante
    server.listen(PORT, () => {
      console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al sincronizar la base de datos:', error);
  });
