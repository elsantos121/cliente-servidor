# language: es
# Fase 4 · Integración: recorre todas las historias en orden contra la API real y la base de pruebas.
# Usa solo pasos que ya existen; si una historia se rompe por un cambio en otra, este escenario falla.
Característica: Flujo completo del foro
  Para comprobar que las historias funcionan juntas
  Como equipo
  Queremos recorrer el circuito completo: registro, publicación, comentario, denuncia y moderación

  Escenario: De la registración a la moderación
    Dado que no hay usuarios registrados
    Y que existe el administrador creado por el seed con correo "admin@uni.edu" y contraseña "admin12345"

    # HU-06a · el administrador prepara las categorías
    Y que inicié sesión con correo "admin@uni.edu" y contraseña "admin12345"
    Cuando creo la categoría "Programación"
    Entonces la respuesta tiene código 201

    # HU-01 y HU-02 · dos estudiantes se registran
    Cuando me registro con nombre "Ana Pérez", correo "ana@uni.edu" y contraseña "secreta123"
    Entonces la respuesta tiene código 201
    Cuando me registro con nombre "Beto Gómez", correo "beto@uni.edu" y contraseña "secreta123"
    Entonces la respuesta tiene código 201

    # HU-03 · Ana publica
    Dado que inicié sesión con correo "ana@uni.edu" y contraseña "secreta123"
    Cuando creo una publicación titulada "Oferta de apuntes" con contenido "Vendo apuntes de Programación I, escribime." en la categoría "Programación"
    Entonces la respuesta tiene código 201
    Cuando consulto las publicaciones
    Entonces las publicaciones listadas son "Oferta de apuntes"

    # HU-04 y HU-05 · Beto comenta y denuncia
    Dado que inicié sesión con correo "beto@uni.edu" y contraseña "secreta123"
    Cuando comento "¿No es contra las reglas vender apuntes?" en la publicación "Oferta de apuntes"
    Entonces la respuesta tiene código 201
    Cuando denuncio la publicación "Oferta de apuntes" con el motivo "Venta de material, prohibida por las reglas"
    Entonces la respuesta tiene código 201

    # Un estudiante no puede moderar
    Cuando consulto los reportes
    Entonces la respuesta tiene código 403

    # HU-06b · el administrador modera y elimina la publicación
    Dado que inicié sesión con correo "admin@uni.edu" y contraseña "admin12345"
    Cuando consulto los reportes
    Entonces los reportes listados son de "Oferta de apuntes" con el motivo "Venta de material, prohibida por las reglas" y estado "PENDIENTE"
    Cuando elimino la publicación "Oferta de apuntes"
    Entonces la respuesta tiene código 204
    Y la publicación "Oferta de apuntes" ya no existe
    Y no hay reportes pendientes
    Cuando consulto las publicaciones
    Entonces no se lista ninguna publicación
