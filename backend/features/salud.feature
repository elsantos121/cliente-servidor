# language: es
Característica: Estado de la API
  Para saber que el entorno está bien configurado
  Como integrante del equipo
  Quiero comprobar que la API responde

  Escenario: La API está disponible
    Cuando consulto el estado de la API
    Entonces la respuesta tiene código 200
    Y el estado informado es "ok"

  Escenario: Ruta inexistente
    Cuando hago GET a "/api/no-existe"
    Entonces la respuesta tiene código 404
