# A mesma regra em Rego, para o OPA (capítulo 10). NÃO roda no laboratório
# do livro; veja o README para executar com Docker.
package prontuario.prescrever

default permitido := false

permitido if {
	count(motivos) == 0
}

motivos contains "registro suspenso" if input.sujeito.suspenso
motivos contains "papel sem rx:create" if input.sujeito.papel != "profissional"
motivos contains "não é o autor do atendimento" if input.recurso.autor != input.sujeito.id
motivos contains "atendimento finalizado" if input.recurso.status != "aberto"
motivos contains "fora do plantão" if not input.contexto.de_plantao
