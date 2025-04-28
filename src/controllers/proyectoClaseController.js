// // src/controllers/proyectoClaseController.js
// const ProyectoClase = require('../models/ProyectoClase');
// const User = require('../models/user');

// // Función para obtener todos los proyectos de diagramas de clase
// const getAllProyectos = async (req, res) => {
//   try {
//     const proyectos = await ProyectoClase.findAll({
//       attributes: ['id', 'nombre', 'descripcion', 'createdAt']
//     });

//     res.status(200).json(proyectos);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Función para obtener un proyecto por ID
// const getProyectoById = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const proyecto = await ProyectoClase.findByPk(id);
//     if (!proyecto) {
//       return res.status(404).json({ message: 'ProyectoClase no encontrado' });
//     }

//     res.json(proyecto);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Función para crear un nuevo ProyectoClase
// const createProyectoClase = async (req, res) => {
//   const { nombre, descripcion, fabricJson } = req.body;

//   try {
//     const nuevoProyecto = await ProyectoClase.create({
//       nombre,
//       descripcion,
//       fabricJson,
//     });

//     res.status(201).json({
//       message: 'ProyectoClase creado con éxito',
//       nuevoProyecto,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// module.exports = {
//   getAllProyectos,
//   getProyectoById,
//   createProyectoClase,
// };
