// CONFIGURACIÓN E INICIALIZACIÓN DE SUPABASE
const SUPABASE_URL = 'https://dxgqtdaexlegsaohdywx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_q3iliYP60gR5bP6vtTwoHA_8FWqg7iz';

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
