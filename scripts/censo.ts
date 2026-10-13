import { criarApp } from "../src/app.js";
import { levantar, problemas } from "../src/acesso/censo.js";

const linhas = levantar(criarApp());
for (const { metodo, caminho, politica } of linhas) {
  const p = !politica ? "— NENHUMA —" : "publica" in politica ? "pública" : politica.permissao;
  const linha = `${metodo.padEnd(6)} ${caminho}`;
  // cabe em 46 colunas? política na mesma linha; senão, embaixo
  console.log(linha.length + p.length < 44
    ? `${linha.padEnd(30)} ${p}` : `${linha}\n${"".padEnd(30)} ${p}`);
}
const erros = problemas(linhas);
console.log(`\n${linhas.length} rotas · ${erros.length} problema(s)`);
erros.forEach((e) => console.log(`✗ ${e}`));
process.exit(erros.length ? 1 : 0);
