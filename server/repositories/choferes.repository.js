const { getDB } = require('../config/db');

class ChoferesRepository {
  _col() {
    return getDB().collection('choferes');
  }

  async findWithFilter(filter = {}, skip = 0, limit = 50) {
    return this._col()
      .find(filter)
      .sort({ apellido: 1, nombre: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  async findByDni(dni) {
    return this._col().findOne({ dni });
  }

  async insert(choferDoc) {
    const result = await this._col().insertOne(choferDoc);
    return { _id: result.insertedId, ...choferDoc };
  }

  async updateFields(dni, fields) {
    return this._col().findOneAndUpdate(
      { dni },
      { $set: fields },
      { returnDocument: 'after' }
    );
  }

  async deleteByDni(dni) {
    return this._col().deleteOne({ dni });
  }

  async reserveAtomic(dni) {
    return this._col().findOneAndUpdate(
      { dni, estado: 'disponible' },
      { $set: { estado: 'asignado' } },
      { returnDocument: 'after' }
    );
  }

  async releaseAtomic(dni) {
    return this._col().updateOne({ dni }, { $set: { estado: 'disponible' } });
  }

  async countTotal() {
    return this._col().countDocuments();
  }
}

module.exports = new ChoferesRepository();
