// Car-buying glossary for DecodedCars (EN + ES). Original wording.
// Sorted alphabetically by English term. `id` doubles as the HTML anchor.

export interface Term {
  id: string;
  en: { term: string; def: string };
  es: { term: string; def: string };
  link?: string;
}

export const GLOSSARY: Term[] = [
  {
    id: "adas",
    en: {
      term: "ADAS (Advanced Driver Assistance Systems)",
      def: "An umbrella name for the electronic helpers that watch the road with cameras and radar. Common examples are automatic emergency braking (AEB), which brakes if a collision looks likely, and lane keeping, which nudges the wheel when you drift. These features assist an attentive driver; they do not drive the car. Availability often depends on trim, so check the exact version before you buy.",
    },
    es: {
      term: "ADAS (sistemas avanzados de asistencia al conductor)",
      def: "Nombre general para las ayudas electrónicas que vigilan el camino con cámaras y radar. Por ejemplo, el frenado automático de emergencia (AEB) frena si detecta un choque inminente, y el asistente de carril corrige el volante si el auto se desvía. Ayudan a un conductor atento, pero no manejan por usted. Muchas veces dependen de la versión, así que confírmelas antes de comprar.",
    },
  },
  {
    id: "awd",
    en: {
      term: "All-Wheel Drive (AWD)",
      def: "A drivetrain that can send power to all four wheels automatically, usually without any input from the driver. Most AWD systems run mainly on one axle and shift power to the other when wheels slip. It helps on wet or snowy pavement but is not built for serious off-roading, and it typically costs a little fuel economy compared with a two-wheel-drive version.",
    },
    es: {
      term: "Tracción integral (AWD)",
      def: "Sistema que puede mandar fuerza a las cuatro ruedas de forma automática, casi siempre sin que el conductor haga nada. La mayoría trabaja sobre un eje y pasa potencia al otro cuando hay patinaje. Ayuda en lluvia o nieve sobre pavimento, pero no está pensado para terreno difícil y suele gastar un poco más de combustible que la versión de dos ruedas motrices.",
    },
    link: "/guide/awd-vs-4wd",
  },
  {
    id: "apr",
    en: {
      term: "APR (Annual Percentage Rate)",
      def: "The yearly cost of a car loan expressed as a percentage, including interest and certain required lender fees. A lower APR means you pay less over the life of the loan, and even one point makes a real difference on a five- or six-year term. Compare offers by APR and total cost, not just the monthly payment. Our car loan calculator shows both side by side.",
    },
    es: {
      term: "APR (tasa de porcentaje anual)",
      def: "Es el costo anual de un préstamo de auto expresado como porcentaje, con los intereses y ciertos cargos obligatorios del prestamista. Mientras más baja, menos paga en total; un solo punto pesa bastante en un plazo de cinco o seis años. Compare ofertas por APR y costo total, no solo por la mensualidad. Nuestra calculadora de préstamos muestra ambos datos.",
    },
    link: "/tools/car-loan",
  },
  {
    id: "bev",
    en: {
      term: "Battery Electric Vehicle (BEV)",
      def: "A car that runs only on electricity stored in a large battery pack, with no gasoline engine at all. You charge it from the grid, and its efficiency is rated in MPGe instead of MPG. A BEV, often just called an EV, has fewer moving parts to service, but range, charging access at home, and battery health matter most when you shop, especially used.",
    },
    es: {
      term: "Vehículo eléctrico de batería (BEV o EV)",
      def: "Auto que funciona solo con la electricidad guardada en una batería grande, sin motor de gasolina. Se carga desde la red eléctrica y su eficiencia se mide en MPGe, no en MPG. Tiene menos piezas que requieren mantenimiento, pero al comprarlo, sobre todo usado, lo que más importa es la autonomía, poder cargar en casa y el estado de la batería.",
    },
    link: "/guide/hybrid-ev-or-gas",
  },
  {
    id: "cpo",
    en: {
      term: "Certified Pre-Owned (CPO)",
      def: "A used car sold through a manufacturer program after passing a multi-point inspection, usually with an extended factory warranty attached. Age and mileage limits apply, and the price is higher than a comparable non-certified car. CPO lowers risk but is not a guarantee: still check open recalls by VIN and ask for the inspection checklist and service records.",
    },
    es: {
      term: "Auto certificado (CPO)",
      def: "Auto usado que se vende dentro de un programa del fabricante después de pasar una inspección detallada, normalmente con garantía de fábrica extendida. Hay límites de edad y millaje, y cuesta más que uno similar sin certificar. Reduce el riesgo, pero no lo elimina: revise igual los retiros abiertos con el VIN y pida la lista de inspección y el historial de servicio.",
    },
  },
  {
    id: "curb-weight",
    en: {
      term: "Curb Weight",
      def: "How much a vehicle weighs empty but ready to drive, with all standard equipment and fluids and a full tank, but no passengers or cargo. Heavier cars tend to use more fuel and wear brakes and tires faster, while lighter ones often feel more nimble. EVs are usually heavier than similar gas models because of the battery. Compare pages show weight where the data is available.",
    },
    es: {
      term: "Peso en vacío",
      def: "Lo que pesa el vehículo listo para manejar, con su equipo estándar, líquidos y tanque lleno, pero sin pasajeros ni carga. Un auto más pesado suele gastar más combustible y desgastar más rápido frenos y llantas; uno más liviano se siente más ágil. Los eléctricos casi siempre pesan más por la batería. Las páginas de comparación lo muestran cuando hay datos.",
    },
    link: "/compare",
  },
  {
    id: "dc-fast-charging",
    en: {
      term: "DC Fast Charging",
      def: "Public high-power charging that feeds direct current straight into an EV battery, often adding a large share of range in roughly 20 to 40 minutes. Speed depends on the car's maximum charging rate, battery temperature, and how full the battery already is, since charging slows near the top. It is ideal for road trips, but most owners rely on slower home charging day to day.",
    },
    es: {
      term: "Carga rápida DC",
      def: "Carga pública de alta potencia que envía corriente directa a la batería del eléctrico y puede recuperar buena parte de la autonomía en unos 20 a 40 minutos. La velocidad depende del máximo que acepta el auto, la temperatura de la batería y su nivel de carga, porque se vuelve lenta al acercarse al tope. Es ideal para viajes largos; en el día a día se carga en casa.",
    },
    link: "/guide/used-ev-battery",
  },
  {
    id: "depreciation",
    en: {
      term: "Depreciation",
      def: "The value a car loses over time, usually the single biggest cost of owning one. New cars tend to drop fastest in the first two or three years, then the decline slows. Mileage, condition, brand reputation, and recall or reliability history all affect how quickly a model loses value. Buying a lightly used car lets the first owner absorb the steepest part of the drop.",
    },
    es: {
      term: "Depreciación",
      def: "Es el valor que pierde un auto con el tiempo y, por lo general, el gasto más grande de tenerlo. Los autos nuevos bajan más rápido en los primeros dos o tres años y luego la caída se suaviza. El millaje, el estado, la reputación de la marca y el historial de retiros o fallas influyen. Comprar uno seminuevo deja que el primer dueño absorba la peor parte.",
    },
  },
  {
    id: "do-not-drive",
    en: {
      term: "Do Not Drive and Park Outside Notices",
      def: "The most urgent recall warnings. A Do Not Drive notice means the defect is dangerous enough that the vehicle should not be used until the repair is done. A Park Outside notice means the car could catch fire even when switched off, so it should be kept away from buildings. When a model-year page lists one of these recalls, treat it as a top priority and call a dealer.",
    },
    es: {
      term: "Avisos de no manejar y estacionar afuera",
      def: "Son las alertas de retiro más urgentes. Un aviso de no manejar indica que la falla es tan peligrosa que el auto no debe usarse hasta repararlo. Un aviso de estacionar afuera significa que puede incendiarse incluso apagado, así que conviene dejarlo lejos de casas y garajes. Si una página de año modelo muestra uno de estos retiros, llame al concesionario cuanto antes.",
    },
    link: "/guide/check-recalls",
  },
  {
    id: "drivetrain",
    en: {
      term: "Drivetrain",
      def: "The parts that carry power from the engine or motor to the wheels, such as the transmission, driveshafts, differentials, and axles. The term is also used to describe which wheels get power: front-wheel drive, rear-wheel drive, all-wheel drive, or four-wheel drive. On DecodedCars, filters and compare pages use drivetrain as one of the key specs for each version.",
    },
    es: {
      term: "Tren motriz (tracción)",
      def: "Conjunto de piezas que lleva la fuerza del motor a las ruedas: transmisión, ejes, flechas y diferenciales. También se usa para indicar qué ruedas reciben esa fuerza: delantera, trasera, integral (AWD) o 4x4 (4WD). En DecodedCars, los filtros y las páginas de comparación usan la tracción como uno de los datos clave de cada versión.",
    },
    link: "/finder",
  },
  {
    id: "epa-range",
    en: {
      term: "EPA Range",
      def: "The estimated distance an EV or plug-in hybrid can travel on a full charge, based on standardized EPA testing. Real-world range is often lower in cold weather, at steady highway speeds, or with heavy loads, and it shrinks slowly as the battery ages. Treat the number as a fair way to compare models rather than a promise for every trip.",
    },
    es: {
      term: "Autonomía EPA",
      def: "Distancia estimada que un eléctrico o un híbrido enchufable puede recorrer con la batería llena, según pruebas estandarizadas de la EPA. En la práctica suele ser menor con frío, a velocidad de autopista o con mucha carga, y baja poco a poco a medida que la batería envejece. Úsela para comparar modelos de forma justa, no como garantía para cada viaje.",
    },
    link: "/guide/used-ev-battery",
  },
  {
    id: "fars",
    en: {
      term: "FARS (Fatality Analysis Reporting System)",
      def: "NHTSA's nationwide census of fatal motor vehicle crashes on U.S. public roads, compiled each year from police reports and other state records. It records details such as vehicle type, conditions, and seat belt use. FARS describes crashes, not the safety of one specific model, so we use it only as background context, explained on our methodology page.",
    },
    es: {
      term: "FARS (sistema de análisis de accidentes mortales)",
      def: "Es el censo nacional de la NHTSA sobre choques con víctimas mortales en vías públicas de EE. UU., armado cada año con reportes policiales y registros estatales. Incluye datos como tipo de vehículo, condiciones del camino y uso del cinturón. Describe accidentes, no la seguridad de un modelo concreto, por eso solo lo usamos como contexto, según se explica en nuestra metodología.",
    },
    link: "/methodology",
  },
  {
    id: "4wd",
    en: {
      term: "Four-Wheel Drive (4WD)",
      def: "A drivetrain, common on trucks and body-on-frame SUVs, that locks the front and rear axles together to turn all four wheels, often with a low-range gear for steep or rough terrain. Many systems must be engaged by the driver and should stay off on dry pavement. 4WD is tougher off-road than AWD but usually heavier and less efficient.",
    },
    es: {
      term: "Tracción 4x4 (4WD)",
      def: "Sistema típico de camionetas pickup y SUV de chasis, que une los ejes delantero y trasero para mover las cuatro ruedas, a menudo con una marcha baja para pendientes o terreno difícil. En muchos casos el conductor lo activa y no debe usarse en pavimento seco. Rinde mejor fuera del camino que la AWD, pero pesa más y suele gastar más.",
    },
    link: "/guide/awd-vs-4wd",
  },
  {
    id: "fwd",
    en: {
      term: "Front-Wheel Drive (FWD)",
      def: "A layout where the engine or motor powers only the front wheels. It is the most common setup in sedans, hatchbacks, and small crossovers because it is compact, light, and efficient. With the engine's weight over the driven wheels, FWD handles light snow reasonably well with good tires. It is usually the least expensive drivetrain choice on a given model.",
    },
    es: {
      term: "Tracción delantera (FWD)",
      def: "Diseño en el que el motor mueve solo las ruedas delanteras. Es lo más común en sedanes, hatchbacks y crossovers pequeños porque ocupa poco espacio, pesa menos y gasta menos. Como el peso del motor queda sobre las ruedas que traccionan, se defiende bien en nieve ligera con buenas llantas. Suele ser la opción más barata de cada modelo.",
    },
  },
  {
    id: "horsepower",
    en: {
      term: "Horsepower",
      def: "A measure of how much work an engine or electric motor can do, which mostly shows up as acceleration and top-end speed. Higher horsepower helps with merging and passing, but it does not tell the whole story: weight, gearing, and torque matter too. For hybrids, look for the combined system output rather than the gas engine figure alone.",
    },
    es: {
      term: "Caballos de fuerza (hp)",
      def: "Medida del trabajo que puede hacer un motor de gasolina o eléctrico; se nota sobre todo en la aceleración y la velocidad máxima. Más caballos ayudan a incorporarse a la autopista y rebasar, pero no lo dicen todo: también cuentan el peso, las relaciones de la transmisión y el torque. En híbridos, fíjese en la potencia combinada del sistema.",
    },
  },
  {
    id: "hev",
    en: {
      term: "Hybrid Electric Vehicle (HEV)",
      def: "A car with a gas engine and an electric motor that share the work, using a small battery recharged by the engine and by braking. You never plug it in. Hybrids shine in stop-and-go city driving, where they can run on electric power at low speeds. Federal rules require the battery and other hybrid components to carry an emissions warranty of at least 8 years or 80,000 miles.",
    },
    es: {
      term: "Híbrido (HEV)",
      def: "Auto con motor de gasolina y motor eléctrico que se reparten el trabajo, con una batería pequeña que se recarga con el motor y al frenar. No se enchufa nunca. Rinde mejor en ciudad, con tráfico de arranque y parada, donde puede avanzar en modo eléctrico a baja velocidad. Por ley federal, la batería y los componentes híbridos tienen garantía de emisiones de al menos 8 años u 80,000 millas.",
    },
    link: "/guide/hybrid-ev-or-gas",
  },
  {
    id: "kwh",
    en: {
      term: "Kilowatt-Hour (kWh)",
      def: "A unit of energy, and the way EV battery size and electricity use are measured. A bigger battery in kWh usually means more range, while efficiency is often shown as kWh per 100 miles, where lower is better. Your utility bill also charges by the kWh, which makes it easy to estimate the cost of charging at home with our fuel cost tool.",
    },
    es: {
      term: "Kilovatio-hora (kWh)",
      def: "Unidad de energía con la que se mide el tamaño de la batería de un eléctrico y su consumo. Una batería con más kWh suele dar más autonomía, y la eficiencia se expresa a menudo en kWh por cada 100 millas, donde menos es mejor. La compañía de luz también cobra por kWh, así que con nuestra calculadora de combustible puede estimar cuánto cuesta cargar en casa.",
    },
    link: "/tools/fuel-cost",
  },
  {
    id: "level-1-level-2-charging",
    en: {
      term: "Level 1 and Level 2 Charging",
      def: "The two common ways to charge an EV from alternating current. Level 1 uses a standard 120-volt household outlet and adds only a few miles of range per hour, fine for plug-in hybrids or short commutes. Level 2 uses a 240-volt circuit, like a dryer outlet or wall unit, and can refill most EVs overnight. Most owners install Level 2 at home.",
    },
    es: {
      term: "Carga de nivel 1 y nivel 2",
      def: "Las dos formas comunes de cargar un eléctrico con corriente alterna. El nivel 1 usa un enchufe normal de 120 voltios y suma pocas millas por hora; sirve para híbridos enchufables o trayectos cortos. El nivel 2 usa un circuito de 240 voltios, como el de la secadora o un cargador de pared, y llena casi cualquier eléctrico durante la noche.",
    },
    link: "/guide/used-ev-battery",
  },
  {
    id: "model-year-vs-build-date",
    en: {
      term: "Model Year vs. Build Date",
      def: "The model year is the version name a manufacturer gives a car, and it often starts selling months before that calendar year begins. The build date, printed on a label in the driver's door jamb, is when that specific car left the factory. Recalls frequently cover only a range of build dates, so two cars of the same model year may not share the same open recalls.",
    },
    es: {
      term: "Año modelo vs. fecha de fabricación",
      def: "El año modelo es el nombre de la versión que da el fabricante, y muchas veces sale a la venta meses antes de que empiece ese año. La fecha de fabricación, impresa en una etiqueta en el marco de la puerta del conductor, indica cuándo salió de la planta ese auto en particular. Los retiros suelen abarcar solo ciertas fechas, y dos autos del mismo año pueden tener retiros distintos.",
    },
    link: "/guide/check-recalls",
  },
  {
    id: "mpg",
    en: {
      term: "MPG (City, Highway, Combined)",
      def: "Miles per gallon, the EPA estimate of how far a gas or hybrid car travels on one gallon of fuel. City reflects stop-and-go driving, highway reflects steady cruising, and combined blends the two, weighted toward city. Every model-year page shows EPA figures, and our fuel cost tool turns them into an estimated yearly fuel bill for your own mileage.",
    },
    es: {
      term: "MPG (ciudad, carretera y combinado)",
      def: "Millas por galón: la estimación de la EPA de cuántas millas recorre un auto de gasolina o híbrido con un galón. El valor de ciudad refleja tráfico con paradas, el de carretera un ritmo constante, y el combinado mezcla ambos con más peso en ciudad. Cada página de año modelo muestra las cifras de la EPA, y nuestra calculadora las convierte en un gasto anual estimado.",
    },
    link: "/tools/fuel-cost",
  },
  {
    id: "mpge",
    en: {
      term: "MPGe (Miles Per Gallon Equivalent)",
      def: "An EPA rating that lets you compare electric efficiency with gasoline cars. It treats 33.7 kilowatt-hours of electricity as equal to the energy in one gallon of gas, then asks how far the car goes on that amount. A higher MPGe means less energy used per mile. It describes efficiency, not range or charging cost, which also depends on local electricity prices.",
    },
    es: {
      term: "MPGe (millas por galón equivalente)",
      def: "Calificación de la EPA para comparar la eficiencia de un eléctrico con la de un auto de gasolina. Considera que 33.7 kilovatios-hora equivalen a la energía de un galón de gasolina y mide cuántas millas se recorren con esa cantidad. Más MPGe significa menos energía por milla. No indica autonomía ni costo de carga, que depende del precio local de la luz.",
    },
    link: "/tools/fuel-cost",
  },
  {
    id: "msrp",
    en: {
      term: "MSRP (Manufacturer's Suggested Retail Price)",
      def: "The price the automaker recommends for a new vehicle in a given trim and option package, shown on the window sticker. Dealers can sell above it during shortages or below it with discounts and incentives. MSRP does not include taxes, registration, or dealer fees, so it is a starting point for negotiation rather than what you will actually pay.",
    },
    es: {
      term: "MSRP (precio sugerido por el fabricante)",
      def: "Precio que recomienda la marca para un auto nuevo en cierta versión y paquete de opciones; aparece en la etiqueta de la ventana. El concesionario puede cobrar más cuando hay escasez o menos con descuentos e incentivos. No incluye impuestos, registro ni cargos del concesionario, así que es un punto de partida para negociar, no lo que pagará al final.",
    },
    link: "/tools/car-loan",
  },
  {
    id: "nhtsa-5-star-ratings",
    en: {
      term: "NHTSA 5-Star Safety Ratings",
      def: "The federal government's crash-test scores, from one to five stars, covering frontal crash, side crash, and rollover resistance, plus an overall rating. The current, tougher version of the program began with model year 2011, so older scores are not directly comparable. Not every model is tested every year. Model-year pages show the stars when NHTSA has published them.",
    },
    es: {
      term: "Calificaciones de 5 estrellas de la NHTSA",
      def: "Resultados oficiales de pruebas de choque, de una a cinco estrellas, para impacto frontal, impacto lateral y resistencia a volcaduras, además de una nota general. La versión actual, más exigente, rige desde el año modelo 2011, por lo que las notas anteriores no se comparan directamente. No se prueba cada modelo todos los años; las páginas de año modelo muestran las estrellas cuando existen.",
    },
    link: "/methodology",
  },
  {
    id: "nhtsa-defect-investigation",
    en: {
      term: "NHTSA Defect Investigation",
      def: "A federal review of a possible safety defect, often triggered by a pattern of owner complaints. It can start with a defect petition from the public, then move to a Preliminary Evaluation (PE), an Engineering Analysis (EA), or a recall query that checks whether an earlier fix worked. Many investigations end in a recall, but some close with no action.",
    },
    es: {
      term: "Investigación de defectos de la NHTSA",
      def: "Revisión federal de una posible falla de seguridad, muchas veces motivada por un patrón de quejas de dueños. Puede empezar con una petición del público y pasar a una evaluación preliminar (PE), un análisis de ingeniería (EA) o una consulta de retiro para ver si una reparación anterior funcionó. Muchas terminan en un retiro, pero otras se cierran sin medidas.",
    },
    link: "/guide/are-recalls-a-red-flag",
  },
  {
    id: "recall-campaign-number",
    en: {
      term: "NHTSA Recall Campaign Number",
      def: "The ID NHTSA assigns to each safety recall, written as two digits for the year, a letter for the type, and a sequence number, such as 24V-123 for a vehicle recall. Quoting it to a dealer or on the phone avoids confusion with the automaker's own internal code. Every model-year page lists its recalls with the NHTSA campaign number.",
    },
    es: {
      term: "Número de campaña de retiro de la NHTSA",
      def: "Identificador que la NHTSA asigna a cada retiro de seguridad: dos dígitos del año, una letra del tipo y un número de secuencia, por ejemplo 24V-123 para un retiro de vehículos. Mencionarlo al concesionario evita confusiones con el código interno de la marca. Cada página de año modelo muestra sus retiros con el número de campaña de la NHTSA.",
    },
    link: "/recalls",
  },
  {
    id: "out-the-door-price",
    en: {
      term: "Out-the-Door Price",
      def: "The total you actually pay to drive the car home: the agreed vehicle price plus sales tax, title and registration, documentation fees, and any add-ons, minus rebates and trade-in value. Asking dealers for a written out-the-door quote is the simplest way to compare offers, because it keeps surprise fees from appearing late in the deal. Use it as the amount you finance.",
    },
    es: {
      term: "Precio final (out-the-door)",
      def: "Lo que realmente paga para llevarse el auto: el precio acordado más impuesto de venta, título y registro, cargos de documentación y extras, menos reembolsos y el valor de su auto a cuenta. Pedir por escrito este precio total es la forma más sencilla de comparar ofertas y evitar cargos sorpresa al final. Es la cifra que debe usar para calcular el préstamo.",
    },
    link: "/tools/car-loan",
  },
  {
    id: "owner-complaint",
    en: {
      term: "Owner Complaint (NHTSA)",
      def: "A safety problem report that a driver files directly with NHTSA, describing what failed and when. Complaints are not verified one by one, but clusters around the same part can point to a real defect and sometimes lead to an investigation. DecodedCars groups each model year's complaints by component, so you can see which systems owners mention most.",
    },
    es: {
      term: "Queja de dueños (NHTSA)",
      def: "Reporte de un problema de seguridad que un conductor envía directamente a la NHTSA, contando qué falló y cuándo. Las quejas no se verifican una por una, pero cuando muchas apuntan a la misma pieza pueden revelar una falla real y llevar a una investigación. DecodedCars agrupa las quejas de cada año modelo por componente para ver qué sistemas se mencionan más.",
    },
    link: "/guide/read-complaints-mpg",
  },
  {
    id: "phev",
    en: {
      term: "Plug-In Hybrid (PHEV)",
      def: "A hybrid with a larger battery you can charge from an outlet, giving a stretch of all-electric driving before the gas engine takes over. If your daily trips fit within that electric range and you charge often, you may rarely buy gas; if you never plug in, it behaves like a heavier regular hybrid. The EPA lists both electric range and gas-only MPG.",
    },
    es: {
      term: "Híbrido enchufable (PHEV)",
      def: "Híbrido con una batería más grande que se carga en un enchufe y permite recorrer cierta distancia solo con electricidad antes de que entre el motor de gasolina. Si sus trayectos diarios caben en esa autonomía y carga seguido, casi no comprará gasolina; si nunca lo enchufa, funciona como un híbrido común más pesado. La EPA publica la autonomía eléctrica y el MPG con gasolina.",
    },
    link: "/guide/hybrid-ev-or-gas",
  },
  {
    id: "powertrain",
    en: {
      term: "Powertrain",
      def: "Everything that makes the car go: the engine or electric motor plus the transmission and drivetrain that deliver its power to the wheels. Buyers usually see it described as engine size, fuel type, and transmission, for example a turbocharged four-cylinder with an eight-speed automatic. Powertrain warranties often last longer than bumper-to-bumper coverage.",
    },
    es: {
      term: "Sistema de propulsión (powertrain)",
      def: "Todo lo que hace que el auto avance: el motor de gasolina o eléctrico más la transmisión y la tracción que llevan la fuerza a las ruedas. Normalmente se describe por tamaño del motor, tipo de combustible y transmisión, por ejemplo un cuatro cilindros turbo con caja automática de ocho velocidades. Su garantía suele durar más que la garantía básica.",
    },
    link: "/compare",
  },
  {
    id: "pre-purchase-inspection",
    en: {
      term: "Pre-Purchase Inspection",
      def: "A check of a used car by an independent mechanic you choose, done before you sign anything. It typically covers the engine, transmission, brakes, suspension, leaks, signs of past crash repair, and stored error codes. It usually costs far less than a single major repair. If a seller refuses to allow one, treat that as a serious warning sign.",
    },
    es: {
      term: "Inspección antes de comprar",
      def: "Revisión de un auto usado hecha por un mecánico independiente que usted elige, antes de firmar nada. Suele incluir motor, transmisión, frenos, suspensión, fugas, señales de reparaciones por choque y códigos de error guardados. Normalmente cuesta mucho menos que una sola reparación grande. Si el vendedor no la permite, tómelo como una señal de alerta seria.",
    },
  },
  {
    id: "rwd",
    en: {
      term: "Rear-Wheel Drive (RWD)",
      def: "A layout where power goes only to the rear wheels, common in pickups, sports cars, and many luxury sedans. It offers balanced handling and better towing, since weight shifts toward the rear under load. In snow, an unloaded RWD vehicle can lose grip more easily, so winter tires help a lot. Many electric cars also use a rear-motor RWD setup.",
    },
    es: {
      term: "Tracción trasera (RWD)",
      def: "Diseño en el que la fuerza va solo a las ruedas traseras; es común en pickups, autos deportivos y muchos sedanes de lujo. Ofrece un manejo equilibrado y remolca mejor, porque el peso se carga hacia atrás. En nieve, si va sin carga, puede perder agarre con más facilidad, así que las llantas de invierno ayudan mucho. Varios eléctricos usan también un motor trasero.",
    },
  },
  {
    id: "recall",
    en: {
      term: "Recall",
      def: "An official action, ordered by NHTSA or started by the automaker, to fix a safety defect or a failure to meet federal safety standards. Repairs for safety recalls are free at a franchised dealer, even on used cars. Recalls follow the vehicle, not the owner, so always check by VIN. Every model-year page lists its recalls with the NHTSA campaign number.",
    },
    es: {
      term: "Retiro (recall)",
      def: "Acción oficial, ordenada por la NHTSA o iniciada por el fabricante, para corregir una falla de seguridad o un incumplimiento de las normas federales. La reparación de un retiro de seguridad es gratis en un concesionario autorizado, aunque el auto sea usado. El retiro sigue al vehículo, no al dueño, así que revíselo por VIN. Cada página de año modelo muestra sus retiros con el número de campaña.",
    },
    link: "/guide/check-recalls",
  },
  {
    id: "rollover-rating",
    en: {
      term: "Rollover Rating",
      def: "The part of NHTSA's 5-Star program that estimates how likely a vehicle is to roll over in a single-vehicle crash where it loses control. It combines the car's geometry, mainly how tall it is relative to its width, with a dynamic driving test. Taller SUVs and trucks often score lower than sedans. More stars means a lower estimated risk.",
    },
    es: {
      term: "Calificación de volcadura",
      def: "Parte del programa de 5 estrellas de la NHTSA que estima qué tan probable es que un vehículo se vuelque en un choque en el que pierde el control sin otro auto involucrado. Combina la forma del vehículo, sobre todo su altura comparada con su ancho, con una prueba de manejo. Las SUV altas y las pickups suelen salir peor que los sedanes. Más estrellas indican menos riesgo.",
    },
    link: "/methodology",
  },
  {
    id: "tsb",
    en: {
      term: "Technical Service Bulletin (TSB)",
      def: "Repair instructions an automaker sends to its dealers for a known problem, such as a noise, a software glitch, or a part that wears early. A TSB is not a recall, so the fix is usually free only while the car is under warranty. Manufacturers must file these communications with NHTSA, and they are worth asking about when an issue matches your symptoms.",
    },
    es: {
      term: "Boletín de servicio técnico (TSB)",
      def: "Instrucciones de reparación que el fabricante manda a sus concesionarios para un problema conocido, como un ruido, una falla de software o una pieza que se gasta antes de tiempo. No es un retiro, así que la reparación suele ser gratis solo con garantía vigente. Las marcas deben entregar estos avisos a la NHTSA; conviene preguntar por ellos si coinciden con sus síntomas.",
    },
    link: "/guide/are-recalls-a-red-flag",
  },
  {
    id: "torque",
    en: {
      term: "Torque",
      def: "The twisting force an engine or motor produces, usually listed in pound-feet. Torque is what you feel when the car pulls from a stop or climbs a hill, and it matters a lot for towing. Diesel and turbocharged engines deliver strong torque at low engine speeds, and electric motors provide nearly all of theirs instantly, which is why EVs feel so quick off the line.",
    },
    es: {
      term: "Torque (par motor)",
      def: "Fuerza de giro que produce el motor, normalmente expresada en libras-pie. Es lo que se siente cuando el auto arranca desde cero o sube una cuesta, y es clave para remolcar. Los motores diésel y turbo entregan mucho torque a bajas revoluciones, y los eléctricos lo dan casi todo al instante, por eso aceleran tan rápido desde parado.",
    },
  },
  {
    id: "trim",
    en: {
      term: "Trim",
      def: "A specific version of a model, such as a base, mid-level, or top grade, each with its own standard equipment, engine choices, and price. Trims can differ in safety features, wheel size, drivetrain, and even fuel economy. When you compare listings or check specs, make sure you are looking at the same trim, since the name alone can hide big differences.",
    },
    es: {
      term: "Versión (trim)",
      def: "Variante específica de un modelo, como la básica, la intermedia o la más equipada, cada una con su propio equipo de serie, opciones de motor y precio. Las versiones pueden variar en funciones de seguridad, tamaño de rines, tracción y hasta consumo de combustible. Al comparar anuncios o especificaciones, asegúrese de mirar la misma versión, porque el nombre solo puede esconder diferencias grandes.",
    },
    link: "/compare",
  },
  {
    id: "turbocharger",
    en: {
      term: "Turbocharger",
      def: "A device that uses exhaust gas to spin a small turbine, forcing extra air into the engine so it can burn more fuel and make more power. Turbos let automakers use smaller engines that perform like larger ones. Real-world fuel savings depend on how hard you drive, and turbo engines tend to be more sensitive to oil changes done on time.",
    },
    es: {
      term: "Turbocompresor (turbo)",
      def: "Pieza que aprovecha los gases del escape para hacer girar una pequeña turbina que mete más aire al motor, así puede quemar más combustible y dar más potencia. Gracias al turbo, las marcas usan motores pequeños que rinden como otros más grandes. El ahorro real depende de cómo maneje, y estos motores son más sensibles a cambiar el aceite a tiempo.",
    },
  },
  {
    id: "vehicle-history-report",
    en: {
      term: "Vehicle History Report",
      def: "A paid report, pulled by VIN, that collects records such as reported accidents, title brands like salvage or flood, odometer readings, past registrations, and sometimes service visits. It only shows what was reported, so a clean report does not prove a car was never damaged. Use it together with an open-recall check and an independent inspection.",
    },
    es: {
      term: "Reporte de historial del vehículo",
      def: "Informe pagado que se obtiene con el VIN y reúne registros como accidentes reportados, títulos marcados por pérdida total o inundación, lecturas del odómetro, registros anteriores y, a veces, servicios. Solo muestra lo que alguien reportó, así que un reporte limpio no prueba que el auto nunca tuvo daños. Úselo junto con la revisión de retiros abiertos y una inspección independiente.",
    },
  },
  {
    id: "vin",
    en: {
      term: "VIN (Vehicle Identification Number)",
      def: "The unique 17-character code assigned to every modern car, found on the dashboard near the windshield, the driver's door jamb, and the title. It encodes the maker, model, model year, plant, and serial number. The VIN is the key for checking open recalls and history records. Our VIN decoder reads it using NHTSA data and links you to the matching model-year page.",
    },
    es: {
      term: "VIN (número de identificación del vehículo)",
      def: "Código único de 17 caracteres que tiene cada auto moderno; aparece en el tablero junto al parabrisas, en el marco de la puerta del conductor y en el título. Indica fabricante, modelo, año modelo, planta y número de serie. Es la clave para revisar retiros abiertos e historial. Nuestro decodificador de VIN lo lee con datos de la NHTSA y lo lleva a la página del año modelo.",
    },
    link: "/tools/vin-decoder",
  },
  {
    id: "warranty-extension",
    en: {
      term: "Warranty Extension",
      def: "When an automaker voluntarily lengthens coverage for one specific part known to fail, such as a transmission or infotainment unit, often through a customer satisfaction program. It is different from a recall because the problem is not classed as a safety defect. Ask a dealer whether any extensions apply to the VIN, and keep receipts in case you can claim a refund for past repairs.",
    },
    es: {
      term: "Extensión de garantía",
      def: "Ocurre cuando el fabricante amplía por su cuenta la cobertura de una pieza específica que suele fallar, como la transmisión o la pantalla, muchas veces mediante un programa de satisfacción al cliente. No es un retiro porque la falla no se considera de seguridad. Pregunte al concesionario si aplica a su VIN y guarde los recibos por si puede pedir reembolso de reparaciones pasadas.",
    },
    link: "/guide/are-recalls-a-red-flag",
  },
];
