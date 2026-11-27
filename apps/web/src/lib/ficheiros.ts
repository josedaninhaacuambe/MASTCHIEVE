import api from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * Abre um ficheiro privado (documento de atleta, documento RH) pedindo-o à API
 * com a sessão do utilizador. Nunca por link público em /uploads.
 */
export async function abrirFicheiroProtegido(caminho: string, opcoes: { descarregar?: string } = {}) {
  // Abre já a janela (no clique) para não ser bloqueada como popup.
  const janela = opcoes.descarregar ? null : window.open('', '_blank');
  try {
    const { data } = await api.get<Blob>(caminho, { responseType: 'blob' });
    const url = URL.createObjectURL(data);
    if (opcoes.descarregar) {
      const a = document.createElement('a');
      a.href = url; a.download = opcoes.descarregar;
      document.body.appendChild(a); a.click(); a.remove();
    } else if (janela) {
      janela.location.href = url;
    } else {
      window.location.href = url;
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (e: any) {
    janela?.close();
    const status = e?.response?.status;
    toast.error(status === 404 ? 'O ficheiro não foi encontrado no servidor.' : 'Não foi possível abrir o ficheiro.');
  }
}
