# RockerStore

**Sistema de e-commerce de instrumentos musicais desenvolvido com Laravel, PHP, MySQL, JavaScript e Bootstrap.**

A RockerStore é uma aplicação web voltada à comercialização de instrumentos musicais, incluindo guitarras, baixos e baterias.

O projeto utiliza uma arquitetura separada em frontend, backend, banco de dados e proxy reverso, com a infraestrutura gerenciada pelo Docker Compose.

## Tecnologias utilizadas

### Backend

- PHP 8.5
- Laravel 13
- Laravel Sanctum 4
- Eloquent ORM
- MySQL com PDO
- Composer
- Apache HTTP Server

### Frontend

- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- Fetch API

### Infraestrutura

- Docker
- Docker Compose
- Nginx
- Apache
- MySQL 8.4

O frontend não utiliza Blade, React ou Vue. A comunicação com o backend ocorre por meio de requisições HTTP para uma API REST desenvolvida com Laravel, que utiliza respostas JSON.

## Arquitetura do projeto

A aplicação é organizada em quatro serviços Docker:

| Serviço | Tecnologia            | Responsabilidade                                 |
| ------- | --------------------- | ------------------------------------------------ |
| `front` | Nginx                 | Disponibilizar as páginas HTML, CSS e JavaScript |
| `api`   | PHP, Apache e Laravel | Processar as requisições e regras de negócio     |
| `db`    | MySQL 8.4             | Armazenar os dados da aplicação                  |
| `proxy` | Nginx                 | Encaminhar requisições para frontend e backend   |

O proxy reverso é o ponto de entrada principal da aplicação.

As requisições para `/api/` são encaminhadas ao Laravel. Os caminhos `/sanctum/` e `/storage/` também são atendidos pelo backend.

As demais requisições são direcionadas ao frontend.

Essa organização permite utilizar o mesmo endereço de acesso para a interface e a API, mantendo os serviços separados internamente.

## Estrutura de diretórios

```text
rockerstore/
├── back/
│   ├── app/
│   │   ├── Http/
│   │   ├── Models/
│   │   └── Services/
│   ├── config/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── public/
│   ├── routes/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── composer.json/
├── front/
│   ├── components/
│   ├── css/
│   │   └── global.css
│   ├── images/
│   ├── js/
│   ├── pages/
│   │   ├── account/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── favorites/
│   │   ├── home/
│   │   ├── orders/
│   │   └── product/
│   ├── Dockerfile
│   └── index.html
├── proxy/
│   └── nginx.conf
├── .env.example
├── compose.yaml
├── compose.prod.yaml
└── README.md
```

O backend segue a organização MVC do Laravel, utilizando Controllers, Form Requests, API Resources, Models e uma camada de Services para as regras de negócio.

No frontend, os arquivos JavaScript e CSS específicos ficam organizados nos diretórios de cada página. Os componentes reutilizáveis ficam em `front/components/`, enquanto os estilos compartilhados ficam em `front/css/global.css`.

## Funcionalidades

### Clientes

- Cadastro, login e logout.
- Autenticação baseada em sessão e cookies com Laravel Sanctum.
- Consulta e atualização dos dados da conta.
- Cadastro, edição e exclusão de endereços.
- Consulta de produtos e categorias.
- Pesquisa, filtros, ordenação e paginação do catálogo.
- Visualização de detalhes dos produtos.
- Carrinho de compras para visitantes e usuários autenticados.
- Fusão do carrinho de visitante após login ou cadastro.
- Lista de produtos favoritos.
- Avaliações e comentários de produtos.
- Checkout autenticado com seleção de endereço.
- Consulta do histórico e dos detalhes dos pedidos.
- Acompanhamento do status dos pedidos.
- Simulação de pagamento.
- Cancelamento de pedidos conforme as regras do sistema.

### Administração

- Cadastro, edição e exclusão de categorias.
- Cadastro e gerenciamento de produtos.
- Controle de preços, estoque e disponibilidade.
- Exclusão lógica de produtos.
- Upload, substituição e remoção de imagens de produtos.
- Consulta e gerenciamento dos pedidos.
- Atualização do status dos pedidos.
- Restrição de acesso às funcionalidades administrativas.

### Processamento de pedidos

O checkout utiliza transações de banco de dados para manter a consistência entre a criação do pedido e a atualização do estoque.

Antes da confirmação, o backend valida a disponibilidade e a quantidade dos produtos.

Ao criar um pedido, o sistema registra os itens, as quantidades e os preços praticados naquele momento, preservando o histórico da compra.

O pagamento é simulado, sem integração com gateways financeiros externos. O frete utiliza regras demonstrativas do projeto, sem contratação de serviços externos de transporte.

## Carrinho de visitantes

A RockerStore permite que visitantes adicionem produtos ao carrinho sem realizar login.

O carrinho é persistido no banco de dados e identificado por um token associado a um cookie. Para localizar o carrinho, o backend utiliza o hash SHA-256 desse token.

Quando o visitante realiza login ou cadastro, o sistema executa a fusão entre o carrinho de visitante e o carrinho do usuário autenticado.

### Regras da fusão

1. Produtos existentes somente no carrinho de visitante são transferidos para o carrinho da conta.
2. Produtos presentes nos dois carrinhos têm suas quantidades somadas.
3. A quantidade final respeita o estoque disponível.
4. Produtos inativos, inexistentes ou indisponíveis não são transferidos.
5. Ajustes de quantidade podem gerar avisos na resposta da API.
6. Após a fusão, o carrinho de visitante é excluído.

Essa operação é realizada pelo método `mergeGuestCart()` da classe `CartService`, utilizando uma transação de banco de dados.

Os valores do carrinho são calculados pelo servidor a partir dos preços atuais dos produtos. Os preços praticados são registrados no momento da criação do pedido.

## Requisitos para instalação

Para executar a RockerStore localmente, são necessários:

- Git.
- Docker Desktop com suporte a containers Linux.
- Docker Compose, incluído no Docker Desktop.
- Navegador atualizado.
- Conexão com a internet para baixar imagens Docker e dependências.

**Não é necessário instalar PHP, Composer, Apache, Nginx ou MySQL diretamente no computador.** Esses componentes são executados pelos containers Docker.

As portas `80` e `8091` devem estar disponíveis no computador.

## Instalação e execução

As instruções abaixo utilizam o ambiente definido no arquivo `compose.yaml`, destinado à execução local do projeto.

### 1. Clonar o repositório

Abra o terminal e execute:

```bash
git clone https://github.com/Gostavou/rockerstore.git
cd rockerstore
```

O projeto utiliza a branch `main` como referência principal.

### 2. Criar os arquivos de ambiente

É necessário criar dois arquivos `.env`: um na raiz do projeto, utilizado pelo Docker Compose, e outro dentro de `back/`, utilizado pelo Laravel.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
Copy-Item back/.env.example back/.env
```

**Linux, macOS ou Git Bash:**

```bash
cp .env.example .env
cp back/.env.example back/.env
```

### 3. Configurar o ambiente Docker

Abra o arquivo `.env` localizado na raiz do projeto.

Configure os seguintes valores:

```dotenv
DB_DATABASE=rockerstore
DB_USERNAME=rockerstore
DB_PASSWORD=defina_uma_senha

MYSQL_ROOT_PASSWORD=defina_outra_senha
```

Substitua os valores demonstrativos das senhas por senhas de sua escolha.

Essas credenciais serão utilizadas para inicializar o banco MySQL.

### 4. Configurar o ambiente Laravel

Abra o arquivo `back/.env` e ajuste as seguintes variáveis:

```dotenv
APP_NAME=RockerStore
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=rockerstore
DB_USERNAME=rockerstore
DB_PASSWORD=defina_uma_senha

SESSION_DRIVER=database

ROCKERSTORE_SEED_PASSWORD=defina_uma_senha_de_teste
```

A variável `DB_PASSWORD` deve receber exatamente a mesma senha configurada no arquivo `.env` da raiz.

A variável `ROCKERSTORE_SEED_PASSWORD` define a senha que será utilizada pelas contas demonstrativas criadas pelos seeders.

Mantenha as demais configurações do arquivo, salvo quando houver necessidade específica de alteração.

A variável `APP_KEY` será preenchida posteriormente pelo comando `php artisan key:generate`.

**A configuração `APP_DEBUG=true` é destinada exclusivamente ao ambiente local de desenvolvimento.**

### 5. Construir e iniciar os containers

Com o Docker Desktop iniciado, execute na raiz do projeto:

```bash
docker compose up -d --build
```

O Docker Compose iniciará os seguintes serviços:

- `db`: banco de dados MySQL.
- `api`: aplicação Laravel executada pelo Apache.
- `front`: interface web disponibilizada pelo Nginx.
- `proxy`: proxy reverso Nginx.

A inicialização do backend depende da verificação de saúde do MySQL.

Para conferir o estado dos serviços:

```bash
docker compose ps
```

### 6. Instalar as dependências do Laravel

Execute:

```bash
docker compose exec api composer install
```

O Composer instalará as dependências PHP definidas no projeto.

Esse comando é executado dentro do container da API, portanto não exige Composer instalado no computador.

### 7. Gerar a chave da aplicação

Execute:

```bash
docker compose exec api php artisan key:generate
```

Esse comando gera a chave utilizada pelo Laravel para recursos como criptografia e sessões.

### 8. Executar as migrations

Execute:

```bash
docker compose exec api php artisan migrate
```

As migrations criam a estrutura das tabelas necessárias ao funcionamento do sistema.

Para verificar o resultado:

```bash
docker compose exec api php artisan migrate:status
```

### 9. Criar os dados demonstrativos

Para preencher o banco com dados de teste, execute:

```bash
docker compose exec api php artisan db:seed
```

Os seeders criam categorias, produtos, usuários, endereços, carrinhos e pedidos demonstrativos.

A senha das contas de teste será aquela definida em `ROCKERSTORE_SEED_PASSWORD`, no arquivo `back/.env`.

**Atenção:** os seeders são destinados ao ambiente de demonstração. Sua execução pode criar ou atualizar registros existentes. Evite executá-los em bancos com dados importantes sem realizar um backup.

Os produtos demonstrativos são criados sem imagens enviadas pelo administrador; imagens podem ser adicionadas posteriormente pelo painel administrativo.

### 10. Configurar o armazenamento público

Execute:

```bash
docker compose exec api php artisan storage:link
```

O comando cria o link simbólico utilizado pelo Laravel para disponibilizar arquivos do armazenamento público, incluindo as imagens cadastradas para os produtos.

Se o link já existir, não será necessário criá-lo novamente.

### 11. Acessar a aplicação

Após concluir a instalação, utilize os seguintes endereços:

| Recurso                       | Endereço                                    |
| ----------------------------- | ------------------------------------------- |
| Loja                          | `http://localhost`                          |
| Login                         | `http://localhost/pages/auth/login.html`    |
| Cadastro                      | `http://localhost/pages/auth/register.html` |
| Painel administrativo         | `http://localhost/pages/admin/index.html`   |
| Listagem de produtos da API   | `http://localhost/api/products`             |
| Listagem de categorias da API | `http://localhost/api/categories`           |

O acesso ao painel administrativo exige autenticação com uma conta que possua a função de administrador.

## Contas demonstrativas

O projeto possui seeders para criar as seguintes contas:

| E-mail                      | Função        |
| --------------------------- | ------------- |
| `admin@rockerstore.test`    | Administrador |
| `cliente1@rockerstore.test` | Cliente       |
| `cliente2@rockerstore.test` | Cliente       |
| `cliente3@rockerstore.test` | Cliente       |

Todas utilizam a senha definida na variável `ROCKERSTORE_SEED_PASSWORD` do arquivo `back/.env`.

Esses endereços são utilizados apenas para demonstração e não correspondem a caixas de e-mail reais.

É possível acessar a aplicação com as contas criadas pelos seeders e testar diferentes funcionalidades e permissões.

## Principais endpoints da API

### Autenticação

| Método | Endpoint             | Descrição                       |
| ------ | -------------------- | ------------------------------- |
| POST   | `/api/auth/register` | Cadastro                        |
| POST   | `/api/auth/login`    | Login                           |
| POST   | `/api/auth/logout`   | Logout                          |
| GET    | `/api/user`          | Consulta do usuário autenticado |
| PUT    | `/api/user`          | Atualização dos dados da conta  |

### Produtos e categorias

| Método | Endpoint             | Descrição         |
| ------ | -------------------- | ----------------- |
| GET    | `/api/categories`    | Listar categorias |
| GET    | `/api/products`      | Listar produtos   |
| GET    | `/api/products/{id}` | Consultar produto |

### Carrinho

| Método | Endpoint               | Descrição            |
| ------ | ---------------------- | -------------------- |
| GET    | `/api/cart`            | Consultar carrinho   |
| POST   | `/api/cart/items`      | Adicionar produto    |
| PUT    | `/api/cart/items/{id}` | Atualizar quantidade |
| DELETE | `/api/cart/items/{id}` | Remover produto      |

### Endereços

| Método | Endpoint              | Descrição          |
| ------ | --------------------- | ------------------ |
| GET    | `/api/addresses`      | Listar endereços   |
| POST   | `/api/addresses`      | Cadastrar endereço |
| PUT    | `/api/addresses/{id}` | Atualizar endereço |
| DELETE | `/api/addresses/{id}` | Remover endereço   |
| GET    | `/api/cep/{cep}`      | Consultar CEP      |

### Favoritos

| Método | Endpoint                   | Descrição          |
| ------ | -------------------------- | ------------------ |
| GET    | `/api/favorites`           | Listar favoritos   |
| POST   | `/api/favorites`           | Adicionar favorito |
| DELETE | `/api/favorites/{product}` | Remover favorito   |

### Avaliações

| Método | Endpoint                             | Descrição                      |
| ------ | ------------------------------------ | ------------------------------ |
| GET    | `/api/products/{product}/reviews`    | Listar avaliações              |
| GET    | `/api/products/{product}/reviews/me` | Consultar avaliação do usuário |
| POST   | `/api/products/{product}/reviews`    | Criar avaliação                |
| PUT    | `/api/products/{product}/reviews/me` | Atualizar avaliação            |
| DELETE | `/api/products/{product}/reviews/me` | Remover avaliação              |

### Pedidos

| Método | Endpoint                  | Descrição         |
| ------ | ------------------------- | ----------------- |
| POST   | `/api/orders`             | Criar pedido      |
| GET    | `/api/orders`             | Listar pedidos    |
| GET    | `/api/orders/{id}`        | Consultar pedido  |
| POST   | `/api/orders/{id}/pay`    | Simular pagamento |
| POST   | `/api/orders/{id}/cancel` | Cancelar pedido   |

As rotas administrativas utilizam o prefixo `/api/admin/` e exigem autenticação e autorização de administrador.

## Segurança e integridade

A aplicação utiliza recursos do Laravel para autenticação, autorização e validação das requisições.

Entre os mecanismos utilizados estão:

- Laravel Sanctum para autenticação.
- Sessões e cookies.
- Proteção CSRF.
- Form Requests para validação.
- Middleware para restringir funcionalidades administrativas.
- Senhas armazenadas por meio de hash.
- Transações de banco de dados.
- Bloqueio de registros em operações de estoque.
- Validação de arquivos enviados.

Durante o checkout, a validação de estoque e a atualização dos registros são realizadas no backend.

O sistema também preserva informações históricas dos pedidos, incluindo os preços praticados no momento da compra.

## Comandos úteis

**Iniciar os serviços:**

```bash
docker compose up -d
```

**Reconstruir e iniciar:**

```bash
docker compose up -d --build
```

**Consultar o estado dos containers:**

```bash
docker compose ps
```

**Acompanhar os logs:**

```bash
docker compose logs -f
```

**Consultar as migrations:**

```bash
docker compose exec api php artisan migrate:status
```

**Consultar as rotas Laravel:**

```bash
docker compose exec api php artisan route:list
```

**Interromper os containers:**

```bash
docker compose down
```

O comando `docker compose down` não remove automaticamente o volume nomeado do MySQL.

Evite utilizar `docker compose down -v` quando desejar preservar os dados do banco, pois essa opção remove os volumes gerenciados pelo Compose.

## Solução de problemas

### A porta 80 já está sendo utilizada

Verifique se outro serviço, como Apache, Nginx ou outra aplicação Docker, está utilizando a porta `80`.

A RockerStore utiliza essa porta para disponibilizar a aplicação em `http://localhost`.

### O banco de dados não conecta

Confira se os valores `DB_DATABASE`, `DB_USERNAME` e `DB_PASSWORD` são compatíveis nos arquivos `.env` da raiz e `back/.env`.

Verifique também se o serviço `db` está saudável:

```bash
docker compose ps
```

As credenciais do MySQL são utilizadas na inicialização do volume de dados. Alterar essas variáveis depois que o banco já foi criado não atualiza automaticamente os usuários e senhas armazenados.

### Erro relacionado à chave da aplicação

Confira se existe uma chave em `APP_KEY`, no arquivo `back/.env`.

Se estiver vazia, execute:

```bash
docker compose exec api php artisan key:generate
```

### As tabelas ainda não existem

Execute:

```bash
docker compose exec api php artisan migrate
```

### Não existem produtos ou usuários de demonstração

Confira se a variável `ROCKERSTORE_SEED_PASSWORD` foi configurada e execute:

```bash
docker compose exec api php artisan db:seed
```

### As imagens enviadas não aparecem

Confira se o link de armazenamento público existe:

```bash
docker compose exec api php artisan storage:link
```

## Observações sobre o projeto

A RockerStore é um projeto acadêmico desenvolvido para demonstrar a construção de um e-commerce com arquitetura separada, API REST, autenticação, persistência de dados e infraestrutura baseada em containers.

O sistema não realiza pagamentos financeiros reais e não utiliza integração externa para contratação de frete.

A configuração descrita neste README é destinada ao ambiente local de desenvolvimento e avaliação acadêmica.

Antes de uma implantação em produção, seriam necessárias configurações adicionais de segurança, HTTPS, permissões, armazenamento persistente, credenciais e execução dos serviços.

## Autor

Projeto desenvolvido por Gustavo Ferreira.
