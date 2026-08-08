import type { Model, Document, QueryFilter, UpdateQuery } from "mongoose";

/**
 * Reusable CRUD surface shared by every entity repository — see CLAUDE.md → "Data layer".
 * Repositories are the only layer allowed to import a Mongoose model and query it directly.
 */
export class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  findAll(filter: QueryFilter<T> = {}) {
    return this.model.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findPaginated(filter: QueryFilter<T> = {}, page = 1, pageSize = 100) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, Math.min(pageSize, 500));
    const skip = (safePage - 1) * safePageSize;

    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safePageSize).exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return { items, total, page: safePage, pageSize: safePageSize };
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  create(data: Partial<T>) {
    return this.model.create(data);
  }

  update(id: string, data: UpdateQuery<T>) {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  delete(id: string) {
    return this.model.findByIdAndDelete(id).exec();
  }
}
