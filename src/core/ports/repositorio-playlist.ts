import { Faixa } from "../domain/faixa";

export interface RepositorioPlaylist {
    salvar(fila: Faixa[]): void;
    carregar(): Faixa[];
}
