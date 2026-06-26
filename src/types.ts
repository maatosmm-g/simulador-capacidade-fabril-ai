export interface BlockADemanda {
  A01: number; // Demanda anual total (t/ano)
  sazonalidade: number[]; // % da anual para Jan-Dez (index 0-11)
  A14: number; // Mix SKU 1 kg (%)
  A15: number; // Mix SKU 2.5 kg (%)
  A16: number; // Mix SKU 10 kg (%)
  A17: number; // Mix SKU 50 kg (%)
  A18: number; // Nível de serviço desejado (%)
  A19: number; // Estoque segurança pré-pico (meses)
  A20: number; // Estoque segurança pós-pico (meses)
}

export interface BlockBProducao {
  B01: number; // Número de linhas
  B02: number; // Turnos por dia
  B03: number; // Horas por turno
  B04: number; // Dias úteis por mês
  B05: number; // Tempo sobreposição entre turnos (horas)
  B06: number; // Dias de operação no 3º turno/semana
  B07: number; // Horas extras máximas por dia (horas)
  B08: number; // OEE base de referência (%)
  B09: number; // Penalidade OEE por turno noturno (pp)
  B10: number; // Penalidade OEE por hora extra (pp)
  B11: number; // Perda total por refugo/retrabalho (%) - calculada a partir das frentes de perda
  B11_filtracao: number; // Perda na etapa de Filtração e retenção de resíduos (%)
  B11_transferencia: number; // Perda na etapa de Armazenamento e transferência de tanques (%)
  B11_qualidade: number; // Perda por Controle de Qualidade, ajustes e descartes (%)
  B12: number; // Setup médio entre SKUs (minutos)
  B13: number; // Setup entre famílias diferentes (minutos)
  B14: number; // Tempo limpeza profunda (50kg -> 1kg) (minutos)
  B15: number; // Número estimado de campanhas/mês por SKU
}

export interface BlockCVelocidades {
  C01: number; // Velocidade 1 kg (embalagens/min)
  C02: number; // Velocidade 2.5 kg (embalagens/min)
  C03: number; // Velocidade 10 kg (embalagens/min)
  C04: number; // Velocidade 50 kg (embalagens/min)
}

export interface BlockDOperadores {
  // D.1 tempos padrão
  D01: number; // Tempo padrão abastecimento SKU 1 kg (min/ciclo)
  D02: number; // Tempo padrão abastecimento SKU 2,5 kg (min/ciclo)
  D03: number; // Tempo padrão abastecimento SKU 10 kg (min/ciclo)
  D04: number; // Tempo padrão abastecimento SKU 50 kg (min/ciclo)
  D05: number; // Duração ciclo abastecimento SKU 1 kg (min)
  D06: number; // Duração ciclo abastecimento SKU 2.5 kg (min)
  D07: number; // Duração ciclo abastecimento SKU 10 kg (min)
  D08: number; // Duração ciclo abastecimento SKU 50 kg (min)
  D09: number; // Tempo bobina/troca (min)
  D10: number; // Embalagens/bobina 1kg
  D11: number; // Embalagens/bobina 2.5kg
  D12: number; // Embalagens/bobina 10kg
  D13: number; // Embalagens/pct 50kg
  D14: number; // Tempo paletização 1kg (min/embalagem)
  D15: number; // Tempo paletização 2.5kg (min/embalagem)
  D16: number; // Tempo paletização 10kg (min/embalagem)
  D17: number; // Tempo paletização 50kg (min/embalagem)
  D18: number; // Embalagens/pallet 1kg
  D19: number; // Embalagens/pallet 2.5kg
  D20: number; // Embalagens/pallet 10kg
  D21: number; // Embalagens/pallet 50kg
  D22: number; // Tempo inspeção CQ (min/ciclo)
  D23: number; // Frequência CQ (min)
  D24: number; // Tempo participação setup (min)
  D25: number; // Limpeza entre SKUs (min)
  D26: number; // Passagem de turno (min)
  
  // D.2 fatores humanos
  D27: number; // Fator fadiga (%)
  D28: number; // Disponibilidade (%)
  D29: number; // Ritmo vs máq (%)
  D30: number; // Máx operadores por linha
  D31: number; // Mín operadores por linha
  D32: number; // Operadores polivalentes
  D33: boolean; // Exige operador dedicado 50kg
  D34: number; // OEE impacto por operador faltante
  D35: number; // OEE impacto por operador excedente
  
  // D.3 custos
  D36: number; // Salário médio (R$)
  D37: number; // Encargos (%)
  D38: number; // Adicional HE (%)
  D39: number; // Adicional noturno (%)
  
  // Mapeamento fabril realista de postos (8 pessoas base ou 9 com reforço)
  roleMapEnabled?: boolean;
  qaSetupExtra?: boolean;
}

export interface BlockESuprimentos {
  E01: number; // Capacidade formulação (t/dia)
  E02: number; // Tempo liberação CQ (horas)
  E03: number; // Capacidade armazenagem (t)
  E04: number; // Carregamentos por dia
  E05: number; // Capacidade por carregamento (t)
  E06: number; // Dias de expedição/mês
  E07: number; // Lead time MP (dias)
  E08: number; // Lead time embalagem (dias)
  E09: number; // Estoque mínimo embalagens (dias)
}

export interface SimulationParameters {
  demanda: BlockADemanda;
  producao: BlockBProducao;
  velocidades: BlockCVelocidades;
  operadores: BlockDOperadores;
  suprimentos: BlockESuprimentos;
}

export interface SkuOutput {
  sku: string;
  mixPercent: number;
  weightPerPkg: number; // kg
  speedPkgMin: number;
  tonnesPerHour: number;
  
  workloadAbast: number; // operator-min/machine-min
  workloadBobina: number;
  workloadCQ: number;
  workloadPalet: number;
  totalCycleWorkload: number; // sum
  
  operatorsCalculated: number; // with D28, D29, D27
  tonnesProduced: number;
  unitsProduced: number;
  palletQty: number;
}

export interface SimulationResult {
  // Pass 1: Hours
  hoursAvailableBrute: number;
  hoursOverlapLost: number;
  hoursSetupLost: number;
  hoursNetProd: number;
  
  // Pass 2: Workload & Operators
  skuData: SkuOutput[];
  operatorsCalculatedWeighted: number;
  operatorsAllocated: number; // rounded based on constraints
  operatorSurplusDeficit: number;
  operatorRoleMap?: {
    pesagem: number;
    formulacao: number;
    transferencia: number;
    envase: number;
    paletizacao: number;
    expedicao: number;
    lider: number;
    reforcoQA: number;
    total: number;
  };
  
  // Pass 3: OEE and Capacity
  oeeBase: number;
  oeeAdjusted: number;
  oeeAvailability?: number;
  oeePerformance?: number;
  oeeQuality?: number;
  weightedSpeedTph: number;
  
  capacityTheoretical: number; // t/month
  capacityEffective: number; // t/month
  capacityRealisticPMP: number; // t/month (taking into account OEE, waste, setup)
  
  // Costs
  costSalaries: number;
  costEncargos: number;
  costAdicionais: number;
  costTotalMaoDeObra: number;
  
  // Supply Chain Constraints
  formulationCapacityMonth: number; // t/month
  expeditionCapacityMonth: number; // t/month
  storageCapacityT: number;
  primaryBottleneck: string;
  secondaryBottlenecks: string[];
}

export interface ScenarioComparison {
  name: string;
  parameters: SimulationParameters;
  result: SimulationResult;
}

export interface MonthlySimulation {
  monthName: string;
  monthIndex: number; // 0-11
  seasonalityPercent: number;
  demandT: number;
  plannedProdT: number;
  endingStockT: number;
  daysCoverage: number;
  operatorsNeeded: number;
  oee: number;
  stockoutWarning: boolean;
  overloadWarning: boolean;
  alertMsg?: string;
  // Dynamic operational & financial cascading fields
  backlogT?: number;
  rupturaT?: number;
  oeeAvailability?: number;
  oeePerformance?: number;
  oeeQuality?: number;
  custoInsumosMP?: number;
  custoMaoDeObra?: number;
  custoEnergia?: number;
  perdaSetupOciosidade?: number;
  perdaRefugo?: number;
  custoQualidadeComercial?: number;
  multaRuptura?: number;
  ebitdaMarginal?: number;
  faturamentoBruto?: number;
}

export interface DailyClosingMetrics {
  tempoTotalOcupado: number;
  tempoRestanteBuffer: number;
  capacidadeDisponivel: number;
  oeeEstimado: number;
  eficienciaGlobal: number;
  indiceRefugo: number;
  perdaEvaporativa: number;
  totalEntradaMP: number;
  conformeAjustado: number;
  perdaOperacionalTotal: number;
  perdaOcultaDiferenca: number;
  refugoDeclarado?: number;
  residuosDecantacao?: number;
  tempoZerar?: number;
  tempoLimpeza?: number;
  tempoSetups?: number;
  tempoPreparacao?: number;
}

export interface ModeShiftSizingProps {
  parameters: SimulationParameters;
  paletizaçãoTratamento: "pallet" | "package";
  dailyClosingMetrics?: DailyClosingMetrics;
  useIntegratedMetrics?: boolean;
  onMetricsUpdate?: (metrics: DailyClosingMetrics) => void;
}
