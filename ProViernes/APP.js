/* =====================================================
   Gestión de Estudiantes - JavaScript puro (sin POO)
   Instituto IDAT | Desarrollo de Interfaces I
   ===================================================== */

/* ---------- 1. VARIABLES Y CONSTANTES (string, number, boolean) ---------- */
const CLAVE_STORAGE = "estudiantes_idat"; // string
const NOTA_APROBATORIA = 13; // number
const NOTA_SOBRESALIENTE = 18; // number
const CANTIDAD_NOTAS = 3; // number
const TIEMPO_MENSAJE = 3500; // number (milisegundos)

let estudiantes = []; // arreglo: colección principal de datos
let idEditando = null; // id del estudiante en edición (null = modo registro)
let modoEdicion = false; // boolean
let idPorEliminar = null; // id pendiente de confirmación
let temporizador = null; // control del mensaje temporal

/* ---------- 2. REFERENCIAS AL DOM ---------- */
const formulario = document.getElementById("formEstudiante");
const campoNombre = document.getElementById("nombre");
const campoCodigo = document.getElementById("codigo");
const campoNota1 = document.getElementById("nota1");
const campoNota2 = document.getElementById("nota2");
const campoNota3 = document.getElementById("nota3");
const buscador = document.getElementById("buscador");
const cuerpoTabla = document.getElementById("cuerpoTabla");
const sinResultados = document.getElementById("sinResultados");
const cajaMensaje = document.getElementById("mensaje");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");
const tituloForm = document.getElementById("tituloForm");
const dialogo = document.getElementById("dlgConfirmar");
const textoDialogo = document.getElementById("dlgTexto");

/* ---------- 3. PERSISTENCIA (localStorage) ---------- */
function cargarEstudiantes() {
  const guardado = localStorage.getItem(CLAVE_STORAGE);
  estudiantes = guardado ? JSON.parse(guardado) : [];
}

function guardarEstudiantes() {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(estudiantes));
}

/* ---------- 4. CÁLCULOS ---------- */
// Cálculo 1: promedio de un estudiante (suma de notas / cantidad de notas)
function calcularPromedio(estudiante) {
  let suma = 0;
  for (const nota of estudiante.notas) {
    // bucle for...of
    suma += nota;
  }
  return suma / CANTIDAD_NOTAS;
}

// Cálculo 2: porcentaje de aprobados y promedio general del grupo
function calcularResumen(lista) {
  let sumaPromedios = 0;
  let aprobados = 0;
  for (const e of lista) {
    const promedio = calcularPromedio(e);
    sumaPromedios += promedio;
    if (promedio >= NOTA_APROBATORIA) {
      // operador relacional
      aprobados++;
    }
  }
  const total = lista.length;
  const promedioGeneral = total > 0 ? sumaPromedios / total : 0;
  const porcentaje = total > 0 ? (aprobados / total) * 100 : 0;
  return { total, promedioGeneral, aprobados, porcentaje };
}

/* ---------- 5. CONDICIÓN ACADÉMICA (if/else y switch) ---------- */
function obtenerCondicion(estudiante) {
  const promedio = calcularPromedio(estudiante);
  if (promedio >= NOTA_SOBRESALIENTE) {
    return "sobresaliente";
  } else if (promedio >= NOTA_APROBATORIA) {
    return "aprobado";
  }
  return "desaprobado";
}

function textoCondicion(condicion) {
  switch (condicion) {
    case "sobresaliente":
      return "Sobresaliente";
    case "aprobado":
      return "Aprobado";
    default:
      return "Desaprobado";
  }
}

/* ---------- 6. MENSAJES TEMPORALES ---------- */
function mostrarMensaje(texto, tipo) {
  cajaMensaje.textContent = texto;
  cajaMensaje.className = "mensaje " + tipo; // "exito" o "error"
  cajaMensaje.hidden = false;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => {
    cajaMensaje.hidden = true;
  }, TIEMPO_MENSAJE);
}

/* ---------- 7. VALIDACIÓN Y CONVERSIÓN DE DATOS ---------- */
// Devuelve un objeto estudiante ya convertido o null si hay errores
function leerFormulario() {
  // Validación nativa de HTML5 (required, pattern, min, max, step)
  if (!formulario.checkValidity()) {
    formulario.reportValidity();
    mostrarMensaje(
      "Revise los campos marcados: hay datos incompletos o inválidos.",
      "error",
    );
    return null;
  }

  // Conversión explícita de texto a número
  const nombre = campoNombre.value.trim();
  const codigo = campoCodigo.value.trim();
  const nota1 = parseFloat(campoNota1.value);
  const nota2 = parseFloat(campoNota2.value);
  const nota3 = Number(campoNota3.value);
  const notas = [nota1, nota2, nota3];

  // Validación adicional con operadores lógicos y relacionales
  if (nombre.length < 3 || codigo === "") {
    mostrarMensaje("El nombre o el código no son válidos.", "error");
    return null;
  }
  for (const nota of notas) {
    if (isNaN(nota) || nota < 0 || nota > 20) {
      mostrarMensaje("Las notas deben ser números entre 0 y 20.", "error");
      return null;
    }
  }

  // Prevención de duplicados por código (búsqueda en el arreglo con find)
  const duplicado = estudiantes.find(
    (e) => e.codigo === codigo && e.id !== idEditando,
  );
  if (duplicado) {
    mostrarMensaje("Ya existe un estudiante con ese código.", "error");
    return null;
  }

  return { nombre, codigo, notas };
}

// Genera un id único usando un bucle while
function generarId() {
  let nuevoId = Date.now();
  while (estudiantes.some((e) => e.id === nuevoId)) {
    nuevoId++;
  }
  return nuevoId;
}

/* ---------- 8. OPERACIONES CRUD ---------- */
function guardarEstudiante(evento) {
  evento.preventDefault();
  const datos = leerFormulario();
  if (datos === null) return;

  if (modoEdicion) {
    const indice = estudiantes.findIndex((e) => e.id === idEditando);
    estudiantes[indice] = { id: idEditando, ...datos }; // modificar
    mostrarMensaje("Estudiante actualizado correctamente.", "exito");
  } else {
    estudiantes.push({ id: generarId(), ...datos }); // registrar
    mostrarMensaje("Estudiante registrado correctamente.", "exito");
  }
  guardarEstudiantes();
  salirModoEdicion();
  renderizar();
}

function iniciarEdicion(id) {
  const e = estudiantes.find((est) => est.id === id);
  if (!e) return;
  campoNombre.value = e.nombre;
  campoCodigo.value = e.codigo;
  campoNota1.value = e.notas[0];
  campoNota2.value = e.notas[1];
  campoNota3.value = e.notas[2];
  idEditando = id;
  modoEdicion = true;
  tituloForm.textContent = "Modificar estudiante";
  btnGuardar.textContent = "Actualizar estudiante";
  btnCancelar.hidden = false;
  campoNombre.focus();
  formulario.scrollIntoView({ behavior: "smooth" });
}

function salirModoEdicion() {
  formulario.reset();
  idEditando = null;
  modoEdicion = false;
  tituloForm.textContent = "Registrar estudiante";
  btnGuardar.textContent = "Guardar estudiante";
  btnCancelar.hidden = true;
}

function pedirConfirmacion(id) {
  const e = estudiantes.find((est) => est.id === id);
  if (!e) return;
  idPorEliminar = id;
  textoDialogo.textContent = `¿Desea eliminar a "${e.nombre}"? Esta acción no se puede deshacer.`;
  dialogo.showModal();
}

function eliminarEstudiante() {
  const indice = estudiantes.findIndex((e) => e.id === idPorEliminar);
  if (indice !== -1) {
    estudiantes.splice(indice, 1); // eliminar del arreglo
    guardarEstudiantes();
    mostrarMensaje("Estudiante eliminado correctamente.", "exito");
  }
  idPorEliminar = null;
  dialogo.close();
  renderizar();
}

/* ---------- 9. DOM: TABLA Y RESUMEN ---------- */
function crearCelda(texto) {
  const td = document.createElement("td");
  td.textContent = texto; // textContent evita inyección de código
  return td;
}

function crearBoton(texto, accion, id, clase, nombre) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.textContent = texto;
  boton.className = "btn btn-chico " + clase;
  boton.dataset.accion = accion;
  boton.dataset.id = id;
  boton.setAttribute("aria-label", `${texto} a ${nombre}`);
  return boton;
}

function renderizar() {
  const texto = buscador.value.trim().toLowerCase();
  // Búsqueda: filtra el arreglo por nombre o código
  const filtrados = estudiantes.filter(
    (e) => e.nombre.toLowerCase().includes(texto) || e.codigo.includes(texto),
  );

  cuerpoTabla.innerHTML = "";
  for (const e of filtrados) {
    const fila = document.createElement("tr");
    const condicion = obtenerCondicion(e);

    fila.appendChild(crearCelda(e.nombre));
    fila.appendChild(crearCelda(e.codigo));
    for (const nota of e.notas) {
      fila.appendChild(crearCelda(nota.toFixed(1)));
    }
    fila.appendChild(crearCelda(calcularPromedio(e).toFixed(2)));

    const celdaCondicion = document.createElement("td");
    const etiqueta = document.createElement("span");
    etiqueta.className = "etiqueta " + condicion;
    etiqueta.textContent = textoCondicion(condicion);
    celdaCondicion.appendChild(etiqueta);
    fila.appendChild(celdaCondicion);

    const celdaAcciones = document.createElement("td");
    celdaAcciones.appendChild(
      crearBoton("Editar", "editar", e.id, "btn-secundario", e.nombre),
    );
    celdaAcciones.appendChild(
      crearBoton("Eliminar", "eliminar", e.id, "btn-peligro", e.nombre),
    );
    fila.appendChild(celdaAcciones);

    cuerpoTabla.appendChild(fila);
  }

  sinResultados.hidden = filtrados.length > 0;
  actualizarResumen();
}

function actualizarResumen() {
  const r = calcularResumen(estudiantes);
  document.getElementById("resTotal").textContent = r.total;
  document.getElementById("resPromedio").textContent =
    r.promedioGeneral.toFixed(2);
  document.getElementById("resAprobados").textContent =
    `${r.aprobados} (${r.porcentaje.toFixed(1)}%)`;
}

/* ---------- 10. EVENTOS (addEventListener) ---------- */
formulario.addEventListener("submit", guardarEstudiante);
btnCancelar.addEventListener("click", () => {
  salirModoEdicion();
  mostrarMensaje("Edición cancelada.", "exito");
});
buscador.addEventListener("input", renderizar);

// Delegación de eventos: un solo listener para todos los botones de la tabla
cuerpoTabla.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button");
  if (!boton) return;
  const id = Number(boton.dataset.id);
  if (boton.dataset.accion === "editar") iniciarEdicion(id);
  if (boton.dataset.accion === "eliminar") pedirConfirmacion(id);
});

document.getElementById("btnSi").addEventListener("click", eliminarEstudiante);
document.getElementById("btnNo").addEventListener("click", () => {
  idPorEliminar = null;
  dialogo.close();
});

/* ---------- 11. INICIO DE LA APLICACIÓN ---------- */
cargarEstudiantes();
renderizar();
