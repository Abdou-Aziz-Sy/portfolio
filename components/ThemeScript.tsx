// Applique le thème mémorisé avant le premier affichage, pour éviter le flash du thème sombre.
const script =
  'try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}';

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
