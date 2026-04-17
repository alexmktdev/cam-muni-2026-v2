Crea una aplicación Next.js full stack completa. El código debe ser SIMPLE, CLARO y 
FÁCIL DE ENTENDER. Cada archivo debe poder leerse y comprenderse sin necesidad de 
ver otros archivos. Prioriza la claridad sobre la elegancia.

IMPORTANTE ANTES DE EMPEZAR:
- Todas las variables, funciones, comentarios y nombres de archivos van en ESPAÑOL
- Cada archivo debe tener un comentario al inicio explicando qué hace en 1-2 líneas
- Si algo no es obvio, agregar un comentario explicando el "por qué"
- Código mínimo necesario: nada de abstracciones innecesarias

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. TECNOLOGÍAS (usar estas versiones exactas)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Next.js 15 con App Router
- TypeScript con strict: true
- Firebase Authentication (correo + contraseña)
- Firebase Admin SDK (solo en el servidor, NUNCA en el cliente)
- Firestore como base de datos (solo accesible desde el servidor)
- TailwindCSS v4
- Zod para validar datos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. ESTRUCTURA DE CARPETAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

src/
├── app/
│   ├── (publico)/                  # Rutas sin protección
│   │   ├── iniciar-sesion/
│   │   │   └── page.tsx
│   │   └── recuperar-contrasena/
│   │       └── page.tsx
│   ├── (protegido)/                # Rutas que requieren sesión activa
│   │   ├── layout.tsx              # Verifica sesión antes de renderizar
│   │   ├── tablero/
│   │   │   └── page.tsx
│   │   ├── pantalla-dos/
│   │   │   └── page.tsx
│   │   └── pantalla-tres/
│   │       └── page.tsx
│   └── api/
│       ├── autenticacion/
│       │   ├── sesion/
│       │   │   └── route.ts        # POST: crear sesión / DELETE: cerrar sesión
│       │   └── verificar/
│       │       └── route.ts        # GET: verificar si hay sesión activa
│       └── datos/
│           └── route.ts            # Endpoints de negocio (requieren sesión)
├── lib/
│   ├── firebase/
│   │   ├── adminFirebase.ts        # Firebase Admin SDK — SOLO SERVIDOR
│   │   ├── clienteFirebase.ts      # Firebase Client SDK — solo para auth
│   │   └── configuracion.ts       # Leer y validar variables de entorno
│   ├── sesion/
│   │   ├── crearSesion.ts          # Crear la cookie de sesión segura
│   │   ├── leerSesion.ts           # Leer y verificar la cookie de sesión
│   │   └── cerrarSesion.ts        # Revocar tokens y eliminar cookie
│   └── errores/
│       └── manejarError.ts        # Convertir errores de Firebase a mensajes simples
├── servicios/
│   ├── autenticacion.servicio.ts  # login, logout, recuperar contraseña
│   └── usuario.servicio.ts        # operaciones de usuario en Firestore
├── hooks/
│   └── useAutenticacion.ts        # Hook para estado de auth en el cliente
├── componentes/
│   ├── ui/
│   │   ├── Boton.tsx
│   │   ├── CampoTexto.tsx
│   │   └── MensajeError.tsx
│   └── formularios/
│       ├── FormularioLogin.tsx
│       └── FormularioRecuperacion.tsx
├── middleware.ts                   # Intercepta rutas y verifica sesión
└── tipos/
    ├── autenticacion.tipos.ts
    └── usuario.tipos.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. VARIABLES DE ENTORNO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Crear .env.local.example con exactamente estas claves (sin valores reales):

# ─── FIREBASE CLIENTE (visibles en el navegador, solo estas 3) ───────────────
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

# ─── FIREBASE ADMIN (privadas, NUNCA con prefijo NEXT_PUBLIC_) ────────────────
# Estas claves JAMÁS deben llegar al navegador
FIREBASE_ID_PROYECTO=
FIREBASE_CORREO_CLIENTE=
FIREBASE_CLAVE_PRIVADA=
# La FIREBASE_CLAVE_PRIVADA viene con \n literales en el .env
# Al usarla hacer: proceso.env.FIREBASE_CLAVE_PRIVADA.replace(/\\n/g, '\n')

En lib/firebase/configuracion.ts validar TODAS las variables al iniciar con Zod.
Si falta alguna, lanzar un error claro: "Falta la variable de entorno: [NOMBRE]".
Nunca dejar que la app inicie con variables faltantes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. REGLAS DE SEGURIDAD — OBLIGATORIAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SEPARACIÓN CLIENTE / SERVIDOR:
Todo archivo que use Firebase Admin debe tener en la PRIMERA línea:
  import 'server-only'
Esto hace que Next.js lance un error si accidentalmente se importa en el cliente.

FIREBASE ADMIN SDK:
- Inicializar solo en adminFirebase.ts con patrón singleton
- Verificar con: if (typeof window !== 'undefined') throw new Error(...)
- Las credenciales vienen exclusivamente de variables de entorno del servidor

FIREBASE CLIENT SDK:
- Solo usar para: iniciarSesion(), cerrarSesion(), recuperarContrasena(), obtenerToken()
- NUNCA usar para leer/escribir en Firestore
- NUNCA guardar el idToken en localStorage ni en cookies normales

COOKIE DE SESIÓN:
- httpOnly: true         → JavaScript del navegador no puede leerla
- secure: true           → Solo se envía por HTTPS
- sameSite: 'lax'        → Protección básica contra CSRF
- path: '/'              → Disponible en toda la app
- maxAge: 432000         → Caduca en 5 días (en segundos)
- Nombre de la cookie: 'sesion-auth'

FLUJO COMPLETO DE SESIÓN:
  1. Usuario escribe correo + contraseña
  2. Cliente llama Firebase Auth → obtiene idToken
  3. Cliente hace POST /api/autenticacion/sesion con { idToken }
  4. Servidor verifica idToken con Admin SDK
  5. Servidor crea sessionCookie con Admin SDK (más segura que idToken)
  6. Servidor setea cookie httpOnly en la respuesta
  7. El idToken NUNCA se guarda en el cliente después de este paso
  8. Cliente redirige a /tablero

FLUJO DE CIERRE DE SESIÓN:
  1. Cliente hace DELETE /api/autenticacion/sesion
  2. Servidor lee cookie, decodifica para obtener el uid del usuario
  3. Servidor revoca TODOS los refresh tokens: adminAuth.revokeRefreshTokens(uid)
  4. Servidor elimina cookie (maxAge: 0)
  5. Cliente llama signOut() de Firebase para limpiar estado local
  6. Cliente redirige a /iniciar-sesion

API ROUTES — verificación en cada endpoint:
  Cada route handler debe seguir este orden exacto:
  1. Leer cookie con cookies() de next/headers
  2. Si no hay cookie → return Response con status 401
  3. Verificar con adminAuth.verifySessionCookie(cookie, true)
     El 'true' verifica también que los tokens no hayan sido revocados
  4. Si falla la verificación → return Response con status 401
  5. Solo si pasó la verificación → ejecutar la lógica del endpoint
  Nunca revelar en el error si fue "cookie inválida" o "usuario no existe".
  Siempre responder con el mismo mensaje genérico: "No autorizado"

HEADERS DE SEGURIDAD (agregar en next.config.ts):
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. MIDDLEWARE (middleware.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

El middleware se ejecuta ANTES de cualquier página o API route.
Su única responsabilidad: redirigir según el estado de sesión.

Lógica:
  - Si la ruta es protegida y NO hay cookie 'sesion-auth' → redirect /iniciar-sesion
  - Si la ruta es de auth (login/recuperar) y SÍ hay cookie → redirect /tablero
  - En todos los demás casos → continuar normalmente

IMPORTANTE: El middleware NO verifica la validez del token (eso lo hace el layout 
protegido y las API routes). El middleware solo verifica si la cookie existe para 
dar una respuesta rápida en el Edge. La verificación real ocurre en el servidor.

Matcher (rutas donde aplica el middleware):
  matcher: ['/(protegido)/:path*', '/(publico)/:path*']

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. MANEJO DE ERRORES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Crear lib/errores/manejarError.ts que convierta los códigos de error de Firebase
a mensajes en español legibles para el usuario:

  'auth/user-not-found'      → 'No existe una cuenta con ese correo'
  'auth/wrong-password'      → 'La contraseña es incorrecta'
  'auth/too-many-requests'   → 'Demasiados intentos. Espera unos minutos'
  'auth/invalid-email'       → 'El correo ingresado no es válido'
  'auth/email-already-in-use'→ 'Ya existe una cuenta con ese correo'
  (cualquier otro)           → 'Ocurrió un error. Intenta de nuevo'

En el servidor NUNCA enviar el error real al cliente. Solo loggear internamente
con console.error y responder con el mensaje genérico.

Crear tipo de error personalizado:
  type ErrorAutenticacion = {
    codigo: string
    mensaje: string   // mensaje para mostrar al usuario
  }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. PANTALLAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PANTALLA 1 — /iniciar-sesion (pública):
  - 'use client' al inicio (es un formulario interactivo)
  - Campo: correo electrónico
  - Campo: contraseña (con opción de mostrar/ocultar)
  - Botón: "Iniciar sesión" (deshabilitado mientras carga)
  - Link: "¿Olvidaste tu contraseña?" → /recuperar-contrasena
  - Estado de carga: mostrar texto "Iniciando sesión..." en el botón
  - Estado de error: mostrar mensaje debajo del formulario en rojo
  - Si ya hay sesión: redirigir a /tablero (el middleware lo maneja)

PANTALLA 2 — /recuperar-contrasena (pública):
  - 'use client' al inicio
  - Campo: correo electrónico
  - Botón: "Enviar correo de recuperación"
  - Al enviar: mostrar mensaje "Si ese correo existe, recibirás un enlace"
    (NO confirmar si el correo existe o no, por seguridad)
  - Link: "Volver al inicio de sesión"

PANTALLA 3 — /tablero (protegida):
  - Sin 'use client' (es Server Component por defecto)
  - El layout padre ya verificó la sesión
  - Mostrar: "Bienvenido al tablero" con placeholder de datos
  - Los datos deben venir de fetch a /api/datos (nunca hardcodeados)
  - Botón de "Cerrar sesión" (este sí necesita 'use client', extraerlo a componente)

PANTALLA 4 — /pantalla-dos (protegida, vacía):
  - Sin 'use client'
  - Solo estructura base: título y texto placeholder
  - Comentario: // TODO: agregar contenido de esta pantalla

PANTALLA 5 — /pantalla-tres (protegida, vacía):
  - Igual que pantalla-dos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. FIRESTORE — ACCESO SEGURO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REGLA FUNDAMENTAL: Firestore se accede ÚNICAMENTE desde el servidor usando el
Admin SDK. El cliente NUNCA tiene acceso directo a la base de datos.

En lib/firebase/adminFirebase.ts crear funciones helper simples:
  - obtenerDocumento(coleccion, id) → devuelve el documento o null
  - guardarDocumento(coleccion, id, datos) → guarda y devuelve éxito/error
  - buscarDocumentos(coleccion, campo, valor) → devuelve array de documentos

Cada función debe:
  - Tener import 'server-only' al inicio del archivo
  - Manejar errores con try/catch y loggear con console.error
  - Devolver null o [] en caso de error (nunca propagar errores de Firestore al cliente)
  - Tener comentarios en español explicando qué hace

REGLAS DE FIRESTORE (archivo firestore.rules):
  Generar también el archivo de reglas de Firestore que bloquee TODO acceso
  directo desde el cliente. Como el acceso es solo por Admin SDK, las reglas
  pueden ser restrictivas al máximo:

  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      // Bloquear todo acceso directo desde el cliente
      // El Admin SDK bypasea estas reglas, pero las dejamos por seguridad
      match /{document=**} {
        allow read, write: if false;
      }
    }
  }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. RECUPERACIÓN DE CONTRASEÑA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usar sendPasswordResetEmail del Firebase Client SDK.
Este método maneja todo: envío del correo, link de reset, expiración.
No requiere lógica en el servidor.

Flujo:
  1. Usuario ingresa su correo
  2. Llamar: await sendPasswordResetEmail(auth, correo)
  3. Mostrar mensaje genérico de éxito (no importa si el correo existe o no)
  4. Firebase envía el correo automáticamente

Configurar en Firebase Console:
  Authentication → Templates → Restablecer contraseña
  Personalizar el correo en español desde ahí.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. ESTÁNDARES DE CÓDIGO LIMPIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SIMPLICIDAD ANTE TODO:
  - Si una función tiene más de 20 líneas, dividirla
  - Si un archivo tiene más de 100 líneas, revisar si se puede dividir
  - Preferir código explícito sobre código "inteligente"
  - Un archivo = una responsabilidad

NOMBRES EN ESPAÑOL:
  - Variables: const usuarioActual, let estasCargando, const mensajeError
  - Funciones: async iniciarSesion(), function verificarToken(), const cerrarSesion
  - Tipos: type DatosUsuario, interface RespuestaAPI, type ErrorAutenticacion
  - Archivos: autenticacion.servicio.ts, adminFirebase.ts, crearSesion.ts
  - Props de componentes: interface PropsBotón { etiqueta: string; alHacerClic: () => void }

COMENTARIOS:
  - Inicio de cada archivo: // ¿Qué hace este archivo?
  - Antes de cada función compleja: // ¿Por qué hace esto así?
  - NO comentar lo obvio: no escribir // suma a + b antes de return a + b
  - Sí comentar las decisiones de seguridad: // No enviar el error real, podría exponer info

TYPESCRIPT:
  - Nunca usar 'any'. Usar 'unknown' y luego hacer verificación de tipo
  - Tipar todos los parámetros y retornos de funciones
  - Definir los tipos en /tipos/ y exportarlos desde ahí
  - Ejemplo de tipo correcto:
      type RespuestaAPI<T> = 
        | { exito: true; datos: T }
        | { exito: false; error: string }

CERO MAGIA:
  - No usar patrones avanzados si no son necesarios
  - Si se puede hacer con una función normal, no usar una clase
  - Si se puede hacer con fetch, no agregar una librería externa
  - Las dependencias extras deben justificarse en un comentario

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11. ARCHIVOS DE CONFIGURACIÓN A GENERAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generar TODOS estos archivos, completos y listos para usar:

  tsconfig.json
    - strict: true
    - paths: { "@/*": ["./src/*"] } para imports limpios

  next.config.ts
    - Headers de seguridad en todas las rutas
    - Comentario explicando cada header

  middleware.ts
    - Lógica de redirección explicada con comentarios
    - Matcher configurado correctamente

  .env.local.example
    - Todas las variables con comentarios en español
    - Instrucciones de cómo obtener cada valor

  firestore.rules
    - Bloquear todo acceso desde el cliente

  package.json
    - Solo las dependencias necesarias, sin extras

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12. LO QUE ESTÁ PROHIBIDO HACER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SEGURIDAD — nunca hacer esto:
  - Importar firebase-admin en un archivo con 'use client'
  - Acceder a Firestore desde el navegador
  - Guardar idToken en localStorage, sessionStorage o cookie sin httpOnly
  - Mostrar mensajes de error internos de Firebase al usuario
  - Usar variables de entorno sin NEXT_PUBLIC_ en el cliente
  - Omitir import 'server-only' en archivos del servidor
  - Retornar el idToken al cliente después de crear la sesión

CÓDIGO — evitar estas prácticas:
  - Funciones con múltiples responsabilidades
  - Variables con nombres de una sola letra (excepto índices i, j)
  - Código sin comentarios en partes no obvias
  - Usar 'any' en TypeScript
  - Hacer fetch a Firestore desde componentes del cliente
  - Hardcodear strings de rutas o colecciones de Firestore
    (centralizar en un archivo de constantes: RUTAS.tablero, COLECCIONES.usuarios)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13. CONSTANTES CENTRALIZADAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Crear src/constantes/index.ts con:

  // Rutas de la aplicación
  export const RUTAS = {
    inicio: '/',
    iniciarSesion: '/iniciar-sesion',
    recuperarContrasena: '/recuperar-contrasena',
    tablero: '/tablero',
    pantallasDos: '/pantalla-dos',
    pantallasTres: '/pantalla-tres',
  } as const

  // Colecciones de Firestore
  export const COLECCIONES = {
    usuarios: 'usuarios',
  } as const

  // Nombre de la cookie de sesión
  export const NOMBRE_COOKIE_SESION = 'sesion-auth'

  // Duración de la sesión en milisegundos (5 días)
  export const DURACION_SESION_MS = 5 * 24 * 60 * 60 * 1000

Usar estas constantes en TODO el código. Nunca escribir '/tablero' directamente.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECORDATORIO FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

El objetivo es que cualquier desarrollador pueda abrir cualquier archivo y 
entender qué hace en menos de 30 segundos. Si el código requiere más tiempo
para entenderse, simplificarlo hasta que sea obvio.

Generar TODOS los archivos mencionados. No dejar ninguno como "ejemplo"
o "a completar". Cada archivo debe estar listo para ejecutar.