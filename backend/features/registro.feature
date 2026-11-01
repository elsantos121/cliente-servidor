# language: es
Característica: Registro de estudiantes
  Para participar en el foro
  Como estudiante
  Quiero registrarme con mi nombre, correo y contraseña

  Antecedentes:
    Dado que no hay usuarios registrados

  Escenario: Registro exitoso con datos válidos
    Cuando me registro con nombre "Ana Pérez", correo "ana@uni.edu" y contraseña "secreta123"
    Entonces la respuesta tiene código 201
    Y la respuesta incluye un usuario con rol "ESTUDIANTE"
    Y la respuesta no incluye la contraseña ni su hash

  Escenario: Correo duplicado sin distinguir mayúsculas
    Dado que existe un usuario registrado con correo "Ana@uni.edu"
    Cuando me registro con nombre "Otra Ana", correo "ana@uni.edu" y contraseña "secreta123"
    Entonces la respuesta tiene código 409
    Y hay 1 usuario registrado con correo "ana@uni.edu"

  Esquema del escenario: Datos inválidos
    Cuando me registro con nombre "<nombre>", correo "<correo>" y contraseña "<contrasena>"
    Entonces la respuesta tiene código 400
    Y el error informa un problema en el campo "<campo>"

    Ejemplos:
      | nombre | correo       | contrasena | campo    |
      |        | ana@uni.edu  | secreta123 | nombre   |
      | Ana    | no-es-correo | secreta123 | email    |
      | Ana    | ana@uni.edu  | corta      | password |

  Escenario: Intento de escalar privilegios enviando el rol
    Cuando me registro con correo "ana@uni.edu" enviando el rol "ADMIN"
    Entonces la respuesta tiene código 201
    Y la respuesta incluye un usuario con rol "ESTUDIANTE"
