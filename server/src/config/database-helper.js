const { supabaseAdmin, isSupabaseEnabled } = require('./supabase');
const { query } = require('./database');

/**
 * Supabase Database Helper
 * Provides a unified interface for database operations
 * Automatically switches between Supabase and PostgreSQL based on configuration
 */

class DatabaseHelper {
  constructor() {
    this.useSupabase = isSupabaseEnabled();
  }

  /**
   * Get all records from a table with pagination and filtering
   */
  async findMany(tableName, options = {}) {
    const {
      select = '*',
      where = {},
      orderBy = null,
      page = 1,
      limit = 10,
      relations = []
    } = options;

    if (this.useSupabase && supabaseAdmin) {
      let supabaseQuery = supabaseAdmin.from(tableName).select(select);

      // Apply filters
      Object.entries(where).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && value.operator) {
            // Handle complex operators like gte, lte, ilike, etc.
            supabaseQuery = supabaseQuery[value.operator](key, value.value);
          } else {
            supabaseQuery = supabaseQuery.eq(key, value);
          }
        }
      });

      // Apply ordering
      if (orderBy) {
        supabaseQuery = supabaseQuery.order(orderBy.column, { 
          ascending: orderBy.direction === 'asc' 
        });
      }

      // Apply pagination
      if (page && limit) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        supabaseQuery = supabaseQuery.range(from, to);
      }

      const { data, error, count } = await supabaseQuery;
      
      if (error) {
        throw new Error(`Supabase query error: ${error.message}`);
      }

      return { data, count, error: null };
    } else {
      // Fallback to PostgreSQL - this would need to be implemented
      throw new Error('PostgreSQL fallback not implemented for findMany');
    }
  }

  /**
   * Get a single record by ID
   */
  async findById(tableName, id, select = '*') {
    if (this.useSupabase && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select(select)
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw new Error(`Supabase query error: ${error.message}`);
      }

      return { data, error: error?.code === 'PGRST116' ? null : error };
    } else {
      // Fallback to PostgreSQL
      const result = await query(`SELECT ${select} FROM ${tableName} WHERE id = $1`, [id]);
      return { 
        data: result.rows.length > 0 ? result.rows[0] : null, 
        error: null 
      };
    }
  }

  /**
   * Create a new record
   */
  async create(tableName, data) {
    if (this.useSupabase && supabaseAdmin) {
      const { data: result, error } = await supabaseAdmin
        .from(tableName)
        .insert(data)
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase insert error: ${error.message}`);
      }

      return { data: result, error: null };
    } else {
      // Fallback to PostgreSQL - would need to be implemented
      throw new Error('PostgreSQL fallback not implemented for create');
    }
  }

  /**
   * Update a record
   */
  async update(tableName, id, data) {
    if (this.useSupabase && supabaseAdmin) {
      const { data: result, error } = await supabaseAdmin
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase update error: ${error.message}`);
      }

      return { data: result, error: null };
    } else {
      // Fallback to PostgreSQL - would need to be implemented
      throw new Error('PostgreSQL fallback not implemented for update');
    }
  }

  /**
   * Delete a record
   */
  async delete(tableName, id) {
    if (this.useSupabase && supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Supabase delete error: ${error.message}`);
      }

      return { error: null };
    } else {
      // Fallback to PostgreSQL
      await query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
      return { error: null };
    }
  }

  /**
   * Count records with optional filtering
   */
  async count(tableName, where = {}) {
    if (this.useSupabase && supabaseAdmin) {
      let supabaseQuery = supabaseAdmin.from(tableName).select('*', { count: 'exact', head: true });

      // Apply filters
      Object.entries(where).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          supabaseQuery = supabaseQuery.eq(key, value);
        }
      });

      const { count, error } = await supabaseQuery;

      if (error) {
        throw new Error(`Supabase count error: ${error.message}`);
      }

      return { count, error: null };
    } else {
      // Fallback to PostgreSQL
      const result = await query(`SELECT COUNT(*) as count FROM ${tableName}`, []);
      return { count: parseInt(result.rows[0].count), error: null };
    }
  }
}

module.exports = new DatabaseHelper();