import { HttpException, HttpStatus } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Converte uma falha da API da Anthropic numa resposta clara para o utilizador.
 *
 * Nunca devolve 401/403: o frontend trata 401 como sessão expirada e terminaria a sessão do utilizador
 * por causa de uma chave de IA inválida. Os detalhes técnicos ficam só nos logs.
 */
export function erroDaIa(err: unknown, acao: string): HttpException {
  if (err instanceof HttpException) return err;
  const indisponivel = (msg: string) => new HttpException(msg, HttpStatus.SERVICE_UNAVAILABLE);

  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return indisponivel(`Não foi possível ${acao}: a chave da IA não é válida. Contacte o administrador do sistema.`);
  }
  if (err instanceof Anthropic.NotFoundError) {
    return indisponivel(`Não foi possível ${acao}: o modelo de IA configurado não existe. Contacte o administrador do sistema.`);
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new HttpException(`A IA está com muitos pedidos. Aguarde um minuto e tente ${acao} novamente.`, HttpStatus.TOO_MANY_REQUESTS);
  }
  if (err instanceof Anthropic.BadRequestError) {
    const msg = String((err as any)?.error?.error?.message ?? err.message ?? '');
    if (/credit|balance|billing/i.test(msg)) {
      return indisponivel(`Não foi possível ${acao}: a conta da IA não tem créditos. Contacte o administrador do sistema.`);
    }
    return indisponivel(`Não foi possível ${acao}: o pedido à IA foi recusado.`);
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return indisponivel(`Não foi possível ${acao}: sem ligação ao serviço de IA. Tente novamente mais tarde.`);
  }
  if (err instanceof Anthropic.APIError) {
    return indisponivel(`O serviço de IA está temporariamente indisponível. Tente ${acao} mais tarde.`);
  }
  return new HttpException(`Não foi possível ${acao}. Tente novamente mais tarde.`, HttpStatus.INTERNAL_SERVER_ERROR);
}

/** Extrai o primeiro objecto JSON de uma resposta de texto. Devolve null se não houver JSON válido. */
export function extrairJson<T = any>(texto: string): T | null {
  const limpo = texto.replace(/```(?:json)?/gi, '');
  const inicio = limpo.indexOf('{');
  const fim = limpo.lastIndexOf('}');
  if (inicio < 0 || fim <= inicio) return null;
  try {
    return JSON.parse(limpo.slice(inicio, fim + 1)) as T;
  } catch {
    return null;
  }
}

/** Texto de todos os blocos de texto da resposta. */
export function textoDaResposta(message: { content: Array<{ type: string }> }): string {
  return message.content
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}
