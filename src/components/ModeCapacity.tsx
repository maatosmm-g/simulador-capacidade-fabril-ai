import React from "react";
import { SimulationResult, SimulationParameters } from "../types";
import { Gauge, Clock, Users, ArrowUpRight, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ModeCapacityProps {
  result: SimulationResult;
  parameters: SimulationParameters;
}

export default function ModeCapacity({ result, parameters }: ModeCapacityProps) {
  
  // Recharts capacity data
  const data = [
    { name: "Teórica (Nominal)", valor: result.capacityTheoretical, fill: "#E4E3E0", descricao: "Limite físico absoluto do maquinário" },
    { name: "Efetiva (Planejada)", valor: result.capacityEffective, fill: "#93C5FD", descricao: "Descontado setups e OEE básico" },
    { name: "Realista (PMP)", valor: result.capacityRealisticPMP, fill: "#FDE047", descricao: "Realidade com perdas e ajuste humano" },
  ];

  // Calculations for display
  const totalWeightTime1T = result.skuData.reduce((acc, curr) => acc + (curr.mixPercent > 0 ? (curr.mixPercent * 10 / curr.weightPerPkg / curr.speedPkgMin) : 0), 0) / 10;
  
  const totalCost = result.costTotalMaoDeObra;
  const unitCostConversion = result.capacityRealisticPMP > 0 ? totalCost / result.capacityRealisticPMP : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white border-2 border-[#141414] p-4 flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500 font-bold">Capacidade Realista PMP</span>
            <div className="text-xl font-black font-mono text-[#141414]">
              {result.capacityRealisticPMP.toFixed(1)} <span className="text-xs text-stone-505 font-sans font-normal">t/mês</span>
            </div>
            <p className="text-[10px] text-stone-600 font-sans">Meta: {(parameters.demanda.A01 / 12).toFixed(1)} t</p>
          </div>
          <div className="bg-[#E4E3E0] p-2 border-2 border-[#141414]">
            <TrendingUp className="w-4 h-4 text-black" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border-2 border-[#141414] p-4 flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500 font-bold">Operadores Alocados</span>
            <div className="text-xl font-black font-mono text-[#141414]">
              {result.operatorsAllocated} <span className="text-xs text-stone-505 font-sans font-normal">op/linha</span>
            </div>
            <p className="text-[10px] text-stone-600 font-sans">{result.operatorsCalculatedWeighted.toFixed(2)} requeridos</p>
          </div>
          <div className="bg-[#E4E3E0] p-2 border-2 border-[#141414]">
            <Users className="w-4 h-4 text-black" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border-2 border-[#141414] p-4 flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500 font-bold">OEE Ajustado</span>
            <div className="text-xl font-black font-mono text-[#141414]">
              {result.oeeAdjusted.toFixed(1)}%
            </div>
            <p className="text-[10px] text-stone-600 font-sans">Base: {result.oeeBase}%</p>
          </div>
          <div className="bg-[#E4E3E0] p-2 border-2 border-[#141414]">
            <Gauge className="w-4 h-4 text-black" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border-2 border-[#141414] p-4 flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500 font-bold">Tempo Ativo Linha</span>
            <div className="text-xl font-black font-mono text-[#141414]">
              {result.hoursNetProd.toFixed(1)} <span className="text-xs text-stone-505 font-sans font-normal">horas</span>
            </div>
            <p className="text-[10px] text-stone-600 font-sans">Setup: {result.hoursSetupLost.toFixed(1)}h</p>
          </div>
          <div className="bg-[#E4E3E0] p-2 border-2 border-[#141414]">
            <Clock className="w-4 h-4 text-black" />
          </div>
        </div>

        {/* Card 5: Fábrica Oculta (Lean Manufacturing) */}
        <div className="bg-amber-50 border-2 border-[#141414] p-4 flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-900 font-bold">Fábrica Oculta</span>
            <div className="text-xl font-black font-mono text-red-700">
              {(result.capacityTheoretical > 0 ? ((result.capacityTheoretical - result.capacityRealisticPMP) / result.capacityTheoretical) * 100 : 0).toFixed(1)}%
            </div>
            <p className="text-[10px] text-stone-600 font-sans">
              Perda: {Math.max(0, result.capacityTheoretical - result.capacityRealisticPMP).toFixed(1)} t
            </p>
          </div>
          <div className="bg-amber-100 p-2 border-2 border-[#141414]">
            <AlertTriangle className="w-4 h-4 text-amber-900" />
          </div>
        </div>

      </div>

      {/* Main Content: Chart + Description */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart Card */}
        <div className="bg-white border-2 border-[#141414] p-5 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] lg:col-span-8 flex flex-col justify-between">
          <div>
            <h3 className="text-xs uppercase font-mono font-black text-black tracking-wider">
              Análise Visual de Capacidade Produtiva (t/mês)
            </h3>
            <p className="text-xs text-stone-650 font-sans mt-0.5">Visão paralela de gargalos operacionais e do plano gerencial realista</p>
          </div>
          
          <div className="h-[230px] w-full mt-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#141414" />
                <XAxis dataKey="name" stroke="#121212" tick={{ fontSize: 10, fontFamily: "monospace", fontWeight: "bold" }} />
                <YAxis stroke="#121212" tick={{ fontSize: 10, fontFamily: "monospace", fontWeight: "bold" }} />
                <Tooltip
                  cursor={{ fill: "rgba(20, 20, 20, 0.05)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataInfo = payload[0].payload;
                      return (
                        <div className="bg-white border-2 border-[#141414] p-2.5 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] text-[#141414]">
                          <p className="text-xs font-mono font-black">{dataInfo.name}</p>
                          <p className="text-xs font-mono text-blue-700 font-extrabold mt-0.5">
                            {dataInfo.valor.toFixed(1)} t/mês
                          </p>
                          <p className="text-[10px] text-stone-500 font-sans mt-0.5 leading-snug">{dataInfo.descricao}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="valor" maxBarSize={45}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="#141414" strokeWidth={2} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-around border-t-2 border-[#141414] pt-4 mt-2 text-center text-xs font-mono text-[#141414]">
            <div>
              <span className="block text-[9px] text-stone-500 font-bold uppercase font-mono">Eficiência Total</span>
              <strong className="text-sm font-black">
                {result.capacityTheoretical > 0 ? (result.capacityRealisticPMP / result.capacityTheoretical * 100).toFixed(1) : 0}%
              </strong>
            </div>
            <div>
              <span className="block text-[9px] text-stone-500 font-bold uppercase font-mono">Custo Unitário Conversão</span>
              <strong className="text-sm font-black">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(unitCostConversion)} / t
              </strong>
            </div>
            <div>
              <span className="block text-[9px] text-stone-500 font-bold uppercase font-mono">Velocidade Média</span>
              <strong className="text-sm font-black">{result.weightedSpeedTph.toFixed(3)} t/h</strong>
            </div>
          </div>
        </div>

        {/* Bottleneck Sidebar */}
        <div className="bg-white border-2 border-[#141414] p-5 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] lg:col-span-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs uppercase font-mono font-black text-black tracking-wider">
                Auditoria de Capacidade
              </h3>
              <p className="text-xs text-stone-600 font-sans mt-0.5">Mapeador crítico instantâneo de conformidade</p>
            </div>

            {/* Check progress towards average demand */}
            <div className="p-3.5 bg-[#E4E3E0]/20 border-2 border-dashed border-[#141414] space-y-3">
              <span className="text-[9px] uppercase font-mono font-black text-black block pb-1 border-b border-[#141414]/25">
                Demanda Média t/mês
              </span>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-stone-600">Planejado (S&OP):</span>
                <span className="text-black font-black">{(parameters.demanda.A01 / 12).toFixed(1)} t</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-stone-600">Realizável (PMP):</span>
                <span className="text-black font-black">{result.capacityRealisticPMP.toFixed(1)} t</span>
              </div>

              {result.capacityRealisticPMP >= (parameters.demanda.A01 / 12) ? (
                <div className="flex items-start gap-2 text-emerald-800 bg-emerald-50 border border-emerald-600 p-2 text-[10px] font-mono uppercase font-black leading-tight">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Capacidade suficiente para a demanda de S&OP!</span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-red-800 bg-red-50 border border-red-650 p-2 text-[10px] font-mono uppercase font-black leading-tight">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Déficit de capacidade de {((parameters.demanda.A01 / 12) - result.capacityRealisticPMP).toFixed(1)} t/mês.</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t-2 border-dashed border-[#141414] pt-4 mt-6">
            <span className="text-[9px] uppercase font-mono font-bold block text-stone-500 mb-1">Gargalo de Redução OEE</span>
            <p className="text-[11px] text-stone-750 font-sans leading-normal">
              O OEE bruto de <strong>{result.oeeBase}%</strong> foi reajustado para <strong>{result.oeeAdjusted.toFixed(1)}%</strong> devido ao déficit operacional humano.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
