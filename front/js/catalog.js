'use strict';
const $ = (id) => document.getElementById(id);
const dinheiro = (centavos) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100);
let pagina = 1;
let totalPaginas = 1;

async function obterJSON(caminho) {
  const resposta = await fetch(caminho, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
  if (!resposta.ok) throw new Error('Erro HTTP ' + resposta.status);
  return resposta.json();
}

function desenharProduto(produto) {
  const coluna = document.createElement('div');
  coluna.className = 'col-sm-6 col-lg-4 col-xl-3';
  const card = document.createElement('article');
  card.className = 'card-product';
  const arte = document.createElement('div');
  arte.className = 'art';
  arte.setAttribute('aria-hidden', 'true');
  arte.textContent = '♫';
  const conteudo = document.createElement('div');
  conteudo.className = 'card-body';
  const categoria = document.createElement('p');
  categoria.className = 'small text-secondary mb-2';
  categoria.textContent = produto.category?.name || 'Instrumento musical';
  const titulo = document.createElement('h3');
  titulo.className = 'card-title h6 fw-bold';
  titulo.textContent = produto.name;
  const preco = document.createElement('p');
  preco.className = 'price mb-2';
  preco.textContent = dinheiro(produto.price_cents);
  const estoque = document.createElement('p');
  estoque.className = 'small text-secondary mb-0';
  estoque.textContent = produto.stock_quantity > 0 ? 'Em estoque' : 'Indisponível no momento';
  conteudo.append(categoria, titulo, preco, estoque);
  card.append(arte, conteudo);
  coluna.append(card);
  return coluna;
}

async function carregarCategorias() {
  try {
    const retorno = await obterJSON('/api/categories');
    for (const categoria of retorno.data || []) {
      const opcao = document.createElement('option');
      opcao.value = String(categoria.id);
      opcao.textContent = categoria.name;
      $('categoria').append(opcao);
    }
  } catch {
    $('status').textContent = 'Não foi possível carregar as categorias. A busca ainda está disponível.';
  }
}

async function carregarProdutos() {
  $('status').textContent = 'Carregando produtos...';
  const parametros = new URLSearchParams({ page: String(pagina) });
  const busca = $('busca').value.trim();
  const categoria = $('categoria').value;
  if (busca) parametros.set('search', busca);
  if (categoria) parametros.set('category_id', categoria);
  try {
    const resultado = await obterJSON('/api/products?' + parametros);
    const produtos = resultado.data || [];
    totalPaginas = resultado.meta?.last_page || 1;
    $('produtos').replaceChildren(...produtos.map(desenharProduto));
    $('status').textContent = produtos.length ? (resultado.meta?.total ?? produtos.length) + ' produtos encontrados' : 'Nenhum produto encontrado.';
    $('paginaAtual').textContent = 'Página ' + pagina + ' de ' + totalPaginas;
    $('anterior').disabled = pagina <= 1;
    $('proxima').disabled = pagina >= totalPaginas;
  } catch {
    $('status').textContent = 'Não foi possível carregar os produtos. Verifique a conexão com a API.';
    $('produtos').replaceChildren();
    $('anterior').disabled = true;
    $('proxima').disabled = true;
  }
}
$('filtros').addEventListener('submit', (event) => {
  event.preventDefault();
  pagina = 1;
  carregarProdutos();
});
$('anterior').addEventListener('click', () => { if (pagina > 1) { pagina--; carregarProdutos(); } });
$('proxima').addEventListener('click', () => { if (pagina < totalPaginas) { pagina++; carregarProdutos(); } });
carregarCategorias();
carregarProdutos();
