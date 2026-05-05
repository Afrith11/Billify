import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { 
  BarChart, 
  Search, 
  Calendar, 
  Download, 
  Printer, 
  TrendingUp,
  Package,
  Users,
  Percent
} from 'lucide-react';
import PrintHeader from '../components/PrintHeader';

const SalesReport = () => {
  const { advancedSales, refreshAdvancedSales } = useStore();
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    searchTerm: ''
  });

  useEffect(() => {
    refreshAdvancedSales({ fromDate: filters.fromDate, toDate: filters.toDate });
  }, [filters.fromDate, filters.toDate]);

  const filteredSales = advancedSales.filter(s => 
    s.customer_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
    s.item_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
    s.invoice_number.toLowerCase().includes(filters.searchTerm.toLowerCase())
  );

  const totalSales = (filteredSales || []).reduce((sum, s) => sum + s.item_total, 0);
  const totalGst = (filteredSales || []).reduce((sum, s) => sum + s.gst_amount, 0);
  const totalDiscount = (filteredSales || []).reduce((sum, s) => sum + s.discount_amount, 0);

  // Grouping for top products
  const productSales = (filteredSales || []).reduce((acc, s) => {
    acc[s.item_name] = (acc[s.item_name] || 0) + s.item_total;
    return acc;
  }, {});
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <PrintHeader title="Sales Performance Report" />
      
      {/* Analytics Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #4f46e5, #818cf8)', color: 'white', border: 'none' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', opacity: 0.9 }}>GROSS SALES</span>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', margin: '0.5rem 0' }}>₹{totalSales.toLocaleString()}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', opacity: 0.8 }}>
            <TrendingUp size={14} /> Overall Performance
          </div>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>TOTAL GST</span>
          <h2 style={{ margin: '0.5rem 0', color: 'var(--accent-primary)' }}>₹{totalGst.toLocaleString()}</h2>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Tax Collection</p>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>DISCOUNTS</span>
          <h2 style={{ margin: '0.5rem 0', color: '#ef4444' }}>₹{totalDiscount.toLocaleString()}</h2>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Savings Given</p>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>AVG TICKET SIZE</span>
          <h2 style={{ margin: '0.5rem 0' }}>₹{(filteredSales.length ? (totalSales / filteredSales.length).toFixed(2) : 0).toLocaleString()}</h2>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Per Item Sale</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        {/* Sales Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Filter by customer, item, or invoice..." 
                  style={{ paddingLeft: '2.5rem' }}
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                />
              </div>
              <input type="date" style={{ width: '160px' }} value={filters.fromDate} onChange={(e) => setFilters({...filters, fromDate: e.target.value})} />
              <input type="date" style={{ width: '160px' }} value={filters.toDate} onChange={(e) => setFilters({...filters, toDate: e.target.value})} />
              <button className="btn btn-outline" onClick={() => window.print()}><Printer size={18} /></button>
            </div>
          </div>

          <div className="table-container" style={{ margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ fontWeight: '700' }}>#{sale.invoice_number}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{sale.bill_date}</div>
                    </td>
                    <td style={{ fontWeight: '600' }}>{sale.customer_name}</td>
                    <td>{sale.item_name}</td>
                    <td style={{ fontWeight: '600' }}>{sale.quantity}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--accent-primary)' }}>
                      ₹{sale.item_total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <Package size={20} color="var(--accent-primary)" /> Top Products
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {topProducts.map(([name, total], idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>{name}</div>
                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', marginTop: '4px' }}>
                      <div style={{ 
                        width: `${(total / topProducts[0][1]) * 100}%`, 
                        height: '100%', 
                        background: 'var(--accent-primary)', 
                        borderRadius: '3px' 
                      }}></div>
                    </div>
                  </div>
                  <div style={{ fontWeight: '800', marginLeft: '1rem', fontSize: '0.85rem' }}>₹{total.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ background: 'white', minHeight: '300px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart size={20} color="var(--accent-primary)" /> Sales Trend
            </h3>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              justifyContent: 'space-between', 
              height: '180px', 
              gap: '8px',
              padding: '0 10px'
            }}>
              {(() => {
                const max = Math.max(...(advancedSales || []).map(s => s.item_total), 1);
                // Group by date for the chart
                const dailyTotals = (filteredSales || []).reduce((acc, s) => {
                  acc[s.bill_date] = (acc[s.bill_date] || 0) + s.item_total;
                  return acc;
                }, {});
                
                const dates = Object.keys(dailyTotals).sort();
                const displayDates = dates.slice(-7); // Last 7 days with data

                return displayDates.length > 0 ? displayDates.map(date => (
                  <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '100%', 
                      height: `${(dailyTotals[date] / Math.max(...Object.values(dailyTotals))) * 100}%`, 
                      background: 'linear-gradient(to top, var(--accent-primary), #818cf8)', 
                      borderRadius: '4px',
                      minHeight: '4px',
                      transition: 'height 0.5s ease-out',
                      position: 'relative'
                    }} title={`₹${dailyTotals[date].toLocaleString()}`}>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', transform: 'rotate(-45deg)', marginTop: '4px', whiteSpace: 'nowrap' }}>
                      {date.split('-').slice(1).reverse().join('/')}
                    </span>
                  </div>
                )) : (
                  <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Insufficient data for trend analysis.
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
