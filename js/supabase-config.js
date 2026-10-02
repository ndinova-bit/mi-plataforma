// Configuración de Supabase
if (typeof SUPABASE_URL === 'undefined') {
  var SUPABASE_URL = 'https://dxgqtdaexlegsaohdywx.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_q3iliYP60gR5bP6vtTwoHA_8FWqg7iz';
}

// Inicializar el cliente Supabase de forma segura
if (typeof window.supabaseClient === 'undefined') {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Aseguramos que la instancia global tenga la referencia correcta
window.supabase = window.supabaseClient;

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

// Definimos notify para que auth.js muestre los mensajes sin fallar
function notify(mensaje, tipo = 'error') {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: tipo,
      title: tipo === 'error' ? 'Atención' : '¡Éxito!',
      text: mensaje
    });
  } else {
    alert(mensaje);
  }
}

// Exportamos globalmente
window.notify = notify;
