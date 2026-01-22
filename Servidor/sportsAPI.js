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
        "Ajax", "AS Roma", "Napoli", "Sevilla", "Lyon", 
        "Celtic",  "Everton", "Newcastle", "Aston Villa", 
        "Villarreal", "Real Sociedad", "Monaco", "Marseille", "Fiorentina", 
        "Schalke 04", "Werder Bremen", "Bayer Leverkusen", "Leeds United", "Leicester City"
    ];

    // Posiciones disponibles
    this.posiciones = ["Forward", "Midfielder", "Defender", "Goalkeeper"];

    // Nacionalidades populares para el juego
    this.nacionalidades = [
        "Argentina", "Brazil", "France", "Spain", "Germany", "Portugal", "England",
        "Italy", "Netherlands", "Belgium",  "Croatia",
        "Poland", "Serbia", "Sweden", "Denmark", "Wales", 
        "Chile", "Cameroon", "Senegal", 
    ];

    // Rangos de edad
    this.rangosEdad = [
        { tipo: "edad", texto: "Menor de 25", max: 25 },
        { tipo: "edad", texto: "Menor de 30", max: 30 },
        { tipo: "edad", texto: "Mayor de 30", min: 30 },
        { tipo: "edad", texto: "Mayor de 35", min: 35 }
    ];

    // Validar si un jugador cumple con una condición específica
    this.cumpleCondicion = function(jugador, condicion) {
        if (condicion.tipo === 'equipo') {
            return jugador.equipos.some(e => 
                e.toLowerCase().includes(condicion.valor.toLowerCase()) || 
                condicion.valor.toLowerCase().includes(e.toLowerCase())
            );
        } else if (condicion.tipo === 'posicion') {
            return jugador.posicion && jugador.posicion.toLowerCase() === condicion.valor.toLowerCase();
        } else if (condicion.tipo === 'nacionalidad') {
            return jugador.nacionalidad && jugador.nacionalidad.toLowerCase() === condicion.valor.toLowerCase();
        } else if (condicion.tipo === 'edad') {
            const añoActual = new Date().getFullYear();
            const edadJugador = añoActual - parseInt(jugador.nacimiento);
            
            if (condicion.min !== undefined && condicion.max !== undefined) {
                return edadJugador >= condicion.min && edadJugador < condicion.max;
            } else if (condicion.min !== undefined) {
                return edadJugador >= condicion.min;
            } else if (condicion.max !== undefined) {
                return edadJugador < condicion.max;
            }
        }
        return false;
    };

    // Validar si un jugador cumple con los criterios (condicion1 Y condicion2)
    this.validarJugador = function(nombreJugador, condicion1, condicion2) {
        const jugador = this.jugadoresPopulares.find(j => 
            j.nombreCompleto && j.nombreCompleto.toLowerCase() === nombreJugador.toLowerCase()
        );
        
        if (!jugador) {
            return { valido: false, motivo: "Jugador no encontrado" };
        }

        const cumple1 = this.cumpleCondicion(jugador, condicion1);
        const cumple2 = this.cumpleCondicion(jugador, condicion2);

        if (cumple1 && cumple2) {
            return { valido: true, jugador: jugador };
        }

        return { 
            valido: false, 
            motivo: `${nombreJugador} no cumple ambas condiciones` 
        };
    };

    // Verificar si existe al menos un jugador que cumpla ambas condiciones
    this.existeJugadorParaCelda = function(condicion1, condicion2) {
        return this.jugadoresPopulares.some(jugador => 
            this.cumpleCondicion(jugador, condicion1) && this.cumpleCondicion(jugador, condicion2)
        );
    };

    // Verificar si todas las 9 celdas del grid tienen al menos un jugador válido
    this.validarGrid = function(condicionesFilas, condicionesColumnas) {
        for (let fila = 0; fila < 3; fila++) {
            for (let col = 0; col < 3; col++) {
                if (!this.existeJugadorParaCelda(condicionesFilas[fila], condicionesColumnas[col])) {
                    return false;
                }
            }
        }
        return true;
    };

    // Generar grid aleatorio con condiciones variadas (validando que existan jugadores)
    this.generarGridAleatorio = function() {
        const self = this;
        const maxIntentos = 100;
        
        // Función auxiliar para seleccionar elementos únicos
        const seleccionarUnicos = (array, cantidad) => {
            const disponibles = [...array];
            const seleccionados = [];
            while (seleccionados.length < cantidad && disponibles.length > 0) {
                const idx = Math.floor(Math.random() * disponibles.length);
                seleccionados.push(disponibles.splice(idx, 1)[0]);
            }
            return seleccionados;
        };

        // Tipos de grid disponibles con sus generadores
        const tiposGrid = [
            { peso: 40, generar: () => {
                const equipos = seleccionarUnicos(self.equiposPopulares, 6);
                return {
                    filas: equipos.slice(0, 3).map(e => ({ tipo: 'equipo', valor: e, texto: e })),
                    columnas: equipos.slice(3, 6).map(e => ({ tipo: 'equipo', valor: e, texto: e }))
                };
            }},
            { peso: 15, generar: () => {
                const equipos = seleccionarUnicos(self.equiposPopulares, 3);
                const paises = seleccionarUnicos(self.nacionalidades, 3);
                return {
                    filas: equipos.map(e => ({ tipo: 'equipo', valor: e, texto: e })),
                    columnas: paises.map(p => ({ tipo: 'nacionalidad', valor: p, texto: p }))
                };
            }},
            { peso: 15, generar: () => {
                const paises = seleccionarUnicos(self.nacionalidades, 3);
                const equipos = seleccionarUnicos(self.equiposPopulares, 3);
                return {
                    filas: paises.map(p => ({ tipo: 'nacionalidad', valor: p, texto: p })),
                    columnas: equipos.map(e => ({ tipo: 'equipo', valor: e, texto: e }))
                };
            }},
            { peso: 10, generar: () => {
                const equipos = seleccionarUnicos(self.equiposPopulares, 3);
                const posiciones = seleccionarUnicos(self.posiciones, 3);
                return {
                    filas: equipos.map(e => ({ tipo: 'equipo', valor: e, texto: e })),
                    columnas: posiciones.map(p => ({ tipo: 'posicion', valor: p, texto: p }))
                };
            }},
            { peso: 10, generar: () => {
                const posiciones = seleccionarUnicos(self.posiciones, 3);
                const equipos = seleccionarUnicos(self.equiposPopulares, 3);
                return {
                    filas: posiciones.map(p => ({ tipo: 'posicion', valor: p, texto: p })),
                    columnas: equipos.map(e => ({ tipo: 'equipo', valor: e, texto: e }))
                };
            }},
            { peso: 5, generar: () => {
                const paises = seleccionarUnicos(self.nacionalidades, 3);
                const posiciones = seleccionarUnicos(self.posiciones, 3);
                return {
                    filas: paises.map(p => ({ tipo: 'nacionalidad', valor: p, texto: p })),
                    columnas: posiciones.map(pos => ({ tipo: 'posicion', valor: pos, texto: pos }))
                };
            }},
            { peso: 5, generar: () => {
                const equipos = seleccionarUnicos(self.equiposPopulares, 3);
                const edades = seleccionarUnicos(self.rangosEdad, 3);
                return {
                    filas: equipos.map(e => ({ tipo: 'equipo', valor: e, texto: e })),
                    columnas: edades.map(ed => ({ tipo: 'edad', texto: ed.texto, min: ed.min, max: ed.max }))
                };
            }}
        ];

        // Seleccionar tipo de grid según peso
        const seleccionarTipoGrid = () => {
            const totalPeso = tiposGrid.reduce((sum, t) => sum + t.peso, 0);
            let rand = Math.random() * totalPeso;
            for (const tipo of tiposGrid) {
                rand -= tipo.peso;
                if (rand <= 0) return tipo;
            }
            return tiposGrid[0];
        };

        // Intentar generar un grid válido
        for (let intento = 0; intento < maxIntentos; intento++) {
            const tipoSeleccionado = seleccionarTipoGrid();
            const { filas, columnas } = tipoSeleccionado.generar();
            
            if (this.validarGrid(filas, columnas)) {
                return {
                    condicionesFilas: filas,
                    condicionesColumnas: columnas
                };
            }
        }

        // Fallback: grid seguro solo con equipos grandes
        console.log('⚠️ No se encontró grid válido, usando fallback con equipos grandes');
        const equiposGrandes = ["FC Barcelona", "Real Madrid", "Manchester United", "Manchester City", "Liverpool", "Chelsea"];
        return {
            condicionesFilas: equiposGrandes.slice(0, 3).map(e => ({ tipo: 'equipo', valor: e, texto: e })),
            condicionesColumnas: equiposGrandes.slice(3, 6).map(e => ({ tipo: 'equipo', valor: e, texto: e }))
        };
    };
}

module.exports.SportsAPI = SportsAPI;
