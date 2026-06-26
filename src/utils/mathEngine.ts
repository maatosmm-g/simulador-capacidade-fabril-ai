import { SimulationParameters, SimulationResult, SkuOutput, MonthlySimulation } from "../types";

export interface RealProductInfo {
  skuCode: string;
  size: string;
  commercialNames: string[];
  referencePrices: { product: string; price: number; store: string }[];
  compositionInfo: string;
}

export const ULTRACLOR_PRODUCTS_DB: RealProductInfo[] = [
  {
    skuCode: "SKU 1 kg",
    size: "1 kg / 1 L",
    commercialNames: ["Pastilha de Cloro Ultraclor (200g)", "Algicida de Choque Ultraclor (1 L)", "Algicida de Manutenção Ultraclor (1 L)", "Ultra Decantador Ultraclor (1 L)"],
    compositionInfo: "Embalagens plásticas de 1 litro ou potes de pastilhas de 1 kg.",
    referencePrices: [
      { product: "Algicida Choque Ultraclor 1L", price: 25.90, store: "Paraíso das Bombas" },
      { product: "Algicida Manutenção Ultraclor 1L", price: 25.90, store: "Paraíso das Bombas" },
      { product: "Ultra Decantador Ultraclor 1L", price: 25.90, store: "Paraíso das Bombas" },
      { product: "Pastilha de Cloro Ultraclor 200g", price: 6.99, store: "Acqua Ilha Piscinas" }
    ]
  },
  {
    skuCode: "SKU 2,5 kg",
    size: "2 kg a 5 kg",
    commercialNames: ["Carbonato de Sódio Ultraclor (2 kg)", "Sulfato de Alumínio Ultraclor (5 kg)"],
    compositionInfo: "Produtos em pó (sacos ou potes reforçados) de 2 kg e 5 kg, ponderados como 2.5 kg operacionais.",
    referencePrices: [
      { product: "Carbonato de Sódio Ultraclor 2kg (pH+)", price: 31.90, store: "Paraíso das Bombas" },
      { product: "Sulfato de Alumínio Ultraclor 5kg", price: 45.90, store: "Paraíso das Bombas" }
    ]
  },
  {
    skuCode: "SKU 10 kg",
    size: "10 kg",
    commercialNames: ["Cloro Fácil 3 em 1 Ultraclor (10 kg)", "Cloro Multiação 6 em 1 Ultraclor (10 kg)", "Cloro Premium Ultraclor (10 kg)"],
    compositionInfo: "Flagships de Cloro Ativo Ultraclor em baldes selados de 10 kg.",
    referencePrices: [
      { product: "Cloro Fácil 3 em 1 Ultraclor 10kg", price: 159.90, store: "Paraíso das Bombas" },
      { product: "Cloro Multiação 6 em 1 Ultraclor 10kg", price: 290.00, store: "Paraíso das Bombas" },
      { product: "Cloro Premium Ultraclor 10kg", price: 319.00, store: "Paraíso das Bombas" }
    ]
  },
  {
    skuCode: "SKU 50 kg",
    size: "50 kg",
    commercialNames: ["Cloro Concentrado Ativo Industrial (Tambor 50 kg)", "Hipoclorito de Cálcio Coletivo (Saco 50 kg)"],
    compositionInfo: "Tambores ou sacos de segurança industriais de 50 kg para tratamento de grandes volumes.",
    referencePrices: [
      { product: "Hipoclorito de Cálcio Ultraclor 50kg (Ref. Atacado)", price: 1250.00, store: "Distribuição Direta Fábrica" }
    ]
  }
];

export const DEFAULT_PARAMETERS: SimulationParameters = {
  demanda: {
    A01: 4500, // Demanda anual total (t/ano)
    sazonalidade: [12, 8, 5, 5, 5, 5, 7, 8, 12, 12, 12, 12], // Janeiro a Dezembro (%)
    A14: 35, // SKU 1 kg (%)
    A15: 30, // SKU 2,5 kg (%)
    A16: 25, // SKU 10 kg (%)
    A17: 10, // SKU 50 kg (%)
    A18: 95, // Nível de serviço desejado (%)
    A19: 1.5, // Estoque segurança pré-pico (meses)
    A20: 0.7, // Estoque segurança pós-pico (meses)
  },
  producao: {
    B01: 1, // Número de linhas
    B02: 2, // Turnos por dia
    B03: 8, // Horas por turno
    B04: 22, // Dias úteis por mês
    B05: 0.5, // Tempo sobreposição entre turnos (horas)
    B06: 5, // Dias de operação no 3º turno/semana
    B07: 0, // Horas extras padrão programadas por dia (horas) (default 0, max 2)
    B08: 65, // OEE base (%)
    B09: -5, // Penalidade turno noturno (pp)
    B10: -10, // Penalidade hora extra (pp)
    B11: 2.0, // Perda total por refugo/retrabalho (%)
    B11_filtracao: 1.0, // Perda na Filtração (%)
    B11_transferencia: 0.6, // Perda no Armazenamento e Transferência (%)
    B11_qualidade: 0.4, // Perda no Controle de Qualidade (%)
    B12: 45, // Setup médio entre SKUs (minutos)
    B13: 90, // Setup entre famílias (minutos)
    B14: 120, // Tempo limpeza profunda (50kg -> 1kg) (minutos)
    B15: 4, // Campanhas/mês por SKU
  },
  velocidades: {
    C01: 13, // SKU 1 kg (base)
    C02: 10, // SKU 2,5 kg (base)
    C03: 4.5, // SKU 10 kg (base)
    C04: 1.0, // SKU 50 kg (base)
  },
  operadores: {
    // D.1 tempos padrão
    D01: 15.0, // Abastecimento 1kg (min/ciclo)
    D02: 12.0, // Abastecimento 2.5kg (min/ciclo)
    D03: 10.0, // Abastecimento 10kg (min/ciclo)
    D04: 8.0,  // Abastecimento 50kg (min/ciclo)
    D05: 45,   // Duração ciclo 1kg (min)
    D06: 45,   // Duração ciclo 2.5kg (min)
    D07: 60,   // Duração ciclo 10kg (min)
    D08: 120,  // Duração ciclo 50kg (min)
    D09: 3.0,  // Tempo troca bobina (min)
    D10: 500,  // Bobina 1kg (un)
    D11: 300,  // Bobina 2.5kg (un)
    D12: 150,  // Bobina 10kg (un)
    D13: 50,   // Pacote 50kg (un)
    D14: 0.5,  // Paletização 1kg (minutos/unidade de palletização - interpretado como minutos por palete ou minutos por embalagem)
    D15: 0.6,  // Paletização 2.5kg
    D16: 0.8,  // Paletização 10kg
    D17: 2.0,  // Paletização 50kg
    D18: 80,   // Embalagens por pallet 1kg
    D19: 45,   // Embalagens por pallet 2.5kg
    D20: 20,   // Embalagens por pallet 10kg
    D21: 10,   // Embalagens por pallet 50kg
    D22: 2.0,  // CQ Inspeção (min/ciclo)
    D23: 30,   // Frequência CQ (min)
    D24: 25.0, // Setup participação operador (min)
    D25: 15.0, // Limpeza entre SKUs (min)
    D26: 10.0, // Passagem de turno (min/turno)

    // D.2 fatores humanos
    D27: 5,   // Fator fadiga (%)
    D28: 85,  // Disponibilidade operador (%)
    D29: 90,  // Ritmo (%)
    D30: 15,  // Máximo operadores / linha
    D31: 1,   // Mínimo absoluto
    D32: 0,   // Polivalentes
    D33: true,// Exige operador dedicado 50kg
    D34: 15,  // Impacto OEE operador faltante (% por 1.0 op, ou 1.5% por 0.1)
    D35: 8,   // Impacto OEE operador excedente (% por 1.0 op, ou 0.8% por 0.1)

    // D.3 custos
    D36: 2800, // Salário médio (R$/mês)
    D37: 70,   // Encargos (%)
    D38: 50,   // HE (%)
    D39: 20,   // Noturno (%)
    roleMapEnabled: true,
    qaSetupExtra: false,
  },
  suprimentos: {
    E01: 25,  // Capacidade formulação (t/dia)
    E02: 24,  // Liberação CQ (horas)
    E03: 1000, // Armazenagem total (t)
    E04: 2.0,  // Expedição carregamento/dia
    E05: 25.0, // Peso por carregamento (t)
    E06: 22,   // Dias úteis de expedição
    E07: 15,   // Lead time MP (dias)
    E08: 10,   // Lead time embalagens (dias)
    E09: 15,   // Estoque mínimo embalagens (dias)
  },
};

export function calculateSimulation(
  params: SimulationParameters,
  paletizaçãoTratamento: "pallet" | "package" = "pallet"
): SimulationResult {
  const { demanda, producao, velocidades, operadores, suprimentos } = params;

  // PASS 1: Available hours in month
  // Normal shifts
  let bruteHours = producao.B01 * producao.B02 * producao.B03 * producao.B04;
  
  // Overtime hours
  let overtimeHours = 0;
  if (producao.B07 > 0) {
    overtimeHours = producao.B01 * producao.B04 * Math.min(2, producao.B07);
    bruteHours += overtimeHours;
  }

  // overlapping turns
  let overlapHours = 0;
  if (producao.B02 > 1 && producao.B05 > 0) {
    // overlapping happens between shifts: 2 shifts = 1 overlap, 3 shifts = 2 overlaps, etc.
    overlapHours = producao.B01 * (producao.B02 - 1) * producao.B05 * producao.B04;
  }

  // Setup / Campaign lost hours calculation (SMED & Paradas)
  const totalCampaigns = producao.B15 * 4; // 4 SKUs
  const setupMins = totalCampaigns * producao.B12; // Standard setups (B12 minutes)
  const cleaningMins = producao.B15 * producao.B14; // Deep cleanings (B14 minutes)
  const transitionMins = producao.B04 * producao.B02 * (operadores.D26 ?? 10); // Passagem de turno (D26 minutes/shift)
  const preparationMins = totalCampaigns * (operadores.D24 ?? 25); // Preparação de equipamentos (D24 minutes)
  const skuCleaningMins = totalCampaigns * (operadores.D25 ?? 15); // Limpeza entre SKUs (D25 minutes)
  
  // Total setup, cleaning and transition lost hours
  const setupLostHours = (setupMins + cleaningMins + transitionMins + preparationMins + skuCleaningMins) / 60;

  // Net production hours
  const netHours = Math.max(0, bruteHours - overlapHours - setupLostHours);

  // PASS 2: Sku-by-Sku output and workload
  const skus = [
    { name: "SKU 1 kg", mix: demanda.A14, weight: 1.0, speed: velocidades.C01, abastTime: operadores.D01, abastCycle: operadores.D05, bobinaQty: operadores.D10, palletTime: operadores.D14, palletQty: operadores.D18 },
    { name: "SKU 2,5 kg", mix: demanda.A15, weight: 2.5, speed: velocidades.C02, abastTime: operadores.D02, abastCycle: operadores.D06, bobinaQty: operadores.D11, palletTime: operadores.D15, palletQty: operadores.D19 },
    { name: "SKU 10 kg", mix: demanda.A16, weight: 10.0, speed: velocidades.C03, abastTime: operadores.D03, abastCycle: operadores.D07, bobinaQty: operadores.D12, palletTime: operadores.D16, palletQty: operadores.D20 },
    { name: "SKU 50 kg", mix: demanda.A17, weight: 50.0, speed: velocidades.C04, abastTime: operadores.D04, abastCycle: operadores.D08, bobinaQty: operadores.D13, palletTime: operadores.D17, palletQty: operadores.D21 },
  ];

  // For 1 Ton (1000 kg) of S&OP average mix:
  let totalTimeFor1TonMin = 0;
  const skuMinutesFor1Ton: number[] = [];

  const skuOutputs: SkuOutput[] = skus.map((sku) => {
    const mixPercent = sku.mix;
    const kgShare = (mixPercent / 100) * 1000; // kg of this SKU inside 1 ton of mix
    const unitsShare = kgShare / sku.weight; // units of this SKU in 1 ton
    const speedPkgMin = sku.speed;
    const runtimeMinFor1Ton = speedPkgMin > 0 ? unitsShare / speedPkgMin : 0;
    
    totalTimeFor1TonMin += runtimeMinFor1Ton;
    skuMinutesFor1Ton.push(runtimeMinFor1Ton);

    // Operator workload components per machine-minute:
    // 1) Abastecimento: D_time / D_cycle
    const wlAbast = sku.abastTime / sku.abastCycle;
    
    // 2) Troca Bobina/Pct: D09 / D_bobinaQty * speedPkgMin
    const wlBobina = (operadores.D09 / sku.bobinaQty) * speedPkgMin;
    
    // 3) CQ: D22 / D23
    const wlCQ = operadores.D22 / operadores.D23;
    
    // 4) Paletização:
    // If interpreted as minutes per pallet, we divide by items per pallet. If per package, we multiply directly.
    let wlPalet = 0;
    if (paletizaçãoTratamento === "pallet") {
      wlPalet = (sku.palletTime / sku.palletQty) * speedPkgMin;
    } else {
      wlPalet = sku.palletTime * speedPkgMin;
    }

    const totalCycleWorkload = wlAbast + wlBobina + wlCQ + wlPalet;

    // Apply human factors: Fatigue (D27), Availability (D28), Rhythm (D29)
    // Fatigue is extra work
    const fatigueMultiplier = 1 + (operadores.D27 / 100);
    const availabilityRate = (operadores.D28 / 100);
    const rhythmRate = (operadores.D29 / 100);

    let requiredOp = 0;
    if (availabilityRate > 0 && rhythmRate > 0) {
      requiredOp = (totalCycleWorkload * fatigueMultiplier) / (availabilityRate * rhythmRate);
    }

    // Constraints: SKU 50kg dedicated operator
    if (sku.name === "SKU 50 kg" && operadores.D33) {
      requiredOp = Math.max(requiredOp, 1.0);
    }

    // Clamp by line limits
    requiredOp = Math.max(operadores.D31, Math.min(operadores.D30, requiredOp));

    // Tonnes per hour direct production rate (theoretical)
    const tonnesPerHour = speedPkgMin > 0 ? (speedPkgMin * sku.weight * 60) / 1000 : 0;

    return {
      sku: sku.name,
      mixPercent,
      weightPerPkg: sku.weight,
      speedPkgMin,
      tonnesPerHour,
      workloadAbast: wlAbast,
      workloadBobina: wlBobina,
      workloadCQ: wlCQ,
      workloadPalet: wlPalet,
      totalCycleWorkload,
      operatorsCalculated: requiredOp,
      tonnesProduced: 0, // calculated below based on mix
      unitsProduced: 0,
      palletQty: 0,
    };
  });

  // Weighted speed in tph
  const weightedSpeedTph = totalTimeFor1TonMin > 0 ? 60 / totalTimeFor1TonMin : 0;

  // Weighted Operators required by machine running time
  let weightedOperatorsSum = 0;
  let totalWeightTime = 0;
  skus.forEach((sku, idx) => {
    const runtime = skuMinutesFor1Ton[idx];
    weightedOperatorsSum += skuOutputs[idx].operatorsCalculated * runtime;
    totalWeightTime += runtime;
  });

  const operatorsCalculatedWeighted = totalWeightTime > 0 ? (weightedOperatorsSum / totalWeightTime) : 1.0;
  
  // Allocating operators (always integer to serve as employees count)
  let allocatedOps = Math.ceil(operatorsCalculatedWeighted);
  let roleMap = undefined;
  if (operadores.roleMapEnabled !== false) {
    const isNine = operadores.qaSetupExtra === true;
    allocatedOps = isNine ? 9 : 8;
    roleMap = {
      pesagem: 1,
      formulacao: 1,
      transferencia: 1,
      envase: 2,
      paletizacao: 1,
      expedicao: 1,
      lider: 1,
      reforcoQA: isNine ? 1 : 0,
      total: allocatedOps,
    };
  } else {
    allocatedOps = Math.max(operadores.D31, Math.min(operadores.D30, allocatedOps));
  }

  // Operator Surplus/Deficit
  const surplusDeficit = allocatedOps - operatorsCalculatedWeighted;

  // PASS 3: OEE Adjustments
  // Loss calculation for Quality (Yield)
  const lossFiltracao = (producao.B11_filtracao ?? 1.0) / 100;
  const lossTransferencia = (producao.B11_transferencia ?? 0.6) / 100;
  const lossQualidade = (producao.B11_qualidade ?? 0.4) / 100;
  
  const overallYield = (1 - lossFiltracao) * (1 - lossTransferencia) * (1 - lossQualidade);
  const computedB11 = (1 - overallYield) * 100;
  
  // 1. Availability (%) = productive net hours / brute hours available
  const availabilityPercent = bruteHours > 0 ? (netHours / bruteHours) * 100 : 0;

  // 2. Performance (%) = driven by machine capability (producao.B08) and human modifiers
  let performanceBase = producao.B08; // Base rate
  
  // Night shift penalty- proportional to shifts
  if (producao.B02 >= 3 && producao.B09 !== 0) {
    performanceBase += (producao.B09 / 3);
  }

  // Overtime penalty
  if (overtimeHours > 0 && producao.B10 !== 0) {
    const overtimeWeight = overtimeHours / bruteHours;
    performanceBase += (producao.B10 * overtimeWeight);
  }

  // Operator count impact on speed and rhythm
  if (surplusDeficit > 0) {
    performanceBase += surplusDeficit * operadores.D35;
  } else if (surplusDeficit < 0) {
    performanceBase += surplusDeficit * operadores.D34; // negative contribution
  }
  const performancePercent = Math.max(0, Math.min(100, performanceBase));

  // 3. Quality (%) = overall chemical-operational yield
  const qualityPercent = overallYield * 100;

  // Consolidated OEE = Availability * Performance * Quality
  const oeeAdjusted = (availabilityPercent / 100) * (performancePercent / 100) * (qualityPercent / 100) * 100;

  // Capacities
  const capacityTheoretical = weightedSpeedTph * bruteHours;
  const capacityEffective = weightedSpeedTph * netHours * (producao.B08 / 100);
  
  const wasteLossFactor = overallYield;
  // Realistic PMP matches the exact capacity driven by the consolidated OEE
  const capacityRealisticPMP = capacityTheoretical * (Math.max(0, Math.min(100, oeeAdjusted)) / 100);

  // Populate actual production quantities per SKU based on demand mix of PMP
  skuOutputs.forEach((skuOut) => {
    const tonnes = (skuOut.mixPercent / 100) * capacityRealisticPMP;
    const units = (tonnes * 1000) / skuOut.weightPerPkg;
    const palletRecord = skus.find(s => s.name === skuOut.sku);
    const palletUnits = palletRecord ? Math.ceil(units / palletRecord.palletQty) : 0;
    
    skuOut.tonnesProduced = tonnes;
    skuOut.unitsProduced = units;
    skuOut.palletQty = palletUnits;
  });

  // Handover additional cost
  // Let's compute Costs (D.3):
  // Monthly shift hours
  const totalOpCount = allocatedOps;
  const baseSalary = operadores.D36;
  const encargosFactor = 1 + (operadores.D37 / 100);
  const costSalaries = totalOpCount * baseSalary;
  const costEncargos = costSalaries * (operadores.D37 / 100);

  // Overtime and Night premium computation
  let costAdicionais = 0;
  // Overtime premium
  if (overtimeHours > 0) {
    // hourly wage estimate: Salary * (1 + charges) / 176h (average 22 days * 8h)
    const hourlyWage = (baseSalary / (producao.B04 * producao.B03));
    const hourlyOvertimeRate = hourlyWage * encargosFactor * (1 + (operadores.D38 / 100));
    costAdicionais += totalOpCount * overtimeHours * hourlyOvertimeRate;
  }

  // Night shift premium (if B02 >= 3, 1 shift is night)
  if (producao.B02 >= 3) {
    const nightHours = (bruteHours / 3);
    const hourlyWage = (baseSalary / (producao.B04 * producao.B03));
    const nightShiftPremiumRate = hourlyWage * encargosFactor * (operadores.D39 / 100);
    costAdicionais += totalOpCount * nightHours * nightShiftPremiumRate;
  }

  const costTotalMaoDeObra = (costSalaries + costEncargos) + costAdicionais;

  // Logistical bottlenecks check
  const formulationCapacityMonth = suprimentos.E01 * producao.B04; // t/day * days/month
  const expeditionCapacityMonth = (suprimentos.E04 * suprimentos.E05) * suprimentos.E06; // loadings/day * weight/loading * days/month
  const storageCapacityT = suprimentos.E03;

  const secondaryBottlenecks: string[] = [];
  let primaryBottleneck = "Nenhum — Carga balanceada dentro dos limites de suprimentos e linha";

  // Check which limits are breached by PMP
  if (capacityRealisticPMP > formulationCapacityMonth) {
    secondaryBottlenecks.push(`Capacidade de Formulação: Programa exige ${capacityRealisticPMP.toFixed(1)} t/mês, limite é ${formulationCapacityMonth.toFixed(1)} t/mês (⚠️ Sobrecarga de ${(capacityRealisticPMP / formulationCapacityMonth * 100 - 100).toFixed(0)}%)`);
  }
  if (capacityRealisticPMP > expeditionCapacityMonth) {
    secondaryBottlenecks.push(`Capacidade de Expedição: Programa exige ${capacityRealisticPMP.toFixed(1)} t/mês, limite é ${expeditionCapacityMonth.toFixed(1)} t/mês (⚠️ Sobrecarga de ${(capacityRealisticPMP / expeditionCapacityMonth * 100 - 100).toFixed(0)}%)`);
  }

  if (secondaryBottlenecks.length > 0) {
    primaryBottleneck = "⚠️ Gargalo Logístico de Suprimentos: " + secondaryBottlenecks[0].split(":")[0];
  } else if (demanda.A01 / 12 > capacityRealisticPMP) {
    primaryBottleneck = "🛑 Gargalo Físico da Linha de Embalagem: Capacidade da linha é menor que a demanda média exigida!";
  }

  return {
    hoursAvailableBrute: bruteHours,
    hoursOverlapLost: overlapHours,
    hoursSetupLost: setupLostHours,
    hoursNetProd: netHours,
    skuData: skuOutputs,
    operatorsCalculatedWeighted,
    operatorsAllocated: allocatedOps,
    operatorSurplusDeficit: surplusDeficit,
    operatorRoleMap: roleMap,
    oeeBase: producao.B08,
    oeeAdjusted,
    oeeAvailability: availabilityPercent,
    oeePerformance: performancePercent,
    oeeQuality: qualityPercent,
    weightedSpeedTph,
    capacityTheoretical,
    capacityEffective,
    capacityRealisticPMP,
    costSalaries,
    costEncargos,
    costAdicionais,
    costTotalMaoDeObra,
    formulationCapacityMonth,
    expeditionCapacityMonth,
    storageCapacityT,
    primaryBottleneck,
    secondaryBottlenecks,
  };
}

export function runMonthlyContinuousSimulation(
  params: SimulationParameters,
  initialStock: number = 200,
  paletizaçãoTratamento: "pallet" | "package" = "pallet",
  precoPorTon: number = 13540
): MonthlySimulation[] {
  const annualDemand = params.demanda.A01;
  const seasonality = params.demanda.sazonalidade; // 12 months %
  const results: MonthlySimulation[] = [];

  let currentStock = initialStock;
  const standardMonthSimulation = calculateSimulation(params, paletizaçãoTratamento);
  const monthlyCapacityRealistic = standardMonthSimulation.capacityRealisticPMP;
  const safetyStockMonthsPre = params.demanda.A19; // pré-pico stock
  const safetyStockMonthsPost = params.demanda.A20; // pós-pico

  // Quality yield factor (rendimento global)
  const lossFiltracao = (params.producao.B11_filtracao ?? 1.0) / 100;
  const lossTransferencia = (params.producao.B11_transferencia ?? 0.6) / 100;
  const lossQualidade = (params.producao.B11_qualidade ?? 0.4) / 100;
  const overallYield = (1 - lossFiltracao) * (1 - lossTransferencia) * (1 - lossQualidade);

  // Setup lost hours and brute hours
  const bruteHours = standardMonthSimulation.hoursAvailableBrute;
  const setupLostHours = standardMonthSimulation.hoursSetupLost;

  let accumulatedBacklogT = 0; // carried forward unmet demand

  for (let m = 0; m < 12; m++) {
    const monthName = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][m];
    
    // Base demand of this month
    const baseDemandT = (seasonality[m] / 100) * annualDemand;
    
    // Total planned demand for this month includes standard demand + accumulated backlog from previous month
    const demandT = baseDemandT + accumulatedBacklogT;

    // Safety Stock targeting for next month
    const nextMonthDemand = (seasonality[(m + 1) % 12] / 100) * annualDemand;
    const isNextMonthPeak = (m + 1) >= 8 || m === 0; 
    const targetSafetyCoverage = isNextMonthPeak ? safetyStockMonthsPre : safetyStockMonthsPost;
    const targetEndingStock = nextMonthDemand * targetSafetyCoverage;

    // Ideal production to satisfy this month's demand and end with the safety stock target
    let idealProduction = targetEndingStock + demandT - currentStock;
    idealProduction = Math.max(0, idealProduction);

    // Realistic production is capped by the maximum capacity of the configured shifts
    const rawPlannedProduction = Math.min(monthlyCapacityRealistic, idealProduction);
    
    // Check if formulation or expedition limits restrict this further
    const formulationLimit = params.suprimentos.E01 * params.producao.B04;
    const actualPlannedProduction = Math.min(rawPlannedProduction, formulationLimit);

    // Conforming stock available this month after production
    const totalConformingAvailable = currentStock + actualPlannedProduction;
    
    let endingStock = 0;
    let rupturaT = 0;
    let stockoutWarning = false;

    if (totalConformingAvailable >= demandT) {
      endingStock = totalConformingAvailable - demandT;
      rupturaT = 0;
      accumulatedBacklogT = 0; // backlog fully cleared
    } else {
      endingStock = 0;
      rupturaT = demandT - totalConformingAvailable;
      stockoutWarning = true;
      // 100% of the unmet demand becomes backlog to be carried over to the next month
      accumulatedBacklogT = rupturaT;
    }

    // Days of coverage
    const nextMonthDailyDemand = nextMonthDemand / 30;
    const daysCoverage = nextMonthDailyDemand > 0 ? (endingStock / nextMonthDailyDemand) : 999;

    // Check alerts
    let overloadWarning = false;
    let alertMsg = "";

    if (stockoutWarning) {
      alertMsg = `⚠️ RUPTURA DE ESTOQUE: Falta de ${rupturaT.toFixed(0)} t para atender nível de serviço (Demanda Planejada: ${demandT.toFixed(0)}t, Disp: ${totalConformingAvailable.toFixed(0)}t).`;
    } else if (endingStock > params.suprimentos.E03) {
      overloadWarning = true;
      alertMsg = `⚠️ EXCESSO DE ESTOQUE: Armazenamento ocupado em ${endingStock.toFixed(0)}t ultrapassando limite de ${params.suprimentos.E03}t!`;
    }

    if (idealProduction > monthlyCapacityRealistic && !stockoutWarning) {
      alertMsg += ` ⚡ Alerta: Linha operando no limite máximo de capacidade (${(actualPlannedProduction / monthlyCapacityRealistic * 100).toFixed(0)}% de uso).`;
    }

    // FINANCIAL CASCADE FOR THIS MONTH
    const faturamentoBruto = actualPlannedProduction * precoPorTon;

    // Consumo de Matéria-Prima: consequences of operational yield
    const tonnesMPConsumed = actualPlannedProduction / overallYield;
    // Standard RM represents 48% under 98% standard yield
    const custoPorTonMP = precoPorTon * 0.48 * 0.98;
    
    // Productive raw material cost (without scrap)
    const custoInsumosMP = actualPlannedProduction * custoPorTonMP;

    // Consumo de Energia Elétrica: penalty from low OEE, high setups, and high scrap
    const oeeAdjustedValue = Math.max(1, Math.min(100, standardMonthSimulation.oeeAdjusted));
    const custoEspecificoEnergia = 120 * (65 / oeeAdjustedValue) + 
                                   (setupLostHours / Math.max(1, bruteHours)) * 350 + 
                                   (1 - overallYield) * 250;
    const custoEnergia = actualPlannedProduction * custoEspecificoEnergia;

    // Labor cost for this month
    const custoMaoDeObra = standardMonthSimulation.costTotalMaoDeObra;

    // Monetized setups & ociosidade
    const perdaSetupOciosidade = setupLostHours * 450;

    // Material losses: scrapped materials cost (wasted portion of raw material)
    const tonnesScrapped = tonnesMPConsumed - actualPlannedProduction;
    const perdaRefugo = tonnesScrapped * custoPorTonMP;

    // Commercial quality penalties (devolutions, discounts, complains) if yield is below 98%
    let custoQualidadeComercial = 0;
    const yieldPercent = overallYield * 100;
    if (yieldPercent < 98) {
      const yieldDeficit = 98 - yieldPercent;
      custoQualidadeComercial = actualPlannedProduction * (yieldDeficit * 0.015) * precoPorTon;
    }

    // Stockout penalty fine
    const multaRuptura = rupturaT * 500;

    // EBITDA Marginal
    const ebitdaMarginal = faturamentoBruto - (custoInsumosMP + custoMaoDeObra + custoEnergia + perdaSetupOciosidade + perdaRefugo + custoQualidadeComercial + multaRuptura);

    results.push({
      monthName,
      monthIndex: m,
      seasonalityPercent: seasonality[m],
      demandT,
      plannedProdT: actualPlannedProduction,
      endingStockT: endingStock,
      daysCoverage,
      operatorsNeeded: standardMonthSimulation.operatorsAllocated,
      oee: standardMonthSimulation.oeeAdjusted,
      stockoutWarning,
      overloadWarning,
      alertMsg: alertMsg.trim(),
      backlogT: accumulatedBacklogT,
      rupturaT,
      oeeAvailability: standardMonthSimulation.oeeAvailability ?? 91,
      oeePerformance: standardMonthSimulation.oeePerformance ?? 65,
      oeeQuality: standardMonthSimulation.oeeQuality ?? 98,
      custoInsumosMP,
      custoMaoDeObra,
      custoEnergia,
      perdaSetupOciosidade,
      perdaRefugo,
      custoQualidadeComercial,
      multaRuptura,
      ebitdaMarginal,
      faturamentoBruto,
    });

    currentStock = endingStock; // carry-forward
  }

  return results;
}
