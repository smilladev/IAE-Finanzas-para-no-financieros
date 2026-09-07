// Sheet destino confirmado (2026-09-07):
// https://docs.google.com/spreadsheets/d/1lSXgDLylzhRA3Fyh0C7x3-cLRUb2p0DJCQNGopWIjGA/edit?gid=0
//
// La fila 1 (encabezados) de la pestaña gid=0 confirmada por CSV export tiene
// EXACTO las mismas 25 columnas (mismo orden) que ya usaba Director de Ventas:
// DB_Tipo de Documento | DB_Nro. de documento | Correo electronico | Nombre | Apellido |
// DB_Sexo | DB_Fecha de Nacimiento | Pais de Residencia | Provincia DP | Ciudad DP |
// Pais Telefono | Telefono Codigo Area | Telefono 3 | Producto Nombre | ID. |
// utm_source | utm_medium | utm_content | utm_term | utm_campaign | campaniaid | Canal |
// Plantilla auto respuesta | Derivar a | Derivar a cola
//
// A diferencia del Sheet de Ventas, ESTE Sheet todavia no tenia las 6 columnas
// de scoring al final (Formacion academica | Cargo | Area practica | Score |
// Value | Timestamp) -- el header row terminaba en "Derivar a cola" (columna
// 25). Para no depender de que alguien las tipee bien a mano, ensureHeaders()
// las agrega solas la primera vez que corre el script (ver mas abajo).
const SPREADSHEET_ID = "1lSXgDLylzhRA3Fyh0C7x3-cLRUb2p0DJCQNGopWIjGA";
const SCORING_HEADERS = ['Formacion academica', 'Cargo', 'Area practica', 'Score', 'Value', 'Timestamp'];

function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      throw new Error('No se recibieron datos.');
    }

    const data = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (!ss) {
      throw new Error('No se pudo encontrar el Spreadsheet.');
    }

    // Se usa el gid (id numerico de la pestana, "0" en la URL) en vez del
    // nombre de la pestana -- mas confiable si alguien renombra la hoja.
    const sheet = ss.getSheetById(0);
    if (!sheet) {
      throw new Error('No se encontro la pestana con gid=0.');
    }

    ensureHeaders(sheet);

    // Provincia DP, Ciudad DP, Telefono Codigo Area, Producto Nombre, ID., campaniaid,
    // Canal, Plantilla auto respuesta, Derivar a y Derivar a cola no tienen un campo
    // de origen en el form/formData todavia -> quedan vacias a proposito.
    //
    // Telefono: phonePrefix es el codigo de pais (ej: "54") y phoneNumber es TODO lo
    // que sigue (codigo de area + numero local juntos, sin separar -- los codigos de
    // area argentinos varian de 2 a 4 digitos, no hay forma confiable de partirlos sin
    // una tabla de prefijos). Va completo a "Telefono 3"; "Telefono Codigo Area" queda vacio.
    sheet.appendRow([
      data['_dp_string197389'] || '', // DB_Tipo de Documento
      data['_dp_string219707'] || '', // DB_Nro. de documento
      data['_dp_email']        || '', // Correo electronico
      data['_dp_string319']    || '', // Nombre
      data['_dp_string320']    || '', // Apellido
      data['_dp_string246369'] || '', // DB_Sexo
      data['_dp_date219708']   || '', // DB_Fecha de Nacimiento
      data['_dp_country']      || '', // Pais de Residencia
      '',                              // Provincia DP (sin dato de origen)
      '',                              // Ciudad DP (sin dato de origen)
      data['phonePrefix']      || '', // Pais Telefono (codigo de pais)
      '',                              // Telefono Codigo Area (no se puede separar de forma confiable)
      data['phoneNumber']      || '', // Telefono 3 (codigo de area + numero local, sin separar)
      '',                              // Producto Nombre (sin dato de origen)
      '',                              // ID. (sin dato de origen)
      data['utm_source']       || '',
      data['utm_medium']       || '',
      data['utm_content']      || '',
      data['utm_term']         || '',
      data['utm_campaign']     || '',
      '',                              // campaniaid (sin dato de origen)
      '',                              // Canal (sin dato de origen)
      '',                              // Plantilla auto respuesta (sin dato de origen)
      '',                              // Derivar a (sin dato de origen)
      '',                              // Derivar a cola (sin dato de origen)
      data['_dp_string219310'] || '', // Formacion academica (nivel de estudios)
      data['_dp_string18650']  || '', // Cargo
      data['_dp_string35228']  || '', // Area practica
      data['LeadScore']        || 0,  // Score
      data['LeadValue']        || 0,  // Value
      data['timestamp'] || Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy HH:mm:ss') // Timestamp
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Si el header row (fila 1) todavia termina en "Derivar a cola" (columna 25,
 * layout heredado de Director de Ventas), agrega los 6 encabezados de scoring
 * en las columnas 26-31. Idempotente: si ya estan, no hace nada.
 */
function ensureHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol >= 26) return; // ya tiene (al menos) la primera columna nueva
  const startCol = lastCol + 1;
  sheet.getRange(1, startCol, 1, SCORING_HEADERS.length).setValues([SCORING_HEADERS]);
}
