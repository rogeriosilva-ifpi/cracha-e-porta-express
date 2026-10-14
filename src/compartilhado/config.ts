// Configuração e segredos (capítulo 13). Tudo vem do ambiente, nunca
// do código nem do git. Em produção, faltar um segredo ou usar o valor
// de exemplo impede o servidor de subir: falha cedo, falha alto.
export interface Config {
  producao: boolean;
  origens: string[];
  chavesJwt: string[];                  // PEM PKCS#8; [0] assina, as outras conferem
  chavesDados: Record<string, string>;  // versão -> chave base64 (AES-256)
  dadosAtual: string;                   // versão que cifra
}

const EXEMPLO = /troque|changeme|exemplo|segredo|xxx/i;
const versaoEChave = (v: string) => {
  const [versao, chave] = v.split(":");
  return versao && chave && Buffer.from(chave, "base64").length === 32
    ? [versao, chave] as const : undefined;
};

export function carregarConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const producao = env.NODE_ENV === "production";
  const erros: string[] = [];
  const exigir = (nome: string) => {
    const v = env[nome];
    if (!v) { if (producao) erros.push(`${nome} ausente`); return undefined; }
    if (producao && EXEMPLO.test(v)) erros.push(`${nome} com valor de exemplo`);
    return v;
  };
  const origens = exigir("CORS_ORIGINS");
  const jwt = exigir("CHAVE_JWT_ATUAL");
  const dados = exigir("CHAVE_DADOS");
  const atual = dados ? versaoEChave(dados) : undefined;
  if (dados && !atual) erros.push("CHAVE_DADOS deve ser versao:base64 de 32 bytes");
  if (erros.length) throw new Error(`Configuração inválida para produção: ${erros.join("; ")}`);

  const chavesDados: Record<string, string> = {};
  for (const v of [env.CHAVE_DADOS_ANTERIOR, dados]) {   // a anterior só decifra
    const par = v && versaoEChave(v);
    if (par) chavesDados[par[0]] = par[1];
  }
  return {
    producao,
    origens: (origens ?? "http://localhost:5173").split(","),
    chavesJwt: [jwt, env.CHAVE_JWT_ANTERIOR].filter(Boolean)
      .map((p) => p!.replace(/\\n/g, "\n")),
    chavesDados,
    dadosAtual: atual?.[0] ?? "dev",
  };
}

let carregada: Config;
try {
  carregada = carregarConfig();
} catch (e) {
  console.error((e as Error).message);   // sem pilha, sem valores
  process.exit(1);
}
export const config = carregada!;
