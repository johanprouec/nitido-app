
import json
import joblib
import numpy as np
import pandas as pd
import streamlit as st
import matplotlib.pyplot as plt
import shap


# ============================================================
# Configuración general
# ============================================================

st.set_page_config(
    page_title="NÍTIDO - Prefiltrado de candidatos",
    page_icon="🧠",
    layout="wide"
)

st.title("🧠 NÍTIDO - Sistema de prefiltrado de candidatos")
st.markdown(
    """
    Esta aplicación permite estimar si un candidato **avanza o no avanza** en el proceso de selección,
    usando el modelo final desarrollado para el reto NÍTIDO.

    La app muestra:

    - Probabilidad estimada de avanzar.
    - Predicción final con el umbral seleccionado.
    - Explicación local mediante SHAP.
    - Contrafactual sugerido si el candidato es clasificado como **no avanza**.
    """
)


# ============================================================
# Cargar archivos
# ============================================================

@st.cache_resource
def cargar_modelo():
    modelo = joblib.load("modelo_nitido.pkl")
    return modelo


@st.cache_data
def cargar_metadata():
    with open("metadata.json", "r", encoding="utf-8") as f:
        metadata = json.load(f)
    return metadata


@st.cache_data
def cargar_referencia():
    X_ref = pd.read_csv("X_train_referencia.csv")
    return X_ref


modelo = cargar_modelo()
metadata = cargar_metadata()
X_referencia = cargar_referencia()

umbral = metadata["umbral"]
variables_modelo = metadata["variables_modelo"]
variables_continuas = metadata["variables_continuas"]
variables_discretas = metadata["variables_discretas"]
variables_binarias = metadata["variables_binarias"]
input_config = metadata["input_config"]


# ============================================================
# Funciones auxiliares
# ============================================================

def evaluar_candidato(modelo, candidato, umbral):
    probabilidad = modelo.predict_proba(candidato)[0, 1]
    prediccion = int(probabilidad >= umbral)
    return probabilidad, prediccion


def generar_contrafactual_simple(modelo, candidato_original, X_referencia, umbral):
    """
    Contrafactual simple:
    Busca el cambio de una sola variable que logre pasar el umbral.
    Si no encuentra un cambio de una sola variable, prueba cambios acumulados.
    """

    variables_positivas = ["x1", "x2", "x5", "x3", "x4", "x7", "x9", "x10", "x18"]
    variables_negativas = ["x14", "x15"]

    proba_original, pred_original = evaluar_candidato(modelo, candidato_original, umbral)

    resultados = []

    # Primero buscar cambio mínimo de una sola variable
    for var in variables_positivas + variables_negativas:
        if var not in candidato_original.columns:
            continue

        valor_original = candidato_original[var].iloc[0]

        if var in variables_binarias:
            grid = [0, 1]

        elif var in variables_discretas:
            grid = sorted(X_referencia[var].dropna().unique())

        else:
            min_val = X_referencia[var].quantile(0.01)
            max_val = X_referencia[var].quantile(0.99)
            grid = np.linspace(min_val, max_val, 150)

        for nuevo_valor in grid:
            candidato_temp = candidato_original.copy()

            if var in variables_negativas:
                # Para variables negativas, buscamos disminuir
                if nuevo_valor >= valor_original:
                    continue
            else:
                # Para variables positivas, buscamos aumentar
                if nuevo_valor <= valor_original:
                    continue

            candidato_temp[var] = nuevo_valor
            proba_temp, pred_temp = evaluar_candidato(modelo, candidato_temp, umbral)

            if pred_temp == 1:
                resultados.append({
                    "Variable": var,
                    "Valor original": valor_original,
                    "Valor sugerido": nuevo_valor,
                    "Cambio absoluto": abs(nuevo_valor - valor_original),
                    "Probabilidad original": proba_original,
                    "Probabilidad nueva": proba_temp
                })

    if len(resultados) > 0:
        tabla = pd.DataFrame(resultados)
        tabla = tabla.sort_values(
            by=["Cambio absoluto", "Probabilidad nueva"],
            ascending=[True, True]
        )
        return tabla.head(1)

    # Si no hay contrafactual de una variable, probar una ruta simple acumulada
    candidato_actual = candidato_original.copy()
    pasos = []
    proba_actual = proba_original

    for var in ["x2", "x1", "x4", "x5", "x7", "x9", "x14"]:
        if var not in candidato_actual.columns:
            continue

        valor_original = candidato_actual[var].iloc[0]

        if var in variables_binarias:
            nuevo_valor = 1

        elif var in variables_discretas:
            if var in variables_negativas:
                nuevo_valor = X_referencia[var].quantile(0.25)
            else:
                nuevo_valor = X_referencia[var].max()

        else:
            if var in variables_negativas:
                nuevo_valor = X_referencia[var].quantile(0.25)
            else:
                nuevo_valor = X_referencia[var].quantile(0.90)

        candidato_actual[var] = nuevo_valor
        proba_nueva, pred_nueva = evaluar_candidato(modelo, candidato_actual, umbral)

        if proba_nueva > proba_actual:
            pasos.append({
                "Variable": var,
                "Valor original": valor_original,
                "Valor sugerido": nuevo_valor,
                "Probabilidad antes": proba_actual,
                "Probabilidad después": proba_nueva
            })
            proba_actual = proba_nueva

        if pred_nueva == 1:
            break

    if len(pasos) == 0:
        return pd.DataFrame()

    return pd.DataFrame(pasos)


def calcular_shap_local(modelo, X_referencia, candidato):
    """
    Calcula explicación SHAP local para un candidato.
    Se usa el preprocesador y modelo interno del pipeline.
    """

    preprocesador = modelo.named_steps["preprocesamiento"]
    modelo_interno = modelo.named_steps["modelo"]

    X_ref_transformado = preprocesador.transform(X_referencia)
    candidato_transformado = preprocesador.transform(candidato)

    nombres_variables = (
        variables_continuas +
        variables_discretas +
        variables_binarias
    )

    X_ref_shap = pd.DataFrame(X_ref_transformado, columns=nombres_variables)
    candidato_shap = pd.DataFrame(candidato_transformado, columns=nombres_variables)

    explainer = shap.LinearExplainer(modelo_interno, X_ref_shap)
    shap_values = explainer(candidato_shap)

    valores = shap_values.values[0]

    tabla_shap = pd.DataFrame({
        "Variable": nombres_variables,
        "Valor SHAP": valores,
        "Impacto absoluto": np.abs(valores)
    }).sort_values("Impacto absoluto", ascending=False)

    return tabla_shap, shap_values


# ============================================================
# Formulario de entrada
# ============================================================

st.sidebar.header("📋 Ingreso de variables del candidato")
st.sidebar.caption("Ingrese los valores de las variables anonimizadas del candidato.")

entrada = {}

for variable in variables_modelo:
    config = input_config[variable]

    if config["tipo"] == "binaria":
        entrada[variable] = st.sidebar.selectbox(
            variable,
            options=config["valores"],
            index=config["valores"].index(config["default"])
        )

    elif config["tipo"] == "discreta":
        valores = config["valores"]
        default = config["default"]

        if default in valores:
            index_default = valores.index(default)
        else:
            index_default = 0

        entrada[variable] = st.sidebar.selectbox(
            variable,
            options=valores,
            index=index_default
        )

    else:
        entrada[variable] = st.sidebar.slider(
            variable,
            min_value=float(config["min"]),
            max_value=float(config["max"]),
            value=float(config["default"]),
            step=(float(config["max"]) - float(config["min"])) / 100
        )


candidato = pd.DataFrame([entrada], columns=variables_modelo)


# ============================================================
# Predicción
# ============================================================

st.markdown("---")
st.header("🔎 Resultado de la predicción")

probabilidad, prediccion = evaluar_candidato(modelo, candidato, umbral)

col1, col2, col3 = st.columns(3)

with col1:
    st.metric("Probabilidad de avanzar", f"{probabilidad:.2%}")

with col2:
    st.metric("Umbral de decisión", f"{umbral:.2f}")

with col3:
    if prediccion == 1:
        st.success("Predicción: AVANZA")
    else:
        st.error("Predicción: NO AVANZA")


st.progress(float(probabilidad))

if prediccion == 1:
    st.info("El modelo clasifica al candidato como aprobado para avanzar a la siguiente etapa.")
else:
    st.warning("El modelo clasifica al candidato como no aprobado. Se recomienda revisar el contrafactual y considerar revisión humana si la probabilidad está cerca del umbral.")


# ============================================================
# Datos ingresados
# ============================================================

with st.expander("Ver valores ingresados del candidato"):
    st.dataframe(candidato, use_container_width=True)


# ============================================================
# SHAP local
# ============================================================

st.markdown("---")
st.header("📌 Explicación local SHAP")

try:
    tabla_shap, shap_values_local = calcular_shap_local(
        modelo,
        X_referencia,
        candidato
    )

    st.markdown(
        """
        La siguiente tabla muestra las variables que más influyeron en esta predicción individual.

        - Valores SHAP positivos empujan la predicción hacia **avanza**.
        - Valores SHAP negativos empujan la predicción hacia **no avanza**.
        """
    )

    tabla_shap_mostrar = tabla_shap.head(10).copy()
    tabla_shap_mostrar["Dirección"] = tabla_shap_mostrar["Valor SHAP"].apply(
        lambda x: "Aumenta probabilidad de avanzar" if x > 0 else "Disminuye probabilidad de avanzar"
    )

    st.dataframe(tabla_shap_mostrar, use_container_width=True)

    fig, ax = plt.subplots(figsize=(8, 5))
    tabla_plot = tabla_shap.head(10).sort_values("Valor SHAP")

    ax.barh(
        tabla_plot["Variable"],
        tabla_plot["Valor SHAP"],
        edgecolor="black"
    )
    ax.axvline(0, color="black", linewidth=1)
    ax.set_title("Contribuciones SHAP locales")
    ax.set_xlabel("Valor SHAP")
    ax.set_ylabel("Variable")
    ax.grid(axis="x", linestyle="--", alpha=0.4)

    st.pyplot(fig)

except Exception as e:
    st.error("No fue posible calcular SHAP local.")
    st.write(e)


# ============================================================
# Contrafactual
# ============================================================

st.markdown("---")
st.header("🔁 Contrafactual sugerido")

if prediccion == 0:
    tabla_cf = generar_contrafactual_simple(
        modelo,
        candidato,
        X_referencia,
        umbral
    )

    if len(tabla_cf) > 0:
        st.markdown(
            """
            El contrafactual muestra qué cambio técnico en las variables permitiría que el candidato
            pase de **no avanza** a **avanza**, según el modelo.

            Como las variables están anonimizadas, esta sugerencia no debe interpretarse como una recomendación real sobre una característica personal,
            sino como una explicación técnica del comportamiento del modelo.
            """
        )
        st.dataframe(tabla_cf, use_container_width=True)
    else:
        st.warning("No se encontró un contrafactual simple dentro de los rangos evaluados.")
else:
    st.success("El candidato ya fue clasificado como aprobado. No se requiere contrafactual.")


# ============================================================
# Nota ética
# ============================================================

st.markdown("---")
st.subheader("⚠️ Nota de uso responsable")

st.markdown(
    """
    Esta aplicación es un prototipo académico.
    Las variables están anonimizadas, por lo que el modelo no debe usarse como sistema automático definitivo
    sin una auditoría interna de significado de variables, revisión de posibles sesgos y supervisión humana.
    """
)
