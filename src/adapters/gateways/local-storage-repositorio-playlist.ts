import { Faixa } from "@/core/domain/faixa";
import { RepositorioPlaylist } from "@/core/ports/repositorio-playlist";

const KEY = 'agnostic-player-queue';

export class LocalStorageRepositorioPlaylist implements RepositorioPlaylist {
    salvar(fila: Faixa[]): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem(KEY, JSON.stringify(fila));
        }
    }

    carregar(): Faixa[] {
        if (typeof window !== 'undefined') {
            const json = localStorage.getItem(KEY);
            if (json) {
                try {
                    return JSON.parse(json) as Faixa[];
                } catch (e) {
                    console.error("Erro ao carregar playlist do localStorage", e);
                    return [];
                }
            }
        }
        return [];
    }
}
