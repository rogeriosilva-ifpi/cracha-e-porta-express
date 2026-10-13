// Políticas do Mini-Prontuário em Cedar (capítulo 10).
// Nega por padrão: sem um permit que se aplique, a resposta é deny.

// Prescrever: profissional, autor do atendimento, atendimento aberto,
// e de plantão agora (o app calcula o plantão e manda no contexto).
@id("prescrever-no-proprio-atendimento")
permit (
  principal in Papel::"profissional",
  action == Action::"prescrever",
  resource is Atendimento
)
when {
  resource.autor == principal &&
  resource.status == "aberto" &&
  context.de_plantao
};

// Registro suspenso pelo conselho: forbid vence qualquer permit.
@id("registro-suspenso")
forbid (principal, action == Action::"prescrever", resource)
when { principal.suspenso };
