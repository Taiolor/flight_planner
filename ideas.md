# Ideias de Design - Planejador de Passagens Aéreas 2026

## Resposta 1: Modern Travel Dashboard (Probabilidade: 0.08)

**Design Movement:** Modernismo Corporativo com influências de Design de Sistemas

**Core Principles:**
- Clareza hierárquica: informações críticas (datas, preços) destacam-se imediatamente
- Eficiência visual: cada elemento serve um propósito funcional
- Densidade informacional: máximo de dados legível sem poluição visual
- Acessibilidade: alto contraste, tipografia clara, navegação intuitiva

**Color Philosophy:**
- Paleta: Azul profundo (confiança, aviação) + Branco + Cinza neutro + Acentos em Verde (economia) e Laranja (alertas)
- Raciocínio: Azul remete à indústria aérea; verde indica preços baixos; laranja para ações urgentes
- Fundo: Branco com cartões cinza claro para separação
- Texto: Cinza escuro (#2C3E50) em fundo claro

**Layout Paradigm:**
- Grid de 12 colunas com cards responsivos
- Tabela principal com filtros laterais (não sidebar fixa)
- Seção de comparação de preços em cards lado a lado
- Timeline vertical para visualizar semanas do ano

**Signature Elements:**
- Ícone de avião estilizado em cada semana
- Badges coloridas para feriados/alertas
- Gráfico de preços em linha para tendências
- Cards com sombra suave para profundidade

**Interaction Philosophy:**
- Hover: elevação de card com sombra aumentada
- Click: transição suave para detalhes
- Filtros: aplicam em tempo real sem reload
- Notificações: toast no canto superior direito

**Animation:**
- Entrada de cards: fade-in + slide-up (200ms)
- Hover em preços: scale 1.05 com cor de destaque
- Transição entre abas: fade-cross (150ms)
- Indicador de carregamento: spinner circular

**Typography System:**
- Display: Poppins Bold 32px (títulos principais)
- Heading: Poppins SemiBold 18px (títulos de seção)
- Body: Inter Regular 14px (conteúdo)
- Caption: Inter Regular 12px (datas, preços pequenos)
- Hierarquia: Peso + tamanho + cor

---

## Resposta 2: Minimalist Travel Planner (Probabilidade: 0.07)

**Design Movement:** Minimalismo Contemporâneo com toques de Neumorfismo

**Core Principles:**
- Simplicidade radical: apenas o essencial visível
- Espaço generoso: muito whitespace entre elementos
- Tipografia como protagonista: fontes grandes e elegantes
- Interação discreta: efeitos sutis, sem distrações

**Color Philosophy:**
- Paleta: Bege quente (#F5F1E8) + Preto profundo (#1A1A1A) + Dourado (#D4AF37)
- Raciocínio: Bege evoca calma e elegância; dourado adiciona luxo sem ser ostensivo
- Fundo: Bege claro com degradê suave para branco
- Texto: Preto em fundo claro

**Layout Paradigm:**
- Coluna única com cards grandes e espaçados
- Cada semana é um card minimalista com apenas data, preço e botão de compra
- Sidebar invisível: menu em ícone hamburger
- Scroll vertical como principal navegação

**Signature Elements:**
- Linha horizontal sutil separando semanas
- Ícone de avião minimalista em linha única
- Números grandes para datas
- Botões com apenas ícone (sem texto)

**Interaction Philosophy:**
- Hover: cor de fundo muda para cinza muito claro
- Click: transição para modal com detalhes
- Gestos: swipe para navegar entre meses
- Feedback: mudança sutil de opacidade

**Animation:**
- Entrada: fade-in lento (300ms)
- Hover: mudança de cor suave (200ms)
- Scroll: parallax suave no background
- Modal: zoom-in com backdrop blur

**Typography System:**
- Display: Playfair Display Bold 48px (título principal)
- Heading: Playfair Display SemiBold 24px (mês/seção)
- Body: Lato Regular 16px (conteúdo)
- Caption: Lato Light 13px (datas secundárias)
- Espaçamento: 1.8x line-height para respiro

---

## Resposta 3: Vibrant Travel Calendar (Probabilidade: 0.06)

**Design Movement:** Design Contemporâneo com influências de Ilustração e Playfulness

**Core Principles:**
- Energia visual: cores vibrantes e padrões dinâmicos
- Storytelling: cada viagem é uma história visual
- Engajamento: elementos interativos e surpresas
- Personalização: usuário sente o site "seu"

**Color Philosophy:**
- Paleta: Gradientes vibrantes (Roxo → Rosa → Laranja) + Teal + Amarelo
- Raciocínio: Cores quentes evocam viagem e aventura; teal para dados; amarelo para destaque
- Fundo: Gradiente sutil roxo claro para branco
- Texto: Roxo escuro (#4A3F7F) em fundo claro

**Layout Paradigm:**
- Grid assimétrico 3-coluna em desktop, 1-coluna em mobile
- Cards com bordas arredondadas e sombra colorida
- Seção de hero com ilustração de avião em estilo flat
- Painel lateral com estatísticas visuais (gráficos coloridos)

**Signature Elements:**
- Ilustrações de avião em diferentes poses/ângulos
- Padrão de nuvens sutis no background
- Badges com ícones e cores diferentes por companhia aérea
- Contador visual de semanas restantes

**Interaction Philosophy:**
- Hover: card gira levemente (3D transform)
- Click: card expande com animação bounce
- Filtros: botões com cores vibrantes e feedback imediato
- Comparação: cards lado a lado com destaque de melhor preço

**Animation:**
- Entrada: bounce-in (400ms)
- Hover: rotate 3D + scale
- Transição: spring animation (bounce)
- Confetti ao marcar viagem como confirmada

**Typography System:**
- Display: Montserrat Bold 40px (títulos)
- Heading: Montserrat SemiBold 20px (subtítulos)
- Body: Open Sans Regular 15px (conteúdo)
- Caption: Open Sans Regular 12px (datas)
- Cor: Roxo para títulos, cinza para corpo

---

## Escolha Recomendada

Vou implementar a **Resposta 1: Modern Travel Dashboard** por ser:
- Mais funcional para comparação de preços
- Melhor para visualizar 44 semanas de dados
- Profissional e confiável
- Acessível e eficiente

Mas você pode solicitar qualquer uma das três abordagens!
