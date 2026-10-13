// Dados clínicos em memória. Usuários e credenciais moram no SQLite
// (compartilhado/banco.ts) desde o capítulo 4.
export type Papel = "admin" | "profissional" | "recepcao";

export interface Paciente { id: string; nome: string; cns: string; nascimento: string }
export interface Atendimento {
  id: string; pacienteId: string; profissionalId: string;
  motivo: string; status: "aberto" | "finalizado";
}
export interface Prescricao {
  id: string; atendimentoId: string; profissionalId: string;
  medicamento: string; posologia: string;
}

export const db = {
  pacientes: [
    { id: "p1", nome: "Maria Souza", cns: "898001234567890", nascimento: "1958-03-14" },
    { id: "p2", nome: "João Lima", cns: "898009876543210", nascimento: "1990-11-02" },
  ] as Paciente[],
  atendimentos: [
    { id: "e1", pacienteId: "p1", profissionalId: "u2", motivo: "Dor torácica", status: "aberto" },
    { id: "e2", pacienteId: "p2", profissionalId: "u3", motivo: "Febre há 3 dias", status: "aberto" },
  ] as Atendimento[],
  prescricoes: [
    { id: "m1", atendimentoId: "e1", profissionalId: "u2", medicamento: "AAS 100 mg", posologia: "1x ao dia" },
    { id: "m2", atendimentoId: "e2", profissionalId: "u3", medicamento: "Dipirona 500 mg", posologia: "6/6h se febre" },
  ] as Prescricao[],
};

// Escala de plantões (capítulo 10): horário local, pode virar a meia-noite.
export interface Plantao { usuarioId: string; inicio: string; fim: string }
export const escala: Plantao[] = [
  { usuarioId: "u2", inicio: "07:00", fim: "19:00" },   // Ana, diurno
  { usuarioId: "u3", inicio: "19:00", fim: "07:00" },   // Bruno, noturno
  { usuarioId: "u5", inicio: "07:00", fim: "19:00" },   // Eva, diurno
];

let seq = 100;
export const novoId = (prefixo: string) => `${prefixo}${++seq}`;
