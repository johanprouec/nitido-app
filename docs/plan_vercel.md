# Plan de App en Vercel

La app se construira como una experiencia web completa en React/Vite, desplegada en Vercel y conectada a GitHub.

## Flujo esperado

1. El usuario ingresa las 18 variables del candidato.
2. La interfaz envia los datos a un endpoint de Vercel.
3. El endpoint ejecuta la inferencia del modelo exportado desde Colab.
4. La respuesta incluye prediccion, probabilidad, explicabilidad local y contrafactual.
5. La interfaz presenta el resultado de forma clara para la sustentacion.

## Requisitos funcionales equivalentes

- Inputs para candidato nuevo.
- Prediccion del modelo.
- Visualizacion de explicabilidad local.
- Contrafactual accionable para rechazados.
- Link publico desplegado.

## Pendiente del Colab

- Dataset `data/candidatos_nitido.csv`.
- Notebook `notebooks/modelo_nitido.ipynb`.
- Artefactos exportados en `models/`.
