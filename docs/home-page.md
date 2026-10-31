# Página Principal — Documentação Mermaid

> Documentação exclusiva da página principal do Smart Fly / Viagens.
> O foco desta documentação é a rota `/`, o dashboard anual de planejamento, seus estados de autenticação, os painéis operacionais e as interações disponíveis.

## 1. Escopo e responsabilidade

A página principal é o dashboard operacional para acompanhar o planejamento anual de viagens aéreas. Ela combina dados de semanas, bilhetes, preços, progresso de emissões, alertas, clima, notificações e preferências de visualização.

- **Rota principal:** `/`
- **Componente:** `client/src/pages/Home.tsx`
- **Modo adicional:** `Home` também pode ser renderizada em `passage-management` para a rota de gestão de passagens.
- **Contexto global:** `YearContext` fornece o exercício selecionado.
- **Autenticação:** `flightAuth.check`, `flightAuth.logout` e `LoginModal`.
- **Tipografia visual do produto:** Roboto, conforme o padrão de conteúdo da aplicação.

## 2. Arquitetura da página

```mermaid
flowchart TD
    App[App.tsx] --> HomeRoute["/"]
    HomeRoute --> Home[Home.tsx]

    Home --> UpdateBar[Última atualização e estado online]
    Home --> Hero[Hero Header]
    Hero --> Brand[Marca Smart Fly / Viagens]
    Hero --> HeaderActions[Ações do cabeçalho]
    HeaderActions --> YearSelector[Seletor global de ano]
    HeaderActions --> MainNavigation[Calendário e Gestão]
    HeaderActions --> MoreMenu[Mais opções]
    HeaderActions --> Account[Entrar ou sair]
    HeaderActions --> Preferences[Tema, cores, valores e notificações]

    Home --> ErrorState[Erro e recuperação]
    Home --> OfflineState[Recuperação offline]
    Home --> Dashboard[Dashboard anual]
    Dashboard --> LayoutControls[Organização dos quadros]
    Dashboard --> DecisionCenter[Central de decisão]
    Dashboard --> AnnualSummary[Resumo anual]
    Dashboard --> WeeklyPlanning[Planejamento por semanas]
    Dashboard --> AnnualProgress[Progresso anual de emissões]
    Dashboard --> AttentionCenter[Central de atenção]
    Dashboard --> PassageManagement[Gestão de passagens]
    Dashboard --> Charts[Gráficos de preços e gastos]
    Dashboard --> AdditionalFlights[Voos adicionais]

    Home --> LoginModal[LoginModal]
```

## 3. Fluxo inicial da página

```mermaid
sequenceDiagram
    actor Usuario
    participant Router as Rota /
    participant Home as Home.tsx
    participant Year as YearContext
    participant Auth as flightAuth.check
    participant API as tRPC API
    participant Cache as Cache e localStorage

    Usuario->>Router: Acessa a página principal
    Router->>Home: Renderiza Home
    Home->>Year: Obtém selectedYear
    Year-->>Home: Retorna exercício selecionado

    Home->>Auth: Verifica sessão interna
    Auth-->>Home: authenticated, email e isAdmin
    Home->>Cache: Lê tema, layout, filtros e preferências

    Home->>API: flights.getWeeks({ year: selectedYear })
    Home->>API: flights.getProgressComparison({ years })

    alt Usuário autenticado
        Home->>API: flights.getPrices({ year })
        Home->>API: additionalFlights.getYear({ year })
        API-->>Home: Preços privados e voos adicionais
    else Usuário não autenticado
        Home->>API: flights.getPublicPrices({ year })
        API-->>Home: Preços públicos
        Home-->>Usuario: Mantém valores monetários ocultos
    end

    API-->>Home: Semanas, preços e progresso
    Home->>Home: Calcula KPIs, alertas, semana atual e prioridades
    Home-->>Usuario: Skeleton, offline recovery ou dashboard completo
```

## 4. Dados e consultas principais

```mermaid
classDiagram
    class HomeState {
        +selectedYear: number
        +isAuthenticated: boolean
        +hideValues: boolean
        +theme: light | dark
        +filterMonth: string
        +filterAirline: string
        +filterTicketStatus: string
        +sortBy: string
        +expandedWeek: number | null
        +expandSummary: boolean
        +expandFilters: boolean
        +isOnline: boolean
    }

    class WeekRow {
        +weekNumber: number
        +departureDate: string
        +returnDate: string
        +ticketType: roundtrip | oneway
        +departureAirline: string
        +returnAirline: string
        +departureFlightDatetime: string
        +returnFlightDatetime: string
        +departureFlightNumber: string
        +returnFlightNumber: string
        +departureTerminal: string
        +returnTerminal: string
        +departureLocator: string
        +returnLocator: string
        +isTicketIssued: boolean
    }

    class FlightPrice {
        +weekNumber: number
        +airline: string
        +price: number
        +year: number
    }

    class AdditionalFlight {
        +weekNumber: number
        +direction: departure | return
        +datetime: string
        +airline: string
        +airport: string
        +flightNumber: string
        +terminal: string
        +locator: string
    }

    class WeeklyPlanningItem {
        +weekNumber: number
        +departureDate: string
        +returnDate: string
        +route: string
        +airline: string
        +lowestPrice: number
        +temporalPosition: previous | current | next
        +status: issued | watch | pending
        +favorite: boolean
    }

    HomeState --> WeekRow : filtra e exibe
    HomeState --> FlightPrice : compara
    HomeState --> AdditionalFlight : agrega
    HomeState --> WeeklyPlanningItem : deriva
```

## 5. Estados da página

```mermaid
stateDiagram-v2
    [*] --> VerificandoSessao
    VerificandoSessao --> CarregandoDados: sessão verificada
    VerificandoSessao --> ModalLogin: ação protegida sem sessão

    CarregandoDados --> DashboardCarregado: semanas recebidas
    CarregandoDados --> ErroRecuperavel: falha na consulta
    CarregandoDados --> RecuperacaoOffline: sem rede e cache disponível
    CarregandoDados --> Skeleton: carregamento inicial
    Skeleton --> DashboardCarregado: conteúdo pronto

    ErroRecuperavel --> CarregandoDados: tentar novamente
    RecuperacaoOffline --> CarregandoDados: tentar sincronização
    RecuperacaoOffline --> DashboardCarregado: usar dados locais

    DashboardCarregado --> ModalLogin: tentar salvar sem autenticação
    DashboardCarregado --> Atualizando: pull-to-refresh ou ação de atualização
    Atualizando --> DashboardCarregado: consultas invalidadas
    ModalLogin --> DashboardCarregado: login concluído
    ModalLogin --> DashboardCarregado: modal fechado
```

## 6. Cabeçalho e navegação

```mermaid
flowchart LR
    Header[HomeHeaderActions] --> Year[Selecionar ano]
    Header --> Calendar[Calendário]
    Header --> Management[Gestão de Passagens]
    Header --> More[Menu Mais]

    More --> Quotes[Cotações]
    More --> Financial[Financeiro]
    More --> Operational[Controle operacional]
    More --> Memories[Memórias]
    More --> Locations[Locais de acesso]
    More --> Changelog[Novidades]
    More --> Chart[Gráfico]
    More --> PDF[Exportar PDF]
    More --> PWA[Instalação PWA]

    Header --> Theme[Tema claro/escuro]
    Header --> ColorPreset[Paleta visual]
    Header --> Values[Mostrar/ocultar valores]
    Header --> Push[Notificações push]
    Header --> Auth[Entrar/sair]
```

### Regras de navegação

- O seletor de ano altera o contexto compartilhado e atualiza os dados anuais da Home.
- Calendário e Gestão podem alternar sua posição como ação primária em telas móveis.
- Navegações usam transições de visualização quando disponíveis e respeitam `prefers-reduced-motion`.
- Ícones mantêm `aria-label`, tooltips e foco visível mesmo quando o texto é ocultado em telas estreitas.
- O logout invalida a consulta de sessão e exibe confirmação visual.

## 7. Pipeline de transformação dos dados

```mermaid
flowchart TD
    Weeks[weeksQuery.data] --> Normalize[Normalização e isolamento por ano]
    Prices[pricesQuery ou publicPricesQuery] --> PriceMap[Mapa de menor preço por semana]
    Additional[additionalFlightsQuery.data] --> Grouped[Voos adicionais agrupados por semana]

    Normalize --> Filter[Aplicação de filtros]
    PriceMap --> Filter
    Grouped --> Filter

    Filter --> Sorted[Ordenação selecionada]
    Sorted --> Cards[Cards das semanas]
    Sorted --> Summary[KPI e resumo anual]
    Sorted --> WeeklyWindow[Janela anterior, atual e próxima]
    Sorted --> Attention[Alertas de prazos e preços]
    Sorted --> Decision[Ranking da Central de decisão]

    Weeks --> Progress[Progresso anual]
    Progress --> Goal[Meta anual de emissões]
    Goal --> ProgressCard[Card de progresso]

    Weeks --> WeatherTarget[Próximos trechos relevantes]
    WeatherTarget --> WeatherAPI[destinationWeather.forecast]
    WeatherAPI --> Decision
```

## 8. Central de decisão

```mermaid
flowchart TD
    Weeks[Semanas do ano] --> Queue[buildDecisionItemQueue]
    Prices[Preços e referências anuais] --> Queue
    Weather[Alerta de clima] --> Queue
    Preferences[Relevância ajustada por semana] --> Queue
    Dismissed[Alertas dispensados] --> Queue

    Queue --> Ranking[Ranking por prioridade e impacto]
    Ranking --> Actions[Ações de hoje]
    Ranking --> NextTrip[Próxima viagem]
    Ranking --> Secondary[Itens secundários]

    Actions --> OpenManagement[Abrir Gestão]
    Actions --> AdjustRelevance[Ajustar relevância]
    Actions --> Dismiss[Dispensar alerta]
    NextTrip --> OpenCalendar[Abrir semana no Calendário]
    Secondary --> Expand[Expandir Central]

    CentralState[Preferência aberto/fechado e fixado] --> DecisionCenter[Central de decisão]
    CentralCenterShortcut[Alt + Shift + D] --> DecisionCenter
    DecisionCenter --> CentralState
```

A Central de decisão pode utilizar, entre outros sinais:

- prazo até a viagem;
- passagem ainda não emitida;
- ausência de preço;
- variação de preço;
- referência anual insuficiente;
- previsão de chuva, vento ou baixa visibilidade;
- relevância manual ajustada pelo usuário.

## 9. Resumo anual e metas

```mermaid
flowchart LR
    Weeks[Semanas do exercício] --> Issued[Bilhetes emitidos]
    Weeks --> TotalWeeks[Total de semanas]
    Prices[Preços emitidos] --> Invested[Total investido]
    Invested --> Average[Média por viagem]

    Issued --> KPI[Resumo anual]
    Invested --> KPI
    Average --> KPI

    Goal[Meta anual configurável] --> Percentage[Percentual da meta]
    Issued --> Percentage
    TotalWeeks --> Pace[Ritmo esperado]
    Goal --> Pace
    Percentage --> Progress[Barra de progresso]
    Pace --> Progress
```

- A meta anual é armazenada por exercício.
- O percentual usa o valor final configurado pelo usuário, sem divisor fixo de 44 semanas.
- O resumo pode ser expandido ou recolhido.
- O estado do resumo é persistido localmente.
- Valores monetários começam ocultos e só podem ser revelados após autenticação.

## 10. Planejamento por semanas

```mermaid
sequenceDiagram
    actor Usuario
    participant Home as Home.tsx
    participant Window as getWeeklyPlanningWindow
    participant Cards as WeeklyPlanning
    participant Calendar as /calendar?week=n
    participant Storage as Preferências locais

    Home->>Window: Envia semanas e selectedYear
    Window-->>Home: Semana anterior, atual e próxima
    Home->>Cards: Envia itens derivados
    Cards-->>Usuario: Exibe status, datas, rota e menor preço

    Usuario->>Cards: Favorita uma semana
    Cards->>Home: onToggleFavorite(weekNumber)
    Home->>Storage: Persiste favorito

    Usuario->>Cards: Abre uma semana
    Cards->>Calendar: Navega com query week=n
    Calendar-->>Usuario: Localiza e destaca a semana
```

Status dos cards semanais:

- **Emitido:** passagem registrada.
- **Acompanhar preço:** há referência para monitoramento.
- **Pendente:** emissão ou preço ainda requer atenção.

## 11. Filtros e gestão de passagens

```mermaid
flowchart TD
    FilterPanel[Painel de filtros] --> Month[Filtrar por mês]
    FilterPanel --> Airline[Filtrar por companhia]
    FilterPanel --> TicketStatus[Filtrar por status]
    FilterPanel --> DepartureTime[Filtrar horário de ida]
    FilterPanel --> ReturnTime[Filtrar horário de volta]
    FilterPanel --> Cheapest[Somente menor preço]
    FilterPanel --> Percentile[Percentil de preço]

    Month --> FilterEngine[Motor de filtragem]
    Airline --> FilterEngine
    TicketStatus --> FilterEngine
    DepartureTime --> FilterEngine
    ReturnTime --> FilterEngine
    Cheapest --> FilterEngine
    Percentile --> FilterEngine

    FilterEngine --> WeekCards[Cards das semanas]
    WeekCards --> Expand[Expandir uma semana]
    Expand --> TicketFields[Dados de ida e volta]
    TicketFields --> AirlineField[Companhia]
    TicketFields --> AirportField[Aeroporto]
    TicketFields --> DatetimeField[Data e hora]
    TicketFields --> FlightField[Número do voo]
    TicketFields --> TerminalField[Terminal]
    TicketFields --> LocatorField[Localizador]
    TicketFields --> TicketType[Ida e volta ou somente ida]

    TicketFields --> Save[Salvar bilhete]
    Save --> Invalidate[Invalidar consultas anuais]
    Invalidate --> Feedback[Feedback visual de sucesso]
```

## 12. Ações protegidas por login

```mermaid
flowchart TD
    Action[Ação do usuário] --> AuthCheck{Sessão autenticada?}
    AuthCheck -- Sim --> Execute[Executa ação]
    AuthCheck -- Não --> OpenLogin[Abre LoginModal]

    Execute --> SaveTicket[Salvar ou excluir bilhete]
    Execute --> SavePrice[Salvar preço privado]
    Execute --> AddFlight[Adicionar voo adicional]
    Execute --> Push[Ativar notificações]
    Execute --> ShowValues[Exibir valores monetários]
    Execute --> Financial[Consultar recursos financeiros]

    OpenLogin --> Login[Login por e-mail e senha]
    Login --> Session[Cria flight_session]
    Session --> InvalidateAuth[Atualiza flightAuth.check]
    InvalidateAuth --> Execute
```

## 13. Atualização manual e modo offline

```mermaid
stateDiagram-v2
    [*] --> Online
    Online --> Pulling: usuário puxa no topo
    Pulling --> Refreshing: distância atinge o limite
    Pulling --> Online: solta antes do limite
    Refreshing --> Online: invalidação concluída
    Online --> Offline: evento offline
    Offline --> CachedRecovery: há próximos voos locais
    Offline --> OfflineEmpty: não há dados locais
    CachedRecovery --> Online: nova sincronização
    OfflineEmpty --> Online: tentar novamente

    state Online {
        [*] --> Atualizado
        Atualizado --> AtualizandoDados: consulta em andamento
        AtualizandoDados --> Atualizado: sucesso
    }
```

- A Home exibe a última sincronização conhecida.
- Em modo offline, a interface informa a indisponibilidade sem substituir os dados existentes.
- A recuperação usa dados locais essenciais quando disponíveis.
- O pull-to-refresh invalida semanas, progresso, preços e dados relacionados do ano selecionado.

## 14. Preferências persistidas

```mermaid
flowchart LR
    ThemeState[Tema] --> ThemeStorage[ThemeContext/localStorage]
    ColorState[Paleta e intensidade navy] --> ThemeStorage
    ValuesState[Valores ocultos/exibidos] --> Runtime[Estado da sessão]
    SummaryState[Resumo aberto/fechado] --> PanelStorage[homePanelPreferences]
    FiltersState[Filtros abertos/fechados] --> PanelStorage
    LayoutState[Perfil e ordem dos painéis] --> DashboardStorage[homeDashboardPreferences]
    DecisionState[Central aberta, fixada e relevância] --> DecisionStorage[decisionCenterPreferences por ano]
    AttentionState[Alertas dispensados] --> AttentionStorage[attentionCenter]
    FavoriteState[Semanas favoritas] --> WeeklyStorage[weeklyPlanningPreferences]
    CalendarSettings[Antecedência e duração] --> CalendarStorage[localStorage]

    ThemeStorage --> Home
    PanelStorage --> Home
    DashboardStorage --> Home
    DecisionStorage --> Home
    AttentionStorage --> Home
    WeeklyStorage --> Home
```

## 15. Acessibilidade e responsividade

- A página é mobile-first e mantém alvos de toque adequados em 320 px, 375 px e 390 px.
- A navegação móvel reduz textos para ícones, preservando `aria-label` e tooltips.
- Cards expansíveis usam `aria-expanded` e `aria-controls`.
- Estados de atualização e offline usam `role="status"` e `aria-live`.
- Ações críticas exibem loading, feedback de sucesso ou mensagem de erro.
- Animações de hover e transições respeitam `prefers-reduced-motion`.
- O layout permite escolher perfil completo, foco, compacto ou personalizado.
- Painéis podem ser fixados, reordenados por arrastar e soltar e restaurados ao padrão.
- Valores financeiros ficam mascarados por padrão para preservar privacidade.

## 16. Pontos de validação

1. Selecionar outro ano e confirmar que semanas, preços, indicadores, alertas e meta mudam para o exercício escolhido.
2. Acessar a Home sem login e confirmar que a página carrega com valores monetários ocultos.
3. Tentar salvar uma passagem sem sessão e confirmar a abertura do `LoginModal`.
4. Entrar, salvar uma passagem e confirmar feedback visual e atualização dos KPIs.
5. Validar a janela de semana anterior, atual e próxima usando a data real de acesso.
6. Aplicar filtros combinados de mês, companhia, status, horário e menor preço.
7. Abrir e fechar Resumo anual, Central de atenção e Central de decisão; recarregar e confirmar persistência.
8. Alterar a meta anual e confirmar o percentual e o ritmo recalculados.
9. Favoritar uma semana e confirmar a persistência após recarregar.
10. Ativar e desativar notificações push com sessão autenticada.
11. Testar pull-to-refresh, modo offline e recuperação local.
12. Repetir a auditoria em desktop e em 320 px, 375 px e 390 px, com redução de movimento ativada.
