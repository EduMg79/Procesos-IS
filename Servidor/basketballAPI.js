// API de NBA para obtener datos de jugadores de baloncesto
const fs = require('fs');
const path = require('path');

// Cargar jugadores desde JSON
const jugadoresPath = path.join(__dirname, 'jugadoresNBA.json');
let jugadoresDB = [];

try {
    const data = fs.readFileSync(jugadoresPath, 'utf8');
    jugadoresDB = JSON.parse(data);
    console.log(`✓ Cargados ${jugadoresDB.length} jugadores de NBA desde jugadoresNBA.json`);
} catch (error) {
    console.error('Error cargando jugadoresNBA.json:', error.message);
    jugadoresDB = [];
}

function BasketballAPI() {
    // Cache de datos populares para el juego
    this.jugadoresPopulares = jugadoresDB;

    // Equipos populares de la NBA para el juego
    this.equiposPopulares = [
        "Los Angeles Lakers", "Boston Celtics", "Chicago Bulls", "Golden State Warriors",
        "Miami Heat", "San Antonio Spurs", "Cleveland Cavaliers", "Dallas Mavericks",
        "Phoenix Suns", "Brooklyn Nets", "New York Knicks", "Houston Rockets",
        "Philadelphia 76ers", "Milwaukee Bucks", "Toronto Raptors", "Oklahoma City Thunder",
        "Denver Nuggets", "Portland Trail Blazers", "Utah Jazz", "Memphis Grizzlies",
        "Atlanta Hawks", "Washington Wizards", "Detroit Pistons", "Orlando Magic",
        "Indiana Pacers", "Sacramento Kings", "Minnesota Timberwolves", "Los Angeles Clippers",
        "New Orleans Pelicans", "Charlotte Hornets", "Seattle SuperSonics", "New Jersey Nets"
    ];

    // Validar si un jugador cumple con los criterios (equipo1 Y equipo2)
    this.validarJugador = function(nombreJugador, equipo1, equipo2) {
        const jugador = this.jugadoresPopulares.find(j => 
            j.nombreCompleto && j.nombreCompleto.toLowerCase() === nombreJugador.toLowerCase()
        );
        
        if (!jugador) {
            return { valido: false, motivo: "Jugador no encontrado" };
        }

        const jugóEnEquipo1 = jugador.equipos.some(e => 
            e.toLowerCase().includes(equipo1.toLowerCase()) || 
            equipo1.toLowerCase().includes(e.toLowerCase())
        );
        
        const jugóEnEquipo2 = jugador.equipos.some(e => 
            e.toLowerCase().includes(equipo2.toLowerCase()) || 
            equipo2.toLowerCase().includes(e.toLowerCase())
        );

        if (jugóEnEquipo1 && jugóEnEquipo2) {
            return { valido: true, jugador: jugador };
        }

        return { 
            valido: false, 
            motivo: `${nombreJugador} no jugó en ambos equipos` 
        };
    };

    // Generar grid aleatorio de equipos
    this.generarGridAleatorio = function() {
        const equiposAleatorios = [...this.equiposPopulares]
            .sort(() => Math.random() - 0.5)
            .slice(0, 6);

        return {
            equiposFilas: equiposAleatorios.slice(0, 3),
            equiposColumnas: equiposAleatorios.slice(3, 6)
        };
    };
}

module.exports.BasketballAPI = BasketballAPI;
