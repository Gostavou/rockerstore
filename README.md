# RockerStore

**Sistema de e-commerce de instrumentos musicais desenvolvido com Laravel, PHP, MySQL, JavaScript e Bootstrap.**

A RockerStore é uma aplicação web voltada à comercialização de instrumentos musicais, incluindo guitarras, baixos e baterias.

O projeto foi desenvolvido com separação entre frontend, backend, banco de dados e proxy reverso, utilizando Docker Compose para organizar a infraestrutura da aplicação.

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
- JavaScript puro
- Bootstrap 5
- Fetch API
- FormData

### Infraestrutura

- Docker
- Docker Compose
- Nginx
- Apache
- MySQL 8.4

O frontend não utiliza Blade, React ou Vue. A comunicação com o backend ocorre por meio de uma API HTTP que retorna respostas JSON.

## Arquitetura do projeto

A aplicação é organizada em quatro serviços Docker independentes:

| Serviço | Tecnologia             | Responsabilidade                               |
| ------- | ---------------------- | ---------------------------------------------- |
| front   | Nginx                  | Disponibilizar a interface da aplicação        |
| api     | PHP + Apache + Laravel | Processar requisições e regras de negócio      |
| db      | MySQL 8.4              | Armazenar dados da aplicação                   |
| proxy   | Nginx                  | Encaminhar requisições para frontend e backend |

O proxy é o ponto de entrada principal da aplicação e direciona as requisições conforme o caminho solicitado.

As requisições para `/api/` são encaminhadas ao Laravel, enquanto as demais rotas são direcionadas ao frontend. Os caminhos `/sanctum/` e `/storage/` também são encaminhados ao backend.

## Estrutura de diretórios

- `back/` — Backend Laravel, controllers, models, services, migrations e API.
- `front/` — Interface da aplicação, páginas HTML, CSS, JavaScript e recursos estáticos.
- `front/admin/` — Painel administrativo.
- `proxy/` — Configuração do proxy reverso Nginx.
- `compose.yaml` — Definição dos serviços Docker.
- `.env.example` — Exemplo de configuração do ambiente Docker Compose.

## Funcionalidades

### Clientes

- Cadastro e autenticação de usuários.
- Gerenciamento de dados da conta.
- Cadastro, edição e exclusão de endereços.
- Consulta de produtos e categorias.
- Pesquisa e filtragem do catálogo.
- Visualização dos detalhes dos produtos.
- Carrinho de compras para visitantes e usuários autenticados.
- Integração do carrinho do visitante após autenticação.
- Checkout autenticado com seleção de endereço.
- Consulta do histórico e dos detalhes dos pedidos.
- Simulação de pagamento.
- Cancelamento de pedidos conforme as regras de negócio.

### Administração

- Cadastro, edição e exclusão de categorias.
- Cadastro e gerenciamento de produtos.
- Controle de preços, estoque e disponibilidade.
- Exclusão lógica de produtos.
- Upload, pré-visualização, substituição e remoção de imagens dos produtos.
- Consulta e gerenciamento de pedidos.
- Atualização do status dos pedidos.
- Restrição de acesso às funcionalidades administrativas.

### Processamento de pedidos

O checkout utiliza transações de banco de dados para manter a consistência entre a criação do pedido e a atualização do estoque.

O sistema realiza validação de disponibilidade e quantidade, registra os itens com os valores praticados na compra e mantém informações históricas dos pedidos.

O pagamento é simulado, sem integração com gateways financeiros externos. O frete utiliza um valor fixo demonstrativo.

## Contas de teste

O projeto possui seeders que criam usuários demonstrativos para verificar as funcionalidades de clientes e administradores.

| E-mail                    | Papel         |
| ------------------------- | ------------- |
| admin@rockerstore.test    | Administrador |
| cliente1@rockerstore.test | Cliente       |
| cliente2@rockerstore.test | Cliente       |
| cliente3@rockerstore.test | Cliente       |

Todas as contas demonstrativas utilizam a senha configurada na variável `ROCKERSTORE_SEED_PASSWORD` do arquivo `back/.env`.

A senha não é armazenada diretamente no código nem publicada no repositório.

Para gerar os dados demonstrativos em um banco de desenvolvimento preparado para isso:

`docker compose exec api php artisan db:seed`

A execução completa dos seeders pode atualizar registros demonstrativos existentes, incluindo informações de produtos. Não execute esse comando em um banco com dados que deseja preservar sem antes realizar uma cópia de segurança.

Os dados incluem categorias, produtos, endereços, carrinhos e pedidos em diferentes estados.

## Regra de fusão dos carrinhos

A RockerStore permite que visitantes adicionem produtos ao carrinho antes de realizar o login ou cadastro.

O carrinho do visitante é armazenado no banco de dados e identificado por um token associado a um cookie. O token é gerado aleatoriamente e seu hash SHA-256 é utilizado para localizar o carrinho.

Quando o visitante realiza login ou cadastro, o sistema executa a fusão do carrinho de visitante com o carrinho da conta autenticada.

### Regras utilizadas

1. Se o produto existir apenas no carrinho do visitante, ele será transferido ao carrinho do usuário.
2. Se o produto existir nos dois carrinhos, as quantidades serão somadas.
3. Se a soma ultrapassar o estoque disponível, a quantidade será limitada ao estoque.
4. Produtos inativos, inexistentes ou sem estoque não serão transferidos.
5. Caso alguma quantidade seja ajustada ou algum produto não seja transferido, a API retornará avisos.
6. Após a fusão, o carrinho de visitante será excluído e seu cookie de identificação será removido.

A operação é realizada por meio do método `mergeGuestCart()` da classe `CartService`, utilizando uma transação de banco de dados.

### Exemplo

Um visitante possui duas unidades de uma guitarra no carrinho.

O mesmo usuário já possui três unidades dessa guitarra no carrinho de sua conta.

Ao realizar o login:

- Quantidade do visitante: 2.
- Quantidade da conta: 3.
- Quantidade solicitada após a fusão: 5.

Se o estoque disponível for de quatro unidades, o carrinho ficará com quatro unidades, e a API informará que a quantidade foi ajustada.

### Cálculo dos valores

Os valores do carrinho são calculados pelo servidor com base nos preços atuais dos produtos.

O carrinho não congela preços. O congelamento ocorre somente na criação do pedido, quando o sistema registra o nome e o preço unitário praticado.

Essa regra evita que o frontend determine os valores utilizados no checkout.

## Requisitos

Para executar o ambiente de desenvolvimento, é necessário ter instalado:

- Git.
- Docker Desktop com Docker Compose.
- Navegador atualizado.

O PHP, o Apache, o Nginx e o MySQL são executados nos respectivos containers.

## Instalação e execução

### 1. Clonar o repositório

`git clone https://github.com/Gostavou/rockerstore.git`

`cd rockerstore`

Caso esteja utilizando a branch de desenvolvimento:

`git switch feature/frontend-proxy-manual`

### 2. Configurar as variáveis de ambiente

Crie o arquivo `.env` na raiz a partir de `.env.example`.

No Prompt de Comando do Windows (CMD):

`copy .env.example .env`

`copy back\.env.example back\.env`

No Git Bash, Linux ou macOS:

`cp .env.example .env`

`cp back/.env.example back/.env`

Configure os valores utilizados pelo Docker Compose:

- `DB_DATABASE=rockerstore`
- `DB_USERNAME=rockerstore`
- `DB_PASSWORD=` — Defina uma senha para o usuário do banco.
- `MYSQL_ROOT_PASSWORD=` — Defina uma senha para o administrador do MySQL.

Em seguida, crie o arquivo de ambiente do Laravel:

`Copy-Item back/.env.example back/.env`

No arquivo `back/.env`, ajuste as configurações necessárias:

- `APP_NAME=RockerStore`
- `APP_ENV=local`
- `APP_DEBUG=true`
- `APP_URL=http://localhost`
- `DB_CONNECTION=mysql`
- `DB_HOST=db`
- `DB_PORT=3306`
- `DB_DATABASE=rockerstore`
- `DB_USERNAME=rockerstore`
- `DB_PASSWORD=` — Utilize a mesma senha configurada no `.env` da raiz.

O projeto utiliza autenticação baseada em sessão e cookies por meio do Laravel Sanctum.

Para executar os seeders de usuários, configure também `ROCKERSTORE_SEED_PASSWORD` no ambiente Laravel com uma senha de teste.

**Não envie arquivos `.env` com credenciais reais para o repositório.**

### 3. Construir e iniciar os containers

`docker compose up -d --build`

### 4. Instalar as dependências PHP

`docker compose exec api composer install`

### 5. Gerar a chave da aplicação

`docker compose exec api php artisan key:generate`

### 6. Executar as migrations

`docker compose exec api php artisan migrate`

Para popular o banco com dados demonstrativos, após configurar a senha dos usuários de teste:

`docker compose exec api php artisan db:seed`

O comando de seed é destinado ao ambiente de desenvolvimento e pode inserir ou atualizar registros demonstrativos.

### 7. Configurar o armazenamento público

`docker compose exec api php artisan storage:link`

Esse comando disponibiliza os arquivos do disco público do Laravel por meio do diretório `public/storage`, utilizado para servir imagens de produtos.

### 8. Acessar a aplicação

Após a inicialização, acesse:

**Loja:** `http://localhost`

**Painel administrativo:** `http://localhost/admin/`

**API:** `http://localhost/api/`

**Documentação da API:** `http://localhost/api/docs`

O acesso administrativo exige uma conta com a permissão correspondente.

## Principais endpoints da API

| Método | Endpoint                  | Descrição                  |
| ------ | ------------------------- | -------------------------- |
| POST   | `/api/auth/register`      | Cadastro de usuário        |
| POST   | `/api/auth/login`         | Autenticação               |
| POST   | `/api/auth/logout`        | Encerramento da sessão     |
| GET    | `/api/categories`         | Listagem de categorias     |
| GET    | `/api/products`           | Listagem de produtos       |
| GET    | `/api/products/{id}`      | Detalhes de um produto     |
| GET    | `/api/cart`               | Consulta do carrinho       |
| POST   | `/api/cart/items`         | Adicionar item ao carrinho |
| PUT    | `/api/cart/items/{id}`    | Atualizar quantidade       |
| DELETE | `/api/cart/items/{id}`    | Remover item               |
| GET    | `/api/addresses`          | Listagem de endereços      |
| POST   | `/api/orders`             | Criar pedido               |
| GET    | `/api/orders`             | Consultar pedidos          |
| GET    | `/api/orders/{id}`        | Detalhes de um pedido      |
| POST   | `/api/orders/{id}/pay`    | Simular pagamento          |
| POST   | `/api/orders/{id}/cancel` | Cancelar pedido            |

As operações administrativas utilizam rotas sob `/api/admin/` e exigem autenticação e autorização apropriadas.

## Segurança e integridade

A aplicação utiliza recursos do Laravel para autenticação, autorização, validação de dados e proteção de requisições.

As operações de checkout utilizam transações de banco de dados e mecanismos de bloqueio de registros para reduzir problemas de concorrência na atualização do estoque.

Os produtos utilizam exclusão lógica, permitindo preservar as referências necessárias ao histórico de pedidos.

O upload de imagens utiliza validação de tipo e tamanho de arquivo.

## Comandos úteis

**Consultar o estado dos containers:**

`docker compose ps`

**Acompanhar os logs:**

`docker compose logs -f`

**Verificar as migrations:**

`docker compose exec api php artisan migrate:status`

**Consultar as rotas Laravel:**

`docker compose exec api php artisan route:list`

**Interromper os containers:**

`docker compose down`

O comando `docker compose down` não remove automaticamente o volume nomeado do MySQL. Evite utilizar a opção `-v` quando desejar preservar os dados do banco.

## Estado do projeto

A RockerStore é um projeto acadêmico desenvolvido para demonstrar a construção de uma aplicação de e-commerce com arquitetura separada, API REST, autenticação, persistência de dados e infraestrutura com containers.

A infraestrutura documentada neste repositório é destinada ao desenvolvimento local. Antes de uma implantação em produção, são necessárias revisões adicionais de segurança, HTTPS, persistência de arquivos, configurações de ambiente e execução dos serviços.

O projeto não realiza pagamentos financeiros reais nem utiliza serviços externos de frete.

## Autor

Projeto desenvolvido por Gustavo Ferreira.
