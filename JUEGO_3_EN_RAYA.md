# 🎮 Juego 3 en Raya - Características

## 📋 Resumen

Se ha implementado un **juego de 3 en raya multijugador en tiempo real** con múltiples tamaños de tablero, una interfaz completamente renovada, y **modo contra Inteligencia Artificial con 3 niveles de dificultad**.

## ✨ Características Principales

### 🎯 Múltiples Modos de Tablero
- **3x3** - Clásico (modo estándar)
- **4x4** - Intermedio (más desafío)
- **5x5** - Avanzado (máxima estrategia)

### 🎮 Dos Modos de Juego

#### 👥 Modo Multijugador
- Juega contra otro jugador en tiempo real
- Crea una partida y espera a que otro jugador se una
- Lista de partidas disponibles
- Sincronización en tiempo real

#### 🤖 Modo vs Inteligencia Artificial
- **Fácil**: La IA hace movimientos aleatorios. Perfecto para principiantes.
- **Medio**: La IA intenta ganar y bloquear tus movimientos. Un desafío moderado.
- **Difícil**: La IA usa el algoritmo Minimax con poda alfa-beta. Estrategia avanzada, casi imposible de ganar.

### 🎨 Interfaz Renovada
- **Diseño moderno** con gradientes y animaciones suaves
- **Pestañas de modo** para elegir entre Multijugador y vs IA
- **Selector de dificultad** con botones coloridos y descriptivos
- **Tarjetas informativas** que muestran:
  - Nombre y símbolo de cada jugador
  - Turno actual del juego
  - Estado de la partida
  - Indicador especial cuando juega la IA
- **Tablero interactivo** con:
  - Efectos hover en las celdas disponibles
  - Colores diferenciados para X (azul) y O (rojo)
  - Animación especial para las celdas ganadoras
- **Notificaciones visuales** del estado del juego

### 🎮 Sistema de Juego

#### Modo Multijugador
1. Iniciar sesión o registrarse
2. Ir a la sección "Partidas"
3. Seleccionar la pestaña "Multijugador"
4. Elegir tamaño del tablero (3x3, 4x4, o 5x5)
5. Clic en "Crear partida"
6. Esperar a que un rival se una
7. ¡Jugar!

#### Modo vs IA
1. Iniciar sesión
2. Ir a la sección "Partidas"
3. Seleccionar la pestaña "vs IA"
4. Elegir tamaño del tablero
5. Seleccionar dificultad (Fácil, Medio o Difícil)
6. Clic en "Comenzar Juego"
7. ¡La partida inicia inmediatamente!

#### Jugar
- El jugador X siempre comienza
- Hacer clic en una casilla vacía durante tu turno
- En modo IA, la IA responde automáticamente después de tu movimiento
- El objetivo es conseguir una línea (horizontal, vertical o diagonal)
- El juego detecta automáticamente:
  - ✅ Victoria
  - 🤝 Empate
  - 🔄 Cambio de turno

#### Finalizar
- Al terminar, puedes:
  - Iniciar una nueva partida
  - Salir del juego
  - Ver quién ganó

### 🔧 Características Técnicas

#### Sistema de Partidas
- ✅ Crear partidas con código único
- ✅ Unirse a partidas disponibles
- ✅ Eliminar partidas
- ✅ Sincronización en tiempo real con WebSocket
- ✅ Validación de movimientos en servidor
- ✅ Control de turnos automático
- ✅ Detección de ganador y empate
- ✅ **Partidas contra IA con 3 niveles de dificultad**

#### Inteligencia Artificial
- **Nivel Fácil**: 
  - Algoritmo: Movimientos aleatorios
  - Ideal para: Principiantes y niños
  
- **Nivel Medio**: 
  - Algoritmo: Heurística simple (ganar/bloquear)
  - La IA intenta ganar si tiene oportunidad
  - Bloquea tus intentos de ganar
  - Desafío moderado
  
- **Nivel Difícil**: 
  - Algoritmo: Minimax con poda alfa-beta
  - Estrategia óptima en cada jugada
  - Profundidad limitada para tableros grandes (optimización)
  - Prácticamente imbatible en 3x3
  - Gran desafío en tableros más grandes

#### Arquitectura
- **Frontend**: HTML5, CSS3, JavaScript, jQuery
- **Backend**: Node.js con WebSocket (Socket.IO)
- **Base de Datos**: MongoDB (para usuarios)
- **Comunicación**: REST + WebSockets para tiempo real
- **IA**: Implementada en el servidor para evitar trampas

## 🎨 Mejoras Visuales

### Antes
- Interfaz básica con Bootstrap estándar
- Sin animaciones
- Diseño plano
- Solo multijugador

### Después
- ✨ Gradientes modernos (púrpura/azul)
- 🎭 Animaciones suaves en botones y celdas
- 🎨 Tarjetas con sombras y efectos hover
- 🏆 Animación especial para victoria
- 📱 Diseño responsive y elegante
- 🎮 Dos modos de juego con pestañas
- 🤖 Interfaz especial para modo IA
- 🎨 Botones de dificultad con colores distintivos

## 🚀 Cómo Usar

1. **Iniciar el servidor**:
   ```bash
   npm start
   ```

2. **Abrir en el navegador**:
   ```
   http://localhost:3000
   ```

3. **Crear cuenta o iniciar sesión**

4. **Ir a "Partidas"** y elegir tu modo:
   - **Multijugador**: Crea o únete a una partida
   - **vs IA**: Selecciona dificultad y comienza

5. **¡Jugar y disfrutar!**

## 📝 Reglas del Juego

### Objetivo
Conseguir una línea completa (horizontal, vertical o diagonal) con tu símbolo (X u O).

### Turnos
- El jugador X siempre comienza
- Los turnos se alternan automáticamente
- Solo puedes jugar durante tu turno
- En modo IA, la IA juega automáticamente tras tu movimiento

### Victoria
- **3x3**: 3 símbolos en línea
- **4x4**: 4 símbolos en línea
- **5x5**: 5 símbolos en línea

### Empate
Si el tablero se llena sin que ningún jugador logre una línea completa, el juego termina en empate.

## 🤖 Información sobre la IA

### ¿Cómo funciona?

#### Fácil
Selecciona una casilla vacía al azar. No tiene estrategia.

#### Medio
1. Si puede ganar en el siguiente movimiento, lo hace
2. Si el jugador puede ganar en el siguiente movimiento, lo bloquea
3. Si no, hace un movimiento aleatorio

#### Difícil
Utiliza el algoritmo **Minimax** con poda alfa-beta:
- Evalúa todas las posibles jugadas
- Simula partidas completas
- Elige la jugada óptima
- En 3x3, nunca perderá (empate o victoria)
- En tableros más grandes, usa profundidad limitada por rendimiento

### Estrategias para ganarle a la IA Difícil
- En 3x3: Prácticamente imposible, busca el empate
- En 4x4 y 5x5: La profundidad limitada da más oportunidades
- Crea amenazas dobles
- Controla el centro
- Piensa varios movimientos adelante

## 🔐 Seguridad

- ✅ Validación de movimientos en el servidor
- ✅ IA ejecutada en el servidor (no hackeable)
- ✅ Control de turnos centralizado
- ✅ Autenticación de usuarios
- ✅ Protección contra trampas

## 🎯 Próximas Mejoras Posibles

- 🏆 Tabla de clasificación vs IA
- 📊 Estadísticas de victorias/derrotas
- 💬 Chat en la partida multijugador
- 🎵 Efectos de sonido
- 📱 Aplicación móvil nativa
- ⏱️ Temporizador por turno
- 🎨 Temas personalizables
- 🏅 Sistema de logros
- 🎓 Tutorial interactivo
- 🔄 Modo torneo

## 🐛 Problemas Conocidos

Ninguno reportado hasta el momento.

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias, por favor repórtalo.

---

**¡Disfruta del juego y desafía a la IA!** 🎮🤖✨
