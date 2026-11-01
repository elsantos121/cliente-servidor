# language: es
Característica: Moderación de reportes
  Para mantener el foro en orden
  Como administrador
  Quiero revisar los reportes pendientes y eliminar publicaciones denunciadas

  Antecedentes:
    Dado que no hay usuarios registrados
    Y que existe el administrador creado por el seed con correo "admin@uni.edu" y contraseña "admin12345"
    Y que existe un usuario registrado con correo "ana@uni.edu"
    Y que existe un usuario registrado con correo "beto@uni.edu"
    Y que existen las categorías "Matemática"
    Y que "ana@uni.edu" publicó "Publicación dudosa" en la categoría "Matemática"
    Y que "beto@uni.edu" denunció "Publicación dudosa" con el motivo "Contenido ofensivo"

  Escenario: El administrador lista los reportes pendientes
    Dado que inicié sesión con correo "admin@uni.edu" y contraseña "admin12345"
    Cuando consulto los reportes
    Entonces la respuesta tiene código 200
    Y los reportes listados son de "Publicación dudosa" con el motivo "Contenido ofensivo" y estado "PENDIENTE"

  Escenario: El administrador descarta un reporte
    Dado que inicié sesión con correo "admin@uni.edu" y contraseña "admin12345"
    Cuando cambio el estado del reporte de "Publicación dudosa" a "DESCARTADO"
    Entonces la respuesta tiene código 200
    Y el reporte de "Publicación dudosa" queda en estado "DESCARTADO"
    Y no hay reportes pendientes

  Escenario: El administrador elimina la publicación denunciada
    Dado que inicié sesión con correo "admin@uni.edu" y contraseña "admin12345"
    Cuando elimino la publicación "Publicación dudosa"
    Entonces la respuesta tiene código 204
    Y la publicación "Publicación dudosa" ya no existe
    Y no hay reportes pendientes

  Escenario: Estado inválido
    Dado que inicié sesión con correo "admin@uni.edu" y contraseña "admin12345"
    Cuando cambio el estado del reporte de "Publicación dudosa" a "BORRADO"
    Entonces la respuesta tiene código 400
    Y el error informa un problema en el campo "estado"

  Escenario: Reporte inexistente
    Dado que inicié sesión con correo "admin@uni.edu" y contraseña "admin12345"
    Cuando cambio el estado de un reporte inexistente a "RESUELTO"
    Entonces la respuesta tiene código 404

  Escenario: Un estudiante intenta ver los reportes
    Dado que inicié sesión con correo "beto@uni.edu" y contraseña "secreta123"
    Cuando consulto los reportes
    Entonces la respuesta tiene código 403

  Escenario: Un estudiante intenta cambiar un reporte
    Dado que inicié sesión con correo "beto@uni.edu" y contraseña "secreta123"
    Cuando cambio el estado del reporte de "Publicación dudosa" a "DESCARTADO"
    Entonces la respuesta tiene código 403
