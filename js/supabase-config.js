// CONFIGURACIÓN E INICIALIZACIÓN DE SUPABASE
const SUPABASE_URL = 'https://TU_SUPABASE_PROJECT_URL.supabase.co'; // Reemplazar con tu URL
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY';                 // Reemplazar con tu API Key

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// HELPERS GLOBALES DE NOTIFICACIÓN
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true
});

function notify(icon, title) {
  Toast.fire({ icon, title });
}

function alertError(title, text) {
  Swal.fire({ icon: 'error', title, text, confirmButtonColor: '#2563eb' });
}

function alertSuccess(title, text) {
  Swal.fire({ icon: 'success', title, text, confirmButtonColor: '#2563eb' });
}
