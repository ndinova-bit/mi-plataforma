// Configuración de Supabase
const SUPABASE_URL = 'https://dxgqtdaexlegsaohdywx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_q3iliYP60gR5bP6vtTwoHA_8FWqg7iz';

// Se utiliza 'supabaseClient' para no colisionar con la variable global 'supabase' de la CDN
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Reasignamos a window.supabase para que auth.js y trayectos.js lo reconozcan
window.supabase = supabaseClient;

// Funciones globales de alertas
function alertError(mensaje) {
  if (typeof Swal !== 'undefined') {
    Swal.fire({ icon: 'error', title: 'Error', text: mensaje });
  } else {
    alert('Error: ' + mensaje);
  }
}

function alertSuccess(mensaje) {
  if (typeof Swal !== 'undefined') {
    Swal.fire({ icon: 'success', title: '¡Éxito!', text: mensaje });
  } else {
    alert('¡Éxito!: ' + mensaje);
  }
}
