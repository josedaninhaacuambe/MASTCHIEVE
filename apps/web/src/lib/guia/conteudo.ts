/**
 * Conteúdo do Guia do Sistema.
 *
 * Como o guia se mantém actualizado:
 *  - O caminho no menu ("Menu › Grupo › Página") é gerado a partir de `lib/navegacao.ts`.
 *    Se um módulo mudar de nome ou de grupo, o guia muda sozinho.
 *  - Cada secção está ligada a uma rota (`rota`). Só aparece a quem tem acesso a essa página,
 *    e desaparece se a página sair do menu.
 *  - Módulos do menu sem tema próprio aparecem automaticamente em "Outros módulos do seu menu".
 *  - Ao lançar ou alterar uma funcionalidade: actualizar o tema aqui, mudar `atualizado`
 *    e acrescentar uma linha em `NOVIDADES`.
 *
 * Marcação nos textos: **negrito** e [[Botão]].
 */

export type Bloco =
  | { t: 'onde'; rota: string; extra?: string[] }
  | { t: 'passos'; itens: string[] }
  | { t: 'p'; texto: string }
  | { t: 'lista'; itens: string[] }
  | { t: 'dica' | 'aviso'; titulo: string; texto: string }
  | { t: 'tabela'; cab: string[]; linhas: string[][] };

export interface Secao {
  titulo?: string;
  /** Se definida, a secção só aparece a quem tem acesso a esta página do menu. */
  rota?: string;
  blocos: Bloco[];
}

export interface Topico {
  id: string;
  titulo: string;
  sub: string;
  icone: 'inicio' | 'familia' | 'entradas' | 'relatorios' | 'ferias' | 'pacotes' | 'unidades' | 'turmas' | 'presencas' | 'perfil' | 'outros' | 'duvidas';
  /** Páginas que este tema explica (usadas para a ajuda contextual "?"). */
  rotas: string[];
  /** Data da última revisão (AAAA-MM-DD). Temas revistos há menos de 30 dias mostram "Actualizado". */
  atualizado: string;
  secoes: Secao[];
}

export const ATUALIZADO_EM = '2026-11-27';

export const NOVIDADES: { data: string; texto: string; topico?: string }[] = [
  { data: '2026-11-27', texto: 'Relatórios mensais: resumo do mês, entradas da recepção e avaliações contadas, botão para apagar e regenerar sem duplicados.', topico: 'relatorios' },
  { data: '2026-11-27', texto: 'As entradas registadas em Entrada e Saída passam a alimentar sozinhas a folha de Presenças Diárias e o Excel.', topico: 'entradas' },
  { data: '2026-11-27', texto: 'Atletas: filtros por sexo e por módulo a funcionar sobre todos os atletas, e atribuição de módulo a vários atletas de uma vez.', topico: 'turmas' },
  { data: '2026-11-27', texto: 'A avaliação inicial atribui logo o módulo ao atleta (pode escolher outro) e permite pesquisar qualquer atleta.', topico: 'turmas' },
  { data: '2026-11-26', texto: 'Eventos cancelados podem ser reactivados (com o mesmo link ou um novo) e os participantes escolhidos podem ser inscritos numa unidade depois de concordarem e pagarem.', topico: 'ferias' },
  { data: '2026-11-26', texto: 'As fotos carregadas (cartazes, imagem do link de partilha, fotos de instrutores) voltam a aparecer; os documentos abrem só com sessão iniciada.' },
  { data: '2026-11-26', texto: 'Nova identidade visual: logótipo e cores oficiais da Mastchieve em todo o sistema.' },
  { data: '2026-11-25', texto: 'Formulários públicos de eventos já não perguntam as provas; os detalhes do evento ficam num botão "Mais detalhes".', topico: 'ferias' },
  { data: '2026-11-24', texto: 'Inscrição com Unidade obrigatória, etiqueta BM, irmãos com o mesmo encarregado e alocação em massa a turmas.', topico: 'familia' },
  { data: '2026-11-24', texto: 'Nova folha de Presenças Diárias por turno, com exportação para Excel.', topico: 'relatorios' },
];

export const TOPICOS: Topico[] = [
  {
    id: 'inicio', icone: 'inicio', atualizado: '2026-11-26',
    titulo: 'Começar: o Portal do Assistente',
    sub: 'Onde está cada coisa e como andar no sistema',
    rotas: ['/assistente', '/dashboard'],
    secoes: [
      {
        blocos: [
          { t: 'onde', rota: '/assistente' },
          { t: 'passos', itens: [
            'Entre em **mastchieve.co.mz** com o seu email e palavra-passe.',
            'No telemóvel, toque em [[☰]] para abrir o menu. Os grupos **Administrativo**, **CRM & Eventos** e **Recursos Humanos** abrem ao tocar no nome.',
            'Abra **Assistente — Painel**: tem atalhos para as tarefas do dia. Toque em [[Abrir]] no atalho de que precisa.',
            'Para encontrar um atleta depressa, use a caixa **Pesquisar atletas, turmas…** no topo de qualquer página.',
            'Em qualquer página, o botão [[Ajuda]] no topo abre este guia já no tema dessa página.',
          ] },
          { t: 'dica', titulo: 'Ordem do dia sugerida', texto: 'Rotina Diária (abertura) → Entradas dos atletas → Atendimentos e pagamentos → Presenças Diárias (exportar) → Rotina Diária (fecho).' },
        ],
      },
    ],
  },
  {
    id: 'familia', icone: 'familia', atualizado: '2026-11-24',
    titulo: 'Cadastrar um encarregado e os seus filhos',
    sub: 'Um atleta, irmãos de uma vez, ou mais um filho de um encarregado já registado',
    rotas: ['/students'],
    secoes: [
      {
        rota: '/students',
        blocos: [
          { t: 'tabela', cab: ['Situação', 'Use'], linhas: [
            ['Uma criança com o seu encarregado', 'Atletas › **Novo Atleta** (caso A)'],
            ['Irmãos que se inscrevem juntos', 'Atletas › **Registo em Massa** (caso B)'],
            ['Mais um filho de um encarregado que já existe', 'Novo Atleta com o **mesmo email** do encarregado (caso C)'],
          ] },
        ],
      },
      {
        titulo: 'Caso A — Um atleta e o seu encarregado', rota: '/students',
        blocos: [
          { t: 'onde', rota: '/students', extra: ['Novo Atleta'] },
          { t: 'passos', itens: [
            '**1 · Dados Pessoais:** Primeiro nome, Apelido e Data de nascimento (obrigatórios), Género e **Unidade** (obrigatória).',
            'Se for uma criança sem conta própria, no campo Email marque **"Não aplicável — menor sem conta própria"**. O acesso fica na conta do encarregado.',
            '**2 · Encarregados:** toque em [[Adicionar encarregado]] e preencha Primeiro nome, Apelido, Telemóvel (obrigatórios), Parentesco e Email. O email dá acesso ao painel do encarregado.',
            'Marque **Encarregado principal** para quem deve receber os alertas de faltas e as comunicações. Pode adicionar um segundo encarregado.',
            '**3 · Contacto de emergência:** nome e telemóvel de emergência.',
            '**4 · Turma & Notas Médicas:** escolha a turma (só aparece depois da unidade), o **Pacote** e as notas médicas, se houver. Marque **Atleta do Banco de Moçambique (BM)** só se for o caso — estes atletas não têm pacote nem mensalidades automáticas.',
            '**5 · Uso de imagem:** marque só se o encarregado autorizou fotos e vídeos.',
            'Toque em [[Criar Atleta]].',
          ] },
        ],
      },
      {
        titulo: 'Caso B — Irmãos (vários filhos de uma vez)', rota: '/students',
        blocos: [
          { t: 'onde', rota: '/students', extra: ['Registo em Massa'] },
          { t: 'passos', itens: [
            'Marque **"Estes atletas partilham o(s) mesmo(s) encarregado(s)"**.',
            'Preencha o **Encarregado principal**: nome, apelido, telemóvel, parentesco e email. Se deixar o email em branco, o sistema cria um acesso automático.',
            'Para o segundo encarregado, toque em [[Adicionar encarregado (ex: cônjuge)]].',
            'Em **Atletas**, preencha Atleta 1, Atleta 2… (nome, apelido, data de nascimento, género e turma). Para mais filhos toque em [[Adicionar Atleta]].',
            'Toque em [[Criar 2 Atletas]] (o número muda conforme o total).',
          ] },
        ],
      },
      {
        titulo: 'Caso C — Mais um filho de um encarregado já registado', rota: '/students',
        blocos: [
          { t: 'passos', itens: [
            'Faça **Novo Atleta** como no caso A.',
            'Em Encarregados, escreva o **mesmo email** que o encarregado já usa. O sistema reaproveita a conta e não cria duplicado — os filhos ficam no mesmo painel.',
          ] },
          { t: 'aviso', titulo: 'Atenção', texto: 'Confirme sempre o email do encarregado letra a letra. Um email diferente cria uma segunda conta e o encarregado deixa de ver todos os filhos juntos.' },
          { t: 'dica', titulo: 'Corrigir dados depois', texto: 'Abra o atleta em Atletas › Ver perfil › [[Editar Perfil]].' },
        ],
      },
    ],
  },
  {
    id: 'entradas', icone: 'entradas', atualizado: '2026-11-27',
    titulo: 'Processar entradas e saídas dos atletas',
    sub: 'Entrada, saída especial, cancelamento e registo da turma inteira',
    rotas: ['/entrada-saida'],
    secoes: [
      {
        rota: '/entrada-saida',
        blocos: [
          { t: 'onde', rota: '/entrada-saida' },
          { t: 'dica', titulo: 'Regra principal', texto: 'Só precisa de registar a **entrada**. A saída é registada **automaticamente 50 minutos depois** (aparece com a etiqueta "Automática").' },
          { t: 'dica', titulo: 'Presenças do dia automáticas', texto: 'Cada entrada registada aqui aparece sozinha na folha de **Presenças Diárias**, no turno da hora de chegada. Um cancelamento retira o atleta da folha. Toque em [[Presenças do dia / Excel]] para ver a folha e exportar.' },
        ],
      },
      {
        titulo: 'Registar a entrada de um atleta', rota: '/entrada-saida',
        blocos: [{ t: 'passos', itens: [
          'Toque em [[+ Registar]].',
          'Em **Atleta**, escreva parte do nome e escolha o atleta da lista.',
          'Deixe seleccionado [[Entrada]].',
          'Se o registo for atrasado, marque **Indicar a hora manualmente** e escreva a hora real de chegada. Se não marcar, usa a hora actual.',
          'Toque em [[Registar]].',
        ] }],
      },
      {
        titulo: 'Registar a turma inteira de uma vez', rota: '/entrada-saida',
        blocos: [{ t: 'passos', itens: [
          'Toque em [[Registo em Grupo (Turma)]].',
          'Escolha a **Turma** e deixe [[Entrada]] seleccionado (ou Saída, se for o caso).',
          'Se necessário, marque **Indicar a hora manualmente**.',
          'Toque em [[Registar Grupo]].',
        ] }],
      },
      {
        titulo: 'Saída especial (só em casos excepcionais)', rota: '/entrada-saida',
        blocos: [
          { t: 'p', texto: 'Use [[Saída]] só quando a aula foi prolongada ou encurtada, ou quando o atleta sai com uma **pessoa autorizada**. Esta saída substitui a automática, e o atleta já tem de ter a entrada registada.' },
          { t: 'passos', itens: [
            '[[+ Registar]] → escolha o atleta → [[Saída]].',
            'Escolha a **Pessoa Autorizada** que veio buscar o atleta.',
            'Em **Observação**, explique (ex.: "saiu mais cedo a pedido do encarregado") → [[Registar]].',
          ] },
        ],
      },
      {
        titulo: 'Cancelamento', rota: '/entrada-saida',
        blocos: [
          { t: 'p', texto: 'Quando o atleta chegou mas teve de sair **antes** de a aula começar: [[+ Registar]] → atleta → [[Cancelamento]] → escreva a **Justificação** (obrigatória) → [[Registar]].' },
        ],
      },
      {
        titulo: 'Consultar os registos de um dia', rota: '/entrada-saida',
        blocos: [
          { t: 'p', texto: 'Use a caixa de **data** no topo da página. A lista mostra data e hora, atleta, tipo, pessoa autorizada ou justificação, e quem registou.' },
          { t: 'aviso', titulo: 'Evite duplicados', texto: 'Antes de registar outra vez, veja se o atleta já aparece na lista do dia. Toques repetidos criam entradas duplicadas.' },
        ],
      },
    ],
  },
  {
    id: 'relatorios', icone: 'relatorios', atualizado: '2026-11-27',
    titulo: 'Relatórios de entradas e presenças',
    sub: 'Folha do dia em Excel, resumo da semana e relatório mensal em PDF',
    rotas: ['/presencas-diarias', '/relatorios-mensais'],
    secoes: [
      {
        titulo: 'Diário — folha de presenças do dia', rota: '/presencas-diarias',
        blocos: [
          { t: 'onde', rota: '/presencas-diarias' },
          { t: 'passos', itens: [
            'Escolha a **data** e a **unidade** (ou "Todas as unidades"). Toque em ⟳ para actualizar.',
            'A folha mostra o total de presenças e uma tabela **por turno** (05:30–06:20, 06:30–07:20…) com nome, se é trabalhador do BM, contacto, módulo e idade.',
            'Entram na folha as **entradas da recepção** (Entrada e Saída) e as presenças marcadas na chamada da aula. A página actualiza-se sozinha a cada minuto.',
            'Toque em [[Exportar Excel]] para guardar ou enviar a folha.',
          ] },
        ],
      },
      {
        titulo: 'Semanal', rota: '/presencas-diarias',
        blocos: [
          { t: 'p', texto: 'Ainda não há um botão próprio de relatório semanal. Faça assim:' },
          { t: 'passos', itens: [
            'Em **Presenças Diárias**, exporte o Excel de cada dia da semana, sempre com a mesma unidade.',
            'Junte as folhas num só ficheiro e some o "Total de presenças" de cada dia.',
            'Para as entradas e saídas de um dia concreto, use também o filtro de data em **Entrada e Saída**.',
          ] },
        ],
      },
      {
        titulo: 'Mensal', rota: '/relatorios-mensais',
        blocos: [
          { t: 'onde', rota: '/relatorios-mensais' },
          { t: 'passos', itens: [
            'Toque em [[Gerar Relatório]], escolha o **mês** e (se lhe for pedido) a **unidade** → [[Gerar]]. O assistente administrativo gera sempre o da sua unidade.',
            'Cada cartão começa com o **Resumo do mês** (com a comparação com o mês anterior) e mostra alunos activos, atletas presentes, entradas na recepção, presença média, receita, avaliações e feedbacks, módulos e certificados, incidentes, reclamações, stock baixo e pagamentos em atraso.',
            'Toque em [[PDF]] no cartão do mês para descarregar.',
            'Para actualizar os números de um mês, toque em ⟳ no cartão (ou gere o mesmo mês outra vez): o relatório existente é **actualizado**, não se cria outro.',
            'Para apagar um relatório (por exemplo, um duplicado antigo), toque no 🗑 do cartão e confirme. Pode voltar a gerá-lo depois.',
          ] },
          { t: 'aviso', titulo: 'Relatórios antigos', texto: 'Os cartões gerados antes de 27/11/2026 não têm o resumo do mês. Toque em ⟳ para os completar.' },
          { t: 'dica', titulo: 'Relatório de um só atleta', texto: 'Atletas › Ver perfil › [[Relatório Mensal]] ou [[Exportar PDF]]. Para os pagamentos: Financeiro › escolher o ano › [[Exportar PDF]].' },
        ],
      },
    ],
  },
  {
    id: 'ferias', icone: 'ferias', atualizado: '2026-11-26',
    titulo: 'Programa de férias e eventos',
    sub: 'Pré-inscrições, confirmação, presenças e comunicação',
    rotas: ['/eventos'],
    secoes: [
      {
        rota: '/eventos',
        blocos: [
          { t: 'onde', rota: '/eventos' },
          { t: 'p', texto: 'O programa de férias aparece como um cartão de evento com data, hora, local, número de pré-inscrições e lotação (ex.: 6 / 10).' },
        ],
      },
      {
        titulo: 'Partilhar o formulário de inscrição', rota: '/eventos',
        blocos: [{ t: 'passos', itens: [
          'No cartão do evento, confirme que diz **Formulário aberto**.',
          'Use [[Gerar novo link]] para obter o link do formulário e envie-o aos encarregados. O formulário público mostra o cartaz e esconde a descrição completa atrás do botão **Mais detalhes do evento**.',
        ] }],
      },
      {
        titulo: 'Tratar as inscrições', rota: '/eventos',
        blocos: [
          { t: 'passos', itens: [
            'Toque em [[Gerir]] → separador **Participantes**.',
            'Toque na seta ⌄ de cada participante para ver os dados do formulário.',
            'Mude o estado: **Pré-inscrito → Confirmado** quando a inscrição for validada (e paga, se for o caso).',
            'No dia da actividade, marque **Presente** ou **Ausente**. Use **Cancelado** para desistências.',
            'Para passar a criança a atleta regular, veja **Inscrever participantes numa unidade** abaixo (ou toque em [[Criar pedido de inscrição]] para só registar o interesse no CRM).',
            'Para ter a lista em Excel, toque em [[CSV]].',
          ] },
          { t: 'lista', itens: [
            '**Imagens** e **Materiais**: fotos e materiais do evento. **Comunicação**: mensagens para os participantes.',
            '[[Fechar inscrições]] quando a lotação estiver completa; [[Marcar Realizado]] no fim.',
            '[[Novo Evento]] cria um novo programa de férias ou open day.',
          ] },
          { t: 'aviso', titulo: 'Atenção', texto: 'Não toque em [[Cancelar]] no cartão do evento — esse botão cancela o evento inteiro, não uma inscrição. Se cancelar por engano, use [[Reactivar]].' },
        ],
      },
      {
        titulo: 'Reactivar um evento cancelado', rota: '/eventos',
        blocos: [
          { t: 'passos', itens: [
            'No cartão do evento cancelado, toque em [[Reactivar]].',
            'Escolha **Manter o mesmo link** (quem já recebeu o link pode voltar a usá-lo) ou **Gerar um link novo** (o antigo deixa de funcionar).',
            'Deixe marcado **Reabrir já o formulário de inscrição** se quiser receber novas inscrições. O link é copiado automaticamente.',
          ] },
          { t: 'dica', titulo: 'Dica', texto: 'Os participantes e inscrições que já existiam mantêm-se depois de reactivar.' },
        ],
      },
      {
        titulo: 'Inscrever participantes numa unidade', rota: '/eventos',
        blocos: [
          { t: 'p', texto: 'Quando um participante do evento quer continuar como atleta regular, **concordou** e **pagou** a primeira mensalidade:' },
          { t: 'passos', itens: [
            'Toque em [[Gerir]] → **Participantes** e marque a caixa ao lado de cada pessoa (ou [[Seleccionar todos]]).',
            'Toque em [[Inscrever na unidade]].',
            'Escolha a **Unidade** (só a administração escolhe; a secretaria inscreve na sua unidade) e o **Pacote**.',
            'Confirme as duas caixas: a pessoa **concordou** e **recebeu o pagamento**; escolha o método de pagamento.',
            'Toque em [[Inscrever e registar pagamento]]. O sistema cria o atleta, a mensalidade do mês já paga e o recibo.',
          ] },
          { t: 'lista', itens: [
            'Não é inscrito quem já é atleta, está **Cancelado**, não tem **data de nascimento** ou parece duplicado (mesmo nome e data de nascimento). O motivo aparece na lista final.',
            'O atleta fica com **documentos pendentes**: complete depois a ficha em Atletas (encarregado, documentos, turma).',
          ] },
          { t: 'aviso', titulo: 'Atenção', texto: 'Só confirme o pagamento depois de o receber. O sistema não inventa contactos: se o participante não deu telefone ou email, não recebe mensagens.' },
        ],
      },
    ],
  },
  {
    id: 'pacotes', icone: 'pacotes', atualizado: '2026-11-24',
    titulo: 'Pacotes e pagamentos',
    sub: 'Criar pacote, atribuir a um atleta e registar pagamentos',
    rotas: ['/pacotes', '/financial'],
    secoes: [
      {
        titulo: 'Criar ou alterar um pacote', rota: '/pacotes',
        blocos: [
          { t: 'p', texto: 'O pacote define o **valor da mensalidade** do atleta.' },
          { t: 'onde', rota: '/pacotes' },
          { t: 'passos', itens: [
            'Toque em [[Novo pacote]].',
            'Preencha **Nome**, **Preço mensal (MT)**, **Aulas por semana** e Descrição → [[Guardar]].',
            'Para mudar um pacote, toque em [[Editar]]. Pacotes "Inactivo" voltam com [[Reactivar]].',
          ] },
        ],
      },
      {
        titulo: 'Atribuir pacote a um atleta', rota: '/students',
        blocos: [{ t: 'lista', itens: [
          '**Na inscrição:** secção 4, campo **Pacote / plano de pagamento**.',
          '**Depois:** Atletas › Ver perfil › separador **Financeiro** › [[Atribuir pacote]] → escolher → [[Guardar]].',
        ] }],
      },
      {
        titulo: 'Registar um pagamento', rota: '/financial',
        blocos: [
          { t: 'onde', rota: '/financial' },
          { t: 'passos', itens: [
            'Filtre por estado (Pago, Pendente, Em atraso) e encontre a mensalidade do atleta.',
            'Escolha o método: **Numerário, Cartão Visa, e-Mola ou M-Pesa**.',
            'Toque em [[Marcar Pago]]. Use [[Isenção]] só com autorização da direcção.',
          ] },
          { t: 'lista', itens: [
            '[[Enviar lembretes]]: avisa os encarregados com pagamentos em atraso.',
            '[[Nova cobrança]]: cobrança avulsa. [[Mensalidades em grupo]]: gera mensalidades para vários atletas.',
            '[[Conferência de Caixa]]: confere o dinheiro recebido no dia.',
          ] },
        ],
      },
    ],
  },
  {
    id: 'unidades', icone: 'unidades', atualizado: '2026-11-24',
    titulo: 'Escola / Unidade',
    sub: 'Ver cada unidade, as suas turmas e os atletas sem turma',
    rotas: ['/unidades'],
    secoes: [
      {
        rota: '/unidades',
        blocos: [
          { t: 'onde', rota: '/unidades' },
          { t: 'p', texto: 'Cada cartão mostra código, nome, estado (Activa/Inactiva), endereço e número de alunos, turmas e instrutores.' },
          { t: 'passos', itens: [
            'Toque em [[Ver turmas e atletas]] na unidade.',
            'Veja os totais: turmas, atletas em turmas, **sem turma** e atletas BM.',
            'A lista **Atletas da unidade sem turma** mostra quem ainda precisa de ser alocado.',
          ] },
        ],
      },
      {
        rota: '/students',
        blocos: [{ t: 'dica', titulo: 'Importante', texto: 'Todo o atleta tem de ter unidade. A lista de turmas na inscrição só aparece depois de escolher a unidade.' }],
      },
    ],
  },
  {
    id: 'turmas', icone: 'turmas', atualizado: '2026-11-27',
    titulo: 'Turmas, filtros, módulos e alocação de atletas',
    sub: 'Criar turma, filtrar atletas, atribuir o módulo e colocá-los na turma certa',
    rotas: ['/classes', '/students', '/avaliacoes-iniciais'],
    secoes: [
      {
        titulo: 'Ver e criar turmas', rota: '/classes',
        blocos: [
          { t: 'onde', rota: '/classes' },
          { t: 'lista', itens: [
            'Filtre por nível: **AMA**, **Intermédio**, **Avançado**. Cada turma mostra instrutor, ocupação (ex.: 3/8) e horário.',
            '[[Nova Turma]]: nome, capacidade máxima, instrutor e auxiliares, **unidade**, descrição, **módulos** e **horários** (dia + hora → [[Adicionar]]) → [[Criar Turma]].',
          ] },
        ],
      },
      {
        titulo: 'Filtrar atletas', rota: '/students',
        blocos: [
          { t: 'onde', rota: '/students', extra: ['Filtros'] },
          { t: 'tabela', cab: ['Filtro', 'Para quê'], linhas: [
            ['Unidade', 'Só os atletas de uma unidade'],
            ['Turma', 'Quem está numa turma'],
            ['Módulo', 'Atletas cujo módulo em curso é Estrela-do-Mar, Cavalo-Marinho, Polvo… Golfinho, ou "Sem módulo atribuído"'],
            ['Sexo', 'Masculino, Feminino ou Não indicado'],
            ['Activo / Inactivo, Nível, Irregular, Campanha', 'Botões da barra de pesquisa — agora filtram todos os atletas, não só a página aberta'],
            ['Dia e horário', 'Quem treina num dia/hora (ex.: Sábado 08:00)'],
            ['BM', '"Só BM", "Sem BM" ou todos'],
            ['Sem turma', 'Quem ainda não foi alocado'],
          ] },
        ],
      },
      {
        titulo: 'Alocar atletas a uma turma', rota: '/students',
        blocos: [
          { t: 'passos', itens: [
            'Em Atletas, escolha a **unidade** e marque **Sem turma**.',
            'Marque a caixa ☐ de cada atleta, ou toque em **Seleccionar esta página para alocar**.',
            'Na barra que aparece em baixo, deixe **Manter unidade** (ou escolha outra) e escolha a **turma**.',
            'Toque em [[Alocar]]. Para desistir, toque em [[Cancelar]].',
          ] },
          { t: 'aviso', titulo: 'Antes de alocar', texto: 'Confira a ocupação da turma (ex.: 8/8 = cheia) e se o nível ou módulo do atleta corresponde ao da turma.' },
        ],
      },
      {
        titulo: 'Atribuir o módulo a vários atletas (Admin e instrutores)', rota: '/students',
        blocos: [
          { t: 'passos', itens: [
            'Em Atletas, filtre por exemplo por **Módulo › Sem módulo atribuído**.',
            'Marque a caixa ☐ de cada atleta, ou toque em **Seleccionar esta página…**.',
            'Na barra **Atribuir módulo**, escolha o módulo → [[Atribuir]].',
          ] },
          { t: 'dica', titulo: 'Porque é importante', texto: 'As avaliações diárias só funcionam para atletas com um módulo em curso. Um atleta que já concluiu o módulo escolhido não é alterado (aparece no aviso).' },
        ],
      },
      {
        titulo: 'Avaliação inicial (ficha diagnóstica)', rota: '/avaliacoes-iniciais',
        blocos: [
          { t: 'onde', rota: '/avaliacoes-iniciais' },
          { t: 'passos', itens: [
            'Toque em [[Nova Avaliação]] (Admin e instrutores).',
            'Em **Atleta**, escreva parte do nome e escolha-o. Se não for instrutor, escolha o **instrutor que avaliou**.',
            'Preencha os critérios e marque as fases em que o atleta **transita**. O sistema recomenda o módulo de entrada; pode escolher outro em **Módulo a atribuir ao atleta**.',
            'Toque em [[Guardar Diagnóstico]]. O módulo passa logo a ser o módulo em curso do atleta.',
          ] },
          { t: 'dica', titulo: 'Avaliar de novo', texto: 'Cada atleta tem uma só ficha. Se avaliar um atleta que já tem ficha, a anterior é actualizada.' },
        ],
      },
    ],
  },
  {
    id: 'presencas', icone: 'presencas', atualizado: '2026-11-24',
    titulo: 'Presenças (chamada da turma)',
    sub: 'Marcar quem esteve na aula',
    rotas: ['/attendance'],
    secoes: [
      {
        rota: '/attendance',
        blocos: [
          { t: 'onde', rota: '/attendance' },
          { t: 'passos', itens: [
            'Separador [[Marcar Presenças]] → escolha a **Turma**.',
            'Escolha a **Sessão** (aula do dia) e marque cada atleta.',
            'Em [[Calendário]] pode ver as presenças de dias anteriores.',
          ] },
          { t: 'dica', titulo: 'Diferença', texto: '"Entrada e Saída" controla quem entrou e saiu das instalações. "Presenças" é a chamada dentro da aula. Os dois alimentam a folha de Presenças Diárias.' },
        ],
      },
    ],
  },
  {
    id: 'perfil', icone: 'perfil', atualizado: '2026-11-24',
    titulo: 'Perfil do atleta',
    sub: 'Editar dados, pacote, QR de acesso, chamada de atenção, PDF',
    rotas: ['/students/'],
    secoes: [
      {
        rota: '/students',
        blocos: [
          { t: 'onde', rota: '/students', extra: ['Ver perfil'] },
          { t: 'tabela', cab: ['Botão / separador', 'Para quê'], linhas: [
            ['Editar Perfil', 'Corrigir nome, contactos, unidade, turma, encarregados'],
            ['QR de Acesso', 'Código do atleta para identificação à entrada'],
            ['Chamada de Atenção', 'Registar uma ocorrência de comportamento'],
            ['Relatório Mensal / Exportar PDF', 'Documento do atleta para o encarregado'],
            ['Financeiro', 'Pacote, total pago, pendente e em atraso, recibos'],
            ['Histórico', 'Alterações feitas ao atleta'],
            ['Desempenho, Feedbacks, Módulos, Planos de Treino', 'Área técnica dos instrutores'],
          ] },
        ],
      },
    ],
  },
  {
    id: 'outros', icone: 'outros', atualizado: '2026-11-24',
    titulo: 'Outros módulos do assistente',
    sub: 'Rotina diária, atendimento, inventário, reclamações, leads, comunicação, RH',
    rotas: ['/rotina-diaria', '/atendimento', '/inventario', '/reclamacoes', '/leads', '/comunicacao', '/assistente/whatsapp', '/assistente/partilha', '/rh/funcionarios', '/rh/formacao', '/notifications'],
    secoes: [
      { titulo: 'Rotina Diária', rota: '/rotina-diaria', blocos: [
        { t: 'onde', rota: '/rotina-diaria' },
        { t: 'p', texto: 'Escolha a unidade → **Abertura**: [[Iniciar Checklist]] (temperatura e qualidade da água, segurança, balneários, instrutores, materiais). No fim do dia, **Fecho**: [[Iniciar Checklist]] (torneiras, balneários, materiais, caixa, luzes, portas e alarme).' },
      ] },
      { titulo: 'Atendimento e Receção', rota: '/atendimento', blocos: [
        { t: 'onde', rota: '/atendimento' },
        { t: 'p', texto: '[[Registar Atendimento]] para cada visitante, encarregado ou fornecedor. Filtre por Aberto / Resolvido e feche quando estiver tratado.' },
      ] },
      { titulo: 'Inventário', rota: '/inventario', blocos: [
        { t: 'onde', rota: '/inventario' },
        { t: 'p', texto: '[[Novo Item]] para registar material. Use [[Movimento]] para entradas e saídas de stock. O separador **Alertas** mostra o que está abaixo do mínimo.' },
      ] },
      { titulo: 'Reclamações e Sugestões', rota: '/reclamacoes', blocos: [
        { t: 'onde', rota: '/reclamacoes' },
        { t: 'p', texto: '[[Registar]] reclamação, sugestão ou elogio. Acompanhe os estados Aberta → Em análise → Respondida → Fechada.' },
      ] },
      { titulo: 'CRM — Leads', rota: '/leads', blocos: [
        { t: 'onde', rota: '/leads' },
        { t: 'p', texto: '[[Novo Lead]] para quem pede informações. Avance o estado: Novo → Contactado → Agendado → Convertido (ou Perdido).' },
      ] },
      { titulo: 'Comunicação', rota: '/comunicacao', blocos: [
        { t: 'onde', rota: '/comunicacao' },
        { t: 'p', texto: 'Newsletters, informes e promoções para os encarregados.' },
      ] },
      { titulo: 'WhatsApp — Envios', rota: '/assistente/whatsapp', blocos: [
        { t: 'onde', rota: '/assistente/whatsapp' },
        { t: 'p', texto: 'Fila de mensagens a enviar depois de cada inscrição.' },
      ] },
      { titulo: 'Central de Partilha', rota: '/assistente/partilha', blocos: [
        { t: 'onde', rota: '/assistente/partilha' },
        { t: 'p', texto: 'Links prontos (newsletter, open day, formulários) para copiar e enviar.' },
      ] },
      { titulo: 'Funcionários', rota: '/rh/funcionarios', blocos: [
        { t: 'onde', rota: '/rh/funcionarios' },
        { t: 'p', texto: 'Registar a admissão de um novo colaborador.' },
      ] },
      { titulo: 'Formação e Inscrições', rota: '/rh/formacao', blocos: [
        { t: 'onde', rota: '/rh/formacao' },
        { t: 'p', texto: 'Inscrever colaboradores em formações e ver vagas e histórico.' },
      ] },
      { titulo: 'Notificações', rota: '/notifications', blocos: [
        { t: 'p', texto: 'O sino 🔔 no topo mostra os avisos do sistema. Veja-os no início do turno.' },
      ] },
    ],
  },
  {
    id: 'duvidas', icone: 'duvidas', atualizado: '2026-11-24',
    titulo: 'Dúvidas comuns',
    sub: 'Problemas que aparecem no balcão e como resolver',
    rotas: [],
    secoes: [
      { titulo: 'A lista de turmas está vazia na inscrição', rota: '/students', blocos: [{ t: 'p', texto: 'Escolha primeiro a **Unidade**. A turma só aparece depois.' }] },
      { titulo: 'Esqueci-me de registar a saída', rota: '/entrada-saida', blocos: [{ t: 'p', texto: 'Não é preciso: a saída é automática 50 minutos depois da entrada. Só registe Saída manual em casos especiais.' }] },
      { titulo: 'Registei a entrada à hora errada', rota: '/entrada-saida', blocos: [{ t: 'p', texto: 'Ao registar, marque **Indicar a hora manualmente** e escreva a hora certa. Se o registo errado já foi feito, peça a um administrador para o corrigir.' }] },
      { titulo: 'O encarregado não vê o segundo filho na app', rota: '/students', blocos: [{ t: 'p', texto: 'O segundo filho foi registado com outro email. Abra o perfil do filho › Editar Perfil e use o mesmo email do encarregado.' }] },
      { titulo: 'O atleta é do Banco de Moçambique', rota: '/students', blocos: [{ t: 'p', texto: 'Marque **Atleta do Banco de Moçambique (BM)** na inscrição. Não atribua pacote: estes atletas não têm mensalidades automáticas.' }] },
      { titulo: 'A criança do programa de férias quer continuar', rota: '/eventos', blocos: [{ t: 'p', texto: 'Depois de concordar e pagar: Eventos › Gerir › Participantes › marque a criança › [[Inscrever na unidade]]. Para só registar o interesse, use [[Criar pedido de inscrição]].' }] },
      { titulo: 'Não encontro um módulo no menu', blocos: [{ t: 'p', texto: 'Toque no nome do grupo (Administrativo, CRM & Eventos…) para o abrir. Se mesmo assim não aparecer, o seu perfil não tem acesso — fale com o administrador.' }] },
    ],
  },
];
