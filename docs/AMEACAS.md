# Modelagem de ameaças — Mini-Prontuário (capítulo 1)

## Ativos
- Prontuário: atendimentos e prescrições (dado de saúde, LGPD art. 11)
- Credenciais e hashes de senha
- A própria matriz de permissões

## Atores
- Anônimo na internet · recepção · profissional · admin
- Ex-funcionário com credencial antiga · integração/agente com chave de API

## Abusos (STRIDE reduzido)
| Letra | Pergunta                                  | Exemplo aqui                          | Cap. |
|-------|-------------------------------------------|---------------------------------------|------|
| S     | Alguém se passa por outro?                | crachá de papelão forjado (ATQ-01.11) | 3–5  |
| T     | Alguém altera o que não devia?            | recepção prescreve (ATQ-01.6)         | 10   |
| R     | Alguém nega ter feito?                    | prescrição sem autor confiável        | 8,14 |
| I     | Algo vaza?                                | hash na resposta (ATQ-01.13)          | 11   |
| D     | Alguém derruba o serviço?                 | 500 tentativas de login               | 8    |
| E     | Alguém ganha poder que não tem?           | criar admin sem crachá (ATQ-01.4)     | 2,10 |
