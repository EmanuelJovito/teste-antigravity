# Agnostic Music Player (Hexagonal Architecture)

Um player de música moderno construído com **Next.js**, **TypeScript** e **Tailwind CSS**, projetado seguindo rigorosamente a **Arquitetura Hexagonal (Ports and Adapters)**.

O objetivo deste projeto é demonstrar o **Princípio da Inversão de Dependência (DIP)**, onde o núcleo da aplicação (Core) define as regras de negócio e as interfaces (Portas), enquanto os detalhes de implementação (como HTML5 Audio, YouTube API, LocalStorage e UI) são meros adaptadores plugáveis.

## 🚀 Funcionalidades

-   **Reprodutor Híbrido**: Toca arquivos MP3 (via HTML5 Audio) e vídeos do YouTube (via IFrame API) na mesma playlist, alternando automaticamente entre os adaptadores.
-   **Persistência de Playlist**: A fila de reprodução é salva automaticamente no `localStorage` do navegador, garantindo que você não perca suas músicas ao recarregar a página.
-   **Metadados Automáticos**: Ao adicionar um link do YouTube, o player busca automaticamente o título do vídeo e o nome do canal.
-   **Interface Moderna**: UI responsiva e elegante com tema claro/escuro (suporte a dark mode do sistema), construída com Tailwind CSS.
-   **Controles Completos**: Play/Pause, Próxima/Anterior, Barra de Progresso (Seek), Exibição de Tempo e Capa do Álbum.

## 🏗️ Arquitetura Hexagonal

A estrutura de pastas reflete a separação de responsabilidades:

```
src/
├── core/                   # O Hexágono (Regras de Negócio)
│   ├── domain/             # Entidades (ex: Faixa)
│   ├── ports/              # Interfaces (ex: PortaPlayerMusica, RepositorioPlaylist)
│   └── services/           # Casos de Uso (ex: ServicoPlayer)
│
├── adapters/               # O Mundo Externo (Implementações)
│   ├── gateways/           # Adaptadores de Infraestrutura
│   │   ├── adaptador-audio-html5.ts        # Implementa PortaPlayerMusica
│   │   ├── adaptador-youtube.ts            # Implementa PortaPlayerMusica
│   │   ├── adaptador-composto.ts           # Gerencia múltiplos adaptadores
│   │   └── local-storage-repositorio.ts    # Implementa RepositorioPlaylist
│   └── ui/                 # Adaptadores de Interface de Usuário
│       └── PlayerControles.tsx             # Componente React
│
└── app/                    # Framework & Injeção de Dependência
    └── page.tsx            # Ponto de entrada (Wiring)
```

### Design Patterns Utilizados

-   **Adapter Pattern**: Para adaptar diferentes fontes de áudio (HTML5, YouTube) à mesma interface `PortaPlayerMusica`.
-   **Composite Pattern**: O `AdaptadorComposto` permite tratar um grupo de players como se fosse um único player.
-   **Observer Pattern**: O `ServicoPlayer` notifica a UI sobre mudanças de estado, tempo e fila.
-   **Repository Pattern**: Abstração para salvar e carregar a playlist, desacoplando o armazenamento (LocalStorage) da lógica de negócio.
-   **Dependency Injection**: Todas as dependências são injetadas no `ServicoPlayer`, facilitando testes e trocas de implementação.

## 🛠️ Tecnologias

-   [Next.js 14](https://nextjs.org/) (App Router)
-   [TypeScript](https://www.typescriptlang.org/)
-   [Tailwind CSS](https://tailwindcss.com/)
-   [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
-   [noembed](https://noembed.com/) (para metadados oEmbed)

## 📦 Como Rodar

1.  Clone o repositório:
    ```bash
    git clone https://github.com/seu-usuario/agnostic-music-player.git
    ```
2.  Instale as dependências:
    ```bash
    npm install
    # ou
    yarn
    ```
3.  Rode o servidor de desenvolvimento:
    ```bash
    npm run dev
    # ou
    yarn dev
    ```
4.  Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🧪 Como Testar

1.  **MP3 Local**: Clique na música de exemplo "Jazz Comedy" para tocar via HTML5.
2.  **YouTube**: Cole um link do YouTube (ex: `https://www.youtube.com/watch?v=jfKfPfyJRdk`) e clique no `+`. O player buscará o título e a capa.
3.  **Persistência**: Adicione músicas, recarregue a página e veja sua playlist ser restaurada.
