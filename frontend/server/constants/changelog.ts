export const APP_VERSION = '1.3.0';

export type ChangelogEntry = {
    version: string;
    date: string;
    en: {
        title: string;
        features: string[];
    };
    es: {
        title: string;
        features: string[];
    };
    ca: {
        title: string;
        features: string[];
    };
};

export const CHANGELOGS: ChangelogEntry[] = [
    {
        version: '1.3.0',
        date: '2026-03-01',
        en: {
            title: 'Pipeline feature, Face Swap and model selection 🚀',
            features: [
                'Pipeline feature added: reuse the structure of a thumbnail to generate new thumbnails. Great for creating variations of the same idea.',
                'Face Swap feature added: swap a source face onto a target image with high fidelity.',
                'Model selection improved: now you can select the model you want to use for generation and edition.',
                'Nano Banana 2 model added: a new model for generation and edition of images. Better quality and faster generation time.',
                'UI improvements: the UI has been improved and refactored to be more clean and intuitive.',
                'Improved and refactored the mobile experience.',
                'The server now politely asks your images if they want to be edited before proceeding.',
            ],
        },
        es: {
            title: 'Pipeline feature, Face Swap y selección de modelos 🚀',
            features: [
                'Nueva función de pipeline: reutilizar la estructura de una miniatura para generar nuevas miniaturas. Perfecto para crear variaciones de la misma idea.',
                'Nueva función de Face Swap: intercambiar un rostro de origen en una imagen objetivo con alta fidelidad.',
                'Selección de modelos mejorada: ahora puedes seleccionar el modelo que quieres usar para generación y edición.',
                'Modelo Nano Banana 2 agregado: un nuevo modelo para generación y edición de imágenes. Mejor calidad y tiempo de generación más rápido.',
                'Mejoras en la interfaz de usuario: la interfaz de usuario ha sido mejorada y refactorizada para ser más limpia y intuitiva.',
                'Mejorada y refactorizada la experiencia móvil.',
                'El servidor ahora le pide a tus imágenes con un "por favor" si quieren ser editadas antes de proceder.',
            ],
        },
        ca: {
            title: 'Pipeline feature, Face Swap i selecció de models 🚀',
            features: [
                'Nova funció de pipeline: reutilitzar la estructura d\'una miniatura per a generar noves miniatures. Perfecte per a crear variacions de la mateixa idea.',
                'Nova funció de Face Swap: intercanviar una cara d\'origen en una imatge objectiu amb alta fidelitat.',
                'Selecció de models millorada: ara pots seleccionar el model que vols utilitzar per a generació i edició.',
                'Model Nano Banana 2 afegit: un nou model per a generació i edició d\'imatges. Millor qualitat i temps de generació més ràpid.',
                'Millora de la interfície d\'usuari: la interfície d\'usuari ha estat millorada i refactoritzada per a ser més neta i intuïtiva.',
                'Millorada i refactoritzada la experiència mòbil.',
                'El servidor ara li demana a les teves imatges amb un "si us plau" si volen ser editades abans de procedir.',
            ],
        },
    },
    {
        version: '1.2.2',
        date: '2025-12-22',
        en: {
            title: 'New models and improvements 🚀',
            features: [
                'New models added: Flux 2.0 and Flux 2.0 Edit',
                'New model from OpenAI: GPT-Image 1.5',
                'Added product information in the product page',
                'Refactoring of some generation logic to increase the performance and the quality of the images',
                'Improved the quick thumb generation process to increase both speed and quality',
                'Our team has finally shooed away the raccoons that kept stealing our server snacks',
            ],
        },
        es: {
            title: 'Nuevos modelos y mejoras 🚀',
            features: [
                'Nuevos modelos añadidos: Flux 2.0 y Flux 2.0 Edit',
                'Nuevo modelo de OpenAI: GPT-Image 1.5',
                'Se ha añadido información del producto en la página de productos',
                'Refactorización de algunas lógicas de generación para aumentar el rendimiento y la calidad de las imágenes',
                'Mejorada la generación de miniaturas rápidas para aumentar la velocidad y la calidad',
                'Nuestro equipo ha desahuciado a los zorros que se comían nuestras galletas en el servidor',
            ],
        },
        ca: {
            title: 'Nous models i millores 🚀',
            features: [
                'Nous models afegits: Flux 2.0 i Flux 2.0 Edit',
                'Nou model de OpenAI: GPT-Image 1.5',
                'S\'ha afegit informació del producte en la pàgina de productes',
                'Refactorització de diverses lògiques de generació per a augmentar el rendiment i la qualitat de les imatges',
                'Millorada la generació de miniatures ràpides per a augmentar la velocitat i la qualitat',
                'El nostre equip finalment ha expulsat les guineus que es menjaven les nostres galetes al servidor',
            ],
        },
    },
    {
        version: '1.1.0',
        date: '2025-11-01',
        en: {
            title: 'The new version 1.1 of ClickLab is here 🚀',
            features: [
                'Improved image editor with enhanced tools and controls',
                'Enhanced UI with improved navigation and accessibility',
                'Better performance and faster generation times',
                'Asset implementation: generate and update your assets to use them as base generation objects',
                'Redefined the way we create images: Flux 2.0 is here 🚀',
                'We have removed some gremlins that were eating up all our cables',
            ],
        },
        es: {
            title: 'La nueva beta de ClickLab ya está aquí 🚀',
            features: [
                'Nueva función de edición de texto para añadir y controlar el texto en la imagen',
                'Mejorada la interfaz de usuario con navegación y accesibilidad mejoradas',
                'Mejor rendimiento y tiempos de generación más rápidos',
                'Implementación de activos: genera y actualiza tus activos para usarlos como objetos base de generación',
                'Redefinimos la forma en que creamos imágenes: Flux 2.0 ya está aquí 🚀',
                'Hemos eliminado algunos gremlins que se comían todos nuestros cables',
            ],
        },
        ca: {
            title: 'La nova beta de ClickLab ja és aquí 🚀',
            features: [
                'Nova funció d\'edició de text per a afegir i controlar el text a la imatge',
                'Millorada la interfície d\'usuari amb navegació i accesibilitat millorades',
                'Millor rendiment i temps de generació més ràpids',
                'Implementació d\'activats: genera i actualitza els teus actius per utilitzar-los com a objectes base de generació',
                'Redefinim la forma en que creamos imatges: Flux 2.0 ja està aquí 🚀',
                'Hem eliminat alguns gremlins que es menjaven tots els nostres cables',
            ],
        },
    },
];

export const CHANGELOG = CHANGELOGS[0];