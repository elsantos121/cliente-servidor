# language: es
Característica: Publicaciones
  Para compartir información con la comunidad
  Como estudiante
  Quiero crear, consultar, editar y eliminar mis publicaciones

  Antecedentes:
    Dado que no hay usuarios registrados
    Y que existe el administrador creado por el seed con correo "admin@uni.edu" y contraseña "admin12345"
    Y que existe un usuario registrado con correo "ana@uni.edu"
    Y que existe un usuario registrado con correo "beto@uni.edu"
    Y que existen las categorías "Matemática", "Programación"

  Escenario: Crear una publicación
    Dado que inicié sesión con correo "ana@uni.edu" y contraseña "secreta123"
    Cuando creo una publicación titulada "Ayuda con límites" con contenido "¿Alguien entiende L'Hôpital?" en la categoría "Matemática"
    Entonces la respuesta tiene código 201
    Y la respuesta incluye la publicación "Ayuda con límites" de "ana@uni.edu"

  Escenario: Listar publicaciones, las más recientes primero
    Dado que "ana@uni.edu" publicó "Primera" en la categoría "Matemática"
    Y que "beto@uni.edu" publicó "Segunda" en la categoría "Programación"
    Cuando consulto las publicaciones
    Entonces la respuesta tiene código 200
    Y las publicaciones listadas son "Segunda", "Primera"

  Escenario: Filtrar publicaciones por categoría
    Dado que "ana@uni.edu" publicó "Primera" en la categoría "Matemática"
    Y que "beto@uni.edu" publicó "Segunda" en la categoría "Programación"
    Cuando consulto las publicaciones de la categoría "Programación"
    Entonces las publicaciones listadas son "Segunda"

  Escenario: Ver el detalle de una publicación
    Dado que "ana@uni.edu" publicó "Primera" en la categoría "Matemática"
    Cuando consulto la publicación "Primera"
    Entonces la respuesta tiene código 200
    Y la respuesta incluye la publicación "Primera" de "ana@uni.edu"

  Escenario: Publicación inexistente
    Cuando consulto una publicación inexistente
    Entonces la respuesta tiene código 404

  Escenario: Título vacío
    Dado que inicié sesión con correo "ana@uni.edu" y contraseña "secreta123"
    Cuando creo una publicación titulada "" con contenido "Un contenido suficientemente largo" en la categoría "Matemática"
    Entonces la respuesta tiene código 400
    Y el error informa un problema en el campo "titulo"

  Escenario: Categoría inexistente
    Dado que inicié sesión con correo "ana@uni.edu" y contraseña "secreta123"
    Cuando creo una publicación en una categoría inexistente
    Entonces la respuesta tiene código 400
    Y el error informa un problema en el campo "categoriaId"

  Escenario: Crear sin iniciar sesión
    Cuando creo una publicación sin iniciar sesión
    Entonces la respuesta tiene código 401

  Escenario: Editar una publicación propia
    Dado que "ana@uni.edu" publicó "Primera" en la categoría "Matemática"
    Y que inicié sesión con correo "ana@uni.edu" y contraseña "secreta123"
    Cuando cambio el título de la publicación "Primera" por "Primera (editada)"
    Entonces la respuesta tiene código 200
    Y la respuesta incluye la publicación "Primera (editada)" de "ana@uni.edu"

  Escenario: Editar una publicación ajena
    Dado que "ana@uni.edu" publicó "Primera" en la categoría "Matemática"
    Y que inicié sesión con correo "beto@uni.edu" y contraseña "secreta123"
    Cuando cambio el título de la publicación "Primera" por "Te la edito"
    Entonces la respuesta tiene código 403

  Escenario: Eliminar una publicación propia
    Dado que "ana@uni.edu" publicó "Primera" en la categoría "Matemática"
    Y que inicié sesión con correo "ana@uni.edu" y contraseña "secreta123"
    Cuando elimino la publicación "Primera"
    Entonces la respuesta tiene código 204
    Y la publicación "Primera" ya no existe

  Escenario: Eliminar una publicación ajena
    Dado que "ana@uni.edu" publicó "Primera" en la categoría "Matemática"
    Y que inicié sesión con correo "beto@uni.edu" y contraseña "secreta123"
    Cuando elimino la publicación "Primera"
    Entonces la respuesta tiene código 403

  Escenario: El administrador elimina una publicación ajena
    Dado que "ana@uni.edu" publicó "Primera" en la categoría "Matemática"
    Y que inicié sesión con correo "admin@uni.edu" y contraseña "admin12345"
    Cuando elimino la publicación "Primera"
    Entonces la respuesta tiene código 204
