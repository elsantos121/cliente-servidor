# language: es
Característica: Votar publicaciones y comentarios
  Para reconocer el contenido útil
  Como usuario del foro
  Quiero votar publicaciones y comentarios

  Antecedentes:
    Dado que no hay usuarios registrados
    Y que existe el administrador creado por el seed con correo "admin@uni.edu" y contraseña "admin12345"
    Y que existe un usuario registrado con correo "ana@uni.edu"
    Y que existe un usuario registrado con correo "beto@uni.edu"
    Y que existen las categorías "Matemática"
    Y que "ana@uni.edu" publicó "Ayuda con límites" en la categoría "Matemática"

  Escenario: Un estudiante vota una publicación
    Dado que inicié sesión con correo "beto@uni.edu" y contraseña "secreta123"
    Cuando voto "POSITIVO" en la publicación "Ayuda con límites"
    Entonces la respuesta tiene código 200
    Y el voto de "beto@uni.edu" en "Ayuda con límites" es "POSITIVO"

  Escenario: El autor no puede votar su publicación
    Dado que inicié sesión con correo "ana@uni.edu" y contraseña "secreta123"
    Cuando voto "POSITIVO" en la publicación "Ayuda con límites"
    Entonces la respuesta tiene código 403

  Escenario: Un visitante no puede votar
    Cuando voto "NEGATIVO" en la publicación "Ayuda con límites" sin iniciar sesión
    Entonces la respuesta tiene código 401

  Escenario: Un estudiante vota un comentario
    Dado que "ana@uni.edu" comentó "Probá con L’Hôpital." en "Ayuda con límites"
    Y que inicié sesión con correo "beto@uni.edu" y contraseña "secreta123"
    Cuando voto "POSITIVO" en el comentario de "Ayuda con límites"
    Entonces la respuesta tiene código 200
    Y el comentario de "Ayuda con límites" tiene 1 voto positivo y 0 negativos
