export type FonteAudio = 'local' | 'youtube' | 'spotify';

export interface Faixa {
    id: string;
    titulo: string;
    artista: string;
    capaUrl?: string;
    url: string;
    fonte: FonteAudio;
    duracaoSegundos?: number;
}

export type EstadoPlayer = 'tocando' | 'pausado' | 'carregando' | 'parado';
