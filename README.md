# Nido — su app familiar

App privada para ustedes dos: listas de compras, compras próximas para el bebé,
lista de deseos y un calendario compartido. Todo se sincroniza en tiempo real
entre los dos teléfonos, y todo el hosting y la base de datos son gratuitos
(planes gratuitos de Firebase + Vercel).

## 0. Lo que vas a necesitar
- Una cuenta de Google (para Firebase, gratis).
- Node.js instalado en tu computadora (https://nodejs.org, versión LTS).
- Una cuenta gratuita en Vercel o Netlify (para publicar la app).

## 1. Crear el proyecto en Firebase (la base de datos, gratis)
1. Ve a https://console.firebase.google.com y crea un proyecto nuevo (ej. "nido-familia").
2. En el menú lateral entra a **Build > Authentication**. Haz clic en "Get started"
   y activa el método **Correo/contraseña**.
3. Dentro de Authentication, pestaña "Users", crea manualmente dos usuarios:
   tu correo y el de tu esposa, cada uno con su contraseña. Esas son las cuentas
   con las que van a entrar a la app.
4. En el menú lateral entra a **Build > Firestore Database** y crea la base de
   datos (elige el modo de producción, y la región más cercana a ustedes, ej.
   `us-central` o `southamerica-east1`).
5. Dentro de Firestore, pestaña **Rules**, borra lo que hay y pega el contenido
   del archivo `firestore.rules` de este proyecto, cambiando los dos correos de
   ejemplo por los correos reales que registraron. Publica los cambios.
6. Ve a **Configuración del proyecto** (el engranaje) > **Tus apps** > icono
   `</>` (Web). Registra una app (el nombre no importa). Firebase te va a dar
   un objeto de configuración (`apiKey`, `authDomain`, etc.) — lo vas a
   necesitar en el paso 2.

## 2. Configurar el proyecto en tu computadora
1. Descarga/copia esta carpeta a tu computadora.
2. Copia el archivo `.env.example` y renómbralo a `.env`.
3. Abre `.env` y pega ahí los valores que Firebase te dio en el paso 1.6.
4. Instala las dependencias:
   ```bash
   npm install
   ```
5. Corre la app localmente para probarla:
   ```bash
   npm run dev
   ```
   Abre la URL que aparece (normalmente `http://localhost:5173`) e intenta
   entrar con uno de los correos que creaste.

## 3. Publicar la app gratis (para que funcione en ambos celulares)
La forma más fácil es con **Vercel** (gratis):
1. Crea una cuenta en https://vercel.com (puedes usar tu cuenta de GitHub).
2. Sube esta carpeta a un repositorio de GitHub (o usa `vercel` desde la
   terminal con `npx vercel` dentro de la carpeta del proyecto).
3. En Vercel, "Add New Project", importa el repositorio.
4. En "Environment Variables" agrega las mismas 6 variables que pusiste en tu
   `.env` (los mismos nombres, `VITE_FIREBASE_...`).
5. Dale a Deploy. En un par de minutos te da un link tipo
   `https://nido-familia.vercel.app`.
6. Comparte ese link con tu esposa. Cada uno entra con su propio correo y
   contraseña, y desde ahí pueden "Agregar a pantalla de inicio" en el
   celular para que se sienta como una app instalada.

## 4. Cómo está organizada la app
- **Compras**: listas de compras ilimitadas (supermercado, farmacia, lo que
  quieran), con artículos, cantidades y marcado de "comprado".
- **Para el bebé**: lista aparte para las compras del bebé, con prioridad
  (urgente / pronto / más adelante) y precio estimado, con un total de lo
  pendiente por comprar.
- **Deseos**: cosas que les gustaría tener, con link opcional.
- **Calendario**: calendario mensual compartido para citas, compras
  programadas o pendientes; ambos ven los mismos eventos.
- El círculo en la parte de arriba es la cuenta regresiva de semanas para el
  parto — tócalo una vez para poner la fecha probable, y se actualiza solo.

## 5. Costos
Con Firebase (plan Spark, gratis) y Vercel (plan Hobby, gratis) esta app no
tiene ningún costo para el uso de dos personas. Los límites gratuitos de
Firebase son muy altos para un caso de uso como este (miles de lecturas y
escrituras diarias gratis).

## Estructura de archivos
```
package.json
vite.config.js
tailwind.config.js
postcss.config.js
index.html
.env.example
firestore.rules
src/
  main.jsx
  App.jsx
  firebase.js
  index.css
  contexts/AuthContext.jsx
  components/
    Login.jsx
    Header.jsx
    ShoppingLists.jsx
    BabyList.jsx
    Wishlist.jsx
    CalendarView.jsx
```
