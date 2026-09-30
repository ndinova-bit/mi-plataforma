// Configuración de Supabase
const SUPABASE_URL = 'https://dxgqtdaexlegsaohdywx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_q3iliYP60gR5bP6vtTwoHA_8FWqg7iz';

// Crear cliente de Supabase asegurando no redeclarar la variable 'supabase'
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helpers globales para alertas y manejo del cliente
window.db = supabaseClient;

function alertError(mensaje) {
  alert('Error: ' + mensaje);
}

function alertSuccess(mensaje) {
  alert('¡Éxito!: ' + mensaje);
}
