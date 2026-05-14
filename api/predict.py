from http.server import BaseHTTPRequestHandler
from pathlib import Path
import json

import joblib
import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
MODELS_DIR = ROOT / "models"

MODEL = None
METADATA = None
REFERENCE = None


def load_assets():
    global MODEL, METADATA, REFERENCE

    if MODEL is None:
        MODEL = joblib.load(MODELS_DIR / "modelo_nitido.pkl")

    if METADATA is None:
        with (MODELS_DIR / "metadata.json").open("r", encoding="utf-8") as f:
            METADATA = json.load(f)

    if REFERENCE is None:
        REFERENCE = pd.read_csv(MODELS_DIR / "X_train_referencia.csv")

    return MODEL, METADATA, REFERENCE


def json_response(handler, payload, status=200):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def build_candidate(payload, metadata):
    variables = metadata["variables_modelo"]
    config = metadata["input_config"]
    row = {}

    for variable in variables:
        value = payload.get(variable, config[variable]["default"])
        try:
            row[variable] = float(value)
        except (TypeError, ValueError):
            raise ValueError(f"Valor inválido para {variable}: {value!r}")

    return pd.DataFrame([row], columns=variables)


def evaluate_candidate(model, candidate, threshold):
    probability = float(model.predict_proba(candidate)[0, 1])
    prediction = int(probability >= threshold)
    return probability, prediction


def local_factors(model, metadata, candidate, limit=8):
    try:
        preprocessor = model.named_steps["preprocesamiento"]
        inner_model = model.named_steps["modelo"]
        transformed = preprocessor.transform(candidate)
        coefs = inner_model.coef_[0]
    except Exception:
        return []

    names = (
        metadata["variables_continuas"]
        + metadata["variables_discretas"]
        + metadata["variables_binarias"]
    )
    values = np.asarray(transformed)[0]
    contributions = values * coefs

    factors = []
    for name, contribution in zip(names, contributions):
        factors.append(
            {
                "variable": name,
                "valor": float(candidate[name].iloc[0]) if name in candidate else None,
                "impacto": float(contribution),
                "direccion": "aumenta" if contribution >= 0 else "disminuye",
            }
        )

    factors.sort(key=lambda item: abs(item["impacto"]), reverse=True)
    return factors[:limit]


def counterfactual(model, metadata, reference, candidate, threshold):
    variables_positive = ["x1", "x2", "x5", "x3", "x4", "x7", "x9", "x10", "x18"]
    variables_negative = ["x14", "x15"]
    binary = set(metadata["variables_binarias"])
    discrete = set(metadata["variables_discretas"])

    original_probability, _ = evaluate_candidate(model, candidate, threshold)
    candidates = []

    for variable in variables_positive + variables_negative:
        if variable not in candidate.columns:
            continue

        original_value = float(candidate[variable].iloc[0])

        if variable in binary:
            grid = [0.0, 1.0]
        elif variable in discrete:
            grid = sorted(float(v) for v in reference[variable].dropna().unique())
        else:
            min_value = float(reference[variable].quantile(0.01))
            max_value = float(reference[variable].quantile(0.99))
            grid = np.linspace(min_value, max_value, 80)

        for new_value in grid:
            if variable in variables_negative and new_value >= original_value:
                continue
            if variable not in variables_negative and new_value <= original_value:
                continue

            candidate_temp = candidate.copy()
            candidate_temp[variable] = float(new_value)
            probability, prediction = evaluate_candidate(model, candidate_temp, threshold)

            if prediction == 1:
                candidates.append(
                    {
                        "variable": variable,
                        "valor_original": original_value,
                        "valor_sugerido": float(new_value),
                        "cambio_absoluto": abs(float(new_value) - original_value),
                        "probabilidad_original": original_probability,
                        "probabilidad_nueva": probability,
                    }
                )

    if candidates:
        candidates.sort(key=lambda item: (item["cambio_absoluto"], item["probabilidad_nueva"]))
        return candidates[0]

    return None


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        json_response(self, {"ok": True})

    def do_GET(self):
        _, metadata, _ = load_assets()
        json_response(
            self,
            {
                "umbral": metadata["umbral"],
                "variables_modelo": metadata["variables_modelo"],
                "input_config": metadata["input_config"],
            },
        )

    def do_POST(self):
        try:
            model, metadata, reference = load_assets()
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_length).decode("utf-8")
            payload = json.loads(raw_body or "{}")

            candidate = build_candidate(payload, metadata)
            threshold = float(metadata["umbral"])
            probability, prediction = evaluate_candidate(model, candidate, threshold)
            factors = local_factors(model, metadata, candidate)
            suggested_counterfactual = None

            if prediction == 0:
                suggested_counterfactual = counterfactual(
                    model,
                    metadata,
                    reference,
                    candidate,
                    threshold,
                )

            json_response(
                self,
                {
                    "probabilidad": probability,
                    "prediccion": prediction,
                    "estado": "AVANZA" if prediction == 1 else "NO AVANZA",
                    "umbral": threshold,
                    "factores": factors,
                    "contrafactual": suggested_counterfactual,
                    "entrada": candidate.iloc[0].to_dict(),
                },
            )
        except Exception as exc:
            json_response(
                self,
                {
                    "error": "No fue posible calcular la predicción.",
                    "detalle": str(exc),
                },
                status=500,
            )
