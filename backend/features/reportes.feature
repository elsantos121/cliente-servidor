# language: es
Característica: Denuncia de publicaciones
  Para informar contenido inapropiado
  Como estudiante
  Quiero denunciar una publicación

  Antecedentes:
    Dado que no hay usuarios registrados
    Y que existe un usuario registrado con correo "ana@uni.edu"
    Y que existe un usuario registrado con correo "beto@uni.edu"
    Y que existen las categorías "Matemática"
    Y que "ana@uni.edu" publicó "Publicación dudosa" en la categoría "Matemática"

  Escenario: Denunciar una publicación
    Dado que inicié sesión con correo "beto@uni.edu" y contraseña "secreta123"
    Cuando denuncio la publicación "Publicación dudosa" con el motivo "Contenido ofensivo"
    Entonces la respuesta tiene código 201
    Y la denuncia queda en estado "PENDIENTE" con el motivo "Contenido ofensivo" de "beto@uni.edu"

  Escenario: Denunciar dos veces la misma publicación
    Dado que inicié sesión con correo "beto@uni.edu" y contraseña "secreta123"
    Y que denuncié la publicación "Publicación dudosa" con el motivo "Contenido ofensivo"
    Cuando denuncio la publicación "Publicación dudosa" con el motivo "Sigue siendo ofensivo"
    Entonces la respuesta tiene código 409
    Y hay 1 denuncia de la publicación "Publicación dudosa"

  Escenario: Denunciar una publicación inexistente
    Dado que inicié sesión con correo "beto@uni.edu" y contraseña "secreta123"
    Cuando denuncio una publicación inexistente con el motivo "Contenido ofensivo"
    Entonces la respuesta tiene código 404

  Escenario: Motivo vacío
    Dado que inicié sesión con correo "beto@uni.edu" y contraseña "secreta123"
    Cuando denuncio la publicación "Publicación dudosa" con el motivo ""
    Entonces la respuesta tiene código 400
    Y el error informa un problema en el campo "motivo"

  Escenario: Denunciar sin iniciar sesión
    Cuando denuncio la publicación "Publicación dudosa" sin iniciar sesión
    Entonces la respuesta tiene código 401
