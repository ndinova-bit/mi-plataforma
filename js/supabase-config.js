// Configuración de Supabase
if (typeof SUPABASE_URL === 'undefined') {
  var SUPABASE_URL = 'https://dxgqtdaexlegsaohdywx.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4Z3F0ZGFleGxlZ3Nhb2hkeXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MDk3MTMsImV4cCI6MjEwNTk4NTcxM30.XFH0vQYm68RQcY8fQNbCx_5kt6Iclb-QeJWGBuyNQow';
}

// Inicializar el cliente Supabase de forma segura
if (typeof window.supabaseClient === 'undefined') {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Aseguramos que la instancia global tenga la referencia correcta
window.supabase = window.supabaseClient;

// Funciones globales de alertas
function alertError(titulo, mensaje) {
  const text = mensaje || titulo;
  const title = mensaje ? titulo : 'Error';
  if (typeof Swal !== 'undefined') {
    Swal.fire({ icon: 'error', title: title, text: text, confirmButtonColor: '#2563eb' });
  } else {
    alert(`${title}: ${text}`);
  }
}

function alertSuccess(titulo, mensaje) {
  const text = mensaje || titulo;
  const title = mensaje ? titulo : '¡Éxito!';
  if (typeof Swal !== 'undefined') {
    Swal.fire({ icon: 'success', title: title, text: text, confirmButtonColor: '#2563eb' });
  } else {
    alert(`${title}: ${text}`);
  }
}

// Función notify compatible con notify(tipo, mensaje) o notify(mensaje)
function notify(tipoOrMensaje, mensaje) {
  const icon = mensaje ? tipoOrMensaje : 'info';
  const text = mensaje || tipoOrMensaje;

  if (typeof Swal !== 'undefined') {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });

    Toast.fire({
      icon: ['success', 'error', 'warning', 'info', 'question'].includes(icon) ? icon : 'info',
      title: text
    });
  } else {
    alert(text);
  }
}

// Exportamos globalmente
window.alertError = alertError;
window.alertSuccess = alertSuccess;
window.windowNotify = notify;
window.notify = notify;
