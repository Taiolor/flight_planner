# Tela de Calendário — Documentação Mermaid

> Documentação exclusiva da tela **Calendário** (`/calendar`) do Smart Fly / Viagens.
> Os diagramas abaixo descrevem a composição visual, o fluxo de dados, os filtros, a interação com os dias e o popup de detalhes do voo.

## 1. Escopo da tela

A tela de Calendário apresenta os 12 meses do exercício selecionado, marca os dias com trechos emitidos, permite filtrar e pesquisar voos e abre os detalhes de uma semana ou passagem ao selecionar um dia interativo.

### Entrada principal

- **Rota:** `/calendar`
- **Entrada opcional:** `/calendar?week={n}`, usada para localizar e destacar uma semana específica.
- **Ano:** recebido do `YearContext` por meio do seletor global.
- **Componente principal:** `client/src/pages/CalendarView.tsx`
- **Popup de detalhes:** `client/src/components/flights/FlightPopup.tsx`

## 2. Arquitetura da tela

```mermaid
flowchart TD
    App[App.tsx] --> Route["/calendar"]
    Route --> CalendarView[CalendarView]

    CalendarView --> Header[Cabeçalho do Calendário]
    CalendarView --> YearSelector[GlobalYearSelector]
    CalendarView --> Search[Busca de voo e destino]
    CalendarView --> Filters[Filtros secundários]
    CalendarView --> Legend[Legenda persistente de status]
    CalendarView --> CupPanel[BrazilWorldCupPanel<br/>somente no ano 2026]
    CalendarView --> MonthGrid[Grade anual com 12 meses]
    CalendarView --> Summary[Resumo anual]
    CalendarView --> Pending[Alerta de semanas sem passagem]
    CalendarView --> FlightPopup[FlightPopup<br/>quando um dia é selecionado]

    CalendarView --> ContentReveal[ContentReveal]
    CalendarView --> Loading[CalendarLoadingSkeleton]
```

## 3. Fluxo de carregamento e dados

```mermaid
sequenceDiagram
    actor Usuario
    participant Rota as Rota /calendar
    participant Tela as CalendarView
    participant Ano as YearContext
    participant API as tRPC API
    participant Banco as Banco de dados
    participant Cache as Preferências locais

    Usuario->>Rota: Acessa o Calendário
    Rota->>Tela: Renderiza CalendarView
    Tela->>Ano: Obtém selectedYear
    Ano-->>Tela: Retorna ano selecionado

    Tela->>Cache: Lê filtros visuais e preferências
    Cache-->>Tela: Legenda, contraste, filtros secundários e painel Copa

    Tela->>API: flights.getWeeks({ year })
    API->>Banco: Consulta semanas do exercício
    Banco-->>API: Semanas, bilhetes e status por trecho
    API-->>Tela: Dados das semanas

    Tela->>API: flightAuth.check()
    API-->>Tela: Estado da sessão

    alt Usuário autenticado
        Tela->>API: additionalFlights.getYear({ year })
        API->>Banco: Consulta voos adicionais do exercício
        Banco-->>API: Voos adicionais
        API-->>Tela: Dados adicionais
    else Usuário não autenticado
        Tela-->>Tela: Não consulta voos adicionais
    end

    Tela->>Tela: Calcula dias efetivos, totais e filtros
    Tela-->>Usuario: Exibe skeleton durante carregamento
    Tela-->>Usuario: Exibe grade anual após ContentReveal
```

## 4. Modelo de dados visualizado

```mermaid
classDiagram
    class CalendarView {
        +selectedYear: number
        +selectedMark: DayMark | null
        +flightSearchTerm: string
        +showOnlyHolidaysAndWeekends: boolean
        +showOnlyCancelledFlights: boolean
        +showOnlyRescheduledFlights: boolean
        +highContrast: boolean
        +secondaryFiltersExpanded: boolean
        +showCupPanel: boolean
    }

    class WeekRow {
        +weekNumber: number
        +departureDate: string
        +returnDate: string
        +ticketType: roundtrip | oneway
        +departureFlightDatetime: string
        +returnFlightDatetime: string
        +departureAirport: string
        +returnAirport: string
        +departureAirline: string
        +returnAirline: string
        +departureFlightNumber: string
        +returnFlightNumber: string
        +departureTerminal: string
        +returnTerminal: string
        +departureLocator: string
        +returnLocator: string
        +departureRescheduled: boolean
        +returnRescheduled: boolean
        +departureCancelled: boolean
        +returnCancelled: boolean
    }

    class DayMark {
        +departure: boolean
        +return: boolean
        +isPast: boolean
        +week: WeekRow
        +additionalFlights: AdditionalCalendarFlight[]
        +departureRescheduled: boolean
        +returnRescheduled: boolean
        +departureCancelled: boolean
        +returnCancelled: boolean
    }

    class AdditionalCalendarFlight {
        +direction: departure | return
        +datetime: string
        +airline: string
        +airport: string
        +flightNumber: string
        +terminal: string
        +locator: string
        +isTicketIssued: boolean
    }

    CalendarView --> WeekRow : recebe
    CalendarView --> DayMark : calcula
    DayMark --> WeekRow : referencia
    DayMark --> AdditionalCalendarFlight : agrega
```

## 5. Construção dos dias efetivos

A tela não marca apenas a data planejada da semana. Para cada trecho emitido, utiliza a **data efetiva do bilhete**, considerando remarcações e passagens somente ida.

```mermaid
flowchart TD
    Start[Dados de semanas recebidos] --> WeekLoop[Percorrer cada semana]
    WeekLoop --> HasIssued{Possui trecho efetivamente emitido?}
    HasIssued -- Não --> Unissued[Incrementa semanas sem bilhete<br/>quando não excluída]
    HasIssued -- Sim --> EffectiveDates[getCalendarIssuedLegDates]

    EffectiveDates --> Departure{Existe data efetiva de ida?}
    Departure -- Sim --> DepartureYear{Pertence ao ano selecionado?}
    DepartureYear -- Sim --> MonthCount[Incrementa emitidos por mês]
    DepartureYear -- Não --> DepartureMark[Não incrementa mês do exercício]
    MonthCount --> DepartureStatus[Calcula passado ou futuro]
    DepartureMark --> DepartureStatus
    DepartureStatus --> MarkDeparture[Marca o dia como ida]

    EffectiveDates --> Return{Existe data efetiva de volta?}
    Return -- Sim --> ReturnStatus[Calcula passado ou futuro]
    ReturnStatus --> MarkReturn[Marca o dia como volta]

    MarkDeparture --> Additional[Mescla voos adicionais emitidos]
    MarkReturn --> Additional
    Additional --> CalendarMap[markedDays]
    CalendarMap --> Render[Renderiza grade anual]
```

## 6. Estados visuais do dia

```mermaid
stateDiagram-v2
    [*] --> DiaNormal

    DiaNormal --> Hoje: data atual
    DiaNormal --> Feriado: feriado ou observância
    DiaNormal --> FimDeSemanaProlongado: feriado + fim de semana
    DiaNormal --> VooFuturo: trecho emitido futuro
    DiaNormal --> VooPassado: trecho emitido passado
    DiaNormal --> VooRemarcado: trecho remarcado
    DiaNormal --> VooCancelado: trecho cancelado
    DiaNormal --> JogoBrasil: jogo da Copa sem voo

    VooFuturo --> DiaSelecionado: clique ou teclado
    VooPassado --> DiaSelecionado: clique ou teclado
    VooRemarcado --> DiaSelecionado: clique ou teclado
    VooCancelado --> DiaSelecionado: clique ou teclado

    DiaSelecionado --> PopupAberto
    PopupAberto --> DiaSelecionado: fechar popup
    PopupAberto --> PopupAberto: consultar clima ou alternar detalhes
```

### Convenção visual

| Estado | Representação |
|---|---|
| Voo futuro emitido | Verde |
| Voo passado emitido | Cinza |
| Voo remarcado | Vermelho |
| Voo cancelado | Roxo escuro |
| Hoje sem voo | Azul claro com destaque |
| Feriado ou observância | Indicador de feriado |
| Fim de semana prolongado | Fundo roxo claro |
| Jogo do Brasil sem voo | Cores do resultado ou destaque amarelo |

## 7. Filtros e busca

```mermaid
flowchart LR
    Input[Texto digitado] --> Normalize[normalizeCalendarFlightSearch]
    Normalize --> Deferred[useDeferredValue]
    Deferred --> Match[dayMarkMatchesFlightSearch]
    Match --> SearchResult[Exibe dias compatíveis]
    SearchResult --> Live[aria-live informa quantidade encontrada]

    Holiday[Feriados] --> FilterEngine[Motor de filtros]
    Cancelled[Cancelados] --> FilterEngine
    Rescheduled[Remarcados] --> FilterEngine
    SearchResult --> FilterEngine
    FilterEngine --> CalendarCells[Exibe células ou placeholders]

    Clear[Escape ou botão limpar] --> Input
```

A busca aceita, conforme o texto acessível da tela:

- número do voo;
- aeroporto;
- destino;
- companhia aérea;
- localizador;
- terminal.

No campo de destino, as sugestões são fornecidas pelo `datalist` alimentado por `getCalendarDestinationSuggestions`.

## 8. Interação com um dia de voo

```mermaid
sequenceDiagram
    actor Usuario
    participant Celula as Célula do dia
    participant Tela as CalendarView
    participant Popup as FlightPopup
    participant Clima as destinationWeather.forecast
    participant Agenda as Google/Outlook/ICS

    Usuario->>Celula: Clica ou pressiona Enter/Espaço
    Celula->>Tela: setSelectedMark(mark)
    Tela->>Popup: Renderiza detalhes da semana
    Popup-->>Usuario: Mostra datas efetivas, voo, rota e status

    opt Clima disponível
        Popup->>Clima: Consulta origem e destino
        Clima-->>Popup: Previsão, vento, chuva, visibilidade e alertas
        Popup-->>Usuario: Exibe previsão compacta ou detalhada
    end

    opt Adicionar à agenda
        Usuario->>Popup: Escolhe Google, Outlook ou ICS
        Popup->>Agenda: Abre link ou baixa arquivo
    end

    opt Compartilhar
        Usuario->>Popup: Escolhe WhatsApp
        Popup-->>Usuario: Abre mensagem com dados do voo
    end

    opt Rastrear voo
        Usuario->>Popup: Abre rastreamento
        Popup-->>Usuario: Abre link externo em nova aba
    end

    Usuario->>Popup: Fecha por X, Escape ou clique externo
    Popup->>Tela: onClose()
    Tela-->>Usuario: Retorna à grade anual
```

## 9. Conteúdo do `FlightPopup`

```mermaid
flowchart TD
    Open[Popup aberto] --> Header[Semana, rota e botão fechar]
    Header --> Effective[Datas efetivas do voo]
    Effective --> Legs[Cards de ida e volta]

    Legs --> Airline[Companhia em caixa alta e badge]
    Legs --> FlightNumber[Número do voo]
    Legs --> Airport[Aeroporto e endereço]
    Legs --> Terminal[Terminal]
    Legs --> Locator[Localizador]
    Legs --> Status[Remarcado ou cancelado]

    Legs --> Weather[Clima por trecho]
    Weather --> WeatherCompact[Resumo compacto]
    WeatherCompact --> WeatherDetails{Detalhes visíveis?}
    WeatherDetails -- Sim --> WeatherFull[Temperatura, chuva, vento, UV,<br/>visibilidade, nascer/pôr do sol e alertas]
    WeatherDetails -- Não --> WeatherCompact

    Legs --> CalendarActions[Agenda, compartilhamento e rastreamento]
    CalendarActions --> Google[Google Calendar]
    CalendarActions --> Outlook[Outlook]
    CalendarActions --> ICS[Download .ics]
    CalendarActions --> WhatsApp[WhatsApp]
    CalendarActions --> Track[Rastrear voo]
```

## 10. Preferências persistidas

```mermaid
flowchart LR
    LegendState[Estado da legenda] --> LegendStorage[calendarStatusLegendPreference]
    ContrastState[Alto contraste] --> DisplayStorage[calendarDisplayPreferences]
    FiltersState[Filtros secundários abertos] --> DisplayStorage
    CupState[Painel Copa aberto/fechado] --> LocalStorage[(localStorage<br/>showCupPanel)]
    WeatherState[Detalhes do clima] --> WeatherStorage[weatherDetailsPreference]

    LegendStorage --> CalendarView
    DisplayStorage --> CalendarView
    LocalStorage --> CalendarView
    WeatherStorage --> FlightPopup
```

## 11. Acessibilidade e responsividade

- Células de voo interativas usam `role="button"`, `tabIndex=0` e suporte a **Enter** e **Espaço**.
- Busca, filtros e estados de alto contraste expõem `aria-label`, `aria-describedby`, `aria-controls`, `aria-expanded` e `aria-live`.
- O popup usa `role="dialog"` e `aria-modal="true"`.
- A interface é mobile-first e reorganiza cabeçalho, filtros e grade em telas estreitas.
- O painel de filtros secundários fica recolhido em telas móveis e expandido por controle acessível.
- Animações de hover, transições e rolagem respeitam `prefers-reduced-motion`.
- O skeleton é exibido antes do conteúdo real; `ContentReveal` faz a transição de carregamento.

## 12. Dependências da tela

```mermaid
graph TD
    CalendarView --> YearContext[YearContext]
    CalendarView --> TRPC[trpc.flights.getWeeks]
    CalendarView --> Auth[trpc.flightAuth.check]
    CalendarView --> Additional[trpc.additionalFlights.getYear]
    CalendarView --> WorldCup[worldCup2026]
    CalendarView --> CalendarDates[calendarIssuedLegDates]
    CalendarView --> SearchLib[calendarFlightSearch]
    CalendarView --> Suggestions[calendarDestinationSuggestions]
    CalendarView --> Preferences[Preferências localStorage]
    CalendarView --> CalendarHelper[calendarHelper]
    CalendarView --> FlightTypes[components/flights/types]
    CalendarView --> FlightPopup
    FlightPopup --> Weather[trpc.destinationWeather.forecast]
    FlightPopup --> AirlineBadge[AirlineBadge]
    FlightPopup --> CalendarHelper
```

## 13. Pontos de validação

1. Selecionar outro ano no cabeçalho e confirmar que a grade, os contadores e os bilhetes mudam para o exercício selecionado.
2. Abrir `/calendar?week={n}` e confirmar que a semana correspondente recebe foco/rolagem.
3. Pesquisar por número do voo, destino, localizador e terminal.
4. Ativar os filtros de feriados, cancelados e remarcados em conjunto.
5. Selecionar um voo somente ida e confirmar que não aparece uma volta indevida.
6. Selecionar uma passagem remarcada e confirmar que o Calendário usa a data efetiva emitida.
7. Abrir o popup por clique, Enter e Espaço; fechá-lo por X, Escape e clique externo.
8. Validar agenda Google, Outlook, arquivo ICS, WhatsApp e rastreamento.
9. Testar preferências persistidas após recarregar a tela.
10. Repetir a auditoria em 320 px, 375 px, 390 px e desktop, com redução de movimento ativada.
