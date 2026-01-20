// API de TheSportsDB para obtener datos de futbolistas
const fs = require('fs');
const path = require('path');

// Cargar jugadores desde JSON
const jugadoresPath = path.join(__dirname, 'jugadores.json');
let jugadoresDB = [];

try {
    const data = fs.readFileSync(jugadoresPath, 'utf8');
    jugadoresDB = JSON.parse(data);
    console.log(`✓ Cargados ${jugadoresDB.length} jugadores desde jugadores.json`);
} catch (error) {
    console.error('Error cargando jugadores.json:', error.message);
    jugadoresDB = [];
}

function SportsAPI() {
    // Cache de datos populares para el juego
    this.jugadoresPopulares = jugadoresDB;

    // Equipos populares para el juego
    this.equiposPopulares = [
        "FC Barcelona", "Real Madrid", "Manchester United", "Manchester City", 
        "Liverpool", "Chelsea", "Arsenal", "Tottenham", "PSG", "Bayern Munich",
        "Borussia Dortmund", "Juventus", "AC Milan", "Inter Milan", "Atletico Madrid", "Valencia",
        "Ajax", "AS Roma", "Napoli", "Sevilla", "Lyon", "Porto", "Benfica", "Sporting CP",
        "Celtic", "Southampton", "West Ham", "Everton", "Newcastle", "Aston Villa", 
        "Villarreal", "Real Sociedad", "Monaco", "Marseille", "Fiorentina", "Lazio",
        "Schalke 04", "Werder Bremen", "Bayer Leverkusen", "Leeds United", "Leicester City"
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

module.exports.SportsAPI = SportsAPI;
