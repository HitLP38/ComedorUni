# Avance 1 — Capítulo VI. Ejecución del proyecto

## 3.1 Requerimientos

La etapa de levantamiento de requerimientos constituye el puente entre la planificación ya establecida en los capítulos previos y el diseño técnico que la sucederá. Siguiendo los lineamientos de la norma ISO/IEC/IEEE 29148:2018, los requerimientos del sistema se estructuran en tres niveles complementarios: los requisitos funcionales, que describen las capacidades que el sistema debe proveer al usuario; los requisitos no funcionales, que establecen las propiedades de calidad bajo las cuales dichas capacidades deben operar; y los requisitos detallados, que fijan las reglas de negocio, las validaciones y las restricciones técnicas que gobiernan la implementación (International Organization for Standardization, 2018). Esta clasificación es consistente con la propuesta clásica de Sommerville (2016), quien sostiene que un requerimiento correctamente especificado debe ser verificable, no ambiguo, consistente, factible y trazable a los objetivos del proyecto.

Para garantizar la trazabilidad, cada requerimiento del presente capítulo está identificado mediante un código único de la forma RF-NN para los requisitos funcionales, RNF-NN para los no funcionales y RD-NN para los detallados. Los requerimientos se derivan de manera directa tanto del alcance establecido en el capítulo IV como del marco teórico expuesto en el capítulo II, de modo que su cumplimiento asegura la coherencia entre las necesidades del usuario final, las restricciones operativas del comedor universitario y las fundamentaciones técnicas del sistema reactivo de alta concurrencia que se propone.

### 3.1.1 Requisitos funcionales

Los requisitos funcionales describen los servicios que el sistema debe ofrecer a sus actores, los comportamientos esperados ante entradas específicas y las salidas que deben producirse en cada escenario (Pressman & Maxim, 2019). Para el sistema RanchUNI se identifican tres actores principales: el estudiante universitario, que representa al usuario final del servicio; el operador del comedor, encargado de la validación física del ticket en el punto de atención; y el administrador del sistema, responsable de la configuración operativa y del monitoreo del desempeño. A continuación se detallan los requerimientos agrupados por módulo funcional.

**Módulo de gestión de identidad y acceso**

El requerimiento RF-01 establece que el sistema debe permitir a un estudiante registrarse por primera vez proporcionando su código de alumno, nombres completos, documento nacional de identidad, correo institucional y facultad de procedencia. El sistema verificará la consistencia interna de estos datos mediante la aplicación de tres algoritmos concurrentes: el algoritmo de verificación del último dígito del DNI establecido por el Registro Nacional de Identificación y Estado Civil, la validación estructural del código de alumno conforme al patrón institucional de la Universidad Nacional de Ingeniería y la verificación del formato del correo institucional de acuerdo con el patrón n1.A1.A2@uni.pe. Ante cualquier inconsistencia, el sistema emitirá un mensaje genérico al usuario, sin revelar cuál de los campos ha fallado, en cumplimiento del principio de exposición mínima de información frente a actores externos (OWASP Foundation, 2021).

El requerimiento RF-02 determina que el proceso de registro se completa únicamente cuando el estudiante accede a un enlace de verificación enviado a su correo institucional, cuya vigencia no excede las veinticuatro horas desde el momento de su emisión. Tras la confirmación, el estudiante definirá un número de identificación personal de seis dígitos que será almacenado bajo la función de hash argon2id, en concordancia con las recomendaciones del National Institute of Standards and Technology para el almacenamiento de credenciales (Grassi et al., 2017).

El requerimiento RF-03 establece que el sistema autenticará al estudiante mediante un esquema de doble factor compuesto por el DNI como identificador, el número de identificación personal como factor de conocimiento y un código de un solo uso de seis dígitos remitido al correo institucional como factor de posesión. El código de un solo uso caducará transcurridos cinco minutos desde su generación y se invalidará tras su primer uso correcto, de acuerdo con lo establecido por el Internet Engineering Task Force en la especificación del algoritmo TOTP (M'Raihi et al., 2011).

**Módulo de cola virtual y asignación de turnos**

El requerimiento RF-04 señala que, una vez autenticado el estudiante, el sistema lo incorporará a una sala de espera virtual en la que recibirá, en tiempo real, la posición que ocupa en la cola, el número estimado de usuarios delante de él y el tiempo estimado de espera. La incorporación a la cola se realiza de forma ordenada según el instante en que la autenticación fue completada, siguiendo la política First-In First-Out característica de las colas de prioridad temporal (Knuth, 1998). La sala virtual se comunica con el cliente mediante una conexión persistente por WebSocket con envío de señales de mantenimiento cada quince a veinte segundos, lo que permite detectar abandonos silenciosos y liberar la posición asignada.

El requerimiento RF-05 establece que, al alcanzar el frente de la cola virtual, el sistema emitirá al estudiante un token de reserva con vigencia de cinco minutos, dentro de los cuales el usuario podrá consultar la disponibilidad de turnos del servicio correspondiente y seleccionar uno. La consulta retornará la capacidad máxima de cada turno, el número de cupos ya reservados y el número de cupos restantes. Durante la selección, el sistema realizará una retención temporal del cupo durante sesenta segundos a fin de evitar conflictos entre la interfaz y el motor de persistencia.

El requerimiento RF-06 determina que la confirmación de la reserva producirá la creación atómica de un ticket con estado inicial de "reservado", asociado al código de alumno, la fecha de servicio y el turno seleccionado. La atomicidad de la operación se garantizará mediante transacciones de base de datos con bloqueo pesimista a nivel de fila, complementadas con un contador atómico en memoria para los escenarios de alta concurrencia. El sistema impedirá que un mismo estudiante disponga de más de un ticket activo para el mismo servicio en la misma fecha, conforme a la restricción de unicidad compuesta definida en los requerimientos detallados.

El requerimiento RF-07 dispone que el estudiante podrá cancelar voluntariamente un ticket activo hasta treinta minutos antes de la hora de inicio del turno reservado. La cancelación liberará inmediatamente el cupo para que pueda ser asignado a otro estudiante y registrará el evento en el historial del usuario sin incidencia negativa en su contador de faltas.

**Módulo de validación física en el comedor**

El requerimiento RF-08 establece que el operador del comedor contará con un panel de control mediante el cual validará la presencia de los estudiantes en el momento de su atención. La validación se realizará principalmente a través de un lector óptico que interpretará el código de barras presente en el reverso del carnet universitario emitido por la Superintendencia Nacional de Educación Superior Universitaria, extrayendo el código de alumno correspondiente. Como mecanismo de contingencia, el panel permitirá el ingreso manual del código de alumno o del documento nacional de identidad cuando la lectura óptica no sea factible.

El requerimiento RF-09 indica que la validación consistirá en la verificación de que el estudiante posea un ticket en estado reservado correspondiente al servicio y al turno actual. En caso afirmativo, el sistema cambiará el estado del ticket a "consumido" y registrará la marca temporal del evento. En caso negativo, el sistema presentará al operador un mensaje claro con la causa específica, entre las cuales se consideran la ausencia de reserva, la reserva para un turno distinto al actual, el consumo previo del ticket o la existencia de una sanción activa sobre el estudiante.

**Módulo administrativo**

El requerimiento RF-10 establece que el administrador del sistema podrá configurar dinámicamente los horarios de apertura de reservas de cada servicio, la definición de los turnos disponibles con sus respectivas horas de inicio y fin, la capacidad máxima de cada turno, los parámetros de la política de sanciones por inasistencia y los umbrales de la limitación de tasa de solicitudes. Toda modificación de configuración quedará registrada en una bitácora inmutable que asociará la acción a su autor, a la marca temporal y a los valores previos y nuevos, con fines de auditoría.

El requerimiento RF-11 señala que un administrador con privilegios diferenciados tendrá la potestad de anular una marca de inasistencia previamente registrada sobre un estudiante, siempre que la acción se acompañe de una justificación textual documentada. Esta funcionalidad es independiente de los roles operativos y del administrador de configuración, en concordancia con el principio de separación de responsabilidades (Saltzer & Schroeder, 1975).

El requerimiento RF-12 determina que el sistema pondrá a disposición del administrador un panel de métricas con información agregada sobre la cantidad de raciones consumidas, la distribución de la demanda por turno y por servicio, la tasa de inasistencia, los tiempos promedio de espera en la cola virtual y los picos de concurrencia observados. Estos indicadores servirán para la toma de decisiones sobre la capacidad del servicio y la redistribución de turnos.

### 3.1.2 Requisitos no funcionales

Los requisitos no funcionales describen las propiedades de calidad del sistema y las restricciones bajo las cuales los requerimientos funcionales deben satisfacerse. Para su especificación se adopta el modelo de calidad de producto software establecido por la norma ISO/IEC 25010:2011, que organiza las características de calidad en ocho dimensiones: adecuación funcional, eficiencia de desempeño, compatibilidad, usabilidad, fiabilidad, seguridad, mantenibilidad y portabilidad (International Organization for Standardization, 2011).

**Eficiencia de desempeño**

El requerimiento RNF-01 establece que el sistema deberá procesar un mínimo de doscientas solicitudes concurrentes de reserva por segundo durante la ventana de apertura de reservas sin degradación perceptible del tiempo de respuesta. Esta cifra se deriva de la estimación de una demanda pico de mil quinientos estudiantes intentando reservar simultáneamente dentro de los primeros cinco minutos posteriores a la apertura del servicio, valor consistente con los modelos de demanda concentrada descritos en los sistemas de boletería digital (Microsoft Corporation, 2023).

El requerimiento RNF-02 dispone que el tiempo de respuesta máximo observado en los endpoints críticos, entendidos como autenticación, consulta de turnos disponibles y confirmación de reserva, no excederá los quinientos milisegundos en el percentil noventa y cinco bajo la carga establecida en el requerimiento RNF-01. Los endpoints no críticos podrán presentar tiempos de respuesta de hasta mil doscientos milisegundos en el mismo percentil.

**Fiabilidad y disponibilidad**

El requerimiento RNF-03 fija la disponibilidad operativa del sistema en el noventa y nueve por ciento durante las franjas horarias de atención del comedor, entendidas como las ventanas comprendidas entre la apertura de reservas y el cierre del último turno de cada servicio. Fuera de dichas franjas, la indisponibilidad programada para mantenimiento está permitida y no afectará el cumplimiento del umbral.

El requerimiento RNF-04 establece que el sistema deberá recuperarse automáticamente de fallos transitorios del motor de cache y del servidor de base de datos, reintentando las operaciones críticas bajo una política de retroceso exponencial con un máximo de tres reintentos. En caso de fallo persistente de un componente, el sistema degradará su funcionalidad de forma controlada, priorizando la preservación de los tickets ya emitidos sobre la emisión de nuevos tickets.

**Seguridad**

El requerimiento RNF-05 señala que toda comunicación entre el cliente y el servidor deberá establecerse mediante el protocolo HTTPS con certificados válidos emitidos por una autoridad certificadora reconocida, utilizando únicamente versiones del protocolo TLS iguales o superiores a 1.2 (Rescorla, 2018). Las cabeceras de seguridad HTTP, que incluyen Strict-Transport-Security, Content-Security-Policy, X-Frame-Options y X-Content-Type-Options, serán configuradas en toda respuesta del servidor.

El requerimiento RNF-06 establece que las credenciales de autenticación se almacenarán exclusivamente mediante funciones de derivación de clave resistentes a ataques de fuerza bruta, con argon2id como algoritmo adoptado. El sistema registrará todo intento de autenticación fallido, activará un bloqueo temporal progresivo del usuario tras tres intentos consecutivos y exigirá la resolución de un desafío CAPTCHA tras el tercer intento. Los tokens de sesión se emitirán con vigencia reducida y serán rotados periódicamente para limitar la ventana de exposición en caso de robo.

El requerimiento RNF-07 indica que todas las consultas a la base de datos se ejecutarán mediante sentencias parametrizadas, eliminando la posibilidad de inyección SQL. Asimismo, todo dato proveniente del cliente se validará y sanitizará en el servidor antes de su procesamiento, de conformidad con la taxonomía de vulnerabilidades de aplicaciones web de OWASP (OWASP Foundation, 2021).

**Usabilidad**

El requerimiento RNF-08 establece que la interfaz de usuario se diseñará siguiendo los principios de diseño adaptable, soportando dispositivos con resoluciones desde 360 píxeles de ancho hasta resoluciones de escritorio, en consideración de que la población universitaria accede mayoritariamente desde teléfonos móviles. La interfaz cumplirá con el nivel de conformidad AA de las Pautas de Accesibilidad para el Contenido Web (W3C, 2018), garantizando el acceso a estudiantes con discapacidades visuales leves.

**Mantenibilidad y escalabilidad**

El requerimiento RNF-09 dispone que la arquitectura del sistema se diseñará con separación clara entre la capa de presentación, la capa de lógica de negocio y la capa de persistencia, permitiendo la evolución independiente de cada una. El código fuente se someterá a controles de calidad mediante análisis estático, cobertura mínima del setenta por ciento en pruebas unitarias y revisiones por pares registradas en el repositorio de control de versiones.

El requerimiento RNF-10 establece que el sistema se desplegará mediante contenedores que encapsulen la totalidad de sus dependencias, permitiendo su despliegue reproducible sobre cualquier infraestructura compatible con el estándar de Open Container Initiative. Esta elección facilita la escalabilidad horizontal al replicar instancias del servicio ante incrementos sostenidos de demanda.

### 3.1.3 Requisitos detallados

Los requisitos detallados, también denominados reglas de negocio, precisan las condiciones específicas que gobiernan el comportamiento del sistema en casos concretos, fijando los valores de los parámetros, las restricciones de los datos y las excepciones admisibles. La claridad de estas especificaciones reduce la ambigüedad durante la fase de codificación y facilita la redacción de las pruebas de verificación correspondientes (Sommerville, 2016).

**Reglas de validación de identidad**

El requerimiento RD-01 establece que el código de alumno debe respetar la estructura institucional de la Universidad Nacional de Ingeniería, compuesta por ocho caracteres alfanuméricos donde los seis primeros representan el año y el periodo de ingreso y los restantes el correlativo y la letra de control. Todo código que no cumpla esta estructura será rechazado durante el registro sin llegar a consultar la base de datos.

El requerimiento RD-02 determina que el correo institucional se validará mediante la coincidencia con el patrón textual compuesto por el primer nombre del estudiante, un punto, el primer apellido, un punto, la inicial del segundo apellido y el dominio uni.pe. Se normalizarán las tildes y los caracteres especiales, y se exigirá que los fragmentos nominales coincidan con los nombres declarados en el formulario de registro, impidiendo la combinación de una identidad nominal con un correo ajeno.

El requerimiento RD-03 dispone que el documento nacional de identidad se validará mediante la verificación del dígito de control calculado a partir de los ocho dígitos numéricos, conforme al algoritmo establecido por la autoridad registral peruana.

**Reglas de apertura y operación de servicios**

El requerimiento RD-04 fija que el sistema opera dos servicios diarios diferenciados, denominados almuerzo y cena. La ventana de reservas del almuerzo se abre a las seis horas del mismo día y se cierra cuando se agotan los cupos o cuando se cumple la hora de inicio del último turno. La ventana de reservas de la cena se abre a las catorce horas del mismo día bajo las mismas reglas de cierre. Estos horarios son parametrizables por el administrador, conforme al requerimiento RF-10.

El requerimiento RD-05 establece que el servicio de almuerzo, en su configuración inicial, consta de seis turnos de treinta minutos cada uno, con horas de inicio a las once con treinta minutos, doce, doce con treinta, trece, trece con treinta y catorce horas. Cada turno tiene una capacidad inicial de cincuenta cupos. El servicio de cena será configurado de manera análoga por el administrador durante la puesta en operación. Tanto la cantidad de turnos como los horarios y los cupos son ajustables por el administrador sin necesidad de modificar el código del sistema.

**Reglas de unicidad y consistencia**

El requerimiento RD-06 determina que un estudiante no podrá poseer más de un ticket en estado activo para el mismo servicio y la misma fecha. Esta restricción se implementará mediante una restricción de unicidad compuesta sobre los campos código de alumno, fecha y servicio. Un estudiante puede, en cambio, reservar un turno de almuerzo y otro de cena para el mismo día, dada la diferenciación del servicio.

El requerimiento RD-07 indica que el ciclo de vida de un ticket se modela como un autómata finito determinista conforme a lo expuesto en la sección 2.1.2 del marco teórico, con los estados reservado, consumido, cancelado, expirado y no asistido. Las únicas transiciones permitidas son reservado hacia consumido, reservado hacia cancelado, reservado hacia expirado y reservado hacia no asistido. Cualquier intento de transición no contemplada en el grafo será rechazado por la capa de lógica de negocio.

**Reglas de gestión de sanciones**

El requerimiento RD-08 establece que, al cierre de cada servicio, un proceso automatizado recorrerá los tickets en estado reservado cuya hora de fin ya haya transcurrido sin haber sido consumidos y los marcará como no asistidos. Este procedimiento liberará los cupos remanentes para el servicio del día siguiente y asentará el registro correspondiente en el historial de comportamiento del estudiante.

El requerimiento RD-09 fija el cómputo de inasistencias bajo una ventana deslizante de treinta días calendario. Cuando un estudiante acumula dos inasistencias en dicha ventana, el sistema emite una advertencia por correo institucional sin restricción operativa. Al alcanzar tres inasistencias en la misma ventana, el sistema aplica una suspensión automática de siete días calendario, durante los cuales el estudiante no podrá realizar reservas. Al alcanzar cinco inasistencias acumuladas desde el alta del estudiante, el sistema aplica una suspensión indefinida que solo puede ser levantada mediante una petición manual procesada por un administrador con el privilegio correspondiente.

El requerimiento RD-10 dispone que un administrador diferenciado del administrador de configuración podrá anular una marca de inasistencia existente siempre que registre una justificación textual con un mínimo de cincuenta caracteres. La anulación ajustará retroactivamente los contadores de sanciones del estudiante afectado.

**Reglas de control de concurrencia y protección del servicio**

El requerimiento RD-11 establece que la emisión de tickets se realizará bajo una transacción de base de datos con bloqueo a nivel de fila sobre el turno seleccionado, complementada con un contador atómico en memoria que regula la disponibilidad de cupos en tiempo constante. Esta estrategia combinada, fundamentada en la sección 2.1.3 del marco teórico, previene tanto la sobreemisión como el cuello de botella sobre la base de datos relacional (Silberschatz et al., 2019).

El requerimiento RD-12 fija los parámetros de la limitación de tasa de solicitudes en los siguientes valores iniciales: diez solicitudes por minuto en el endpoint de autenticación por cada dirección de red de origen, tres solicitudes por minuto en el endpoint de reserva por cada documento nacional de identidad y cien solicitudes por minuto en el conjunto total de endpoints por cada dirección de red de origen. El incumplimiento de estos umbrales activará un bloqueo de tiempo progresivo que se extiende desde un minuto hasta una hora conforme se repiten las infracciones.

El requerimiento RD-13 determina los tiempos de vida de los diferentes tokens empleados por el sistema. El enlace de verificación de registro tiene una vigencia de veinticuatro horas. El código de un solo uso enviado durante la autenticación caduca a los cinco minutos desde su emisión. El token de presencia en la cola virtual no tiene tiempo de caducidad fijo, pero exige una señal de actividad del cliente cada quince a veinte segundos; la ausencia de señales durante más de dos minutos genera la expulsión automática de la cola. El token de reserva, emitido al salir de la cola, tiene una vigencia de cinco minutos, transcurridos los cuales se revoca y el estudiante debe reingresar al sistema.

**Reglas de cancelación**

El requerimiento RD-14 establece que la cancelación voluntaria de un ticket activo se permite hasta treinta minutos antes de la hora de inicio del turno reservado. Después de este umbral, la cancelación queda deshabilitada y el sistema mostrará al estudiante la opción de contactar con el administrador si existiera causa justificada. Una cancelación dentro del plazo permitido no genera penalización en el contador de inasistencias.

### Cierre del bloque de requerimientos

El conjunto de requerimientos funcionales, no funcionales y detallados presentado en esta sección constituye la base sobre la cual se estructurará la fase de diseño. La trazabilidad entre los objetivos planteados en el capítulo IV, el marco teórico del capítulo II y los requerimientos aquí especificados garantiza la coherencia integral del proyecto. La siguiente fase, correspondiente al diseño del sistema, traducirá estos requerimientos en decisiones arquitectónicas concretas sobre el modelo de datos, la distribución de responsabilidades entre los componentes, el diseño de la interfaz y las pruebas de aceptación asociadas.
