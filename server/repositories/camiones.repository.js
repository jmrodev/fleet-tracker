const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

class CamionesRepository {
  _col() {
    return getDB().collection('camiones');
  }

  async findWithFilter(filter = {}, skip = 0, limit = 50) {
    return this._col()
      .find(filter)
      .sort({ patente: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  async findByPatente(patente) {
    return this._col().findOne({ patente });
  }

  async insert(camionDoc) {
    const result = await this._col().insertOne(camionDoc);
    return { _id: result.insertedId, ...camionDoc };
  }

  async updateFields(patente, fields) {
    return this._col().findOneAndUpdate(
      { patente },
      { $set: fields },
      { returnDocument: 'after' }
    );
  }

  async deleteByPatente(patente) {
    return this._col().deleteOne({ patente });
  }

  async pushMantenimiento(patente, mantenimientoDoc, nuevoEstado) {
    const updateOps = {
      $push: { mantenimientos: mantenimientoDoc }
    };
    if (nuevoEstado) {
      updateOps.$set = { estado: nuevoEstado };
    }
    return this._col().updateOne({ patente }, updateOps);
  }

  async reserveAtomic(patente, minCapacidad) {
    return this._col().findOneAndUpdate(
      { patente, estado: 'disponible', capacidad_kg: { $gte: minCapacidad } },
      { $set: { estado: 'en_viaje' } },
      { returnDocument: 'after' }
    );
  }

  async releaseAtomic(patente, finalKm) {
    return this._col().updateOne(
      { patente },
      {
        $set: { estado: 'disponible' },
        $max: { kilometraje_actual: finalKm }
      }
    );
  }

  async setEstado(patente, estado) {
    return this._col().updateOne({ patente }, { $set: { estado } });
  }

  async countTotal() {
    return this._col().countDocuments();
  }

  async countByEstado(estado) {
    return this._col().countDocuments({ estado });
  }

  async aggregateGastosMantenimiento() {
    const pipeline = [
      { $unwind: '$mantenimientos' },
      {
        $group: {
          _id: '$marca',
          total_gastado: { $sum: '$mantenimientos.costo' },
          servicios: { $sum: 1 },
          costo_promedio: { $avg: '$mantenimientos.costo' }
        }
      },
      { $sort: { total_gastado: -1 } }
    ];
    return this._col().aggregate(pipeline).toArray();
  }
}

module.exports = new CamionesRepository();
