// ============================================================
// ARTICULOS DEL CATALOGO
// ------------------------------------------------------------
// Para AGREGAR un articulo nuevo:
// 1. Busca la SECCION que le corresponda (Coronas, Cruces, etc.).
// 2. Copia un bloque { ... } dentro de su lista "articulos" y llena:
//    - id:      unico, sin espacios ni acentos. Ej: 'corona-roja'
//    - nombre:  como se muestra en la tarjeta. Ej: 'Corona roja'
//    - precio:  numero sin comas ni signo. Ej: 1990
//    - imagen:  archivo dentro de public/imagenes. Ej: '/imagenes/mi-foto.jpg'
//    - alt:     descripcion corta de la foto.
//    - occasions: lista de filtros donde aparece. Usa los nombres del
//      menu de Ocasion (Todas, Coronas, Cruces, Arreglos, Centros,
//      Ramos, Plantas, Condolencias, Funerarios).
// 3. Guarda y recarga la pagina. No hay que tocar otro archivo.
//
// Para CREAR una seccion nueva, copia un bloque { seccion: ..., articulos: [...] }.
// ============================================================

export const SECCIONES = [
  {
    seccion: 'Coronas',
    articulos: [
      {
        id: 'corona-clasica-blanca',
        nombre: 'Corona clásica blanca',
        precio: 2200,
        imagen: '/imagenes/prod-corona-blanca@2x.jpg',
        alt: 'Corona clásica blanca de condolencias',
        occasions: ['Todas', 'Coronas', 'Funerarios'],
      },
      {
        id: 'corona-personalizada',
        nombre: 'Corona personalizada',
        precio: 2400,
        imagen: '/imagenes/prod-corona-personalizada@2x.jpg',
        alt: 'Corona personalizada con cinta Descansa en Paz',
        occasions: ['Todas', 'Coronas', 'Funerarios'],
      },
    ],
  },
  {
    seccion: 'Arreglos de condolencias',
    articulos: [
      {
        id: 'arreglo-condolencias',
        nombre: 'Arreglo de condolencias',
        precio: 1450,
        imagen: '/imagenes/prod-arreglo-condolencias@2x.jpg',
        alt: 'Arreglo de condolencias con lirios y rosas blancas',
        occasions: ['Todas', 'Arreglos', 'Condolencias', 'Funerarios'],
      },
    ],
  },
  {
    seccion: 'Cruces',
    articulos: [
      {
        id: 'cruz-flores-naturales',
        nombre: 'Cruz de flores naturales',
        precio: 2800,
        imagen: '/imagenes/prod-cruz-naturales@2x.jpg',
        alt: 'Cruz de flores naturales para homenaje luctuoso',
        occasions: ['Todas', 'Cruces', 'Funerarios'],
      },
    ],
  },
  {
    seccion: 'Centros funerarios',
    articulos: [
      {
        id: 'centro-funerario-elegante',
        nombre: 'Centro funerario elegante',
        precio: 1750,
        imagen: '/imagenes/prod-centro-elegante@2x.jpg',
        alt: 'Centro funerario elegante horizontal',
        occasions: ['Todas', 'Centros', 'Funerarios'],
      },
    ],
  },
  {
    seccion: 'Ramos',
    articulos: [],
  },
  {
    seccion: 'Plantas',
    articulos: [],
  },
];
