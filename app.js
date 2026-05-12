// GLOBAL STATE
let itensProducao = [];
let obras = [];
let unidadesMontadas = [];
let scanner = null;
let itemSelecionado = null;
let horaLeitura = null;
let modoAdmin = false;
let componentesSelecionados = [];
let obraAtual = null;
let produtoAtual = null;
let produtos = [];
let componentesBasicos = [];
let filtroProdutoAtual = 'todos';

// SETORES DO FLUXO CAD - SEM SERRALHERIA
const setores = ['emitido', 'forma', 'concretagem', 'concluido'];

// SETORES DO FLUXO DE MONTAGEM
const setoresMontagem = [
  'montagem-emitido',
  'montagem-caixa',
  'colagem-moveis',
  'recolagem-moveis',
  'instalacao-teto',
  'instalacao-apoios',
  'instalacao-porta',
  'pintura-acabamento'
];

// SETORES GRC
const setoresGrc = ['grc-emitido', 'grc-forma', 'grc-concretagem', 'grc-concluido'];

let celasMontagem = [];
let modulosFastFlax = [];
let itensManuaisTemp = [];

// COMPONENTES PRÉ-DEFINIDOS (para exibição em obra)
const componentesCela = [
  { id: 'parede-direita', nome: 'Parede Direita', tipo: 'CAD' },
  { id: 'parede-esquerda', nome: 'Parede Esquerda', tipo: 'CAD' },
  { id: 'porta', nome: 'Porta', tipo: 'CAD' },
  { id: 'parede-janela', nome: 'Parede Janela', tipo: 'CAD' },
  { id: 'piso', nome: 'Piso', tipo: 'CAD' },
  { id: 'teto', nome: 'Teto', tipo: 'CAD' },
  { id: 'moldura', nome: 'Moldura', tipo: 'CAD' },
  { id: 'apoio', nome: 'Apoio', tipo: 'CAD' },
  { id: 'vaso', nome: 'Vaso', tipo: 'CAD' },
  { id: 'kit-moveis', nome: 'Kit Móveis', tipo: 'GRC' }
];

const componentesPassarela = [
  { id: 'parede-janela', nome: 'Parede Janela', tipo: 'CAD' },
  { id: 'parede-lisa', nome: 'Parede Lisa', tipo: 'CAD' },
  { id: 'teto', nome: 'Teto', tipo: 'CAD' },
  { id: 'piso', nome: 'Piso', tipo: 'CAD' },
  { id: 'moldura', nome: 'Moldura', tipo: 'CAD' },
  { id: 'capa', nome: 'Capa', tipo: 'GRC' }
];

// DATA
function atualizarData() {
  const now = new Date();
  document.getElementById('dataAtual').textContent = now.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });
}

// MENU
function setupMenu() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const section = link.dataset.section;
      document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active-section'));

      const sectionMap = {
        'obra': 'obra-section',
        'kanban-montagem': 'kanban-montagem-section',
        'kanban-cad': 'kanban-cad-section',
        'kanban-grc': 'kanban-grc-section',
        'etiquetas': 'etiquetas-section',
        'modulos': 'modulos-section',
        'produtos': 'produtos-section',
        'dashboard': 'dashboard-section',
        'scanner': 'scanner-section'
      };
      
      const subtitles = {
        'obra': 'Gestão de Obra',
        'kanban-montagem': 'Kanban de Montagem',
        'kanban-cad': 'Kanban CAD',
        'kanban-grc': 'Kanban GRC',
        'etiquetas': 'Etiquetas para Impressão',
        'modulos': 'Módulos FastFlax',
        'produtos': 'Cadastro de Produtos',
        'dashboard': 'Visão Geral',
        'scanner': 'Leitor de QR Code'
      };
      document.getElementById('headerSubtitle').textContent = subtitles[section] || 'Gestão de Obra';

      const targetId = sectionMap[section] || 'obra-section';
      document.getElementById(targetId).classList.add('active-section');

      if (section === 'dashboard') atualizarDashboard();
      if (section === 'kanban-montagem') renderizarMontagem();
      if (section === 'kanban-cad') renderizarKanbanCAD();
      if (section === 'kanban-grc') renderizarKanbanGRC();
      if (section === 'etiquetas') renderizarEtiquetas();
      if (section === 'modulos') renderizarModulos();
      if (section === 'produtos') renderizarProdutos();
      if (section === 'obra' && obraAtual) mostrarDetalhesObra(obraAtual.id);
    });
  });
}

// ABREVIATURAS
function getAbreviacaoTipo(tipo) {
  const map = {
    'Parede Direita': 'PAR-DIR',
    'Parede Esquerda': 'PAR-ESQ',
    'Parede Porta': 'PAR-POR',
    'Parede Janela': 'PAR-JAN',
    'Parede Lisa': 'PAR-LIS',
    'Piso': 'PIS',
    'Teto': 'TET',
    'Moldura': 'MOL',
    'Apoio': 'APO',
    'Vaso': 'VAS',
    'Kit Móveis': 'KIT',
    'Capa': 'CAP',
    'Porta': 'POR'
  };
  return map[tipo] || 'GEN';
}

function isPorta(tipoPeca) {
  return tipoPeca === 'Porta';
}

function getSetoresParaItem(tipoPeca) {
  return isPorta(tipoPeca) ? setores : setores;
}

// GERADORES DE CÓDIGO
function gerarCodigoEmissao(tipoPeca) {
  const abrev = getAbreviacaoTipo(tipoPeca);
  const count = itensProducao.filter(i => i.tipoPeca === tipoPeca).length + 1;
  return `DBN-${abrev}-${String(count).padStart(3, '0')}`;
}

function gerarCodigoSerralheria(tipoProduto) {
  const prefixo = tipoProduto === 'Armação' ? 'ARM' : 'POR';
  const count = itensProducao.filter(i => i.tipoProduto === tipoProduto).length + 1;
  return `DBN-SER-${prefixo}-${String(count).padStart(3, '0')}`;
}

function gerarCodigoForma(formaNumero) {
  const count = itensProducao.filter(i => i.formaNumero === formaNumero).length + 1;
  return `DBN-FORMA-${formaNumero}-${String(count).padStart(3, '0')}`;
}

function gerarCodigoConcretagem() {
  const count = itensProducao.filter(i => i.codigoConcretagem).length + 1;
  return `DBN-CONC-${String(count).padStart(3, '0')}`;
}

function gerarCodigoObra() {
  const count = obras.length + 1;
  return `OBRA-${String(count).padStart(3, '0')}`;
}

function gerarCodigoUnidade(tipo) {
  const prefixo = tipo === 'cela' ? 'CELA' : 'PASS';
  const count = unidadesMontadas.filter(u => u.tipo === tipo).length + 1;
  return `DBN-${prefixo}-${String(count).padStart(3, '0')}`;
}

// OBRA FUNCTIONS
function criarObra() {
  const nome = document.getElementById('obraNome').value.trim();
  const tipoCela = document.getElementById('obraTipoCela').value;
  const tipoPassarela = document.getElementById('obraTipoPassarela').value;
  const qtdCelasInput = document.getElementById('obraQtdCelas').value;
  const qtdPassarelasInput = document.getElementById('obraQtdPassarelas').value;
  
  const qtdCelas = parseInt(qtdCelasInput) || 0;
  const qtdPassarelas = parseInt(qtdPassarelasInput) || 0;

  if (!nome) { alert('⚠️ Informe o nome da obra!'); return; }
  if (!tipoCela) { alert('⚠️ Selecione o Tipo de Cela!'); return; }
  if (!qtdCelasInput || qtdCelas <= 0) { alert('⚠️ Informe a Quantidade de Celas (mínimo 1)!'); return; }
  if (qtdPassarelas > 0 && !tipoPassarela) { alert('⚠️ Selecione o Tipo de Passarela!'); return; }
  if (!qtdPassarelasInput || qtdPassarelas < 0) { alert('⚠️ Informe a Quantidade de Passarelas!'); return; }

  const obra = {
    id: gerarCodigoObra(),
    nome,
    tipoCela,
    tipoPassarela,
    qtdCelas,
    qtdPassarelas,
    dataCriacao: new Date().toLocaleString('pt-BR'),
    celasMontadas: 0,
    passarelasMontadas: 0,
    celasAdicionadas: [],
    passarelasAdicionadas: [],
    status: 'ativa'
  };

  obras.push(obra);
  
  const celaSelecionada = produtos.find(p => p.id === tipoCela);
  let totalCelasMontagem = 0, totalParedesCad = 0, totalKitsGrc = 0;
  
  if (celaSelecionada) {
    for (let c = 0; c < qtdCelas; c++) {
      const celaId = `${celaSelecionada.codigo}-${obra.id}-${Date.now()}-${c}`;
      criarCelaMontagem(celaSelecionada, celaId, obra.nome);
      totalCelasMontagem++;
      totalParedesCad += criarApenasParedesCad(celaSelecionada, celaId, obra.id, obra.nome);
      if (criarKitMoveisGrc(celaId, obra.id, obra.nome, c)) totalKitsGrc++;
      if (!obra.celasAdicionadas) obra.celasAdicionadas = [];
      obra.celasAdicionadas.push({
        celaId, celaCodigo: celaSelecionada.codigo, celaNome: celaSelecionada.nome,
        quantidade: 1, dataAdicao: new Date().toLocaleString('pt-BR')
      });
    }
  }
  
  salvar();
  renderizarObras();
  renderizarKanbanCAD();
  renderizarMontagem();
  renderizarKanbanGRC();

  document.getElementById('obraNome').value = '';
  document.getElementById('obraTipoCela').value = '';
  document.getElementById('obraTipoPassarela').value = '';
  document.getElementById('obraQtdCelas').value = '0';
  document.getElementById('obraQtdPassarelas').value = '0';

  alert(`✅ ${obra.id} criada!\n📦 ${totalCelasMontagem} Celas\n🧱 ${totalParedesCad} Paredes\n🏛️ ${totalKitsGrc} Kits Móveis`);
}

function renderizarObras() {
  const container = document.getElementById('obrasLista');
  const panelCriar = document.getElementById('panelCriarObra');

  const tipoCelaSelect = document.getElementById('obraTipoCela');
  if (tipoCelaSelect) {
    const celasDisponiveis = produtos.filter(p => p.tipo === 'cela');
    tipoCelaSelect.innerHTML = '<option value="">Selecione uma cela...</option>' + 
      celasDisponiveis.map(c => `<option value="${c.id}">📦 ${c.nome} (${c.codigo})</option>`).join('');
  }
  
  const tipoPassarelaSelect = document.getElementById('obraTipoPassarela');
  if (tipoPassarelaSelect) {
    const passarelasDisponiveis = produtos.filter(p => p.tipo === 'passarela');
    tipoPassarelaSelect.innerHTML = '<option value="">Nenhuma (ou selecione...)</option>' + 
      passarelasDisponiveis.map(p => `<option value="${p.id}">🌉 ${p.nome} (${p.codigo})</option>`).join('');
  }

  if (obras.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏗️</div><p>Nenhuma obra cadastrada</p></div>';
    panelCriar.style.display = 'block';
    return;
  }

  panelCriar.style.display = 'none';
  container.innerHTML = obras.map(obra => {
    const celasAdicionadas = obra.celasAdicionadas?.length || 0;
    const progressoCelas = obra.qtdCelas > 0 ? Math.round((celasAdicionadas / obra.qtdCelas) * 100) : 0;
    const progressoPassarelas = obra.qtdPassarelas > 0 ? Math.round((obra.passarelasMontadas / obra.qtdPassarelas) * 100) : 0;

    return `
      <div class="obra-card" onclick="mostrarDetalhesObra('${obra.id}')">
        <div class="obra-card-header"><h3>${obra.id} - ${obra.nome}</h3><span class="obra-status ${obra.status}">${obra.status.toUpperCase()}</span></div>
        <div class="obra-card-info"><span>📦 ${celasAdicionadas}/${obra.qtdCelas} Celas</span><span>🌉 ${obra.passarelasMontadas}/${obra.qtdPassarelas} Passarelas</span></div>
        <div class="obra-card-progress"><div class="progress-mini"><div class="progress-fill" style="width: ${progressoCelas}%"></div></div><div class="progress-mini"><div class="progress-fill" style="width: ${progressoPassarelas}%"></div></div></div>
        <div class="obra-card-date">📅 ${obra.dataCriacao}</div>
      </div>
    `;
  }).join('');
}

function mostrarDetalhesObra(obraId) {
  obraAtual = obras.find(o => o.id === obraId);
  if (!obraAtual) return;

  document.getElementById('panelCriarObra').style.display = 'none';
  document.getElementById('obrasLista').style.display = 'none';
  document.getElementById('obraDetalhes').style.display = 'block';

  document.getElementById('obraTitulo').textContent = `${obraAtual.id} - ${obraAtual.nome}`;
  document.getElementById('obraTotalCelas').textContent = obraAtual.qtdCelas;
  document.getElementById('obraTotalPassarelas').textContent = obraAtual.qtdPassarelas;

  atualizarProgressoObra();
  mostrarComponentes('celas');
}

function adicionarCelaNaObra() {
  if (!obraAtual) { alert('⚠️ Selecione uma obra primeiro!'); return; }
  const celasDisponiveis = produtos.filter(p => p.tipo === 'cela');
  if (celasDisponiveis.length === 0) { alert('⚠️ Nenhuma cela cadastrada!'); return; }
  const celaSelecionada = produtos.find(p => p.id === obraAtual.tipoCela);
  if (!celaSelecionada) { alert('⚠️ Tipo de cela da obra não encontrado!'); return; }
  
  const qtdRestante = obraAtual.qtdCelas - (obraAtual.celasAdicionadas?.length || 0);
  if (qtdRestante <= 0) { alert('⚠️ Todas as celas já foram adicionadas!'); return; }
  
  const qtdInput = prompt(`📦 Quantas unidades?\n${celaSelecionada.nome}\nRestantes: ${qtdRestante}`, '1');
  if (qtdInput === null) return;
  const quantidade = parseInt(qtdInput) || 0;
  if (quantidade <= 0 || quantidade > qtdRestante) { alert(`⚠️ Quantidade inválida (máx ${qtdRestante})`); return; }
  
  let componentesCriados = 0;
  for (let c = 0; c < quantidade; c++) {
    const celaId = `${celaSelecionada.codigo}-${obraAtual.id}-${Date.now()}-${c}`;
    criarComponentesDaCela(celaSelecionada, celaId, obraAtual.id, 1, obraAtual.nome);
    componentesCriados += contarComponentesCela(celaSelecionada);
  }
  if (!obraAtual.celasAdicionadas) obraAtual.celasAdicionadas = [];
  obraAtual.celasAdicionadas.push({
    celaId: `${celaSelecionada.codigo}-${obraAtual.id}-${Date.now()}-${quantidade-1}`,
    celaCodigo: celaSelecionada.codigo, celaNome: celaSelecionada.nome,
    quantidade, dataAdicao: new Date().toLocaleString('pt-BR')
  });
  salvar();
  atualizarProgressoObra();
  renderizarObras();
  alert(`✅ ${quantidade}x ${celaSelecionada.nome} adicionada(s)!\n${componentesCriados} componentes criados.`);
}

function adicionarPassarelaNaObra() {
  if (!obraAtual) { alert('⚠️ Selecione uma obra primeiro!'); return; }
  if (!obraAtual.tipoPassarela) { alert('⚠️ Esta obra não tem Tipo de Passarela definido!'); return; }
  const passarelasDisponiveis = produtos.filter(p => p.tipo === 'passarela');
  if (passarelasDisponiveis.length === 0) { alert('⚠️ Nenhuma passarela cadastrada!'); return; }
  const passarelaSelecionada = produtos.find(p => p.id === obraAtual.tipoPassarela);
  if (!passarelaSelecionada) { alert('⚠️ Tipo de passarela da obra não encontrado!'); return; }
  
  const qtdRestante = obraAtual.qtdPassarelas - (obraAtual.passarelasAdicionadas?.length || 0);
  if (qtdRestante <= 0) { alert('⚠️ Todas as passarelas já foram adicionadas!'); return; }
  const qtdInput = prompt(`🌉 Quantas unidades?\n${passarelaSelecionada.nome}\nRestantes: ${qtdRestante}`, '1');
  if (qtdInput === null) return;
  const quantidade = parseInt(qtdInput) || 0;
  if (quantidade <= 0 || quantidade > qtdRestante) { alert(`⚠️ Quantidade inválida (máx ${qtdRestante})`); return; }
  
  let componentesCriados = 0;
  for (let p = 0; p < quantidade; p++) {
    const passarelaId = `${passarelaSelecionada.codigo}-${obraAtual.id}-${Date.now()}-${p}`;
    criarComponentesDaCela(passarelaSelecionada, passarelaId, obraAtual.id, 1, obraAtual.nome);
    componentesCriados += contarComponentesCela(passarelaSelecionada);
  }
  if (!obraAtual.passarelasAdicionadas) obraAtual.passarelasAdicionadas = [];
  obraAtual.passarelasAdicionadas.push({
    passarelaId: `${passarelaSelecionada.codigo}-${obraAtual.id}-${Date.now()}-${quantidade-1}`,
    passarelaCodigo: passarelaSelecionada.codigo, passarelaNome: passarelaSelecionada.nome,
    quantidade, dataAdicao: new Date().toLocaleString('pt-BR')
  });
  salvar();
  atualizarProgressoObra();
  renderizarObras();
  alert(`✅ ${quantidade}x ${passarelaSelecionada.nome} adicionada(s)!\n${componentesCriados} componentes criados.`);
}

function criarComponentesDaCela(cela, celaId, obraId, multiplicador = 1, obraNome = null) {
  if (!cela.componentes || cela.componentes.length === 0) return 0;
  let totalCriados = 0;
  const dataEmissao = new Date();
  
  function expandirComponente(comp, nivel = 0, paiNome = null) {
    if (comp.tipo === 'parede' && comp.produtoId) {
      const parede = produtos.find(p => p.id === comp.produtoId);
      if (parede && parede.componentes) {
        parede.componentes.forEach(compFilho => expandirComponente(compFilho, nivel + 1, parede.nome));
      }
    } else {
      const qtdFinal = (comp.quantidade || 1) * multiplicador;
      const nomeComPai = paiNome ? `${comp.nome} (para ${paiNome})` : comp.nome;
      criarItemKanban({ ...comp, quantidade: qtdFinal, nome: nomeComPai }, celaId, obraId, dataEmissao, paiNome, obraNome);
      totalCriados++;
    }
  }
  
  cela.componentes.forEach(comp => expandirComponente(comp, 0, null));
  return totalCriados;
}

function criarItemKanban(comp, celaId, obraId, dataEmissao, paredeNome = null, obraNome = null, ehParede = false, ehGrc = false) {
  const codigoEmissao = gerarCodigoEmissao(comp.nome || comp.tipo);
  const observacao = obraNome ? `Obra: ${obraNome} - ${celaId}${paredeNome ? ` (${paredeNome})` : ''}` : `Criado automaticamente para ${celaId}`;
  
  const item = {
    id: codigoEmissao, codigoEmissao, codigoSerralheria: null, codigoForma: null, codigoConcretagem: null,
    tipoPeca: comp.nome || comp.tipo, tipoProduto: null, formaNumero: null, quantidade: comp.quantidade || 1,
    celaVinculada: celaId, obraVinculada: obraId, paredeNome, obraNome,
    responsavelEmissao: obraNome || `Obra ${obraId}`, dataEmissao: dataEmissao.toLocaleString('pt-BR'),
    dataEmissaoISO: dataEmissao.toISOString(), setorAtual: 'emitido', statusSerralheria: null,
    usadoEmUnidade: false, unidadeVinculada: null, ehParede, ehGrc, selecionadoParaMontagem: false,
    historico: [{ setor: 'emitido', dataHora: dataEmissao.toLocaleString('pt-BR'), observacoes: observacao, responsavel: obraNome || `Obra ${obraId}`, automatico: true }]
  };
  itensProducao.push(item);
  return item;
}

function contarComponentesCela(cela) {
  let total = 0;
  cela.componentes.forEach(comp => {
    if (comp.tipo === 'parede' && comp.produtoId) {
      const parede = produtos.find(p => p.id === comp.produtoId);
      if (parede && parede.componentes) total += parede.componentes.length * comp.quantidade;
    } else total++;
  });
  return total;
}

function atualizarProgressoObra() {
  const celasAdicionadas = obraAtual.celasAdicionadas?.length || 0;
  const passarelasAdicionadas = obraAtual.passarelasAdicionadas?.length || 0;
  const progressoCelas = obraAtual.qtdCelas > 0 ? (celasAdicionadas / obraAtual.qtdCelas) * 100 : 0;
  const progressoPassarelas = obraAtual.qtdPassarelas > 0 ? (passarelasAdicionadas / obraAtual.qtdPassarelas) * 100 : 0;
  document.getElementById('progressoCelas').style.width = `${progressoCelas}%`;
  document.getElementById('progressoCelasValor').textContent = `${Math.round(progressoCelas)}%`;
  document.getElementById('progressoPassarelas').style.width = `${progressoPassarelas}%`;
  document.getElementById('progressoPassarelasValor').textContent = `${Math.round(progressoPassarelas)}%`;
  renderizarCelasAdicionadas();
  renderizarPassarelasAdicionadas();
}

function renderizarPassarelasAdicionadas() {
  const container = document.getElementById('passarelasAdicionadasGrid');
  if (!container) return;
  const passarelasAdicionadas = obraAtual.passarelasAdicionadas || [];
  if (passarelasAdicionadas.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🌉</div><p>Nenhuma passarela adicionada</p></div>';
    return;
  }
  const passarelasPorTipo = {};
  passarelasAdicionadas.forEach(p => {
    if (!passarelasPorTipo[p.passarelaNome]) passarelasPorTipo[p.passarelaNome] = { ...p, totalQtd: 0 };
    passarelasPorTipo[p.passarelaNome].totalQtd += p.quantidade;
  });
  container.innerHTML = Object.entries(passarelasPorTipo).map(([nome, dados]) => `
    <div class="cela-adicionada-card"><div class="cela-adicionada-header"><span class="cela-adicionada-nome">${nome}</span><span class="cela-adicionada-qtd">${dados.totalQtd} un</span></div>
    <div class="cela-adicionada-info"><span>🔖 ${dados.passarelaCodigo}</span><span>🧩 ~${(produtos.find(p => p.codigo === dados.passarelaCodigo)?.componentes?.length || 0) * dados.totalQtd} componentes</span></div>
    <div class="cela-adicionada-data">📅 Adicionada: ${dados.dataAdicao}</div></div>
  `).join('');
}

function renderizarCelasAdicionadas() {
  const container = document.getElementById('celasAdicionadasGrid');
  if (!container) return;
  const celasAdicionadas = obraAtual.celasAdicionadas || [];
  if (celasAdicionadas.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><p>Nenhuma cela adicionada</p></div>';
    return;
  }
  const celasPorTipo = {};
  celasAdicionadas.forEach(c => {
    if (!celasPorTipo[c.celaNome]) celasPorTipo[c.celaNome] = { ...c, totalQtd: 0 };
    celasPorTipo[c.celaNome].totalQtd += c.quantidade;
  });
  container.innerHTML = Object.entries(celasPorTipo).map(([nome, dados]) => `
    <div class="cela-adicionada-card"><div class="cela-adicionada-header"><span class="cela-adicionada-nome">${nome}</span><span class="cela-adicionada-qtd">${dados.totalQtd} un</span></div>
    <div class="cela-adicionada-info"><span>🔖 ${dados.celaCodigo}</span><span>🧩 ~${(produtos.find(p => p.codigo === dados.celaCodigo)?.componentes?.length || 0) * dados.totalQtd} componentes</span></div>
    <div class="cela-adicionada-data">📅 Adicionada: ${dados.dataAdicao}</div></div>
  `).join('');
}

function voltarParaObras() {
  document.getElementById('obraDetalhes').style.display = 'none';
  document.getElementById('obrasLista').style.display = 'block';
  document.getElementById('panelCriarObra').style.display = 'block';
  obraAtual = null;
  renderizarObras();
}

function mostrarComponentes(tipo) {
  const componentes = tipo === 'celas' ? componentesCela : componentesPassarela;
  const qtdTotal = tipo === 'celas' ? obraAtual.qtdCelas : obraAtual.qtdPassarelas;
  const grid = document.getElementById('componentesGrid');
  if (!grid) return;
  grid.innerHTML = componentes.map(comp => {
    const qtdConcluidos = itensProducao.filter(i => i.tipoPeca === comp.nome && i.setorAtual === 'concluido' && !i.usadoEmUnidade).length;
    const progresso = qtdTotal > 0 ? Math.round((qtdConcluidos / qtdTotal) * 100) : 0;
    return `<div class="componente-card"><div class="componente-header"><span class="componente-nome">${comp.nome}</span><span class="componente-tipo">${comp.tipo}</span></div>
    <div class="componente-info"><span>📦 Necessários: ${qtdTotal}</span><span>✅ Concluídos: ${qtdConcluidos}</span></div>
    <div class="componente-progresso"><div class="progress-bar"><div class="progress-fill" style="width: ${progresso}%"></div></div><span class="progress-value">${progresso}%</span></div></div>`;
  }).join('');
}

// PRODUTOS
function gerarCodigoProduto() { return `PROD-${String(produtos.length + 1).padStart(3, '0')}`; }
function gerarCodigoComponenteBasico() { return `COMP-${String(componentesBasicos.length + 1).padStart(3, '0')}`; }

function filtrarProdutos(filtro) {
  filtroProdutoAtual = filtro;
  document.querySelectorAll('.produtos-filtros .filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  renderizarProdutos();
}

function buscarProduto() {
  const busca = document.getElementById('buscaProduto')?.value.toLowerCase() || '';
  document.querySelectorAll('.produto-card').forEach(card => {
    card.style.display = card.textContent.toLowerCase().includes(busca) ? 'block' : 'none';
  });
}

function abrirModalNovoItem() { document.getElementById('modalNovoItem').style.display = 'flex'; }
function fecharModalNovoItem() { document.getElementById('modalNovoItem').style.display = 'none'; }

function selecionarTipoItem(tipo) {
  fecharModalNovoItem();
  setTimeout(() => {
    if (tipo === 'componente') {
      document.getElementById('modalCadastroComponente').style.display = 'flex';
      document.getElementById('cadCompNome').focus();
    } else {
      document.getElementById('modalCadastroProduto').style.display = 'flex';
      const titulos = { 'cela': '📦 Nova Cela', 'passarela': '🌉 Nova Passarela', 'parede': '🧱 Nova Parede' };
      document.getElementById('tituloCadastroProduto').textContent = titulos[tipo] || '📦 Novo Produto';
      document.getElementById('cadProdutoNome').value = '';
      document.getElementById('cadProdutoCodigo').value = gerarCodigoProduto();
      document.getElementById('cadProdutoDescricao').value = '';
      produtoAtual = { tipo };
    }
  }, 150);
}

function fecharModalCadastroProduto() { document.getElementById('modalCadastroProduto').style.display = 'none'; produtoAtual = null; }
function fecharModalCadastroComponente() { document.getElementById('modalCadastroComponente').style.display = 'none'; }

function salvarProdutoDoModal() {
  const nome = document.getElementById('cadProdutoNome').value.trim();
  const codigo = document.getElementById('cadProdutoCodigo').value.trim();
  const descricao = document.getElementById('cadProdutoDescricao').value.trim();
  const tipo = produtoAtual?.tipo || 'cela';
  if (!nome || !codigo) { alert('Preencha Nome e Código!'); return; }
  if (produtos.find(p => p.codigo === codigo)) { alert('Código já existe!'); return; }
  produtos.push({ id: gerarCodigoProduto(), codigo, nome, tipo, descricao, dataCriacao: new Date().toLocaleString('pt-BR'), componentes: [], status: 'ativo' });
  salvar();
  renderizarProdutos();
  fecharModalCadastroProduto();
  alert(`✅ ${tipo === 'cela' ? 'Cela' : 'Produto'} criado!`);
}

function salvarComponenteDoModal() {
  const nome = document.getElementById('cadCompNome').value.trim();
  const codigo = document.getElementById('cadCompCodigo').value.trim();
  const unidade = document.getElementById('cadCompUnidade').value;
  const categoria = document.getElementById('cadCompCategoria').value;
  if (!nome || !codigo) { alert('Preencha Nome e Código!'); return; }
  if (componentesBasicos.find(c => c.codigo === codigo)) { alert('Código já existe!'); return; }
  componentesBasicos.push({ id: gerarCodigoComponenteBasico(), codigo, nome, unidade, categoria, dataCriacao: new Date().toLocaleString('pt-BR') });
  salvar();
  renderizarComponentesBasicos();
  fecharModalCadastroComponente();
  alert(`✅ Componente cadastrado!`);
}

function renderizarProdutos() {
  const container = document.getElementById('produtosLista');
  if (!container) return;
  let produtosFiltrados = produtos;
  if (filtroProdutoAtual !== 'todos') produtosFiltrados = produtos.filter(p => p.tipo === filtroProdutoAtual);
  document.getElementById('produtosCount').textContent = `${produtosFiltrados.length} produto(s)`;
  if (produtosFiltrados.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><p>Nenhum produto cadastrado</p></div>';
    return;
  }
  const tipoLabels = { 'cela': '📦 CELA', 'passarela': '🌉 PASSARELA', 'parede': '🧱 PAREDE', 'componente': '🔩 COMPONENTE', 'outro': '📋 OUTRO' };
  container.innerHTML = produtosFiltrados.map(p => `
    <div class="produto-card" onclick="abrirProduto('${p.id}')">
      <div class="produto-card-top"><div class="produto-card-title"><span class="produto-card-codigo">${p.codigo}</span><span class="produto-card-nome">${p.nome}</span></div><span class="produto-card-badge">${tipoLabels[p.tipo] || 'PRODUTO'}</span></div>
      <div class="produto-card-stats"><div class="stat-item"><span class="stat-icon">🧩</span><span class="stat-label">${p.componentes?.length || 0} componente(s)</span></div><div class="stat-item"><span class="stat-icon">📅</span><span class="stat-label">${new Date(p.dataCriacao).toLocaleDateString('pt-BR')}</span></div></div>
      <div class="produto-card-status-bar ${p.status || 'ativo'}"><span class="status-text">${(p.status || 'ativo').toUpperCase()}</span></div>
      <div class="produto-card-hover"><span>Clique para editar</span></div>
    </div>
  `).join('');
  renderizarComponentesBasicos();
}

function abrirProduto(produtoId) {
  produtoAtual = produtos.find(p => p.id === produtoId);
  if (!produtoAtual) return;
  document.querySelector('#produtosLista').parentElement.style.display = 'none';
  document.querySelector('#componentesBasicosLista').parentElement.style.display = 'none';
  document.getElementById('produtoDetalhesPanel').style.display = 'block';
  document.getElementById('produtoDetalhesNome').textContent = produtoAtual.nome;
  document.getElementById('produtoDetalhesCodigo').textContent = produtoAtual.codigo;
  document.getElementById('produtoDetalhesTipo').textContent = produtoAtual.tipo.toUpperCase();
  mostrarAbaProduto('componentes');
}

function voltarParaProdutos() {
  document.getElementById('produtoDetalhesPanel').style.display = 'none';
  document.querySelector('#produtosLista').parentElement.style.display = 'block';
  document.querySelector('#componentesBasicosLista').parentElement.style.display = 'block';
  produtoAtual = null;
  renderizarProdutos();
}

function editarProdutoAtual() {
  if (!produtoAtual) return;
  const novoNome = prompt('Novo nome:', produtoAtual.nome);
  if (!novoNome) return;
  const novoCodigo = prompt('Novo código:', produtoAtual.codigo);
  if (!novoCodigo) return;
  if (produtos.find(p => p.codigo === novoCodigo && p.id !== produtoAtual.id)) { alert('Código já existe!'); return; }
  produtoAtual.nome = novoNome.trim();
  produtoAtual.codigo = novoCodigo.trim();
  salvar();
  document.getElementById('produtoDetalhesNome').textContent = produtoAtual.nome;
  document.getElementById('produtoDetalhesCodigo').textContent = produtoAtual.codigo;
  renderizarBOMTree();
  alert('Produto atualizado!');
}

function mostrarAbaProduto(aba) {
  document.querySelectorAll('.produto-aba-nova').forEach(a => a.style.display = 'none');
  document.querySelectorAll('.tab-btn-new').forEach(b => b.classList.remove('active'));
  const abaElement = document.getElementById(`aba-${aba}`);
  if (abaElement) abaElement.style.display = 'block';
  if (event && event.target) event.target.classList.add('active');
  if (aba === 'componentes') renderizarBOMTree();
  else if (aba === 'materiais') renderizarMateriaisProduto();
  else if (aba === 'producao') renderizarProducaoProduto();
}

function renderizarBOMTree() {
  const container = document.getElementById('bomTree');
  if (!produtoAtual || !produtoAtual.componentes || produtoAtual.componentes.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Nenhum componente adicionado</p></div>';
    return;
  }
  container.innerHTML = `<div class="bom-root"><div class="bom-item bom-root-item"><div class="bom-item-header" onclick="toggleBOMItem(this)"><span class="bom-toggle">📂</span><span class="bom-icon">📦</span><span class="bom-nome">${produtoAtual.nome}</span><span class="bom-codigo">${produtoAtual.codigo}</span><span class="bom-qtd">1 un</span></div><div class="bom-children">${renderizarFilhosBOM(produtoAtual.componentes, 1)}</div></div></div>`;
}

function renderizarFilhosBOM(componentes, nivel) {
  if (!componentes || componentes.length === 0) return '';
  return componentes.map((comp, idx) => {
    const ehParede = comp.tipo === 'parede';
    let filhosHTML = '';
    if (ehParede && comp.produtoId) {
      const paredeProduto = produtos.find(p => p.id === comp.produtoId);
      if (paredeProduto && paredeProduto.componentes && paredeProduto.componentes.length > 0) {
        filhosHTML = `<div class="bom-children">${renderizarFilhosBOM(paredeProduto.componentes, nivel + 1)}</div>`;
      }
    }
    const icone = ehParede ? '🧱' : '🔩';
    const badgeClass = ehParede ? 'bom-badge-parede' : 'bom-badge-componente';
    const badgeText = ehParede ? 'PAREDE' : 'COMP';
    return `<div class="bom-item bom-item-nivel-${nivel} ${ehParede && comp.produtoId ? 'bom-has-children' : ''}">
      <div class="bom-item-header" ${ehParede && comp.produtoId ? `onclick="toggleBOMItem(this)"` : ''}>
        ${ehParede && comp.produtoId ? '<span class="bom-toggle">📂</span>' : '<span class="bom-toggle-empty"></span>'}
        <span class="bom-icon">${icone}</span><span class="bom-nome">${comp.nome || comp.tipo}</span>
        ${comp.codigo ? `<span class="bom-codigo">${comp.codigo}</span>` : ''}
        <span class="bom-qtd">${comp.quantidade} ${comp.unidade || 'un'}</span>
        <span class="bom-badge ${badgeClass}">${badgeText}</span>
        <button class="bom-remove-btn" onclick="event.stopPropagation(); removerComponenteDoProduto(${idx}, ${nivel})">🗑️</button>
      </div>${filhosHTML}</div>`;
  }).join('');
}

function toggleBOMItem(header) {
  const item = header.parentElement;
  const children = item.querySelector('.bom-children');
  const toggle = header.querySelector('.bom-toggle');
  if (children) {
    children.classList.toggle('bom-children-collapsed');
    toggle.textContent = children.classList.contains('bom-children-collapsed') ? '📁' : '📂';
  }
}

function expandirTudo() {
  document.querySelectorAll('.bom-children').forEach(child => child.classList.remove('bom-children-collapsed'));
  document.querySelectorAll('.bom-toggle').forEach(toggle => toggle.textContent = '📂');
}

function recolherTudo() {
  document.querySelectorAll('.bom-children').forEach(child => child.classList.add('bom-children-collapsed'));
  document.querySelectorAll('.bom-toggle').forEach(toggle => toggle.textContent = '📁');
}

function adicionarComponente() {
  if (!produtoAtual) { alert('Selecione um produto!'); return; }
  document.getElementById('modalComponente').style.display = 'flex';
  document.getElementById('compTipo').value = '';
  document.getElementById('compQuantidade').value = '1';
  document.getElementById('compObservacoes').value = '';
  document.getElementById('compProdutoGroup').style.display = 'none';
  document.getElementById('compBasicoGroup').style.display = 'none';
}

function fecharModalComponente() { document.getElementById('modalComponente').style.display = 'none'; }

function confirmarComponente() {
  const tipoSelecao = document.getElementById('compTipo').value;
  const quantidade = parseInt(document.getElementById('compQuantidade').value) || 1;
  const observacoes = document.getElementById('compObservacoes').value.trim();
  if (!tipoSelecao) { alert('Selecione o tipo!'); return; }
  let componenteAdicionado = null;
  if (tipoSelecao === 'parede') {
    const produtoId = document.getElementById('compProdutoSelecionado').value;
    if (!produtoId) { alert('Selecione uma parede!'); return; }
    const parede = produtos.find(p => p.id === produtoId);
    componenteAdicionado = { tipo: 'parede', produtoId, nome: parede.nome, codigo: parede.codigo, quantidade, observacoes };
  } else if (tipoSelecao === 'componente') {
    const compId = document.getElementById('compBasicoSelecionado').value;
    if (!compId) { alert('Selecione um componente!'); return; }
    const comp = componentesBasicos.find(c => c.id === compId);
    componenteAdicionado = { tipo: 'componente', componenteId: compId, nome: comp.nome, codigo: comp.codigo, unidade: comp.unidade, quantidade, observacoes };
  }
  produtoAtual.componentes.push(componenteAdicionado);
  salvar();
  renderizarBOMTree();
  fecharModalComponente();
  alert(`✅ ${componenteAdicionado.nome} adicionado!`);
}

function removerComponenteDoProduto(idx, nivel) {
  if (!produtoAtual) return;
  const componente = produtoAtual.componentes[idx];
  if (!confirm(`Remover ${componente.nome || componente.tipo}?`)) return;
  produtoAtual.componentes.splice(idx, 1);
  salvar();
  renderizarBOMTree();
}

function atualizarComponentesDisponiveis() {
  const tipo = document.getElementById('compTipo').value;
  const produtoGroup = document.getElementById('compProdutoGroup');
  const basicoGroup = document.getElementById('compBasicoGroup');
  if (tipo === 'parede') {
    produtoGroup.style.display = 'block';
    basicoGroup.style.display = 'none';
    const paredes = produtos.filter(p => p.tipo === 'parede');
    const select = document.getElementById('compProdutoSelecionado');
    select.innerHTML = '<option value="">Selecione...</option>' + paredes.map(p => `<option value="${p.id}">${p.nome} (${p.codigo})</option>`).join('');
  } else if (tipo === 'componente') {
    produtoGroup.style.display = 'none';
    basicoGroup.style.display = 'block';
    const select = document.getElementById('compBasicoSelecionado');
    select.innerHTML = '<option value="">Selecione...</option>' + componentesBasicos.map(c => `<option value="${c.id}">${c.nome} (${c.codigo})</option>`).join('');
  } else {
    produtoGroup.style.display = 'none';
    basicoGroup.style.display = 'none';
  }
}

function renderizarMateriaisProduto() {
  const container = document.getElementById('materiaisResumo');
  if (!produtoAtual || !produtoAtual.componentes || produtoAtual.componentes.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Adicione componentes para ver os materiais</p></div>';
    return;
  }
  function getAllMaterials(componentes, multiplier = 1) {
    const materiais = {};
    componentes.forEach(comp => {
      const qtdTotal = comp.quantidade * multiplier;
      if (comp.tipo === 'parede' && comp.produtoId) {
        const paredeProduto = produtos.find(p => p.id === comp.produtoId);
        if (paredeProduto && paredeProduto.componentes) {
          const filhos = getAllMaterials(paredeProduto.componentes, qtdTotal);
          Object.entries(filhos).forEach(([nome, dados]) => {
            if (!materiais[nome]) materiais[nome] = { qtd: 0, unidade: dados.unidade };
            materiais[nome].qtd += dados.qtd;
          });
        }
      } else {
        const chave = comp.nome || comp.tipo;
        if (!materiais[chave]) materiais[chave] = { qtd: 0, unidade: comp.unidade || 'un' };
        materiais[chave].qtd += qtdTotal;
      }
    });
    return materiais;
  }
  const todos = getAllMaterials(produtoAtual.componentes);
  let html = `<div class="materiais-summary-card"><div class="materiais-summary-header"><h4>📊 Consumo Total de Materiais</h4></div><div class="materiais-grid">`;
  Object.entries(todos).forEach(([nome, dados]) => {
    html += `<div class="material-item material-total"><span class="material-nome">${nome}</span><span class="material-qtd">${dados.qtd} ${dados.unidade}</span></div>`;
  });
  html += `</div><div class="materiais-total"><strong>Total Geral:</strong> ${Object.values(todos).reduce((s, d) => s + d.qtd, 0)} unidades</div></div>`;
  container.innerHTML = html;
}

function renderizarProducaoProduto() {
  const container = document.getElementById('producaoHistorico');
  if (!produtoAtual) return;
  const unidadesDoProduto = unidadesMontadas.filter(u => (produtoAtual.tipo === 'cela' && u.tipo === 'cela') || (produtoAtual.tipo === 'passarela' && u.tipo === 'passarela'));
  if (unidadesDoProduto.length === 0) { container.innerHTML = '<div class="empty-state"><p>Nenhuma unidade produzida</p></div>'; return; }
  container.innerHTML = unidadesDoProduto.map(u => `<div class="producao-item"><span class="producao-cod">${u.codigoUnidade}</span><span class="producao-data">${u.dataMontagem}</span><span class="producao-status">${u.status}</span></div>`).join('');
}

// COMPONENTES BÁSICOS
function mostrarFormularioComponenteBasico() {
  document.getElementById('modalComponenteBasico').style.display = 'flex';
  document.getElementById('compBasicoNome').value = '';
  document.getElementById('compBasicoCodigo').value = gerarCodigoComponenteBasico();
}
function fecharModalComponenteBasico() { document.getElementById('modalComponenteBasico').style.display = 'none'; }
function salvarComponenteBasico() {
  const nome = document.getElementById('compBasicoNome').value.trim();
  const codigo = document.getElementById('compBasicoCodigo').value.trim();
  const unidade = document.getElementById('compBasicoUnidade').value;
  const categoria = document.getElementById('compBasicoCategoria').value;
  if (!nome || !codigo) { alert('Preencha Nome e Código!'); return; }
  componentesBasicos.push({ id: gerarCodigoComponenteBasico(), codigo, nome, unidade, categoria, dataCriacao: new Date().toLocaleString('pt-BR') });
  salvar();
  renderizarComponentesBasicos();
  fecharModalComponenteBasico();
  alert(`✅ Componente ${codigo} cadastrado!`);
}
function renderizarComponentesBasicos() {
  const container = document.getElementById('componentesBasicosLista');
  document.getElementById('componentesCount').textContent = `${componentesBasicos.length} componente(s)`;
  if (componentesBasicos.length === 0) { container.innerHTML = '<div class="empty-state"><p>Nenhum componente básico</p></div>'; return; }
  container.innerHTML = componentesBasicos.map(c => `<div class="componente-basico-card"><div class="comp-basico-header"><span class="comp-basico-codigo">${c.codigo}</span><span class="comp-basico-categoria">${c.categoria}</span></div><div class="comp-basico-nome">${c.nome}</div><div class="comp-basico-info"><span>📏 ${c.unidade}</span><span>📅 ${c.dataCriacao}</span></div><div class="comp-basico-actions"><button class="btn-small btn-danger" onclick="excluirComponenteBasico('${c.id}')">🗑️ Excluir</button></div></div>`).join('');
}
function excluirComponenteBasico(componenteId) {
  const comp = componentesBasicos.find(c => c.id === componenteId);
  if (!comp) return;
  if (!confirm(`Excluir "${comp.nome}"?`)) return;
  const produtosUsando = produtos.filter(p => p.componentes && p.componentes.some(c => c.componenteId === componenteId));
  if (produtosUsando.length > 0) { alert(`Componente usado em ${produtosUsando.length} produto(s).`); return; }
  componentesBasicos = componentesBasicos.filter(c => c.id !== componenteId);
  salvar();
  renderizarComponentesBasicos();
  renderizarProdutos();
  alert('Excluído!');
}

// KANBAN CAD
function renderizarKanbanCAD() {
  const itensCAD = itensProducao.filter(i => (i.ehParede === true || i.ehPiso === true) && i.ehGrc !== true && !i.tipoPeca.includes('Kit') && !i.codigoEmissao.startsWith('KIT-'));
  const setoresCad = ['emitido', 'forma', 'concretagem', 'concluido'];
  const board = document.getElementById('kanbanCadBoard');
  if (!board) return;
  board.innerHTML = setoresCad.map(setor => {
    const itensSetor = itensCAD.filter(i => i.setorAtual === setor);
    const count = itensSetor.length;
    return `<div class="kanban-column column-${setor}"><div class="column-header"><span class="column-icon">${setor === 'emitido' ? '🎫' : setor === 'forma' ? '🏗️' : setor === 'concretagem' ? '🧱' : '✅'}</span><h3>${setor.charAt(0).toUpperCase() + setor.slice(1)}</h3><span class="column-count">${count}</span></div><div class="column-body" id="kanbanCad-${setor}"></div></div>`;
  }).join('');
  setoresCad.forEach(setor => {
    const container = document.getElementById(`kanbanCad-${setor}`);
    const itensSetor = itensCAD.filter(i => i.setorAtual === setor);
    if (!container) return;
    if (itensSetor.length === 0) { container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>Nenhum item</p></div>'; return; }
    container.innerHTML = itensSetor.map(item => `
      <div class="kanban-card kanban-card-cad" onclick="verDetalhesItem('${item.id}')">
        <div class="kanban-card-codigo">${item.codigoEmissao}</div>
        <div class="kanban-card-tipo">${item.tipoPeca} ${item.ehPiso ? '🏛️' : '🧱'}</div>
        <div class="kanban-card-info">🏗️ ${item.obraNome || '-'}</div>
        <div class="kanban-card-info">📅 ${item.dataEmissao}</div>
        <div class="kanban-card-actions-cad">
          ${setor !== 'emitido' ? `<button class="btn-cad btn-cad-voltar" onclick="event.stopPropagation(); moverCAD('${item.id}', 'voltar')">⬅️</button>` : ''}
          ${setor !== 'concluido' ? `<button class="btn-cad btn-cad-avancar" onclick="event.stopPropagation(); moverCAD('${item.id}', 'avancar')">➡️</button>` : ''}
        </div>
      </div>
    `).join('');
  });
}

function moverCAD(itemId, direcao) {
  const item = itensProducao.find(i => i.id === itemId);
  if (!item || !(item.ehParede || item.ehPiso) || item.ehGrc) return;
  const setoresCad = ['emitido', 'forma', 'concretagem', 'concluido'];
  const indiceAtual = setoresCad.indexOf(item.setorAtual);
  let novoIndice = direcao === 'avancar' ? indiceAtual + 1 : indiceAtual - 1;
  if (novoIndice < 0 || novoIndice >= setoresCad.length) { alert('Não é possível mover!'); return; }
  item.setorAtual = setoresCad[novoIndice];
  item.historico.push({ setor: item.setorAtual, dataHora: new Date().toLocaleString('pt-BR'), observacoes: `Movido para ${item.setorAtual}`, responsavel: 'Usuário' });
  salvar();
  renderizarKanbanCAD();
  alert(`Item movido para ${item.setorAtual}`);
}

// KANBAN GRC
function renderizarKanbanGRC() {
  const itensGRC = itensProducao.filter(i => i.ehGrc === true);
  const setoresGrc = ['grc-emitido', 'grc-forma', 'grc-concretagem', 'grc-concluido'];
  const board = document.getElementById('kanbanGrcBoard');
  if (!board) return;
  board.innerHTML = setoresGrc.map(setor => {
    const itensSetor = itensGRC.filter(i => i.setorAtual === setor);
    const count = itensSetor.length;
    const nome = setor.replace('grc-', '').charAt(0).toUpperCase() + setor.replace('grc-', '').slice(1);
    return `<div class="kanban-column column-${setor}"><div class="column-header"><span class="column-icon">${setor.includes('emitido') ? '🎫' : setor.includes('forma') ? '🏗️' : setor.includes('concretagem') ? '🧱' : '✅'}</span><h3>${nome}</h3><span class="column-count">${count}</span></div><div class="column-body" id="kanbanGrc-${setor}"></div></div>`;
  }).join('');
  setoresGrc.forEach(setor => {
    const container = document.getElementById(`kanbanGrc-${setor}`);
    const itensSetor = itensGRC.filter(i => i.setorAtual === setor);
    if (!container) return;
    if (itensSetor.length === 0) { container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>Nenhum Kit</p></div>'; return; }
    container.innerHTML = itensSetor.map(item => `
      <div class="kanban-card kanban-card-grc">
        <div class="kanban-card-codigo">${item.codigoEmissao}</div>
        <div class="kanban-card-tipo">${item.tipoPeca}</div>
        <div class="kanban-card-info">🏗️ ${item.obraNome || '-'}</div>
        ${setor === 'grc-forma' && item.formaNumero ? `<div class="kanban-card-info">🏗️ Forma ${item.formaNumero}</div><div class="kanban-card-info">🧱 ${item.tipoConcreto || '-'}</div>` : ''}
        <div class="kanban-card-info">📅 ${item.dataEmissao}</div>
        ${item.kitMoveisConcluido ? '<div class="kanban-card-badge-grc">✅ Concluído</div>' : ''}
        <div class="kanban-card-actions-grc">
          ${setor !== 'grc-emitido' ? `<button class="btn-grc btn-grc-voltar" onclick="moverGRC('${item.id}', 'voltar')">⬅️</button>` : ''}
          ${setor !== 'grc-concluido' ? `<button class="btn-grc btn-grc-avancar" onclick="moverGRC('${item.id}', 'avancar')">➡️</button>` : ''}
        </div>
      </div>
    `).join('');
  });
}

function moverGRC(itemId, direcao) {
  const setoresGrc = ['grc-emitido', 'grc-forma', 'grc-concretagem', 'grc-concluido'];
  const item = itensProducao.find(i => i.id === itemId);
  if (!item || !item.ehGrc) return;
  const indiceAtual = setoresGrc.indexOf(item.setorAtual);
  let novoIndice = direcao === 'avancar' ? indiceAtual + 1 : indiceAtual - 1;
  if (novoIndice < 0 || novoIndice >= setoresGrc.length) { alert('Não é possível mover!'); return; }
  const novoSetor = setoresGrc[novoIndice];
  if (novoSetor === 'grc-forma' && direcao === 'avancar') {
    const numeroForma = prompt('Número da Forma (1-5):', '');
    if (!numeroForma || numeroForma < 1 || numeroForma > 5) { alert('Forma inválida!'); return; }
    const tipoConcreto = confirm('Concreto GRC 1? (Cancelar = GRC 2)') ? 'Concreto GRC 1' : 'Concreto GRC 2';
    item.formaNumero = parseInt(numeroForma);
    item.tipoConcreto = tipoConcreto;
  }
  item.setorAtual = novoSetor;
  item.historico.push({ setor: novoSetor, dataHora: new Date().toLocaleString('pt-BR'), observacoes: `Movido para ${novoSetor}`, responsavel: 'Usuário' });
  if (novoSetor === 'grc-concluido') item.kitMoveisConcluido = true;
  salvar();
  renderizarKanbanGRC();
  alert(`Kit movido para ${novoSetor}`);
}

// MONTAGEM - CELAS
function criarCelaMontagem(cela, celaId, obraNome) {
  const partesCodigo = cela.codigo.split('-');
  const tipoCela = partesCodigo[1] || 'MCC8P';
  const codigoCela = `DBN-${tipoCela}-${String(celasMontagem.filter(c => c.codigo && c.codigo.startsWith(`DBN-${tipoCela}-`)).length + 1).padStart(3, '0')}`;
  const novaCelaMontagem = {
    id: `MONT-${celaId}`, celaId, codigo: codigoCela, tipoCela, nome: cela.nome,
    descricao: cela.descricao || cela.nome, obraNome,
    setorAtual: 'montagem-emitido', dataInicio: new Date().toLocaleString('pt-BR'),
    paredesSelecionadas: [], paredesIds: [], paredesCodigos: [],
    historico: [{ setor: 'montagem-emitido', dataHora: new Date().toLocaleString('pt-BR'), observacoes: `Criada da obra ${obraNome}`, responsavel: 'Sistema' }]
  };
  celasMontagem.push(novaCelaMontagem);
  return novaCelaMontagem;
}

function criarApenasParedesCad(cela, celaId, obraId, obraNome) {
  if (!cela.componentes) return 0;
  let total = 0;
  cela.componentes.forEach(comp => {
    if (comp.tipo === 'parede' && comp.produtoId) {
      const parede = produtos.find(p => p.id === comp.produtoId);
      if (parede) {
        for (let i = 0; i < (comp.quantidade || 1); i++) {
          criarItemKanban({ nome: parede.nome, tipo: parede.nome, quantidade: 1, ehParede: true, ehGrc: false }, celaId, obraId, new Date(), null, obraNome, true, false);
          total++;
        }
      }
    }
  });
  return total;
}

function criarKitMoveisGrc(celaId, obraId, obraNome, celaIndex) {
  const tipoKit = celaId.includes('MCC8P') ? 'Kit Móveis 8P' : 'Kit Móveis 2P';
  const codigoPrefixo = tipoKit.includes('8P') ? 'KIT-8P' : 'KIT-2P';
  const dataEmissao = new Date();
  const codigoEmissao = `${codigoPrefixo}-${obraId}-${String(celaIndex).padStart(3, '0')}`;
  const itemGrc = {
    id: codigoEmissao, codigoEmissao, tipoPeca: tipoKit, quantidade: 1,
    celaVinculada: celaId, obraVinculada: obraId, obraNome,
    dataEmissao: dataEmissao.toLocaleString('pt-BR'), dataEmissaoISO: dataEmissao.toISOString(),
    setorAtual: 'grc-emitido', ehGrc: true, ehParede: false, ehPiso: false,
    kitMoveisConcluido: false, formaNumero: null, tipoConcreto: null,
    historico: [{ setor: 'grc-emitido', dataHora: dataEmissao.toLocaleString('pt-BR'), observacoes: 'Kit Móveis criado', responsavel: `Obra ${obraId}` }]
  };
  itensProducao.push(itemGrc);
  return itemGrc;
}

function renderizarMontagem() {
  const containerMap = {
    'montagem-emitido': 'kanbanMontagemEmitido',
    'montagem-caixa': 'kanbanMontagemCaixa',
    'colagem-moveis': 'kanbanColagemMoveis',
    'recolagem-moveis': 'kanbanRecolagemMoveis',
    'instalacao-apoios': 'kanbanInstalacaoApoios',
    'instalacao-teto': 'kanbanInstalacaoTeto',
    'instalacao-porta': 'kanbanInstalacaoPorta',
    'pintura-acabamento': 'kanbanPinturaAcabamento'
  };
  for (const setor of setoresMontagem) {
    const containerId = containerMap[setor];
    const container = document.getElementById(containerId);
    if (!container) continue;
    const itens = celasMontagem.filter(c => c.setorAtual === setor);
    const countEl = document.getElementById(`count${setor.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`);
    if (countEl) countEl.textContent = itens.length;
    if (itens.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>Nenhuma cela</p></div>';
      continue;
    }
    container.innerHTML = itens.map(cela => {
      const podeAvancar = podeAvancarMontagem(cela);
      const podeVoltar = setoresMontagem.indexOf(cela.setorAtual) > 0;
      return `
        <div class="kanban-card kanban-card-montagem" draggable="true" ondragstart="dragStartCela(event, '${cela.id}')" ondragend="dragEndCela(event)">
          <div class="kanban-card-codigo-grande">${cela.codigo}</div>
          <div class="kanban-card-tipo">${cela.nome}</div>
          ${setor === 'montagem-caixa' ? `<div class="kanban-card-selecao-paredes"><button class="btn-selecionar-paredes" onclick="event.stopPropagation(); selecionarParedesParaCela('${cela.id}')">🧱 Selecionar Paredes (${cela.paredesSelecionadas?.length || 0}/5)</button></div>` : ''}
          <div class="kanban-card-actions-montagem">
            <button class="btn-rastreio" onclick="event.stopPropagation(); verRastreamentoCela('${cela.id}')">📋</button>
            ${podeVoltar ? `<button class="btn-voltar" onclick="event.stopPropagation(); voltarMontagemCela('${cela.id}')">⬅️</button>` : ''}
            ${podeAvancar ? `<button class="btn-avancar" onclick="event.stopPropagation(); avancarMontagemCela('${cela.id}')">➡️</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
}

function podeAvancarMontagem(cela) {
  if (cela.setorAtual === 'montagem-caixa') {
    if (!cela.paredesSelecionadas || cela.paredesSelecionadas.length < 5) return false;
    const temTodas = ['Parede Direita', 'Parede Esquerda', 'Parede Janela', 'Parede Porta', 'Piso'].every(p => cela.paredesSelecionadas.includes(p));
    if (!temTodas) return false;
    const kitConcluido = kitMoveisConcluidoParaCela(cela.celaId);
    return !!kitConcluido;
  }
  if (cela.setorAtual === 'colagem-moveis') {
    const kit = getKitMoveisDaCela(cela.celaId);
    return kit && kit.setorAtual === 'grc-concluido' && kit.kitMoveisConcluido;
  }
  return true;
}

function getKitMoveisDaCela(celaId) {
  return itensProducao.find(i => i.ehGrc && i.celaVinculada === celaId && (i.tipoPeca === 'Kit Móveis 8P' || i.tipoPeca === 'Kit Móveis 2P'));
}

function kitMoveisConcluidoParaCela(celaId) {
  const kit = getKitMoveisDaCela(celaId);
  return kit && kit.kitMoveisConcluido && kit.setorAtual === 'grc-concluido';
}

function selecionarParedesParaCela(celaId) {
  const cela = celasMontagem.find(c => c.id === celaId);
  if (!cela) return;
  const paredesConcluidas = itensProducao.filter(i => (i.ehParede || i.ehPiso) && i.setorAtual === 'concluido' && i.celaVinculada === cela.celaId && !i.selecionadoParaMontagem);
  if (paredesConcluidas.length === 0) {
    alert('Nenhuma parede concluída no CAD! Produza as 5 paredes e mova para "Concluído" no Kanban CAD.');
    return;
  }
  const necessarias = ['Parede Direita', 'Parede Esquerda', 'Parede Janela', 'Parede Porta', 'Piso'];
  const jaSelecionadas = cela.paredesSelecionadas || [];
  const faltam = necessarias.filter(t => !jaSelecionadas.includes(t));
  let opcoes = '🧱 PAREDES DISPONÍVEIS:\n\n';
  paredesConcluidas.forEach((p, i) => {
    opcoes += `${i+1}. ${p.tipoPeca} - ${p.codigoEmissao}\n`;
  });
  opcoes += `\nFaltam: ${faltam.join(', ')}\n\nDigite o número da parede para adicionar:`;
  const selecao = prompt(opcoes);
  if (!selecao) return;
  const idx = parseInt(selecao) - 1;
  if (isNaN(idx) || idx < 0 || idx >= paredesConcluidas.length) { alert('Número inválido'); return; }
  const parede = paredesConcluidas[idx];
  if (cela.paredesCodigos?.includes(parede.codigoEmissao)) { alert('Parede já adicionada!'); return; }
  if (!cela.paredesSelecionadas) cela.paredesSelecionadas = [];
  if (!cela.paredesCodigos) cela.paredesCodigos = [];
  cela.paredesSelecionadas.push(parede.tipoPeca);
  cela.paredesCodigos.push(parede.codigoEmissao);
  parede.selecionadoParaMontagem = true;
  salvar();
  renderizarMontagem();
  alert(`Parede ${parede.tipoPeca} adicionada! Progresso: ${cela.paredesCodigos.length}/5`);
}

function avancarMontagemCela(celaId) {
  const cela = celasMontagem.find(c => c.id === celaId);
  if (!cela) return;
  const indiceAtual = setoresMontagem.indexOf(cela.setorAtual);
  if (indiceAtual >= setoresMontagem.length - 1) { alert('Já na etapa final'); return; }
  if (!podeAvancarMontagem(cela)) { alert('Condições não atendidas (paredes/kit)'); return; }
  const novoSetor = setoresMontagem[indiceAtual + 1];
  cela.setorAtual = novoSetor;
  cela.historico.push({ setor: novoSetor, dataHora: new Date().toLocaleString('pt-BR'), observacoes: `Avançado para ${novoSetor}`, responsavel: 'Usuário' });
  salvar();
  renderizarMontagem();
  alert(`Cela avançada para ${novoSetor}`);
}

function voltarMontagemCela(celaId) {
  const cela = celasMontagem.find(c => c.id === celaId);
  if (!cela) return;
  const indiceAtual = setoresMontagem.indexOf(cela.setorAtual);
  if (indiceAtual <= 0) return;
  const novoSetor = setoresMontagem[indiceAtual - 1];
  cela.setorAtual = novoSetor;
  cela.historico.push({ setor: novoSetor, dataHora: new Date().toLocaleString('pt-BR'), observacoes: `Retornado para ${novoSetor}`, responsavel: 'Usuário' });
  salvar();
  renderizarMontagem();
  alert(`Cela retornada para ${novoSetor}`);
}

function verRastreamentoCela(celaId) {
  const cela = celasMontagem.find(c => c.id === celaId);
  if (!cela) return;
  const paredes = itensProducao.filter(i => (i.ehParede || i.ehPiso) && i.celaVinculada === cela.celaId);
  let msg = `📋 RASTREAMENTO DA CELA ${cela.codigo}\nSetor: ${cela.setorAtual}\nParedes vinculadas:\n`;
  paredes.forEach(p => msg += `- ${p.tipoPeca} (${p.codigoEmissao}): ${p.setorAtual}\n`);
  const kit = getKitMoveisDaCela(cela.celaId);
  if (kit) msg += `\nKit Móveis: ${kit.codigoEmissao} - ${kit.setorAtual}\n`;
  alert(msg);
}

// DRAG & DROP
let celaDraggada = null;
function dragStartCela(event, celaId) { celaDraggada = celaId; event.dataTransfer.effectAllowed = 'move'; }
function dragEndCela(event) { celaDraggada = null; }
function dropMontagem(event, setor) {
  event.preventDefault();
  if (!celaDraggada) return;
  const cela = celasMontagem.find(c => c.id === celaDraggada);
  if (cela) {
    cela.setorAtual = setor;
    cela.historico.push({ setor: setor, dataHora: new Date().toLocaleString('pt-BR'), observacoes: `Movido para ${setor} (drag)`, responsavel: 'Usuário' });
    salvar();
    renderizarMontagem();
  }
}

// ADMIN / MOVIMENTAÇÃO MANUAL
function toggleAdminMode() {
  modoAdmin = !modoAdmin;
  renderizarKanbanCAD();
  renderizarKanbanGRC();
  alert(modoAdmin ? '🔓 MODO ADMIN ATIVADO' : '🔒 MODO USUÁRIO ATIVADO');
}

// QR CODE E SCANNER
function mostrarQRCode(item) {
  const panel = document.getElementById('qrDisplayPanel') || (() => { const d = document.createElement('div'); d.id = 'qrDisplayPanel'; d.style.display = 'none'; document.body.appendChild(d); return d; })();
  const qrBox = document.getElementById('qrCodeBox') || (() => { const d = document.createElement('div'); d.id = 'qrCodeBox'; document.getElementById('qrDisplayPanel')?.appendChild(d); return d; })();
  document.getElementById('qrCodigo').textContent = item.codigoEmissao;
  document.getElementById('qrTipo').textContent = item.tipoPeca;
  document.getElementById('qrEmissao').textContent = item.dataEmissao;
  qrBox.innerHTML = '';
  new QRCode(qrBox, { text: JSON.stringify({ id: item.codigoEmissao, tipo: item.tipoPeca, emissao: item.dataEmissaoISO }), width: 180, height: 180 });
  panel.style.display = 'block';
}

function mostrarQRCodePorId(codigoEmissao) {
  const item = itensProducao.find(i => i.codigoEmissao === codigoEmissao);
  if (item) mostrarQRCode(item);
}

function iniciarScanner() {
  const setor = document.getElementById('setorScanner').value;
  const container = document.getElementById('scannerContainer');
  container.style.display = 'flex';
  scanner = new Html5Qrcode('qr-reader');
  scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 250 } }, onScanSuccess).catch(() => alert('Erro ao acessar câmera!'));
}
function pararScanner() {
  if (scanner) scanner.stop().then(() => scanner.clear()).catch(() => {});
  scanner = null;
  document.getElementById('scannerContainer').style.display = 'none';
}
function onScanSuccess(decodedText) {
  try {
    const qr = JSON.parse(decodedText);
    const item = itensProducao.find(i => i.codigoEmissao === qr.id);
    if (!item) { alert('Item não encontrado!'); return; }
    if (item.setorAtual === 'concluido') { alert('Item já concluído!'); pararScanner(); return; }
    horaLeitura = new Date();
    itemSelecionado = item;
    const proximoSetor = (() => {
      if (item.ehGrc) {
        const idx = setoresGrc.indexOf(item.setorAtual);
        return idx+1 < setoresGrc.length ? setoresGrc[idx+1] : null;
      } else if (item.ehParede || item.ehPiso) {
        const idx = setores.indexOf(item.setorAtual);
        return idx+1 < setores.length ? setores[idx+1] : null;
      } else {
        return null;
      }
    })();
    if (!proximoSetor) { alert('Não há próximo setor'); pararScanner(); return; }
    if (proximoSetor === 'forma') abrirModalForma();
    else if (proximoSetor === 'concretagem') abrirModalConcretagem();
    else if (proximoSetor === 'concluido') {
      item.setorAtual = 'concluido';
      item.historico.push({ setor: 'concluido', dataHora: horaLeitura.toLocaleString('pt-BR'), observacoes: 'Concluído via QR Code', responsavel: 'Scanner' });
      salvar(); renderizarKanbanCAD(); renderizarKanbanGRC();
      pararScanner();
      alert('Item concluído!');
    } else if (proximoSetor === 'grc-forma') abrirModalFormaGRC();
    else if (proximoSetor === 'grc-concretagem') abrirModalConcretagemGRC();
  } catch(e) { alert('QR inválido'); }
}

function abrirModalForma() {
  document.getElementById('formaItemCodigo').textContent = itemSelecionado.codigoEmissao;
  document.getElementById('formaItemTipo').textContent = itemSelecionado.tipoPeca;
  document.getElementById('formaHoraLeitura').textContent = horaLeitura.toLocaleString('pt-BR');
  document.getElementById('modalForma').style.display = 'flex';
}
function confirmarForma() {
  const formaNumero = document.getElementById('formaNumero').value;
  if (!formaNumero) { alert('Selecione a Forma!'); return; }
  itemSelecionado.formaNumero = formaNumero;
  itemSelecionado.codigoForma = gerarCodigoForma(formaNumero);
  itemSelecionado.setorAtual = 'forma';
  itemSelecionado.historico.push({ setor: 'forma', dataHora: new Date().toLocaleString('pt-BR'), formaNumero, codigoForma: itemSelecionado.codigoForma, observacoes: document.getElementById('formaObservacoes').value || '-', responsavel: document.getElementById('formaResponsavel').value || 'Scanner' });
  salvar(); renderizarKanbanCAD(); renderizarKanbanGRC();
  fecharModalForma();
  if (scanner) pararScanner();
  alert(`Forma registrada: ${itemSelecionado.codigoForma}`);
}
function fecharModalForma() { document.getElementById('modalForma').style.display = 'none'; itemSelecionado = null; }

function abrirModalConcretagem() {
  document.getElementById('concreItemCodigo').textContent = itemSelecionado.codigoEmissao;
  document.getElementById('concreItemTipo').textContent = itemSelecionado.tipoPeca;
  document.getElementById('concreHoraLeitura').textContent = horaLeitura.toLocaleString('pt-BR');
  document.getElementById('modalConcretagem').style.display = 'flex';
}
function confirmarConcretagem() {
  const tipoConcreto = document.getElementById('concreTipoConcreto').value;
  if (!tipoConcreto) { alert('Selecione o concreto!'); return; }
  itemSelecionado.codigoConcretagem = gerarCodigoConcretagem();
  itemSelecionado.tipoConcreto = tipoConcreto;
  itemSelecionado.fornecedorConcreto = document.getElementById('concreFornecedor').value;
  itemSelecionado.setorAtual = 'concretagem';
  itemSelecionado.historico.push({ setor: 'concretagem', dataHora: new Date().toLocaleString('pt-BR'), tipoConcreto, fornecedor: itemSelecionado.fornecedorConcreto, codigoConcretagem: itemSelecionado.codigoConcretagem, observacoes: document.getElementById('concreObservacoes').value || '-', responsavel: document.getElementById('concreResponsavel').value || 'Scanner' });
  salvar(); renderizarKanbanCAD(); renderizarKanbanGRC();
  fecharModalConcretagem();
  if (scanner) pararScanner();
  alert(`Concretagem registrada: ${itemSelecionado.codigoConcretagem}`);
}
function fecharModalConcretagem() { document.getElementById('modalConcretagem').style.display = 'none'; itemSelecionado = null; }

// Simples funções para GRC (se necessário)
function abrirModalFormaGRC() { abrirModalForma(); }
function abrirModalConcretagemGRC() { abrirModalConcretagem(); }

// DASHBOARD
function atualizarDashboard() {
  const counts = {
    emitido: itensProducao.filter(i => i.setorAtual === 'emitido').length,
    forma: itensProducao.filter(i => i.setorAtual === 'forma').length,
    concretagem: itensProducao.filter(i => i.setorAtual === 'concretagem').length,
    concluido: itensProducao.filter(i => i.setorAtual === 'concluido' && !i.usadoEmUnidade).length
  };
  document.getElementById('dashEmitido').textContent = counts.emitido;
  document.getElementById('dashForma').textContent = counts.forma;
  document.getElementById('dashConcretagem').textContent = counts.concretagem;
  document.getElementById('dashConcluido').textContent = counts.concluido;
  const total = itensProducao.length;
  const concluidosTotal = itensProducao.filter(i => i.setorAtual === 'concluido').length;
  const percentual = total > 0 ? Math.round((concluidosTotal / total) * 100) : 0;
  document.getElementById('resumoProducao').innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px"><div style="background:#f3f4f6;padding:16px;border-radius:12px;text-align:center"><div style="font-size:24px;font-weight:700">${total}</div><div>Total</div></div><div style="background:#f3f4f6;padding:16px;border-radius:12px;text-align:center"><div style="font-size:24px;font-weight:700;color:#22c55e">${concluidosTotal}</div><div>Concluídos</div></div><div style="background:#f3f4f6;padding:16px;border-radius:12px;text-align:center"><div style="font-size:24px;font-weight:700;color:#f97316">${percentual}%</div><div>Progresso</div></div><div style="background:#f3f4f6;padding:16px;border-radius:12px;text-align:center"><div style="font-size:24px;font-weight:700;color:#3b82f6">${unidadesMontadas.length}</div><div>Unidades</div></div></div>`;
}

// ETIQUETAS
let etiquetasSelecionadas = new Set();

function renderizarEtiquetas() {
  const itensParaEtiqueta = itensProducao.filter(i => i.setorAtual !== 'concluido' && !i.usadoEmUnidade);
  const grid = document.getElementById('etiquetasGrid');
  if (!grid) return;
  if (itensParaEtiqueta.length === 0) {
    grid.innerHTML = '<div class="empty-state"><p>Nenhum item disponível para etiqueta</p></div>';
    return;
  }
  grid.innerHTML = itensParaEtiqueta.map(item => `
    <div class="etiqueta-card ${etiquetasSelecionadas.has(item.id) ? 'selecionada' : ''}" data-id="${item.id}">
      <input type="checkbox" class="etiqueta-checkbox" ${etiquetasSelecionadas.has(item.id) ? 'checked' : ''} onchange="toggleEtiqueta('${item.id}')">
      <div class="etiqueta-codigo">${item.codigoEmissao}</div>
      <div class="etiqueta-nome">${item.tipoPeca}</div>
      <div id="qrcode-mini-${item.id}" class="etiqueta-qrcode-mini"></div>
      <div class="etiqueta-checklist">
        <div class="etiqueta-checklist-item"><span class="check-mini ${item.setorAtual === 'emitido' ? 'concluido' : ''}"></span> Emitido</div>
        <div class="etiqueta-checklist-item"><span class="check-mini ${item.setorAtual === 'forma' || item.setorAtual === 'grc-forma' ? 'concluido' : ''}"></span> Forma</div>
        <div class="etiqueta-checklist-item"><span class="check-mini ${item.setorAtual === 'concretagem' || item.setorAtual === 'grc-concretagem' ? 'concluido' : ''}"></span> Concretagem</div>
      </div>
    </div>
  `).join('');
  itensParaEtiqueta.forEach(item => {
    const div = document.getElementById(`qrcode-mini-${item.id}`);
    if (div) new QRCode(div, { text: item.codigoEmissao, width: 80, height: 80 });
  });
  atualizarContadorEtiquetas();
}

function toggleEtiqueta(id) {
  if (etiquetasSelecionadas.has(id)) etiquetasSelecionadas.delete(id);
  else etiquetasSelecionadas.add(id);
  renderizarEtiquetas();
}

function selecionarTodasEtiquetas() {
  itensProducao.filter(i => i.setorAtual !== 'concluido' && !i.usadoEmUnidade).forEach(i => etiquetasSelecionadas.add(i.id));
  renderizarEtiquetas();
}

function desmarcarTodasEtiquetas() {
  etiquetasSelecionadas.clear();
  renderizarEtiquetas();
}

function imprimirEtiquetasSelecionadas() {
  const selecionados = itensProducao.filter(i => etiquetasSelecionadas.has(i.id));
  if (selecionados.length === 0) { alert('Nenhuma etiqueta selecionada'); return; }
  let html = '<html><head><title>Etiquetas DBN</title><style>body{font-family:sans-serif;padding:20px}.etiqueta{page-break-after:always;border:1px solid #ccc;padding:16px;margin-bottom:16px;border-radius:8px;text-align:center}</style></head><body>';
  selecionados.forEach(item => {
    html += `<div class="etiqueta"><div>${item.codigoEmissao}</div><div>${item.tipoPeca}</div><div id="qr-${item.id}"></div></div>`;
  });
  html += '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script><script>';
  selecionados.forEach(item => {
    html += `new QRCode(document.getElementById('qr-${item.id}'), { text: '${item.codigoEmissao}', width: 150, height: 150 });`;
  });
  html += '<\/script></body></html>';
  const win = window.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

function atualizarContadorEtiquetas() {
  const span = document.getElementById('contadorSelecionadas');
  if (span) span.textContent = etiquetasSelecionadas.size;
}

function imprimirEtiquetas() {
  imprimirEtiquetasSelecionadas();
}

// MÓDULOS FASTFLAX
function abrirModalCriarModulo() {
  itensManuaisTemp = [];
  document.getElementById('moduloNome').value = '';
  document.getElementById('moduloDescricao').value = '';
  document.getElementById('itensAdicionadosLista').innerHTML = '';
  document.getElementById('modalCriarModulo').style.display = 'flex';
}
function fecharModalCriarModulo() { document.getElementById('modalCriarModulo').style.display = 'none'; }
function adicionarItemManual() {
  const nome = document.getElementById('novoItemNome').value.trim();
  const qtd = parseInt(document.getElementById('novoItemQtd').value) || 1;
  if (!nome) { alert('Digite o nome do item'); return; }
  itensManuaisTemp.push({ nome, qtd, subItens: [] });
  document.getElementById('novoItemNome').value = '';
  renderizarItensAdicionados();
}
function removerItemManual(index) { itensManuaisTemp.splice(index, 1); renderizarItensAdicionados(); }
function adicionarSubItem(indexPai) {
  const nome = prompt('Nome do sub-item:');
  if (!nome) return;
  const qtd = parseInt(prompt('Quantidade:', '1')) || 1;
  if (!itensManuaisTemp[indexPai].subItens) itensManuaisTemp[indexPai].subItens = [];
  itensManuaisTemp[indexPai].subItens.push({ nome, qtd, subItens: [] });
  renderizarItensAdicionados();
}
function renderizarItensAdicionados() {
  const lista = document.getElementById('itensAdicionadosLista');
  if (itensManuaisTemp.length === 0) { lista.innerHTML = '<p style="color:#9ca3af">Nenhum item adicionado</p>'; return; }
  function renderizarArvore(itens, nivel = 0) {
    return itens.map((item, idx) => `
      <div style="margin-left:${nivel * 20}px; margin-bottom:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span>${nivel>0 ? '↳' : ''} ${item.nome}</span>
          <span style="background:#10b981; color:white; padding:2px 8px; border-radius:12px;">${item.qtd}</span>
          <button onclick="adicionarSubItem(${itensManuaisTemp.indexOf(item)})" style="background:#3b82f6; border:none; color:white; padding:4px 8px; border-radius:4px;">➕ Sub</button>
          <button onclick="removerItemManual(${itensManuaisTemp.indexOf(item)})" style="background:#ef4444; border:none; color:white; padding:4px 8px; border-radius:4px;">🗑️</button>
        </div>
        ${item.subItens && item.subItens.length > 0 ? renderizarArvore(item.subItens, nivel+1) : ''}
      </div>
    `).join('');
  }
  lista.innerHTML = renderizarArvore(itensManuaisTemp);
}
function salvarModulo() {
  const nome = document.getElementById('moduloNome').value.trim();
  if (!nome) { alert('Nome do módulo obrigatório'); return; }
  if (itensManuaisTemp.length === 0) { alert('Adicione pelo menos um item'); return; }
  const modulo = { id: `MOD-${Date.now()}`, nome, descricao: document.getElementById('moduloDescricao').value.trim(), itens: [...itensManuaisTemp], dataCriacao: new Date().toLocaleString('pt-BR') };
  modulosFastFlax.push(modulo);
  salvar();
  renderizarModulos();
  fecharModalCriarModulo();
  alert(`Módulo "${nome}" criado!`);
}
function renderizarModulos() {
  const grid = document.getElementById('modulosGrid');
  if (!grid) return;
  if (modulosFastFlax.length === 0) { grid.innerHTML = '<div class="empty-state"><p>Nenhum módulo criado</p></div>'; return; }
  grid.innerHTML = modulosFastFlax.map(mod => `
    <div class="modulo-card"><div class="modulo-card-header"><span class="modulo-card-nome">${mod.nome}</span><span class="modulo-card-qtd">${mod.itens.length} itens</span></div>
    ${mod.descricao ? `<div class="modulo-card-descricao">${mod.descricao}</div>` : ''}
    <div class="modulo-card-itens"><h4>Itens:</h4>${mod.itens.map(item => `<div><span>${item.nome}</span> <strong>${item.qtd}</strong></div>`).join('')}</div></div>
  `).join('');
}

// DETALHES DO ITEM
function verDetalhesItem(itemId) {
  const item = itensProducao.find(i => i.id === itemId || i.codigoEmissao === itemId);
  if (!item) return;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.innerHTML = `<div class="modal modal-detalhes"><div class="modal-header modal-header-detalhes"><div><h3>📋 Detalhes do Item</h3><p>${item.codigoEmissao}</p></div><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button></div>
    <div class="modal-body modal-body-detalhes"><div class="detalhes-grid"><div class="detalhes-info"><div class="info-row"><span class="info-label">Tipo:</span><span class="info-value">${item.tipoPeca}</span></div>
    <div class="info-row"><span class="info-label">🏗️ Obra:</span><span class="info-value">${item.obraNome || '-'}</span></div>
    <div class="info-row"><span class="info-label">📍 Setor:</span><span class="info-value badge-setor ${item.setorAtual}">${item.setorAtual}</span></div>
    <div class="info-row"><span class="info-label">📅 Emissão:</span><span class="info-value">${item.dataEmissao}</span></div></div>
    <div class="detalhes-qrcode"><div id="qrcode-detalhes"></div><button class="btn-print" onclick="imprimirQRCode('${item.codigoEmissao}')">🖨️ Imprimir QR Code</button></div></div>
    <div class="detalhes-historico"><h4>📋 Histórico</h4><div class="historico-timeline">${item.historico.map((h,i)=>`<div class="timeline-item"><div class="timeline-marker">${i+1}</div><div class="timeline-content"><div class="timeline-setor badge-setor ${h.setor}">${h.setor}</div><div class="timeline-data">🕐 ${h.dataHora}</div>${h.observacoes ? `<div class="timeline-obs">📝 ${h.observacoes}</div>` : ''}</div></div>`).join('')}</div></div></div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Fechar</button></div></div>`;
  document.body.appendChild(modal);
  setTimeout(() => new QRCode(document.getElementById('qrcode-detalhes'), { text: item.codigoEmissao, width: 180, height: 180 }), 100);
}

function imprimirQRCode(codigo) {
  const win = window.open('', '_blank');
  win.document.write(`<html><head><title>QR Code ${codigo}</title><style>body{display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif}</style></head><body><div><h1>DBN ERP</h1><p>${codigo}</p><div id="qr"></div><script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script><script>new QRCode(document.getElementById('qr'),{text:'${codigo}',width:200,height:200});setTimeout(()=>window.print(),500);<\/script></div></body></html>`);
  win.document.close();
}

// STORAGE
function salvar() {
  localStorage.setItem('dbn_producao', JSON.stringify(itensProducao));
  localStorage.setItem('dbn_obras', JSON.stringify(obras));
  localStorage.setItem('dbn_produtos', JSON.stringify(produtos));
  localStorage.setItem('dbn_celas_montagem', JSON.stringify(celasMontagem));
  localStorage.setItem('dbn_modulos', JSON.stringify(modulosFastFlax));
  localStorage.setItem('dbn_componentes_basicos', JSON.stringify(componentesBasicos));
  localStorage.setItem('dbn_unidades', JSON.stringify(unidadesMontadas));
}

function carregar() {
  const dados = localStorage.getItem('dbn_producao'); if (dados) itensProducao = JSON.parse(dados);
  const obrasDados = localStorage.getItem('dbn_obras'); if (obrasDados) obras = JSON.parse(obrasDados);
  const produtosDados = localStorage.getItem('dbn_produtos'); if (produtosDados) produtos = JSON.parse(produtosDados);
  const componentesDados = localStorage.getItem('dbn_componentes_basicos'); if (componentesDados) componentesBasicos = JSON.parse(componentesDados);
  const unidadesDados = localStorage.getItem('dbn_unidades'); if (unidadesDados) unidadesMontadas = JSON.parse(unidadesDados);
  const celasMontagemDados = localStorage.getItem('dbn_celas_montagem'); if (celasMontagemDados) celasMontagem = JSON.parse(celasMontagemDados);
  const modulosDados = localStorage.getItem('dbn_modulos'); if (modulosDados) modulosFastFlax = JSON.parse(modulosDados);
  renderizarObras();
  renderizarProdutos();
  renderizarKanbanCAD();
  renderizarKanbanGRC();
  renderizarMontagem();
  atualizarDashboard();
  renderizarModulos();
}

// DADOS DE EXEMPLO (opcional)
function inicializarDadosExemplo() {
  if (produtos.length > 0) return;
  const barraAco = { id: 'comp-1', codigo: 'BAR-001', nome: 'Barra de Aço', unidade: 'un', categoria: 'aco', dataCriacao: new Date().toLocaleString() };
  const armacao = { id: 'comp-2', codigo: 'ARM-001', nome: 'Armação', unidade: 'un', categoria: 'aco', dataCriacao: new Date().toLocaleString() };
  const concreto = { id: 'comp-3', codigo: 'CON-001', nome: 'Concreto', unidade: 'un', categoria: 'concreto', dataCriacao: new Date().toLocaleString() };
  const porta = { id: 'comp-4', codigo: 'POR-001', nome: 'Porta', unidade: 'un', categoria: 'outro', dataCriacao: new Date().toLocaleString() };
  componentesBasicos.push(barraAco, armacao, concreto, porta);
  const paredePorta = { id: 'parede-1', codigo: 'PAR-POR-001', nome: 'Parede Porta', tipo: 'parede', descricao: '', dataCriacao: new Date().toLocaleString(), componentes: [{ tipo: 'componente', componenteId: armacao.id, nome: armacao.nome, codigo: armacao.codigo, unidade: armacao.unidade, quantidade: 1 }, { tipo: 'componente', componenteId: concreto.id, nome: concreto.nome, codigo: concreto.codigo, unidade: concreto.unidade, quantidade: 1 }, { tipo: 'componente', componenteId: porta.id, nome: porta.nome, codigo: porta.codigo, unidade: porta.unidade, quantidade: 1 }], status: 'ativo' };
  const paredeDireita = { id: 'parede-2', codigo: 'PAR-DIR-001', nome: 'Parede Direita', tipo: 'parede', descricao: '', dataCriacao: new Date().toLocaleString(), componentes: [{ tipo: 'componente', componenteId: armacao.id, nome: armacao.nome, codigo: armacao.codigo, unidade: armacao.unidade, quantidade: 1 }, { tipo: 'componente', componenteId: concreto.id, nome: concreto.nome, codigo: concreto.codigo, unidade: concreto.unidade, quantidade: 1 }], status: 'ativo' };
  const paredeEsquerda = { id: 'parede-3', codigo: 'PAR-ESQ-001', nome: 'Parede Esquerda', tipo: 'parede', descricao: '', dataCriacao: new Date().toLocaleString(), componentes: [{ tipo: 'componente', componenteId: armacao.id, nome: armacao.nome, codigo: armacao.codigo, unidade: armacao.unidade, quantidade: 1 }, { tipo: 'componente', componenteId: concreto.id, nome: concreto.nome, codigo: concreto.codigo, unidade: concreto.unidade, quantidade: 1 }], status: 'ativo' };
  const paredeJanela = { id: 'parede-4', codigo: 'PAR-JAN-001', nome: 'Parede Janela', tipo: 'parede', descricao: '', dataCriacao: new Date().toLocaleString(), componentes: [{ tipo: 'componente', componenteId: armacao.id, nome: armacao.nome, codigo: armacao.codigo, unidade: armacao.unidade, quantidade: 1 }, { tipo: 'componente', componenteId: concreto.id, nome: concreto.nome, codigo: concreto.codigo, unidade: concreto.unidade, quantidade: 1 }], status: 'ativo' };
  const piso = { id: 'piso-1', codigo: 'PISO-001', nome: 'Piso', tipo: 'parede', descricao: '', dataCriacao: new Date().toLocaleString(), componentes: [{ tipo: 'componente', componenteId: concreto.id, nome: concreto.nome, codigo: concreto.codigo, unidade: concreto.unidade, quantidade: 1 }], status: 'ativo' };
  const cela = { id: 'cela-1', codigo: 'MCC8P-001', nome: 'MCC8P', tipo: 'cela', descricao: '', dataCriacao: new Date().toLocaleString(), componentes: [{ tipo: 'parede', produtoId: paredeDireita.id, nome: paredeDireita.nome, codigo: paredeDireita.codigo, quantidade: 1 }, { tipo: 'parede', produtoId: paredeEsquerda.id, nome: paredeEsquerda.nome, codigo: paredeEsquerda.codigo, quantidade: 1 }, { tipo: 'parede', produtoId: paredeJanela.id, nome: paredeJanela.nome, codigo: paredeJanela.codigo, quantidade: 1 }, { tipo: 'parede', produtoId: paredePorta.id, nome: paredePorta.nome, codigo: paredePorta.codigo, quantidade: 1 }, { tipo: 'parede', produtoId: piso.id, nome: piso.nome, codigo: piso.codigo, quantidade: 1 }], status: 'ativo' };
  produtos.push(paredePorta, paredeDireita, paredeEsquerda, paredeJanela, piso, cela);
  salvar();
}

// EXPOR FUNÇÕES GLOBAIS
window.criarObra = criarObra;
window.renderizarObras = renderizarObras;
window.mostrarDetalhesObra = mostrarDetalhesObra;
window.voltarParaObras = voltarParaObras;
window.mostrarComponentes = mostrarComponentes;
window.toggleAdminMode = toggleAdminMode;
window.verDetalhesItem = verDetalhesItem;
window.mostrarQRCodePorId = mostrarQRCodePorId;
window.iniciarScanner = iniciarScanner;
window.pararScanner = pararScanner;
window.fecharModalForma = fecharModalForma;
window.confirmarForma = confirmarForma;
window.fecharModalConcretagem = fecharModalConcretagem;
window.confirmarConcretagem = confirmarConcretagem;
window.mostrarFormularioProduto = mostrarFormularioComponenteBasico; // fallback
window.cancelarProduto = voltarParaProdutos;
window.salvarProduto = salvarProdutoDoModal;
window.abrirProduto = abrirProduto;
window.voltarParaProdutos = voltarParaProdutos;
window.mostrarAbaProduto = mostrarAbaProduto;
window.adicionarComponente = adicionarComponente;
window.fecharModalComponente = fecharModalComponente;
window.confirmarComponente = confirmarComponente;
window.filtrarProdutos = filtrarProdutos;
window.mostrarFormularioComponenteBasico = mostrarFormularioComponenteBasico;
window.fecharModalComponenteBasico = fecharModalComponenteBasico;
window.salvarComponenteBasico = salvarComponenteBasico;
window.atualizarComponentesDisponiveis = atualizarComponentesDisponiveis;
window.excluirComponenteBasico = excluirComponenteBasico;
window.abrirModalNovoItem = abrirModalNovoItem;
window.fecharModalNovoItem = fecharModalNovoItem;
window.selecionarTipoItem = selecionarTipoItem;
window.fecharModalCadastroProduto = fecharModalCadastroProduto;
window.fecharModalCadastroComponente = fecharModalCadastroComponente;
window.salvarProdutoDoModal = salvarProdutoDoModal;
window.salvarComponenteDoModal = salvarComponenteDoModal;
window.editarProdutoAtual = editarProdutoAtual;
window.removerComponenteDoProduto = removerComponenteDoProduto;
window.adicionarCelaNaObra = adicionarCelaNaObra;
window.adicionarPassarelaNaObra = adicionarPassarelaNaObra;
window.moverCAD = moverCAD;
window.moverGRC = moverGRC;
window.selecionarParedesParaCela = selecionarParedesParaCela;
window.avancarMontagemCela = avancarMontagemCela;
window.voltarMontagemCela = voltarMontagemCela;
window.verRastreamentoCela = verRastreamentoCela;
window.dragStartCela = dragStartCela;
window.dragEndCela = dragEndCela;
window.dropMontagem = dropMontagem;
window.toggleEtiqueta = toggleEtiqueta;
window.selecionarTodasEtiquetas = selecionarTodasEtiquetas;
window.desmarcarTodasEtiquetas = desmarcarTodasEtiquetas;
window.imprimirEtiquetasSelecionadas = imprimirEtiquetasSelecionadas;
window.imprimirEtiquetas = imprimirEtiquetas;
window.abrirModalCriarModulo = abrirModalCriarModulo;
window.fecharModalCriarModulo = fecharModalCriarModulo;
window.adicionarItemManual = adicionarItemManual;
window.removerItemManual = removerItemManual;
window.adicionarSubItem = adicionarSubItem;
window.salvarModulo = salvarModulo;
window.renderizarModulos = renderizarModulos;

// INIT
document.addEventListener('DOMContentLoaded', () => {
  atualizarData();
  setupMenu();
  carregar();
  inicializarDadosExemplo(); // apenas se vazio
  // AUTO SAVE VISUAL
  const toast = document.createElement('div');

  toast.className = 'toast-msg';
  toast.innerHTML = msg;

  toast.style.position = 'fixed';
  toast.style.top = '20px';
  toast.style.right = '20px';
  toast.style.padding = '14px 20px';
  toast.style.borderRadius = '14px';
  toast.style.background = tipo === 'success' ? '#22c55e' : '#ef4444';
  toast.style.color = 'white';
  toast.style.fontWeight = '700';
  toast.style.zIndex = '99999';
  toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// SALVAR LOCAL
function salvar() {
  localStorage.setItem('dbnERP', JSON.stringify({
    itensProducao,
    obras,
    unidadesMontadas,
    produtos,
    componentesBasicos
  }));

  toast('✅ Dados salvos automaticamente');
}

// CARREGAR
function carregar() {
  const dados = JSON.parse(localStorage.getItem('dbnERP'));

  if (!dados) return;

  itensProducao = dados.itensProducao || [];
  obras = dados.obras || [];
  unidadesMontadas = dados.unidadesMontadas || [];
  produtos = dados.produtos || [];
  componentesBasicos = dados.componentesBasicos || [];
}

// INICIALIZAÇÃO
window.addEventListener('DOMContentLoaded', () => {
  carregar();
  atualizarData();
  setupMenu();
  renderizarObras();
  renderizarProdutos();

  console.log('✅ DBN ERP Inicializado');
});
});
