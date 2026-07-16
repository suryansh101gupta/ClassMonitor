import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { toast } from 'react-toastify';
import './AttendanceDashboard.css';

const AttendanceDashboard = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { backendUrl, userData, isLoggedin } = useContext(AppContext);

  /* ─── Summary State ─── */
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  /* ─── Detail / Range State ─── */
  const [fromDate, setFromDate]   = useState('');
  const [toDate, setToDate]       = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [detailData, setDetailData]   = useState([]);
  const [detailSubjects, setDetailSubjects] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');  // 'summary' | 'range'

  // ─── Auth guard ───
  useEffect(() => {
    if (!isLoggedin) navigate('/login');
  }, [isLoggedin]);

  // ─── Fetch summary on mount ───
  useEffect(() => {
    if (!isLoggedin) return;
    const fetchSummary = async () => {
      try {
        setSummaryLoading(true);
        const { data } = await axios.get(`${backendUrl}/user/attendance-summary`, { withCredentials: true });
        if (data.success) setSummary(data);
        else toast.error(data.message || 'Could not load attendance summary');
      } catch (e) {
        toast.error('Error loading attendance summary');
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummary();
  }, [isLoggedin]);

  // ─── Fetch detail range ───
  const fetchDetail = async () => {
    if (!fromDate || !toDate) { toast.error('Please select both From and To dates'); return; }
    if (fromDate > toDate) { toast.error('From date must be before To date'); return; }
    try {
      setDetailLoading(true);
      const params = { from_date: fromDate, to_date: toDate };
      if (filterSubject) params.subject_id = filterSubject;
      const { data } = await axios.get(`${backendUrl}/user/attendance-detail`, { params, withCredentials: true });
      if (data.success) {
        setDetailData(data.data);
        setDetailSubjects(data.subjects || []);
      } else {
        toast.error(data.message || 'Could not load detail');
      }
    } catch (e) {
      toast.error('Error loading attendance detail');
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Helpers ───
  const pctColor = (pct) => {
    if (pct >= 75) return '#22c55e';
    if (pct >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const fmtDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const fmtTime = (t) => {
    if (!t) return '-';
    // t is "HH:MM:SS"
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    return `${hr % 12 || 12}:${m} ${ampm}`;
  };

  // Group detail records by date then subject for table display
  const groupedByDate = {};
  detailData.forEach(r => {
    const d = r.lecture_date?.split('T')[0] || String(r.lecture_date).slice(0,10);
    if (!groupedByDate[d]) groupedByDate[d] = [];
    groupedByDate[d].push(r);
  });

  // Per-subject stats for detail range
  const detailSubjectStats = {};
  detailData.forEach(r => {
    const key = r.subject_id;
    if (!detailSubjectStats[key]) {
      detailSubjectStats[key] = { subject_name: r.subject_name, total: 0, attended: 0 };
    }
    detailSubjectStats[key].total += 1;
    if (r.status === 1) detailSubjectStats[key].attended += 1;
  });

  const content = (
    <div className={isEmbedded ? "w-full" : "att-container"}>
        {/* Page Header */}
        <div className="att-page-header">
          <div className="att-page-header-left">
            <div className="att-badge"><i className="ri-bar-chart-grouped-line" /></div>
            <div>
              <h1 className="att-page-title">My Attendance</h1>
              <p className="att-page-sub">
                {userData?.name ? `${userData.name} · ` : ''}
                Track your lecture attendance across all subjects
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="att-tabs">
          <button
            className={`att-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            <i className="ri-bar-chart-2-line" /> Overall Summary
          </button>
          <button
            className={`att-tab-btn ${activeTab === 'range' ? 'active' : ''}`}
            onClick={() => setActiveTab('range')}
          >
            <i className="ri-calendar-line" /> Date Range View
          </button>
        </div>

        {/* ══════════ SUMMARY TAB ══════════ */}
        {activeTab === 'summary' && (
          <div className="att-tab-content">
            {summaryLoading ? (
              <div className="att-loading">
                <div className="att-spinner" />
                <p>Loading your attendance…</p>
              </div>
            ) : summary ? (
              <>
                {/* Overall Stats Cards */}
                <div className="att-stats-grid">
                  <div className="att-stat-card att-stat-total">
                    <div className="att-stat-icon"><i className="ri-book-open-line" /></div>
                    <div className="att-stat-value">{summary.overall.total_lectures}</div>
                    <div className="att-stat-label">Total Lectures</div>
                  </div>
                  <div className="att-stat-card att-stat-attended">
                    <div className="att-stat-icon"><i className="ri-checkbox-circle-line" /></div>
                    <div className="att-stat-value">{summary.overall.attended_lectures}</div>
                    <div className="att-stat-label">Attended</div>
                  </div>
                  <div className="att-stat-card att-stat-absent">
                    <div className="att-stat-icon"><i className="ri-close-circle-line" /></div>
                    <div className="att-stat-value">
                      {summary.overall.total_lectures - summary.overall.attended_lectures}
                    </div>
                    <div className="att-stat-label">Absent</div>
                  </div>
                  <div className="att-stat-card att-stat-pct" style={{ '--pct-color': pctColor(summary.overall.percentage) }}>
                    <div className="att-stat-icon"><i className="ri-percent-line" /></div>
                    <div className="att-stat-value" style={{ color: pctColor(summary.overall.percentage) }}>
                      {summary.overall.percentage}%
                    </div>
                    <div className="att-stat-label">Overall Attendance</div>
                  </div>
                </div>

                {/* Subject-wise breakdown */}
                <div className="att-section-header">
                  <h2 className="att-section-title">Subject-wise Breakdown</h2>
                </div>
                {summary.subjects.length === 0 ? (
                  <div className="att-empty">No attendance data available yet.</div>
                ) : (
                  <div className="att-subject-grid">
                    {summary.subjects.map(sub => (
                      <div className="att-subject-card" key={sub.subject_id}>
                        <div className="att-subject-header">
                          <span className="att-subject-name">{sub.subject_name}</span>
                          <span
                            className="att-subject-pct"
                            style={{ color: pctColor(sub.percentage), borderColor: pctColor(sub.percentage) }}
                          >
                            {sub.percentage}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="att-progress-track">
                          <div
                            className="att-progress-fill"
                            style={{
                              width: `${sub.percentage}%`,
                              background: pctColor(sub.percentage),
                            }}
                          />
                        </div>

                        <div className="att-subject-counts">
                          <span className="att-count-present">
                            <i className="ri-check-line" /> {sub.attended_lectures} Present
                          </span>
                          <span className="att-count-absent">
                            <i className="ri-close-line" /> {sub.total_lectures - sub.attended_lectures} Absent
                          </span>
                          <span className="att-count-total">
                            <i className="ri-stack-line" /> {sub.total_lectures} Total
                          </span>
                        </div>

                        {/* Shortfall or surplus message */}
                        {sub.percentage < 75 && sub.total_lectures > 0 && (() => {
                          // lectures needed to reach 75%
                          const need = Math.ceil(0.75 * sub.total_lectures - sub.attended_lectures);
                          return (
                            <div className="att-warning-chip">
                              <i className="ri-error-warning-line" />
                              Attend {need} more lecture{need !== 1 ? 's' : ''} to reach 75%
                            </div>
                          );
                        })()}
                        {sub.percentage >= 75 && sub.total_lectures > 0 && (() => {
                          // how many you can miss and still stay ≥75%
                          const canMiss = Math.floor((sub.attended_lectures - 0.75 * sub.total_lectures) / 0.75);
                          if (canMiss <= 0) return null;
                          return (
                            <div className="att-safe-chip">
                              <i className="ri-shield-check-line" />
                              Safe to miss {canMiss} lecture{canMiss !== 1 ? 's' : ''}
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="att-empty">Could not load attendance data.</div>
            )}
          </div>
        )}

        {/* ══════════ DATE RANGE TAB ══════════ */}
        {activeTab === 'range' && (
          <div className="att-tab-content">
            {/* Filter Controls */}
            <div className="att-filter-bar">
              <div className="att-filter-group">
                <label className="att-label">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="att-input"
                />
              </div>
              <div className="att-filter-group">
                <label className="att-label">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="att-input"
                />
              </div>
              <div className="att-filter-group">
                <label className="att-label">Subject (optional)</label>
                <select
                  value={filterSubject}
                  onChange={e => setFilterSubject(e.target.value)}
                  className="att-input"
                >
                  <option value="">All Subjects</option>
                  {(summary?.subjects || []).map(s => (
                    <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>
                  ))}
                </select>
              </div>
              <div className="att-filter-group att-filter-action">
                <label className="att-label">&nbsp;</label>
                <button
                  className="att-fetch-btn"
                  onClick={fetchDetail}
                  disabled={detailLoading}
                >
                  {detailLoading
                    ? <><div className="att-spinner-sm" /> Loading…</>
                    : <><i className="ri-search-line" /> Fetch</>
                  }
                </button>
              </div>
            </div>

            {/* Range Stats */}
            {detailData.length > 0 && (
              <>
                <div className="att-section-header">
                  <h2 className="att-section-title">Range Summary</h2>
                  <span className="att-date-range-label">
                    {fmtDate(fromDate)} — {fmtDate(toDate)}
                  </span>
                </div>
                <div className="att-range-stats">
                  {Object.values(detailSubjectStats).map(s => (
                    <div className="att-range-stat-chip" key={s.subject_name}>
                      <span className="att-chip-subject">{s.subject_name}</span>
                      <span className="att-chip-val"
                        style={{ color: pctColor(s.total > 0 ? parseFloat(((s.attended / s.total) * 100).toFixed(1)) : 0) }}>
                        {s.attended}/{s.total}
                      </span>
                      <span className="att-chip-pct"
                        style={{ color: pctColor(s.total > 0 ? parseFloat(((s.attended / s.total) * 100).toFixed(1)) : 0) }}>
                        {s.total > 0 ? ((s.attended / s.total) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Lecture-wise Table */}
                <div className="att-section-header">
                  <h2 className="att-section-title">Lecture Log</h2>
                </div>
                <div className="att-table-wrap">
                  <table className="att-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Subject</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailData.map(r => (
                        <tr key={r.lecture_id}>
                          <td>{fmtDate(r.lecture_date)}</td>
                          <td><span className="att-sub-tag">{r.subject_name}</span></td>
                          <td>{fmtTime(r.start_time)}</td>
                          <td>{fmtTime(r.end_time)}</td>
                          <td>
                            {r.status === 1 ? (
                              <span className="att-status att-status-present">
                                <i className="ri-check-line" /> Present
                              </span>
                            ) : r.status === 0 ? (
                              <span className="att-status att-status-absent">
                                <i className="ri-close-line" /> Absent
                              </span>
                            ) : (
                              <span className="att-status att-status-na">
                                — N/A
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {!detailLoading && detailData.length === 0 && fromDate && toDate && (
              <div className="att-empty">
                <i className="ri-calendar-close-line" style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }} />
                No lectures found for the selected range.
              </div>
            )}

            {!fromDate && !toDate && (
              <div className="att-empty">
                <i className="ri-calendar-2-line" style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }} />
                Select a date range and click <strong>Fetch</strong> to view your attendance.
              </div>
        )}
      </div>
      )}
    </div>
  );

  if (isEmbedded) return content;

  return (
    <div className="att-page">
      <Navbar />
      {content}
    </div>
  );
};

export default AttendanceDashboard;
