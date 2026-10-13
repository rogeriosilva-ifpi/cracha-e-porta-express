package prontuario.prescrever_test

import data.prontuario.prescrever

ana := {"id": "u2", "papel": "profissional"}
e1 := {"id": "e1", "autor": "u2", "status": "aberto"}

test_autora_de_plantao if {
	prescrever.permitido with input as {"sujeito": ana, "recurso": e1, "contexto": {"de_plantao": true}}
}

test_outro_profissional if {
	not prescrever.permitido with input as {"sujeito": {"id": "u3", "papel": "profissional"}, "recurso": e1, "contexto": {"de_plantao": true}}
}

test_fora_do_plantao if {
	not prescrever.permitido with input as {"sujeito": ana, "recurso": e1, "contexto": {"de_plantao": false}}
}
