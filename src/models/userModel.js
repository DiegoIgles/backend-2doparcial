const User = require('./user');  // Importamos el modelo de usuario

// Crear un nuevo usuario
const createUser = async (email, password, role) => {
  try {
    const newUser = await User.create({
      email: email,
      password: password,
      role: role || 'user'
    });
    return newUser;
  } catch (error) {
    throw error;
  }
};

// Obtener un usuario por correo electrónico
const getUserByEmail = async (email) => {
  try {
    return await User.findOne({ where: { email } });
  } catch (error) {
    throw error;
  }
};

// Actualizar un usuario
const updateUserRole = async (userId, role) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('Usuario no encontrado');
    user.role = role;
    await user.save();
    return user;
  } catch (error) {
    throw error;
  }
};

// Obtener todos los usuarios
const getUsers = async () => {
  try {
    return await User.findAll();
  } catch (error) {
    throw error;
  }
};

// Eliminar un usuario
const deleteUser = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('Usuario no encontrado');
    await user.destroy();
    return { message: 'Usuario eliminado exitosamente' };
  } catch (error) {
    throw error;
  }
};
// Obtener un usuario por ID
const getUserById = async (userId) => {
  try {
    return await User.findByPk(userId); // Buscar el usuario por su ID
  } catch (error) {
    throw error;
  }
};
module.exports = {
  createUser,
  getUserByEmail,
  updateUserRole,
  getUsers,
  deleteUser,
  getUserById, // Añadir la nueva función aquí

};
