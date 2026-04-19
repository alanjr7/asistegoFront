# Despliegue en Render (Static Site)

## Configuración lista

El proyecto ya está configurado:
- ✅ `environment.prod.ts` apunta a `https://asistegoback.onrender.com`
- ✅ WebSocket usa URL dinámica con `wss://`
- ✅ `render.yaml` configurado para Static Site

---

## Pasos en Render

### 1. Crear Static Site

1. Ve a [dashboard.render.com](https://dashboard.render.com)
2. Click en **New** → **Static Site**
3. Conecta tu repositorio de GitHub/GitLab

### 2. Configuración

| Campo | Valor |
|-------|-------|
| **Name** | `asistego-front` (o el que prefieras) |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist/asistego-angular/browser` |

### 3. Deploy

- Click **Create Static Site**
- Render hará el build automáticamente
- Espera a que termine (2-3 minutos)

---

## URLs finales

| Servicio | URL |
|----------|-----|
| Frontend | `https://asistego-front.onrender.com` |
| Backend | `https://asistegoback.onrender.com` |
| API Docs | `https://asistegoback.onrender.com/docs` |

---

## Solución de problemas

### Error 404 en rutas de Angular
El archivo `render.yaml` ya incluye rewrites para redirigir todas las rutas a `index.html`. Esto es necesario para que el Angular Router funcione correctamente.

### Build falla
Verifica que `package.json` tenga el script de build:
```json
"scripts": {
  "build": "ng build"
}
```

### No conecta con backend
- Verifica que `environment.prod.ts` tenga la URL correcta del backend
- Asegúrate de que el backend esté funcionando: `https://asistegoback.onrender.com/health`

### WebSocket no funciona
- El protocolo debe ser `wss://` (no `ws://`) en producción HTTPS
- El código ya maneja esto automáticamente
