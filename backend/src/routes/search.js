import express from 'express';
import { supabase } from '../config/supabaseClient.js';

const router = express.Router();

/**
 * POST /api/v1/search
 * Search invoices with filters
 */
router.post('/', async (req, res) => {
  try {
    const { query, filters = {}, skip = 0, limit = 25 } = req.body;
    const skipNum = parseInt(skip) || 0;
    const limitNum = parseInt(limit) || 25;

    let sqlQuery = supabase
      .from('invoices')
      .select('*', { count: 'exact' });

    // Search in multiple fields
    if (query) {
      sqlQuery = sqlQuery.or(
        `invoice_number.ilike.%${query}%,vendor_name.ilike.%${query}%,vendor_gst.ilike.%${query}%`
      );
    }

    // Apply filters
    if (filters.status) {
      sqlQuery = sqlQuery.eq('status', filters.status);
    }
    if (filters.vendor) {
      sqlQuery = sqlQuery.ilike('vendor_name', `%${filters.vendor}%`);
    }
    if (filters.minAmount) {
      sqlQuery = sqlQuery.gte('total_amount', filters.minAmount);
    }
    if (filters.maxAmount) {
      sqlQuery = sqlQuery.lte('total_amount', filters.maxAmount);
    }
    if (filters.startDate) {
      sqlQuery = sqlQuery.gte('invoice_date', filters.startDate);
    }
    if (filters.endDate) {
      sqlQuery = sqlQuery.lte('invoice_date', filters.endDate);
    }

    // Execute query
    const { data, error, count } = await sqlQuery
      .order('uploaded_at', { ascending: false })
      .range(skipNum, skipNum + limitNum - 1);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    return res.json({
      success: true,
      data,
      pagination: {
        skip: skipNum,
        limit: limitNum,
        total: count
      }
    });
  } catch (error) {
    console.error('Error searching invoices:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
