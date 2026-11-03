# language: es
Característica: Historial de moderación y borrado lógico
  Para auditar las decisiones de moderación y conservar evidencia
  Como administrador
  Quiero consultar los eventos y retirar publicaciones sin destruir sus datos

  Antecedentes:
    Dado que no hay usuarios registrados
    Y que existe el administrador creado por el seed con correo "admin@uni.edu" y contraseña "admin12345"
    Y que existe un usuario registrado con correo "ana@uni.edu"
    Y que existe un usuario registrado con correo "beto@uni.edu"
    Y que existen las categorías "Matemática"
    Y que "ana@uni.edu" publicó "Publicación dudosa" en la categoría "Matemática"
    Y que "beto@uni.edu" denunció "Publicación dudosa" con el motivo "Contenido ofensivo"

  Escenario: Registra y filtra las acciones en orden cronológico inverso
    Dado que inicié sesión con correo "admin@uni.edu" y contraseña "admin12345"
    Cuando cambio la visibilidad de "Publicación dudosa" a "oculta"
    Entonces la respuesta tiene código 200
    Cuando cambio la visibilidad de "Publicación dudosa" a "visible"
    Entonces la respuesta tiene código 200
    Cuando cambio el estado del reporte de "Publicación dudosa" a "DESCARTADO"
    Entonces la respuesta tiene código 200
    Cuando consulto el historial de la publicación "Publicación dudosa"
    Entonces la respuesta tiene código 200
    Y el historial registra las acciones "REPORTE_DESCARTADO,PUBLICACION_RESTAURADA,PUBLICACION_OCULTADA" en ese orden

  Escenario: Eliminar conserva publicación, comentarios y reportes y los oculta del público
    Dado que inicié sesión con correo "beto@uni.edu" y contraseña "secreta123"
    Cuando comento "La publicación tiene contexto importante." en la publicación "Publicación dudosa"
    Entonces la respuesta tiene código 201
    Dado que inicié sesión con correo "admin@uni.edu" y contraseña "admin12345"
    Cuando elimino la publicación "Publicación dudosa"
    Entonces la respuesta tiene código 204
    Y la publicación "Publicación dudosa" está eliminada lógicamente conservando comentarios y reportes
    Cuando consulto la publicación "Publicación dudosa"
    Entonces la respuesta tiene código 404
    Cuando consulto las publicaciones
    Entonces no se lista ninguna publicación
    Cuando consulto los comentarios de la publicación "Publicación dudosa"
    Entonces la respuesta tiene código 404
    Cuando comento "No debería estar disponible." en la publicación "Publicación dudosa"
    Entonces la respuesta tiene código 404
    Cuando denuncio la publicación "Publicación dudosa" con el motivo "Contenido ofensivo"
    Entonces la respuesta tiene código 404
    Cuando consulto el historial de la publicación "Publicación dudosa"
    Entonces el historial registra las acciones "PUBLICACION_ELIMINADA" en ese orden

  Escenario: Solo ADMIN puede consultar el historial
    Cuando consulto el historial sin iniciar sesión
    Entonces la respuesta tiene código 401
    Dado que inicié sesión con correo "beto@uni.edu" y contraseña "secreta123"
    Cuando consulto el historial
    Entonces la respuesta tiene código 403
