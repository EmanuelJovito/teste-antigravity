import { Faixa, EstadoPlayer } from "@/core/domain/faixa";
import { PortaPlayerMusica } from "@/core/ports/porta-player-musica";
import { AdaptadorAudioHtml5 } from "./adaptador-audio-html5";
import { AdaptadorYouTube } from "./adaptador-youtube";

export class AdaptadorComposto implements PortaPlayerMusica {
    private adaptadorAtual: PortaPlayerMusica;
    private adaptadorHtml5: AdaptadorAudioHtml5;
    private adaptadorYouTube: AdaptadorYouTube;

    private callbacksEstado: ((estado: EstadoPlayer) => void)[] = [];
    private callbacksTempo: ((tempo: number) => void)[] = [];
    private callbackTermino: (() => void) | null = null;

    constructor(adaptadorHtml5: AdaptadorAudioHtml5, adaptadorYouTube: AdaptadorYouTube) {
        this.adaptadorHtml5 = adaptadorHtml5;
        this.adaptadorYouTube = adaptadorYouTube;
        this.adaptadorAtual = this.adaptadorHtml5; // Default

        this.configurarDelegacaoEventos();
    }

    private configurarDelegacaoEventos() {
        // Escuta eventos de AMBOS os adaptadores
        // Mas só repassa se o evento vier do adaptador ATIVO

        const handlerEstado = (origem: PortaPlayerMusica) => (estado: EstadoPlayer) => {
            if (origem === this.adaptadorAtual) {
                this.callbacksEstado.forEach(cb => cb(estado));
            }
        };

        const handlerTempo = (origem: PortaPlayerMusica) => (tempo: number) => {
            if (origem === this.adaptadorAtual) {
                this.callbacksTempo.forEach(cb => cb(tempo));
            }
        };

        const handlerTermino = (origem: PortaPlayerMusica) => () => {
            if (origem === this.adaptadorAtual && this.callbackTermino) {
                this.callbackTermino();
            }
        };

        this.adaptadorHtml5.aoMudarEstado(handlerEstado(this.adaptadorHtml5));
        this.adaptadorHtml5.aoMudarTempo(handlerTempo(this.adaptadorHtml5));
        this.adaptadorHtml5.aoTerminar(handlerTermino(this.adaptadorHtml5));

        this.adaptadorYouTube.aoMudarEstado(handlerEstado(this.adaptadorYouTube));
        this.adaptadorYouTube.aoMudarTempo(handlerTempo(this.adaptadorYouTube));
        this.adaptadorYouTube.aoTerminar(handlerTermino(this.adaptadorYouTube));
    }

    async tocar(faixa: Faixa): Promise<void> {
        // Troca de adaptador se necessário
        if (faixa.fonte === 'youtube') {
            if (this.adaptadorAtual !== this.adaptadorYouTube) {
                await this.adaptadorHtml5.pausar();
                this.adaptadorAtual = this.adaptadorYouTube;
            }
        } else {
            if (this.adaptadorAtual !== this.adaptadorHtml5) {
                await this.adaptadorYouTube.pausar();
                this.adaptadorAtual = this.adaptadorHtml5;
            }
        }

        return this.adaptadorAtual.tocar(faixa);
    }

    async pausar(): Promise<void> {
        return this.adaptadorAtual.pausar();
    }

    async retomar(): Promise<void> {
        return this.adaptadorAtual.retomar();
    }

    async buscar(tempo: number): Promise<void> {
        return this.adaptadorAtual.buscar(tempo);
    }

    obterDuracao(): number {
        return this.adaptadorAtual.obterDuracao();
    }

    obterTempoAtual(): number {
        return this.adaptadorAtual.obterTempoAtual();
    }

    definirVolume(volume: number): void {
        this.adaptadorHtml5.definirVolume(volume);
        this.adaptadorYouTube.definirVolume(volume);
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
