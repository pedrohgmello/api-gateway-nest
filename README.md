# API Gateway

Gateway de API construído do zero em NestJS, com roteamento dinâmico, balanceamento de carga e proxy reverso, sem depender de soluções prontas como Kong ou NGINX. Fiz esse projeto pra entender como um Gateway de verdade funciona por dentro, não só como usar um pronto.

> Frontend em desenvolvimento — em breve.

## O que ele faz

- **Registro dinâmico de serviços**: qualquer serviço pode ser registrado via API, sem precisar reiniciar o Gateway ou alterar código
- **Roteamento por prefixo**: requisições são direcionadas ao serviço correto com base no path (ex: `/users/*` vai para o `user-service`)
- **Balanceamento de carga (round-robin)**: distribui requisições entre múltiplas instâncias de um mesmo serviço
- **Proxy reverso de verdade**: repassa a requisição inteira (método, headers, body) para o serviço de destino, sem expor a topologia interna ao cliente
- **Tratamento de falha**: erros de comunicação com o serviço de destino retornam `502 Bad Gateway` ou `504 Gateway Timeout`, não um erro genérico

## Arquitetura

```
Cliente
  │
  ▼
┌─────────────────────────────┐
│      API Gateway (Nest)     │
│                              │
│  ┌────────────────────────┐ │
│  │  ServicesController    │ │  → CRUD de serviços (rota fixa)
│  │  POST/GET/PATCH/DELETE │ │
│  │  /services              │ │
│  └───────────┬────────────┘ │
│              │ grava/lê      │
│              ▼               │
│         [ MongoDB ]          │
│              ▲               │
│              │ consulta       │
│  ┌───────────┴────────────┐ │
│  │   ProxyController       │ │  → catch-all (rota coringa)
│  │   ALL *path              │ │
│  └───────────┬────────────┘ │
│              │               │
│              ▼               │
│  ┌────────────────────────┐ │
│  │  LoadBalancerService    │ │  → round-robin em memória
│  └───────────┬────────────┘ │
│              │               │
│              ▼               │
│  ┌────────────────────────┐ │
│  │    ProxyService          │ │  → monta e envia a requisição
│  └───────────┬────────────┘ │
└──────────────┼───────────────┘
               ▼
      Serviço de destino
      (instância escolhida)
```

## Decisões técnicas

### Por que registro por prefixo, e não rota por rota

Um serviço é registrado com um **prefixo** (ex: `/users`), não com cada endpoint individual. O Gateway repassa qualquer requisição que comece com esse prefixo inteira para o serviço de destino, que resolve o roteamento interno por conta própria. É a mesma lógica de Kong ou do AWS API Gateway: o Gateway não deveria duplicar roteamento que já existe dentro de cada serviço.

### Por que o catch-all não substitui as rotas fixas

O Gateway só tem duas categorias de rota: as fixas de administração (`/services`, pro CRUD de registro) e uma rota coringa (`@All('*path')`) que pega tudo o mais. "Registrar uma rota em runtime" não quer dizer criar rota nova no Nest. Rotas do Nest são resolvidas na inicialização e não mudam depois disso. O que muda em runtime é só o **dado** que a rota coringa consulta, guardado no MongoDB.

### Por que o round-robin vive em memória, não no banco

O contador de round-robin muda a cada requisição. Guardar isso no MongoDB significaria escrever no banco toda requisição só pra incrementar um número. Em vez disso, o `LoadBalancerService` é um provider singleton do Nest e mantém o estado num `Map` na própria memória do processo. O MongoDB guarda só a configuração estável (quais instâncias existem), não qual foi usada por último.

> Se o Gateway precisar rodar em várias réplicas no futuro, isso teria que migrar pra Redis (`INCR` atômico), já que réplicas diferentes não dividem memória entre si.

### Cuidados no proxy reverso

Repassar uma requisição HTTP de forma transparente exige tirar alguns headers da requisição original antes de reencaminhar:

- **`Content-Length`**: o cliente HTTP recalcula isso sozinho a partir do novo corpo serializado. Repassar o valor original dá `RequestContentLengthMismatchError`, porque o corpo pode mudar de tamanho depois de reserializado.
- **`Host`**: aponta pro próprio Gateway, não pro serviço de destino, então não faz sentido repassar.
- **Corpo em métodos `GET`/`HEAD`**: a especificação HTTP não permite corpo nesses métodos. Mandar mesmo assim quebra a requisição no cliente HTTP.

## Stack

- **NestJS** + TypeScript
- **MongoDB** (Mongoose) — persistência da configuração de serviços
- **Node.js `fetch`** nativo — comunicação com os serviços de destino

## Rotas

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/services` | Registra um novo serviço |
| `GET` | `/services` | Lista todos os serviços registrados |
| `GET` | `/services/:id` | Busca um serviço específico |
| `PATCH` | `/services/:id` | Atualiza um serviço existente |
| `DELETE` | `/services/:id` | Remove um serviço |
| `ALL` | `/*` | Proxy dinâmico — roteado por prefixo registrado |

## Rodando localmente

```bash
npm install
npm run start:dev
```

Configure a variável de ambiente `MONGO_URI` em um arquivo `.env` na raiz do projeto.

## Próximos passos

- Frontend para gerenciar serviços registrados (em desenvolvimento)
- Health check periódico das instâncias
- Rate limiting por serviço
