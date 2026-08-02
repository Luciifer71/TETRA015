import express from 'express';
import { supabase } from '../config/supabaseClient.js';

const router = express.Router();

/**
 * GET /api/v1/dashboard/summary
 * Get dashboard summary statistics
 */
router.get('/summary', async (req, res) => {
  try {
    // Get all invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, status, total_amount');

    if (invoicesError) {
      return res.status(400).json({
        success: false,
        error: invoicesError.message
      });
    }

    // Get all risk reports
    const { data: risks } = await supabase
      .from('risk_reports')
      .select('risk_level');

    // Calculate stats
    const totalCount = invoices?.length || 0;
    const processedCount = invoices?.filter(i => i.status === 'PROCESSED').length || 0;
    const pendingCount = invoices?.filter(i => i.status === 'PENDING').length || 0;
    const flaggedCount = invoices?.filter(i => i.status === 'FLAGGED').length || 0;
    const approvedCount = invoices?.filter(i => i.status === 'APPROVED').length || 0;
    const totalAmount = invoices?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0;

    // Calculate risk distribution
    const riskDistribution = {
      MINIMAL: 0,
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0
    };
    
    risks?.forEach(r => {
      if (r.risk_level && riskDistribution.hasOwnProperty(r.risk_level)) {
        riskDistribution[r.risk_level]++;
      }
    });

    return res.json({
      success: true,
      data: {
        total_invoices: totalCount,
        processed: processedCount,
        pending: pendingCount,
        flagged: flaggedCount,
        approved: approvedCount,
        total_amount: totalAmount,
        risk_distribution: riskDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/dashboard/recent-invoices
 * Get 10 most recent invoices
 */
router.get('/recent-invoices', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, vendor_name, total_amount, status, uploaded_at')
      .order('uploaded_at', { ascending: false })
      .limit(10);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching recent invoices:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/dashboard/risk-distribution
 * Get detailed risk distribution with invoice counts
 */
router.get('/risk-distribution', async (req, res) => {
  try {
    const { data: risks, error } = await supabase
      .from('risk_reports')
      .select('risk_level, invoice_id');

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    const distribution = {
      MINIMAL: [],
      LOW: [],
      MEDIUM: [],
      HIGH: [],
      CRITICAL: []
    };

    risks?.forEach(r => {
      if (r.risk_level && distribution.hasOwnProperty(r.risk_level)) {
        distribution[r.risk_level].push(r.invoice_id);
      }
    });

    return res.json({
      success: true,
      data: {
        MINIMAL: distribution.MINIMAL.length,
        LOW: distribution.LOW.length,
        MEDIUM: distribution.MEDIUM.length,
        HIGH: distribution.HIGH.length,
        CRITICAL: distribution.CRITICAL.length
      }
    });
  } catch (error) {
    console.error('Error fetching risk distribution:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/dashboard/vendor-stats
 * Get top vendors and vendor statistics
 */
router.get('/vendor-stats', async (req, res) => {
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('vendor_name, total_amount, status');

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Calculate vendor stats
    const vendorStats = {};

    invoices?.forEach(inv => {
      if (!vendorStats[inv.vendor_name]) {
        vendorStats[inv.vendor_name] = {
          count: 0,
          total_amount: 0,
          processed: 0,
          pending: 0
        };
      }
      vendorStats[inv.vendor_name].count++;
      vendorStats[inv.vendor_name].total_amount += inv.total_amount || 0;
      if (inv.status === 'PROCESSED') vendorStats[inv.vendor_name].processed++;
      if (inv.status === 'PENDING') vendorStats[inv.vendor_name].pending++;
    });

    // Sort by total amount
    const topVendors = Object.entries(vendorStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 10);

    return res.json({
      success: true,
      data: {
        top_vendors: topVendors,
        total_unique_vendors: Object.keys(vendorStats).length
      }
    });
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/dashboard/high-risk-invoices
 * Get invoices with HIGH or CRITICAL risk
 */
router.get('/high-risk-invoices', async (req, res) => {
  try {
    const { data: risks, error } = await supabase
      .from('risk_reports')
      .select('invoice_id, risk_score, risk_level, risk_factors')
      .in('risk_level', ['HIGH', 'CRITICAL']);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Get invoice details for these risk reports
    const invoiceIds = risks?.map(r => r.invoice_id) || [];

    let invoiceData = [];
    if (invoiceIds.length > 0) {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, vendor_name, total_amount, status')
        .in('id', invoiceIds);

      // Merge with risk data
      invoiceData = invoices?.map(inv => {
        const risk = risks.find(r => r.invoice_id === inv.id);
        return {
          ...inv,
          risk_score: risk?.risk_score,
          risk_level: risk?.risk_level,
          risk_factors: risk?.risk_factors
        };
      }) || [];
    }

    return res.json({
      success: true,
      data: invoiceData
    });
  } catch (error) {
    console.error('Error fetching high-risk invoices:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
