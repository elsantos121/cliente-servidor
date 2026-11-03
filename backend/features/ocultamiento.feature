# language: es
Característica: Ocultar publicaciones durante la revisión
  Para evitar que contenido dudoso siga visible
  Como administrador
  Quiero ocultar y restaurar publicaciones denunciadas

  Antecedentes:
    Dado que no hay usuarios registrados
    Y que existe el administrador creado por el seed con correo "admin@uni.edu" y contraseña "admin12345"
    Y que existe un usuario registrado con correo "ana@uni.edu"
    Y que existe un usuario registrado con correo "beto@uni.edu"
    Y que existen las categorías "Matemática"
    Y que "ana@uni.edu" publicó "Publicación dudosa" en la categoría "Matemática"
    Y que "beto@uni.edu" denunció "Publicación dudosa" con el motivo "Contenido ofensivo"

  Escenario: El administrador oculta una publicación denunciada
    Dado que inicié sesión con correo "admin@uni.edu" y contraseña "admin12345"
    Cuando cambio la visibilidad de "Publicación dudosa" a "oculta"
    Entonces la respuesta tiene código 200
    Y la publicación "Publicación dudosa" está oculta en el reporte
    Cuando consulto las publicaciones
    Entonces no se lista ninguna publicación
    Cuando consulto la publicación "Publicación dudosa"
    Entonces la respuesta tiene código 404

  Escenario: El administrador restaura una publicación
    Dado que inicié sesión con correo "admin@uni.edu" y contraseña "admin12345"
    Cuando cambio la visibilidad de "Publicación dudosa" a "oculta"
    Entonces la respuesta tiene código 200
    Cuando cambio la visibilidad de "Publicación dudosa" a "visible"
    Entonces la respuesta tiene código 200
    Cuando consulto la publicación "Publicación dudosa"
    Entonces la respuesta tiene código 200

  Escenario: Un estudiante no puede cambiar la visibilidad
    Dado que inicié sesión con correo "beto@uni.edu" y contraseña "secreta123"
    Cuando cambio la visibilidad de "Publicación dudosa" a "oculta"
    Entonces la respuesta tiene código 403

  Escenario: Una publicación oculta no admite comentarios ni nuevas denuncias
    Dado que inicié sesión con correo "admin@uni.edu" y contraseña "admin12345"
    Cuando cambio la visibilidad de "Publicación dudosa" a "oculta"
    Entonces la respuesta tiene código 200
    Dado que inicié sesión con correo "beto@uni.edu" y contraseña "secreta123"
    Cuando comento "¿Puedo comentar?" en la publicación "Publicación dudosa"
    Entonces la respuesta tiene código 404
    Cuando denuncio la publicación "Publicación dudosa" con el motivo "Contenido ofensivo"
    Entonces la respuesta tiene código 404

  Escenario: Sin sesión no se puede ocultar una publicación
    Cuando cambio la visibilidad de "Publicación dudosa" a "oculta" sin iniciar sesión
    Entonces la respuesta tiene código 401
