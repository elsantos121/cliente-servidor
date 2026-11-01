# language: es
Característica: Gestión de categorías
  Para mantener organizado el foro
  Como administrador
  Quiero crear categorías que cualquiera pueda consultar

  Antecedentes:
    Dado que no hay usuarios registrados
    Y que existe el administrador creado por el seed con correo "admin@uni.edu" y contraseña "admin12345"
    Y que existe un usuario registrado con correo "ana@uni.edu"

  Escenario: El administrador crea una categoría
    Dado que inicié sesión con correo "admin@uni.edu" y contraseña "admin12345"
    Cuando creo la categoría "Matemática"
    Entonces la respuesta tiene código 201
    Y la respuesta incluye la categoría "Matemática"

  Escenario: Cualquier visitante lista las categorías
    Dado que existen las categorías "Programación", "Matemática"
    Cuando consulto las categorías sin iniciar sesión
    Entonces la respuesta tiene código 200
    Y las categorías listadas son "Matemática", "Programación"

  Escenario: Nombre duplicado sin distinguir mayúsculas
    Dado que existen las categorías "Matemática"
    Y que inicié sesión con correo "admin@uni.edu" y contraseña "admin12345"
    Cuando creo la categoría "matemática"
    Entonces la respuesta tiene código 409

  Escenario: Nombre vacío
    Dado que inicié sesión con correo "admin@uni.edu" y contraseña "admin12345"
    Cuando creo la categoría ""
    Entonces la respuesta tiene código 400
    Y el error informa un problema en el campo "nombre"

  Escenario: Un estudiante intenta crear una categoría
    Dado que inicié sesión con correo "ana@uni.edu" y contraseña "secreta123"
    Cuando creo la categoría "Física"
    Entonces la respuesta tiene código 403

  Escenario: Crear una categoría sin iniciar sesión
    Cuando creo la categoría "Física" sin iniciar sesión
    Entonces la respuesta tiene código 401
