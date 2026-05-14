# Models

Artefactos exportados del Colab:

```text
modelo_nitido.pkl
metadata.json
X_train_referencia.csv
```

Segun el notebook, el unico modelo final exportado como artefacto es `modelo_nitido.pkl`.
Este archivo corresponde a la regresion logistica baseline final con pipeline sklearn y umbral operativo `0.45`.

Estado actual:

- `modelo_nitido.pkl` cargado: regresion logistica baseline final.
- `metadata.json` cargado y verificado: umbral `0.45`, 18 variables de entrada.
- `X_train_referencia.csv` cargado y verificado: 3500 filas, 18 columnas.

Pendiente tecnico:

- Instalar dependencias Python para validar el `pkl` localmente.
- Crear endpoint de inferencia en `api/` para Vercel.
