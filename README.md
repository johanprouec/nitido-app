# Nitido App

Interfaz web para el proyecto Nitido: simulacion, auditoria y visualizacion de metricas de un modelo de prefiltrado de candidatos.

## Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS 4
- Vercel

## Desarrollo local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear `.env.local` a partir de `.env.example` y completar las variables necesarias.

3. Levantar la app:

   ```bash
   npm run dev
   ```

4. Abrir `http://localhost:3000`.

## Scripts

- `npm run dev`: servidor local en el puerto 3000.
- `npm run build`: build de produccion en `dist/`.
- `npm run preview`: previsualiza el build.
- `npm run lint`: validacion TypeScript sin emitir archivos.

## GitHub

Repositorio remoto configurado:

```bash
origin https://github.com/johanprouec/nitido-app.git
```

La rama principal es `main`.

## Vercel

Proyecto conectado:

- Vercel project: `johan-velandias-projects/nitido-app`
- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Production URL: `https://nitido-app-red.vercel.app`

## Modelo

La interfaz todavia usa datos estaticos. El siguiente paso es convertir el modelo del Colab en un endpoint de inferencia y conectar el simulador con `fetch` desde React.
