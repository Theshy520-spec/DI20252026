// Estado simple en memoria: { nombre: valor }
const estado = new Map();
const lista = document.getElementById("lista");
const estadoUI = document.getElementById("estado");
const btnCargar = document.getElementById("btn-cargar-nombres");
const btnReset = document.getElementById("btn-reset");
const inputArchivo = document.getElementById("input-archivo");
const tpl = document.getElementById("tpl-persona");
const btnReset5 = document.getElementById("btn-reset-5");
const btnReset0 = document.getElementById("btn-reset-0");
const btnMas = document.getElementById("btn-mas-global");
const btnMenos = document.getElementById("btn-menos-global");
const btnSeleccionarTodos = document.getElementById("btn-seleccionar-todos");


// --------- Utilidades ---------
function normalizaNombre(s) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();
}

function renderPersona(nombre, valor = 10) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.dataset.nombre = nombre;
  node.querySelector(".nombre").textContent = nombre;
  const span = node.querySelector(".contador");
  span.textContent = valor;
  span.dataset.valor = String(valor);
  return node;
}

function bump(el) {
  el.classList.add("bump");
  setTimeout(() => el.classList.remove("bump"), 160);
}

// Render completo desde estado
function renderLista() {
  lista.innerHTML = "";
  const nombres = Array.from(estado.keys()).sort((a, b) =>
    normalizaNombre(a).localeCompare(normalizaNombre(b))
  );
  for (const n of nombres) {
    const v = estado.get(n) ?? 10;
    lista.appendChild(renderPersona(n, v));
  }
}

// Mensaje de estado accesible
function setEstado(msg) {
  estadoUI.textContent = msg ?? "";
}

// --------- Carga de nombres ---------
async function cargarNombresDesdeTxt(url = "nombres.txt") {
  setEstado("Cargando nombres…");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo leer ${url}`);
  const text = await res.text();

  // Permite .txt (una por línea) o .json (array de strings)
  let nombres;
  if (url.endsWith(".json")) {
    const arr = JSON.parse(text);
    nombres = Array.isArray(arr) ? arr : [];
  } else {
    nombres = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  }

  if (nombres.length === 0) throw new Error("El archivo no contiene nombres.");

  // Inicializa estado si no existían
  for (const n of nombres) {
    if (!estado.has(n)) estado.set(n, 10);
  }
  renderLista();
  setEstado(`Cargados ${nombres.length} nombres.`);
}

// Carga desde archivo local (input file)
async function cargarDesdeArchivoLocal(file) {
  const text = await file.text();
  let nombres;
  if (file.name.endsWith(".json")) {
    const arr = JSON.parse(text);
    nombres = Array.isArray(arr) ? arr : [];
  } else {
    nombres = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  }

  if (nombres.length === 0) throw new Error("El archivo no contiene nombres.");

  for (const n of nombres) {
    if (!estado.has(n)) estado.set(n, 10);
  }
  renderLista();
  setEstado(`Cargados ${nombres.length} nombres desde archivo local.`);
}

// --------- Interacción ---------
// Delegación: un solo listener para todos los botones
lista.addEventListener("click", (ev) => {
  const btn = ev.target.closest("button");
  const card = ev.target.closest(".persona");
  const contador = ev.target.closest(".contador");

  // Si se hace clic en el contador (span), permitir edición directa
  if (contador && card && !btn) {
    editarContadorDirectamente(contador, card);
    return;
  }

  // Si es un botón (+/-/reset individual)
  if (btn && card) {
    const seleccionadas = document.querySelectorAll(".persona.seleccionada");
    
    // Si hay seleccionadas (incluyendo la actual si no está seleccionada)
    let cardsAModificar = [];
    if (seleccionadas.length > 0) {
      // Si la card actual no está seleccionada, solo modificar las seleccionadas
      if (!card.classList.contains("seleccionada")) {
        cardsAModificar = Array.from(seleccionadas);
      } else {
        // Si la card actual está seleccionada, modificar todas las seleccionadas
        cardsAModificar = Array.from(seleccionadas);
      }
    } else {
      // Si no hay ninguna seleccionada, modificar solo la actual
      cardsAModificar = [card];
    }
    
    let cambio = 0;
    let valorReset = null;
    
    if (btn.classList.contains("btn-mas")) cambio = 0.1;
    if (btn.classList.contains("btn-menos")) cambio = -0.1;
    if (btn.classList.contains("btn-reset-individual")) valorReset = 10;
    
    cardsAModificar.forEach(cardModificar => {
      const nombreMod = cardModificar.dataset.nombre;
      if (!estado.has(nombreMod)) return;
      
      const spanMod = cardModificar.querySelector(".contador");
      let valorMod = Number(spanMod.dataset.valor || "10");
      
      if (valorReset !== null) {
        valorMod = valorReset;
      } else {
        valorMod += cambio;
      }
      
      valorMod = Math.min(10, Math.max(0, parseFloat(valorMod.toFixed(1))));
      
      estado.set(nombreMod, valorMod);
      spanMod.dataset.valor = String(valorMod);
      spanMod.textContent = valorMod.toFixed(1);
      actualizarColor(spanMod, valorMod);
      bump(spanMod);
    });
    
    return; // ya procesado, no sigue al siguiente bloque
  }

  // Si no es un botón ni contador, manejamos la selección
  if (card && !contador) {
    if (ev.ctrlKey || ev.metaKey) {
      card.classList.toggle("seleccionada");
    } else {
      document.querySelectorAll(".persona.seleccionada").forEach(c => c.classList.remove("seleccionada"));
      card.classList.add("seleccionada");
    }
    actualizarBotonesSeleccion();
  }
});


btnReset.addEventListener("click", () => {
  for (const n of estado.keys()) estado.set(n, 10);
  renderLista();
  setEstado("Todos los contadores han sido reiniciados a 10.");
});

btnReset5.addEventListener("click", () => {
  for (const n of estado.keys()) estado.set(n, 5);
  renderLista();
  setEstado("Todos los contadores han sido reiniciados a 5.");
});

btnReset0.addEventListener("click", () => {
  for (const n of estado.keys()) estado.set(n, 0);
  renderLista();
  setEstado("Todos los contadores han sido reiniciados a 0.");
});

btnCargar.addEventListener("click", async () => {
  try {
    await cargarNombresDesdeTxt("nombres.txt");
  } catch (err) {
    console.error(err);
    setEstado("No se pudo cargar nombres.txt. Puedes subir un archivo local.");
  }
});

inputArchivo.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    await cargarDesdeArchivoLocal(file);
  } catch (err) {
    console.error(err);
    setEstado("No se pudo leer el archivo local.");
  } finally {
    inputArchivo.value = "";
  }
});

// --------- Bootstrap ---------
// Opción A (recomendada en local con live server): intenta cargar nombres.txt
// Opción B: si falla, el usuario puede usar “Cargar archivo local”
cargarNombresDesdeTxt("nombres.txt").catch(() => {
  setEstado("Consejo: coloca un nombres.txt junto a esta página o usa 'Cargar archivo local'.");
});

function actualizarColor(span, valor) {
  if (valor <= 5) {
    span.style.color = "red";
  } else if (valor <= 7) {
    span.style.color = "orange";
  } else {
    span.style.color = "green";
  }
}

function modificarSeleccionadas(cambio) {
  const seleccionadas = document.querySelectorAll(".persona.seleccionada");
  seleccionadas.forEach(card => {
    const nombre = card.dataset.nombre;
    const span = card.querySelector(".contador");
    let valor = Number(span.dataset.valor || "10");

    valor += cambio;              // +0.1 o -0.1
    valor = Math.min(10, Math.max(0, parseFloat(valor.toFixed(1))));

    estado.set(nombre, valor);
    span.dataset.valor = String(valor);
    span.textContent = valor.toFixed(1);
    actualizarColor(span, valor);
    bump(span);
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") modificarSeleccionadas(0.1);
  if (e.key === "ArrowDown") modificarSeleccionadas(-0.1);
});

function resetSeleccionadas(valor) {
  const seleccionadas = document.querySelectorAll(".persona.seleccionada");
  seleccionadas.forEach(card => {
    const nombre = card.dataset.nombre;
    const span = card.querySelector(".contador");
    estado.set(nombre, valor);
    span.dataset.valor = String(valor);
    span.textContent = valor.toFixed(1);
    actualizarColor(span, valor);
    bump(span);
  });
}

function actualizarBotonesSeleccion() {
  const seleccionadas = document.querySelectorAll(".persona.seleccionada");
  const todasLasPersonas = document.querySelectorAll(".persona");

  // Actualizar texto del botón seleccionar todos
  if (seleccionadas.length === todasLasPersonas.length && todasLasPersonas.length > 0) {
    btnSeleccionarTodos.textContent = "Deseleccionar todos";
  } else {
    btnSeleccionarTodos.textContent = "Seleccionar todos";
  }

  // Los botones individuales siempre están habilitados
  // Cuando hay múltiples selecciones, afectarán a todas las seleccionadas
  document.querySelectorAll(".persona").forEach(card => {
    const btnMas = card.querySelector(".btn-mas");
    const btnMenos = card.querySelector(".btn-menos");

    btnMas.disabled = false;
    btnMenos.disabled = false;
    btnMas.classList.remove("deshabilitado");
    btnMenos.classList.remove("deshabilitado");
  });
}

btnMas.addEventListener("click", () => modificarSeleccionadas(0.1));
btnMenos.addEventListener("click", () => modificarSeleccionadas(-0.1));

// Función para editar contador directamente
function editarContadorDirectamente(span, card) {
  const valorActual = parseFloat(span.dataset.valor || "10");
  const nombre = card.dataset.nombre;
  
  // Crear input temporal
  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.max = "10";
  input.step = "0.1";
  input.value = valorActual.toFixed(1);
  input.style.width = "4ch";
  input.style.textAlign = "center";
  input.style.fontSize = "2.25rem";
  input.style.border = "2px solid var(--accent)";
  input.style.borderRadius = "4px";
  input.style.backgroundColor = "var(--card)";
  input.style.color = "var(--text)";
  
  // Reemplazar span con input temporalmente
  span.style.display = "none";
  span.parentNode.insertBefore(input, span);
  input.focus();
  input.select();
  
  function finalizarEdicion() {
    let nuevoValor = parseFloat(input.value);
    
    // Validar rango
    if (isNaN(nuevoValor)) nuevoValor = valorActual;
    nuevoValor = Math.min(10, Math.max(0, parseFloat(nuevoValor.toFixed(1))));
    
    // Actualizar estado y UI
    estado.set(nombre, nuevoValor);
    span.dataset.valor = String(nuevoValor);
    span.textContent = nuevoValor.toFixed(1);
    actualizarColor(span, nuevoValor);
    bump(span);
    
    // Restaurar span
    input.remove();
    span.style.display = "";
  }
  
  input.addEventListener("blur", finalizarEdicion);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === "Escape") {
      finalizarEdicion();
    }
  });
}

// Funcionalidad para seleccionar/deseleccionar todos
btnSeleccionarTodos.addEventListener("click", () => {
  const todasLasPersonas = document.querySelectorAll(".persona");
  const seleccionadas = document.querySelectorAll(".persona.seleccionada");
  
  if (seleccionadas.length === todasLasPersonas.length) {
    // Si todos están seleccionados, deseleccionar todos
    todasLasPersonas.forEach(card => card.classList.remove("seleccionada"));
    btnSeleccionarTodos.textContent = "Seleccionar todos";
  } else {
    // Si no todos están seleccionados, seleccionar todos
    todasLasPersonas.forEach(card => card.classList.add("seleccionada"));
    btnSeleccionarTodos.textContent = "Deseleccionar todos";
  }
  
  actualizarBotonesSeleccion();
});

const btnTema = document.getElementById("btn-tema");

// Cargar preferencia guardada
if (localStorage.getItem("tema") === "oscuro") {
  document.body.classList.add("dark");
  btnTema.textContent = "Modo claro";
}

btnTema.addEventListener("click", () => {
  document.body.classList.toggle("dark");

   if (document.body.classList.contains("dark")) {
    btnTema.textContent = "Modo claro";
    localStorage.setItem("tema", "oscuro");
  } else {
    btnTema.textContent = "Modo oscuro";
    localStorage.setItem("tema", "claro");
  }
});