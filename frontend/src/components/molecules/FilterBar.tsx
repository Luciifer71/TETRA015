import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { Button } from '../atoms/Button';
import { useInvoiceStore } from '../../store/useInvoiceStore';

export const FilterBar: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    selectedRiskFilter,
    setRiskFilter,
    selectedStatusFilter,
    setStatusFilter,
  } = useInvoiceStore();

  const riskOptions = [
    { value: 'ALL', label: 'All Risk Levels' },
    { value: 'LOW', label: 'Low Risk' },
    { value: 'MEDIUM', label: 'Medium Risk' },
    { value: 'HIGH', label: 'High Risk' },
    { value: 'CRITICAL', label: 'Critical Risk' },
  ];

  const statusOptions = [
    { value: 'ALL', label: 'All Audit Statuses' },
    { value: 'PENDING', label: 'Pending Review' },
    { value: 'PROCESSED', label: 'Processed' },
    { value: 'FLAGGED', label: 'Flagged' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedRiskFilter !== 'ALL' || selectedStatusFilter !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setRiskFilter('ALL');
    setStatusFilter('ALL');
  };

  return (
    <div className="p-4 bg-white dark:bg-[#1c1c22] border border-slate-300 dark:border-[#8D9797]/25 rounded-2xl shadow-md dark:shadow-2xl space-y-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="w-full md:flex-1">
          <Input
            placeholder="Search by Invoice #, Vendor Name, or GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
          />
        </div>

        {/* Filters Grid */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="w-full sm:w-48">
            <Select
              options={riskOptions}
              value={selectedRiskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              options={statusOptions}
              value={selectedStatusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="md"
              onClick={resetFilters}
              leftIcon={<RotateCcw className="w-4 h-4" />}
              className="shrink-0 w-full sm:w-auto border-slate-300 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
