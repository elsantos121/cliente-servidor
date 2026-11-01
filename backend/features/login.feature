# language: es
Característica: Inicio de sesión
  Para acceder a las funciones autorizadas según mi rol
  Como usuario registrado
  Quiero iniciar sesión con mi correo y contraseña

  Antecedentes:
    Dado que no hay usuarios registrados
    Y que existe un usuario registrado con correo "ana@uni.edu"

  Escenario: Login de un estudiante con credenciales válidas
    Cuando inicio sesión con correo "ana@uni.edu" y contraseña "secreta123"
    Entonces la respuesta tiene código 200
    Y recibo un token de acceso
    Y la respuesta incluye un usuario con rol "ESTUDIANTE"
    Y la respuesta no incluye la contraseña ni su hash

  Escenario: Login del administrador creado por el seed
    Dado que existe el administrador creado por el seed con correo "admin@uni.edu" y contraseña "admin12345"
    Cuando inicio sesión con correo "admin@uni.edu" y contraseña "admin12345"
    Entonces la respuesta tiene código 200
    Y la respuesta incluye un usuario con rol "ADMIN"

  Escenario: Contraseña incorrecta
    Cuando inicio sesión con correo "ana@uni.edu" y contraseña "incorrecta"
    Entonces la respuesta tiene código 401
    Y el mensaje de error es "Correo o contraseña incorrectos"

  Escenario: Correo inexistente
    Cuando inicio sesión con correo "nadie@uni.edu" y contraseña "secreta123"
    Entonces la respuesta tiene código 401
    Y el mensaje de error es "Correo o contraseña incorrectos"

  Escenario: Consultar mis datos con la sesión iniciada
    Dado que inicié sesión con correo "ana@uni.edu" y contraseña "secreta123"
    Cuando consulto mis datos de usuario
    Entonces la respuesta tiene código 200
    Y la respuesta incluye un usuario con rol "ESTUDIANTE"

  Escenario: Consultar mis datos sin token
    Cuando consulto mis datos de usuario sin token
    Entonces la respuesta tiene código 401

  Escenario: Token alterado
    Dado que inicié sesión con correo "ana@uni.edu" y contraseña "secreta123"
    Cuando consulto mis datos de usuario con el token alterado
    Entonces la respuesta tiene código 401
