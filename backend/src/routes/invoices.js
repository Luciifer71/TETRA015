import express from 'express';
import { supabase } from '../config/supabaseClient.js';

const router = express.Router();

/**
 * GET /api/v1/invoices
 * List all invoices with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const { skip = 0, limit = 25, status, vendor, riskLevel } = req.query;
    const skipNum = parseInt(skip) || 0;
    const limitNum = parseInt(limit) || 25;

    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (vendor) {
      query = query.ilike('vendor_name', `%${vendor}%`);
    }

    // Execute query with pagination
    const { data, error, count } = await query
      .order('uploaded_at', { ascending: false })
      .range(skipNum, skipNum + limitNum - 1);

    if (error) {
      console.error('Supabase error:', error);
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
    console.error('Error fetching invoices:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/invoices/:id
 * Get single invoice with risk report, audit trail, and exceptions
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Get risk report
    const { data: riskReport } = await supabase
      .from('risk_reports')
      .select('*')
      .eq('invoice_id', id)
      .single();

    // Get audit trail
    const { data: auditTrail } = await supabase
      .from('audit_trail')
      .select('*')
      .eq('invoice_id', id)
      .order('created_at', { ascending: false });

    // Get exceptions
    const { data: exceptions } = await supabase
      .from('exceptions')
      .select('*')
      .eq('invoice_id', id);

    return res.json({
      success: true,
      data: {
        invoice,
        riskReport: riskReport || null,
        auditTrail: auditTrail || [],
        exceptions: exceptions || []
      }
    });
  } catch (error) {
    console.error('Error fetching invoice detail:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/v1/invoices/:id
 * Update invoice status or notes
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['PENDING', 'PROCESSING', 'PROCESSED', 'FLAGGED', 'APPROVED', 'REJECTED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Update invoice
    const updateData = {
      updated_at: new Date().toISOString()
    };
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Log to audit trail
    const userEmail = req.user?.email || 'system';
    await supabase
      .from('audit_trail')
      .insert({
        invoice_id: id,
        action: 'INVOICE_UPDATED',
        details: {
          status,
          notes,
          updatedAt: new Date().toISOString()
        },
        performed_by: userEmail
      });

    return res.json({
      success: true,
      data: data[0]
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/v1/invoices/:id
 * Soft delete invoice (mark as deleted, don't actually remove)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'REJECTED',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Log deletion
    const userEmail = req.user?.email || 'system';
    await supabase
      .from('audit_trail')
      .insert({
        invoice_id: id,
        action: 'INVOICE_DELETED',
        details: { deletedAt: new Date().toISOString() },
        performed_by: userEmail
      });

    return res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
