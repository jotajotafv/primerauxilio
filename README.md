# First Aid 3D Experience

Aplicación educativa de primeros auxilios para adultos, ejecutada en el navegador con Vite, JavaScript modular y Three.js. El proyecto utiliza los **20 GLB originales**, sin sustituirlos ni modificar sus bytes.

Stack: Three.js, WebGL, Vite y JavaScript. Playwright se utiliza exclusivamente para las pruebas.

**Aplicación pública:** [Abrir First Aid 3D Experience](https://jotajotafv.github.io/primerauxilio/).

## Ejecutar

Requiere Node.js 20.19+ o 22.12+ y un navegador con WebGL 2.

```sh
npm install
npm run dev
```

La dirección local se muestra en la salida de Vite. Para compilar y comprobar la versión de producción:

```sh
npm run build
npm run preview
```

El resultado estático queda en `dist/`. No hay servidor de datos, cuentas, analítica, fuentes remotas ni recopilación de datos personales.

## Deployment

GitHub Pages mediante GitHub Actions, configurado en `.github/workflows/deploy.yml`. Cada push a `main` ejecuta `npm ci`, tests, build y validación de los 20 modelos; después publica únicamente `dist/`. También admite ejecución manual desde Actions.

La base de producción es `/primerauxilio/`; desarrollo mantiene `/`. La navegación utiliza hashes, por lo que las rutas de módulos no requieren reescrituras del servidor. Todas las URLs de modelos se generan desde `import.meta.env.BASE_URL` en el registro de assets.

`npm run test:deployed` comprueba la compilación mediante un servidor de preview temporal. Si se define `PLAYWRIGHT_BASE_URL` con la URL pública completa, incluyendo el subdirectorio y la barra final, el mismo comando comprueba el despliegue remoto. Los tests locales existentes se conservan en `npm run test:browser`.

## Experiencia

- Carga inicial con `LoadingManager`; sala, instructor y camilla primero. Los recursos de cada módulo se cargan bajo demanda y quedan en caché.
- Landing → sala de entrenamiento → explicación → demostración por pasos → práctica → resultado → sala.
- Siete módulos: Introducción, RCP, Heimlich, Hemorragias, Quemaduras, Fracturas y Botiquín.
- Hemorragias y Fracturas ofrecen brazo y pierna. Se completan ambos escenarios para completar el módulo.
- RCP: zona del pecho seleccionable mediante `Raycaster`, clic/tap, botón y tecla Espacio; animación real del GLB, 30 pulsaciones y feedback de ritmo. La serie es un ejercicio, no una indicación para detener la RCP real.
- Botiquín: animaciones originales de cierres y tapa; selección de siete materiales, explicación de uso y enfoque de cámara limitado.
- Guardado local de módulos iniciados/completados, pasos y escenarios. Se puede reiniciar desde la sala. Si el almacenamiento está bloqueado, funciona en memoria durante la sesión.
- Cámaras dirigidas con interpolación y exploración orbital limitada mediante control explícito. Respeta `prefers-reduced-motion`.
- Acciones HTML equivalentes, foco visible, diálogo accesible, navegación por teclado y diseño adaptable.
- Mensajes y reintento ante fallos de carga. No se insertan modelos sustitutos cuando un activo falla.

## Estructura

```text
src/
  main.js                      Entrada y limpieza de HMR
  config/
    assets.js                  Registro único de los 20 GLB
    modules.js                 Contenido, pasos, equipo y fuentes
    settings.js                Parámetros y modo debug
  core/
    App.js                     Flujo, navegación y sesión de práctica
    AssetManager.js            Carga, caché, clones y AnimationMixer
    RendererManager.js         Renderer, tamaño y pérdida de contexto
    CameraManager.js           Encuadres y controles limitados
    SceneManager.js            Cambio de escenas y luces
    InteractionManager.js      Raycasting y estados reversibles
    StateManager.js            Progreso local tolerante a errores
    AudioManager.js            Registro y reproducción de audio opcional
  scenes/
    TrainingHubScene.js        Sala, instructor y camilla
    ModuleScene.js             Escenario reutilizable con efectos por módulo
  modules/cpr/rhythm.js         Cálculo y clasificación del ritmo
  ui/UIManager.js               Interfaz, controles, feedback y diálogos
  ui/icons.js                  Iconos funcionales SVG
  utils/                       Bounds, normalización, nodos y limpieza
  styles/                      Estilos generales y de componentes
scripts/inspect-models.mjs      Inspección reproducible de GLB
docs/model-inspection.json     Nodos, bounds, clips, materiales y hashes
tests/                        Pruebas unitarias y de navegador
```

El motor de módulos comparte el ciclo de vida y las interacciones para evitar siete implementaciones duplicadas. El contenido y los objetivos están separados de la escena y la interfaz.

## Modelos integrados

| Uso | Activos |
| --- | --- |
| Sala y guía | `FirstAid_Modular_TrainingRoom.glb`, `FirstAid_Instructor.glb`, `Medical_Stretcher.glb` |
| Introducción | `EDU_AnatomyTorso.glb` |
| RCP | `First_Aid_3D_CPR_Mannequin.glb`, `FirstAid_CPR_Mask.glb` |
| Heimlich | `First_Aid_3D_Heimlich.glb`, `Patient_Adult_FirstAid.glb` |
| Hemorragias | `EDU_BleedingArm.glb`, `FirstAid_Educational_Leg.glb`, `FirstAid_MedicalGloves.glb`, `FirstAid_Gauze.glb`, `FirstAid_Bandage.glb`, `MedicalTape.glb` |
| Quemaduras | `FirstAid_Burn_HandForearm.glb`, `ColdPack.glb` como material que no se aplica a la quemadura |
| Fracturas | `First_Aid_3D_Arm_Closed_Fracture.glb`, `FirstAid_Leg_ClosedFracture.glb`, `FirstAid_UniversalSplint.glb`, venda |
| Botiquín | `FirstAidKit_Interactive.glb` y los siete materiales reutilizados |

## Inspección y límites reales de los GLB

- Los 20 archivos suman aproximadamente **8,39 MiB**. No requieren Draco. Se mantienen sus texturas y materiales originales, con clones de materiales para cambios reversibles en ejecución.
- RCP incluye `CPR_Compression_Cycle`: animación de morph targets del pecho. No hay sensor de fuerza o profundidad y el navegador no certifica calidad clínica.
- El botiquín incluye tres clips de apertura, usados con `AnimationMixer` y `LoopOnce`. Los materiales son GLB independientes y se presentan junto al botiquín, no como un inventario físico interno del archivo.
- El instructor tiene esqueleto, pero no clips de animación. Se usa una corrección pequeña en huesos verificados de los brazos y un idle sutil del grupo. No hay narración ni sincronización labial.
- El paciente ofrece cinco clips de **poses**, no secuencias completas de asistencia. Se utiliza la pose de atragantamiento. El torso de Heimlich contiene vía aérea, obstrucción y guía de manos, pero no una animación completa de un rescatador dando golpes.
- El brazo fracturado tiene variantes normal/fracturada y clips de poses breves; se utiliza la variante fracturada y su pose de reposo, evitando animaciones de recolocación. La pierna fracturada ofrece dos estados estáticos superpuestos: se oculta el normal en ejecución.
- Gasa, vendas y férula no tienen simulación de tela, ajuste automático a anatomía ni animaciones de vendaje. La colocación es **esquemática**, mediante los anclajes reales disponibles o bounds del miembro. No representa tensión, presión, circulación o un ajuste clínico.
- La gasa contiene estados limpio/aplicado. Se oculta el estado alternativo para evitar dos gasas superpuestas en la selección.
- El modelo de quemadura es estático. El enfriamiento se representa con un indicador educativo sobre la zona; no se simula curación ni disminución real de temperatura. Los 20 minutos indicados corresponden al procedimiento real, no al tiempo transcurrido en la interfaz.
- Se retiran de las instancias los nodos `STUDIO_*` de presentación. La sala se muestra en corte, ocultando techo y dos paredes frente a la cámara. Los archivos permanecen intactos.

## Validación

```sh
npm run inspect:models
npm run test
npm run build
npm run test:browser
```

`test:browser` requiere el servidor de desarrollo en `http://127.0.0.1:5173`, un build actual en `dist/` y Chrome instalado. La prueba de producción abre temporalmente el puerto 4173 y lo cierra al terminar. Playwright inicia Chrome sin ventana visible; no usa el perfil personal. La configuración fuerza SwiftShader para que WebGL sea reproducible sin depender de una GPU de escritorio. Para diagnosticar fallos se puede añadir `-- --trace retain-on-failure`; la grabación continua está desactivada por defecto para evitar competir con el renderizado por software.

Las pruebas cubren integridad SHA-256 de los GLB, ritmo, almacenamiento, carga de todos los módulos, recorridos y variantes completos, teclado y tacto, persistencia, errores recuperables, navegación rápida, fuentes, raycasting real, animaciones y estabilidad de recursos. Las capturas y resultados se escriben en `test-results/` y no forman parte del código de producción.

Los recursos geométricos y las texturas pertenecen a la caché. Las instancias poseen sus materiales y esqueletos. Al salir del módulo se detienen los mixers, se liberan materiales/esqueletos y se retiran listeners y controles al destruir la aplicación. Hay un único `requestAnimationFrame`; la pestaña oculta no renderiza. El DPR se limita a 1,75 y existe una sola luz con sombras de 1024 × 1024. El rendimiento depende del dispositivo; las pruebas con render por software no constituyen una garantía de 60 FPS.

## Debug y ampliación

En desarrollo, abre `/?debug=1#hub` para activar bounds, posición de cámara, FPS aproximados, recursos y selección. `window.firstAidDebug` permite inspeccionar la instancia en ese modo. El modo está desactivado en builds de producción.

`AudioManager` prepara el registro de pistas y el silencio. No hay archivos de audio ni reproducción automática; si se incorporan pistas, se debe conectar un control visible a `setMuted()`.

## Fuentes y alcance

Contenido revisado el 9 de septiembre de 2026. La interfaz enlaza las fuentes correspondientes a cada módulo:

- [Resuscitation Council UK: RCP de adultos, 2025](https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/adult-basic-life-support-guidelines)
- [Resuscitation Council UK: primeros auxilios, 2025](https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/first-aid-guidelines)
- [NHS: quemaduras](https://www.nhs.uk/conditions/burns-and-scalds/)
- [NHS: fracturas de brazo y muñeca](https://www.nhs.uk/conditions/broken-arm-or-wrist/)
- [St John Ambulance: fracturas](https://www.sja.org.uk/first-aid-advice/fractures-and-broken-bones/)
- [British Red Cross: atragantamiento](https://www.redcross.org.uk/first-aid/learn-first-aid/choking)

Los enlaces no implican aval ni certificación. Se indica contactar los servicios de emergencia **locales**; no se traslada automáticamente el número británico a otros países. No hay instrucciones para lactantes, evaluación clínica ni sustitución de formación presencial.
