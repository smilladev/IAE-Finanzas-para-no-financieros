# Sistema de Lead Scoring y Valorización - IAE Finanzas para no Financieros

## 📋 Descripción General

Este sistema calcula automáticamente el **Lead Score** (0-100%) y el **Lead Value** (USD) de cada lead capturado a través del formulario Doppler del programa **Finanzas para no Financieros** (IAE Business School). El sistema evalúa múltiples dimensiones del perfil del lead y envía los datos a Google Tag Manager (GTM), plataformas de publicidad (Google Ads y Meta Ads) y a un Google Sheet vía webhook de Google Apps Script.

> ✅ **Estado (2026-09-07)**: circuito completo probado de punta a punta. Sheet destino confirmado — [1lSXgDLylzhRA3Fyh0C7x3-cLRUb2p0DJCQNGopWIjGA](https://docs.google.com/spreadsheets/d/1lSXgDLylzhRA3Fyh0C7x3-cLRUb2p0DJCQNGopWIjGA/edit?gid=0) — con las 6 columnas de scoring ya agregadas (`ensureHeaders()` las creó solas en el primer POST real). Webhook de Apps Script deployado y probado con `curl`: responde `{"status":"ok"}` y escribe la fila correctamente. Scoring, hashing y envío a GTM también probados. Pendiente: borrar las filas de prueba (`QA-CurlTest*`) del Sheet — no son leads reales.

---

## 🎯 Objetivo

Valorizar leads en tiempo real basándose en criterios de negocio definidos, permitiendo:
- Segmentación automática por calidad de lead
- Optimización de campañas publicitarias con valores dinámicos
- Automatizaciones personalizadas según score
- Reporting y análisis de calidad de leads

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────┐
│  Formulario Doppler │
│   (Captura datos)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Script JS Local   │
│ (Calcula Score/Value)│
└─────┬──────┬────────┘
      │      │
      │      └─────────────────┐
      │                        │
      ▼                        ▼
┌──────────────┐      ┌────────────────┐
│ Google Tag   │      │   Webhook n8n  │
│   Manager    │      │  (Integraciones)│
└──────┬───────┘      └────────────────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌──────────┐   ┌──────────┐
│ Google   │   │   Meta   │
│   Ads    │   │   Ads    │
└──────────┘   └──────────┘
```

---

## 📊 Modelo de Scoring

### Pesos por Campo (Total = 100%)

Fuente: `Conversiones online.xlsx`, hoja "Finanzas para no financieros".

| Campo | Peso | Descripción |
|-------|------|-------------|
| **Área de Práctica** | 66% | Departamento o especialidad |
| **Cargo** | 33% | Posición jerárquica del lead |
| **Nivel de Estudios** | 1% | Formación académica |
| **Industria** | 0% | No participa del scoring (campo oculto en el form) |
| **Número de Empleados** | 0% | No participa del scoring (no existe en este form) |
| **Años de Experiencia** | 0% | No participa del scoring (no existe en este form) |

### Fórmula de Cálculo

```javascript
Lead Score (%) =
  (scoreEstudios / 10) × 1 +
  (scoreCargo    / 10) × 33 +
  (scoreArea     / 10) × 66
```

```javascript
Lead Value (USD) =
  (scoreEstudios / 10) × 0.08 +
  (scoreCargo    / 10) × 2.64 +
  (scoreArea     / 10) × 5.28
```

**Valor base del programa (100% de score):** `VALOR_BASE_PROGRAMA = $8` (actualizado 2026-09-10; antes `$52.42857143`).

Cada peso `usd` de arriba es `VALOR_BASE_PROGRAMA × peso_del_campo` (ej: cargo = `8 × 0.33 = 2.64`). En `index.html`, `VALOR_BASE_PROGRAMA` es una constante única — para cambiar el valor del programa solo hay que editar ese número, los `pts` (Lead Score %) no se tocan.

---

## 🚫 Regla de Descalificación

**Si CUALQUIER campo tiene score = 0:**
- `Lead Score = 0%`
- `Lead Value = $0`

Esto garantiza que solo leads completos y relevantes reciban valorización.

---

## 📝 Mapeo de Valores y Scores

### 1. Nivel de Estudios (1%)

| Opción | Score |
|--------|-------|
| `Secundario incompleto` | **0** (❌ Descalifica) |
| `Secundario completo` | 10 |
| `Terciario incompleto` | 10 |
| `Terciario completo` | 10 |
| `Universitario incompleto` | 10 |
| `Universitario completo` | 10 |
| `Posgrado/Maestría` | 10 |
| `Doctorado/PhD` | 10 |

### 2. Cargo (33%)

| Opción | Score |
|--------|-------|
| `Académico` | 1 |
| `Analista` | 9 |
| `Asesor/Consultor` | 2 |
| `Asistente / Administrativo` | 10 |
| `Auditor` | 2 |
| `Coordinador / Supervisor` | 10 |
| `Desocupado` | 1 |
| `Director de Área` | 7 |
| `Director en Directorio` | 7 |
| `Director General` | 7 |
| `Dueño / Socio` | 9 |
| `Ejecutivo Comercial / KAM / Ventas` | 9 |
| `Emprendedor` | 9 |
| `Especialista (en relación de dependencia: abogado, ingeniero, programador, diseñador...)` | 9 |
| `Funcionario Público` | 1 |
| `Gerente de Área` | 9 |
| `Gerente General / CEO` | 7 |
| `Jefe de Área / Departamento` | 10 |
| `Presidente` | 1 |
| `Profesional Independiente` | 8 |
| `Subgte. Area` | 9 |
| `Subgte. General` | 8 |
| `Vicepresidente` | 2 |

### 3. Área de Práctica (66%)

| Opción | Score |
|--------|-------|
| `Académico / Formación` | 2 |
| `Administración & Finanzas` | 9 |
| `Calidad / Seguridad / Medio Ambiente (HSE)` | 2 |
| `Comercial / Ventas / Customer Experience` | 10 |
| `Control de Gestión / Auditoría` | 8 |
| `Data & Analytics / Transformación Digital` | 1 |
| `Dirección General / Alta Gerencia` | 1 |
| `Investigación & Desarrollo (I+D)` | 1 |
| `Legal & Compliance` | 1 |
| `Marketing & Comunicación` | 1 |
| `Operaciones / Supply Chain` | 9 |
| `Otros` | 5 |
| `Planeamiento Estratégico / Desarrollo de Negocios` | 8 |
| `Producto & Innovación` | 2 |
| `Proyectos & Ingeniería` | 7 |
| `Recursos Humanos` | 1 |
| `Relaciones Institucionales / Comunicación Externa` | 1 |
| `Salud / Servicios Médicos` | 1 |
| `Sustentabilidad, ESG & Responsabilidad Social` | 1 |
| `Tecnología / Sistemas` | 9 |

### 4. Industria, N° de Empleados, Años de Experiencia (0%)

No participan del scoring. Industria existe en el form pero se oculta vía CSS/JS (ver `hideFormFields()`); los otros dos campos no existen en este formulario de Doppler.

---

## 🔧 Implementación Técnica

### Campos del Formulario Doppler

Los campos utilizan IDs internos de Doppler (misma cuenta que el form de Director de Ventas, por eso los IDs coinciden):

```javascript
{
  '_dp_string319':    'Nombre',
  '_dp_string320':    'Apellido',
  '_dp_string246369': 'Sexo',
  '_dp_date219708':   'Fecha de Nacimiento',
  '_dp_email':        'Email',
  '_dp_phone219293':  'Teléfono',
  '_dp_country':      'País',
  '_dp_string219310': 'Nivel de Estudios',     // participa del scoring (1%)
  '_dp_string18650':  'Cargo',                 // participa del scoring (33%)
  '_dp_string219311': 'Industria',             // oculto — no participa (0%)
  '_dp_string35228':  'Área de Práctica',      // participa del scoring (66%)
  '_dp_string197389': 'Tipo de Documento',
  '_dp_string219707': 'Nro. de Documento'
}
```

### Flujo de Datos

1. **Captura del Submit:**
   ```javascript
   form.addEventListener('submit', handleSubmit);
   ```

2. **Extracción de Valores:**
   ```javascript
   const scoreEstudios = estudiosScoring[formData['_dp_string219310']] || 0;
   const scoreCargo = cargoScoring[formData['_dp_string18650']] || 0;
   // ... resto de campos
   ```

3. **Validación de Descalificación:**
   ```javascript
   if (scoreEstudios === 0 || scoreCargo === 0 || ...) {
     formData['LeadScore'] = 0;
     formData['LeadValue'] = 0;
   }
   ```

4. **Cálculo Ponderado:**
   ```javascript
   const leadScore =
     (scoreEstudios / 10) * PESOS.estudios.pts +
     (scoreCargo    / 10) * PESOS.cargo.pts +
     (scoreArea     / 10) * PESOS.area.pts;

   const leadValue =
     (scoreEstudios / 10) * PESOS.estudios.usd +
     (scoreCargo    / 10) * PESOS.cargo.usd +
     (scoreArea     / 10) * PESOS.area.usd;
   ```

5. **Envío a GTM:**
   ```javascript
   window.dataLayer.push({
     'event': 'dopplerFormSubmit',
     'formId': 'TPKCHvISMx1tzZ1AeKLquw==',
     'formData': formData
   });
   ```

6. **Envío a Sheets vía Apps Script (Fire-and-Forget):**
   ```javascript
   fetch("https://script.google.com/macros/s/AKfycby-mvtOVE88wrEEZIYr9nwOx4cnZuC00DblKAuMcV0oCKvz1Y3-Ua-nPAmFAYcM7B26og/exec", {
     method: "POST",
     mode: "no-cors",
     body: JSON.stringify(payload),
     keepalive: true
   });
   ```

---

## 📤 Estructura del Data Layer

```javascript
{
  'event': 'dopplerFormSubmit',
  'formId': 'TPKCHvISMx1tzZ1AeKLquw==',
  'formData': {
    '_dp_string219310': 'Universitario completo',
    '_dp_string18650': 'Director General',
    '_dp_string219311': 'Agricultura y Ganadería',
    '_dp_string35228': 'Administración & Finanzas',
    'LeadScore': 83.5,         // Calculado automáticamente
    'LeadValue': 6.68,         // Calculado automáticamente
    // ... otros campos del formulario
  },
  'timestamp': '2026-09-07T14:30:00.000Z'
}
```

---

## 🛠️ Cómo Implementar en Otro Formulario

### Paso 1: Identificar los campos del formulario

Inspecciona el HTML del formulario para obtener los atributos `name` o `id` de cada campo:

```html
<select name="cargo_field_123">
  <option value="Director/Socio/Dueño">Director/Socio/Dueño</option>
  ...
</select>
```

### Paso 2: Actualizar las referencias en el código

En la función `handleSubmit`, reemplaza los IDs de Doppler por los IDs de tu formulario:

```javascript
// ANTES (Doppler)
const scoreEstudios = estudiosScoring[formData['_dp_string219310']] || 0;

// DESPUÉS (tu formulario)
const scoreEstudios = estudiosScoring[formData['cargo_field_123']] || 0;
```

### Paso 3: Ajustar los valores de las opciones

Asegúrate de que los valores (`value`) de cada `<option>` coincidan **exactamente** con las claves de los objetos de scoring:

```javascript
// El value DEBE coincidir con la clave del objeto scoring
<option value="Director/Socio/Dueño">Director/Socio/Dueño</option>

// En el código:
const cargoScoring = {
  "Director/Socio/Dueño": 10,  // ← Coincide exactamente
  ...
}
```

### Paso 4: Configurar GTM y destinos

- Actualiza el `formId` en el `dataLayer.push()`
- Configura las tags de conversión en GTM para usar `{{formData.LeadValue}}`
- Verifica que el webhook de n8n esté configurado correctamente

### Paso 5: Probar con logs

Abre la consola del navegador y envía el formulario. Deberías ver:

```
========================================
✅ LEAD CALIFICADO
========================================
Scores individuales (0-10):
  - Estudios: 10
  - Cargo: 10
  - Industria: 10
  - Área: 10
  - Empleados: 10
  - Experiencia: 10
----------------------------------------
📊 RESULTADO FINAL:
  Lead Score: 100.00%
  Lead Value: $1400
========================================
```

---

## 🔄 Cómo Modificar la Lógica de Scoring

### Cambiar los pesos de los campos

```javascript
const PESOS = {
  cargo: 40,        // Reducir de 50% a 40%
  estudios: 10,     // Aumentar de 6% a 10%
  industria: 10,    // Aumentar de 7% a 10%
  area: 10,         // Aumentar de 7% a 10%
  empleados: 15,    // Mantener 15%
  experiencia: 15   // Mantener 15%
};
// Total debe ser 100%
```

### Cambiar scores individuales

```javascript
const cargoScoring = {
  "Director/Socio/Dueño": 10,
  "Gerente/Subgerente": 8,        // Reducir de 10 a 8
  "Jefe/Coordinador": 6,          // Aumentar de 5 a 6
  "Analista/Profesional": 4,
  "Emprendedor/Independiente": 7,
  "Estudiante": 0,                // Mantener descalificación
  "Otro": 3                       // Reducir de 4 a 3
}
```

### Cambiar el valor base del programa

```javascript
const VALOR_BASE_PROGRAMA = 2000;  // Cambiar de $1400 a $2000
```

### Agregar nuevos campos

1. **Agregar el peso:**
   ```javascript
   const PESOS = {
     cargo: 40,
     estudios: 6,
     industria: 7,
     area: 7,
     empleados: 10,      // Reducir para hacer espacio
     experiencia: 10,    // Reducir para hacer espacio
     tamanio_venta: 20   // NUEVO CAMPO
   };
   ```

2. **Crear el objeto de scoring:**
   ```javascript
   const tamanioVentaScoring = {
     "Menos de $10K": 3,
     "$10K - $50K": 6,
     "$50K - $100K": 8,
     "$100K+": 10
   };
   ```

3. **Capturar el score:**
   ```javascript
   const scoreTamanioVenta = tamanioVentaScoring[formData['nuevo_campo_id']] || 0;
   ```

4. **Agregar a la validación de descalificación:**
   ```javascript
   if (scoreEstudios === 0 || scoreCargo === 0 || ... || scoreTamanioVenta === 0) {
   ```

5. **Incluir en el cálculo:**
   ```javascript
   const leadScore = 
     (scoreCargo / 10) * PESOS.cargo +
     // ... otros campos
     (scoreTamanioVenta / 10) * PESOS.tamanio_venta;
   ```

### Eliminar la regla de descalificación

Si quieres permitir leads parciales:

```javascript
// ANTES - Con descalificación
if (scoreEstudios === 0 || scoreCargo === 0 || ...) {
  formData['LeadScore'] = 0;
  formData['LeadValue'] = 0;
} else {
  // calcular normalmente
}

// DESPUÉS - Sin descalificación
// Simplemente calcula siempre
const leadScore = 
  (scoreCargo / 10) * PESOS.cargo +
  (scoreEstudios / 10) * PESOS.estudios +
  // ...
```

---

## 📊 Ejemplos de Cálculo

### Ejemplo 1: Lead Premium (Score Alto)

**Datos del Lead:**
- Estudios: `Doctorado/PhD` → Score: 10
- Cargo: `Coordinador / Supervisor` → Score: 10
- Área: `Comercial / Ventas / Customer Experience` → Score: 10

**Cálculo:**
```
Lead Score = (10/10)×1 + (10/10)×33 + (10/10)×66 = 1 + 33 + 66 = 100%
Lead Value = (10/10)×0.08 + (10/10)×2.64 + (10/10)×5.28 = $8.00
```

### Ejemplo 2: Lead Medio

**Datos del Lead:**
- Estudios: `Universitario completo` → Score: 10
- Cargo: `Director General` → Score: 7
- Área: `Administración & Finanzas` → Score: 9

**Cálculo:**
```
Lead Score = (10/10)×1 + (7/10)×33 + (9/10)×66 = 1 + 23.1 + 59.4 = 83.5%
Lead Value = (10/10)×0.08 + (7/10)×2.64 + (9/10)×5.28 = $6.68
```

### Ejemplo 3: Lead Descalificado

**Datos del Lead:**
- Estudios: `Secundario incompleto` → Score: **0** ❌
- (resto de campos...)

**Resultado:**
```
Lead Score = 0%  (descalificado por estudios = 0)
Lead Value = $0
```

---

## 🐛 Debugging y Logs

El sistema incluye logs detallados en la consola del navegador:

```javascript
console.log('🔍 VALORES CAPTURADOS:');
console.log('  Estudios (_dp_string219310):', formData['_dp_string219310']);
// ...

console.log('========================================');
console.log('✅ LEAD CALIFICADO');
console.log('========================================');
console.log('Scores individuales (0-10):');
console.log('  - Estudios:', scoreEstudios);
// ...
console.log('📊 RESULTADO FINAL:');
console.log('  Lead Score: ' + leadScore.toFixed(2) + '%');
console.log('  Lead Value: $' + leadValue);
console.log('========================================');
```

### Cómo verificar el funcionamiento:

1. Abre las **Herramientas de Desarrollo** (F12)
2. Ve a la pestaña **Console**
3. Llena y envía el formulario
4. Verifica los logs que muestran:
   - Valores capturados de cada campo
   - Scores individuales (0-10)
   - Cálculo ponderado por campo
   - Lead Score y Lead Value finales

---

## 🔗 Integraciones

### Google Tag Manager

**Evento enviado:**
```javascript
{
  event: 'dopplerFormSubmit',
  formData: {
    LeadScore: 94,
    LeadValue: 1316,
    // ... otros campos
  }
}
```

**Variables sugeridas en GTM:**
- `{{formData.LeadScore}}` - Score del lead (%)
- `{{formData.LeadValue}}` - Valor del lead (USD)
- `{{formData._dp_string18650}}` - Cargo
- etc.

### Google Ads

Configurar tag de conversión con valor dinámico:
```javascript
gtag('event', 'conversion', {
  'send_to': 'AW-XXXXXXX/XXXXXXXXX',
  'value': {{formData.LeadValue}},
  'currency': 'USD'
});
```

### Meta Ads (Facebook Pixel)

```javascript
fbq('track', 'Lead', {
  value: {{formData.LeadValue}},
  currency: 'USD',
  content_name: 'Formulario CEIBO'
});
```

### Google Apps Script (Web App) → Google Sheets

**Endpoint (confirmado y probado, 2026-09-07):** `https://script.google.com/macros/s/AKfycby-mvtOVE88wrEEZIYr9nwOx4cnZuC00DblKAuMcV0oCKvz1Y3-Ua-nPAmFAYcM7B26og/exec`

El POST va con `mode: 'no-cors'`, así que el navegador nunca ve la respuesta real; `Script.js` responde `{status:'ok'}` o `{status:'error', message}` y hace `sheet.appendRow([...])` en un orden posicional que calza con la fila de encabezados real del Sheet. Las 6 columnas de scoring que le faltaban al Sheet (Formación académica, Cargo, Área práctica, Score, Value, Timestamp) las agregó `ensureHeaders()` sola en el primer POST — no hicieron falta tipearlas a mano. Probado con `curl` (ver nota de encoding más abajo): responde `{"status":"ok"}` y la fila aparece completa en el Sheet.

⚠️ Hay filas de prueba (`QA-CurlTest`, `QA-CurlTest2`, y una fila vacía con Score/Value=0) en el Sheet de los tests de esta sesión — hay que borrarlas a mano antes de ir a producción, no son leads reales.

#### Cómo re-deployar el webhook si hace falta modificar `Script.js`

1. Abrir el [Sheet](https://docs.google.com/spreadsheets/d/1lSXgDLylzhRA3Fyh0C7x3-cLRUb2p0DJCQNGopWIjGA/edit?gid=0) → **Extensiones → Apps Script**.
2. Pegar la versión actualizada de [`Script.js`](./Script.js) y guardar (`Ctrl+S`).
3. **Implementar → Administrar implementaciones → ✏️ (editar) → Nueva versión.**

⚠️ **Nunca** crear "Nueva implementación" de nuevo sobre un deployment ya existente — eso genera una URL distinta y `index.html` seguiría apuntando a la versión vieja (congelada), sin ningún error visible.

**Payload enviado (ejemplo):**
```json
{
  "_dp_string219310": "Universitario completo",
  "_dp_string18650": "Director General",
  "_dp_string219311": "Agricultura y Ganadería",
  "_dp_string35228": "Administración & Finanzas",
  "LeadScore": 83.5,
  "LeadValue": 6.68,
  "spreadsheetId": "1lSXgDLylzhRA3Fyh0C7x3-cLRUb2p0DJCQNGopWIjGA",
  "phonePrefix": "54",
  "phoneNumber": "91122334455",
  "timestamp": "07/09/2026, 14:30:00",
  // ... resto de campos del formulario (nombre, apellido, email, etc.)
}
```

---

## ⚠️ Consideraciones Importantes

### 1. Validación de Datos

El sistema usa el operador `||` para asignar score 0 si no encuentra coincidencia:

```javascript
const scoreEstudios = estudiosScoring[formData['_dp_string219310']] || 0;
```

Esto significa que si un valor no está mapeado, el lead será descalificado.

### 2. Coincidencia Exacta

Los valores deben coincidir **exactamente** (case-sensitive):

```javascript
// ✅ CORRECTO
"Director/Socio/Dueño" === "Director/Socio/Dueño"

// ❌ INCORRECTO (mayúsculas diferentes)
"director/socio/dueño" !== "Director/Socio/Dueño"
```

### 3. Fire-and-Forget en n8n

La petición a n8n usa `keepalive: true` para garantizar el envío incluso si Doppler redirige la página:

```javascript
fetch(url, {
  method: "POST",
  body: JSON.stringify(formData),
  keepalive: true  // ← Crítico para envíos asincrónicos
});
```

### 4. Compatibilidad con Doppler

El script **NO interfiere** con el flujo normal de Doppler:
- No usa `preventDefault()`
- No modifica el DOM del formulario
- Solo escucha el evento submit y ejecuta código adicional

### 5. Timing del Script

El script espera a que el formulario esté disponible:

```javascript
const checkFormInterval = setInterval(() => {
  const form = document.querySelector('form[data-dp-form], form');
  if (form) {
    clearInterval(checkFormInterval);
    form.addEventListener('submit', handleSubmit);
  }
}, 500);
```

---

## 📁 Estructura de Archivos

```
formulario-conversion-online/
├── index.html                              # Formulario con script de scoring
├── README.md                               # Este documento
└── ARQUITECTURA RECOMENDADA – VALORIZACIÓN DE LEADS.md  # Documento de requisitos
```

---

## 🚀 Próximos Pasos

1. **Ajustar `VALOR_BASE_PROGRAMA`** según análisis de conversiones offline
2. **Validar scores** con el equipo de negocio
3. **Configurar tags** en GTM para Google Ads y Meta Ads
4. **Crear automatizaciones** en Doppler basadas en LeadScore
5. **Implementar dashboard** de reporting en Looker Studio o similar

---

## 📞 Soporte

Para modificaciones o consultas sobre el sistema de scoring:
- Revisar logs de consola del navegador
- Verificar coincidencia exacta de valores en objetos de scoring
- Confirmar que los pesos sumen 100%
- Validar que GTM esté correctamente instalado

---

## 📜 Changelog

### v1.0 (Septiembre 2026)
- ✅ Implementación inicial del sistema de lead scoring para "Finanzas para no Financieros"
- ✅ Scoring extraído de `Conversiones online.xlsx` (hoja "Finanzas para no financieros")
- ✅ Integración con Doppler (Form5-90653) y GTM (GTM-K5DTMCH)
- ✅ Regla de descalificación por campo = 0 (solo Nivel de Estudios puede dar 0)
- ✅ Ocultamiento del campo Industria (peso 0%)
- ✅ Validado en navegador: scoring, hashing SHA-256, mapeo de país y eventos GTM
- ✅ Sheet destino confirmado, webhook de Apps Script deployado y probado con `curl` end-to-end
- ✅ `ensureHeaders()` agrega solas las columnas de scoring que le faltaban al Sheet
- ⏳ Pendiente: borrar filas de prueba (`QA-CurlTest*`) del Sheet antes de producción

---

**Última actualización:** Septiembre 7, 2026
**Versión:** 1.0
**Autor:** CEIBO Growth Team
