import api from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * Abre o recibo (PDF) de um pagamento pago. O ficheiro é pedido com o token da sessão,
 * por isso não existe nenhum link público para o recibo.
 * - Equipa: `/financial/payments/:id/recibo`
 * - Atleta/encarregado: `/financial/me/payments/:id/recibo` (só os seus pagamentos)
 */
export async function abrirRecibo(paymentId: string, proprio = false) {
  const janela = typeof window !== 'undefined' ? window.open('', '_blank') : null;
  try {
    const url = proprio ? `/financial/me/payments/${paymentId}/recibo` : `/financial/payments/${paymentId}/recibo`;
    const res = await api.get(url, { responseType: 'blob' });
    const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    if (janela) janela.location.href = blobUrl;
    else window.location.href = blobUrl;
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  } catch (e: any) {
    janela?.close();
    let msg = 'Não foi possível obter o recibo.';
    const data = e?.response?.data;
    if (data instanceof Blob) {
      try {
        const j = JSON.parse(await data.text());
        msg = (Array.isArray(j?.message) ? j.message.join(' ') : j?.message) || msg;
      } catch {
        /* mantém a mensagem genérica */
      }
    }
    toast.error('Recibo indisponível', msg);
  }
}
