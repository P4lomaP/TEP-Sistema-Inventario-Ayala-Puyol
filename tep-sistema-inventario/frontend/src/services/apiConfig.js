/**
 * Configuración centralizada de la URL del API Backend
 * Al usar '/api' por defecto, Vite redirige las peticiones al puerto 3000 localmente,
 * permitiendo que túneles como ngrok, localtunnel o la red local funcionen automáticamente
 * para cualquier dispositivo externo sin errores de conexión.
 */
export const API_BASE = import.meta.env.VITE_API_URL || '/api';
