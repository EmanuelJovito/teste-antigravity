import { Faixa, EstadoPlayer } from "@/core/domain/faixa";
import { PortaPlayerMusica } from "@/core/ports/porta-player-musica";

export class AdaptadorAudioHtml5 implements PortaPlayerMusica {
    private audio: HTMLAudioElement | null = null;
    private callbacksEstado: ((estado: EstadoPlayer) => void)[] = [];
    private callbacksTempo: ((tempo: number) => void)[] = [];
    private callbackTermino: (() => void) | null = null;

    constructor() {
        if (typeof window !== "undefined") {
            this.audio = new Audio();
            this.configurarEventos();
        }
    }

    private configurarEventos() {
        if (!this.audio) return;

        this.audio.addEventListener("play", () => this.notificarEstado("tocando"));
        this.audio.addEventListener("pause", () => this.notificarEstado("pausado"));
        this.audio.addEventListener("waiting", () => this.notificarEstado("carregando"));
        this.audio.addEventListener("playing", () => this.notificarEstado("tocando"));
        this.audio.addEventListener("ended", () => {
            this.notificarEstado("parado");
            if (this.callbackTermino) this.callbackTermino();
        });
        this.audio.addEventListener("timeupdate", () => {
            if (this.audio) {
                this.notificarTempo(this.audio.currentTime);
            }
        });
    }

    private notificarEstado(estado: EstadoPlayer) {
        this.callbacksEstado.forEach(cb => cb(estado));
    }

    private notificarTempo(tempo: number) {
        this.callbacksTempo.forEach(cb => cb(tempo));
    }

    async tocar(faixa: Faixa): Promise<void> {
        if (!this.audio) return;

        // Se for a mesma música, apenas retoma
        if (this.audio.src === faixa.url) {
            return this.audio.play();
        }

        this.audio.src = faixa.url;
        this.audio.load();
        return this.audio.play();
    }

    async pausar(): Promise<void> {
        this.audio?.pause();
    }

    async retomar(): Promise<void> {
        this.audio?.play();
    }

    async buscar(tempo: number): Promise<void> {
        if (this.audio) {
            this.audio.currentTime = tempo;
        }
    }

    obterDuracao(): number {
        return this.audio?.duration || 0;
    }

    obterTempoAtual(): number {
        return this.audio?.currentTime || 0;
    }

    definirVolume(volume: number): void {
        if (this.audio) {
            this.audio.volume = Math.max(0, Math.min(1, volume));
        }
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
}
