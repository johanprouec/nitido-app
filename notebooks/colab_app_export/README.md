# NÍTIDO - App de prefiltrado de candidatos

Esta aplicación fue desarrollada como parte del reto NÍTIDO del curso Machine Learning II.

## Objetivo

La app permite ingresar los valores de un candidato nuevo y obtener:

- Probabilidad estimada de avanzar.
- Predicción final usando el umbral definido.
- Explicación local mediante SHAP.
- Contrafactual sugerido si el candidato es clasificado como "No avanza".

## Modelo utilizado

El modelo final seleccionado fue una regresión logística baseline, debido a que presentó el mejor equilibrio entre desempeño, interpretabilidad y facilidad de auditoría.
El único modelo exportado como artefacto final en esta versión es `modelo_nitido.pkl`.

## Umbral de decisión

El umbral utilizado es 0.45, seleccionado porque mejora el F1-score y reduce falsos negativos frente al umbral estándar de 0.50.

## Archivos principales

- `app.py`: aplicación principal en Streamlit.
- `modelo_nitido.pkl`: pipeline sklearn entrenado de la regresión logística baseline final.
- `metadata.json`: configuración de variables y umbral.
- `X_train_referencia.csv`: datos de referencia para SHAP y contrafactuales.
- `requirements.txt`: librerías necesarias para ejecutar la app.

## Nota ética

Esta aplicación es un prototipo académico. Las variables están anonimizadas, por lo que el modelo no debe utilizarse como sistema automático definitivo sin auditoría interna de variables, revisión de sesgos y supervisión humana.
