/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Network, 
  Bolt, 
  ShieldCheck, 
  BarChart3, 
  Database,
  Monitor,
  Activity,
  History,
  Settings2,
  AlertCircle,
  TrendingUp,
  Cpu,
  Fingerprint,
  ToggleRight,
  Printer,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import executiveReportHtml from '../docs/informe_ejecutivo_nitido.html?raw';
import technicalBookletHtml from '../docs/cuadernillo_tecnico_nitido.html?raw';

// --- Types ---
type ViewId = 'dashboard' | 'audit' | 'simulate' | 'metrics' | 'compliance' | 'executive-report' | 'technical-booklet';

type InputConfig =
  | { tipo: 'continua'; min: number; max: number; default: number }
  | { tipo: 'discreta' | 'binaria'; valores: number[]; default: number };

type PredictionFactor = {
  variable: string;
  valor: number | null;
  impacto: number;
  direccion: 'aumenta' | 'disminuye';
};

type Counterfactual = {
  variable: string;
  valor_original: number;
  valor_sugerido: number;
  cambio_absoluto: number;
  probabilidad_original: number;
  probabilidad_nueva: number;
};

type PredictionResult = {
  probabilidad: number;
  prediccion: 0 | 1;
  estado: string;
  umbral: number;
  factores: PredictionFactor[];
  contrafactual: Counterfactual | null;
};

type ComparisonSnapshot = {
  id: string;
  label: string;
  createdAt: string;
  candidate: Record<string, number>;
  result: PredictionResult;
};

const VARIABLES_MODELO = [
  'x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7', 'x8', 'x9',
  'x10', 'x11', 'x12', 'x13', 'x14', 'x15', 'x16', 'x17', 'x18'
] as const;

const INPUT_CONFIG: Record<string, InputConfig> = {
  x1: { tipo: 'continua', min: 0, max: 25, default: 3.5 },
  x2: { tipo: 'continua', min: 7, max: 100, default: 65 },
  x3: { tipo: 'discreta', valores: [1, 2, 3, 4, 5], default: 3 },
  x4: { tipo: 'discreta', valores: [0, 1, 2, 3, 4, 5, 6, 7, 8], default: 2 },
  x5: { tipo: 'binaria', valores: [0, 1], default: 1 },
  x6: { tipo: 'continua', min: 22, max: 65, default: 35 },
  x7: { tipo: 'discreta', valores: [1, 2, 3, 4, 5, 6], default: 3 },
  x8: { tipo: 'discreta', valores: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], default: 3 },
  x9: { tipo: 'discreta', valores: [0, 1, 2, 3], default: 1 },
  x10: { tipo: 'continua', min: 3, max: 5, default: 3.8 },
  x11: { tipo: 'continua', min: 0.1, max: 100, default: 51.4 },
  x12: { tipo: 'discreta', valores: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], default: 3 },
  x13: { tipo: 'discreta', valores: [0, 1, 2, 3], default: 2 },
  x14: { tipo: 'continua', min: 0, max: 24, default: 2.7 },
  x15: { tipo: 'continua', min: 1, max: 50, default: 8.3 },
  x16: { tipo: 'continua', min: 0, max: 100, default: 50 },
  x17: { tipo: 'binaria', valores: [0, 1], default: 1 },
  x18: { tipo: 'discreta', valores: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], default: 3 },
};

const CONTINUOUS_VARIABLES = VARIABLES_MODELO.filter((variable) => INPUT_CONFIG[variable].tipo === 'continua');
const DISCRETE_VARIABLES = VARIABLES_MODELO.filter((variable) => INPUT_CONFIG[variable].tipo === 'discreta');
const BINARY_VARIABLES = VARIABLES_MODELO.filter((variable) => INPUT_CONFIG[variable].tipo === 'binaria');

const DEFAULT_CANDIDATE = VARIABLES_MODELO.reduce<Record<string, number>>((acc, variable) => {
  acc[variable] = INPUT_CONFIG[variable].default;
  return acc;
}, {});

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
const formatNumber = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(2);

const COLOR_MAP: Record<string, string> = {
  primary: '#8b5cf6',
  secondary: '#14b8a6',
  tertiary: '#f97316',
  error: '#ef4444',
};

const toRgba = (hex: string, alpha: number) => {
  const value = parseInt(hex.replace('#', ''), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getResultTag = (probabilidad: number, umbral: number) => {
  const distance = Math.abs(probabilidad - umbral);
  const isUncertain = distance <= 0.08;

  if (isUncertain) {
    return {
      label: 'Zona de incertidumbre — revisar manualmente',
      color: COLOR_MAP.tertiary,
      background: toRgba(COLOR_MAP.tertiary, 0.14),
    };
  }

  return probabilidad >= umbral
    ? {
      label: 'Avanza con buena confianza',
      color: COLOR_MAP.secondary,
      background: toRgba(COLOR_MAP.secondary, 0.14),
    }
    : {
      label: 'No avanza con buena confianza',
      color: COLOR_MAP.error,
      background: toRgba(COLOR_MAP.error, 0.14),
    };
};

const getUncertaintyDetails = (result: PredictionResult) => {
  const distance = Math.abs(result.probabilidad - result.umbral);
  const isUncertain = distance <= 0.08;

  if (!isUncertain) {
    return {
      isUncertain,
      title: 'Decisión fuera de la zona crítica',
      description: 'La probabilidad está suficientemente separada del umbral operativo. Aun así, el resultado debe usarse como priorización y no como decisión automática.',
      action: 'Revisar factores principales y continuar con el flujo normal del equipo.',
    };
  }

  return {
    isUncertain,
    title: 'Zona de incertidumbre: revisión humana obligatoria',
    description: `La probabilidad está a solo ${formatPercent(distance)} del umbral ${result.umbral.toFixed(2)}. En esta franja, un pequeño cambio de datos, contexto o calibración puede cambiar la decisión.`,
    action: 'Validar la calidad de los datos, revisar los factores locales, contrastar el caso con criterio humano y documentar la razón final antes de avanzar o descartar.',
  };
};

const SAMPLE_CASES: Record<string, Record<string, number>> = {
  aprobado: {
    x1: 4.5, x2: 85, x3: 5, x4: 7, x5: 1, x6: 28, x7: 5, x8: 9, x9: 3,
    x10: 4.6, x11: 72, x12: 9, x13: 3, x14: 1.5, x15: 6, x16: 88, x17: 1, x18: 8,
  },
  rechazado: {
    x1: 1.2, x2: 20, x3: 1, x4: 1, x5: 0, x6: 60, x7: 1, x8: 2, x9: 0,
    x10: 3.2, x11: 12, x12: 1, x13: 0, x14: 20, x15: 40, x16: 12, x17: 0, x18: 1,
  },
  borderline: {
    x1: 3.5, x2: 65, x3: 3, x4: 2, x5: 1, x6: 35, x7: 3, x8: 3, x9: 1,
    x10: 3.8, x11: 51.4, x12: 3, x13: 2, x14: 2.7, x15: 8.3, x16: 50, x17: 1, x18: 3,
  },
};

const MODEL_COMPARISON = [
  { model: 'Regresión logística baseline', accuracy: '0.7600', precision: '0.7626', recall: '0.7199', f1: '0.7406', auc: '0.8298' },
  { model: 'Random Forest', accuracy: '0.7307', precision: '0.7341', recall: '0.6807', f1: '0.7064', auc: '0.8044' },
  { model: 'Gradient Boosting', accuracy: '0.7467', precision: '0.7538', recall: '0.6947', f1: '0.7230', auc: '0.8117' },
];

const TUNED_MODEL_COMPARISON = [
  { model: 'Regresión logística ajustada', accuracy: '0.7333', precision: '0.7116', recall: '0.7395', f1: '0.7253', auc: '0.8186' },
  { model: 'Random Forest ajustado', accuracy: '0.7440', precision: '0.7391', recall: '0.7143', f1: '0.7265', auc: '0.8070' },
  { model: 'Gradient Boosting ajustado', accuracy: '0.7467', precision: '0.7463', recall: '0.7087', f1: '0.7270', auc: '0.8168' },
];

const THRESHOLD_COMPARISON = [
  { threshold: '0.50', accuracy: '0.7600', precision: '0.7626', recall: '0.7199', f1: '0.7406', auc: '0.8298', fp: '80', fn: '100' },
  { threshold: '0.45', accuracy: '0.7613', precision: '0.7405', recall: '0.7675', f1: '0.7538', auc: '0.8298', fp: '96', fn: '83' },
];

const TEST_METRICS = [
  { l: 'Exactitud', v: 73, label: '0.7267', color: 'primary' },
  { l: 'Precisión', v: 70, label: '0.6951', color: 'secondary' },
  { l: 'Sensibilidad', v: 76, label: '0.7556', color: 'tertiary' },
  { l: 'F1', v: 72, label: '0.7241', color: 'primary' },
  { l: 'AUC', v: 81, label: '0.8056', color: 'secondary' },
];

const SHAP_GLOBAL = [
  { variable: 'x1', value: 0.9282 },
  { variable: 'x2', value: 0.7725 },
  { variable: 'x5', value: 0.4553 },
  { variable: 'x9', value: 0.3551 },
  { variable: 'x7', value: 0.3147 },
  { variable: 'x10', value: 0.2970 },
  { variable: 'x4', value: 0.2944 },
  { variable: 'x3', value: 0.2533 },
  { variable: 'x14', value: 0.2289 },
];

const PERMUTATION_IMPORTANCE = [
  { variable: 'x1', value: 0.1171 },
  { variable: 'x2', value: 0.0936 },
  { variable: 'x5', value: 0.0242 },
  { variable: 'x9', value: 0.0202 },
  { variable: 'x3', value: 0.0193 },
  { variable: 'x4', value: 0.0190 },
  { variable: 'x7', value: 0.0130 },
  { variable: 'x14', value: 0.0126 },
  { variable: 'x10', value: 0.0103 },
];

const CEO_TALKING_POINTS = [
  {
    title: 'Qué promete la app',
    text: 'La app no reemplaza al equipo de selección: ordena candidatos, explica por qué el modelo los prioriza y ayuda a enfocar la revisión humana donde más valor tiene.',
  },
  {
    title: 'Por qué el umbral es 0.45',
    text: 'En prefiltrado, perder candidatos buenos suele ser más costoso que revisar algunos casos extra. Por eso el corte baja de 0.50 a 0.45 y los casos cercanos quedan marcados para revisión.',
  },
  {
    title: 'Cómo leer F1 y AUC',
    text: 'F1 resume el balance entre avanzar perfiles correctos y no dejar por fuera perfiles valiosos. AUC confirma que el modelo separa razonablemente bien a los candidatos en el ranking general.',
  },
  {
    title: 'Cuál es la recomendación',
    text: 'Usarla como prototipo de apoyo, con auditoría de variables, monitoreo de sesgos y bitácora de decisiones antes de cualquier automatización en producción.',
  },
];

const COMPLIANCE_ACTIONS = [
  { phase: 'Fase 1', action: 1, title: 'EDA visual con hallazgos explícitos', evidence: 'Distribuciones, rangos, tipos de variables y diferencias por clase documentadas en el cuadernillo.' },
  { phase: 'Fase 1', action: 2, title: 'Calidad de datos', evidence: 'NAs, outliers y desbalance revisados; decisiones de tratamiento justificadas.' },
  { phase: 'Fase 1', action: 3, title: 'Correlaciones', evidence: 'Pares redundantes y señales para modelado posterior identificadas.' },
  { phase: 'Fase 2', action: 4, title: 'Partición train / validation / test', evidence: 'Separación usada para entrenar, ajustar y evaluar sin filtrar información.' },
  { phase: 'Fase 2', action: 5, title: 'Estandarización/codificación', evidence: 'Pipeline con transformaciones consistentes para variables continuas, discretas y binarias.' },
  { phase: 'Fase 2', action: 6, title: 'Desbalance de clases', evidence: 'Balance de clases revisado y decisión metodológica explicada.' },
  { phase: 'Fase 2', action: 7, title: 'Baseline interpretable', evidence: 'Regresión logística como referencia explicable.' },
  { phase: 'Fase 2', action: 8, title: 'Modelos complejos competidores', evidence: 'Random Forest y Gradient Boosting comparados frente al baseline.' },
  { phase: 'Fase 2', action: 9, title: 'Búsqueda de hiperparámetros', evidence: 'Grilla y validación cruzada documentadas en el cuadernillo técnico.' },
  { phase: 'Fase 2', action: 10, title: 'Elección razonada del modelo final', evidence: 'Decisión basada en desempeño, explicabilidad y riesgo regulatorio.' },
  { phase: 'Fase 3', action: 11, title: 'Métrica principal justificada', evidence: 'F1 elegido por balance entre precisión y sensibilidad.' },
  { phase: 'Fase 3', action: 12, title: 'Matriz, ROC/PR y umbral', evidence: 'Matriz de confusión, ROC y umbral 0.45 explicados en la vista de métricas.' },
  { phase: 'Fase 3', action: 13, title: 'Train vs test y sobreajuste', evidence: 'Evaluación honesta reportada; no se ocultan brechas de generalización.' },
  { phase: 'Fase 3', action: 14, title: 'Permutation Importance + SHAP global', evidence: 'Variables globalmente influyentes interpretadas en auditoría/cuadernillo.' },
  { phase: 'Fase 3', action: 15, title: 'PDP + ICE', evidence: 'Efectos por variables top documentados con interpretación.' },
  { phase: 'Fase 3', action: 16, title: 'SHAP local + LIME en 3 casos', evidence: 'App incluye caso aprobado, rechazado y borderline para defender explicabilidad local.' },
  { phase: 'Fase 3', action: 17, title: 'Contrafactuales accionables', evidence: 'El simulador sugiere cambios cuando la predicción es negativa.' },
  { phase: 'Fase 4', action: 18, title: 'Auditoría de sesgos vía XAI', evidence: 'Sección dedicada a riesgos de proxy, variables anonimizadas y controles.' },
  { phase: 'Fase 4', action: 19, title: 'App funcional', evidence: 'App React/Vercel con inputs, predicción, explicación local y contrafactual para comité ejecutivo.' },
  { phase: 'Fase 4', action: 20, title: 'Recomendación final al CEO', evidence: 'Salida condicionada: piloto supervisado, auditoría y revisión humana.' },
];

const BIAS_AUDIT_POINTS = [
  {
    title: 'Riesgo por anonimización',
    text: 'Como las variables están ocultas, no se puede afirmar que el modelo sea libre de sesgo. Una variable x puede actuar como proxy de edad, género, ubicación, institución educativa, nivel socioeconómico u otra condición sensible.',
  },
  {
    title: 'Riesgo por proxies',
    text: 'Las variables con alta importancia global deben revisarse con NÍTIDO antes de producción. Si una variable concentra mucho poder predictivo, puede estar capturando una señal legítima o una desigualdad histórica.',
  },
  {
    title: 'Riesgo histórico',
    text: 'La etiqueta avanza replica decisiones pasadas. Si el sistema histórico descartó injustamente ciertos perfiles, el modelo puede aprender ese patrón aunque sus métricas generales sean buenas.',
  },
  {
    title: 'Control recomendado',
    text: 'Antes de venderlo a bancos o clientes sensibles, se debe desanonimizar internamente para auditoría, medir desempeño por subgrupos, monitorear falsos negativos y mantener revisión humana en casos borderline.',
  },
];

const buildPlainExplanation = (result: PredictionResult) => {
  const positiveFactors = result.factores.filter((factor) => factor.impacto > 0).slice(0, 2);
  const negativeFactors = result.factores.filter((factor) => factor.impacto < 0).slice(0, 2);
  const distance = Math.abs(result.probabilidad - result.umbral);
  const isClose = distance < 0.08;
  const decisionText = result.prediccion === 1
    ? `El candidato supera el umbral definido por el equipo: su probabilidad estimada es ${formatPercent(result.probabilidad)}, por encima del ${formatPercent(result.umbral)} requerido.`
    : `El candidato queda por debajo del umbral definido por el equipo: su probabilidad estimada es ${formatPercent(result.probabilidad)}, menor al ${formatPercent(result.umbral)} requerido.`;

  const confidenceText = isClose
    ? 'Es un caso cercano al límite, por lo que conviene revisarlo manualmente antes de tomar una decisión definitiva.'
    : result.prediccion === 1
      ? 'La señal del modelo es suficientemente favorable para priorizarlo en la siguiente etapa.'
      : 'La señal del modelo es débil frente al estándar usado para avanzar a entrevista.';

  const positiveText = positiveFactors.length > 0
    ? `Los factores que más ayudan en esta predicción son ${positiveFactors.map((factor) => factor.variable).join(' y ')}.`
    : 'No hay factores positivos dominantes en esta predicción.';

  const negativeText = negativeFactors.length > 0
    ? `Los factores que más reducen la probabilidad son ${negativeFactors.map((factor) => factor.variable).join(' y ')}.`
    : 'No hay factores negativos fuertes en esta predicción.';

  const counterfactualText = result.contrafactual
    ? `Como alternativa técnica, el modelo sugiere que mover ${result.contrafactual.variable} de ${formatNumber(result.contrafactual.valor_original)} a ${formatNumber(result.contrafactual.valor_sugerido)} llevaría la probabilidad aproximada a ${formatPercent(result.contrafactual.probabilidad_nueva)}.`
    : result.prediccion === 1
      ? 'No se propone contrafactual porque el candidato ya supera el umbral de avance.'
      : 'No se encontró un cambio simple que lleve el caso por encima del umbral dentro de los rangos evaluados.';

  return {
    decisionText,
    confidenceText,
    positiveText,
    negativeText,
    counterfactualText,
  };
};

const PrintableReport = ({
  result,
  candidate,
  explanation,
}: {
  result: PredictionResult;
  candidate: Record<string, number>;
  explanation: ReturnType<typeof buildPlainExplanation>;
}) => {
  const outcome = getResultTag(result.probabilidad, result.umbral);
  const generatedAt = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <section id="print-report" className="hidden report-page p-8">
      <header className="mb-8 border-b border-slate-200 pb-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-700">NÍTIDO Decision Lab</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Reporte de prefiltrado de candidato</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Resultado generado por el modelo de regresión logística. Este reporte documenta la probabilidad, la decisión sugerida, los factores explicativos y las recomendaciones de revisión humana.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Fecha</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{generatedAt}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <div className="report-card">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Probabilidad</p>
          <p className="mt-2 text-3xl font-bold text-indigo-700">{formatPercent(result.probabilidad)}</p>
          <p className="mt-2 text-sm text-slate-600">Probabilidad estimada de avanzar a entrevista.</p>
        </div>
        <div className="report-card">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Umbral</p>
          <p className="mt-2 text-3xl font-bold text-cyan-700">{result.umbral.toFixed(2)}</p>
          <p className="mt-2 text-sm text-slate-600">Punto de corte operativo usado para transformar probabilidad en decisión.</p>
        </div>
        <div className="report-card">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Decisión sugerida</p>
          <p className="mt-2 text-xl font-bold text-slate-950">{outcome.label}</p>
          <p className="mt-2 text-sm text-slate-600">Requiere revisión humana si está cerca del umbral.</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {[explanation.decisionText, explanation.confidenceText, explanation.positiveText, explanation.negativeText].map((text, index) => (
          <div key={index} className="report-card">
            <p className="text-sm leading-relaxed text-slate-700">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 report-card">
        <h2 className="text-lg font-bold text-slate-950">Factores locales más influyentes</h2>
        <div className="mt-4 space-y-3">
          {result.factores.slice(0, 6).map((factor) => (
            <div key={factor.variable} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
              <span className="font-mono font-semibold uppercase text-slate-700">{factor.variable}</span>
              <span className={factor.impacto >= 0 ? 'font-semibold text-cyan-700' : 'font-semibold text-rose-700'}>
                {factor.impacto >= 0 ? '+' : ''}{factor.impacto.toFixed(3)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 report-card">
        <h2 className="text-lg font-bold text-slate-950">Variables evaluadas</h2>
        <div className="mt-4 grid grid-cols-6 gap-2 text-xs">
          {VARIABLES_MODELO.map((variable) => (
            <div key={variable} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <p className="font-mono font-bold uppercase text-slate-500">{variable}</p>
              <p className="mt-1 font-semibold text-slate-950">{formatNumber(candidate[variable])}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="mt-8 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">
        Uso responsable: las variables están anonimizadas y el resultado no debe reemplazar una decisión humana. El modelo es una herramienta de priorización y explicación para apoyar la revisión del equipo.
      </footer>
    </section>
  );
};

// --- Assets ---
const IMAGES = {
  hero: "https://lh3.googleusercontent.com/aida-public/AB6AXuBITTOAiVHNmmS40CjrByPDdO_OxMjbGQHFUxpLV32jZKaros_0izAvyLfqKKKfQOpKpl-4PQciLWY84nMQOTQM_G6jBnxzWKiXITifEWcKroMVMRpUQi3ATkV-j6jEJXRMk4Wvq_hsRGFNDM7SAQZz5P9Bevc20YX0Hbq93OGiem90NryDCMZV9Pt92swRAJGfXXhkUxMIVbJboq1M6UsYbznBtla-f-_4aR_GydWuECzEMyXwiih-pk8y2ZO3TJq_HwWwKKoZJd0",
  profile: "https://lh3.googleusercontent.com/aida-public/AB6AXuDoTzgmVKInpfE7wdGSob1ZcYDHBJXjzIDamZFsjVb1fu8J66tugmUSnmDZiqK20exre8uddU5aHIWe4vQiSZxj66OS_nJ_fwYLVdnalNWXqZb6YWtBF559RKr9eQTuqxB69rgP1yhZDpbn7Z5FhO-F79KrA6C-Texyjf4vx1MYPc381kYZgYYBybEsOgHzwQArL1gYqBawBrPcMXdnlzuR33h-44F9kt564Y3f5FaawRk4FpM8Yy7dKJ9YRA7zYBLdaFoNSyNEtBg",
  circuit: "https://lh3.googleusercontent.com/aida-public/AB6AXuDxP74gYlRghDZl454WKsrK4x0MKEkGClXYAPMg2AzFriB3ZsY_sRerFUsDik7YYPH4sEs48p1gR3PoRxTiZabmb7ZD6_SnSYoFeFDy85Q_uvSoXLcI8T83UZ2Ft8LegIN-lh7Ln2FH7_ig1PFxaldvTobLW_jaRaq_57U8WqXPp41qkpPE2DaG6nfPUrA29JyGRhiTqg2BWA8e-2q-eI86xMpcur2aH3ZOj7LJZoF0TrcUsY5s1kCNJb_5_ThKGUoXHOXpkoFXMv8",
  neural: "https://lh3.googleusercontent.com/aida-public/AB6AXuCDIovEJOK7S-Cnw95NbSJc2eInIi7ftjNjeIymqmtzHv9P7yD2I_PdLtJT2yhpwzghX0BKJpUvfYlCq4MQp2w855ht9xQy1UY2crhcadubYwl5R4SQQYIQvgsTfWORIAYbVLwtjx8BcKFiROaBAi8DY26sQXdXdhFFChjJgJZPKyYQUpJGtVIDBCHqvvJRsZwKzXYsICPfTrZsvZ78VoTSCj6argb8dynWuaL9OpKGE8MFS6m8Fz0TKfuA8uyYfzm_smYdTH0dUpU",
  globe: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9nCj5kWSQxXq7ZGWQMd5UB9ZsuO_LjObS3RBoPQ_cgWaCyjablG6cuy-bw8xcQMmUN1MmU3orbYWWd_y9QZBB-fE3cjmsmexL61X6HuIQkUreJGopNjhMYSchUyVRIvhf8X5uNbW9l0Fji1PsxsvUt9DsioVij6itNswB7sGfmLj4NyzmfMJ0BquG-kPE5iJUEUe5ZcsHraCx87o2HmZF258E7OsbYZuqsC-g0B8FGpqinWa2UjbCtV39JJLzQuoyDw3M-MoE4kc"
};

// --- Sub-components ---

const DashboardView = ({ onNavigate }: { onNavigate: (view: ViewId) => void }) => (
  <div className="space-y-section-gap">
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center min-h-[auto] lg:min-h-[600px]">
      <div className="lg:col-span-7 flex flex-col items-start gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary"
        >
          <Bolt className="w-4 h-4 fill-primary" />
          <span className="font-mono text-xs uppercase tracking-wider">Modelo desplegado en producción</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-[clamp(2.4rem,12vw,4.5rem)] md:text-7xl font-bold leading-[1.05]"
        >
          NÍTIDO <span className="text-primary drop-shadow-[0_0_15px_rgba(192,193,255,0.4)]">Decision Lab</span>
        </motion.h1>
        
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display text-xl md:text-3xl text-secondary max-w-2xl"
        >
          Sistema explicable de prefiltrado de candidatos
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-base md:text-lg text-on-surface-variant max-w-xl leading-relaxed"
        >
          Una plataforma interactiva para estimar si un candidato avanza a entrevista, explicar los factores del modelo y sustentar riesgos ante el CEO.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid w-full grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:gap-4 sm:w-auto mt-2 sm:mt-4"
        >
          <button onClick={() => onNavigate('simulate')} className="px-6 sm:px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-primary-container text-on-primary font-bold shadow-[0_0_20px_rgba(128,131,255,0.4)] hover:brightness-110 active:scale-95 transition-all">
            Probar simulador
          </button>
          <button onClick={() => onNavigate('metrics')} className="px-6 sm:px-8 py-4 rounded-xl border border-white/15 bg-white/5 backdrop-blur-md text-on-surface font-bold hover:bg-white/10 active:scale-95 transition-all">
            Ver métricas
          </button>
          <button onClick={() => onNavigate('audit')} className="px-6 sm:px-8 py-4 rounded-xl border border-secondary/20 bg-secondary/5 text-secondary font-bold hover:bg-secondary/10 active:scale-95 transition-all flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Ver auditoría
          </button>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="lg:col-span-5 relative flex justify-center items-center w-full"
      >
        <div className="relative w-full aspect-[4/3] sm:aspect-square max-w-[500px]">
          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-[2rem]" />
          <div className="relative glass-card rounded-2xl sm:rounded-[2.5rem] w-full h-full p-4 sm:p-6 overflow-hidden border-white/20 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Cpu className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-on-surface-variant">Mini-dashboard</p>
                  <h3 className="text-xl font-bold">Resumen ejecutivo</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'AUC test', value: '0.8056', color: 'primary' },
                  { label: 'F1 test', value: '0.7241', color: 'tertiary' },
                  { label: 'Umbral', value: '0.45', color: 'secondary' },
                  { label: 'Candidatos', value: '5.000', color: 'primary' },
                ].map((tile) => (
                  <div key={tile.label} className="rounded-2xl sm:rounded-3xl p-3 sm:p-4 bg-surface-container-highest border border-white/10">
                    <span className="text-[11px] uppercase tracking-[0.25em] text-on-surface-variant">{tile.label}</span>
                    <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold" style={{ color: COLOR_MAP[tile.color] }}>{tile.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl sm:rounded-3xl p-3 sm:p-4 bg-surface-container-low/80 border border-white/10 text-xs sm:text-sm text-on-surface-variant">
              <p className="font-medium text-on-surface">Un prototipo listo para comité ejecutivo: explica decisiones, muestra métricas reales y justifica el umbral del modelo.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>

    <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
      {[
        { 
          title: "Simulación Predictiva", 
          desc: "Ingresa las 18 variables anonimizadas y obtén la probabilidad real de avance del modelo exportado desde Colab.",
          icon: Activity,
          color: "primary"
        },
        { 
          title: "IA Explicable (XAI)", 
          desc: "Mostramos los factores locales que más empujan cada predicción hacia avance o rechazo.",
          icon: Monitor,
          color: "secondary"
        },
        { 
          title: "Auditoría Ética", 
          desc: "Documentamos riesgos, límites de uso y la necesidad de revisión humana antes de producción.",
          icon: ShieldCheck,
          color: "tertiary"
        }
      ].map((item, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 + (i * 0.1) }}
          className="glass-card rounded-2xl p-8 flex flex-col gap-4 transition-all duration-300"
          style={{ borderColor: toRgba(COLOR_MAP[item.color], 0.25), borderWidth: 1 }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: toRgba(COLOR_MAP[item.color], 0.11), color: COLOR_MAP[item.color] }}>
            <item.icon className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold">{item.title}</h3>
          <p className="text-on-surface-variant">{item.desc}</p>
        </motion.div>
      ))}
    </section>
  </div>
);

const AuditView = ({ onNavigate }: { onNavigate: (view: ViewId) => void }) => (
  <div className="space-y-section-gap max-w-7xl mx-auto">
    <section className="glass-card rounded-3xl p-8 border-secondary/20">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="text-secondary w-6 h-6" />
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-on-surface-variant">Recomendación al CEO</p>
              <h2 className="text-3xl font-bold">Salida pública condicionada</h2>
            </div>
          </div>
          <p className="text-on-surface-variant leading-relaxed max-w-2xl">
            Presentar el modelo como prototipo explicable para validación, con recomendación de no automatizar la decisión final y mantener revisión humana en casos cercanos al umbral. Esto pone el foco correcto en la decisión ejecutiva: valor para el CEO y gobernanza clara.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: 'Decisión', value: 'Salida condicionada', color: 'primary' },
            { label: 'Riesgo clave', value: 'Datos anonimizados', color: 'error' },
            { label: 'Control', value: 'Revisión humana', color: 'secondary' },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 p-4" style={{ backgroundColor: toRgba(COLOR_MAP[item.color], 0.08) }}>
              <span className="block font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">{item.label}</span>
              <p className="text-xl font-bold" style={{ color: COLOR_MAP[item.color] }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-white/10 bg-surface-container-low/60 p-6">
          <h3 className="text-xl font-bold mb-4">SHAP global</h3>
          <div className="space-y-3">
            {SHAP_GLOBAL.slice(0, 6).map((item) => (
              <div key={item.variable} className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>{item.variable}</span>
                  <span>{item.value.toFixed(4)}</span>
                </div>
                <div className="h-3 rounded-full bg-surface-container-highest overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.max(18, (item.value / SHAP_GLOBAL[0].value) * 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-on-surface-variant">
            Importancia global SHAP real del modelo: x1, x2, x5, x9, x7 y x10 lideran las contribuciones absolutas medias. x14 también es crítica por su efecto negativo.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-surface-container-low/60 p-6">
          <h3 className="text-xl font-bold mb-4">Permutation Importance</h3>
          <div className="space-y-3">
            {PERMUTATION_IMPORTANCE.slice(0, 5).map((item) => (
              <div key={item.variable} className="flex items-center justify-between rounded-2xl border border-white/10 bg-surface-container/50 px-4 py-3 text-sm">
                <span className="font-semibold">{item.variable}</span>
                <span className="font-mono text-primary">{item.value.toFixed(4)}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-on-surface-variant leading-relaxed">
            Permutation Importance confirma a x1 y x2 como señales dominantes. Por su peso global, x1, x2 y x14 quedan como variables críticas para auditoría de proxy sensible.
          </p>
        </div>
      </div>
    </section>

    <section className="glass-card rounded-3xl p-5 sm:p-8 border-error/25">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-error" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-on-surface-variant">Riesgo crítico</p>
              <h3 className="text-2xl font-bold">Auditoría de sesgos vía XAI</h3>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-on-surface-variant">
            La conclusión responsable no es “el modelo no discrimina”; con variables anonimizadas no se puede probar eso. La conclusión defendible es que el modelo tiene señales útiles, pero requiere una auditoría interna con nombres reales de variables y medición por subgrupos antes de producción.
          </p>
        </div>
        <div className="rounded-2xl border border-error/25 bg-error/10 p-5 lg:max-w-sm">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-error">Conclusión regulatoria</p>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-on-surface">
            No se recomienda automatizar decisiones finales. Sí se recomienda piloto supervisado con monitoreo, revisión humana y bitácora de casos borderline.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {BIAS_AUDIT_POINTS.map((point) => (
          <article key={point.title} className="rounded-2xl border border-white/10 bg-surface-container-low/60 p-5">
            <h4 className="text-lg font-bold text-error">{point.title}</h4>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{point.text}</p>
          </article>
        ))}
      </div>
    </section>

    <section>
      <div className="flex items-center gap-2 mb-8">
        <Database className="text-secondary w-6 h-6" />
        <h3 className="text-2xl font-bold">Entregables ejecutivos</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {[
          { title: 'Informe ejecutivo', desc: 'Resumen estratégico para Juanpis: utilidad del modelo, riesgos y recomendación final.', status: 'Disponible', view: 'executive-report' as ViewId },
          { title: 'Cuadernillo técnico', desc: 'Documento técnico con EDA, modelado, evaluación, XAI, contrafactuales y auditoría.', status: 'Disponible', view: 'technical-booklet' as ViewId },
          { title: 'App funcional', desc: 'Simulador React/Vercel conectado al modelo real y endpoint de inferencia.', status: 'Operativa' },
          { title: 'Demo ejecutiva', desc: 'Flujo de caso aprobado, caso rechazado, caso borderline y recomendación de salida a producción.', status: 'Lista' }
        ].map((item, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="glass-card rounded-xl p-6 flex flex-col h-full border-t-4"
            style={{ borderColor: COLOR_MAP.primary }}
          >
            <div className="mb-4">
              <Bolt className="w-8 h-8" style={{ color: COLOR_MAP.primary }} />
            </div>
            <h4 className="text-lg font-bold mb-2">{item.title}</h4>
            <p className="text-sm text-on-surface-variant mb-6 flex-grow">{item.desc}</p>
            {'view' in item && (
              <button
                onClick={() => onNavigate(item.view)}
                className="mb-4 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-bold text-primary transition hover:bg-primary/15"
              >
                Abrir documento
              </button>
            )}
            <div className="flex items-center gap-2 text-secondary">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="font-mono text-[10px] uppercase font-bold tracking-widest">{item.status}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>

    <section className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-12">
        <Activity className="text-secondary w-6 h-6" />
        <h3 className="text-2xl font-bold">Pipeline del proyecto</h3>
      </div>
      <div className="relative">
        <div className="absolute left-[3px] md:left-1/2 top-0 bottom-0 w-1 rounded-full" style={{ background: `linear-gradient(180deg, ${COLOR_MAP.primary}, ${COLOR_MAP.secondary}, ${COLOR_MAP.tertiary})`, opacity: 0.25 }}></div>
        {[
          { phase: 1, title: 'Comprensión de datos', color: 'primary', content: '5.000 candidatos históricos, 18 variables anonimizadas y etiqueta binaria avanza.' },
          { phase: 2, title: 'Preprocesamiento', color: 'secondary', content: 'Pipeline con imputación, escalado y modelo final de regresión logística.' },
          { phase: 3, title: 'Evaluación', color: 'tertiary', content: 'Umbral operativo 0.45, F1 de prueba 0.7241 y AUC de prueba 0.8056.' },
          { phase: 4, title: 'Auditoría', color: 'error', content: 'Variables anonimizadas: el modelo requiere supervisión humana y revisión de sesgos antes de producción.' }
        ].map((p, i) => (
          <div key={i} className={`relative mb-16 md:flex ${i % 2 === 0 ? 'md:justify-start' : 'md:flex-row-reverse md:justify-start'} items-center w-full`}>
            <div className="absolute left-[-5px] md:left-1/2 md:-translate-x-1/2 w-5 h-5 rounded-full bg-background border-4 z-10 box-content -ml-[3px]" style={{ borderColor: COLOR_MAP[p.color] }} />
            <motion.div 
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="ml-10 md:ml-0 md:w-[45%] glass-card p-6 rounded-2xl"
              style={{ borderLeft: `4px solid ${COLOR_MAP[p.color]}` }}
            >
              <span className="font-mono text-[10px] uppercase tracking-widest mb-1 block" style={{ color: COLOR_MAP[p.color] }}>Fase {p.phase}</span>
              <h5 className="text-lg font-bold mb-2">{p.title}</h5>
              <p className="text-sm text-on-surface-variant leading-relaxed">{p.content}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  </div>
);

const SimulatorView = () => {
  const [candidate, setCandidate] = useState<Record<string, number>>(DEFAULT_CANDIDATE);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [comparisons, setComparisons] = useState<ComparisonSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCandidate = (variable: string, value: number) => {
    setCandidate((current) => ({ ...current, [variable]: value }));
  };

  const runPrediction = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidate),
      });
      const rawBody = await response.text();
      const data = rawBody ? JSON.parse(rawBody) : null;

      if (!response.ok) {
        throw new Error(
          data?.detalle
          || data?.error
          || `El endpoint /api/predict respondió ${response.status} sin detalle. En desarrollo local, reinicia Vite para activar el proxy hacia la API desplegada.`
        );
      }

      if (!data) {
        throw new Error('El endpoint /api/predict respondió vacío. Revisa que la API esté disponible antes de calcular la predicción.');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al consultar el modelo.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCurrentComparison = () => {
    if (!result) return;

    const nextIndex = comparisons.length + 1;
    const snapshot: ComparisonSnapshot = {
      id: `${Date.now()}`,
      label: `Caso ${nextIndex}`,
      createdAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      candidate: { ...candidate },
      result,
    };

    setComparisons((current) => [...current.slice(-2), snapshot]);
  };

  const loadComparison = (snapshot: ComparisonSnapshot) => {
    setCandidate(snapshot.candidate);
    setResult(snapshot.result);
    setError(null);
  };

  const removeComparison = (id: string) => {
    setComparisons((current) => current.filter((snapshot) => snapshot.id !== id));
  };

  const renderSelect = (variable: string) => {
    const config = INPUT_CONFIG[variable];
    if (config.tipo === 'continua') return null;

    return (
      <label key={variable} className="space-y-2">
        <span className="font-mono text-[10px] text-on-surface-variant uppercase">{variable}</span>
        <select
          value={candidate[variable]}
          onChange={(event) => updateCandidate(variable, Number(event.target.value))}
          className="w-full bg-surface-container-highest/70 border border-white/10 rounded-lg py-2 px-3 text-sm outline-none focus:border-primary"
        >
          {config.valores.map((value) => (
            <option key={value} value={value} className="bg-surface text-on-surface">
              {formatNumber(value)}
            </option>
          ))}
        </select>
      </label>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Simulador de candidato</h1>
        <p className="text-on-surface-variant max-w-3xl">
          Ingresa las variables anonimizadas del candidato. El modelo usa el umbral 0.45 para estimar si avanza a entrevista; la decisión final debe tener revisión humana.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <section className="lg:col-span-8 glass-card rounded-xl p-5 sm:p-8 space-y-8">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-tertiary w-6 h-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-primary">Variables continuas</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {CONTINUOUS_VARIABLES.map((variable) => {
              const config = INPUT_CONFIG[variable];
              if (config.tipo !== 'continua') return null;
              const step = Math.max((config.max - config.min) / 100, 0.01);

              return (
                <div key={variable} className="space-y-3">
                  <div className="flex justify-between items-center font-mono text-xs uppercase tracking-wider">
                    <label className="text-on-surface">{variable}</label>
                    <span className="text-primary">{formatNumber(candidate[variable])}</span>
                  </div>
                  <input
                    type="range"
                    min={config.min}
                    max={config.max}
                    step={step}
                    value={candidate[variable]}
                    onChange={(event) => updateCandidate(variable, Number(event.target.value))}
                    className="w-full h-1.5 bg-surface-container-highest rounded-full appearance-none accent-primary"
                  />
                  <div className="flex justify-between font-mono text-[10px] text-on-surface-variant">
                    <span>{formatNumber(config.min)}</span>
                    <span>{formatNumber(config.max)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="lg:col-span-4 space-y-gutter">
          <section className="glass-card rounded-xl p-5 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <ToggleRight className="text-secondary w-6 h-6" />
              <h2 className="text-xl sm:text-2xl font-bold text-secondary">Binarias</h2>
            </div>
            <div className="space-y-4">
              {BINARY_VARIABLES.map(renderSelect)}
            </div>
          </section>

          <section className="glass-card rounded-xl p-5 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <Database className="text-tertiary w-6 h-6" />
              <h2 className="text-xl sm:text-2xl font-bold text-tertiary">Discretas</h2>
            </div>
            <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-4">
              {DISCRETE_VARIABLES.map(renderSelect)}
            </div>
          </section>
        </aside>
      </div>

      <motion.div
        whileHover={{ scale: 1.01 }}
        className="flex flex-col lg:flex-row items-stretch justify-between glass-card p-5 sm:p-8 rounded-2xl gap-6 sm:gap-8"
      >
        <div className="flex items-start sm:items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center border border-primary/30 shrink-0">
            <Cpu className="text-primary w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold">Inferencia del modelo NÍTIDO</h3>
            <p className="text-on-surface-variant">Regresión logística con pipeline de preprocesamiento, desplegada como función Python en Vercel.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-between">
          <button
            onClick={runPrediction}
            disabled={isLoading}
            className="w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-primary-container to-secondary-container font-display text-base sm:text-xl font-bold text-on-primary shadow-[0_10px_30px_rgba(128,131,255,0.4)] disabled:opacity-60 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {isLoading ? 'Calculando...' : 'Calcular predicción'} <Bolt className="w-6 h-6 fill-on-primary" />
          </button>
          <div className="grid grid-cols-1 min-[390px]:grid-cols-3 gap-3 w-full sm:w-auto">
            <button
              onClick={() => setCandidate(SAMPLE_CASES.aprobado)}
              className="rounded-2xl border border-white/10 bg-surface-container-highest px-4 py-4 text-sm font-bold text-primary hover:bg-white/5 transition"
            >
              Cargar caso aprobado
            </button>
            <button
              onClick={() => setCandidate(SAMPLE_CASES.rechazado)}
              className="rounded-2xl border border-white/10 bg-surface-container-highest px-4 py-4 text-sm font-bold text-error hover:bg-white/5 transition"
            >
              Cargar caso rechazado
            </button>
            <button
              onClick={() => setCandidate(SAMPLE_CASES.borderline)}
              className="rounded-2xl border border-white/10 bg-surface-container-highest px-4 py-4 text-sm font-bold text-tertiary hover:bg-white/5 transition"
            >
              Cargar caso borderline
            </button>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="glass-card rounded-xl p-6 border-error/40 text-error flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {result && (() => {
        const plainExplanation = buildPlainExplanation(result);
        const outcome = getResultTag(result.probabilidad, result.umbral);
        const uncertainty = getUncertaintyDetails(result);

        return (
          <div className="space-y-gutter">
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
              <div className="lg:col-span-4 glass-card rounded-xl p-5 sm:p-8">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Resultado</span>
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mt-4 font-semibold" style={{ backgroundColor: outcome.background, color: outcome.color }}>
                  {outcome.label}
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Probabilidad de avanzar</span>
                    <span className="font-mono text-primary">{formatPercent(result.probabilidad)}</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-surface-container-highest overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-secondary to-primary" style={{ width: `${Math.min(result.probabilidad * 100, 100)}%` }} />
                  </div>
                  <div className="flex justify-between font-mono text-[10px] text-on-surface-variant uppercase">
                    <span>Umbral</span>
                    <span>{result.umbral.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 glass-card rounded-xl p-5 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-6">Explicación local</h3>
                <p className="text-sm text-on-surface-variant mb-5">
                  Impactos positivos aumentan la probabilidad de avanzar; impactos negativos la reducen.
                </p>
                <div className="space-y-3">
                  {result.factores.map((factor) => (
                    <div key={factor.variable} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-mono uppercase">{factor.variable}</span>
                        <span className={factor.impacto >= 0 ? 'text-tertiary' : 'text-error'}>
                          {factor.impacto >= 0 ? '+' : ''}{factor.impacto.toFixed(3)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                        <div
                          className={factor.impacto >= 0 ? 'h-full bg-tertiary' : 'h-full bg-error'}
                          style={{ width: `${Math.min(Math.abs(factor.impacto) * 70, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-3 glass-card rounded-xl p-5 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-4">Contrafactual</h3>
                {result.contrafactual ? (
                  <div className="space-y-4 text-sm">
                    <p className="text-on-surface-variant">
                      Cambiar <span className="text-primary font-mono">{result.contrafactual.variable}</span> podría mover el caso por encima del umbral.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-surface-container-low/60 rounded-lg p-3">
                        <span className="block font-mono text-[10px] uppercase text-on-surface-variant">Actual</span>
                        <strong>{formatNumber(result.contrafactual.valor_original)}</strong>
                      </div>
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                        <span className="block font-mono text-[10px] uppercase text-on-surface-variant">Sugerido</span>
                        <strong>{formatNumber(result.contrafactual.valor_sugerido)}</strong>
                      </div>
                    </div>
                    <p className="font-mono text-[11px] text-tertiary">
                      Nueva probabilidad: {formatPercent(result.contrafactual.probabilidad_nueva)}
                    </p>
                  </div>
                ) : (
                  <p className="text-on-surface-variant text-sm">
                    No se requiere contrafactual para candidatos que ya avanzan, o no se encontró un cambio simple dentro de los rangos evaluados.
                  </p>
                )}
              </div>
            </section>

            <section
              className="glass-card rounded-xl p-5 sm:p-8"
              style={{
                borderColor: uncertainty.isUncertain ? toRgba(COLOR_MAP.tertiary, 0.45) : toRgba(COLOR_MAP.secondary, 0.25),
                backgroundColor: uncertainty.isUncertain ? toRgba(COLOR_MAP.tertiary, 0.08) : undefined,
              }}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
                    style={{
                      borderColor: uncertainty.isUncertain ? toRgba(COLOR_MAP.tertiary, 0.35) : toRgba(COLOR_MAP.secondary, 0.35),
                      backgroundColor: uncertainty.isUncertain ? toRgba(COLOR_MAP.tertiary, 0.14) : toRgba(COLOR_MAP.secondary, 0.12),
                      color: uncertainty.isUncertain ? COLOR_MAP.tertiary : COLOR_MAP.secondary,
                    }}
                  >
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-on-surface-variant">Control de decisión</p>
                    <h3 className="mt-1 text-xl sm:text-2xl font-bold">{uncertainty.title}</h3>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-on-surface-variant">{uncertainty.description}</p>
                    <p className="mt-3 rounded-xl border border-white/10 bg-surface-container-low/70 p-4 text-sm leading-relaxed text-on-surface">
                      {uncertainty.action}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:w-64">
                  <div className="rounded-2xl border border-white/10 bg-surface-container-low/70 p-4">
                    <span className="block font-mono text-[10px] uppercase text-on-surface-variant">Distancia</span>
                    <strong className="mt-2 block text-2xl" style={{ color: uncertainty.isUncertain ? COLOR_MAP.tertiary : COLOR_MAP.secondary }}>
                      {formatPercent(Math.abs(result.probabilidad - result.umbral))}
                    </strong>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-surface-container-low/70 p-4">
                    <span className="block font-mono text-[10px] uppercase text-on-surface-variant">Regla</span>
                    <strong className="mt-2 block text-2xl" style={{ color: COLOR_MAP.primary }}>±8%</strong>
                  </div>
                </div>
              </div>
            </section>

            <PrintableReport result={result} candidate={candidate} explanation={plainExplanation} />

            <section className="glass-card rounded-xl p-5 sm:p-8 border-primary/20">
              <div className="flex items-center gap-3 mb-5">
                <Monitor className="w-6 h-6 text-primary" />
                <h3 className="text-xl sm:text-2xl font-bold">Explicación en palabras simples</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm leading-relaxed">
                <p className="bg-surface-container-low/60 border border-white/10 rounded-xl p-4 text-on-surface-variant">
                  {plainExplanation.decisionText}
                </p>
                <p className="bg-surface-container-low/60 border border-white/10 rounded-xl p-4 text-on-surface-variant">
                  {plainExplanation.confidenceText}
                </p>
                <p className="bg-surface-container-low/60 border border-white/10 rounded-xl p-4 text-on-surface-variant">
                  {plainExplanation.positiveText}
                </p>
                <p className="bg-surface-container-low/60 border border-white/10 rounded-xl p-4 text-on-surface-variant">
                  {plainExplanation.negativeText}
                </p>
              </div>
              <p className="mt-4 text-sm text-on-surface-variant leading-relaxed bg-primary/10 border border-primary/20 rounded-xl p-4">
                {plainExplanation.counterfactualText}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={() => window.print()}
                  className="no-print w-full sm:w-auto rounded-2xl bg-secondary px-6 py-4 text-sm font-bold text-on-primary hover:brightness-110 transition flex items-center justify-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Exportar reporte PDF
                </button>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Se genera un reporte limpio para impresión/PDF con resumen ejecutivo, probabilidad, umbral, explicación local, contrafactual y variables evaluadas.
                </p>
              </div>
            </section>

            <section className="glass-card rounded-xl p-5 sm:p-8 border-secondary/20">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-6 w-6 text-secondary" />
                    <h3 className="text-xl sm:text-2xl font-bold">Comparador de candidatos</h3>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-on-surface-variant">
                    Guarda hasta tres simulaciones para comparar probabilidad, decisión y factores dominantes durante la demo.
                  </p>
                </div>
                <button
                  onClick={saveCurrentComparison}
                  className="w-full sm:w-auto rounded-2xl border border-secondary/30 bg-secondary/10 px-5 py-3 text-sm font-bold text-secondary transition hover:bg-secondary/15 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Guardar caso
                </button>
              </div>

              {comparisons.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-surface-container-low/40 p-6 text-sm text-on-surface-variant">
                  Aún no hay casos guardados. Calcula una predicción y guárdala para construir la comparación.
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {comparisons.map((snapshot) => {
                    const snapshotOutcome = getResultTag(snapshot.result.probabilidad, snapshot.result.umbral);
                    const topPositive = snapshot.result.factores.find((factor) => factor.impacto > 0);
                    const topNegative = snapshot.result.factores.find((factor) => factor.impacto < 0);

                    return (
                      <article key={snapshot.id} className="rounded-2xl border border-white/10 bg-surface-container-low/70 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">{snapshot.createdAt}</p>
                            <h4 className="mt-1 text-lg font-bold">{snapshot.label}</h4>
                          </div>
                          <button
                            onClick={() => removeComparison(snapshot.id)}
                            className="rounded-xl border border-white/10 p-2 text-on-surface-variant transition hover:text-error"
                            aria-label={`Eliminar ${snapshot.label}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-4 rounded-2xl p-4" style={{ backgroundColor: snapshotOutcome.background, color: snapshotOutcome.color }}>
                          <span className="block text-sm font-semibold">{snapshotOutcome.label}</span>
                          <strong className="mt-2 block text-3xl">{formatPercent(snapshot.result.probabilidad)}</strong>
                        </div>
                        <div className="mt-4 space-y-3 text-sm">
                          <div className="flex justify-between gap-3">
                            <span className="text-on-surface-variant">Mayor impulso</span>
                            <span className="font-mono text-tertiary">{topPositive?.variable ?? 'N/A'}</span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-on-surface-variant">Mayor freno</span>
                            <span className="font-mono text-error">{topNegative?.variable ?? 'N/A'}</span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-on-surface-variant">Distancia al umbral</span>
                            <span className="font-mono">{formatPercent(Math.abs(snapshot.result.probabilidad - snapshot.result.umbral))}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => loadComparison(snapshot)}
                          className="mt-5 w-full rounded-xl border border-white/10 bg-surface-container-highest px-4 py-3 text-sm font-bold text-primary transition hover:bg-white/5"
                        >
                          Cargar este caso
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        );
      })()}

      <section className="glass-card rounded-xl p-6 border-secondary/20">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Nota de uso responsable: las variables están anonimizadas. Esta app demuestra el comportamiento técnico del modelo, pero no debe usarse como decisión automática final sin auditoría de variables, monitoreo de sesgos y revisión humana.
          </p>
        </div>
      </section>
    </div>
  );
};

const METRIC_GUIDE = [
  {
    title: 'Umbral operativo 0.45',
    body: 'El umbral convierte la probabilidad del modelo en una decisión: si la probabilidad es igual o superior a 0.45, el candidato queda priorizado para avanzar. Se usa 0.45 en lugar de 0.50 porque en validación mejora F1 de 0.7406 a 0.7538, aumenta recall de 0.7199 a 0.7675 y reduce falsos negativos de 100 a 83.',
    interpretation: 'Interpretación: se aceptan más falsos positivos, de 80 a 96, para revisar algunos candidatos adicionales y evitar descartar perfiles potencialmente buenos. Los casos cercanos al umbral entran a revisión humana.',
  },
  {
    title: 'F1-score test 0.7241',
    body: 'El F1 combina precisión y sensibilidad en una sola métrica. Es útil cuando importan tanto los falsos positivos como los falsos negativos: no queremos avanzar demasiados candidatos débiles, pero tampoco descartar perfiles que sí podrían funcionar.',
    interpretation: 'Interpretación: un F1 de 0.7241 indica desempeño sólido para un prototipo, aunque no perfecto. La app debe presentarse como apoyo de priorización, no como reemplazo del criterio humano.',
  },
  {
    title: 'AUC test 0.8056',
    body: 'El AUC mide qué tan bien el modelo separa candidatos que avanzan de candidatos que no avanzan a través de todos los umbrales posibles. No depende de un solo punto de corte.',
    interpretation: 'Interpretación: 0.8056 sugiere buena capacidad de discriminación. El modelo ordena razonablemente bien los casos, por eso es útil para priorizar y explicar, pero requiere auditoría antes de producción real.',
  },
  {
    title: 'Matriz de confusión',
    body: 'La matriz test del modelo final con umbral 0.45 fue: 276 verdaderos negativos, 118 falsos positivos, 87 falsos negativos y 269 verdaderos positivos.',
    interpretation: 'Interpretación: los falsos negativos siguen siendo el error más sensible en selección de talento, porque implican perder oportunidades. Por eso se justifica el umbral 0.45 y la revisión manual en zona cercana.',
  },
];

const MetricsView = () => (
  <div className="space-y-10">
    <section>
      <h1 className="text-3xl md:text-4xl font-bold mb-2 text-on-surface">Resumen del modelo</h1>
      <p className="text-on-surface-variant max-w-3xl">
        Resultados principales del modelo final de prefiltrado, con interpretación de cada métrica y del criterio usado para escoger el umbral operativo.
      </p>
    </section>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: "Modelo final", val: "Regresión logística baseline", meta: "Artefacto: models/modelo_nitido.pkl", icon: Cpu },
        { label: "Pipeline", val: "sklearn", meta: "Umbral operativo: 0.45", progress: true, color: "secondary" },
        { label: "F1-score test", val: "0.7241", trend: "Métrica principal", icon: BarChart3, color: "tertiary" },
        { label: "AUC test", val: "0.8056", validated: true, color: "primary" }
      ].map((m, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-card rounded-xl p-5 sm:p-6 flex flex-col justify-between min-h-[160px]"
        >
          <div>
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">{m.label}</span>
            <h3 className={`text-xl sm:text-2xl font-bold ${m.color ? `text-${m.color}` : "text-primary"}`}>{m.val}</h3>
          </div>
          {m.meta && <div className="flex items-center gap-2 text-[10px] uppercase font-mono opacity-60"><Fingerprint className="w-3 h-3" /> {m.meta}</div>}
          {m.progress && (
            <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden mt-4">
              <div className="bg-secondary h-full w-[45%] shadow-[0_0_10px_#ddb7ff]" />
            </div>
          )}
          {m.trend && <div className="flex items-center gap-1 text-green-400 font-mono text-[10px] mt-4 uppercase"><TrendingUp className="w-3 h-3" /> {m.trend}</div>}
          {m.validated && (
            <div className="flex items-center gap-3 mt-4">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full border border-surface bg-surface-container flex items-center justify-center text-[8px] font-bold">R1</div>
                <div className="w-6 h-6 rounded-full border border-surface bg-surface-container flex items-center justify-center text-[8px] font-bold">R2</div>
              </div>
              <span className="font-mono text-[10px] opacity-60 uppercase">Validado en notebook</span>
            </div>
          )}
        </motion.div>
      ))}
    </div>

    <section className="glass-card rounded-xl p-5 sm:p-8 border-primary/20">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Guía de interpretación</h2>
          <p className="text-sm text-on-surface-variant">Qué significa cada métrica y cómo defenderla ante el comité ejecutivo.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {METRIC_GUIDE.map((item) => (
          <article key={item.title} className="rounded-2xl border border-white/10 bg-surface-container-low/60 p-5">
            <h3 className="text-lg font-bold text-primary">{item.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{item.body}</p>
            <p className="mt-3 rounded-xl border border-secondary/20 bg-secondary/10 p-3 text-sm leading-relaxed text-on-surface">
              {item.interpretation}
            </p>
          </article>
        ))}
      </div>
    </section>

    <section className="glass-card rounded-xl p-5 sm:p-8 border-tertiary/20">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-tertiary/30 bg-tertiary/10 text-tertiary">
          <Monitor className="h-6 w-6" />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-on-surface-variant">Mensaje para el CEO</p>
          <h2 className="mt-1 text-2xl font-bold">Cómo contar el valor del modelo</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-on-surface-variant">
            Esta sección traduce las métricas técnicas a una narrativa ejecutiva: qué problema resuelve, por qué el umbral es prudente y qué controles se recomiendan antes de usarlo en producción.
          </p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {CEO_TALKING_POINTS.map((point, index) => (
          <article key={point.title} className="rounded-2xl border border-white/10 bg-surface-container-low/60 p-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-tertiary">Punto {index + 1}</span>
            <h3 className="mt-3 text-lg font-bold">{point.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{point.text}</p>
          </article>
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/10 p-5">
        <p className="text-sm font-semibold leading-relaxed text-on-surface">
          Frase de cierre sugerida: “El modelo ya aporta valor como filtro explicable y trazable; la decisión responsable es usarlo para priorizar revisión humana, medir sesgos y madurarlo antes de considerar producción plena.”
        </p>
      </div>
    </section>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-card rounded-xl p-5 sm:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Métricas de rendimiento</h2>
            <p className="text-sm text-on-surface-variant">Métricas finales en test del modelo final con umbral 0.45</p>
          </div>
        </div>

        <div className="relative min-h-[260px] sm:aspect-video flex items-end justify-between gap-2 px-2 sm:px-8 pb-10 border-b border-white/10 overflow-hidden">
          <div className="absolute inset-0 flex flex-col justify-between opacity-5 pointer-events-none pb-12 pt-8">
            {[1, 2, 3, 4].map((l) => (
              <div key={l} className="w-full border-t border-on-surface" />
            ))}
          </div>
          {TEST_METRICS.map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-3 sm:gap-4 min-w-0">
              <div className="relative w-9 sm:w-14 md:w-16 rounded-t-xl overflow-hidden" style={{ height: `${bar.v}%`, minHeight: 44 }}>
                <div style={{ position: 'absolute', inset: 0, backgroundColor: toRgba(COLOR_MAP[bar.color], 0.18) }} />
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: '100%' }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: `linear-gradient(180deg, ${toRgba(COLOR_MAP[bar.color], 0.75)} 0%, ${toRgba(COLOR_MAP[bar.color], 0.18)} 100%)` }}
                />
              </div>
              <span className="font-mono text-[9px] sm:text-[10px] text-on-surface-variant uppercase tracking-widest text-center break-words">{bar.l}</span>
              <span className="text-sm font-semibold" style={{ color: COLOR_MAP[bar.color] }}>{bar.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-surface-container-low/60 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <Monitor className="text-primary w-5 h-5" />
              <h3 className="text-lg font-bold">Curva ROC</h3>
            </div>
            <div className="w-full aspect-[4/3] bg-surface rounded-3xl p-4">
              <svg viewBox="0 0 300 225" className="w-full h-full">
                <defs>
                  <linearGradient id="rocGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={COLOR_MAP.primary} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={COLOR_MAP.secondary} stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="300" height="225" rx="24" fill="transparent" />
                <path d="M 30 195 L 270 15" fill="none" stroke="#777" strokeDasharray="6 6" strokeWidth="1.5" />
                <path d="M 30 195 L 49 171 L 74 144 L 101 119 L 141 87 L 184 48 L 216 27 L 270 15" fill="none" stroke="url(#rocGradient)" strokeWidth="4" strokeLinecap="round" />
                <line x1="132" y1="195" x2="132" y2="15" stroke={COLOR_MAP.tertiary} strokeWidth="2" strokeDasharray="4 4" />
                <circle cx="132" cy="75" r="4" fill={COLOR_MAP.tertiary} />
                <text x="132" y="210" fill="#999" fontSize="10" textAnchor="middle">Umbral 0.45</text>
                <text x="210" y="45" fill="#f8fafc" fontSize="11">AUC test: 0.8056</text>
              </svg>
            </div>
            <p className="mt-4 text-sm text-on-surface-variant">
              La curva ROC compara sensibilidad contra tasa de falsos positivos. Mientras más se aleja de la diagonal gris, mejor separa el modelo los casos. El punto marcado representa el umbral 0.45: una decisión operativa que favorece recuperar candidatos con potencial, aceptando que los casos cercanos requieren revisión.
            </p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-surface-container-low/60 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="text-secondary w-5 h-5" />
              <h3 className="text-lg font-bold">Comparación inicial de modelos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-separate border-spacing-y-3">
                <thead>
                  <tr>
                    <th className="pb-3 text-on-surface-variant uppercase tracking-[0.25em]">Modelo</th>
                    <th className="pb-3 text-on-surface-variant uppercase tracking-[0.25em]">Accuracy</th>
                    <th className="pb-3 text-on-surface-variant uppercase tracking-[0.25em]">Precision</th>
                    <th className="pb-3 text-on-surface-variant uppercase tracking-[0.25em]">Recall</th>
                    <th className="pb-3 text-on-surface-variant uppercase tracking-[0.25em]">F1</th>
                    <th className="pb-3 text-on-surface-variant uppercase tracking-[0.25em]">AUC</th>
                  </tr>
                </thead>
                <tbody>
                  {MODEL_COMPARISON.map((row) => (
                    <tr key={row.model} className="bg-surface-container-highest rounded-3xl border border-white/10">
                      <td className="px-4 py-4 font-medium">{row.model}</td>
                      <td className="px-4 py-4">{row.accuracy}</td>
                      <td className="px-4 py-4">{row.precision}</td>
                      <td className="px-4 py-4">{row.recall}</td>
                      <td className="px-4 py-4">{row.f1}</td>
                      <td className="px-4 py-4">{row.auc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-on-surface-variant">
              La regresión logística baseline fue seleccionada como modelo final porque obtuvo el mejor equilibrio entre desempeño predictivo e interpretabilidad. En validación presentó el mayor F1-score y el mayor AUC frente a Random Forest y Gradient Boosting. Además, permite explicar mejor la dirección de los efectos, justificar el umbral operativo y auditar las decisiones del sistema, algo clave en un proceso de selección de candidatos.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-surface-container-low/60 p-5 sm:p-6">
            <h3 className="text-lg font-bold">Modelos después de ajuste</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm border-separate border-spacing-y-3">
                <thead>
                  <tr>
                    <th className="pb-3 text-on-surface-variant uppercase tracking-[0.25em]">Modelo</th>
                    <th className="pb-3 text-on-surface-variant uppercase tracking-[0.25em]">F1</th>
                    <th className="pb-3 text-on-surface-variant uppercase tracking-[0.25em]">AUC</th>
                  </tr>
                </thead>
                <tbody>
                  {TUNED_MODEL_COMPARISON.map((row) => (
                    <tr key={row.model} className="bg-surface-container-highest rounded-3xl border border-white/10">
                      <td className="px-4 py-4 font-medium">{row.model}</td>
                      <td className="px-4 py-4">{row.f1}</td>
                      <td className="px-4 py-4">{row.auc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-surface-container-low/60 p-5 sm:p-6">
            <h3 className="text-lg font-bold">Optimización de umbral</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm border-separate border-spacing-y-3">
                <thead>
                  <tr>
                    <th className="pb-3 text-on-surface-variant uppercase tracking-[0.25em]">Umbral</th>
                    <th className="pb-3 text-on-surface-variant uppercase tracking-[0.25em]">F1</th>
                    <th className="pb-3 text-on-surface-variant uppercase tracking-[0.25em]">Recall</th>
                    <th className="pb-3 text-on-surface-variant uppercase tracking-[0.25em]">FP</th>
                    <th className="pb-3 text-on-surface-variant uppercase tracking-[0.25em]">FN</th>
                  </tr>
                </thead>
                <tbody>
                  {THRESHOLD_COMPARISON.map((row) => (
                    <tr key={row.threshold} className="bg-surface-container-highest rounded-3xl border border-white/10">
                      <td className="px-4 py-4 font-medium">{row.threshold}</td>
                      <td className="px-4 py-4">{row.f1}</td>
                      <td className="px-4 py-4">{row.recall}</td>
                      <td className="px-4 py-4">{row.fp}</td>
                      <td className="px-4 py-4">{row.fn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-on-surface-variant">
              El umbral 0.45 reduce falsos negativos de 100 a 83 y aumenta recall, a cambio de revisar más falsos positivos.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5 sm:p-8">
        <h2 className="text-2xl font-bold mb-8">Matriz de confusión</h2>
        <div className="grid grid-cols-2 gap-3 mb-10">
          <div className="bg-primary/20 border border-primary/30 p-6 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase mb-1">Verd. neg.</span>
            <span className="text-4xl font-bold text-primary">276</span>
          </div>
          <div className="bg-surface-container-high border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center opacity-60">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase mb-1">Falso pos.</span>
            <span className="text-4xl font-bold">118</span>
          </div>
          <div className="bg-surface-container-high border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center opacity-60">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase mb-1">Falso neg.</span>
            <span className="text-4xl font-bold">87</span>
          </div>
          <div className="bg-secondary/20 border border-secondary/30 p-6 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase mb-1">Verd. pos.</span>
            <span className="text-4xl font-bold text-secondary">269</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between font-mono text-[10px] uppercase">
            <span className="text-on-surface-variant">Balance de clases</span>
            <span className="text-on-surface">53% / 47%</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden flex shadow-inner border border-white/5">
            <div className="h-full bg-primary w-[53%]"></div>
            <div className="h-full bg-secondary w-[47%]"></div>
          </div>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            Lectura rápida: en test, el modelo final con umbral 0.45 obtuvo 87 falsos negativos y 118 falsos positivos. Los falsos negativos siguen siendo el riesgo principal porque representan candidatos que pudieron avanzar y fueron descartados. Por eso la app no debe tomar decisiones finales sola.
          </p>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
      <section className="glass-card rounded-xl p-5 sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <History className="text-primary w-6 h-6" />
          <h2 className="text-2xl font-bold">Historial de entrenamiento</h2>
        </div>
        <div className="space-y-6">
          {[
            { l: "Datos", v: "5.000 candidatos" },
            { l: "Partición", v: "train / validation / test" },
            { l: "Preprocesamiento", v: "Imputación + escalado" },
            { l: "Regularización", v: "L2" }
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center pb-4 border-b border-white/5">
              <span className="text-on-surface-variant">{item.l}</span>
              <span className="font-mono text-sm">{item.v}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm leading-relaxed text-on-surface-variant">
          Estos elementos explican cómo se entrenó el modelo: datos históricos, separación de conjuntos para evaluar generalización, preprocesamiento para estabilizar variables y regularización para evitar que el modelo se ajuste demasiado al entrenamiento.
        </p>
      </section>

      <section className="glass-card rounded-xl p-5 sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <Settings2 className="text-secondary w-6 h-6" />
          <h2 className="text-2xl font-bold">Hiperparámetros</h2>
        </div>
        <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-4 sm:gap-6">
          {[
            { l: "Max iter", v: "1000" },
            { l: "Penalidad", v: "l2" },
            { l: "Solver", v: "lbfgs" },
            { l: "Parámetro C", v: "1.0" }
          ].map((item, i) => (
            <div key={i} className="bg-surface-container-low/50 border border-white/10 rounded-2xl p-5 sm:p-6">
              <span className="block font-mono text-[10px] text-on-surface-variant uppercase mb-2">{item.l}</span>
              <span className="text-xl font-bold">{item.v}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 rounded-2xl border border-secondary/20 bg-secondary/10 p-4 text-sm leading-relaxed text-on-surface-variant">
          La regresión logística con penalidad L2 controla coeficientes extremos, `lbfgs` es un solver estable para este tipo de problema y `max_iter=1000` da margen para converger. El parámetro C=1.0 mantiene una regularización estándar sin forzar demasiado el modelo.
        </p>
      </section>
    </div>
  </div>
);

const ComplianceView = () => {
  const phases = ['Fase 1', 'Fase 2', 'Fase 3', 'Fase 4'];

  return (
    <div className="space-y-10">
      <section className="glass-card rounded-3xl p-5 sm:p-8 border-primary/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-7 w-7 text-secondary" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-on-surface-variant">Control del proyecto</p>
                <h1 className="text-3xl md:text-4xl font-bold">Plan de validación</h1>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-on-surface-variant">
              Vista de trazabilidad para mostrar que el proyecto cubre los 20 controles clave de datos, modelado, explicabilidad, auditoría y decisión ejecutiva.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[420px]">
            {[
              { label: 'Acciones', value: '20/20', color: 'secondary' },
              { label: 'Fases', value: '4', color: 'primary' },
              { label: 'Riesgo crítico', value: 'Sesgos', color: 'error' },
              { label: 'Demo', value: '3 casos', color: 'tertiary' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-surface-container-low/70 p-4">
                <span className="block font-mono text-[10px] uppercase text-on-surface-variant">{item.label}</span>
                <strong className="mt-2 block text-xl" style={{ color: COLOR_MAP[item.color] }}>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {phases.map((phase) => (
        <section key={phase} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-secondary" />
            <h2 className="text-2xl font-bold">{phase}</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {COMPLIANCE_ACTIONS.filter((item) => item.phase === phase).map((item) => (
              <article key={item.action} className="glass-card rounded-2xl p-5 border-white/10">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-secondary/30 bg-secondary/10 text-secondary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">Control {item.action}</p>
                    <h3 className="mt-1 text-lg font-bold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{item.evidence}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="glass-card rounded-3xl p-5 sm:p-8 border-tertiary/25">
        <div className="flex items-start gap-4">
          <FileText className="mt-1 h-6 w-6 shrink-0 text-tertiary" />
          <div>
            <h2 className="text-2xl font-bold">Guion de defensa rápida</h2>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
              Para comité ejecutivo, la respuesta corta es: “Cubrimos todo el ciclo: diagnóstico de datos, preparación, modelos comparados, evaluación con F1/AUC/umbral, explicabilidad global/local, contrafactuales, auditoría de sesgos y recomendación condicionada al CEO”.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

const ReportDocumentView = ({
  title,
  description,
  html,
}: {
  title: string;
  description: string;
  html: string;
}) => (
  <div className="space-y-6">
    <section className="glass-card rounded-2xl p-5 sm:p-8 border-primary/20">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-on-surface-variant">Documento integrado</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-on-surface-variant">{description}</p>
        </div>
        <div className="rounded-2xl border border-secondary/25 bg-secondary/10 p-4 text-sm leading-relaxed text-on-surface-variant lg:max-w-sm">
          Este documento se abre dentro de la app para que el CEO pueda revisar la evidencia sin salir del producto.
        </div>
      </div>
    </section>

    <section className="overflow-hidden rounded-2xl border border-white/15 bg-white">
      <iframe
        title={title}
        srcDoc={html}
        className="h-[78vh] w-full border-0 bg-white"
      />
    </section>
  </div>
);

// --- Main App ---

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: Network },
    { id: 'audit', label: 'Auditoría', icon: ShieldCheck },
    { id: 'simulate', label: 'Simulador', icon: Activity },
    { id: 'metrics', label: 'Métricas', icon: BarChart3 },
    { id: 'compliance', label: 'Plan', icon: CheckCircle2 },
    { id: 'executive-report', label: 'Informe', icon: FileText },
    { id: 'technical-booklet', label: 'Cuadernillo', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full bg-surface-container/40 backdrop-blur-xl border-b border-white/15 h-16 z-50 flex items-center justify-between px-container-padding-mobile md:px-container-padding-desktop">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('dashboard')}>
          <Network className="w-7 h-7 text-primary" />
          <span className="font-display text-xl font-bold tracking-tighter text-primary drop-shadow-[0_0_8px_rgba(192,193,255,0.4)]">NÍTIDO</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-5 font-mono text-[11px] font-bold uppercase tracking-widest">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveView(item.id as ViewId)}
              className={`transition-colors hover:text-primary ${activeView === item.id ? "text-primary" : "text-on-surface-variant"}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-primary">
            <span className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_#4cd7f6]" />
            <span className="font-mono text-[10px] uppercase tracking-widest">Producción</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-22 sm:pt-24 pb-32 px-container-padding-mobile md:px-container-padding-desktop max-w-7xl mx-auto bg-mesh">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeView === 'dashboard' && <DashboardView onNavigate={setActiveView} />}
            {activeView === 'audit' && <AuditView onNavigate={setActiveView} />}
            {activeView === 'simulate' && <SimulatorView />}
            {activeView === 'metrics' && <MetricsView />}
            {activeView === 'compliance' && <ComplianceView />}
            {activeView === 'executive-report' && (
              <ReportDocumentView
                title="Informe ejecutivo"
                description="Documento corto para Juanpis: decisiones, riesgos, recomendación final y próximos pasos."
                html={executiveReportHtml}
              />
            )}
            {activeView === 'technical-booklet' && (
              <ReportDocumentView
                title="Cuadernillo técnico"
                description="Entregable técnico de consultoría: 20 controles, visualizaciones, interpretaciones, XAI, auditoría y decisión final."
                html={technicalBookletHtml}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex items-center gap-2 overflow-x-auto min-h-20 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] bg-surface-container/60 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl">
        {navItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveView(item.id as ViewId)}
            className={`flex min-w-[58px] flex-col items-center justify-center transition-all ${activeView === item.id ? "bg-primary-container/30 text-primary rounded-2xl px-2 py-2 shadow-[0_0_15px_rgba(128,131,255,0.2)]" : "text-on-surface-variant opacity-60"}`}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="font-mono text-[8px] uppercase font-bold tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
