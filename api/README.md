# API

Endpoints de Vercel para conectar el modelo del Colab con la interfaz React.

Ruta esperada:

```text
api/predict.py
```

El endpoint debe cargar `models/modelo_nitido.pkl` con `joblib`, leer el umbral y el orden de variables desde `models/metadata.json`, usar `models/X_train_referencia.csv` para explicaciones/contrafactuales, y responder:

- prediccion (`avanza` 0/1).
- probabilidad o score.
- umbral operativo.
- factores explicativos locales.
- contrafactual sugerido si la prediccion es negativa.
