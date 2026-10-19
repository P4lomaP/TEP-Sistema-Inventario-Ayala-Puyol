# Sistema de Gestión de Inventario - TEP Formosa
Sistema web transaccional desarrollado para la gestión de activos informáticos, control de stock de insumos y trazabilidad de movimientos del Tribunal Electoral Permanente de la Provincia de Formosa.

## Tecnologías Utilizadas
* **Frontend:** React.js, Vite, Tailwind CSS.
* **Backend:** Node.js, Express.
* **Base de Datos:** MySQL (Arquitectura Connection Pool).
* **Seguridad:** JWT (JSON Web Tokens), Encriptación Bcrypt, RBAC (Control de Acceso Basado en Roles).

## Requisitos Previos
* [Node.js](https://nodejs.org/) (v18 o superior)
* Servidor MySQL ejecutándose en el puerto 3306

## Instrucciones de Despliegue Local

### 1. Base de Datos
Ejecutar el script estructural `tep_inventario.sql` (ubicado en el directorio `database/`) en su motor MySQL local para generar las tablas y el sembrado inicial del administrador.

### 2. Configuración del Backend (Servidor)
Navegar al directorio del servidor, instalar las dependencias y levantar el entorno:
\`\`\`bash
cd tep-sistema-inventario/backend
npm install
npm run dev
\`\`\`

### 3. Configuración del Frontend (Cliente)
En una nueva terminal, navegar al directorio del cliente, instalar las dependencias y ejecutar Vite:
\`\`\`bash
cd tep-sistema-inventario/frontend
npm install
npm run dev
\`\`\`

**Nota de Acceso:** Para la primera evaluación del sistema, utilice las credenciales maestras precargadas en la base de datos (Usuario: `admin.tep`).
