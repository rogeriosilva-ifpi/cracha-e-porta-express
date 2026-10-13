# Políticas como código

- `prontuario.cedar` + `casos.json`: rodam nas duas stacks, dentro do
  processo (`@cedar-policy/cedar-wasm` e `cedarpy`). Os testes tabulares
  leem `casos.json`.
- `prescrever.rego` + `prescrever_test.rego`: a mesma regra para o OPA.
  Com Docker: `docker run --rm -v "$PWD":/p openpolicyagent/opa test /p -v`
- `prontuario.fga`: modelo de relações para o OpenFGA. Com Docker:
  `docker run -p 8080:8080 openfga/openfga run` e o CLI `fga` para
  criar a store, gravar o modelo e as tuplas.
