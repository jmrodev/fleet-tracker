const choferesRepository = require('../repositories/choferes.repository');

const ESTADOS_CHOFER_VALIDOS = ['disponible', 'asignado', 'licencia', 'descanso'];

class ChoferesService {
  async listarChoferes(estadoQuery, skipQuery, limitQuery) {
    const filter = {};
    if (estadoQuery !== undefined) {
      const estadoSanitizado = String(estadoQuery).trim();
      if (!ESTADOS_CHOFER_VALIDOS.includes(estadoSanitizado)) {
        const error = new Error(`Filtro de estado inválido '${estadoSanitizado}'. Permitidos: ${ESTADOS_CHOFER_VALIDOS.join(', ')}`);
        error.statusCode = 400;
        throw error;
      }
      filter.estado = estadoSanitizado;
    }

    let limit = 50;
    if (limitQuery !== undefined) {
      const parsedLimit = Number(limitQuery);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        const error = new Error("El parámetro 'limit' debe ser un número entero positivo");
        error.statusCode = 400;
        throw error;
      }
      limit = Math.min(parsedLimit, 100);
    }

    let skip = 0;
    if (skipQuery !== undefined) {
      const parsedSkip = Number(skipQuery);
      if (isNaN(parsedSkip) || parsedSkip < 0) {
        const error = new Error("El parámetro 'skip' debe ser un número mayor o igual a 0");
        error.statusCode = 400;
        throw error;
      }
      skip = parsedSkip;
    }

    return choferesRepository.findWithFilter(filter, skip, limit);
  }

  async obtenerChofer(dni) {
    const dniSanitizado = String(dni).trim();
    const chofer = await choferesRepository.findByDni(dniSanitizado);
    if (!chofer) {
      const error = new Error(`Chofer con DNI '${dniSanitizado}' no encontrado.`);
      error.statusCode = 404;
      throw error;
    }
    return chofer;
  }

  async crearChofer(payload) {
    const { dni, nombre, telefono, licencia, foto_url } = payload;

    // Paso 2: Presencia obligatoria de DNI
    if (!dni) {
      const error = new Error('El DNI es obligatorio');
      error.statusCode = 400;
      throw error;
    }

    const dniStr = String(dni).trim();

    // Paso 3: DNI solo números
    if (!/^\d+$/.test(dniStr)) {
      const error = new Error('El DNI debe contener únicamente números');
      error.statusCode = 400;
      throw error;
    }

    // Paso 4: DNI longitud mínima (7 cifras)
    if (dniStr.length < 7) {
      const error = new Error('El DNI no puede tener menos de 7 dígitos');
      error.statusCode = 400;
      throw error;
    }

    // Paso 5: DNI longitud máxima (8 cifras)
    if (dniStr.length > 8) {
      const error = new Error('El DNI no puede tener más de 8 dígitos');
      error.statusCode = 400;
      throw error;
    }

    // Paso 6: Presencia y longitud de Nombre (mínimo 3 caracteres)
    if (!nombre || String(nombre).trim().length < 3) {
      const error = new Error('El nombre es obligatorio y debe tener al menos 3 caracteres');
      error.statusCode = 400;
      throw error;
    }

    // Paso 7: Presencia y longitud de Teléfono (mínimo 6 caracteres)
    if (!telefono || String(telefono).trim().length < 6) {
      const error = new Error('El teléfono es obligatorio y debe tener al menos 6 caracteres');
      error.statusCode = 400;
      throw error;
    }

    // Paso 8: Estructura estricta de Licencia
    if (!licencia || !licencia.categoria) {
      const error = new Error('licencia.categoria es obligatorio');
      error.statusCode = 400;
      throw error;
    }
    if (!licencia.vencimiento) {
      const error = new Error('licencia.vencimiento es obligatorio');
      error.statusCode = 400;
      throw error;
    }

    const doc = {
      dni: dniStr,
      nombre: String(nombre).trim(),
      telefono: String(telefono).trim(),
      licencia: {
        categoria: String(licencia.categoria).trim().toUpperCase(),
        vencimiento: String(licencia.vencimiento).trim()
      },
      foto_url: foto_url !== undefined && foto_url !== null ? String(foto_url).trim() : '',
      estado: 'disponible',
      creado_en: new Date()
    };

    try {
      return await choferesRepository.insert(doc);
    } catch (err) {
      if (err.code === 11000) {
        const error = new Error(`El chofer con DNI '${dniStr}' ya existe (índice único).`);
        error.statusCode = 409;
        throw error;
      }
      throw err;
    }
  }

  async actualizarChofer(dni, payload) {
    const dniSanitizado = String(dni).trim();
    const { nombre, telefono, email, licencia, estado } = payload;

    const fieldsToSet = {};
    if (nombre !== undefined) {
      const nombreStr = String(nombre).trim();
      if (nombreStr.length < 3) {
        const error = new Error("El campo 'nombre' debe tener al menos 3 caracteres");
        error.statusCode = 400;
        throw error;
      }
      fieldsToSet.nombre = nombreStr;
    }
    if (telefono !== undefined) {
      const telStr = String(telefono).trim();
      if (telStr.length < 6) {
        const error = new Error("El campo 'telefono' debe tener al menos 6 caracteres válidos");
        error.statusCode = 400;
        throw error;
      }
      fieldsToSet.telefono = telStr;
    }
    if (email !== undefined) fieldsToSet.email = String(email).trim();
    if (licencia !== undefined) {
      if (typeof licencia !== 'object' || !licencia.categoria || !licencia.vencimiento) {
        const error = new Error("El objeto 'licencia' debe incluir obligatoriamente 'categoria' y 'vencimiento'");
        error.statusCode = 400;
        throw error;
      }
      fieldsToSet.licencia = {
        categoria: String(licencia.categoria).trim(),
        vencimiento: String(licencia.vencimiento).trim()
      };
    }
    if (estado !== undefined) {
      const estadoStr = String(estado).trim();
      if (!ESTADOS_CHOFER_VALIDOS.includes(estadoStr)) {
        const error = new Error(`Estado inválido '${estadoStr}'. Permitidos: ${ESTADOS_CHOFER_VALIDOS.join(', ')}`);
        error.statusCode = 400;
        throw error;
      }
      fieldsToSet.estado = estadoStr;
    }

    if (Object.keys(fieldsToSet).length === 0) {
      const error = new Error('No se enviaron campos válidos para actualizar');
      error.statusCode = 400;
      throw error;
    }

    const updated = await choferesRepository.updateFields(dniSanitizado, fieldsToSet);
    if (!updated) {
      const error = new Error(`Chofer con DNI '${dniSanitizado}' no encontrado.`);
      error.statusCode = 404;
      throw error;
    }
    return updated;
  }

  async eliminarChofer(dni) {
    const dniSanitizado = String(dni).trim();
    const chofer = await choferesRepository.findByDni(dniSanitizado);
    if (!chofer) {
      const error = new Error(`Chofer con DNI '${dniSanitizado}' no encontrado.`);
      error.statusCode = 404;
      throw error;
    }

    if (chofer.estado === 'asignado') {
      const error = new Error(`No se puede eliminar al chofer ${dniSanitizado} porque está asignado a un viaje activo.`);
      error.statusCode = 400;
      throw error;
    }

    await choferesRepository.deleteByDni(dniSanitizado);
    return { success: true, message: `Chofer ${dniSanitizado} eliminado correctamente.` };
  }
}

module.exports = new ChoferesService();
