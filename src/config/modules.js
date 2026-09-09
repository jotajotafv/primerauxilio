const step = (title, text, action, target, effect = target) => ({ title, text, action, target, effect });

export const SOURCES = [
  { title: 'RCP en adultos · Resuscitation Council UK, 2025', url: 'https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/adult-basic-life-support-guidelines' },
  { title: 'Primeros auxilios · Resuscitation Council UK, 2025', url: 'https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/first-aid-guidelines' },
  { title: 'Quemaduras · NHS', url: 'https://www.nhs.uk/conditions/burns-and-scalds/' },
  { title: 'Fracturas de brazo · NHS', url: 'https://www.nhs.uk/conditions/broken-arm-or-wrist/' },
  { title: 'Fracturas y soporte · St John Ambulance', url: 'https://www.sja.org.uk/first-aid-advice/fractures-and-broken-bones/' },
  { title: 'Atragantamiento · British Red Cross', url: 'https://www.redcross.org.uk/first-aid/learn-first-aid/choking' },
];

export const EQUIPMENT = {
  medicalGloves: { name: 'Guantes', purpose: 'Barrera de protección al atender heridas.', example: 'Utiliza un par nuevo. La higiene de manos sigue siendo necesaria.' },
  gauze: { name: 'Gasa', purpose: 'Apósito para cubrir una herida y aplicar presión.', example: 'Úsala sobre una lesión que sangra, con presión directa.' },
  bandage: { name: 'Venda', purpose: 'Sujeta apósitos y ayuda a mantener el soporte.', example: 'Comprueba que los dedos conservan color y sensibilidad.' },
  medicalTape: { name: 'Cinta médica', purpose: 'Fija apósitos sobre piel sana.', example: 'Evita pegarla directamente sobre una herida o quemadura.' },
  cprMask: { name: 'Mascarilla RCP', purpose: 'Barrera para ventilaciones de rescate.', example: 'Requiere práctica presencial para conseguir un buen sellado.' },
  splint: { name: 'Férula', purpose: 'Limita el movimiento de una extremidad.', example: 'Su colocación requiere formación. No endereces una lesión.' },
  coldPack: { name: 'Compresa fría', purpose: 'Frío local para golpes, con una tela protectora.', example: 'No se coloca sobre una quemadura ni directamente sobre la piel.' },
};

export const MODULES = [
  {
    id: 'intro', number: '01', name: 'Introducción', category: 'EVALUACIÓN INICIAL', duration: '4 min', icon: 'scan',
    description: 'Los primeros pasos antes de intervenir.', model: 'anatomyTorso', tools: [],
    objective: 'Aprende a observar la situación, valorar la respuesta y activar la ayuda.',
    takeaway: 'Seguridad, respuesta y ayuda temprana: cada actuación empieza aquí.', sources: [1, 0],
    steps: [
      step('Observa el entorno', 'Comprueba que puedes acercarte sin exponerte a riesgos.', 'Comprobar seguridad', 'safe'),
      step('Comprueba la respuesta', 'Habla a la persona y toca suavemente sus hombros.', 'Comprobar respuesta', 'response'),
      step('Activa la ayuda', 'Si no responde, llama a emergencias locales. Usa el altavoz y pide un DEA.', 'Simular solicitud de ayuda', 'help'),
      step('Observa la respiración', 'Valora si respira normalmente durante no más de 10 segundos. Los jadeos no son respiración normal.', 'Observar respiración', 'breathing'),
      step('Decide cómo continuar', 'Si no responde y no respira normalmente, inicia RCP. Sigue las indicaciones del operador.', 'Reconocer indicación de RCP', 'assess'),
    ],
  },
  {
    id: 'cpr', number: '02', name: 'RCP', category: 'REANIMACIÓN CARDIOPULMONAR', duration: '7 min', icon: 'pulse',
    description: 'Reconoce la situación y practica el ritmo.', model: 'cprMannequin', tools: ['cprMask'],
    objective: 'Practica la secuencia de RCP de un adulto y el ritmo de las compresiones.',
    takeaway: 'Aquí se registra el ritmo, no la fuerza ni la profundidad. En una emergencia, continúa la RCP y sigue al DEA y al operador hasta que la ayuda te releve, la persona responda y respire normalmente, o no puedas continuar.', sources: [0],
    steps: [
      step('Reconoce y comprueba', 'Asegura el entorno. Habla y toca suavemente los hombros para comprobar si responde.', 'Comprobar respuesta', 'response'),
      step('Solicita ayuda y un DEA', 'Ante falta de respuesta, llama a emergencias locales en altavoz. Pide que traigan un DEA.', 'Simular solicitud de ayuda', 'help'),
      step('Valora y prepara', 'Si no respira normalmente, inicia RCP. Colócala boca arriba sobre una superficie firme; no demores las compresiones.', 'Preparar la posición', 'position'),
      step('Localiza el centro del pecho', 'Apoya el talón de una mano en la mitad inferior del esternón y la otra encima. Mantén los brazos rectos.', 'Señalar zona de compresión', 'chest', 'locate'),
      step('Practica 30 pulsaciones', 'Marca 100–120 por minuto y permite la recuperación entre pulsaciones. En RCP real: 5–6 cm de profundidad en adultos.', 'Comprimir', 'chest', 'compress'),
    ],
  },
  {
    id: 'heimlich', number: '03', name: 'Heimlich', category: 'OBSTRUCCIÓN DE LA VÍA AÉREA', duration: '5 min', icon: 'airway',
    description: 'Comprende cómo actuar ante un atragantamiento.', model: 'heimlich', tools: [],
    objective: 'Reconoce la obstrucción grave en un adulto consciente y comprende la secuencia de ayuda.',
    takeaway: 'Esta secuencia no se aplica a lactantes. En embarazo o si no puedes rodear el abdomen, se necesitan adaptaciones; sigue al operador y busca formación específica.', sources: [1, 5],
    steps: [
      step('Reconoce la obstrucción', 'Si puede toser eficazmente, anímale a toser. Si no puede hablar o toser, necesita ayuda.', 'Examinar vía aérea', 'airway'),
      step('Primero, golpes en la espalda', 'Inclina a la persona hacia delante. Da hasta 5 golpes entre los omóplatos; comprueba después de cada uno.', 'Ver secuencia de espalda', 'backblows'),
      step('Localiza las manos', 'Si no funciona: sitúate detrás. Coloca el puño por encima del ombligo y debajo del esternón.', 'Localizar las manos', 'hands'),
      step('Compresiones abdominales', 'Sujeta el puño con la otra mano. Da hasta 5 compresiones hacia dentro y arriba, deteniéndote si se libera.', 'Ver dirección de compresión', 'thrust'),
      step('Reevalúa y solicita ayuda', 'Si persiste, activa emergencias y alterna las series. Si pierde la respuesta, inicia RCP. No hagas barridos a ciegas; después necesita valoración médica.', 'Reevaluar la situación', 'assess'),
    ],
  },
  {
    id: 'bleeding', number: '04', name: 'Hemorragias', category: 'CONTROL DEL SANGRADO', duration: '6 min', icon: 'drop',
    description: 'Protección, presión directa y vendaje.', model: 'bleedingArm', tools: ['medicalGloves', 'gauze', 'bandage', 'medicalTape'], variants: ['Brazo', 'Pierna'],
    objective: 'Practica la elección del material y su colocación en una lesión de brazo o pierna.',
    takeaway: 'El sangrado intenso requiere emergencias y presión inmediata. Si no se controla, sigue las instrucciones del operador; un torniquete requiere formación.', sources: [1],
    steps: [
      step('Protege tus manos', 'Usa guantes si están disponibles sin retrasar la atención urgente.', 'Seleccionar guantes', 'medicalGloves'),
      step('Identifica el punto', 'Localiza la herida. Ante sangrado intenso, activa emergencias y comienza presión inmediata.', 'Localizar lesión', 'wound'),
      step('Aplica una gasa', 'Coloca un apósito limpio sobre el punto de sangrado.', 'Colocar gasa', 'gauze'),
      step('Mantén presión directa', 'Presiona de forma firme y continua. Esta escena es una representación, no mide presión real.', 'Aplicar presión', 'pressure'),
      step('Sujeta el apósito', 'Una vez controlado el sangrado, sujeta el apósito con una venda sin comprometer la circulación.', 'Colocar venda', 'bandage'),
      step('Fija y reevalúa', 'Fija sobre piel sana. Vigila el sangrado y el estado de la persona hasta recibir ayuda.', 'Fijar con cinta', 'medicalTape'),
    ],
  },
  {
    id: 'burns', number: '05', name: 'Quemaduras', category: 'ATENCIÓN INICIAL', duration: '4 min', icon: 'heat',
    description: 'Enfría con agua y protege la zona.', model: 'burnHand', tools: ['coldPack'],
    objective: 'Comprende los primeros cuidados de una quemadura térmica sin confundir frío con hielo.',
    takeaway: 'Quemaduras extensas, profundas, eléctricas o químicas necesitan atención urgente. Busca orientación profesional ante dudas y lesiones de la mano.', sources: [2],
    steps: [
      step('Interrumpe la exposición', 'Aléjate de la fuente de calor de forma segura. Retira joyas y ropa cercana, salvo si está adherida.', 'Retirar fuente de calor', 'safe'),
      step('Enfría con agua corriente', 'Usa agua corriente fresca durante 20 minutos. Mantén caliente el resto del cuerpo. No uses hielo ni una compresa fría.', 'Demostrar enfriamiento', 'water'),
      step('Protege sin comprimir', 'Tras enfriar, apoya una cobertura limpia no adherente. No rodees la extremidad con film ni rompas ampollas.', 'Representar protección', 'cover'),
      step('Busca valoración', 'No apliques cremas, aceite o mantequilla. Valora el tamaño, la profundidad y la zona; solicita atención según la gravedad.', 'Revisar necesidad de ayuda', 'assess'),
    ],
  },
  {
    id: 'fractures', number: '06', name: 'Fracturas', category: 'PROTECCIÓN E INMOVILIZACIÓN', duration: '6 min', icon: 'bone',
    description: 'Protege una lesión sin manipularla.', model: 'fracturedArm', tools: ['splint', 'bandage'], variants: ['Brazo', 'Pierna'],
    objective: 'Observa una posible fractura y explora una representación de soporte en brazo y pierna.',
    takeaway: 'La férula muestra el concepto de soporte. No enseña ajuste clínico ni autoriza a recolocar huesos; se necesita práctica supervisada.', sources: [3, 4],
    steps: [
      step('Identifica sin mover', 'Dolor, hinchazón o dificultad de movimiento pueden indicar lesión. Solo una valoración profesional confirma una fractura.', 'Observar lesión', 'wound'),
      step('Conserva la posición', 'No intentes enderezar la extremidad. Evita apoyarte sobre una pierna lesionada y solicita ayuda.', 'Mantener posición', 'position'),
      step('Explora el soporte', 'Si tienes formación, protege e inmoviliza sin forzar la posición encontrada. Aquí la férula se coloca de forma esquemática.', 'Colocar férula visual', 'splint'),
      step('Sujeta y comprueba', 'Sujeta sin apretar sobre la lesión. Vigila color, temperatura y sensibilidad distal; busca atención médica.', 'Representar sujeción', 'bandage'),
    ],
  },
  {
    id: 'kit', number: '07', name: 'Botiquín', category: 'EXPLORACIÓN DEL MATERIAL', duration: '5 min', icon: 'kit',
    description: 'Conoce cada objeto y cuándo utilizarlo.', model: 'firstAidKit', tools: Object.keys(EQUIPMENT),
    objective: 'Abre el botiquín y explora sus siete materiales. Selecciona un objeto para acercarlo y conocer su uso.',
    takeaway: 'Comprueba periódicamente el contenido, la integridad de los envases y las fechas de caducidad.', sources: [1],
    steps: [step('Abre el botiquín', 'Libera los cierres y abre la tapa para explorar el material.', 'Abrir botiquín', 'lid'), step('Explora el material', 'Selecciona los siete objetos en la escena o en el panel. Cada uno tiene una función distinta.', 'Explorar los objetos', 'explore')],
  },
];

export const getModule = id => MODULES.find(module => module.id === id);
