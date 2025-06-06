const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const User = require('../models/user');
const ProyectoUI = require('../models/ProyectoUI');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const os = require('os');

router.post('/create-and-export', verifyToken, async (req, res) => {
  try {
    const { nombre, descripcion, pages } = req.body;
    if (!pages || pages.length === 0) {
      return res.status(400).json({ error: 'No se enviaron páginas.' });
    }

    // Crear proyecto en la base de datos
    const proyecto = await ProyectoUI.create({
      nombre,
      descripcion,
      pagesJson: pages, // 🚀 Guardar el JSON completo
    });

    // Generar proyecto Flutter en carpeta temporal
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flutter_project_'));
    const libDir = path.join(tmpDir, 'lib');
    fs.mkdirSync(libDir, { recursive: true });

    // Crear un archivo Dart por página y construir rutas
    const pageRoutes = pages.map((page, index) => {
      const dartFileName = `page_${index + 1}.dart`;
      const widgetName = `Page${index + 1}`;
      const dartCode = generatePageDart(page, widgetName);
      fs.writeFileSync(path.join(libDir, dartFileName), dartCode);
      return { widgetName, dartFileName };
    });

    // Generar main.dart con navegación
    const mainDartCode = generateMainWithNavigator(pageRoutes);
    fs.writeFileSync(path.join(libDir, 'main.dart'), mainDartCode);

    // Generar pubspec.yaml
    const pubspec = `
name: ${nombre.toLowerCase().replace(/\s/g, '_')}
description: Proyecto exportado automáticamente
publish_to: 'none'
version: 1.0.0+1
environment:
  sdk: ">=2.12.0 <3.0.0"
dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.2
dev_dependencies:
  flutter_test:
    sdk: flutter
flutter:
  uses-material-design: true
`;
    fs.writeFileSync(path.join(tmpDir, 'pubspec.yaml'), pubspec);

    // Crear ZIP del proyecto
    const zipFilePath = path.join(os.tmpdir(), `${nombre.replace(/\s/g, '_')}.zip`);
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(output);
    archive.directory(tmpDir, false);
    await archive.finalize();

    // Guardar Flutter code y ZIP path en DB
    proyecto.flutterCode = mainDartCode;
    proyecto.zipPath = zipFilePath;
    await proyecto.save();

    // Enviar ZIP
    res.download(zipFilePath, `${nombre || 'flutter_export'}.zip`, (err) => {
      if (err) console.error('Error al enviar ZIP:', err);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

  } catch (error) {
    console.error('Error al crear/exportar proyecto Flutter:', error);
    res.status(500).json({ error: 'Error interno', details: error.message });
  }
});

// Generar Dart para una página
function generatePageDart(page, widgetName) {
  let appBarCode = '';
  const bodyWidgets = [];
  const hasCheckbox = (page.components || []).some(comp => comp.type === 'Checkbox');

  for (const comp of page.components || []) {
    switch (comp.type) {
      case 'Container':
        bodyWidgets.push(`Positioned(left: ${comp.position.x}, top: ${comp.position.y}, child: SizedBox(width: ${comp.size.width}, height: ${comp.size.height}, child: Container(color: ${jsToFlutterColor(comp.style.color)}))),`);
        break;
      case 'Text':
        bodyWidgets.push(`Positioned(left: ${comp.position.x}, top: ${comp.position.y}, child: Text('${comp.props.text}', style: TextStyle(fontSize: ${comp.props.fontSize || 16}, color: ${jsToFlutterColor(comp.style.color)}))),`);
        break;
      case 'Button':
        bodyWidgets.push(`Positioned(left: ${comp.position.x}, top: ${comp.position.y}, child: ElevatedButton(onPressed: () {}, child: Text('${comp.props.text || 'Botón'}'))),`);
        break;
      case 'Input':
        bodyWidgets.push(`Positioned(left: ${comp.position.x}, top: ${comp.position.y}, child: SizedBox(width: ${comp.size.width}, child: TextField(decoration: InputDecoration(hintText: '${comp.props.placeholder || ''}')))),`);
        break;
      case 'Checkbox':
        if (hasCheckbox) {
          bodyWidgets.push(`Positioned(left: ${comp.position.x}, top: ${comp.position.y}, child: Checkbox(value: isChecked, onChanged: (val) { setState(() { isChecked = val ?? false; }); })),`);
        } else {
          bodyWidgets.push(`Positioned(left: ${comp.position.x}, top: ${comp.position.y}, child: Checkbox(value: true, onChanged: (val) {})),`);
        }
        break;
      case 'Navbar':
        appBarCode = `appBar: AppBar(title: Text('${page.pageName || 'Navbar'}')),
`;
        break;
    }
  }

  if (hasCheckbox) {
    return `
import 'package:flutter/material.dart';

class ${widgetName} extends StatefulWidget {
  @override
  _${widgetName}State createState() => _${widgetName}State();
}

class _${widgetName}State extends State<${widgetName}> {
  bool isChecked = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      ${appBarCode}
      body: Stack(
        children: [
          ${bodyWidgets.join('\n')}
        ],
      ),
    );
  }
}`;
  } else {
    return `
import 'package:flutter/material.dart';

class ${widgetName} extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      ${appBarCode}
      body: Stack(
        children: [
          ${bodyWidgets.join('\n')}
        ],
      ),
    );
  }
}`;
  }
}


// Generar main.dart con Navigator
function generateMainWithNavigator(pageRoutes) {
  const routes = pageRoutes.map(r => `'/${r.widgetName.toLowerCase()}': (context) => ${r.widgetName}(),`).join('\n');
  const homeWidget = pageRoutes[0].widgetName;

  const imports = pageRoutes.map(r => `import './${r.dartFileName}';`).join('\n');

  return `
import 'package:flutter/material.dart';
${imports}

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      initialRoute: '/${homeWidget.toLowerCase()}',
      routes: {
        ${routes}
      },
    );
  }
}
  `;
}

function jsToFlutterColor(jsColor) {
  if (!jsColor) return 'Colors.black';
  const hex = jsColor.replace('#', '');
  return `Color(0xFF${hex.toUpperCase()})`;
}


router.post('/create', verifyToken, async (req, res) => {
  try {
    const { nombre, descripcion, pagesJson } = req.body;
    if (!pagesJson || pagesJson.length === 0) {
      return res.status(400).json({ error: 'No se enviaron páginas.' });
    }

    // Crear el proyecto en la base de datos
    const proyecto = await ProyectoUI.create({
      nombre,
      descripcion,
      pagesJson,
    });

    res.status(201).json({
      message: 'Proyecto guardado exitosamente.',
      proyecto,
    });
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({ error: 'Error interno', details: error.message });
  }
});
// 🚀 GET: Obtener todos los proyectos
router.get('/', verifyToken, async (req, res) => {
  try {
    const proyectos = await ProyectoUI.findAll({
      attributes: ['id', 'nombre', 'descripcion', 'createdAt'],
    });
    res.status(200).json(proyectos);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ message: 'Error al obtener los proyectos', error: error.message });
  }
});

// 🚀 POST: Asignar proyecto a usuario
router.post('/assign-user', verifyToken, async (req, res) => {
  try {
    const { userId, proyectoId } = req.body;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const proyecto = await ProyectoUI.findByPk(proyectoId);
    if (!proyecto) return res.status(404).json({ message: 'Proyecto no encontrado' });

    user.proyectoId = proyectoId;
    await user.save();

    res.json({ message: 'Usuario asignado al proyecto correctamente', user });
  } catch (error) {
    console.error('Error al asignar usuario:', error);
    res.status(500).json({ message: 'Error interno', details: error.message });
  }
});

// 🚀 GET: Proyecto asignado a un usuario
router.get('/assigned-project/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findByPk(userId, {
      include: {
        model: ProyectoUI,
        attributes: ['id', 'nombre', 'descripcion', 'pagesJson'],  // 🔥 Añadir pagesJson
      },
    });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (!user.proyectoId) return res.status(404).json({ message: 'Usuario no tiene proyecto asignado' });

    res.json({ proyecto: user.ProyectoUI });
  } catch (error) {
    console.error('Error al obtener proyecto asignado:', error);
    res.status(500).json({ message: 'Error interno', details: error.message });
  }
});


// 🚀 GET: Editar proyecto por ID (devolver pagesJson)
router.get('/edit-ui/:id', verifyToken, async (req, res) => {
  try {
    const proyecto = await ProyectoUI.findByPk(req.params.id);
    if (!proyecto) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    // Parsear pagesJson si es string
    let pagesJson = proyecto.pagesJson;
    if (typeof pagesJson === 'string') {
      try {
        pagesJson = JSON.parse(pagesJson);
      } catch (error) {
        console.warn('No se pudo parsear pagesJson, creando arreglo vacío');
        pagesJson = [];
      }
    }

    // Si es null o undefined, inicializar
    if (!Array.isArray(pagesJson)) {
      pagesJson = [];
    }

    res.json({ proyecto: { ...proyecto.toJSON(), pagesJson } });
  } catch (error) {
    console.error('Error al obtener el proyecto:', error);
    res.status(500).json({ message: 'Error interno', details: error.message });
  }
});


// 🚀 PUT: Actualizar proyecto por ID con pagesJson
router.put('/update/:id', verifyToken, async (req, res) => {
  try {
    const { pagesJson } = req.body;
    if (!pagesJson || pagesJson.length === 0) {
      return res.status(400).json({ message: 'No se enviaron páginas.' });
    }

    const proyecto = await ProyectoUI.findByPk(req.params.id);
    if (!proyecto) return res.status(404).json({ message: 'Proyecto no encontrado' });

    proyecto.pagesJson = pagesJson;
    await proyecto.save();

    res.json({ message: 'Proyecto actualizado correctamente', proyecto });
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    res.status(500).json({ message: 'Error interno', details: error.message });
  }
});

// 🚀 GET: Exportar Flutter para un proyecto existente
router.get('/export-flutter/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const proyecto = await ProyectoUI.findByPk(id);

    if (!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado' });

    let pagesJson = proyecto.pagesJson;
    if (typeof pagesJson === 'string') {
      pagesJson = JSON.parse(pagesJson);
    }

    // 🏗 Generar ZIP en stream
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flutter_project_'));
    const libDir = path.join(tmpDir, 'lib');
    fs.mkdirSync(libDir, { recursive: true });

    const pageRoutes = pagesJson.map((page, index) => {
      const dartFileName = `page_${index + 1}.dart`;
      const widgetName = `Page${index + 1}`;
      const dartCode = generatePageDart(page, widgetName);
      fs.writeFileSync(path.join(libDir, dartFileName), dartCode);
      return { widgetName, dartFileName };
    });

    const mainDartCode = generateMainWithNavigator(pageRoutes);
    fs.writeFileSync(path.join(libDir, 'main.dart'), mainDartCode);

    const pubspec = `
name: ${proyecto.nombre.toLowerCase().replace(/\s/g, '_')}
description: Proyecto exportado automáticamente
publish_to: 'none'
version: 1.0.0+1
environment:
  sdk: ">=2.12.0 <3.0.0"
dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.2
dev_dependencies:
  flutter_test:
    sdk: flutter
flutter:
  uses-material-design: true
`;
    fs.writeFileSync(path.join(tmpDir, 'pubspec.yaml'), pubspec);

    // ✅ Generar ZIP en stream directamente a la respuesta
    res.setHeader('Content-Disposition', `attachment; filename=${proyecto.nombre.replace(/\s/g, '_')}.zip`);
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.directory(tmpDir, false);
    archive.pipe(res);

    archive.finalize();

    // 🧹 Limpiar después de enviar
    archive.on('end', () => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

  } catch (error) {
    console.error('Error al exportar proyecto Flutter:', error);
    res.status(500).json({ error: 'Error al exportar proyecto Flutter', details: error.message });
  }
});
// 🚀 DELETE: Eliminar proyecto por ID
router.delete('/delete/:id', verifyToken, async (req, res) => {
  try {
    const proyecto = await ProyectoUI.findByPk(req.params.id);
    if (!proyecto) return res.status(404).json({ message: 'Proyecto no encontrado' });

    // 🚨 Opcional: Desasignar usuarios vinculados a este proyecto
    const users = await User.findAll({ where: { proyectoId: proyecto.id } });
    for (const user of users) {
      user.proyectoId = null;
      await user.save();
    }

    await proyecto.destroy();

    res.json({ message: 'Proyecto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({ message: 'Error interno', details: error.message });
  }
});

module.exports = router;
