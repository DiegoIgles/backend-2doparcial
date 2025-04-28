// src/routes/userRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { verifyToken, verifyAdmin } = require('../middleware/auth'); // Importamos los middlewares

const router = express.Router();

// Ruta para registrar un nuevo usuario
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { username } });

    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya está registrado' });
    }

    // Hashear la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear un nuevo usuario
    const newUser = await User.create({ username, password: hashedPassword });

    // Generar un token JWT
    const token = jwt.sign({ id: newUser.id, username: newUser.username, role: newUser.role }, 'SECRET_KEY', { expiresIn: '1h' });

    res.status(201).json({ message: 'Usuario registrado exitosamente', token });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error al registrar usuario', error: error.message || error });
  }
});

// Ruta para iniciar sesión
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, 'SECRET_KEY', { expiresIn: '1h' });

    res.json({ message: 'Inicio de sesión exitoso', token });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message || error });
  }
});

// Ruta para obtener todos los usuarios (solo admin)
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'role','proyectoId', 'proyectoClaseId'], // Solo traeremos los campos necesarios
    });
    res.json(users); // Devolvemos la lista de usuarios
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
});


// src/routes/userRoutes.js

router.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Asegúrate de que estás utilizando 'User' y no 'UserModel'
    const user = await User.findByPk(id);  // Aquí estás buscando el usuario por su ID

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Eliminar el usuario
    await user.destroy();
    res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'No se pudo eliminar el usuario', error: error.message });
  }
});



// Ruta para editar un usuario
router.put('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, role } = req.body;

  try {
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Actualizar los campos permitidos
    if (username) user.username = username;
    if (role) user.role = role;

    await user.save();
    res.status(200).json({ message: 'Usuario actualizado exitosamente', user });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
});
// Ruta para obtener un usuario por su ID
router.get('/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params; // Extraemos el ID del usuario de los parámetros de la URL

  try {
    const user = await User.findByPk(id); // Buscar al usuario en la base de datos usando el ID

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Devolver los datos del usuario sin la contraseña
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
});


module.exports = router;
