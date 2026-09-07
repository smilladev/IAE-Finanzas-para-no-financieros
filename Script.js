// ⚠️ PENDIENTE DE CONFIRMAR: todavia no tenemos el Sheet destino real para el
// programa "Finanzas para no financieros" ni su fila de encabezados. El
// SPREADSHEET_ID y el orden de columnas de abajo son un DRAFT calcado del
// Script.js de "Director de Ventas" (mismos campos de origen del form) -- NO
// deployar este archivo sin antes:
//   1. Reemplazar SPREADSHEET_ID/SHEET_NAME por los reales.
//   2. Pedir la fila 1 (encabezados) real del Sheet destino y reescribir el
//      array de appendRow() para que calce EXACTO en ese orden (es posicional,
//      no hace matching por nombre de columna).
const SPREADSHEET_ID = "REPLACE_WITH_SPREADSHEET_ID";
const SHEET_NAME = "Sheet1";

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

    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error('No se encontro la pestana: ' + SHEET_NAME);
    }

    // DRAFT -- el orden de abajo todavia NO fue confirmado contra la fila 1
    // (encabezados) real del sheet destino. Es una copia del layout de
    // Director de Ventas con los campos de origen que ya sabemos que existen
    // en el form de Finanzas (mismos name de Doppler). Ajustar antes de usar:
    // DB_Tipo de Documento | DB_Nro. de documento | Correo electronico | Nombre | Apellido |
    // DB_Sexo | DB_Fecha de Nacimiento | Pais de Residencia | Provincia DP | Ciudad DP |
    // Pais Telefono | Telefono Codigo Area | Telefono 3 | Producto Nombre | ID. |
    // utm_source | utm_medium | utm_content | utm_term | utm_campaign | campaniaid | Canal |
    // Plantilla auto respuesta | Derivar a | Derivar a cola
    // + columnas nuevas al final: Formacion academica | Cargo | Area practica | Score | Value | Timestamp
    //
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
