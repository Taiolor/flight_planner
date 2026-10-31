# Documentação Arquitetural C4 Model — Smart Fly (Flight Planner)

Esta documentação descreve a arquitetura completa do sistema **Smart Fly — Planejador de Passagens Aéreas** utilizando a abordagem **C4 Model** (Contexto, Contêineres, Componentes e Código/Dados), acompanhada de diagramas em **Mermaid** e referências diretas ao código-fonte.

---

## 1. Visão Geral do Sistema

O **Smart Fly** é uma aplicação web progressiva (PWA) full-stack voltada para o planejamento anual, cotação, controle de emissão de bilhetes (em R$ e milhas Smiles/LATAM Pass), gestão financeira com projeções sazonais e envio automatizado de alertas (Web Push e E-mail) para viagens aéreas semanais (especialmente na rota fixa **GRU ↔ NVT**).

### Stack Tecnológica Principal

| Camada | Tecnologias | Arquivos Principais |
| :--- | :--- | :--- |
| **Frontend (SPA / PWA)** | React 19, Vite 8, TypeScript, Tailwind CSS 4, Wouter, TanStack Query, tRPC Client, Recharts, Radix UI / shadcn | `client/src/App.tsx`, `client/src/pages/Home.tsx`, `client/public/sw.js` |
| **Backend (API & Jobs)** | Node.js, Express 4, tRPC 11, Zod, Helmet (CSP), Express Rate Limit, Web-Push (VAPID), Resend SDK | `server/_core/index.ts`, `server/routers.ts`, `server/pushNotifications.ts` |
| **Banco de Dados** | MySQL 8 / TiDB, Drizzle ORM, Drizzle Kit (25+ migrations) | `drizzle/schema.ts`, `server/db.ts`, `server/financialDb.ts` |

---

## 2. Nível 1 — Diagrama de Contexto do Sistema (System Context)

O **Nível 1 (Contexto)** mostra como o **Smart Fly** se insere no ambiente, quem são seus usuários e com quais sistemas externos ele se comunica.

```mermaid
flowchart TB
    subgraph Usuarios["👥 Atores / Usuários"]
        Admin["👤 Viajante / Administrador\n[Person]\nGerencia semanas, emite bilhetes,\ncota passagens e analisa finanças"]
        Visitor["👁️ Visitante Público\n[Person]\nVisualiza calendário e status geral\nsem dados sensíveis (localizadores)"]
        Recipients["📧 Destinatários de Alertas\n[Person]\nRecebem e-mails automáticos de\nbilhetes emitidos/alterados e links de agenda"]
    end

    subgraph SistemaCentral["✈️ Sistema Alvo"]
        SmartFly["🌐 Smart Fly — Flight Planner\n[Software System]\nPlanejamento anual de voos, cotações,\ngestão financeira/milhas e alertas inteligentes"]
    end

    subgraph SistemasExternos["☁️ Sistemas e Serviços Externos"]
        SkyScrapper["🔍 Sky Scrapper API (RapidAPI)\n[External System]\nBusca automatizada de menores preços\ne horários de voos GRU ↔ NVT"]
        Resend["📨 Resend Email API\n[External System]\nDisparo de e-mails transacionais\n(emissão, edição, exclusão e compartilhamento)"]
        WebPush["🔔 Serviços Web Push (FCM / APNs / Mozilla)\n[External System]\nEntrega de notificações push VAPID\npara navegadores e dispositivos móveis"]
        Calendars["📅 Provedores de Calendário e Busca\n[External System]\nGoogle Calendar, Outlook, Kayak,\nGoogle Flights e WhatsApp"]
        ManusForge["🛡️ Manus OAuth & Forge API\n[External System]\nAutenticação OAuth, Proxy de Mapas,\nLLM e Storage S3"]
    end

    Admin -->|"Gerencia voos, cotações, finanças e alertas (HTTPS)"| SmartFly
    Visitor -->|"Consulta planejamento público (HTTPS)"| SmartFly
    SmartFly -->|"Consulta preços e itinerários (REST / JSON)"| SkyScrapper
    SmartFly -->|"Envia alertas HTML de bilhetes (HTTPS / SDK)"| Resend
    Resend -->|"Entrega e-mails"| Recipients
    SmartFly -->|"Dispara alertas de voo agendados (Web Push / VAPID)"| WebPush
    WebPush -->|"Notifica dispositivos inscritos"| Admin
    SmartFly -->|"Gera deep-links, arquivos .ICS e eventos MCP"| Calendars
    SmartFly -->|"Autentica OAuth e consome proxy de mapas/IA"| ManusForge
```

### Detalhamento das Integrações Externas
- **Sky Scrapper API (RapidAPI)** (`server/routers/quotes.ts`): Realiza buscas assíncronas de passagens aéreas para a rota fixa `GRU ↔ NVT`, respeitando o limite gratuito mensal monitorado no banco (`api_usage_tracker`).
- **Resend API** (`server/_core/emailNotification.ts`): Envia notificações automáticas sempre que um bilhete é marcado como emitido, alterado ou removido, além de compartilhamento sob demanda.
- **Web Push Protocol (VAPID)** (`server/pushNotifications.ts`): Envia alertas de proximidade de voo (`Aviso 1` e `Aviso 2`) diretamente aos dispositivos registrados.
- **Integrações de Calendário e Deep-Links** (`client/src/lib/calendarHelper.ts`, `server/_core/calendarIntegration.ts`): Criação de eventos no Google Calendar, Outlook, exportação `.ics`, links de rastreio do voo e cotação manual via Kayak.

---

## 3. Nível 2 — Diagrama de Contêineres (Container Diagram)

O **Nível 2 (Contêineres)** detalha as unidades de execução e armazenamento que compõem o sistema **Smart Fly**.

```mermaid
flowchart TB
    Admin["👤 Viajante / Administrador\n[Person]"]
    Visitor["👁️ Visitante Público\n[Person]"]

    subgraph SmartFlyBoundary["Sistema Smart Fly (Flight Planner)"]
        SPA["💻 Aplicação Web SPA / PWA\n[Container: React 19 + Vite + Tailwind CSS]\nInterface interativa com tabela semanal,\ncalendário, cotações, dashboard financeiro\ne exportação PDF"]
        SW["⚙️ Service Worker\n[Container: JavaScript Worker (sw.js)]\nCache de ativos estáticos, suporte offline\ne recepção de eventos Web Push em background"]
        API["🚀 API Server & Backend\n[Container: Node.js + Express 4 + tRPC 11]\nServe o bundle estático em produção,\ngerencia sessões, aplica rate-limit/CSP\ne expõe a API tipada tRPC"]
        CronJob["⏱️ Agendador de Alertas (Background Job)\n[Container: In-Process Node Timer]\nVerifica a cada 1h os voos emitidos próximos\ndo horário de embarque e limpa logs > 90 dias"]
        DB[("🗄️ Banco de Dados Relacional\n[Container: MySQL 8 / TiDB]\nArmazena semanas de voo, preços, cotações,\nsessões, inscrições push, configurações e logs")]
    end

    SkyScrapper["🔍 Sky Scrapper API\n[External System]"]
    Resend["📨 Resend API\n[External System]"]
    WebPush["🔔 Web Push Gateways\n[External System]"]
    Forge["🛡️ Manus Forge / Maps\n[External System]"]

    Admin -->|"Acessa via Navegador / PWA Instalado"| SPA
    Visitor -->|"Acessa via Navegador"| SPA
    SPA <-->|"Registra e recebe eventos push"| SW
    SPA -->|"Chamadas RPC tipadas em lote\n(/api/trpc - JSON/SuperJSON)"| API
    API -->|"Queries e Mutations SQL\n(Drizzle ORM / mysql2)"| DB
    CronJob -->|"Lê voos emitidos, configs e subscriptions;\ngrava notification_logs"| DB
    CronJob -->|"Envia pacotes criptografados VAPID"| WebPush
    WebPush -->|"Entrega push event"| SW
    API -->|"Busca voos e faz polling\n(HTTPS)"| SkyScrapper
    API -->|"Envia e-mails HTML\n(HTTPS)"| Resend
    API -->|"Proxy reverso /api/maps/proxy\n(HTTPS)"| Forge
```

### Responsabilidades de Cada Contêiner

1. **Aplicação Web SPA / PWA (`client/`)**:
   - Construída com **React 19** e empacotada pelo **Vite 8**.
   - Utiliza **Code Splitting (`React.lazy`)** em `client/src/App.tsx` para carregar sob demanda as páginas secundárias (`CalendarView`, `AdminNotifications`, `FlightQuotes`, `Changelog`, `FinancialDashboard`).
   - Comunicação 100% tipada de ponta a ponta com o backend via `@trpc/react-query` e serialização `superjson`.
2. **Service Worker (`client/public/sw.js`)**:
   - Estratégia *Network-First* para navegação e módulos JS/CSS, e *Cache-First* para ativos estáticos (`smartfly-v4`).
   - Escuta eventos `push` e `notificationclick` para exibir alertas nativos do sistema operacional e abrir a aplicação no voo correspondente.
3. **API Server & Backend (`server/_core/index.ts`)**:
   - Servidor **Express 4** protegido com **Helmet** (Content Security Policy customizado em `server/_core/contentSecurityPolicy.ts`) e **Rate Limiting** em duas camadas (`generalLimiter`: 200 req/15min; `authLimiter`: 20 req/15min para `/api/oauth` e `flightAuth.login`).
   - Expõe o adaptador tRPC em `/api/trpc` e um proxy seguro para Google Maps em `/api/maps/proxy`.
4. **Agendador em Background (`server/pushNotifications.ts`)**:
   - Inicializado junto ao servidor via `startFlightNotificationJob()`.
   - Executa `checkAndNotifyUpcomingFlights()` a cada 60 minutos e `cleanupOldLogs()` diariamente às 03:00 UTC.
5. **Banco de Dados Relacional (`drizzle/schema.ts`)**:
   - Instância MySQL 8 / TiDB acessada via pool de conexões `mysql2` e mapeada com **Drizzle ORM**.

---

## 4. Nível 3 — Diagrama de Componentes (Component Diagram)

O **Nível 3 (Componentes)** decompõe tanto a **SPA Frontend** quanto o **Backend API Server** em seus módulos internos e responsabilidades.

### 4.1. Componentes do Frontend (`client/src/`)

```mermaid
flowchart TB
    subgraph AppShell["🧭 Núcleo da Aplicação (client/src)"]
        AppRouter["🧭 App & Router (wouter)\n[App.tsx]\nGerencia rotas e Lazy Loading"]
        Contexts["🌐 Contextos Globais\n[YearContext.tsx / ThemeContext.tsx]\nEstado global de ano ativo e tema claro/escuro"]
        TrpcClient["🔌 Cliente tRPC + React Query\n[lib/trpc.ts & main.tsx]\nCache, invalidação e batching HTTP"]
    end

    subgraph Pages["📄 Páginas da Aplicação (client/src/pages)"]
        HomePage["🏠 Home (Planejador Semanal)\n[Home.tsx]\nTabela das 52 semanas, filtros, preços,\nemissão de bilhetes, milhas e gráficos"]
        CalendarPage["📅 Visão de Calendário\n[CalendarView.tsx]\nCalendário anual, feriados, jogos do Brasil\nna Copa 2026 e detalhes do voo"]
        QuotesPage["💰 Cotações de Passagens\n[FlightQuotes.tsx]\nBusca automática Sky Scrapper API,\nhistórico de preços e atalho Kayak"]
        FinancialPage["📊 Dashboard Financeiro\n[FinancialDashboard.tsx]\nGastos em R$ e milhas por semana/mês/cia\ne projeções 2027 com IPCA e sazonalidade"]
        AdminNotifPage["🔔 Painel Admin de Notificações\n[AdminNotifications.tsx]\nMonitoramento de alertas futuros,\ndispositivos inscritos e logs de envio"]
        ChangelogPage["📝 Novidades (Changelog)\n[Changelog.tsx]\nHistórico de versões e melhorias"]
    end

    subgraph FeatureComponents["🧩 Componentes de Domínio e Hooks"]
        FlightPopup["✈️ FlightPopup & Modais\n[components/flights/FlightPopup.tsx]\nEdição de localizador, voo, terminal e milhas"]
        PdfExport["📄 FlightPdfExport\n[components/FlightPdfExport.tsx]\nExportação de relatórios em PDF (jsPDF)"]
        ShareEmail["📧 ShareByEmailButton\n[components/ShareByEmailButton.tsx]\nCompartilhamento de bilhetes e gestão de e-mails"]
        NotifPopup["⚙️ NotificationSettingsPopup\n[components/NotificationSettingsPopup.tsx]\nConfiguração de Aviso 1 e Aviso 2"]
        WorldCupPanel["🏆 BrazilWorldCupPanel\n[components/BrazilWorldCupPanel.tsx]\nPainel de jogos da Seleção na Copa 2026"]
        LoginModal["🔐 LoginModal\n[components/auth/LoginModal.tsx]\nAutenticação de administrador por e-mail/senha"]
        PushHook["📲 usePushNotifications\n[hooks/usePushNotifications.ts]\nInscrição VAPID no navegador"]
        Helpers["🛠️ Helpers de Domínio\n[lib/flightData.ts, calendarHelper.ts, worldCup2026.ts]\nCálculo de semanas, feriados, links ICS/Google/Outlook"]
    end

    AppRouter --> Contexts
    AppRouter --> HomePage
    AppRouter --> CalendarPage
    AppRouter --> QuotesPage
    AppRouter --> FinancialPage
    AppRouter --> AdminNotifPage
    AppRouter --> ChangelogPage

    HomePage --> FlightPopup
    HomePage --> PdfExport
    HomePage --> ShareEmail
    HomePage --> NotifPopup
    HomePage --> LoginModal
    HomePage --> PushHook
    HomePage --> Helpers

    CalendarPage --> WorldCupPanel
    CalendarPage --> Helpers

    HomePage --> TrpcClient
    CalendarPage --> TrpcClient
    QuotesPage --> TrpcClient
    FinancialPage --> TrpcClient
    AdminNotifPage --> TrpcClient
    ShareEmail --> TrpcClient
    NotifPopup --> TrpcClient
    LoginModal --> TrpcClient
    PushHook --> TrpcClient
```

---

### 4.2. Componentes do Backend (`server/`)

```mermaid
flowchart TB
    subgraph HttpLayer["🛡️ Camada HTTP & Segurança (server/_core)"]
        ExpressApp["🌐 Express Server & Helmet CSP\n[_core/index.ts & contentSecurityPolicy.ts]"]
        RateLimiters["🚦 Rate Limiters\n[_core/trpcLoginRateLimit.ts]\nGeral (200/15m) & Auth (20/15m)"]
        AuthMiddleware["🔑 Flight Auth Middleware\n[flightAuthMiddleware.ts]\nValida cookie 'flight_session'"]
    end

    subgraph TrpcRouters["🔀 Roteadores tRPC (server/routers*)"]
        FlightAuthRouter["🔐 flightAuth Router\n[routers.ts]\nlogin (SHA-256 timingSafeEqual),\ncheck, logout"]
        FlightsRouter["✈️ flights Router\n[routers.ts]\ngetWeeks (com filtro de privacidade),\nupdateWeekStatus, updateWeekDates,\nsavePrice, getPrices"]
        QuotesRouter["🏷️ quotes Router\n[routers/quotes.ts]\nfetchFromApi (Sky Scrapper),\nsaveManual, getApiUsage, getAll"]
        FinancialRouter["📈 financial Router\n[routers/financial.ts]\ngetWeeklyData, getMonthlySummary,\ngetYearSummary, getProjections"]
        PushAndAdminRouter["🔔 push, notificationSettings & adminNotifications\n[routers.ts]\nsubscribe, sendTest, getStatus,\nsendNextAlert, getLogs"]
        TicketNotifRouter["📨 ticketNotifications Router\n[routers.ts]\ngetRecipients, add/removeRecipient,\nshareByEmail, calendar.createRoundTrip"]
    end

    subgraph DomainServices["⚙️ Serviços de Domínio e Persistência"]
        DbService["🗃️ Repositório Principal\n[server/db.ts]\nCRUD Drizzle para semanas, preços,\nsessões, push, logs e cotações"]
        FinancialDbService["🧮 Agregador Financeiro\n[server/financialDb.ts]\nCruzamento de flight_weeks e flight_prices\npor semana, mês, ano e cia aérea"]
        PushService["📲 Serviço Web Push & Job Horário\n[server/pushNotifications.ts]\nEnvio VAPID em lote, remoção automática\nde endpoints 410 Gone e cron job"]
        EmailService["📧 Serviço de E-mail (Resend)\n[server/_core/emailNotification.ts]\nTemplates HTML de criação, edição,\nexclusão e compartilhamento"]
        CalendarService["📅 Integração de Calendário\n[server/_core/calendarHelper.ts & calendarIntegration.ts]\nLinks Google/Outlook, rastreio de voo\ne chamadas MCP Google Calendar"]
    end

    ExpressApp --> RateLimiters
    RateLimiters --> AuthMiddleware
    AuthMiddleware --> FlightAuthRouter
    AuthMiddleware --> FlightsRouter
    AuthMiddleware --> QuotesRouter
    AuthMiddleware --> FinancialRouter
    AuthMiddleware --> PushAndAdminRouter
    AuthMiddleware --> TicketNotifRouter

    FlightAuthRouter --> DbService
    FlightsRouter --> DbService
    FlightsRouter --> EmailService
    FlightsRouter --> CalendarService
    QuotesRouter --> DbService
    FinancialRouter --> FinancialDbService
    FinancialDbService --> DbService
    PushAndAdminRouter --> DbService
    PushAndAdminRouter --> PushService
    TicketNotifRouter --> DbService
    TicketNotifRouter --> EmailService
    TicketNotifRouter --> CalendarService
```

---

## 5. Nível 4 — Código, Modelo de Dados e Fluxos Dinâmicos

O **Nível 4** apresenta o esquema detalhado do banco de dados (Entidade-Relacionamento) e os diagramas de sequência dos fluxos mais críticos implementados no código.

### 5.1. Diagrama Entidade-Relacionamento (Banco de Dados — `drizzle/schema.ts`)

```mermaid
erDiagram
    FLIGHT_WEEKS {
        int id PK
        int year "Default: 2026 (Idx)"
        int weekNumber "Número da semana 1..53 (Idx)"
        varchar departureDate "Data de ida"
        varchar returnDate "Data de volta"
        varchar departureDayOfWeek
        varchar returnDayOfWeek
        varchar holiday "Feriado associado"
        int isDeleted "0 = ativo, 1 = excluído (Idx)"
        int isTicketIssued "0 = pendente, 1 = emitido (Idx)"
        int isSelected "0 ou 1"
        varchar departureAirline "latam | gol | azul"
        varchar returnAirline "latam | gol | azul"
        varchar departureFlightDatetime "YYYY-MM-DDTHH:mm"
        varchar returnFlightDatetime "YYYY-MM-DDTHH:mm"
        varchar departureAirport "Ex: GRU, CGH, VCP"
        varchar returnAirport "Ex: NVT, FLN, JTC"
        varchar departureLocator "Código localizador ida (Sensível)"
        varchar returnLocator "Código localizador volta (Sensível)"
        varchar departureFlightNumber "Número do voo ida (Sensível)"
        varchar returnFlightNumber "Número do voo volta (Sensível)"
        varchar departureTerminal "Terminal embarque ida"
        varchar returnTerminal "Terminal embarque volta"
        varchar ticketType "roundtrip | oneway"
        int smilesPoints "Milhas Smiles gastas"
        int latamPassPoints "Milhas LATAM Pass gastas"
        int departureRescheduled "0 = normal, 1 = remarcado"
        int returnRescheduled "0 = normal, 1 = remarcado"
        timestamp createdAt
        timestamp updatedAt
    }

    FLIGHT_PRICES {
        int id PK
        int year "Default: 2026"
        int weekNumber "FK lógica -> flight_weeks"
        varchar airline "Companhia aérea"
        varchar price "Valor em R$"
        timestamp createdAt
        timestamp updatedAt
    }

    PUBLIC_PRICES {
        int id PK
        int year
        int weekNumber
        varchar airline
        varchar price
        timestamp createdAt
        timestamp updatedAt
    }

    FLIGHT_QUOTES {
        int id PK
        int weekNumber "FK lógica -> flight_weeks (Idx)"
        varchar departureDate "YYYY-MM-DD"
        varchar returnDate "YYYY-MM-DD"
        int lowestPrice "Em centavos (BRL)"
        varchar currency "BRL"
        enum source "api | manual"
        varchar airline
        varchar outboundAirline
        varchar returnAirline
        varchar outboundDeparture "ISO 8601"
        varchar outboundArrival "ISO 8601"
        varchar returnDeparture "ISO 8601"
        varchar returnArrival "ISO 8601"
        int apiRequestsUsed
        text rawResponse "JSON truncado p/ debug"
        timestamp quotedAt "Idx"
    }

    API_USAGE_TRACKER {
        int id PK
        varchar yearMonth UK "Formato YYYY-MM"
        int requestsUsed "Contador mensal"
        int requestsLimit "Default: 20"
        timestamp updatedAt
    }

    AUTH_SESSIONS {
        int id PK
        varchar sessionToken UK "Token aleatório 128 chars"
        varchar email
        timestamp expiresAt "TTL de 8 horas"
        timestamp createdAt
    }

    USERS {
        int id PK
        varchar openId UK "Manus OAuth ID"
        text name
        varchar email
        varchar loginMethod
        enum role "user | admin"
        timestamp lastSignedIn
    }

    OTP_CODES {
        int id PK
        varchar email
        varchar code
        timestamp expiresAt
        int used
    }

    PUSH_SUBSCRIPTIONS {
        int id PK
        text endpoint "URL do servidor Web Push"
        text p256dh "Chave pública ECDH do cliente"
        text auth "Segredo de autenticação"
        varchar userAgent "Dispositivo/Navegador"
        timestamp createdAt
    }

    NOTIFICATION_SETTINGS {
        int id PK
        int aviso1Minutes "Default: 1440 (24h antes)"
        int aviso2Minutes "Default: 0 (Desativado)"
        timestamp updatedAt
    }

    NOTIFICATION_LOGS {
        int id PK
        int weekNumber "FK lógica -> flight_weeks"
        varchar direction "ida | volta"
        varchar avisoLabel "Aviso 1 | Aviso 2 | Teste Manual"
        int avisoMinutes
        varchar airline
        varchar flightNumber
        varchar flightDatetime
        varchar status "success | partial | failed"
        int devicesReached
        int totalDevices
        text errorMessage
        int isTest "0 = automático, 1 = teste"
        timestamp sentAt
    }

    TICKET_NOTIFICATION_EMAILS {
        int id PK
        varchar email UK "Destinatário de alertas"
        varchar name
        int active "1 = ativo, 0 = inativo (Idx)"
        timestamp createdAt
        timestamp updatedAt
    }

    FLIGHT_WEEKS ||--o{ FLIGHT_PRICES : "possui preços (weekNumber + year)"
    FLIGHT_WEEKS ||--o{ FLIGHT_QUOTES : "possui cotações (weekNumber)"
    FLIGHT_WEEKS ||--o{ NOTIFICATION_LOGS : "gera logs de alerta (weekNumber)"
    NOTIFICATION_SETTINGS ||--o{ NOTIFICATION_LOGS : "parametriza disparos"
    PUSH_SUBSCRIPTIONS ||--o{ NOTIFICATION_LOGS : "recebe notificações"
```

---

### 5.2. Fluxo 1: Autenticação Segura e Proteção de Dados Sensíveis

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Usuário / Admin
    participant SPA as 💻 React SPA (LoginModal / Home)
    participant Limiter as 🚦 Express Rate Limiter
    participant Router as 🔀 tRPC (flightAuth / flights)
    participant DB as 🗄️ MySQL (auth_sessions / flight_weeks)

    rect rgb(240, 248, 255)
        Note over User,DB: Cenário A: Consulta Pública (Sem Sessão)
        User->>SPA: Acessa a página inicial (/)
        SPA->>Router: Query trpc.flights.getWeeks()
        Router->>DB: validateAuthSession(cookie) -> null
        Router->>DB: getAllFlightWeeks()
        Router-->>SPA: Retorna semanas com localizadores, nº de voo e milhas = null
    end

    rect rgb(240, 255, 244)
        Note over User,DB: Cenário B: Login Administrativo Timing-Safe
        User->>SPA: Informa e-mail e senha no LoginModal
        SPA->>Limiter: POST /api/trpc/flightAuth.login
        Limiter->>Router: Verifica limite (máx 20 req / 15 min por IP)
        Router->>Router: Calcula SHA-256(input) e SHA-256(ENV)<br/>Compara via crypto.timingSafeEqual()
        Router->>DB: createAuthSession(email) (validade 8h)
        Router-->>SPA: Define Cookie HTTP-Only 'flight_session' + { success: true }
        SPA->>Router: Refetch trpc.flights.getWeeks()
        Router->>DB: validateAuthSession(cookie) -> Sessão Válida
        Router-->>SPA: Retorna dados completos (localizadores, voos, terminais e milhas)
    end
```

---

### 5.3. Fluxo 2: Emissão/Edição de Bilhete e Disparo Automático de E-mails

```mermaid
sequenceDiagram
    autonumber
    actor Admin as 👤 Administrador
    participant SPA as 💻 FlightPopup (Home.tsx)
    participant Router as 🔀 tRPC (flights.updateWeekStatus)
    participant DB as 🗄️ MySQL (db.ts)
    participant CalHelper as 📅 calendarHelper.ts
    participant Resend as 📨 Resend API (emailNotification.ts)

    Admin->>SPA: Marca bilhete como emitido (ou altera voo/localizador)
    SPA->>Router: Mutation flights.updateWeekStatus(input)
    Router->>DB: getFlightWeek(weekNumber) (Estado Anterior: weekBefore)
    Router->>DB: updateFlightWeekStatus(weekNumber, input)
    Router->>Router: Detecta transição: isMarkedAsIssued | isUpdated | isDeleted

    alt Bilhete recém-emitido, alterado ou excluído
        Router->>DB: getTicketNotificationEmails() (filtra ativos)
        alt Transição: Recém-Emitido (isMarkedAsIssued)
            Router->>CalHelper: Gera links Google Calendar, Outlook e Rastreio (Ida e Volta)
            Router->>Resend: sendShareByEmailNotification(recipients, htmlCompleto)
        else Transição: Alterado (isUpdated)
            Router->>Router: Calcula diff (before vs after) de Ida e Volta
            Router->>Resend: sendTicketNotificationEmail(recipients, { type: "updated", changes })
        else Transição: Excluído (isDeleted)
            Router->>Resend: sendTicketNotificationEmail(recipients, { type: "deleted" })
        end
        Resend-->>Router: Confirmação de envio
    end

    Router-->>SPA: { success: true }
    SPA->>SPA: Atualiza cache React Query e exibe Toast de sucesso
```

---

### 5.4. Fluxo 3: Cotação Automatizada via Sky Scrapper API com Polling Exponencial

```mermaid
sequenceDiagram
    autonumber
    actor Admin as 👤 Administrador
    participant QuotesPage as 💻 FlightQuotes.tsx
    participant QuotesRouter as 🔀 tRPC (quotes.fetchFromApi)
    participant DB as 🗄️ MySQL (api_usage_tracker / flight_quotes)
    participant SkyAPI as 🔍 Sky Scrapper API (RapidAPI)

    Admin->>QuotesPage: Clica em "Buscar Preço via API" na Semana X
    QuotesPage->>QuotesRouter: Mutation quotes.fetchFromApi({ weekNumber, departureDate, returnDate })
    QuotesRouter->>DB: getApiUsage(yearMonth)

    alt Limite mensal atingido (requestsUsed >= 20)
        QuotesRouter-->>QuotesPage: TRPCError (TOO_MANY_REQUESTS) — Sugere uso do Kayak manual
    else Franquia disponível
        QuotesRouter->>SkyAPI: GET /api/v2/flights/searchFlights (GRU -> NVT)
        SkyAPI-->>QuotesRouter: Retorna sessionId + status ("incomplete" ou "complete")

        loop Até 5 tentativas enquanto status != "complete" ou sem itinerários
            QuotesRouter->>QuotesRouter: Aguarda backoff exponencial (500ms, 1s, 2s, 4s, 8s)
            QuotesRouter->>SkyAPI: GET /api/v2/flights/searchIncomplete?sessionId=...
            SkyAPI-->>QuotesRouter: Retorna itinerários parciais/completos
        end

        QuotesRouter->>QuotesRouter: extractBestFlightInfo() -> Menor preço (centavos) + Cias + Horários
        QuotesRouter->>DB: incrementApiUsage(yearMonth)
        QuotesRouter->>DB: insertFlightQuote({ source: "api", lowestPrice, ... })
        QuotesRouter-->>QuotesPage: Retorna cotação formatada + consumo atualizado da API
    end
```

---

### 5.5. Fluxo 4: Agendador Horário de Notificações Web Push (VAPID)

```mermaid
sequenceDiagram
    autonumber
    participant Timer as ⏱️ Node.js Interval (1h)
    participant Job as ⚙️ checkAndNotifyUpcomingFlights()
    participant DB as 🗄️ MySQL
    participant WebPush as 🔔 Web Push Gateway (FCM/APNs)
    participant SW as 📲 Service Worker (Dispositivo)

    Timer->>Job: Dispara verificação horária
    par Consultas em Paralelo (Promise.all)
        Job->>DB: getAllFlightWeeks()
        Job->>DB: getNotificationSettings() (aviso1Minutes, aviso2Minutes)
        Job->>DB: getAllPushSubscriptions()
    end

    Job->>Job: Filtra semanas com isTicketIssued == 1<br/>Calcula janelas de alerta no fuso de Brasília (-03:00)

    loop Para cada Voo (Ida / Volta) dentro da janela [target - 50min, target + 50min]
        loop Para cada Dispositivo Inscrito (push_subscriptions)
            Job->>WebPush: webpush.sendNotification(endpoint, keys, payload)
            alt Dispositivo Ativo (201 Created)
                WebPush->>SW: Entrega evento 'push'
                SW->>SW: self.registration.showNotification("✈️ Smart Fly...")
            else Inscrição Expirada (410 Gone / 404 Not Found)
                WebPush-->>Job: WebPushError (410 / 404)
                Job->>DB: deletePushSubscription(endpoint)
            end
        end
        Job->>Job: Acumula resultado em logsToInsert[]
    end

    opt Houveram disparos no ciclo
        Job->>DB: insertNotificationLogs(logsToInsert) (Batch Insert)
    end
```

---

## 6. Arquitetura de Segurança e Performance

| Aspecto | Implementação no Projeto | Referência no Código |
| :--- | :--- | :--- |
| **Proteção contra Timing Attacks** | Comparação de e-mail e senha utilizando hash fixo `SHA-256` (32 bytes) + `crypto.timingSafeEqual`. | `server/routers.ts` |
| **Sanitização de Dados Públicos** | Visitantes sem sessão válida recebem a lista de semanas com localizadores, números de voo, terminais e milhas zerados (`null`). | `server/routers.ts` |
| **Prevenção de XSS em E-mails** | Todos os campos dinâmicos injetados em templates HTML de e-mail passam pela função `escapeHtml`. | `server/routers.ts`, `server/_core/emailNotification.ts` |
| **Headers HTTP & CSP** | Configuração estrita de `Content-Security-Policy`, `frameguard` e limite de payload JSON em `2mb` via `helmet`. | `server/_core/index.ts`, `server/_core/contentSecurityPolicy.ts` |
| **Rate Limiting em Camadas** | Limite global de 200 req/15min em `/api` e limite estrito de 20 req/15min para login tRPC e OAuth. | `server/_core/index.ts`, `server/_core/trpcLoginRateLimit.ts` |
| **Ocultação de API Key no Frontend** | Proxy reverso `/api/maps/proxy` injeta a credencial `BUILT_IN_FORGE_API_KEY` apenas no servidor. | `server/_core/index.ts` |
| **Otimizações de Banco e CPU (Bolt)** | Índices compostos no MySQL (`idx_flight_weeks_active_issued`), consultas paralelas com `Promise.all`, *batch insert* de logs e loops de passagem única. | `drizzle/schema.ts`, `server/pushNotifications.ts` |
