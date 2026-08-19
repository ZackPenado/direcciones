export function createDirectionQuestion(place) {
  const articles = { alcaldia: 'la', iglesia: 'la', polideportivo: 'el', escuela: 'la', mercado: 'el', biblioteca: 'la' };
  const destinationWords = place.name.toLocaleLowerCase('es').split(' ');
  const destination = [articles[place.id] ?? 'el', ...destinationWords];
  const templates = [
    ['¿', 'Dónde', 'queda', ...destination, '?'],
    ['¿', 'Cómo', 'llego', 'a', ...destination, '?'],
    ['Disculpe,', '¿', 'dónde', 'queda', ...destination, '?']
  ];
  const correct = templates[Math.floor(Math.random() * templates.length)];
  return {
    prompt: 'Ordena la pregunta para pedir una dirección:',
    correct,
    options: [...correct].sort(() => Math.random() - 0.5)
  };
}
