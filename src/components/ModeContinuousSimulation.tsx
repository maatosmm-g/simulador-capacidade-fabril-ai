import React, { useState } from "react";
import { SimulationParameters } from "../types";
import { runMonthlyContinuousSimulation } from "../utils/mathEngine";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ListCollapse, AlertTriangle, Check, ShieldAlert, ArrowRight, ArrowDownRight, RefreshCw, Calendar, Sparkles } from "lucide-react";

interface ModeContinuousSimulationProps {
  parameters: SimulationParameters;
  paletizaçãoTratamento: "pallet" | "package";
}

export default function ModeContinuousSimulation({ parameters, paletizaçãoTratamento }: ModeContinuousSimulationProps) {
  const [initialStock, setInitialStock] = useState<number>(200);

  const monthlySimResult = runMonthlyContinuousSimulation(parameters, initialStock, paletizaçãoTratamento);

  // Recharts composed data format
  const chartData = monthlySimResult.map((m) => ({
    name: m.monthName.substring(0, 3),
    "Demanda (t)": parseFloat(m.demandT.toFixed(1)),
    "Produção PMP (t)": parseFloat(m.plannedProdT.toFixed(1)),
    "Estoque Final (t)": parseFloat(m.endingStockT.toFixed(1)),
  }));

  // Identify issues count
  const stockoutCount = monthlySimResult.filter(m => m.stockoutWarning).length;
  const overflowCount = monthlySimResult.filter(m => m.overloadWarning).length;

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    <div className="space-y-6">
      
      {/* Simulation initial state and warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Initial inventory slider card */}
        <div className="bg-white border-2 border-[#141414] p-5 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] lg:col-span-4 flex flex-col justify-between">
          <div className="space-y-0.5">
            <h3 className="text-xs uppercase font-mono font-black text-black tracking-wider">
              Parâmetro Inicial de S&OP
            </h3>
            <p className="text-xs text-stone-600 font-sans">Ajuste o estoque de abertura para simular o carregamento inicial</p>
          </div>

          <div className="py-4">
            <div className="flex justify-between items-center mb-1 text-xs font-mono font-bold">
              <span className="text-stone-650">Estoque Inicial (Jan):</span>
              <strong className="text-blue-700 font-bold">{initialStock} t</strong>
            </div>
            <input
              id="initial-stock-slider"
              type="range"
              min="0"
              max="1000"
              step="25"
              value={initialStock}
              onChange={(e) => setInitialStock(parseInt(e.target.value) || 0)}
              className="w-full accent-black cursor-pointer bg-white h-2 border border-black mt-1"
            />
          </div>

          <div className="bg-[#E4E3E0]/25 border-2 border-[#141414] p-3 text-[11px] text-stone-850 space-y-1">
            <span className="font-mono text-black font-black uppercase text-[10px] block mb-0.5">Estoque Segurança (A19/A20):</span>
            <div className="flex justify-between">
              <span>Pré-pico (Set-Jan):</span>
              <span className="text-blue-700 font-bold font-mono">{parameters.demanda.A19} meses de demanda</span>
            </div>
            <div className="flex justify-between">
              <span>Pós-pico (Mar-Jun):</span>
              <span className="text-blue-700 font-bold font-mono">{parameters.demanda.A20} meses de demanda</span>
            </div>
          </div>
        </div>

        {/* Dynamic Alerts card */}
        <div className="bg-white border-2 border-[#141414] p-5 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] lg:col-span-8 flex flex-col justify-between">
          <div>
            <h3 className="text-xs uppercase font-mono font-black text-black tracking-wider">
              Status de Cobertura e Alocação (12 Meses)
            </h3>
            <p className="text-xs text-stone-600 font-sans">Alertas automáticos de transbordamento de silos de cloro e rupturas de stock</p>
          </div>

          <div className="grid grid-cols-2 gap-4 my-2">
            <div className={`p-3.5 border-2 text-center rounded-none shadow-[1px_1px_0px_0px_rgba(10,10,10,1)] ${stockoutCount > 0 ? "border-red-600 bg-red-50 text-red-800" : "border-[#141414]/30 bg-stone-50 text-stone-500"}`}>
              <span className="text-[10px] uppercase font-mono block font-black">Rupturas Sazonais</span>
              <strong className="text-xl font-black font-mono block mt-1">{stockoutCount} meses</strong>
              <p className="text-[10px] h-3.5 mt-1 font-sans font-bold">{stockoutCount > 0 ? "⚠️ Risco Comercial Ativo!" : "✓ Sem Rupturas de Estoque"}</p>
            </div>

            <div className={`p-3.5 border-2 text-center rounded-none shadow-[1px_1px_0px_0px_rgba(10,10,10,1)] ${overflowCount > 0 ? "border-amber-600 bg-amber-50 text-amber-800" : "border-[#141414]/30 bg-stone-50 text-stone-500"}`}>
              <span className="text-[10px] uppercase font-mono block font-black">Saturação Armazém</span>
              <strong className="text-xl font-black font-mono block mt-1">{overflowCount} meses</strong>
              <p className="text-[10px] h-3.5 mt-1 font-sans font-bold">{overflowCount > 0 ? "⚠️ Silos Excederam Limite!" : "✓ Estoques Balanceados"}</p>
            </div>
          </div>

          {stockoutCount === 0 && overflowCount === 0 && (
            <div className="bg-emerald-50 border border-emerald-600 p-2 text-[10px] uppercase font-mono font-black text-emerald-800 flex items-center gap-1.5 select-none mt-2">
              <Check className="w-4 h-4" /> Plano S&OP 100% Executável: Equilíbrio de estocagem ao longo do ano.
            </div>
          )}
        </div>

      </div>

      {/* Seasonal chart Composed (COMPOSED BAR/LINE) */}
      <div className="bg-white border-2 border-[#141414] p-5 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]">
        <div>
          <h3 className="text-xs uppercase font-mono font-black text-black tracking-wider">
            Perfil de Escoamento e Acúmulo S&OP
          </h3>
          <p className="text-xs text-stone-600 font-sans mt-0.5">Demanda vs Produção Sincronizada PMP vs Carry-over de Estoque (t)</p>
        </div>

        <div className="h-[250px] w-full mt-5">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#141414" />
              <XAxis dataKey="name" stroke="#121212" tick={{ fontSize: 9, fontFamily: "monospace", fontWeight: "bold" }} />
              <YAxis stroke="#121212" tick={{ fontSize: 9, fontFamily: "monospace", fontWeight: "bold" }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border-2 border-[#141414] p-2.5 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] font-mono text-xs text-black space-y-1">
                        <p className="font-extrabold border-b border-stone-200 pb-1">Mês Projetado</p>
                        {payload.map((p, i) => (
                          <p key={i} style={{ color: p.color === "#10b981" ? "#047857" : p.color }} className="font-black">
                            {p.name}: {p.value} t
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: 9, fontFamily: "monospace", paddingTop: 10, fontWeight: "bold" }} />
              <Bar dataKey="Demanda (t)" fill="#93C5FD" maxBarSize={30} stroke="#141414" strokeWidth={1} />
              <Bar dataKey="Produção PMP (t)" fill="#FDE047" maxBarSize={30} stroke="#141414" strokeWidth={1} />
              <Line type="monotone" dataKey="Estoque Final (t)" stroke="#DC2626" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly details list collapse */}
      <div className="bg-white border-2 border-[#141414] p-5 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] space-y-4">
        <h4 className="text-xs uppercase font-mono font-black text-black">Detalhamento Mensal de Fluxo Operacional</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {monthlySimResult.map((m) => {
            const hasIssue = m.stockoutWarning || m.overloadWarning;
            return (
              <div
                key={m.monthName}
                className={`p-3.5 border-2 flex flex-col justify-between transition rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] ${
                  m.stockoutWarning
                    ? "border-red-650 bg-red-50 text-red-950"
                    : m.overloadWarning
                    ? "border-amber-600 bg-amber-50 text-amber-950"
                    : "border-[#141414] bg-white hover:bg-yellow-50/20 text-black"
                }`}
              >
                <div className="flex justify-between items-center border-b-2 border-dashed border-[#141414]/25 pb-1.5 mb-2">
                  <span className="font-bold text-black text-xs font-mono flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-700" /> {m.monthName}
                  </span>
                  <span className="text-[9px] text-stone-500 font-mono font-extrabold uppercase">Saz.: {m.seasonalityPercent}%</span>
                </div>

                <div className="space-y-1 text-[11px] font-mono leading-relaxed">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Demanda:</span>
                    <strong className="text-black font-bold">{m.demandT.toFixed(1)} t</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Produção PMP:</span>
                    <strong className="text-emerald-700 font-black">{m.plannedProdT.toFixed(1)} t</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Estoque Final:</span>
                    <strong className="text-blue-800 font-black">{m.endingStockT.toFixed(1)} t</strong>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-[#141414]/20 pt-1 mt-1 text-[10px]">
                    <span className="text-stone-500">Dias Cobertura:</span>
                    <strong className="text-black font-black">{m.daysCoverage > 180 ? "∞" : `${m.daysCoverage.toFixed(0)} dias`}</strong>
                  </div>
                </div>

                {m.alertMsg && (
                  <div className="mt-2.5 pt-2 border-t border-dashed border-[#141414]/30 text-[10px] leading-snug font-sans flex items-start gap-1 text-black font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-650 shrink-0 mt-0.5" />
                    <span>{m.alertMsg}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanatory footer regarding finished products vs raw materials */}
      <div className="bg-[#E4E3E0]/20 border-2 border-dashed border-[#141414] p-4 text-xs font-sans text-stone-850 leading-relaxed">
        <span className="font-mono font-black text-black uppercase block mb-1 text-[10px]">📦 Nota de Escopo S&OP: Balanço de Estoques Acabados vs Matérias-Primas</span>
        <p>
          O perfil de cobertura e estocagem mensal simulado acima refere-se estritamente aos <strong>Produtos Finais Embalados e Paletizados Ultraclor</strong> (compostos pelas proporções de Cloro Fácil 10kg, Pastilhas, Algicidas, etc. de acordo com o Mix de Demanda ativo). 
        </p>
        <p className="mt-1.5">
          Para garantir a separação física estipulada pelo processo, os tanques e fluxos de <strong>Matérias-Primas do processo químico primário (Cloro Gás Cl2 e Soda Cáustica)</strong> não são integrados à cubagem do armazém de estocagem final. O suprimento destas matérias-primas químicas é balanceado de forma contínua pelo PPCP por meio de contratos de fornecimento integrados, assegurando que o processo de formulação reabasteça a linha de envase sem ocupar espaço físico na armazenagem de paletes prontos.
        </p>
      </div>

    </div>
  );
}
