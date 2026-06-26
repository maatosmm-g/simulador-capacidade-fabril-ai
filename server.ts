import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client server-side securely
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// AI S&OP Audit Route
app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { parameters, tipoPreco, initialStock } = req.body;

    if (!parameters) {
      return res.status(400).json({ error: "Parâmetros de simulação ausentes." });
    }

    const promptText = `
      Você é o Diretor Técnico Industrial e Consultor Sênior de S&OP da Ultraclor, especialista em PCP, Lean Manufacturing e Reconciliação de Massa.
      Analise os parâmetros de simulação industriais atuais fornecidos para a fabricação de Hipoclorito de Sódio da Ultraclor.
      
      Parâmetros atuais configurados pelo usuário:
      - Turnos por Dia (B02): ${parameters.producao.B02} turnos
      - Horas por Turno (B03): ${parameters.producao.B03}h
      - Dias Úteis de Turno/Mês (B04): ${parameters.producao.B04} dias
      - OEE Base Referência (B08): ${parameters.producao.B08}%
      - Perda Total Refugo (B11): ${parameters.producao.B11}%
      - Setup Médio entre SKUs (B12): ${parameters.producao.B12} minutos
      - Salário Médio Operador (D36): R$ ${parameters.operadores.D36}
      - Mix de Embalados vs Granel (Paradigma): ${tipoPreco === "embalado" ? "Padrão de Embalados de Fábrica" : "Padrão de Granel Commodity"}
      - Estoque Inicial de Segurança: ${initialStock} t
      
      Com base nessas escolhas, faça um parecer técnico industrial rigoroso, profissional e realista em português brasileiro.
      
      Avalie e comente criticamente:
      1. Se o OEE base configurado (${parameters.producao.B08}%) é realista. (Um OEE de 58% é comum em processos manuais/semicontínuos mas deixa muita "fábrica oculta" que pode ser destravada sem CAPEX; acima de 80% requer excelência operacional).
      2. Se o salário de R$ ${parameters.operadores.D36} dos operadores é coerente com o mercado brasileiro de hipoclorito e o impacto disso nos custos totais de mão de obra.
      3. A suficiência do número de turnos por dia (${parameters.producao.B02}) e dias de turno/mês (${parameters.producao.B04}) frente às metas de produção e sazonalidade. Por exemplo, 2 turnos com OEE de 58% podem gerar risco grave de ruptura nos meses de pico sazonal (Janeiro, Novembro, Dezembro) onde a demanda é muito alta, enquanto 3 turnos ou horas extras podem balancear melhor.
      4. A oportunidade não capturada de melhoria de SMED e refugo.
      
      Responda em formato estritamente JSON contendo a estrutura definida abaixo.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: "Você é um analista industrial sênior de PCP e S&OP. Forneça respostas diretas, altamente técnicas e focadas em eficiência produtiva e análise de cenários reais.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: {
              type: Type.STRING,
              description: "Status geral do cenário: 'OPTIMIZED' (otimizado/saudável), 'WARNING' (com ressalvas/gargalos) ou 'CRITICAL' (incongruente/ruptura grave)",
            },
            title: {
              type: Type.STRING,
              description: "Título conciso do parecer técnico",
            },
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array com 3 ou 4 análises técnicas profundas sobre os parâmetros (OEE, capacidade, mão de obra e turnos)",
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array com 3 ou 4 recomendações práticas de ações operacionais imediatas para o PCP",
            },
          },
          required: ["status", "title", "insights", "recommendations"],
        },
      },
    });

    const resultText = response.text || "{}";
    const parsedResult = JSON.parse(resultText);
    res.json(parsedResult);
  } catch (error: any) {
    console.error("Erro na rota /api/gemini/analyze:", error);
    res.status(500).json({
      error: "Falha na análise dos parâmetros pela IA.",
      details: error.message,
    });
  }
});

// Serve static assets or mount Vite dev server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode serving dist folder...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
