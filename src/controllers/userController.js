// src/controllers/userController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");  // Usaremos JWT para la autenticación
const { createUser, getUserByEmail, updateUserRole, getUsers } = require("../models/userModel");

const JWT_SECRET = "your_secret_key"; // Usa una clave secreta para JWT

// Registrar un nuevo usuario
const registerUser = async (req, res) => {
  const { email, password, role } = req.body;
  try {
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const result = await createUser(email, hashedPassword, role);
    res.status(201).json({ message: "Usuario creado con éxito", userId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Iniciar sesión de un usuario
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Correo electrónico o contraseña incorrectos" });
    }

    // Comparar las contraseñas
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Correo electrónico o contraseña incorrectos" });
    }

    // Generar el token JWT
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Inicio de sesión exitoso", token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Obtener los usuarios (solo para admins)
const getAllUsers = async (req, res) => {
  try {
    const users = await getUsers();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cambiar el rol de un usuario (solo para admins)
const updateRole = async (req, res) => {
  const { userId, role } = req.body;
  try {
    const result = await updateUserRole(userId, role);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.status(200).json({ message: "Rol actualizado con éxito" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  updateRole
};
