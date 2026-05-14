# API

Endpoints de Vercel para conectar el modelo del Colab con la interfaz React.

Ruta esperada:

```text
api/predict.ts
```

Debe recibir los valores de un candidato y responder:

- prediccion (`avanza` 0/1).
- probabilidad o score.
- factores explicativos locales.
- contrafactual sugerido si la prediccion es negativa.
