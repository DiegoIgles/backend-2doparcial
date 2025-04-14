const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const User = require('../models/user');
const ProyectoUI = require('../models/ProyectoUI');

// Ruta para asignar un usuario a un proyecto (solo admin)
router.post('/assign-user', verifyToken, verifyAdmin, async (req, res) => {
  const { userId, proyectoId } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const proyecto = await ProyectoUI.findByPk(proyectoId);
    if (!proyecto) return res.status(404).json({ message: 'Proyecto no encontrado' });

    if (user.proyectoId && user.proyectoId !== proyectoId) {
      return res.status(400).json({ message: 'El usuario ya está asignado a otro proyecto' });
    }

    user.proyectoId = proyectoId;
    await user.save();

    res.json({ message: 'Usuario asignado correctamente al proyecto', user });
  } catch (error) {
    console.error('Error al asignar usuario:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// ✅ Ruta para que el admin vea todos los proyectos existentes
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const proyectos = await ProyectoUI.findAll({
      attributes: ['id', 'nombre', 'descripcion', 'createdAt']
    });

    res.status(200).json(proyectos);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ message: 'Error al obtener los proyectos', error: error.message });
  }
});

// ✅ Ruta para crear un nuevo ProyectoUI (solo admin)
router.post('/create', verifyToken, verifyAdmin, async (req, res) => {
  const { nombre, descripcion, fabricJson } = req.body;

  try {
    const nuevoProyecto = await ProyectoUI.create({
      nombre,
      descripcion,
      fabricJson,
    });

    res.status(201).json({
      message: 'ProyectoUI creado con éxito',
      nuevoProyecto,
    });
  } catch (error) {
    console.error('Error al crear ProyectoUI:', error);
    res.status(500).json({ message: 'Error al crear ProyectoUI', error: error.message });
  }
});

// Ruta para obtener el proyecto al que un usuario está asignado (sin verificar token)
router.get('/assigned-project/:userId', async (req, res) => {
  const { userId } = req.params; // Obtener el userId de los parámetros de la URL

  try {
    const user = await User.findByPk(userId, {
      include: {
        model: ProyectoUI,  // Incluir los detalles del proyecto relacionado
        attributes: ['id', 'nombre', 'descripcion'],  // Los atributos del proyecto que queremos devolver
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!user.proyectoId) {
      return res.status(404).json({ message: 'El usuario no está asignado a ningún proyecto' });
    }

    // Si el usuario tiene asignado un proyecto, devolver la información del proyecto
    res.json({
      message: 'Proyecto asignado encontrado',
      proyecto: user.ProyectoUI, // La información del proyecto asignado al usuario
    });
  } catch (error) {
    console.error('Error al obtener el proyecto asignado:', error);
    res.status(500).json({ message: 'Error al obtener el proyecto asignado', error: error.message });
  }
});
// Nueva ruta para obtener el proyecto por su ID (para cargarlo en el editor)
router.get('/edit-ui/:id', async (req, res) => {
  const { id } = req.params; // Obtener el ID del proyecto de los parámetros de la URL

  try {
    const proyecto = await ProyectoUI.findByPk(id);
    if (!proyecto) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    // Devolver el proyecto con sus detalles, incluyendo el JSON de la interfaz (fabricJson)
    res.json({
      message: 'Proyecto encontrado',
      proyecto,
    });
  } catch (error) {
    console.error('Error al obtener el proyecto por ID:', error);
    res.status(500).json({ message: 'Error al obtener el proyecto', error: error.message });
  }
});

router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { fabricJson } = req.body;

  try {
    const proyecto = await ProyectoUI.findByPk(id);
    if (!proyecto) return res.status(404).json({ message: 'Proyecto no encontrado' });

    // Actualizar el JSON del canvas
    proyecto.fabricJson = fabricJson;
    await proyecto.save();

    res.status(200).json({ message: 'Proyecto actualizado correctamente', proyecto });
  } catch (error) {
    console.error('Error al actualizar el proyecto:', error);
    res.status(500).json({ message: 'Error al actualizar el proyecto', error: error.message });
  }
});

// Ruta para desasignar usuarios y eliminar un proyecto (solo admin)
router.delete('/delete/:id', verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const proyecto = await ProyectoUI.findByPk(id);
    if (!proyecto) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    // Desasignar todos los usuarios asociados a este proyecto
    await User.update({ proyectoId: null }, { where: { proyectoId: id } });

    // Eliminar el proyecto
    await proyecto.destroy();

    res.status(200).json({ message: 'Proyecto desasignado y eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el proyecto:', error);
    res.status(500).json({ message: 'Error al eliminar el proyecto', error: error.message });
  }
});

module.exports = router;
