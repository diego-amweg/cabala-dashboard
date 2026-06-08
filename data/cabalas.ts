// colección curada de cábalas: folklore del hincha y rituales culturales.
// regla editorial (ADR): nada atribuido a jugadores ni DTs reales; solo folklore
// colectivo. editable a mano: sumá, sacá o reescribí libremente.
// el id es estable y se usa para guardar "mi cábala" en localStorage: si reordenás
// la lista no pasa nada, pero no reutilices un id viejo para una cábala distinta.

export type CategoriaCabala = 'ropa' | 'gesto' | 'palabra' | 'lugar' | 'comida' | 'ritual';

export interface Cabala {
  id: string;
  texto: string;
  categoria: CategoriaCabala;
  seleccion?: string; // nombre en español si es propia de una hinchada; ausente si es universal
}

export const CABALAS: Cabala[] = [
  // universales del hincha
  { id: 'c01', texto: 'la camiseta no se lava mientras el equipo gana. el olor es parte del invicto.', categoria: 'ropa' },
  { id: 'c02', texto: 'no cantes victoria hasta que el árbitro pita: nombrarla es espantarla.', categoria: 'palabra' },
  { id: 'c03', texto: 'cuernitos cuando ataca el rival, para correr la mufa.', categoria: 'gesto' },
  { id: 'c04', texto: 'si el gol vino justo cuando te paraste, te quedás parado hasta el final.', categoria: 'lugar' },
  { id: 'c05', texto: 'mismo lugar, misma silla, misma hora. lo que funcionó una vez no se toca.', categoria: 'lugar' },
  { id: 'c06', texto: 'la camiseta del revés, porque la última vez que la usaste así se ganó.', categoria: 'ropa' },
  { id: 'c07', texto: 'las medias de la suerte no se cambian en toda la racha.', categoria: 'ropa' },
  { id: 'c08', texto: 'nada de asado si el partido es al mediodía. cervecita y algo liviano, no vaya a ser.', categoria: 'comida' },
  { id: 'c09', texto: 'con esa persona se gana siempre: que no falte. al que trae mala leche, no se lo invita.', categoria: 'ritual' },
  { id: 'c10', texto: 'el llavero, la estampita, la foto en la mano. el amuleto no se negocia.', categoria: 'ritual' },
  { id: 'c11', texto: 'persignarse antes del pitazo inicial, por las dudas y por costumbre.', categoria: 'gesto' },
  { id: 'c12', texto: 'ver el partido solo y en silencio, sufriéndolo como corresponde.', categoria: 'ritual' },
  { id: 'c13', texto: 'tocar madera cada vez que el relator nombra el contragolpe del rival.', categoria: 'gesto' },
  { id: 'c14', texto: 'la gorra del revés cuando toca remontar.', categoria: 'ropa' },
  { id: 'c15', texto: 'repetir la misma frase justo antes del gol, a ver si vuelve a salir.', categoria: 'palabra' },
  // propias de cada hinchada
  { id: 'c16', texto: 'el mate que gira en la ronda antes de saltar a la cancha.', categoria: 'ritual', seleccion: 'Uruguay' },
  { id: 'c17', texto: 'los tambores y la samba calientan la previa horas antes del pitazo.', categoria: 'ritual', seleccion: 'Brasil' },
  { id: 'c18', texto: 'cortar un pedazo de la red después de una victoria que queda en la historia.', categoria: 'ritual', seleccion: 'Brasil' },
  { id: 'c19', texto: 'la limpia, para sacarse de encima la mala energía antes del partido.', categoria: 'ritual', seleccion: 'México' },
  { id: 'c20', texto: 'dejar la tribuna más limpia de lo que estaba: el respeto también es cábala.', categoria: 'ritual', seleccion: 'Japón' },
];
