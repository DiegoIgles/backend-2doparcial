// sockets/socketHandler.js

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🟢 Usuario conectado vía WebSocket');

    // Unirse a una sala específica por proyecto
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`👥 Usuario se unió a la sala: ${roomId}`);
    });

    // Salir de una sala
    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      console.log(`🚪 Usuario salió de la sala: ${roomId}`);
    });

    // Escuchar y reenviar los cambios en el canvas
    socket.on('canvas-update', ({ roomId, json }) => {
      // Enviar los cambios a todos menos al emisor
      socket.to(roomId).emit('canvas-update', json);
    });

    socket.on('disconnect', () => {
      console.log('🔴 Usuario desconectado');
    });
  });
};
