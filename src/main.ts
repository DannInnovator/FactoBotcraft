import './ui/style.css';
import { Game } from './game';

const canvas = document.getElementById('view') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

function boot(): void {
  try {
    const game = new Game(canvas, ui);
    (window as unknown as { game: Game }).game = game;
    if (import.meta.env.DEV) void import('./debug').then((m) => m.install(game));
  } catch (err) {
    console.error(err);
    ui.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'title';
    box.innerHTML =
      '<h1>Konstrukta</h1><p class="tag">Este navegador no pudo iniciar WebGL, que el juego necesita para dibujar la mina en 3D. Prueba con un navegador actualizado o activa la aceleración por hardware.</p>';
    ui.appendChild(box);
  }
}

boot();
