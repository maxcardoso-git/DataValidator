import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { hcpService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Search as SearchIcon,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  GitCompare,
  Loader2
} from 'lucide-react';

export default function Search() {
  const { t } = useTranslation(['search', 'common']);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const STATUS_OPTIONS = [
    { value: '', label: t('form.allStatus') },
    { value: 'A_REVISAR', label: t('common:status.aRevisar') },
    { value: 'VALIDADO', label: t('common:status.validado') },
    { value: 'REJEITADO', label: t('common:status.rejeitado') },
    { value: 'CORRIGIR', label: t('common:status.corrigir') },
    { value: 'DUPLICADO', label: t('common:status.duplicado') }
  ];

  const SEARCH_TYPES = [
    { value: 'todos', label: t('form.searchTypeAll') },
    { value: 'nome', label: t('form.searchTypeName') },
    { value: 'crm', label: t('form.searchTypeCrm') },
    { value: 'id', label: t('form.searchTypeId') },
    { value: 'telefone', label: t('form.searchTypePhone') },
    { value: 'email', label: t('form.searchTypeEmail') },
    { value: 'endereco', label: t('form.searchTypeAddress') },
    { value: 'organizacao', label: t('form.searchTypeOrganization') },
    { value: 'cnes', label: t('form.searchTypeCnes') },
    { value: 'cnpj', label: t('form.searchTypeCnpj') }
  ];

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState(searchParams.get('type') || 'nome');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [selectedIds, setSelectedIds] = useState([]);
  const limit = 20;

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = {
        q: query,
        type: searchType,
        status: status || undefined,
        limit,
        offset: (page - 1) * limit
      };

      const response = await hcpService.search(params);
      setResults(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      toast.error(t('errors.loadFailed'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchParams({ q: query, type: searchType, status, page: 1 });
    fetchResults();
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setSearchParams({ q: query, type: searchType, status, page: newPage });
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (selectedIds.length === 2) {
      navigate(`/compare?id_a=${selectedIds[0]}&id_b=${selectedIds[1]}`);
    }
  };

  const getStatusBadge = (statusVal) => {
    const styles = {
      'VALIDADO': 'badge-success',
      'A_REVISAR': 'badge-warning',
      'REJEITADO': 'badge-error',
      'CORRIGIR': 'badge-info',
      'DUPLICADO': 'badge-gray'
    };
    return styles[statusVal] || 'badge-gray';
  };

  const getStatusLabel = (statusVal) => {
    const statusMap = {
      'VALIDADO': t('common:status.validado'),
      'A_REVISAR': t('common:status.aRevisar'),
      'REJEITADO': t('common:status.rejeitado'),
      'CORRIGIR': t('common:status.corrigir'),
      'DUPLICADO': t('common:status.duplicado')
    };
    return statusMap[statusVal] || statusVal;
  };

  const getScoreColor = (score) => {
    if (score >= 0.85) return 'score-high';
    if (score >= 0.6) return 'score-medium';
    return 'score-low';
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-500 mt-1">{t('subtitle')}</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('form.placeholder')}
                  className="form-input w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Search Type */}
            <div className="w-full md:w-52">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="form-input w-full py-2.5 border border-gray-300 rounded-lg"
              >
                {SEARCH_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="form-input w-full py-2.5 border border-gray-300 rounded-lg"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <button type="submit" className="btn-primary px-6">
              <SearchIcon className="h-4 w-4 mr-2" />
              {t('common:buttons.search')}
            </button>
          </div>
        </div>
      </form>

      {/* Compare Button */}
      {hasPermission('COMPARE_HCP') && selectedIds.length === 2 && (
        <div className="flex justify-end">
          <button onClick={handleCompare} className="btn-secondary">
            <GitCompare className="h-4 w-4 mr-2" />
            {t('compare.button')}
          </button>
        </div>
      )}

      {/* Results Table */}
      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {query ? t('empty.noResults') : t('empty.typeToSearch')}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  {hasPermission('COMPARE_HCP') && (
                    <th className="w-12">
                      <span className="sr-only">{t('table.select')}</span>
                    </th>
                  )}
                  <th>{t('table.id')}</th>
                  <th>{t('table.name')}</th>
                  <th>{t('table.primaryCrm')}</th>
                  <th>{t('table.score')}</th>
                  <th>{t('table.status')}</th>
                  <th className="w-24">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.map((hcp) => (
                  <tr key={hcp.id_hcp}>
                    {hasPermission('COMPARE_HCP') && (
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(hcp.id_hcp)}
                          onChange={() => handleSelect(hcp.id_hcp)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                    )}
                    <td className="font-mono text-xs">{hcp.id_hcp}</td>
                    <td className="font-medium text-gray-900">{hcp.nome_medico}</td>
                    <td>{hcp.crm_principal}</td>
                    <td>
                      <span className={`font-medium ${getScoreColor(hcp.score_qualidade)}`}>
                        {(hcp.score_qualidade * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(hcp.status_validacao)}`}>
                        {getStatusLabel(hcp.status_validacao)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/hcp/${hcp.id_hcp}`)}
                        className="text-primary-600 hover:text-primary-800"
                        title={t('table.viewDetails')}
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {t('pagination.showing')} {((page - 1) * limit) + 1} {t('pagination.to')} {Math.min(page * limit, total)} {t('pagination.of')} {total} {t('pagination.records')}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="btn-secondary p-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600">
                {t('pagination.page')} {page} {t('pagination.of')} {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="btn-secondary p-2"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
