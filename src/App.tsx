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
  Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type ViewId = 'dashboard' | 'audit' | 'simulate' | 'metrics';

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
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center min-h-[600px]">
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
          className="font-display text-5xl md:text-7xl font-bold leading-tight"
        >
          NÍTIDO <span className="text-primary drop-shadow-[0_0_15px_rgba(192,193,255,0.4)]">Decision Lab</span>
        </motion.h1>
        
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display text-2xl md:text-3xl text-secondary max-w-2xl"
        >
          Sistema explicable de prefiltrado de candidatos
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-on-surface-variant max-w-xl leading-relaxed"
        >
          Una plataforma interactiva para estimar si un candidato avanza a entrevista, explicar los factores del modelo y sustentar riesgos ante el CEO.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-4 mt-4"
        >
          <button onClick={() => onNavigate('simulate')} className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-primary-container text-on-primary font-bold shadow-[0_0_20px_rgba(128,131,255,0.4)] hover:brightness-110 active:scale-95 transition-all">
            Probar simulador
          </button>
          <button onClick={() => onNavigate('metrics')} className="px-8 py-4 rounded-xl border border-white/15 bg-white/5 backdrop-blur-md text-on-surface font-bold hover:bg-white/10 active:scale-95 transition-all">
            Ver métricas
          </button>
          <button onClick={() => onNavigate('audit')} className="px-8 py-4 rounded-xl border border-secondary/20 bg-secondary/5 text-secondary font-bold hover:bg-secondary/10 active:scale-95 transition-all flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Ver auditoría
          </button>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="lg:col-span-5 relative flex justify-center items-center"
      >
        <div className="relative w-full aspect-square max-w-[500px]">
          <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full scale-75 animate-pulse-slow"></div>
          <div className="relative glass-card rounded-[2.5rem] w-full h-full p-4 overflow-hidden border-white/20">
            <img 
              className="w-full h-full object-cover rounded-[2rem] opacity-90 mix-blend-lighten" 
              src={IMAGES.hero} 
              alt="AI Visualization" 
            />
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute top-8 right-8 glass-card p-4 rounded-xl border-white/10"
            >
              <div className="flex items-center gap-2 text-tertiary">
                <TrendingUp className="w-5 h-5" />
                <span className="font-mono text-xs font-bold">Umbral: 0.45</span>
              </div>
            </motion.div>
            <div className="absolute bottom-12 left-8 glass-card p-4 rounded-xl border-white/10">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Inferencia activa</span>
                <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "66%" }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-full bg-primary shadow-[0_0_8px_rgba(192,193,255,0.6)]"
                  ></motion.div>
                </div>
              </div>
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
          className={`glass-card rounded-2xl p-8 flex flex-col gap-4 group hover:border-${item.color}/40 transition-all duration-300`}
        >
          <div className={`w-12 h-12 rounded-xl bg-${item.color}/10 flex items-center justify-center text-${item.color} group-hover:bg-${item.color} group-hover:text-on-${item.color} transition-all`}>
            <item.icon className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold">{item.title}</h3>
          <p className="text-on-surface-variant">{item.desc}</p>
        </motion.div>
      ))}
    </section>
  </div>
);

const AuditView = () => (
  <div className="space-y-section-gap max-w-7xl mx-auto">
    <div className="space-y-4">
      <h2 className="text-3xl font-bold text-primary">Estado del reto</h2>
      <div className="w-full bg-surface-container-highest h-4 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="bg-gradient-to-r from-primary-container to-secondary-container h-full rounded-full shadow-[0_0_15px_rgba(192,193,255,0.4)]"
        ></motion.div>
      </div>
      <div className="flex justify-between font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
        <span>App, modelo y API</span>
        <span>Funcional en Vercel</span>
      </div>
    </div>

    <section>
      <div className="flex items-center gap-2 mb-8">
        <Database className="text-secondary w-6 h-6" />
        <h3 className="text-2xl font-bold">Entregables del reto</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {[
          { title: "Informe ejecutivo", desc: "Resumen estratégico para Juanpis: utilidad del modelo, riesgos y recomendación final.", status: "Por redactar" },
          { title: "Cuadernillo técnico", desc: "Notebook con EDA, modelado, evaluación, XAI, contrafactuales y auditoría.", status: "Base lista" },
          { title: "App funcional", desc: "Simulador React/Vercel conectado al modelo real y endpoint de inferencia.", status: "Desplegada" },
          { title: "Sustentación oral", desc: "Demo de caso aprobado, caso rechazado y recomendación de salida a producción.", status: "Preparar guion" }
        ].map((item, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="glass-card rounded-xl p-6 flex flex-col h-full border-t-2 border-t-primary/20"
          >
            <div className="mb-4">
              <Bolt className="w-8 h-8 text-primary" />
            </div>
            <h4 className="text-lg font-bold mb-2">{item.title}</h4>
            <p className="text-sm text-on-surface-variant mb-6 flex-grow">{item.desc}</p>
            <div className="flex items-center gap-2 text-tertiary">
              <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_#4cd7f6]" />
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
        <div className="absolute left-[3px] md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-tertiary rounded-full opacity-30"></div>
        
        {[
          { phase: 1, title: "Comprensión de datos", color: "primary", content: "5.000 candidatos históricos, 18 variables anonimizadas y etiqueta binaria avanza." },
          { phase: 2, title: "Preprocesamiento", color: "secondary", content: "Pipeline con imputación, escalado y modelo final de regresión logística." },
          { phase: 3, title: "Evaluación", color: "tertiary", content: "Umbral operativo 0.45, F1 de prueba 0.7241 y AUC de prueba 0.8056." },
          { phase: 4, title: "Auditoría", color: "error", content: "Variables anonimizadas: el modelo requiere supervisión humana y revisión de sesgos antes de producción." }
        ].map((p, i) => (
          <div key={i} className={`relative mb-16 md:flex ${i % 2 === 0 ? "md:justify-start" : "md:flex-row-reverse md:justify-start"} items-center w-full`}>
            <div className="absolute left-[-5px] md:left-1/2 md:-translate-x-1/2 w-5 h-5 rounded-full bg-background border-4 border-primary z-10 box-content -ml-[3px]" style={{ borderColor: `var(--color-${p.color})` }} />
            <motion.div 
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`ml-10 md:ml-0 md:w-[45%] glass-card p-6 rounded-2xl border-l-4 border-l-${p.color}`}
            >
              <span className={`font-mono text-[10px] text-${p.color} uppercase tracking-widest mb-1 block`}>Fase {p.phase}</span>
              <h5 className="text-lg font-bold mb-2">{p.title}</h5>
              <p className="text-sm text-on-surface-variant leading-relaxed">{p.content}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </section>

    <section className="glass-card rounded-xl p-8 border-secondary/20">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="text-secondary w-6 h-6" />
        <h3 className="text-2xl font-bold">Recomendación final al CEO</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Decisión", value: "Salida condicionada", tone: "text-primary" },
          { label: "Riesgo principal", value: "Variables anonimizadas", tone: "text-error" },
          { label: "Control requerido", value: "Revisión humana", tone: "text-tertiary" }
        ].map((item) => (
          <div key={item.label} className="bg-surface-container-low/60 border border-white/10 rounded-xl p-5">
            <span className="block font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">{item.label}</span>
            <strong className={`text-lg ${item.tone}`}>{item.value}</strong>
          </div>
        ))}
      </div>
      <p className="text-on-surface-variant leading-relaxed mt-6">
        El modelo puede presentarse como prototipo funcional y explicable, pero no debería operar como sistema automático definitivo hasta validar el significado real de las variables, monitorear sesgos en producción y mantener una etapa de revisión humana para casos sensibles o cercanos al umbral.
      </p>
    </section>
  </div>
);

const SimulatorView = () => {
  const [candidate, setCandidate] = useState<Record<string, number>>(DEFAULT_CANDIDATE);
  const [result, setResult] = useState<PredictionResult | null>(null);
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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detalle || data.error || 'No fue posible calcular la predicción.');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al consultar el modelo.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
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
        <h1 className="text-4xl font-bold mb-2">Simulador de candidato</h1>
        <p className="text-on-surface-variant max-w-3xl">
          Ingresa las variables anonimizadas del candidato. El modelo usa el umbral 0.45 para estimar si avanza a entrevista; la decisión final debe tener revisión humana.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <section className="lg:col-span-8 glass-card rounded-xl p-8 space-y-8">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-tertiary w-6 h-6" />
            <h2 className="text-2xl font-bold text-primary">Variables continuas</h2>
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
          <section className="glass-card rounded-xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <ToggleRight className="text-secondary w-6 h-6" />
              <h2 className="text-2xl font-bold text-secondary">Binarias</h2>
            </div>
            <div className="space-y-4">
              {BINARY_VARIABLES.map(renderSelect)}
            </div>
          </section>

          <section className="glass-card rounded-xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <Database className="text-tertiary w-6 h-6" />
              <h2 className="text-2xl font-bold text-tertiary">Discretas</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {DISCRETE_VARIABLES.map(renderSelect)}
            </div>
          </section>
        </aside>
      </div>

      <motion.div
        whileHover={{ scale: 1.01 }}
        className="flex flex-col lg:flex-row items-stretch justify-between glass-card p-8 rounded-2xl gap-8"
      >
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center border border-primary/30 shrink-0">
            <Cpu className="text-primary w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Inferencia del modelo NÍTIDO</h3>
            <p className="text-on-surface-variant">Regresión logística con pipeline de preprocesamiento, desplegada como función Python en Vercel.</p>
          </div>
        </div>
        <button
          onClick={runPrediction}
          disabled={isLoading}
          className="w-full lg:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-primary-container to-secondary-container font-display text-xl font-bold text-on-primary shadow-[0_10px_30px_rgba(128,131,255,0.4)] disabled:opacity-60 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          {isLoading ? 'Calculando...' : 'Calcular predicción'} <Bolt className="w-6 h-6 fill-on-primary" />
        </button>
      </motion.div>

      {error && (
        <div className="glass-card rounded-xl p-6 border-error/40 text-error flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {result && (() => {
        const plainExplanation = buildPlainExplanation(result);

        return (
          <div className="space-y-gutter">
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
              <div className="lg:col-span-4 glass-card rounded-xl p-8">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Resultado</span>
                <h2 className={`text-4xl font-bold mt-3 ${result.prediccion === 1 ? 'text-tertiary' : 'text-error'}`}>
                  {result.estado}
                </h2>
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Probabilidad de avanzar</span>
                    <span className="font-mono text-primary">{formatPercent(result.probabilidad)}</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-surface-container-highest overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.min(result.probabilidad * 100, 100)}%` }} />
                  </div>
                  <div className="flex justify-between font-mono text-[10px] text-on-surface-variant uppercase">
                    <span>Umbral</span>
                    <span>{result.umbral.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 glass-card rounded-xl p-8">
                <h3 className="text-2xl font-bold mb-6">Explicación local</h3>
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

              <div className="lg:col-span-3 glass-card rounded-xl p-8">
                <h3 className="text-2xl font-bold mb-4">Contrafactual</h3>
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

            <section className="glass-card rounded-xl p-8 border-primary/20">
              <div className="flex items-center gap-3 mb-5">
                <Monitor className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold">Explicación en palabras simples</h3>
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

const MetricsView = () => (
  <div className="space-y-10">
    <section>
      <h1 className="text-4xl font-bold mb-2 text-on-surface">Resumen del modelo</h1>
      <p className="text-on-surface-variant max-w-2xl">Resultados principales del modelo final de prefiltrado y criterios usados para escoger el umbral operativo.</p>
    </section>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: "Modelo final", val: "Regresión logística", meta: "Pipeline sklearn", icon: Cpu },
        { label: "Umbral", val: "0.45", progress: true, color: "secondary" },
        { label: "F1-score test", val: "0.7241", trend: "Métrica principal", icon: BarChart3, color: "tertiary" },
        { label: "AUC test", val: "0.8056", validated: true, color: "primary" }
      ].map((m, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-card rounded-xl p-6 flex flex-col justify-between min-h-[160px]"
        >
          <div>
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">{m.label}</span>
            <h3 className={`text-2xl font-bold ${m.color ? `text-${m.color}` : "text-primary"}`}>{m.val}</h3>
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

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-card rounded-xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Métricas de rendimiento</h2>
            <p className="text-sm text-on-surface-variant">Resumen visual para sustentación</p>
          </div>
        </div>
        
        <div className="relative aspect-video flex items-end justify-between px-8 pb-10 border-b border-white/10">
          <div className="absolute inset-0 flex flex-col justify-between opacity-5 pointer-events-none pb-12 pt-8">
            {[1, 2, 3, 4].map(l => <div key={l} className="w-full border-t border-on-surface" />)}
          </div>
          {[
            { l: "Exactitud", v: 85, color: "primary" },
            { l: "Precisión", v: 78, color: "secondary" },
            { l: "Sensibilidad", v: 68, color: "tertiary" },
            { l: "F1", v: 72, color: "primary" },
            { l: "AUC", v: 81, color: "secondary" }
          ].map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-6 group">
              <div className="relative w-12 md:w-16 rounded-t-lg transition-all duration-500 overflow-hidden" style={{ height: `${bar.v}%` }}>
                <div className={`absolute inset-0 bg-${bar.color}/20`} />
                <div className={`absolute top-0 w-full h-[2px] bg-${bar.color} shadow-[0_0_15px_rgba(0,0,0,0.5)] shadow-${bar.color}`} />
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: "100%" }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  className={`absolute bottom-0 w-full bg-gradient-to-t from-${bar.color}/40 to-transparent`} 
                />
              </div>
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">{bar.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-8">Matriz de confusión</h2>
        <div className="grid grid-cols-2 gap-3 mb-10">
          <div className="bg-primary/20 border border-primary/30 p-6 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase mb-1">Verd. neg.</span>
            <span className="text-4xl font-bold text-primary">482</span>
          </div>
          <div className="bg-surface-container-high border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center opacity-60">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase mb-1">Falso pos.</span>
            <span className="text-4xl font-bold">54</span>
          </div>
          <div className="bg-surface-container-high border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center opacity-60">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase mb-1">Falso neg.</span>
            <span className="text-4xl font-bold">112</span>
          </div>
          <div className="bg-secondary/20 border border-secondary/30 p-6 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase mb-1">Verd. pos.</span>
            <span className="text-4xl font-bold text-secondary">298</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between font-mono text-[10px] uppercase">
            <span className="text-on-surface-variant">Balance de clases</span>
            <span className="text-on-surface">62% / 38%</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden flex shadow-inner border border-white/5">
            <div className="h-full bg-primary w-[62%]"></div>
            <div className="h-full bg-secondary w-[38%]"></div>
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
      <section className="glass-card rounded-xl p-8">
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
      </section>

      <section className="glass-card rounded-xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <Settings2 className="text-secondary w-6 h-6" />
          <h2 className="text-2xl font-bold">Hiperparámetros</h2>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {[
            { l: "Max iter", v: "1000" },
            { l: "Penalidad", v: "l2" },
            { l: "Solver", v: "lbfgs" },
            { l: "Parámetro C", v: "1.0" }
          ].map((item, i) => (
            <div key={i} className="bg-surface-container-low/50 border border-white/10 rounded-2xl p-6">
              <span className="block font-mono text-[10px] text-on-surface-variant uppercase mb-2">{item.l}</span>
              <span className="text-xl font-bold">{item.v}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
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
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Header */}
      <header className="fixed top-0 w-full bg-surface-container/40 backdrop-blur-xl border-b border-white/15 h-16 z-50 flex items-center justify-between px-container-padding-mobile md:px-container-padding-desktop">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('dashboard')}>
          <Network className="w-7 h-7 text-primary" />
          <span className="font-display text-xl font-bold tracking-tighter text-primary drop-shadow-[0_0_8px_rgba(192,193,255,0.4)]">NÍTIDO</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 font-mono text-xs font-bold uppercase tracking-widest">
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
      <main className="pt-24 pb-32 px-container-padding-mobile md:px-container-padding-desktop max-w-7xl mx-auto bg-mesh">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeView === 'dashboard' && <DashboardView onNavigate={setActiveView} />}
            {activeView === 'audit' && <AuditView />}
            {activeView === 'simulate' && <SimulatorView />}
            {activeView === 'metrics' && <MetricsView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 pb-safe px-4 bg-surface-container/60 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl">
        {navItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveView(item.id as ViewId)}
            className={`flex flex-col items-center justify-center transition-all ${activeView === item.id ? "bg-primary-container/30 text-primary rounded-2xl px-4 py-2 shadow-[0_0_15px_rgba(128,131,255,0.2)]" : "text-on-surface-variant opacity-60"}`}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="font-mono text-[8px] uppercase font-bold tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// --- Icons used in the screenshots ---
const ToggleRight = ({ className }: { className?: string }) => <Bolt className={className} />;
