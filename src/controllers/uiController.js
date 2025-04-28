// // src/controllers/uiController.js
// const ProyectoUI = require('../models/ProyectoUI');  // Asegúrate de importar correctamente tu modelo de ProyectoUI
// const User = require('../models/user');  // Importamos el modelo de User para verificar que el usuario existe

// // Función para obtener la UI asociada a un usuario por su ID
// const getUi = async (req, res) => {
//   const { userId } = req.params;  // Obtener el ID del usuario desde los parámetros
//   try {
//     // Buscar la UI asociada al usuario en la base de datos
//     const uiData = await ProyectoUI.findOne({ where: { userId } });

//     // Si no se encuentra la UI, devolvemos un error
//     if (!uiData) {
//       return res.status(404).json({ message: 'No UI encontrada para este usuario' });
//     }

//     // Si se encuentra, respondemos con los datos de la UI
//     res.status(200).json(uiData);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Función para crear una nueva UI y asociarla a un usuario
// const createNewUi = async (req, res) => {
//   const { userId, nombre, descripcion, fabricJson } = req.body;  // Obtener los datos del cuerpo de la solicitud
//   try {
//     // Verificar que el usuario existe
//     const user = await User.findByPk(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'Usuario no encontrado' });
//     }

//     // Crear la nueva UI y asociarla al usuario
//     const newUi = await ProyectoUI.create({
//       userId,       // Asociamos la UI al usuario
//       nombre,
//       descripcion,
//       fabricJson,
//     });

//     // Respondemos con un mensaje de éxito y los datos de la nueva UI
//     res.status(201).json({ message: 'UI creada correctamente', newUi });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// module.exports = {
//   getUi,
//   createNewUi
// };
