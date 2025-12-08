import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { adminService } from '../services/api';
import { formatDate, formatNumber } from '../i18n';
import toast from 'react-hot-toast';
import {
  Users,
  Database,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Upload,
  TrendingUp,
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function Dashboard() {
  const { t } = useTranslation(['dashboard', 'common']);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await adminService.getStats();
      setStats(response.data);
    } catch (error) {
      toast.error(t('error'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const statusCards = [
    {
      label: t('cards.totalHcps'),
      value: stats?.hcps?.total || 0,
      icon: Database,
      color: 'bg-blue-500'
    },
    {
      label: t('cards.validated'),
      value: stats?.hcps?.byStatus?.VALIDADO || 0,
      icon: CheckCircle2,
      color: 'bg-green-500'
    },
    {
      label: t('common:status.aRevisar'),
      value: stats?.hcps?.byStatus?.A_REVISAR || 0,
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      label: t('common:status.rejeitado'),
      value: stats?.hcps?.byStatus?.REJEITADO || 0,
      icon: XCircle,
      color: 'bg-red-500'
    }
  ];

  const calculatePercentage = (value) => {
    const total = stats?.hcps?.total || 1;
    return ((value / total) * 100).toFixed(1);
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'VALIDADO': t('common:status.validado'),
      'A_REVISAR': t('common:status.aRevisar'),
      'REJEITADO': t('common:status.rejeitado'),
      'CORRIGIR': t('common:status.corrigir'),
      'DUPLICADO': t('common:status.duplicado')
    };
    return statusMap[status] || status;
  };

  const getUploadStatusLabel = (status) => {
    const statusMap = {
      'CONCLUIDO': t('common:status.concluido'),
      'ERRO': t('common:status.erro'),
      'PROCESSANDO': t('common:status.processando'),
      'RECEBIDO': t('common:status.recebido')
    };
    return statusMap[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 mt-1">{t('subtitle')}</p>
        </div>
        <button onClick={fetchStats} className="btn-secondary">
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('common:buttons.refresh')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusCards.map((card, idx) => (
          <div key={idx} className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-3xl font-bold mt-1">{formatNumber(card.value)}</p>
                </div>
                <div className={`p-3 rounded-full ${card.color}`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              {card.label !== t('cards.totalHcps') && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${card.color}`}
                      style={{ width: `${calculatePercentage(card.value)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {calculatePercentage(card.value)}% {t('stats.ofTotal')}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold">{t('sections.statusDistribution')}</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {Object.entries(stats?.hcps?.byStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{getStatusLabel(status)}</span>
                      <span className="text-sm text-gray-500">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          status === 'VALIDADO' ? 'bg-green-500' :
                          status === 'A_REVISAR' ? 'bg-yellow-500' :
                          status === 'REJEITADO' ? 'bg-red-500' :
                          status === 'DUPLICADO' ? 'bg-purple-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${calculatePercentage(count)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Users Stats */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold">{t('sections.systemUsers')}</h3>
          </div>
          <div className="card-body">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-100 rounded-full">
                  <Users className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.users?.active || 0}</p>
                  <p className="text-sm text-gray-500">{t('stats.activeUsers')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium text-gray-400">{stats?.users?.total || 0}</p>
                <p className="text-sm text-gray-400">{t('stats.totalUsers')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('sections.recentUploads')}
          </h3>
        </div>
        <div className="table-container">
          {stats?.recentUploads?.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('table.file')}</th>
                  <th>{t('table.user')}</th>
                  <th>{t('table.status')}</th>
                  <th>{t('table.records')}</th>
                  <th>{t('table.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recentUploads.map((upload) => (
                  <tr key={upload._id}>
                    <td className="font-medium">{upload.filename}</td>
                    <td>{upload.user}</td>
                    <td>
                      <span className={`badge ${
                        upload.status === 'CONCLUIDO' ? 'badge-success' :
                        upload.status === 'ERRO' ? 'badge-error' :
                        'badge-warning'
                      }`}>
                        {getUploadStatusLabel(upload.status)}
                      </span>
                    </td>
                    <td>{upload.records_processed}</td>
                    <td className="text-sm text-gray-500">
                      {formatDate(upload.started_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {t('empty.noUploads')}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body text-center">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto" />
            <p className="text-3xl font-bold mt-2">
              {stats?.hcps?.total > 0
                ? ((stats?.hcps?.byStatus?.VALIDADO || 0) / stats.hcps.total * 100).toFixed(1)
                : 0}%
            </p>
            <p className="text-sm text-gray-500 mt-1">{t('stats.validationRate')}</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto" />
            <p className="text-3xl font-bold mt-2">
              {(stats?.hcps?.byStatus?.A_REVISAR || 0) + (stats?.hcps?.byStatus?.CORRIGIR || 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">{t('cards.pendingReview')}</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <Database className="h-8 w-8 text-purple-500 mx-auto" />
            <p className="text-3xl font-bold mt-2">
              {stats?.hcps?.byStatus?.DUPLICADO || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">{t('cards.duplicates')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
