

Universidad Nacional de Ingeniería
Facultad de Ciencias

## Monografía

## TALLER DE EFECTIVIDAD PERSONAL
## HU501 – U
## Monografía 1
“Sistema web de gestión y emisión de tickets de turno para el
servicio de comedor de la Universidad Nacional de Ingeniería”
## Estudiantes:
Guzman Lopez, RaulAntonio - 20255009H
Luna Roca, Fabrizio Santiago - 20241123H
Morales Quispe, Rodrigo – 20241215J
## Quichca Letona, Luis Fernando - 20241088h

## Docente:
## Felipe Tsutomu Hiromoto Hiromoto

## Ciclo: 26-1
## Fecha: 17/04/26



## Resumen
El presente proyecto consiste en el diseño y desarrollo de una aplicación web enfocada en
la  gestión,  emisión  y  control  de  tickets  de  turno  para  el  comedor  universitario.  Ante  la
problemática  de  las  constantes  aglomeraciones  y  la  gestión  manual  e  ineficiente  de  los
espacios,  el  sistema  propone  una  solución  digital  para  optimizar  el  flujo  de  atención
mediante el procesamiento de peticiones en tiempo real y la administración de un sistema
de  cupos  híbrido  (presencial  y  virtual).  La  plataforma  abarcará  todo  el ciclo  del  ticket
digitalizado, integrando una interfaz adaptada a dispositivos móviles para el monitoreo de
colas y un panel de métricas para la administración.
El grupo beneficiado abarca, por un lado, a la comunidad estudiantil que usará el servicio,
a quienes se les brindará una herramienta para optimizar su tiempo de espera; y por otro
lado, al personal administrativo y operativo del comedor, quienes dispondrán de un sistema
automatizado para el control de aforo y el registro de información estadística de consumo.










Tabla de Contenido

Resumen..................................................................................................................... ii
Capítulo I. Introducción.............................................................................................. v
Capítulo II. Marcos teórico ........................................................................................ 6
2.1 Marco teórico .................................................................................................... 6
2.1.1 Teoría de colas (Queueing Theory) ....................................................... 6
2.1.2 Grafos y estructuras de datos para la gestión de estados .................... 7
2.1.3 Concurrencia y control de acceso a recursos compartidos .................. 8
2.1.4 Complejidad algorítmica y rendimiento del sistema .............................. 9
2.2 Marco conceptual ............................................................................................. 9
2.2.1 Teleticket y sistemas de boletería digital con alta demanda ................. 9
2.2.2 Sistemas de gestión de turnos en servicios públicos .......................... 10
2.2.3 Sistemas de comedor universitario digitalizados ................................. 10
2.2.4 Arquitecturas    de    referencia    para    sistemas    reactivos    de    alta
concurrencia 11
capítulo III. Identificación del grupo objetivo ........................................................... 12
3.1 Características del grupo objetivo (ubicación, necesidades, problemática) .... 12
3.2 Justificación de la elección del proyecto (nivel de impacto) ............................. 13
Capítulo IV. Definición del proyecto ........................................................................ 14
4.1 Nombre del proyecto ...................................................................................... 14
4.2 Objetivo general y específicos: ...................................................................... 14

4.2.1 Objetivo General:.................................................................................. 14
4.2.2 Objetivo Específico ............................................................................... 14
4.2.3 Alcance del proyecto ............................................................................ 15
4.2.4 Restricciones y supuestos ................................................................... 15
Capítulo V. Planificación del proyecto .................................................................... 17
5.1 Estructura de desglose del trabajo (EDT/WBS) ............................................ 17
5.2 Cronograma.................................................................................................... 18
5.3 Recursos (materiales, humanos, técnicos) ................................................... 19
5.4 Presupuesto estimado ................................................................................... 20
5.5 Identificación de riesgos básicos ................................................................... 21
Capítulo VI. Ejecución del proyecto ........................................................................ 22
Capítulo VII. Monitoreo y control ............................................................................. 22
Capítulo IX. Cierre del proyecto .............................................................................. 22
Capítulo X. Anexos .................................................................................................. 22
Capítulo XI. Bibliografía ........................................................................................... 22
Conclusiones ........................................................................................................... 23
Recomendaciones ................................................................................................... 24
Referencias bibliográficas ....................................................................................... 25
Anexos ..................................................................................................................... 26




## Capítulo I. Introducción
En el comedor universitario se presentan constantes aglomeraciones, largas colas
y desorganización en la atención, debido principalmente a una gestión manual e ineficiente
de los turnos. Esta situación genera retrasos en el servicio y dificulta el acceso ordenado
de los estudiantes. Además, la falta de control adecuado del aforo incrementa la congestión
en horas pico. Todo ello afecta negativamente la experiencia de los usuarios.
El problema afecta principalmente a los estudiantes, quienes requieren un servicio
ágil debido a sus horarios académicos limitados y la alta demanda del comedor. Muchos
dependen  de  este  servicio  diariamente,  por  lo  que  las  demoras  impactan  en  su
organización personal. Asimismo, también involucra al personal administrativo y operativo
encargado de gestionar el flujo de atención. Estos enfrentan dificultades para controlar el
aforo y mantener el orden.
El  proyecto  se  justifica  por  la  necesidad  de  mejorar  la  gestión  del  comedor
universitario   y   brindar   una   solución   eficiente   a   los   problemas   identificados.   La
implementación  de  una  aplicación  web  permitirá  optimizar  la  asignación  de  turnos  y
organizar  mejor la  atención.  Esto  contribuirá  a  reducir  los  tiempos  de  espera  y  evitar  la
saturación de espacios. Como resultado, se mejorará la calidad del servicio ofrecido.
El  desarrollo  de  este  proyecto  permite  aplicar  conocimientos  de  programación,
desarrollo web y gestión de sistemas en un entorno real. Asimismo, brinda la oportunidad
de enfrentar problemas concretos y plantear soluciones tecnológicas eficientes. También
fortalece habilidades como el análisis, el diseño de soluciones y el trabajo en equipo. Estas
competencias son fundamentales para el desempeño profesional y liderazgo en proyectos
futuros.



Capítulo II. Marcos teórico
2.1 Marco teórico
2.1.1 Teoría de colas (Queueing Theory)
La  teoría  de  colas,  desarrollada  formalmente  por  A.  K.  Erlang  en  el  contexto  de
redes  telefónicas  y  sistematizada  por  el  trabajo  de  Kendall  (1953),  provee  el  marco
matemático  para  analizar  y  dimensionar  sistemas  donde  los  usuarios  compiten  por
recursos compartidos. Un sistema de colas se describe mediante la notación de Kendall
A/S/c/K/N, donde A es la distribución de llegadas, S la distribución de servicio, c el número
de servidores, K la capacidad del sistema y N el tamaño de la población de usuarios (Gross
## & Harris, 1998).
Para RanchUNI, el modelo más relevante es el M/M/c: llegadas de solicitudes de
tickets que siguen un proceso de Poisson con tasa λ (especialmente pronunciado en la
apertura de reservas diarias), tiempos de servicio exponenciales con tasa μ, y c servidores
lógicos en el backend. La métrica clave que este modelo permite calcular es la probabilidad
de que el sistema se sature (P₀) y el tiempo de espera promedio en cola Wq = λ/(μ(μ − λ)),
lo que fundamenta las decisiones de diseño sobre cuántas instancias del servidor deben
atender peticiones concurrentes y cuál debe ser el límite de tickets emitidos por ventana
de tiempo.
Adicionalmente, el modelo M/D/1 (llegadas Poisson, servicio determinístico) resulta
aplicable al proceso de validación de tickets en la puerta del comedor, donde el tiempo de
atención  es  prácticamente  constante.  En  este  caso  la  fórmula  de  Pollaczek-Khinchine
reduce la longitud promedio de la cola a Lq = ρ²/(2(1 − ρ)), siendo ρ = λ/μ el factor de
utilización del sistema, lo que permite garantizar que la cola física no supere la capacidad
del espacio.


2.1.2 Grafos y estructuras de datos para la gestión de estados
El ciclo de vida de un ticket digital puede modelarse formalmente como un autómata
finito  determinista  (AFD)  o,  con  mayor  expresividad,  como  un  grafo  dirigido  G  =  (V,  E)
donde  los  vértices  V  representan  los  posibles  estados del  ticket  (PENDIENTE,  ACTIVO,
VALIDADO, EXPIRADO, CANCELADO) y las aristas dirigidas E ⊆ V × V representan las
transiciones permitidas  entre  estados  (Hopcroft,  Motwani  &  Ullman,  2006).  Este  enfoque
garantiza  que  ninguna  transición  ilegal  ocurra  en  el  sistema:  por  ejemplo,  un  ticket
EXPIRADO no puede transitar a ACTIVO, propiedad que se valida en O(1) mediante una
tabla de adyacencia del grafo de estados.
Para la gestión de la cola de espera en sí, la estructura de datos fundamental es la
cola de prioridad implementada como un heap binario mínimo o máximo (Min-Heap / Max-
Heap),  con  operaciones  de  inserción  y  extracción  en  O(log  n).  Si  el  sistema  requiere
priorización diferenciada (e.g., estudiantes con necesidades especiales), puede adoptarse
una cola de prioridad con múltiples niveles o un heap de Fibonacci, que reduce el costo
amortizado  de  la  operación  decrease-key  a  O(1)  (Fredman  &  Tarjan,  1987),  siendo
especialmente eficiente en escenarios donde las prioridades cambian dinámicamente.
A  un  nivel  más  alto  de  abstracción,  la  relación  entre  módulos  del  sistema
(autenticación, emisión de tickets, validación, métricas) puede representarse como un grafo
de dependencias de servicios, útil tanto para detectar ciclos (dependencias circulares que
introducen deadlocks en la inicialización) mediante el algoritmo de detección de ciclos de
Kahn en O(V + E), como para calcular el orden topológico de arranque de los microservicios
en caso de una arquitectura distribuida.


2.1.3 Concurrencia y control de acceso a recursos compartidos
El  problema  central  del  backend  de  RanchUNI  es  la  condición  de  carrera  (race
condition)  que  se produce  cuando  múltiples  usuarios  solicitan  simultáneamente el último
cupo  disponible.  Este  problema  pertenece  a  la  categoría  de  los  problemas  clásicos  de
sincronización,  formalizados  por  Dijkstra  mediante  el  concepto  de  sección  crítica  y  los
mecanismos de  semáforos  (Dijkstra,  1965).  En  términos  prácticos,  el  contador de  cupos
disponibles constituye un recurso compartido que debe protegerse mediante mecanismos
de exclusión mutua (mutex).
En bases de datos relacionales, el mecanismo equivalente son las transacciones
ACID y el control de concurrencia optimista o pesimista. Para el escenario de alta demanda
en  la  apertura  de  reservas,  se  recomienda  el  uso  de  bloqueos  a  nivel  de  fila  (row-level
locking)  con  la  semántica  SELECT  ...  FOR  UPDATE  en  SQL,  lo  que  garantiza  que  la
asignación    de    cupos    sea    atómica    e    impida    la    sobreemisión    de    tickets.
Complementariamente, el uso de operaciones atómicas en Redis (como DECR o SETNX)
permite  implementar  un  contador  de  cupos  en  memoria  con  complejidad  O(1)  por
operación, resolviendo el cuello de botella de rendimiento que representaría consultar la
base de datos relacional en cada solicitud concurrente.
Desde la perspectiva de los paradigmas de programación, el backend orientado a
eventos  (event-driven)  con  E/S  no  bloqueante —implementado  en  Node.js  mediante  el
event loop y las promesas, o en Python mediante asyncio— es el paradigma que mejor se
adapta  a cargas  de  alta  concurrencia  con  operaciones  de  E/S  intensivas  (peticiones  de
base  de  datos,  verificaciones  de  autenticación),  ya  que  permite  gestionar  miles  de
conexiones  simultáneas  sin  bloquear  el  hilo  principal,  a  diferencia  del  modelo  de  hilos
tradicionales (Tilkov & Vinoski, 2010).


2.1.4 Complejidad algorítmica y rendimiento del sistema
El análisis de la complejidad temporal y espacial de los algoritmos empleados en el
backend  es  fundamental  para  garantizar  que  el  sistema  sea  escalable.  Bajo  la  notación
asintótica de Landau (Big-O), las operaciones más críticas en RanchUNI deben cumplir los
siguientes órdenes de complejidad: la búsqueda y validación de un ticket por código único
debe ser O(1) mediante tablas hash (hash maps); la consulta del siguiente turno en cola
debe ser O(1) para colas FIFO simples o O(log n) para colas de prioridad; y la generación
de reportes de métricas agregadas debe ser O(n) sobre el conjunto de registros del día,
evitando   algoritmos   cuadráticos   que   degradarían   el   rendimiento   del   panel   de
administración ante volúmenes de datos crecientes.
El  dimensionamiento  de  índices  en  la  base  de  datos  sigue  la  misma  lógica:  los
campos  de  búsqueda  frecuente  (código  de  ticket,  ID  de  usuario,  timestamp  de  reserva)
deben  indexarse  mediante  estructuras  de  árbol  B+  (B+-tree),  cuya  complejidad  de
búsqueda  es  O(log  n)  sobre  el  número  de  registros,  garantizando  tiempos de  respuesta
estables incluso cuando la tabla de tickets acumule millones de registros a lo largo de los
ciclos académicos.



2.2 Marco conceptual
2.2.1 Teleticket y sistemas de boletería digital con alta demanda
Teleticket,  operado  por  Wong  en  el  Perú,  constituye  uno  de  los  referentes
nacionales más cercanos en cuanto al manejo de alta concurrencia en la emisión de tickets.
Su  arquitectura  aborda  el  problema  de  la  saturación  del  servidor  durante  la  apertura  de
ventas  de  eventos  masivos  (conciertos,  eventos  deportivos)  mediante  colas  de  espera
virtuales que regulan el flujo de usuarios hacia el sistema de pago, evitando la caída del
servicio. Esta estrategia se conoce como Virtual Waiting Room (Sala de Espera Virtual) y
es  también  adoptada  por  plataformas  como  Ticketmaster  y  su  solución  Queue-it.  El
principio  técnico  subyacente  es  el  patrón  de  diseño  de  throttling  o  limitación  de  tasa  de
solicitudes,  que  restringe  el  número  de  peticiones  procesadas  por  unidad  de  tiempo,
protegiendo  los  recursos  del  backend  (Microsoft  Azure  Architecture  Center,  2023).  Para
RanchUNI,  este  patrón  es  directamente  aplicable  al  momento  de  apertura  diaria  de
reservas.
2.2.2 Sistemas de gestión de turnos en servicios públicos
En  el  ámbito  de  los  servicios  públicos  iberoamericanos,  el  sistema  Qmatic (de
origen  sueco,  pero  ampliamente  desplegado  en  entidades  bancarias  y  gubernamentales
latinoamericanas)  y  el  sistema  de  citas  del  RENIEC  en  el  Perú  ofrecen  modelos  de
referencia  para  la  gestión  de  turnos  en  espacios  con  aforo  limitado.  Ambos  sistemas
comparten las características de asignación de turnos con código único, visualización del
estado en tiempo real y notificación al usuario cuando su turno se aproxima. La diferencia
con RanchUNI radica en que estos sistemas operan bajo demanda distribuida en el tiempo
(los usuarios se conectan a distintas horas del día), mientras que RanchUNI enfrenta una
demanda  altamente  concentrada  en  un  instante  específico,  lo  que  eleva  la  exigencia
técnica del backend.


2.2.3 Sistemas de comedor universitario digitalizados
A nivel internacional, diversas universidades han transitado hacia sistemas digitales
de  gestión  del  comedor.  La  Universidad  de  Harvard,  a  través  de  su  plataforma  Harvard
Dining  Services,  implementa  la  reserva de horarios  de  acceso mediante aplicación web,
eliminando las filas físicas y distribuyendo la demanda a lo largo del día mediante franjas
horarias  (slots).  De  manera  similar,  el  MIT  Dining  System  permite  a  los  estudiantes
consultar  disponibilidad  y  reservar  en  tiempo  real.  En  el  contexto  latinoamericano,  la
Universidad de Chile implementó durante la pandemia de COVID-19 un sistema de reserva
de  cupos  para  el  casino  universitario  que,  aunque  diseñado  para  cumplir  protocolos
sanitarios, demostró la viabilidad técnica y la alta aceptación de los usuarios ante sistemas
digitales  de  este  tipo,  reduciendo  los  tiempos  de  espera  promedio  en  un  60%  según  el
reporte  del  Departamento  de  Bienestar  Estudiantil  de  dicha  institución  (Universidad  de
## Chile, 2021).
2.2.4 Arquitecturas de referencia para sistemas reactivos de alta concurrencia
El Reactive Manifesto (Bonér et al., 2014) establece cuatro principios para sistemas
que deben mantener la responsividad bajo alta carga: ser reactivos (responsive), resilientes
(resilient),  elásticos  (elastic)  y  orientados  a  mensajes  (message-driven).  Estos  principios
son el fundamento teórico de arquitecturas como CQRS (Command Query Responsibility
Segregation) y Event Sourcing, donde las operaciones de escritura (emisión de tickets) y
lectura  (consulta  del  estado  de  cola)  se  procesan  por  caminos  separados,  permitiendo
escalar  ambas  de  forma  independiente.  Para  el  alcance  del  MVP  de  RanchUNI,  una
aplicación  parcial  de  CQRS —separando  las  rutas  de  API  de  escritura  y  consulta  en  el
backend— ofrece  un  balance  adecuado  entre  rigor  arquitectónico  y  complejidad de
implementación dentro del plazo del proyecto.


Capítulo III. Identificación del grupo objetivo
3.1 Características del grupo objetivo (ubicación, necesidades, problemática)
El grupo objetivo al cual va dirigido la web es a los estudiantes de la Universidad
Nacional  de  Ingeniería  (UNI)  que  cursan  un  ciclo  regular,  esta  se  ubica  en  la  ciudad  de
Lima,  Distrito  de  Rimac. La  conforman en  mayor medida jóvenes  peruanos de  todos  los
distritos de la capital y las regiones del territorio, muchos de ellos realmente dependen del
comedor universitario como alimento diario, cualquier ayuda que agilice este proceso los
beneficiará.
En cuanto a las necesidades, siempre se ha requerido un servicio de este tipo que
funcione de forma accesible, eficaz y equitativa, que les permita gestionar su acceso a este
servicio  sin  realmente  afectar  su  bienestar  o  vida  dentro  de  la  universidad  de  manera
drástica.  Además  ya  conocemos  que  otras  instituciones  estatales  lo  implementan,  el
acceso a insumos saludables de bajo costo es fundamental para el rendimiento académico,
por ello se busca disminuir el tiempo de colas o incluso el sacrificio del horario de sueño de
los estudiantes para alcanzar un cupo.
La problemática principal gira en torno al sistema actual de asignación de cupos para
estudiantes que requiere su presencia a  altas horas  de la mañana,  esto genera que muchos
alumnos modifiquen sus rutinas o incluso alteren su horario nocturno siendo peor los casos
de  quienes  viven  muy  lejos,  beneficiando  al  que  llega  con  más  anticipación,  no  siendo
equitativo, así mismo las largas colas formadas que causan pérdidas vitales de tiempo en los
jóvenes.  Por  tales  motivos  muchos  jóvenes  aún  quedan  excluidos  del servicio  o  no  les  es
conveniente usarlo.



3.2 Justificación de la elección del proyecto (nivel de impacto)
Este  proyecto  se  justifica  bajo  la  problemática  que  el  sistema  del  comedor
universitario de la UNI es poco eficiente y acceso limitado, beneficiando a cierta cantidad
de jóvenes mientras que no considera a otros. Pensamos en ese grupo de estudiantes con
dificultades  y  que  es  tiempo  de  un  cambio,  en  un  era  tan  moderna  en  la  que  vivimos
seguimos arrastrando estas falencias.
Si consideramos el nivel de impacto, una plataforma web con gestión de tickets no
es nada novedoso pero la situación amerita un cambio por lo que se espera un impacto
social  y  académico.  En  el  factor  social  se  reparte  de  forma  más  equitativa  los  cupos,
evitando prácticas que favorecen a los que llegan con anticipación, con ello se mejoran y
organizan  mejor  los  horarios  y  rutinas  de  los  estudiantes  y  reduce  la  incertidumbre  de
adquirir un turno.
En el ámbito académico se podrá brindar más horas para optimizar el tiempo y su
uso  en  estudio  o  actividades  académicas,  en  el  ámbito  tecnológico  promueve  la
digitalización  y  se  alinea  más  a  las  tendencias  actuales,  además  de  aportar  a  la
transformación digital de muchos servicios públicos.


Capítulo IV. Definición del proyecto
4.1 Nombre del proyecto
El  proyecto asignado  para  el  proyecto  es "Sistema  web  de  gestión  y  emisión  de
tickets de turno para el servicio de comedor de la Universidad Nacional de Ingeniería". Este
título  refleja  la  naturaleza  tecnológica  de  la solución a  través  de  una  aplicación  web, la
función  principal  que  desempeña  (gestión  y  emisión  de  tickets  de  turno),  el  contexto  de
aplicación  (servicio  de  comedor)  y  la  institución  beneficiaria  (UNI).  Para  efectos  de
identidad  de  marca  y  comunicación  con  los  usuarios  finales,  la  aplicación  adoptará  el
nombre  comercial  RanchUNI,  denominación  que  combina  el  término  coloquial  "rancho" ,
referente a las raciones de alimentación en contextos institucionales; con las siglas de la
universidad,  buscando  generar  cercanía  y  rápida  adopción  por  parte  de  la  comunidad
estudiantil
4.2 Objetivo general y específicos:
## 4.2.1 Objetivo General:
Desarrollar una aplicación web que permita gestionar la emisión y control de tickets
de  turno  para  el  servicio  de  comedor,  optimizando  el  flujo  de  atención  y  reduciendo  los
tiempos de espera de los usuarios.
## 4.2.2 Objetivo Específico
- Implementar un módulo de registro, autenticación y control de acceso a los usuarios.
- Desarrollar  el  flujo  completo  de  solicitud,  validación  y  cancelación  de  tickets
digitales con asignación automática de turnos según horario y disponibilidad
-  Implementar un sistema de visualización en tiempo real del estado de la cola


- Garantizar  que  la  interfaz  sea  responsive,  intuitiva  y  accesible  desde  dispositivos
móviles, asegurando una experiencia fluida para el usuario final
- Implementar un Dashboard para la visualización de métricas de consumo de raciones
(cantidad de estudiantes atendidos por turno, día y mes), facilitando la toma de decisiones.

4.2.3 Alcance del proyecto
El proyecto abarcará el diseño, desarrollo e implementación de una aplicación web
(frontend y backend) enfocada en la reserva y gestión de turnos.
## 4.2.4.1 Incluye:
El sistema manejará dos modalidades de cupos (presencial y virtual). El backend
estará optimizado para gestionar peticiones concurrentes (alta demanda en horas punta).
Se  entregará  una  vista  para el  estudiante  (reserva y  estado  de  cola)  y  una  vista  para  el
administrador del comedor (validación de tickets y dashboard de métricas).
## 4.2.4.2  Excluye:
En esta fase de Producto Mínimo Viable (MVP), el alcance se limita a una aplicación
web  responsive;  no  se  desarrollarán  aplicaciones  móviles  nativas  descargables  desde
tiendas (Play Store/App Store). Asimismo, no se incluirán pasarelas de pago (asumiendo
la naturaleza del servicio de comedor).



4.2.4 Restricciones y supuestos
## 4.2.4.3 Restricciones
Dependencia de Red: El sistema requiere una conexión constante a internet, tanto
por  parte  del  usuario  para  generar/visualizar  el  ticket,  como  por  parte  del  servidor  para
procesar las colas en tiempo real.
Límites  Físicos:  El  software  está  restringido  por  el  aforo  real  y  la  capacidad  de
producción diaria del comedor; no puede emitir más tickets que las raciones disponibles.
Concurrencia: El backend tiene la restricción técnica de deber procesar cientos de
peticiones de turnos simultáneas en una ventana de tiempo muy corta (ej. cuando se abren
las reservas diarias).
## 4.2.4.4 Supuestos
Infraestructura  del  Usuario:  Se  debe  tener  en  cuenta  que  la  gran  mayoría  de  la
población estudiantil posee un dispositivo móvil inteligente (smartphone) con acceso a un
navegador web y datos móviles/Wi-Fi.
Validación  de  Identidad:  Tomamos  el  uso  exclusivo  del  correo  institucional
universitario  (ej.  @uni.edu.pe)  como  mecanismo  principal  para  evitar  la  creación  de
cuentas duplicadas o el acceso de personas ajenas a la institución.
Colaboración   Operativa:   Se   da   por   sentado   que   el   personal   de   puerta   o
administración  del  comedor  contará  con  un  dispositivo  (tablet  o  lector)  para  validar  los
tickets generados por la plataforma.







Capítulo V. Planificación del proyecto
La  planificación  del proyecto  RanchUNI  se  desarrolla  bajo el  enfoque del  Project
Management Body of Knowledge (PMBOK® Guide, 7.ª edición, PMI, 2021), que concibe la
gestión de proyectos como un conjunto integrado de áreas de conocimiento que cubren el
alcance, el cronograma, los recursos, el costo y los riesgos. El presente capítulo consolida
los  instrumentos  de  planificación  elaborados  por  el  equipo,  ofreciendo  la  justificación  y
lectura técnica de cada uno de ellos.
5.1 Estructura de desglose del trabajo (EDT/WBS)
La Estructura de Desglose del Trabajo (EDT), conocida internacionalmente como
Work   Breakdown   Structure   (WBS),   es  una   descomposición   jerárquica  orientada  a
entregables  del  trabajo  total  que el  equipo  debe  ejecutar  para  alcanzar  los  objetivos  del
proyecto y generar los productos requeridos (PMI, 2021). La EDT no refleja la secuencia
de  ejecución  de  las  actividades —función  que  corresponde  al  cronograma— sino  la
totalidad del alcance del proyecto: todo trabajo que no figure en la EDT queda fuera del
proyecto.
Para RanchUNI, la EDT se estructura en cuatro paquetes de trabajo de primer nivel:
(1) Planificación y diseño inicial, que comprende la definición del alcance, la identificación
del  grupo  objetivo  y  la  elaboración  del  marco  teórico-conceptual;  (2)  Planificación  de


proyecto, que cubre los instrumentos de gestión (EDT, cronograma, recursos, presupuesto
y riesgos); (3) Desarrollo de aplicación, que concentra el mayor volumen de trabajo técnico,
descomponiéndose en requerimientos, diseño, codificación y pruebas; y (4) Entrega final,
que agrupa la elaboración de conclusiones, bibliografía y la revisión integral del entregable.
La codificación decimal de cada entregable (e.g., 3.3.3 para la codificación del programa)
facilita la trazabilidad entre la EDT, el cronograma y los registros de avance.
## Actividad
## Código
## EDT
## Nombre Descripcion
## 1 1
Planificación y diseño
inicial
Fase inicial que define el alcance, objetivos y
marco general del proyecto de desarrollo de
la aplicación.
## 1 1.1 Portada
Diseño de portada con título del proyecto,
integrantes del equipo, fecha de entrega e
institución.
1 1.2 Resumen ejecutivo
Síntesis del proyecto: problema a resolver,
solución propuesta, beneficios esperados y
alcance general.
## 1 1.3
Introducción y
justificación
Contexto del problema, necesidad del
mercado o usuario, y justificación.
1 1.4 Grupo objetivo
Definición del perfil de usuarios finales:
características demográficas, necesidades y
comportamiento esperado.
## 1 1.5
Definición del
proyecto
Alcance funcional, entregables clave,
restricciones y supuestos del proyecto.
## 2 2
Planificación de
proyecto
Organización del trabajo, cronograma,
recursos y presupuesto para la ejecución
ordenada del proyecto.
## 2 2.1 EDT/WBS
Estructura de Desglose del Trabajo:
descomposición jerárquica de entregables y
paquetes de trabajo.
## 2 2.2 Cronograma – Gantt
Diagrama de Gantt, dependencias entre
tareas, ruta crítica y fechas clave del
proyecto.
## 2 2.3 Recursos
Identificación de recursos humanos,
tecnológicos y materiales necesarios con
asignación de roles.
2 2.4 Presupuesto estimado
Estimación de costos por actividad: licencias,
infraestructura, horas de desarrollo y
contingencias.
## 2 2.5
Identificación de
riesgos básicos
Matriz de riesgos con probabilidad, impacto,
estrategias de mitigación y planes de
contingencia.


## 3 3
Desarrollo de
## Aplicación
Ciclo completo de desarrollo: levantamiento
de requerimientos, diseño, codificación y
pruebas.
## 3 3.1 Requerimientos
Recolección y documentación de
necesidades del sistema desde la
perspectiva del usuario y del negocio.
## 3 3.1.1
## Requisitos
funcionales
Funcionalidades que el sistema debe
cumplir: casos de uso, historias de usuario y
flujos principales.
## 3 3.1.2
Requisitos no
funcionales
Restricciones de rendimiento, seguridad,
escalabilidad, disponibilidad y compatibilidad
del sistema.
3 3.1.3 Requisitos detallados
Especificaciones técnicas detalladas: reglas
de negocio, validaciones, formatos de datos
y excepciones.
## 3 3.2 Diseño
Arquitectura y diseño visual/técnico de la
solución antes de iniciar la codificación.
3 3.2.1 Diseño funcional
Diagramas de flujo, casos de uso detallados
y lógica de negocio de cada módulo
funcional.
3 3.2.2 Diseño del sistema
Arquitectura del sistema: modelo de datos,
diagramas de componentes, APIs y
tecnologías seleccionadas.
3 3.2.3 Diseño de la interfaz
Mockups y prototipos de pantallas:
navegación, layout, paleta de colores y
experiencia de usuario (UX).
## 3 3.3 Codificación
Implementación del código fuente siguiendo
estándares de calidad y buenas prácticas de
desarrollo.
3 3.3.1 Definición de módulos
Identificación de módulos independientes:
responsabilidades, entradas, salidas y
dependencias entre ellos.
3 3.3.2 Definición de interfaz
Definición de contratos entre módulos:
endpoints, parámetros, formatos de
respuesta y manejo de errores.
## 3 3.3.3
Codificación del
programa
Desarrollo del código por módulo:
implementación de lógica, conexión a BD y
pruebas unitarias.
## 3 3.4 Test
Verificación y validación del software
mediante pruebas sistemáticas para
asegurar calidad.
3 3.4.1 Test interna
Pruebas unitarias y funcionales dentro del
equipo: validación de cada módulo de forma
aislada.
3 3.4.2 Test de integración
Pruebas de integración entre módulos:
verificación de flujos completos y
comunicación entre componentes.
4 4 Entrega final
Consolidación de entregables finales,
documentación de cierre y presentación
formal del proyecto.


## 4 4.1
Resultados y
conclusiones
Análisis de resultados obtenidos vs. objetivos
planteados, lecciones aprendidas y
recomendaciones.
4 4.2 Anexos y bibliografía
Compilación de referencias bibliográficas,
documentación técnica de soporte y material
anexo.
4 4.3 Revisión final
Revisión integral del documento: coherencia,
formato, ortografía y cumplimiento de
requisitos de entrega.

## 5.2 Cronograma
El cronograma del proyecto se elaboró mediante un diagrama de Gantt, herramienta
que  representa  gráficamente la  duración  y  secuencia  de  las  actividades  del  proyecto  en
función del tiempo calendario (PMI, 2021). El proyecto tiene una duración total de 35 días
calendario, comprendidos entre el 2 de abril y el 6 de mayo de 2026, organizados en cuatro
fases que se solapan parcialmente para optimizar el uso del tiempo disponible del equipo.
La fase 1 (Planificación y diseño inicial) se ejecuta entre el 2 y el 17 de abril, con
una duración de 15 días, y se desarrolla en paralelo con la fase 2 (Planificación de proyecto,
del  3  al  17  de  abril,  14  días),  ya  que  ambas  son  de  naturaleza  documental y  pueden
atenderse por distintos integrantes simultáneamente. La fase 3 (Desarrollo de aplicación,
del  20  de  abril  al  3  de  mayo,  13  días)  constituye  la  fase  de  mayor  carga  técnica  y  está
estructurada  en  cuatro  subfases  secuenciales:  requerimientos  (3  días),  diseño  (3  días),
codificación (5 días) y pruebas (1 día), respetando las dependencias de finalización a inicio
(FS: Finish-to-Start) entre ellas. La fase 4 (Entrega final, del 4 al 6 de mayo, 2 días) cierra
el  proyecto  con  la  consolidación  del  documento y  la  revisión  integral.  La  ruta  crítica  del
proyecto atraviesa la secuencia diseño del sistema → codificación del programa → test de
integración → revisión final, siendo esta cadena la que determina la fecha de término más
temprana posible del proyecto.



## Actividad
## Código
## EDT
## Nombre
Fecha de
inicio
Fecha de
término
## Días
1 1 Planificación y diseño inicial 2/04/2026 17/04/2026 15
## 1 1.1 Portada 2/04/2026 3/04/2026 1
1 1.2 Resumen ejecutivo 2/04/2026 3/04/2026 1
1 1.3 Introducción y justificación 2/04/2026 3/04/2026 1
1 1.4 Grupo objetivo 2/04/2026 6/04/2026 4
1 1.5 Definición del proyecto 2/04/2026 6/04/2026 4
2 2 Planificación de proyecto 3/04/2026 17/04/2026 14
## 2 2.1 EDT/WBS 3/04/2026 5/04/2026 2
## 2 2.2 Cronograma – Gantt 5/04/2026 6/04/2026 1
## 2 2.3 Recursos 6/04/2026 10/04/2026 4
2 2.4 Presupuesto estimado 11/04/2026 14/04/2026 3
## 2 2.5
Identificación de riesgos
básicos 14/04/2026 17/04/2026 3
3 3 Desarrollo de Aplicación 20/04/2026 3/05/2026 13
## 3 3.1 Requerimientos 20/04/2026 23/04/2026 3
3 3.1.1 Requisitos funcionales 20/04/2026 23/04/2026 3
3 3.1.2 Requisitos no funcionales 20/04/2026 23/04/2026 3
3 3.1.3 Requisitos detallados 20/04/2026 23/04/2026 3
## 3 3.2 Diseño 23/04/2026 26/04/2026 3
3 3.2.1 Diseño funcional 23/04/2026 25/04/2026 2
3 3.2.2 Diseño del sistema 23/04/2026 25/04/2026 2
3 3.2.3 Diseño de la interfaz 23/04/2026 26/04/2026 3
## 3 3.3 Codificación 25/04/2026 30/04/2026 5
3 3.3.1 Definición de módulos 25/04/2026 26/04/2026 1
3 3.3.2 Definición de interfaz 25/04/2026 26/04/2026 1
3 3.3.3 Codificación del programa 26/04/2026 3/05/2026 7
## 3 3.4 Test 3/05/2026 4/05/2026 1
3 3.4.1 Test interna 3/05/2026 4/05/2026 1
3 3.4.2 Test de integración 3/05/2026 4/05/2026 1
4 4 Entrega final 4/05/2026 6/05/2026 2
4 4.1 Resultados y conclusiones 4/05/2026 5/05/2026 1
4 4.2 Anexos y bibliografía 4/05/2026 5/05/2026 1
4 4.3 Revisión final 5/05/2026 6/05/2026 1








5.3 Recursos (materiales, humanos, técnicos)
La gestión de recursos abarca la identificación, adquisición y administración de los
activos humanos, materiales y técnicos necesarios para ejecutar el proyecto (PMI, 2021).
Para  RanchUNI,  dado  su  carácter  académico  y  la  restricción  de  no  involucrar  terceros
externos, los recursos son enteramente provistos por los propios integrantes del equipo.
La siguiente tabla consolida la totalidad de los recursos identificados:
## Categoría Recurso Descripción Asignación
## Humanos
4 estudiantes
universitarios
Equipo de desarrollo full-stack
(análisis, diseño, codificación,
pruebas)
Dedicación parcial,
estimado 10
h/semana c/u
## Materiales
## Laptop
personal (×4)
Equipos propios de los integrantes
con SO Windows/Linux
Uso durante todo el
proyecto
## Técnicos
Entorno local
## (localhost)
Servidor de desarrollo corriendo en
máquina local; sin infraestructura
cloud en esta fase
Todos los
integrantes
Técnicos Git / GitHub
Control de versiones y colaboración
remota del repositorio
## Repositorio
compartido del
equipo
## Técnicos
Stack web
(React +
## Node.js /
## Python)
Tecnologías seleccionadas para
frontend y backend según diseño del
sistema
Definido en fase de
diseño
## Financieros
## Presupuesto
de
contingencia
Hasta    S/.    200.00    para    gastos
imprevistos (dominio, hosting
temporal, licencias)
Fondo    compartido
del equipo
El   equipo   está   conformado   por   cuatro   estudiantes   universitarios   con   roles
distribuidos según competencias individuales: un integrante a cargo del diseño de la base
de datos y el backend de gestión de colas, un segundo integrante responsable del frontend
y la experiencia de usuario, un tercero enfocado en la integración y las pruebas del sistema,


y  el  cuarto  a  cargo  de  la  documentación  técnica  y  la  coordinación  del  proyecto.  Esta
distribución es flexible y sujeta a ajuste según la carga de trabajo de cada fase, siguiendo
el principio de gestión adaptativa de recursos del PMBOK.
5.4 Presupuesto estimado
El  presupuesto  del  proyecto  refleja  el  costo  monetario  de  los  recursos  que  no  son
provistos de forma gratuita o que ya están disponibles en poder del equipo. Dado que el stack
tecnológico seleccionado es íntegramente de código abierto y los equipos de desarrollo son
de propiedad de los integrantes, el costo base del proyecto es cero soles. No obstante, se ha
identificado una reserva de contingencia de hasta S/. 200.00 para cubrir gastos imprevistos
durante  la  fase  de  pruebas  o  despliegue.  El  detalle  del  presupuesto  se  presenta  a
continuación:
## Partida Descripción
## Costo
estimado (S/.)
Recursos humanos 4     integrantes     ×     dedicación     voluntaria
(proyecto académico, sin costo monetario)
## 0.00
Hardware Laptops    personales    (ya    disponibles,    sin
adquisición nueva)
## 0.00
Software / licencias Herramientas de código abierto: VS Code, Git,
Node.js, React, PostgreSQL
## 0.00
Dominio web
## (contingencia)
Registro  de  dominio  o  hosting  temporal  si  se
requiere demo pública
## 60.00
Servicios cloud
## (contingencia)
Instancia  mínima  en  Railway  o  Render  para
prueba de despliegue
## 80.00
Materiales varios Impresión   de   documentación,   consumibles
varios
## 30.00
Reserva de
contingencia
Imprevistos no identificados 30.00
## TOTAL   200.00



5.5 Identificación de riesgos básicos
La gestión de riesgos comprende los procesos de identificación, análisis cualitativo,
planificación  de  respuestas  y  monitoreo  de  los  eventos  inciertos  que  pueden  afectar
negativamente el cumplimiento del alcance, el cronograma o la calidad del proyecto (PMI,
2021).  Para  el  análisis  cualitativo  se  emplea  una  escala  tripartita  de  probabilidad  (Alta  /
Media / Baja) e impacto (Alto / Medio / Bajo), y para cada riesgo identificado se define una
estrategia  de  mitigación  orientada  a  reducir  su  probabilidad  o  impacto  antes  de  que  se
materialice.
Riesgo Probabilidad Impacto Estrategia de mitigación
Incompatibilidad   técnica
entre módulos del
sistema
Media Alto Definir interfaces y contratos de API
antes de la codificación; pruebas de
integración continuas.
Retrasos en la
codificación por
complejidad  del  backend
concurrente
Alta Alto Priorizar módulos críticos (gestión
de colas) en sprints iniciales; uso
de librerías probadas para
concurrencia.
Fallo  en  la  conexión  a
internet  durante  pruebas
en campus
Media Medio Realizar pruebas en entorno local
antes del despliegue; implementar
manejo de errores de red en el
frontend.
Insuficiencia  de  recursos
de hardware para simular
carga concurrente
Baja Medio Utilizar herramientas de simulación
de carga (Apache JMeter) en
equipo local; limitar el alcance del
## MVP.
Abandono    o    falta    de
disponibilidad   de   algún
integrante del equipo
Baja Alto Documentar código y tareas
continuamente; mantener
repositorio actualizado en GitHub
para transferencia de conocimiento.
El  riesgo  de  mayor  prioridad  es  la  complejidad  técnica  del  backend  concurrente,
dada su alta probabilidad y alto impacto sobre el cronograma y la calidad del sistema. Como
estrategia  principal  de  respuesta,  el  equipo  adopta  la  técnica  de  prototipado  temprano
(spike técnico) para validar el manejo de concurrencia en la primera semana de la fase de
codificación, antes de comprometer la arquitectura completa del sistema.


Capítulo VI. Ejecución del proyecto

Capítulo VII. Monitoreo y control

Capítulo IX. Cierre del proyecto

## Capítulo X. Anexos
Capítulo XI. Bibliografía










