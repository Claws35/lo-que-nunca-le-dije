// Mock data for "Lo que nunca le dije" — wrapped in IIFE to avoid global-scope const collisions
(function () {

const CATEGORIES = {
  amor:      { id: 'amor',      label: 'Amor no declarado', color: '#D4537E', short: 'amor' },
  despedida: { id: 'despedida', label: 'Despedida',         color: '#D85A30', short: 'despedida' },
  gratitud:  { id: 'gratitud',  label: 'Gratitud callada',  color: '#1D9E75', short: 'gratitud' },
  perdon:    { id: 'perdon',    label: 'Perdón tardío',     color: '#534AB7', short: 'perdón' },
  enojo:     { id: 'enojo',     label: 'Enojo guardado',    color: '#EF9F27', short: 'enojo' },
  verdad:    { id: 'verdad',    label: 'Verdad escondida',  color: '#888780', short: 'verdad' },
};

const CATEGORY_ORDER = ['amor','despedida','gratitud','perdon','enojo','verdad'];

const STATS = {
  total: 47382,
  paises: 83,
  hoy: 312,
  distribucion: {
    amor: 38, despedida: 27, gratitud: 14, perdon: 11, enojo: 7, verdad: 3,
  },
};

const SECRETS = [
  { id: 1,  cat: 'amor',      text: 'Nunca te dije que te esperé toda la noche del 14 de febrero.' },
  { id: 2,  cat: 'despedida', text: 'Tu última llamada la dejé sonar. No sabía que sería la última.' },
  { id: 3,  cat: 'gratitud',  text: 'Me enseñaste a atarme los zapatos sin perder la paciencia. Gracias, papá.' },
  { id: 4,  cat: 'perdon',    text: 'Rompí la taza azul de mamá y culpé al perro. Tenía ocho años.' },
  { id: 5,  cat: 'enojo',     text: 'Todavía pienso en lo que me dijiste en la cocina. Todavía duele.' },
  { id: 6,  cat: 'verdad',    text: 'Aquel trabajo lo conseguí porque mentí en el currículum.' },
  { id: 7,  cat: 'amor',      text: 'Te miraba dormir y pensaba: esto es lo más cerca que estaré de la felicidad.' },
  { id: 8,  cat: 'despedida', text: 'No fui a tu funeral. Me quedé en el auto, en el estacionamiento.' },
  { id: 9,  cat: 'gratitud',  text: 'Aquella tarde que me prestaste dinero me salvaste la vida. Nunca lo supiste.' },
  { id: 10, cat: 'perdon',    text: 'Leí tu diario cuando tenías quince. Perdóname por eso.' },
  { id: 11, cat: 'enojo',     text: 'Todavía no te perdono que no me defendieras esa noche.' },
  { id: 12, cat: 'verdad',    text: 'No soy quien creen que soy. Llevo doce años fingiendo.' },
  { id: 13, cat: 'amor',      text: 'Estuve enamorada de mi mejor amiga durante toda la universidad.' },
  { id: 14, cat: 'despedida', text: 'Te dejé ir sin pelear. Fue la peor decisión de mi vida.' },
  { id: 15, cat: 'gratitud',  text: 'A la señora del kiosco que me regaló un café cuando lloraba en la calle: gracias.' },
  { id: 16, cat: 'amor',      text: 'Me casé con alguien que no era tú. Te pienso los domingos.' },
  { id: 17, cat: 'perdon',    text: 'Hablé mal de ti a tus espaldas durante años. Lo siento.' },
  { id: 18, cat: 'enojo',     text: 'Fingí olvidar mi cumpleaños para ver si te acordabas. No te acordaste.' },
  { id: 19, cat: 'verdad',    text: 'El bebé que perdimos lo sigo esperando cada noviembre.' },
  { id: 20, cat: 'despedida', text: 'No te dije adiós porque creí que tendríamos otro verano.' },
  { id: 21, cat: 'amor',      text: 'Tu nombre todavía está guardado en mi teléfono como "no contestar".' },
  { id: 22, cat: 'gratitud',  text: 'Gracias por quedarte conmigo aquella madrugada. Nunca te lo dije bien.' },
  { id: 23, cat: 'perdon',    text: 'Traicioné a mi hermano por un ascenso. Él todavía no lo sabe.' },
  { id: 24, cat: 'verdad',    text: 'No quiero tener hijos, pero le digo a todos que sí.' },
];

const ECOS = [
  { id: 101, cat: 'amor',      text: 'Te pienso cada vez que pasa un tren. No sé por qué. Solo pasa.',                          resonancia: 87 },
  { id: 102, cat: 'amor',      text: 'Escribí tu nombre en un papel y lo quemé. Eso no cambió nada.',                           resonancia: 74 },
  { id: 103, cat: 'despedida', text: 'Guardo tu última camisa en una caja. Todavía huele a algo parecido a ti.',                resonancia: 68 },
];

window.HOGUERA_DATA = { CATEGORIES, CATEGORY_ORDER, STATS, SECRETS, ECOS };

})();
