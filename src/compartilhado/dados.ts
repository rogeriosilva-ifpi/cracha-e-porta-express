// Dados em memória do Mini-Prontuário. O banco entra no capítulo 4.
export type Papel = "admin" | "profissional" | "recepcao";

export interface Usuario {
  id: string; nome: string; email: string;
  papel: Papel;
  passwordHash: string; // hash ilustrativo; os reais nascem no cap. 4
}
export interface Paciente { id: string; nome: string; cns: string; nascimento: string }
export interface Atendimento {
  id: string; pacienteId: string; profissionalId: string;
  motivo: string; status: "aberto" | "finalizado";
}
export interface Prescricao {
  id: string; atendimentoId: string; profissionalId: string;
  medicamento: string; posologia: string;
}

const HASH = "$argon2id$v=19$m=19456,t=2,p=1$c2FsdGRlbW8$aGFzaGlsdXN0cmF0aXZv";

export const db = {
  usuarios: [
    { id: "u1", nome: "Admin Geral", email: "admin@hospital.dev", papel: "admin", passwordHash: HASH },
    { id: "u2", nome: "Dra. Ana", email: "ana@hospital.dev", papel: "profissional", passwordHash: HASH },
    { id: "u3", nome: "Dr. Bruno", email: "bruno@hospital.dev", papel: "profissional", passwordHash: HASH },
    { id: "u4", nome: "Carla", email: "carla@hospital.dev", papel: "recepcao", passwordHash: HASH },
  ] as Usuario[],
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

let seq = 100;
export const novoId = (prefixo: string) => `${prefixo}${++seq}`;
