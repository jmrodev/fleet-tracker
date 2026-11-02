const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

class ViajesRepository {
  _col() {
    return getDB().collection('viajes');
  }

  async findWithFilter(filter = {}, skip = 0, limit = 50) {
    return this._col()
      .find(filter)
      .sort({ fecha_salida: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  async findById(id) {
    return this._col().findOne({ _id: new ObjectId(id) });
  }

  async insert(viajeDoc) {
    const result = await this._col().insertOne(viajeDoc);
    return { _id: result.insertedId, ...viajeDoc };
  }

  async updateFinalizar(id, fields) {
    return this._col().updateOne(
      { _id: new ObjectId(id) },
      { $set: fields }
    );
  }

  async aggregateKmFinalizados() {
    const pipeline = [
      { $match: { estado: 'finalizado' } },
      {
        $group: {
          _id: null,
          km_totales: { $sum: '$km_recorridos' },
          viajes_totales: { $sum: 1 }
        }
      }
    ];
    return this._col().aggregate(pipeline).toArray();
  }
}

module.exports = new ViajesRepository();
