module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`✓ Client connected: ${socket.id}`);

    // Biometric events
    socket.on('biometric:started', (data) => {
      socket.broadcast.emit('biometric:started', data);
    });

    socket.on('biometric:success', (data) => {
      socket.broadcast.emit('biometric:success', data);
      io.emit('attendance:updated', { timestamp: new Date() });
    });

    socket.on('biometric:failed', (data) => {
      socket.broadcast.emit('biometric:failed', data);
    });

    // GPS events
    socket.on('gps:location_update', (data) => {
      socket.broadcast.emit('gps:location_update', data);
    });

    socket.on('gps:employee_in_range', (data) => {
      socket.broadcast.emit('gps:employee_in_range', data);
    });

    socket.on('gps:employee_out_of_range', (data) => {
      socket.broadcast.emit('gps:employee_out_of_range', data);
    });

    // Attendance events
    socket.on('attendance:check_in', (data) => {
      socket.broadcast.emit('attendance:check_in', data);
    });

    socket.on('attendance:check_out', (data) => {
      socket.broadcast.emit('attendance:check_out', data);
    });

    // Device events
    socket.on('device:connected', (data) => {
      socket.broadcast.emit('device:connected', data);
    });

    socket.on('device:disconnected', (data) => {
      socket.broadcast.emit('device:disconnected', data);
    });

    socket.on('device:error', (data) => {
      socket.broadcast.emit('device:error', data);
    });

    socket.on('disconnect', () => {
      console.log(`✗ Client disconnected: ${socket.id}`);
    });
  });
};
