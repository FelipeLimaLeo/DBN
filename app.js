/**
 * DBN - Produtos e Módulos
 * Sistema de gerenciamento com árvore infinita de itens
 * 
 * @author DBN Sistemas
 * @version 1.0.0
 */

// ===================================
// DADOS
// ===================================
let itens = [];
let itensTemp = [];
let filtroAtual = 'todos';
let itemVisualizando = null;

// ===================================
// INICIALIZAÇÃO
// ===================================
document.addEventListener('DOMContentLoaded', () => {
  carregarDados();
  renderizarGrid();
  atualizarContador();
});

// ===================================
// MODAL
// ===================================

/**
 * Abre o modal de cadastro
 * @param {string} tipo - 'produto' ou 'modulo'
 */
function abrirModal(tipo) {
  itensTemp = [];
  document.getElementById('modalTitulo').textContent = tipo === 'produto' ? '📦 Criar Produto' : '🏭 Criar Módulo';
  document.getElementById('tipoItem').value = tipo;
  document.getElementById('nomeItem').value = '';
  document.getElementById('descricaoItem').value = '';
  document.getElementById('novoItemNome').value = '';
  document.getElementById('novoItemQtd').value = '1';
  document.getElementById('arvoreItens').innerHTML = '<p class="vazio">Nenhum item adicionado ainda</p>';
  document.getElementById('modalOverlay').classList.add('active');
}

/**
 * Fecha o modal de cadastro
 */
function fecharModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

/**
 * Fecha o modal de visualização
 */
function fecharModalVisualizar() {
  document.getElementById('modalVisualizar').classList.remove('active');
  itemVisualizando = null;
}

// ===================================
// FILTROS
// ===================================

/**
 * Filtra os itens por tipo
 * @param {string} tipo - 'todos', 'produto' ou 'modulo'
 */
function filtrar(tipo) {
  filtroAtual = tipo;
  
  // Atualiza botões
  document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.classList.remove('active');
    if (
      (tipo === 'todos' && btn.textContent.includes('Todos')) ||
      (tipo === 'produto' && btn.textContent.includes('Produtos')) ||
      (tipo === 'modulo' && btn.textContent.includes('Módulos'))
    ) {
      btn.classList.add('active');
    }
  });
  
  renderizarGrid();
  atualizarContador();
}

/**
 * Atualiza o contador de itens
 */
function atualizarContador() {
  const total = filtroAtual === 'todos' ? itens.length : 
                filtroAtual === 'produto' ? itens.filter(i => i.tipo === 'produto').length :
                itens.filter(i => i.tipo === 'modulo').length;
  
  document.getElementById('totalItens').textContent = total;
}

// ===================================
// RENDERIZAÇÃO
// ===================================

/**
 * Renderiza a grid de produtos/módulos
 */
function renderizarGrid() {
  const grid = document.getElementById('gridProdutos');
  
  // Filtra
  let filtrados = itens;
  if (filtroAtual === 'produto') {
    filtrados = itens.filter(i => i.tipo === 'produto');
  } else if (filtroAtual === 'modulo') {
    filtrados = itens.filter(i => i.tipo === 'modulo');
  }
  
  // Mensagem de vazio
  if (filtrados.length === 0) {
    grid.innerHTML = `
      <div class="vazio">
        <p style="font-size: 48px; margin-bottom: 16px;">📦</p>
        <p style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Nenhum item cadastrado</p>
        <p style="color: var(--gray-500);">Clique em "Novo Produto" ou "Novo Módulo" para começar!</p>
      </div>
    `;
    return;
  }
  
  // Renderiza cards
  grid.innerHTML = filtrados.map(item => {
    const totalItens = contarItens(item.itens);
    return `
      <div class="card ${item.tipo}" onclick="visualizarItem(${item.id})">
        <div class="card-header">
          <div>
            <div class="card-title">${item.nome}</div>
          </div>
          <span class="card-badge ${item.tipo}">${item.tipo === 'produto' ? '📦 Produto' : '🏭 Módulo'}</span>
        </div>
        ${item.descricao ? `
          <div class="card-desc">${item.descricao}</div>
        ` : ''}
        <div class="card-stats">
          <div class="stat">
            <span>📦</span>
            <span>${totalItens} ${totalItens === 1 ? 'item' : 'itens'}</span>
          </div>
          <div class="stat">
            <span>📅</span>
            <span>${new Date(item.data).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Visualiza um item específico
 * @param {number} id - ID do item
 */
function visualizarItem(id) {
  const item = itens.find(i => i.id === id);
  if (!item) return;
  
  itemVisualizando = item;
  
  document.getElementById('visualizarTitulo').textContent = item.tipo === 'produto' ? '📦 Produto' : '🏭 Módulo';
  document.getElementById('visualizarSubtitulo').textContent = item.nome;
  document.getElementById('visualizarDescricao').textContent = item.descricao || 'Sem descrição';
  document.getElementById('visualizarData').textContent = new Date(item.data).toLocaleString('pt-BR');
  document.getElementById('visualizarTotal').textContent = contarItens(item.itens);
  
  // Renderiza árvore
  if (item.itens.length === 0) {
    document.getElementById('visualizarArvore').innerHTML = '<p class="vazio">Nenhum item</p>';
  } else {
    document.getElementById('visualizarArvore').innerHTML = renderizarArvoreVisualizar(item.itens, 0);
  }
  
  document.getElementById('modalVisualizar').classList.add('active');
}

/**
 * Renderiza árvore para visualização
 * @param {Array} itens - Lista de itens
 * @param {number} nivel - Nível de indentação
 * @returns {string} HTML da árvore
 */
function renderizarArvoreVisualizar(itens, nivel) {
  return itens.map(item => {
    const temSubItens = item.subItens && item.subItens.length > 0;
    
    return `
      <div class="arvore-item">
        <div class="arvore-item-conteudo" style="margin-left: ${nivel * 24}px">
          <span class="arvore-item-nivel">${'  '.repeat(nivel)}${nivel > 0 ? '↳ ' : ''}</span>
          <span class="arvore-item-nome">${item.nome}</span>
          <span class="arvore-item-qtd">${item.qtd}</span>
        </div>
        ${temSubItens ? `
          <div class="arvore-subitens">
            ${renderizarArvoreVisualizar(item.subItens, nivel + 1)}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

/**
 * Deleta um item
 */
function deletarItem() {
  if (!itemVisualizando) return;
  
  if (confirm(`Tem certeza que deseja excluir "${itemVisualizando.nome}"?\n\nEsta ação não pode ser desfeita!`)) {
    itens = itens.filter(i => i.id !== itemVisualizando.id);
    salvarDados();
    renderizarGrid();
    atualizarContador();
    fecharModalVisualizar();
    
    alert('✅ Item excluído com sucesso!');
  }
}

// ===================================
// ÁRVORE DE ITENS
// ===================================

/**
 * Adiciona um item na árvore temporária
 */
function adicionarItem() {
  const nome = document.getElementById('novoItemNome').value.trim();
  const qtd = parseInt(document.getElementById('novoItemQtd').value) || 1;
  
  if (!nome) {
    alert('⚠️ Digite o nome do item!');
    return;
  }
  
  itensTemp.push({
    id: Date.now(),
    nome,
    qtd,
    subItens: []
  });
  
  // Limpa campos
  document.getElementById('novoItemNome').value = '';
  document.getElementById('novoItemQtd').value = '1';
  
  renderizarArvore();
}

/**
 * Renderiza a árvore de itens temporária
 */
function renderizarArvore() {
  const arvore = document.getElementById('arvoreItens');
  
  if (itensTemp.length === 0) {
    arvore.innerHTML = '<p class="vazio">Nenhum item adicionado ainda</p>';
    return;
  }
  
  arvore.innerHTML = renderizarArvoreHTML(itensTemp, 0);
}

/**
 * Renderiza HTML da árvore (recursivo)
 * @param {Array} itens - Lista de itens
 * @param {number} nivel - Nível de indentação
 * @returns {string} HTML
 */
function renderizarArvoreHTML(itens, nivel) {
  return itens.map((item, index) => {
    const temSubItens = item.subItens && item.subItens.length > 0;
    
    return `
      <div class="arvore-item">
        <div class="arvore-item-conteudo" style="margin-left: ${nivel * 24}px">
          <span class="arvore-item-nivel">${'  '.repeat(nivel)}${nivel > 0 ? '↳ ' : ''}</span>
          <span class="arvore-item-nome">${item.nome}</span>
          <span class="arvore-item-qtd">${item.qtd}</span>
          <div class="arvore-item-acoes">
            <button class="btn-sub" onclick="adicionarSubItem(${index})" title="Adicionar sub-item">➕</button>
            <button class="btn-remove" onclick="removerItem(${index})" title="Remover">×</button>
          </div>
        </div>
        ${temSubItens ? `
          <div class="arvore-subitens">
            ${renderizarArvoreHTML(item.subItens, nivel + 1)}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

/**
 * Adiciona sub-item
 * @param {number} indexPai - Índice do item pai
 */
function adicionarSubItem(indexPai) {
  const nome = prompt('Nome do sub-item:');
  if (!nome) return;
  
  const qtd = parseInt(prompt('Quantidade:', '1')) || 1;
  
  const itemPai = encontrarItemPorIndex(itensTemp, indexPai);
  
  if (itemPai) {
    if (!itemPai.subItens) itemPai.subItens = [];
    itemPai.subItens.push({
      id: Date.now(),
      nome,
      qtd,
      subItens: []
    });
    renderizarArvore();
  }
}

/**
 * Encontra item por índice na árvore
 * @param {Array} itens - Lista de itens
 * @param {number} targetIndex - Índice alvo
 * @param {Object} current - Contador atual
 * @returns {Object|null} Item encontrado
 */
function encontrarItemPorIndex(itens, targetIndex, current = { index: 0 }) {
  for (let i = 0; i < itens.length; i++) {
    if (current.index === targetIndex) {
      return itens[i];
    }
    current.index++;
    
    if (itens[i].subItens && itens[i].subItens.length > 0) {
      const found = encontrarItemPorIndex(itens[i].subItens, targetIndex, current);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Remove item da árvore
 * @param {number} index - Índice do item
 */
function removerItem(index) {
  if (confirm('Remover este item e todos os sub-itens?')) {
    removerItemPorIndex(itensTemp, index);
    renderizarArvore();
  }
}

/**
 * Remove item por índice (recursivo)
 * @param {Array} itens - Lista de itens
 * @param {number} targetIndex - Índice alvo
 * @returns {boolean} Sucesso
 */
function removerItemPorIndex(itens, targetIndex) {
  let currentIndex = 0;
  
  for (let i = 0; i < itens.length; i++) {
    if (currentIndex === targetIndex) {
      itens.splice(i, 1);
      return true;
    }
    currentIndex++;
    
    if (itens[i].subItens && itens[i].subItens.length > 0) {
      if (removerItemPorIndex(itens[i].subItens, targetIndex)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Conta total de itens (recursivo)
 * @param {Array} itens - Lista de itens
 * @returns {number} Total
 */
function contarItens(itens) {
  let total = itens.length;
  itens.forEach(item => {
    if (item.subItens && item.subItens.length > 0) {
      total += contarItens(item.subItens);
    }
  });
  return total;
}

// ===================================
// SALVAR
// ===================================

/**
 * Salva produto/módulo
 */
function salvarItem() {
  const nome = document.getElementById('nomeItem').value.trim();
  const descricao = document.getElementById('descricaoItem').value.trim();
  const tipo = document.getElementById('tipoItem').value;
  
  // Validações
  if (!nome) {
    alert('⚠️ Digite o nome!');
    return;
  }
  
  if (itensTemp.length === 0) {
    alert('⚠️ Adicione pelo menos um item!');
    return;
  }
  
  // Cria item
  const novoItem = {
    id: Date.now(),
    nome,
    descricao,
    tipo,
    itens: JSON.parse(JSON.stringify(itensTemp)), // Deep copy
    data: new Date().toISOString()
  };
  
  itens.push(novoItem);
  salvarDados();
  renderizarGrid();
  atualizarContador();
  fecharModal();
  
  alert(`✅ ${tipo === 'produto' ? 'Produto' : 'Módulo'} salvo com ${contarItens(novoItem.itens)} ${contarItens(novoItem.itens) === 1 ? 'item' : 'itens'}!`);
}

/**
 * Salva dados no LocalStorage
 */
function salvarDados() {
  localStorage.setItem('dbn_produtos_modulos', JSON.stringify(itens));
}

/**
 * Carrega dados do LocalStorage
 */
function carregarDados() {
  const dados = localStorage.getItem('dbn_produtos_modulos');
  if (dados) {
    itens = JSON.parse(dados);
  }
}
