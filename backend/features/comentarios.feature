# language: es
Característica: Comentarios
  Para participar en las conversaciones
  Como estudiante
  Quiero comentar publicaciones

  Antecedentes:
    Dado que no hay usuarios registrados
    Y que existe un usuario registrado con correo "ana@uni.edu"
    Y que existe un usuario registrado con correo "beto@uni.edu"
    Y que existen las categorías "Matemática"
    Y que "ana@uni.edu" publicó "Ayuda con límites" en la categoría "Matemática"

  Escenario: Comentar una publicación
    Dado que inicié sesión con correo "beto@uni.edu" y contraseña "secreta123"
    Cuando comento "Probá con L'Hôpital" en la publicación "Ayuda con límites"
    Entonces la respuesta tiene código 201
    Y la respuesta incluye el comentario "Probá con L'Hôpital" de "beto@uni.edu"

  Escenario: Listar los comentarios, los más antiguos primero
    Dado que "beto@uni.edu" comentó "Primero" en la publicación "Ayuda con límites"
    Y que "ana@uni.edu" comentó "Segundo" en la publicación "Ayuda con límites"
    Cuando consulto los comentarios de la publicación "Ayuda con límites"
    Entonces la respuesta tiene código 200
    Y los comentarios listados son "Primero", "Segundo"

  Escenario: Comentario vacío
    Dado que inicié sesión con correo "beto@uni.edu" y contraseña "secreta123"
    Cuando comento "" en la publicación "Ayuda con límites"
    Entonces la respuesta tiene código 400
    Y el error informa un problema en el campo "contenido"

  Escenario: Comentar una publicación inexistente
    Dado que inicié sesión con correo "beto@uni.edu" y contraseña "secreta123"
    Cuando comento "Hola" en una publicación inexistente
    Entonces la respuesta tiene código 404

  Escenario: Listar comentarios de una publicación inexistente
    Cuando consulto los comentarios de una publicación inexistente
    Entonces la respuesta tiene código 404

  Escenario: Comentar sin iniciar sesión
    Cuando comento "Hola" en la publicación "Ayuda con límites" sin iniciar sesión
    Entonces la respuesta tiene código 401
