import { Faixa, EstadoPlayer } from "../domain/faixa";
import { PortaPlayerMusica } from "../ports/porta-player-musica";
import { RepositorioPlaylist } from "../ports/repositorio-playlist";

export class ServicoPlayer {
    private fila: Faixa[] = [];
    private indiceAtual: number = -1;
    private estado: EstadoPlayer = 'parado';
    private callbacksMudancaFaixa: ((faixa: Faixa | null) => void)[] = [];
    private callbacksMudancaFila: ((fila: Faixa[]) => void)[] = [];

    constructor(
        private adaptador: PortaPlayerMusica,
        private repositorio?: RepositorioPlaylist
    ) {
        this.adaptador.aoMudarEstado((novoEstado) => {
            this.estado = novoEstado;
        });

        this.adaptador.aoTerminar(() => {
            this.proxima();
        });

        if (this.repositorio) {
            const salva = this.repositorio.carregar();
            if (salva.length > 0) {
                this.fila = salva;
            }
        }
    }

    inscreverMudancaFaixa(callback: (faixa: Faixa | null) => void) {
        this.callbacksMudancaFaixa.push(callback);
    }

    inscreverMudancaFila(callback: (fila: Faixa[]) => void) {
        this.callbacksMudancaFila.push(callback);
        callback(this.fila);
    }

    private notificarMudancaFaixa() {
        const faixa = this.indiceAtual >= 0 ? this.fila[this.indiceAtual] : null;
        this.callbacksMudancaFaixa.forEach(cb => cb(faixa));
    }

    private notificarMudancaFila() {
        this.callbacksMudancaFila.forEach(cb => cb(this.fila));
        if (this.repositorio) {
            this.repositorio.salvar(this.fila);
        }
    }

    async tocar(faixa: Faixa) {
        const index = this.fila.findIndex(f => f.id === faixa.id);
        if (index !== -1) {
            this.indiceAtual = index;
            await this.adaptador.tocar(faixa);
            this.notificarMudancaFaixa();
        }
    }

    async adicionarNaFila(faixa: Faixa) {
        this.fila.push(faixa);
        this.notificarMudancaFila();

        if (this.fila.length === 1 && this.estado === 'parado') {
            this.indiceAtual = 0;
            this.notificarMudancaFaixa();
        }
    }

    async togglePlayPause() {
        if (this.estado === 'tocando') {
            await this.adaptador.pausar();
        } else if (this.estado === 'pausado' || this.estado === 'parado') {
            if (this.indiceAtual === -1 && this.fila.length > 0) {
                this.indiceAtual = 0;
                await this.tocar(this.fila[0]);
            } else if (this.indiceAtual >= 0) {
                await this.adaptador.retomar();
            }
        }
    }

    async proxima() {
        if (this.indiceAtual < this.fila.length - 1) {
            this.indiceAtual++;
            await this.tocar(this.fila[this.indiceAtual]);
        }
    }

    async anterior() {
        if (this.indiceAtual > 0) {
            this.indiceAtual--;
            await this.tocar(this.fila[this.indiceAtual]);
        }
    }

    async buscar(tempo: number) {
        await this.adaptador.buscar(tempo);
    }

    obterFila(): Faixa[] {
        return this.fila;
    }
}
