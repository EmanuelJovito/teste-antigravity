"use client";

import { useState, useEffect, useRef } from "react";
import { ServicoPlayer } from "@/core/services/servico-player";
import { AdaptadorAudioHtml5 } from "@/adapters/gateways/adaptador-audio-html5";
import { AdaptadorYouTube } from "@/adapters/gateways/adaptador-youtube";
import { AdaptadorComposto } from "@/adapters/gateways/adaptador-composto";
import { LocalStorageRepositorioPlaylist } from "@/adapters/gateways/local-storage-repositorio-playlist";
import { Faixa, EstadoPlayer } from "@/core/domain/faixa";

const PLAYLIST_PADRAO: Faixa[] = [
    {
        id: "1",
        titulo: "Jazz Comedy",
        artista: "Bensound",
        url: "https://www.bensound.com/bensound-music/bensound-jazzcomedy.mp3",
        fonte: "local",
        capaUrl: "https://www.bensound.com/bensound-img/jazzcomedy.jpg"
    },
    {
        id: "yt-1",
        titulo: "Lofi Hip Hop Radio",
        artista: "Lofi Girl",
        url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
        fonte: "youtube",
        capaUrl: "https://img.youtube.com/vi/jfKfPfyJRdk/maxresdefault.jpg"
    }
];

export function PlayerControles() {
    const [faixaAtual, setFaixaAtual] = useState<Faixa | null>(null);
    const [estado, setEstado] = useState<EstadoPlayer>("parado");
    const [tempoAtual, setTempoAtual] = useState(0);
    const [duracao, setDuracao] = useState(0);
    const [playlist, setPlaylist] = useState<Faixa[]>([]);
    const [novaUrl, setNovaUrl] = useState("");

    const servicoRef = useRef<ServicoPlayer | null>(null);

    useEffect(() => {
        if (!servicoRef.current) {
            // INJEÇÃO DE DEPENDÊNCIA
            const html5 = new AdaptadorAudioHtml5();
            const youtube = new AdaptadorYouTube("youtube-player-container");
            const composto = new AdaptadorComposto(html5, youtube);
            const repositorio = new LocalStorageRepositorioPlaylist();

            // Injeta o repositório no serviço
            const servico = new ServicoPlayer(composto, repositorio);

            composto.aoMudarEstado(setEstado);
            composto.aoMudarTempo((t) => {
                setTempoAtual(t);
                setDuracao(composto.obterDuracao());
            });

            servico.inscreverMudancaFaixa(setFaixaAtual);
            servico.inscreverMudancaFila(setPlaylist);

            // Se a playlist carregada estiver vazia, carrega a padrão
            if (servico.obterFila().length === 0) {
                PLAYLIST_PADRAO.forEach(f => servico.adicionarNaFila(f));
            }

            servicoRef.current = servico;
        }
    }, []);

    const adicionarUrl = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novaUrl.trim()) return;

        let faixa: Faixa;

        if (novaUrl.includes("youtube.com") || novaUrl.includes("youtu.be")) {
            const videoId = novaUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/)?.[1];

            let titulo = "Vídeo do YouTube";
            let artista = "YouTube";

            try {
                const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(novaUrl)}`);
                const data = await response.json();
                if (data.title) titulo = data.title;
                if (data.author_name) artista = data.author_name;
            } catch (error) {
                console.error("Erro ao buscar metadados do YouTube:", error);
            }

            faixa = {
                id: crypto.randomUUID(),
                titulo,
                artista,
                url: novaUrl,
                fonte: "youtube",
                capaUrl: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : undefined
            };
        } else {
            faixa = {
                id: crypto.randomUUID(),
                titulo: "Música da Web",
                artista: "Desconhecido",
                url: novaUrl,
                fonte: "local"
            };
        }

        servicoRef.current?.adicionarNaFila(faixa);
        // setPlaylist é atualizado via observer
        setNovaUrl("");
    };

    const tocarFaixa = (faixa: Faixa) => servicoRef.current?.tocar(faixa);
    const togglePlay = () => servicoRef.current?.togglePlayPause();
    const proxima = () => servicoRef.current?.proxima();
    const anterior = () => servicoRef.current?.anterior();
    const buscar = (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = Number(e.target.value);
        setTempoAtual(t);
        servicoRef.current?.buscar(t);
    };

    const formatarTempo = (segundos: number) => {
        if (!segundos || isNaN(segundos)) return "0:00";
        const min = Math.floor(segundos / 60);
        const seg = Math.floor(segundos % 60);
        return `${min}:${seg.toString().padStart(2, "0")}`;
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">

            <div id="youtube-player-container" className="hidden"></div>

            <div className="p-8 flex flex-col items-center text-center bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-800 dark:to-zinc-900">
                <div className="w-48 h-48 rounded-2xl shadow-lg mb-6 overflow-hidden bg-zinc-200 dark:bg-zinc-700 relative group">
                    {faixaAtual?.capaUrl ? (
                        <img src={faixaAtual.capaUrl} alt={faixaAtual.titulo} className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-zinc-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-16 h-16">
                                <path d="M9 18V5l12-2v13" />
                                <circle cx="6" cy="18" r="3" />
                                <circle cx="18" cy="16" r="3" />
                            </svg>
                        </div>
                    )}

                    <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold bg-black/50 text-white backdrop-blur-sm">
                        {faixaAtual?.fonte === 'youtube' ? 'YOUTUBE' : 'MP3'}
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1 truncate w-full">
                    {faixaAtual?.titulo || "Selecione uma música"}
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                    {faixaAtual?.artista || "..."}
                </p>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900">
                <div className="mb-6">
                    <input
                        type="range"
                        min={0}
                        max={duracao || 100}
                        value={tempoAtual}
                        onChange={buscar}
                        className="w-full h-1 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
                    />
                    <div className="flex justify-between text-xs text-zinc-400 mt-2 font-mono">
                        <span>{formatarTempo(tempoAtual)}</span>
                        <span>{formatarTempo(duracao)}</span>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-8">
                    <button onClick={anterior} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                    </button>

                    <button
                        onClick={togglePlay}
                        className="w-16 h-16 rounded-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shadow-lg shadow-violet-600/30 transition-all transform hover:scale-105 active:scale-95"
                    >
                        {estado === "tocando" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 ml-1"><path d="M8 5v14l11-7z" /></svg>
                        )}
                    </button>

                    <button onClick={proxima} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                    </button>
                </div>
            </div>

            <form onSubmit={adicionarUrl} className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={novaUrl}
                        onChange={e => setNovaUrl(e.target.value)}
                        placeholder="Cole um link do YouTube ou MP3..."
                        className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <button type="submit" className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
                        +
                    </button>
                </div>
            </form>

            <div className="border-t border-zinc-100 dark:border-zinc-800 max-h-60 overflow-y-auto">
                {playlist.map((faixa) => (
                    <button
                        key={faixa.id}
                        onClick={() => tocarFaixa(faixa)}
                        className={`w-full p-4 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left
          ${faixaAtual?.id === faixa.id ? "bg-violet-50 dark:bg-violet-900/20" : ""}
        `}
                    >
                        <div className="w-10 h-10 rounded bg-zinc-200 dark:bg-zinc-700 flex-shrink-0 overflow-hidden relative">
                            {faixa.capaUrl && <img src={faixa.capaUrl} alt="" className="w-full h-full object-cover" />}
                            <div className="absolute bottom-0 right-0 bg-black text-white text-[8px] px-1">
                                {faixa.fonte === 'youtube' ? 'YT' : 'MP3'}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${faixaAtual?.id === faixa.id ? "text-violet-600 dark:text-violet-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                                {faixa.titulo}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">{faixa.artista}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
