const cors = require('cors');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io'); // Asegúrate de tener esta importación
const socketHandler = require('./sockets/socketHandler');
const userRoutes = require('./routes/userRoutes');
const sequelize = require('./config/database');
const projectRoutes = require('./routes/ProjectRoutes');
const proyectoClaseRoutes = require('./routes/proyectoClase'); // Importamos las rutas de ProyectoClase

// Importar los modelos
const ProyectoUI = require('./models/ProyectoUI');
const User = require('./models/user');
const ProyectoClase = require('./models/ProyectoClase');

const app = express();
const server = http.createServer(app);

// Habilitar CORS para permitir solicitudes del frontend
app.use(cors());

// Middleware para parsear JSON
app.use(express.json());

// Definir las rutas de la API
app.use('/api', userRoutes); // Todas las rutas relacionadas con usuarios estarán bajo /api
app.use('/api/projects', projectRoutes);
app.use('/api/proyecto-clase', proyectoClaseRoutes); // Rutas para los proyectos de clase

// Conectar los WebSockets
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',  // Permitir conexiones WebSocket desde el frontend
    methods: ['GET', 'POST'],
  }
});

// Conectar el manejo de eventos WebSocket
socketHandler(io);  // Pasa la instancia de socket.io al manejador de sockets

// Definir las relaciones entre los modelos
ProyectoUI.hasMany(User, { foreignKey: 'proyectoId' });  // Un ProyectoUI tiene muchos User
User.belongsTo(ProyectoUI, { foreignKey: 'proyectoId' });  // Un User pertenece a un ProyectoUI


// Definir las relaciones entre los modelos
ProyectoClase.hasMany(User, { foreignKey: 'proyectoClaseId' });  // Un ProyectoUI tiene muchos User
User.belongsTo(ProyectoClase, { foreignKey: 'proyectoClaseId' });  // Un User pertenece a un ProyectoUI

// Sincronizar la base de datos y luego iniciar el servidor
sequelize.sync({ force: false })  // Usa force: true para eliminar las tablas y crear de nuevo (en desarrollo)
  .then(() => {
    server.listen(4000, () => {
      console.log('🚀 Servidor iniciado en puerto 4000');
    });
  })
  .catch((error) => {
    console.error('Error al sincronizar la base de datos:', error);
  });
