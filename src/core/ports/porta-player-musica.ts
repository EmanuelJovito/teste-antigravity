import { Faixa, EstadoPlayer } from "../domain/faixa";

export interface PortaPlayerMusica {
    tocar(faixa: Faixa): Promise<void>;
    pausar(): Promise<void>;
    retomar(): Promise<void>;
    buscar(tempo: number): Promise<void>;
    obterDuracao(): number;
    obterTempoAtual(): number;
    definirVolume(volume: number): void;

    // Observadores para atualizar a UI
    aoMudarEstado(callback: (estado: EstadoPlayer) => void): void;
    aoMudarTempo(callback: (tempo: number) => void): void;
    aoTerminar(callback: () => void): void;
}
