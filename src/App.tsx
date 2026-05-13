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
  Search, 
  Bolt, 
  ShieldCheck, 
  BarChart3, 
  Database,
  Monitor,
  Activity,
  History,
  Settings2,
  ChevronRight,
  Plus,
  AlertCircle,
  TrendingUp,
  Cpu,
  Fingerprint,
  Mic,
  Maximize2,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type ViewId = 'dashboard' | 'audit' | 'simulate' | 'metrics';

// --- Assets ---
const IMAGES = {
  hero: "https://lh3.googleusercontent.com/aida-public/AB6AXuBITTOAiVHNmmS40CjrByPDdO_OxMjbGQHFUxpLV32jZKaros_0izAvyLfqKKKfQOpKpl-4PQciLWY84nMQOTQM_G6jBnxzWKiXITifEWcKroMVMRpUQi3ATkV-j6jEJXRMk4Wvq_hsRGFNDM7SAQZz5P9Bevc20YX0Hbq93OGiem90NryDCMZV9Pt92swRAJGfXXhkUxMIVbJboq1M6UsYbznBtla-f-_4aR_GydWuECzEMyXwiih-pk8y2ZO3TJq_HwWwKKoZJd0",
  profile: "https://lh3.googleusercontent.com/aida-public/AB6AXuDoTzgmVKInpfE7wdGSob1ZcYDHBJXjzIDamZFsjVb1fu8J66tugmUSnmDZiqK20exre8uddU5aHIWe4vQiSZxj66OS_nJ_fwYLVdnalNWXqZb6YWtBF559RKr9eQTuqxB69rgP1yhZDpbn7Z5FhO-F79KrA6C-Texyjf4vx1MYPc381kYZgYYBybEsOgHzwQArL1gYqBawBrPcMXdnlzuR33h-44F9kt564Y3f5FaawRk4FpM8Yy7dKJ9YRA7zYBLdaFoNSyNEtBg",
  circuit: "https://lh3.googleusercontent.com/aida-public/AB6AXuDxP74gYlRghDZl454WKsrK4x0MKEkGClXYAPMg2AzFriB3ZsY_sRerFUsDik7YYPH4sEs48p1gR3PoRxTiZabmb7ZD6_SnSYoFeFDy85Q_uvSoXLcI8T83UZ2Ft8LegIN-lh7Ln2FH7_ig1PFxaldvTobLW_jaRaq_57U8WqXPp41qkpPE2DaG6nfPUrA29JyGRhiTqg2BWA8e-2q-eI86xMpcur2aH3ZOj7LJZoF0TrcUsY5s1kCNJb_5_ThKGUoXHOXpkoFXMv8",
  neural: "https://lh3.googleusercontent.com/aida-public/AB6AXuCDIovEJOK7S-Cnw95NbSJc2eInIi7ftjNjeIymqmtzHv9P7yD2I_PdLtJT2yhpwzghX0BKJpUvfYlCq4MQp2w855ht9xQy1UY2crhcadubYwl5R4SQQYIQvgsTfWORIAYbVLwtjx8BcKFiROaBAi8DY26sQXdXdhFFChjJgJZPKyYQUpJGtVIDBCHqvvJRsZwKzXYsICPfTrZsvZ78VoTSCj6argb8dynWuaL9OpKGE8MFS6m8Fz0TKfuA8uyYfzm_smYdTH0dUpU",
  globe: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9nCj5kWSQxXq7ZGWQMd5UB9ZsuO_LjObS3RBoPQ_cgWaCyjablG6cuy-bw8xcQMmUN1MmU3orbYWWd_y9QZBB-fE3cjmsmexL61X6HuIQkUreJGopNjhMYSchUyVRIvhf8X5uNbW9l0Fji1PsxsvUt9DsioVij6itNswB7sGfmLj4NyzmfMJ0BquG-kPE5iJUEUe5ZcsHraCx87o2HmZF258E7OsbYZuqsC-g0B8FGpqinWa2UjbCtV39JJLzQuoyDw3M-MoE4kc"
};

// --- Sub-components ---

const DashboardView = () => (
  <div className="space-y-section-gap">
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center min-h-[600px]">
      <div className="lg:col-span-7 flex flex-col items-start gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary"
        >
          <Bolt className="w-4 h-4 fill-primary" />
          <span className="font-mono text-xs uppercase tracking-wider">Version 2.4 Stable</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-5xl md:text-7xl font-bold leading-tight"
        >
          NÍTIDO <span className="text-primary drop-shadow-[0_0_15px_rgba(192,193,255,0.4)]">AI Lab</span>
        </motion.h1>
        
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display text-2xl md:text-3xl text-secondary max-w-2xl"
        >
          Sistema explicable de prefiltrado de candidatos con Machine Learning
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-on-surface-variant max-w-xl leading-relaxed"
        >
          Una plataforma interactiva diseñada para predecir, explicar y auditar decisiones de avance en procesos de selección con total transparencia.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-4 mt-4"
        >
          <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-primary-container text-on-primary font-bold shadow-[0_0_20px_rgba(128,131,255,0.4)] hover:brightness-110 active:scale-95 transition-all">
            Probar simulador
          </button>
          <button className="px-8 py-4 rounded-xl border border-white/15 bg-white/5 backdrop-blur-md text-on-surface font-bold hover:bg-white/10 active:scale-95 transition-all">
            Ver entregables
          </button>
          <button className="px-8 py-4 rounded-xl border border-secondary/20 bg-secondary/5 text-secondary font-bold hover:bg-secondary/10 active:scale-95 transition-all flex items-center gap-2">
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
                <span className="font-mono text-xs font-bold">Accuracy: 98.2%</span>
              </div>
            </motion.div>
            <div className="absolute bottom-12 left-8 glass-card p-4 rounded-xl border-white/10">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Model Processing</span>
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
          desc: "Experimenta con diferentes perfiles de candidatos y observa cómo los modelos de ML generan puntuaciones en tiempo real.",
          icon: Activity,
          color: "primary"
        },
        { 
          title: "IA Explicable (XAI)", 
          desc: "Desglosamos el 'porqué' de cada decisión mediante valores SHAP y LIME, eliminando la caja negra del reclutamiento.",
          icon: Monitor,
          color: "secondary"
        },
        { 
          title: "Auditoría Ética", 
          desc: "Herramientas integradas para detectar y mitigar sesgos algorítmicos, asegurando procesos justos y equitativos.",
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
      <h2 className="text-3xl font-bold text-primary">Estado de Entregables</h2>
      <div className="w-full bg-surface-container-highest h-4 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "85%" }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="bg-gradient-to-r from-primary-container to-secondary-container h-full rounded-full shadow-[0_0_15px_rgba(192,193,255,0.4)]"
        ></motion.div>
      </div>
      <div className="flex justify-between font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
        <span>Progreso total del proyecto</span>
        <span>85% Completado</span>
      </div>
    </div>

    <section>
      <div className="flex items-center gap-2 mb-8">
        <Database className="text-secondary w-6 h-6" />
        <h3 className="text-2xl font-bold">Entregables del reto</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {[
          { title: "Informe ejecutivo", desc: "Resumen estratégico de hallazgos, impacto de negocio y recomendaciones clave.", status: "Incluido" },
          { title: "Cuadernillo técnico", desc: "Documentación detallada de arquitectura, modelos y validación estadística.", status: "Desarrollado" },
          { title: "App funcional", desc: "Interfaz interactiva para visualización de predicciones y gestión de candidatos.", status: "Incluido" },
          { title: "Sustentación oral", desc: "Presentación presencial de los resultados finales ante el comité evaluador.", status: "Desarrollado" }
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
          { phase: 1, title: "Comprensión de datos", color: "primary", content: "5,000 candidates processed. 18 core feature variables identified." },
          { phase: 2, title: "Preprocesamiento", color: "secondary", content: "Logistic Regression, Random Forest. Optimization: Threshold fixed at 0.45" },
          { phase: 3, title: "Evaluación", color: "tertiary", content: "F1-score: 0.7241, AUC: 0.8056. Explainability via SHAP & LIME." },
          { phase: 4, title: "Auditoría", color: "error", content: "Bias risk detected in demographic slices. Optimized Var x1, x2, x5." }
        ].map((p, i) => (
          <div key={i} className={`relative mb-16 md:flex ${i % 2 === 0 ? "md:justify-start" : "md:flex-row-reverse md:justify-start"} items-center w-full`}>
            <div className="absolute left-[-5px] md:left-1/2 md:-translate-x-1/2 w-5 h-5 rounded-full bg-background border-4 border-primary z-10 box-content -ml-[3px]" style={{ borderColor: `var(--color-${p.color})` }} />
            <motion.div 
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`ml-10 md:ml-0 md:w-[45%] glass-card p-6 rounded-2xl border-l-4 border-l-${p.color}`}
            >
              <span className={`font-mono text-[10px] text-${p.color} uppercase tracking-widest mb-1 block`}>Phase {p.phase}</span>
              <h5 className="text-lg font-bold mb-2">{p.title}</h5>
              <p className="text-sm text-on-surface-variant leading-relaxed">{p.content}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  </div>
);

const SimulatorView = () => (
  <div className="space-y-8">
    <div>
      <h1 className="text-4xl font-bold mb-2">Simulador de candidato</h1>
      <p className="text-on-surface-variant max-w-2xl">Ajuste os parâmetros neurais e variáveis comportamentais para gerar uma predição de alta fidelidade para o perfil do candidato.</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
      <section className="lg:col-span-8 glass-card rounded-xl p-8 space-y-8">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="text-tertiary w-6 h-6" />
          <h2 className="text-2xl font-bold text-primary">Contínuas</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {[
            { label: "Variável x1", val: "85.4%" },
            { label: "Variável x2", val: "42.1%" },
            { label: "Variável x6", val: "12.0" },
            { label: "Variável x10", val: "0.95" },
            { label: "Variável x11", val: "234ms" },
            { label: "Variável x14", val: "High" },
            { label: "Variável x15", val: "Stable" },
            { label: "Variável x16", val: "0.02" }
          ].map((item, i) => (
            <div key={i} className="space-y-3">
              <div className="flex justify-between items-center font-mono text-xs uppercase tracking-wider">
                <label className="text-on-surface">{item.label}</label>
                <span className="text-primary">{item.val}</span>
              </div>
              <input 
                type="range" 
                className="w-full h-1.5 bg-surface-container-highest rounded-full appearance-none accent-primary" 
              />
            </div>
          ))}
        </div>
      </section>

      <aside className="lg:col-span-4 space-y-gutter">
        <section className="glass-card rounded-xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <ToggleRight className="text-secondary w-6 h-6" />
            <h2 className="text-2xl font-bold text-secondary">Binarias</h2>
          </div>
          <div className="space-y-6">
            {["Variável x5", "Variável x17"].map((label, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low/50 border border-white/5">
                <span className="font-mono text-xs uppercase font-bold">{label}</span>
                <div className={`w-12 h-6 rounded-full relative p-1 cursor-pointer transition-colors ${i === 0 ? "bg-primary/20 border border-primary/40" : "bg-surface-container-highest border border-white/10"}`}>
                  <div className={`w-4 h-4 rounded-full transition-all ${i === 0 ? "bg-primary translate-x-6 shadow-[0_0_10px_rgba(192,193,255,1)]" : "bg-on-surface-variant translate-x-0"}`} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <Database className="text-tertiary w-6 h-6" />
            <h2 className="text-2xl font-bold text-tertiary">Discretas</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {["x3", "x4", "x7", "x8"].map((l, i) => (
              <div key={i} className="space-y-1">
                <label className="font-mono text-[10px] text-on-surface-variant uppercase">{l}</label>
                <div className="w-full bg-surface-container-highest/60 border border-white/10 rounded-lg py-2 px-3 text-xs flex justify-between items-center cursor-pointer">
                  <span>{i === 0 ? "Cat_A" : i === 1 ? "Level_1" : i === 2 ? "Type_0" : "Phase_X"}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center">
             <span className="font-mono text-[10px] text-on-surface-variant uppercase">x9, x12, x13, x18</span>
             <button className="text-primary text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white/5 p-2 rounded">
               Edit All <Plus className="w-3 h-3" />
             </button>
          </div>
        </section>
      </aside>
    </div>

    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="flex flex-col md:flex-row items-center justify-between glass-card p-10 rounded-2xl gap-8"
    >
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center border border-primary/30">
          <Cpu className="text-primary w-8 h-8" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">Pronto para processar?</h3>
          <p className="text-on-surface-variant">O motor de inferência utilizará o modelo v4.2 para esta simulação.</p>
        </div>
      </div>
      <button className="w-full md:w-auto px-12 py-5 rounded-2xl bg-gradient-to-r from-primary-container to-secondary-container font-display text-xl font-bold text-on-primary-fixed shadow-[0_10px_30px_rgba(128,131,255,0.4)] active:scale-95 transition-all flex items-center justify-center gap-3">
        Calcular predicción <Bolt className="w-6 h-6 fill-on-primary-fixed" />
      </button>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter opacity-40">
      {[IMAGES.circuit, IMAGES.neural, IMAGES.globe].map((src, i) => (
        <div key={i} className="h-32 rounded-2xl overflow-hidden border border-white/10 grayscale hover:grayscale-0 transition-all cursor-crosshair">
          <img src={src} className="w-full h-full object-cover" alt="context" />
        </div>
      ))}
    </div>
  </div>
);

const MetricsView = () => (
  <div className="space-y-10">
    <section>
      <h1 className="text-4xl font-bold mb-2 text-on-surface">Resumen del modelo</h1>
      <p className="text-on-surface-variant max-w-2xl">Visualización detallada de los resultados de entrenamiento y métricas de validación para el modelo de clasificación de activos.</p>
    </section>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: "Final Model", val: "Logistic Regression", meta: "ID: LR-992-BETA", icon: Cpu },
        { label: "Threshold", val: "0.45", progress: true, color: "secondary" },
        { label: "F1-score Test", val: "0.7241", trend: "+2.4% vs baseline", icon: BarChart3, color: "tertiary" },
        { label: "AUC Test", val: "0.8056", reviewers: true, color: "primary" }
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
          {m.reviewers && (
            <div className="flex items-center gap-3 mt-4">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full border border-surface bg-surface-container flex items-center justify-center text-[8px] font-bold">R1</div>
                <div className="w-6 h-6 rounded-full border border-surface bg-surface-container flex items-center justify-center text-[8px] font-bold">R2</div>
              </div>
              <span className="font-mono text-[10px] opacity-60 uppercase">Verified by 2 reviewers</span>
            </div>
          )}
        </motion.div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-card rounded-xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Métricas de Rendimiento</h2>
            <p className="text-sm text-on-surface-variant">Comparativa multidimensional del modelo final</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-surface-container-highest p-2 rounded-lg hover:bg-surface-variant transition-colors border border-white/5"><FileDown className="w-5 h-5" /></button>
            <button className="bg-primary/20 p-2 rounded-lg text-primary border border-primary/30 transition-colors"><Maximize2 className="w-5 h-5" /></button>
          </div>
        </div>
        
        <div className="relative aspect-video flex items-end justify-between px-8 pb-10 border-b border-white/10">
          <div className="absolute inset-0 flex flex-col justify-between opacity-5 pointer-events-none pb-12 pt-8">
            {[1, 2, 3, 4].map(l => <div key={l} className="w-full border-t border-on-surface" />)}
          </div>
          {[
            { l: "Accuracy", v: 85, color: "primary" },
            { l: "Precision", v: 78, color: "secondary" },
            { l: "Recall", v: 68, color: "tertiary" },
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
        <h2 className="text-2xl font-bold mb-8">Confusion Matrix</h2>
        <div className="grid grid-cols-2 gap-3 mb-10">
          <div className="bg-primary/20 border border-primary/30 p-6 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase mb-1">True Neg</span>
            <span className="text-4xl font-bold text-primary">482</span>
          </div>
          <div className="bg-surface-container-high border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center opacity-60">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase mb-1">False Pos</span>
            <span className="text-4xl font-bold">54</span>
          </div>
          <div className="bg-surface-container-high border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center opacity-60">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase mb-1">False Neg</span>
            <span className="text-4xl font-bold">112</span>
          </div>
          <div className="bg-secondary/20 border border-secondary/30 p-6 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase mb-1">True Pos</span>
            <span className="text-4xl font-bold text-secondary">298</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between font-mono text-[10px] uppercase">
            <span className="text-on-surface-variant">Class Balance</span>
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
          <h2 className="text-2xl font-bold">Historial de Entrenamiento</h2>
        </div>
        <div className="space-y-6">
          {[
            { l: "Iniciado", v: "Oct 12, 2023 - 14:22" },
            { l: "Duración", v: "0h 14m 22s" },
            { l: "Optimizador", v: "AdamW (lr=0.001)" },
            { l: "Regularización", v: "L2 (alpha=0.01)" }
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
            { l: "Max Iter", v: "1000" },
            { l: "Penalty", v: "l2" },
            { l: "Solver", v: "lbfgs" },
            { l: "C-Param", v: "1.0" }
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
    { id: 'dashboard', label: 'Home', icon: Network },
    { id: 'audit', label: 'Audit', icon: ShieldCheck },
    { id: 'simulate', label: 'Simulate', icon: Activity },
    { id: 'metrics', label: 'Metrics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Header */}
      <header className="fixed top-0 w-full bg-surface-container/40 backdrop-blur-xl border-b border-white/15 h-16 z-50 flex items-center justify-between px-container-padding-mobile md:px-container-padding-desktop">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('dashboard')}>
          <Network className="w-7 h-7 text-primary" />
          <span className="font-display text-xl font-bold tracking-tighter text-primary drop-shadow-[0_0_8px_rgba(192,193,255,0.4)]">NEURALIS LABS</span>
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
          <button className="text-on-surface-variant hover:text-primary transition-colors">Assets</button>
        </nav>

        <div className="flex items-center gap-4">
          <Search className="w-5 h-5 text-on-surface-variant hover:text-primary cursor-pointer transition-colors" />
          <div className="w-9 h-9 rounded-full border border-primary/40 overflow-hidden">
            <img src={IMAGES.profile} className="w-full h-full object-cover" alt="User" />
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
            {activeView === 'dashboard' && <DashboardView />}
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

      {/* Floating Action Button */}
      <button className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-[0_10px_40px_rgba(192,193,255,0.4)] flex items-center justify-center z-40 active:scale-95 transition-all">
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
}

// --- Icons used in the screenshots ---
const ToggleRight = ({ className }: { className?: string }) => <Bolt className={className} />;
const ChevronDown = ({ className }: { className?: string }) => <Plus className={`${className} rotate-45`} />;

