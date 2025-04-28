// src/routes/ProyectoClaseRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const ProyectoClase = require('../models/ProyectoClase'); // Asegúrate de importar el modelo correctamente
const User = require('../models/user');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');
// Ruta para crear un nuevo ProyectoClase (solo admin)
router.post('/create', verifyToken, verifyAdmin, async (req, res) => {
  const { nombre, descripcion, fabricJson } = req.body;

  try {
    const nuevoProyectoClase = await ProyectoClase.create({
      nombre,
      descripcion,
      fabricJson,
    });

    res.status(201).json({
      message: 'ProyectoClase creado con éxito',
      nuevoProyectoClase,
    });
  } catch (error) {
    console.error('Error al crear ProyectoClase:', error);
    res.status(500).json({ message: 'Error al crear ProyectoClase', error: error.message });
  }
});

// Ruta para obtener todos los proyectos de clase
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const proyectosClase = await ProyectoClase.findAll({
      attributes: ['id', 'nombre', 'descripcion', 'createdAt'],
    });

    res.status(200).json(proyectosClase);
  } catch (error) {
    console.error('Error al obtener proyectos de clase:', error);
    res.status(500).json({ message: 'Error al obtener los proyectos', error: error.message });
  }
});

// Ruta para obtener un proyecto de clase por ID
router.get('/edit/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const proyectoClase = await ProyectoClase.findByPk(id);
    if (!proyectoClase) {
      return res.status(404).json({ message: 'ProyectoClase no encontrado' });
    }

    res.json({
      message: 'ProyectoClase encontrado',
      proyectoClase,
    });
  } catch (error) {
    console.error('Error al obtener el proyecto de clase:', error);
    res.status(500).json({ message: 'Error al obtener el proyecto', error: error.message });
  }
});

// Ruta para actualizar un proyecto de clase
router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { fabricJson } = req.body;

  try {
    const proyectoClase = await ProyectoClase.findByPk(id);
    if (!proyectoClase) return res.status(404).json({ message: 'ProyectoClase no encontrado' });

    // Actualizar el JSON de la interfaz
    proyectoClase.fabricJson = fabricJson;
    await proyectoClase.save();

    res.status(200).json({ message: 'ProyectoClase actualizado correctamente', proyectoClase });
  } catch (error) {
    console.error('Error al actualizar el proyecto de clase:', error);
    res.status(500).json({ message: 'Error al actualizar el proyecto', error: error.message });
  }
});

// Ruta para eliminar un ProyectoClase (solo admin)
router.delete('/delete/:id', verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar el ProyectoClase por su ID
    const proyectoClase = await ProyectoClase.findByPk(id);
    if (!proyectoClase) {
      return res.status(404).json({ message: 'ProyectoClase no encontrado' });
    }

    // Desasignar todos los usuarios relacionados con este ProyectoClase
    await User.update({ proyectoClaseId: null }, { where: { proyectoClaseId: id } });

    // Eliminar el proyecto de clase
    await proyectoClase.destroy();

    res.status(200).json({ message: 'ProyectoClase desasignado y eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el proyecto de clase:', error);
    res.status(500).json({ message: 'Error al eliminar el proyecto de clase', error: error.message });
  }
});

// Ruta para asignar un usuario a un ProyectoClase (solo admin)
router.post('/assign-user', verifyToken, verifyAdmin, async (req, res) => {
    const { userId, proyectoClaseId } = req.body;
  
    try {
      const user = await User.findByPk(userId);
      const proyecto = await ProyectoClase.findByPk(proyectoClaseId);
  
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
  
      if (!proyecto) {
        return res.status(404).json({ message: 'ProyectoClase no encontrado' });
      }
  
      // Asignar el proyecto al usuario
      user.proyectoClaseId = proyectoClaseId;
      await user.save();
  
      res.status(200).json({ message: 'Usuario asignado al ProyectoClase correctamente', user });
    } catch (error) {
      console.error('Error al asignar usuario al ProyectoClase:', error);
      res.status(500).json({ message: 'Error al asignar usuario', error: error.message });
    }
  });
// Ruta para obtener el proyecto al que un usuario está asignado (sin verificar token)
router.get('/assigned-project/:userId', async (req, res) => {
  const { userId } = req.params; // Obtener el userId de los parámetros de la URL

  try {
    const user = await User.findByPk(userId, {
      include: {
        model: ProyectoClase,  // Incluir los detalles del proyecto relacionado
        attributes: ['id', 'nombre', 'descripcion'],  // Los atributos del proyecto que queremos devolver
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!user.proyectoClaseId) {
      return res.status(404).json({ message: 'El usuario no está asignado a ningún proyecto' });
    }

    // Si el usuario tiene asignado un proyecto, devolver la información del proyecto
    res.json({
      message: 'Proyecto asignado encontrado',
      proyecto: user.ProyectoClase, // La información del proyecto asignado al usuario
    });
  } catch (error) {
    console.error('Error al obtener el proyecto asignado:', error);
    res.status(500).json({ message: 'Error al obtener el proyecto asignado', error: error.message });
  }
});
 
router.post('/export-angular/:id', verifyToken, async (req, res) => {
  try {
    const proyecto = await ProyectoClase.findByPk(req.params.id);
    if (!proyecto) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    // Parsear el diagrama UML
    let diagrama;
    try {
      let jsonString = proyecto.fabricJson;
      if (typeof jsonString === 'string' && jsonString.startsWith('"') && jsonString.endsWith('"')) {
        jsonString = jsonString.slice(1, -1);
      }
      jsonString = jsonString.replace(/\\"/g, '"');
      diagrama = JSON.parse(jsonString);
      
      if (!diagrama || typeof diagrama !== 'object') {
        throw new Error('Diagrama no válido');
      }
    } catch (e) {
      console.error('Error parsing fabricJson:', e);
      return res.status(400).json({ 
        message: 'Error al procesar el diagrama UML',
        error: e.message
      });
    }

    // Configurar respuesta ZIP
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${proyecto.nombre}-angular-19.zip`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    // 1. package.json (Angular 19+)
    archive.append(JSON.stringify({
      name: proyecto.nombre.toLowerCase().replace(/\s+/g, '-'),
      version: "0.0.1",
      private: true,
      dependencies: {
        "@angular/core": "^19.2.0",
        "@angular/common": "^19.2.0",
        "@angular/compiler": "^19.2.0",
        "@angular/platform-browser": "^19.2.0",
        "@angular/router": "^19.2.0",
        "@angular/forms": "^19.2.0",
        "rxjs": "^7.8.0",
        "tslib": "^2.6.0",
        "zone.js": "^0.14.0",
        "@angular-devkit/build-angular": "^19.2.0",
        "@angular/cli": "^19.2.0",
        "typescript": "~5.3.0"
      },
      scripts: {
        "start": "ng serve",
        "build": "ng build",
        "watch": "ng build --watch --configuration development"
      }
    }, null, 2), { name: 'package.json' });

    // 2. tsconfig.json (ES2022)
    archive.append(JSON.stringify({
      "compilerOptions": {
        "target": "ES2022",
        "module": "ES2022",
        "strict": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "experimentalDecorators": true,
        "outDir": "./dist",
        "baseUrl": "./",
        "useDefineForClassFields": false,
        "moduleResolution": "node"
      },
      "angularCompilerOptions": {
        "strictInjectionParameters": true,
        "strictInputAccessModifiers": true,
        "strictTemplates": true
      }
    }, null, 2), { name: 'tsconfig.json' });

    // 3. Estructura Standalone
    const clases = diagrama.objects?.filter(obj => obj.type === 'class') || [];
    
    // app.config.ts
    archive.append(`
      import { ApplicationConfig } from '@angular/core';
      import { provideRouter } from '@angular/router';
      import { routes } from './app.routes';
      import { provideHttpClient } from '@angular/common/http';
      ${clases.map(c => `import { ${extractClassName(c)}Service } from './services/${extractClassName(c).toLowerCase()}.service';`).join('\n')}
      
      export const appConfig: ApplicationConfig = {
        providers: [
          provideRouter(routes),
          provideHttpClient(),
          ${clases.map(c => `${extractClassName(c)}Service,`).join('\n          ')}
        ]
      };
    `, { name: 'src/app/app.config.ts' });

    // main.ts
    archive.append(`
      import { bootstrapApplication } from '@angular/platform-browser';
      import { appConfig } from './app/app.config';
      import { AppComponent } from './app/app.component';
      
      bootstrapApplication(AppComponent, appConfig)
        .catch(err => console.error(err));
    `, { name: 'src/main.ts' });

    // app.component.ts (Standalone)
    archive.append(`
      import { Component } from '@angular/core';
      import { RouterOutlet } from '@angular/router';
      import { CommonModule } from '@angular/common';
      import { NavbarComponent } from './components/navbar/navbar.component';

      @Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet, NavbarComponent],
    template: \`
      <app-navbar></app-navbar>
      <main class="main-container">
        <router-outlet></router-outlet>
      </main>
    \`,
    styles: [\`
      .main-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
      }
    \`]
  })
  export class AppComponent {}
`, { name: 'src/app/app.component.ts' });

    // app.routes.ts
    archive.append(`
      import { Routes } from '@angular/router';
      ${clases.map(c => `import { ${extractClassName(c)}Component } from './components/${extractClassName(c).toLowerCase()}/${extractClassName(c).toLowerCase()}.component';`).join('\n')}
      
      export const routes: Routes = [
        { path: '', redirectTo: '/${clases[0] ? extractClassName(clases[0]).toLowerCase() : 'home'}', pathMatch: 'full' },
        ${clases.map(c => `{ 
          path: '${extractClassName(c).toLowerCase()}', 
          component: ${extractClassName(c)}Component,
          title: '${extractClassName(c)}',
          data: { breadcrumb: '${extractClassName(c)}' }
        },`).join('\n    ')}
      ];
    `, { name: 'src/app/app.routes.ts' });

    // 4. Generar componentes standalone
    clases.forEach(clase => {
      const className = extractClassName(clase);
      const componentDir = `src/app/components/${className.toLowerCase()}/`;
      
      // Componente
      archive.append(`
        import { Component } from '@angular/core';
        import { CommonModule } from '@angular/common';
        import { ${className}Service } from '../../services/${className.toLowerCase()}.service';
        
        @Component({
          selector: 'app-${className.toLowerCase()}',
          standalone: true,
          imports: [CommonModule],
          templateUrl: './${className.toLowerCase()}.component.html',
          styleUrls: ['./${className.toLowerCase()}.component.css'],
        })
        export class ${className}Component {
          constructor(private ${className.toLowerCase()}Service: ${className}Service) {}
        }
      `, { name: `${componentDir}${className}.component.ts` });
      
      // Template HTML
      archive.append(`
        <section class="${className.toLowerCase()}-section">
          <h2 class="title">${className}</h2>
          
          <div class="navigation-buttons">
            ${clases.map(otherClass => {
              if(otherClass !== clase) {
                return `<button routerLink="/${extractClassName(otherClass).toLowerCase()}" class="nav-button">
                  Ir a ${extractClassName(otherClass)}
                </button>`;
              }
              return '';
            }).join('')}
          </div>
          
          <div class="properties">
            ${clase.objects?.filter(o => o.type === 'textbox' && o.text === 'atributos')?.[0]?.text || '// Atributos aquí'}
          </div>
          
         
        </section>
      `, { name: `${componentDir}${className}.component.html` });
      
      // Estilos (CSS moderno)
      archive.append(`
        .${className.toLowerCase()}-section {
          /* ... estilos anteriores ... */
          
          .navigation-buttons {
            display: flex;
            gap: 0.5rem;
            margin: 1rem 0;
            flex-wrap: wrap;
            
            .nav-button {
              padding: 0.5rem 1rem;
              background: #2196F3;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              transition: background 0.3s;
              
              &:hover {
                background: #0d8bf2;
              }
            }
          }
          
          /* ... otros estilos ... */
        }
      `, { name: `${componentDir}${className}.component.css` });
      //navbar
      // Generar navbar.component.ts
archive.append(`
  import { Component } from '@angular/core';
  import { RouterLink } from '@angular/router';
  import { CommonModule } from '@angular/common';
  
  @Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: \`
      <nav class="navbar">
        <div class="logo">MENU</div>
        <div class="nav-links">
          <a *ngFor="let route of routes" 
             [routerLink]="route.path" 
             routerLinkActive="active">
            {{route.title}}
          </a>
        </div>
      </nav>
    \`,
    styles: [\`
      .navbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        background: #1a237e;
        color: white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        
        .logo {
          font-size: 1.5rem;
          font-weight: bold;
        }
        
        .nav-links {
          display: flex;
          gap: 1rem;
          
          a {
            color: white;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            transition: background 0.3s;
            
            &:hover {
              background: #303f9f;
            }
            
            &.active {
              background: #3949ab;
              font-weight: bold;
            }
          }
        }
      }
    \`]
  })
  export class NavbarComponent {
    projectName = '${proyecto.nombre}';
    routes = [
      ${clases.map(c => `{
        path: '${extractClassName(c).toLowerCase()}',
        title: '${extractClassName(c)}'
      },`).join('\n      ')}
    ];
  }
`, { name: 'src/app/components/navbar/navbar.component.ts' });
// Generar navigation-buttons.component.ts
archive.append(`
  import { Component, Input } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { RouterLink } from '@angular/router';
  
  @Component({
    selector: 'app-navigation-buttons',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: \`
      <div class="navigation-buttons">
        <button 
          *ngFor="let route of routes" 
          [routerLink]="route.path"
          class="nav-button"
          [class.current]="isCurrent(route.path)">
          {{route.title}}
        </button>
      </div>
    \`,
    styles: [\`
      .navigation-buttons {
        display: flex;
        gap: 0.5rem;
        margin: 1rem 0;
        flex-wrap: wrap;
        
        .nav-button {
          padding: 0.5rem 1rem;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;
          
          &:hover {
            background: #0d8bf2;
            transform: translateY(-2px);
          }
          
          &.current {
            background: #0b7dda;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          }
        }
      }
    \`]
  })
  export class NavigationButtonsComponent {
    @Input() currentPath: string = '';
    @Input() routes: {path: string, title: string}[] = [];
    
    isCurrent(path: string): boolean {
      return this.currentPath.includes(path);
    }
  }
`, { name: 'src/app/components/navigation-buttons/navigation-buttons.component.ts' });
archive.append(`
  import { Component } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { ${className}Service } from '../../services/${className.toLowerCase()}.service';
  import { NavigationButtonsComponent } from '../navigation-buttons/navigation-buttons.component';
  
  @Component({
    selector: 'app-${className.toLowerCase()}',
    standalone: true,
    imports: [CommonModule, NavigationButtonsComponent],
    templateUrl: './${className.toLowerCase()}.component.html',
    styleUrls: ['./${className.toLowerCase()}.component.css'],
  })
  export class ${className}Component {
    routes = [
      ${clases.filter(c => c !== clase).map(c => `{
        path: '/${extractClassName(c).toLowerCase()}',
        title: '${extractClassName(c)}'
      },`).join('\n      ')}
    ];
    
    currentPath = '/${className.toLowerCase()}';
    
    constructor(private ${className.toLowerCase()}Service: ${className}Service) {}
  }
`, { name: `${componentDir}${className}.component.ts` });

// Y el template actualizado:
archive.append(`
  <section class="${className.toLowerCase()}-section">
    <h2 class="title">${className}</h2>
    
    <app-navigation-buttons 
      [routes]="routes" 
      [currentPath]="currentPath">
    </app-navigation-buttons>
    
    <div class="content">
      <div class="properties">
        ${clase.objects?.filter(o => o.type === 'textbox' && o.text === 'atributos')?.[0]?.text || '// Atributos aquí'}
      </div>
      
    </div>
  </section>
`, { name: `${componentDir}${className}.component.html` });  
// Servicio (con métodos básicos)
      archive.append(`
        import { Injectable } from '@angular/core';
        import { HttpClient } from '@angular/common/http';
        
        @Injectable({
          providedIn: 'root'
        })
        export class ${className}Service {
          private apiUrl = 'api/${className.toLowerCase()}';
          
          constructor(private http: HttpClient) {}
          
          getAll() {
            return this.http.get<any[]>(this.apiUrl);
          }
          
          getById(id: string) {
            return this.http.get<any>(\`\${this.apiUrl}/\${id}\`);
          }
          
          create(data: any) {
            return this.http.post(this.apiUrl, data);
          }
          
          update(id: string, data: any) {
            return this.http.put(\`\${this.apiUrl}/\${id}\`, data);
          }
          
          delete(id: string) {
            return this.http.delete(\`\${this.apiUrl}/\${id}\`);
          }
        }
      `, { name: `src/app/services/${className.toLowerCase()}.service.ts` });
    });

    // 5. environment.ts
    archive.append(`
      export const environment = {
        production: false,
        apiUrl: 'http://localhost:4000/api'
      };
    `, { name: 'src/environments/environment.ts' });

    // 6. README.md actualizado
    archive.append(`
      # ${proyecto.nombre} - Angular 19+
      
      ## Características
      - Angular 19 Standalone Components
      - Estructura moderna sin NgModules
      - Configuración optimizada
      
      ## Clases generadas
      ${clases.map(c => `- ${extractClassName(c)}`).join('\n')}
      
      ## Desarrollo
      \`\`\`bash
      npm install
      npm start
      \`\`\`
      
      Abre http://localhost:4200
    `, { name: 'README.md' });

    await archive.finalize();

  } catch (error) {
    console.error('Error al exportar:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Error interno al exportar proyecto',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// Función auxiliar mejorada
function extractClassName(clase) {
  const nameObj = clase.objects?.find(obj => 
    obj.type === 'textbox' && 
    obj.fontWeight === 'bold' && 
    obj.textAlign === 'center'
  );
  
  if (!nameObj) return 'UnknownClass';
  
  // Limpieza del nombre de clase
  return nameObj.text
    .replace(/[^a-zA-Z0-9_$]/g, '')
    .replace(/^[0-9]+/, '')
    .replace(/(?:^|\s)\S/g, a => a.toUpperCase())
    .replace(/\s+/g, '') || 'UnknownClass';
}
module.exports = router;
