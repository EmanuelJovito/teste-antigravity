import { PlayerControles } from "@/adapters/ui/PlayerControles";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-geist-sans)] flex flex-col items-center justify-center p-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Agnostic Player
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
          Inversão de Dependência na prática: O React não sabe que está tocando um MP3 via HTML5 Audio.
        </p>
      </header>

      <main className="w-full max-w-2xl">
        <PlayerControles />
      </main>
    </div>
  );
}
