import { Faixa, EstadoPlayer } from "@/core/domain/faixa";
import { PortaPlayerMusica } from "@/core/ports/porta-player-musica";

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT: any;
    }
}

export class AdaptadorYouTube implements PortaPlayerMusica {
    private player: any = null;
    private callbacksEstado: ((estado: EstadoPlayer) => void)[] = [];
    private callbacksTempo: ((tempo: number) => void)[] = [];
    private callbackTermino: (() => void) | null = null;
    private intervaloTempo: NodeJS.Timeout | null = null;
    private isReady = false;
    private filaEspera: (() => void)[] = [];

    constructor(private containerId: string) {
        if (typeof window !== "undefined") {
            this.carregarAPI();
        }
    }

    private carregarAPI() {
        if (window.YT && window.YT.Player) {
            this.inicializarPlayer();
            return;
        }

        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
            this.inicializarPlayer();
        };
    }

    private inicializarPlayer() {
        this.player = new window.YT.Player(this.containerId, {
            height: "0",
            width: "0",
            playerVars: {
                autoplay: 0,
                controls: 0,
            },
            events: {
                onReady: () => {
                    this.isReady = true;
                    this.processarFilaEspera();
                },
                onStateChange: (event: any) => this.onPlayerStateChange(event),
            },
        });
    }

    private processarFilaEspera() {
        while (this.filaEspera.length > 0) {
            const acao = this.filaEspera.shift();
            if (acao) acao();
        }
    }

    private onPlayerStateChange(event: any) {
        // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
        switch (event.data) {
            case 1:
                this.notificarEstado("tocando");
                this.iniciarMonitoramentoTempo();
                break;
            case 2:
                this.notificarEstado("pausado");
                this.pararMonitoramentoTempo();
                break;
            case 3:
                this.notificarEstado("carregando");
                break;
            case 0:
                this.notificarEstado("parado");
                this.pararMonitoramentoTempo();
                if (this.callbackTermino) this.callbackTermino();
                break;
        }
    }

    private iniciarMonitoramentoTempo() {
        this.pararMonitoramentoTempo();
        this.intervaloTempo = setInterval(() => {
            if (this.player && this.player.getCurrentTime) {
                this.notificarTempo(this.player.getCurrentTime());
            }
        }, 1000);
    }

    private pararMonitoramentoTempo() {
        if (this.intervaloTempo) {
            clearInterval(this.intervaloTempo);
            this.intervaloTempo = null;
        }
    }

    private executarQuandoPronto(acao: () => void) {
        if (this.isReady && this.player) {
            acao();
        } else {
            this.filaEspera.push(acao);
        }
    }

    private extrairIdVideo(url: string): string | null {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    // --- Implementação da Interface ---

    async tocar(faixa: Faixa): Promise<void> {
        const videoId = this.extrairIdVideo(faixa.url);
        if (!videoId) {
            console.error("URL inválida do YouTube");
            return;
        }

        this.executarQuandoPronto(() => {
            // Se já estiver carregado o mesmo vídeo, apenas play
            const currentUrl = this.player.getVideoUrl();
            if (currentUrl && currentUrl.includes(videoId)) {
                this.player.playVideo();
            } else {
                this.player.loadVideoById(videoId);
            }
        });
    }

    async pausar(): Promise<void> {
        this.executarQuandoPronto(() => this.player.pauseVideo());
    }

    async retomar(): Promise<void> {
        this.executarQuandoPronto(() => this.player.playVideo());
    }

    async buscar(tempo: number): Promise<void> {
        this.executarQuandoPronto(() => this.player.seekTo(tempo, true));
    }

    obterDuracao(): number {
        return this.player && this.player.getDuration ? this.player.getDuration() : 0;
    }

    obterTempoAtual(): number {
        return this.player && this.player.getCurrentTime ? this.player.getCurrentTime() : 0;
    }

    definirVolume(volume: number): void {
        this.executarQuandoPronto(() => this.player.setVolume(volume * 100));
    }

    aoMudarEstado(callback: (estado: EstadoPlayer) => void): void {
        this.callbacksEstado.push(callback);
    }

    aoMudarTempo(callback: (tempo: number) => void): void {
        this.callbacksTempo.push(callback);
    }

    aoTerminar(callback: () => void): void {
        this.callbackTermino = callback;
    }

    private notificarEstado(estado: EstadoPlayer) {
        this.callbacksEstado.forEach(cb => cb(estado));
    }

    private notificarTempo(tempo: number) {
        this.callbacksTempo.forEach(cb => cb(tempo));
    }
}
