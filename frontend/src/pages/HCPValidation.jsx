import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { hcpService, reportService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime } from '../i18n';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Save,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  Building2,
  FileText,
  GitCompare,
  History,
  Loader2,
  Square,
  CheckSquare
} from 'lucide-react';

export default function HCPValidation() {
  const { t } = useTranslation(['hcp', 'common']);
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();

  const TABS = [
    { id: 'geral', label: t('tabs.general'), icon: User },
    { id: 'crm', label: t('tabs.crm'), icon: FileText },
    { id: 'enderecos', label: t('tabs.addresses'), icon: MapPin },
    { id: 'telefones', label: t('tabs.phones'), icon: Phone },
    { id: 'emails', label: t('tabs.emails'), icon: Mail },
    { id: 'organizacoes', label: t('tabs.organizations'), icon: Building2 },
    { id: 'info', label: t('tabs.additional'), icon: Info },
    { id: 'auditoria', label: t('tabs.audit'), icon: History }
  ];

  const DECISION_TYPES = [
    { value: 'VALIDAR', label: t('decision.actions.validate'), color: 'btn-success' },
    { value: 'CORRIGIR', label: t('decision.actions.correct'), color: 'btn-warning' },
    { value: 'REJEITAR', label: t('decision.actions.reject'), color: 'btn-danger' },
    { value: 'DUPLICADO', label: t('decision.actions.duplicate'), color: 'btn-secondary' }
  ];

  const [hcp, setHcp] = useState(null);
  const [validation, setValidation] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [activeTab, setActiveTab] = useState('geral');
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [savingDecision, setSavingDecision] = useState(false);
  const [decisionComment, setDecisionComment] = useState('');
  const [linkedHcpId, setLinkedHcpId] = useState('');

  const [selectedItems, setSelectedItems] = useState({
    crm: [],
    enderecos: [],
    telefones: [],
    emails: [],
    organizacoes: [],
    informacao_adicional: []
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hcpResponse, auditResponse] = await Promise.all([
        hcpService.getById(id),
        hcpService.getAudit(id)
      ]);

      setHcp(hcpResponse.data.hcp);
      setValidation(hcpResponse.data.validation);
      setDecisions(hcpResponse.data.decisions || []);
      setAuditoria(auditResponse.data.auditoria || []);
    } catch (error) {
      toast.error(t('errors.loadFailed'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const response = await hcpService.validate(id);
      setValidation({
        rules_results: response.data.rules_results,
        score_calculado: response.data.score_calculado
      });
      setHcp(prev => ({ ...prev, score_qualidade: response.data.score_calculado }));
      toast.success(t('messages.validationSuccess'));
    } catch (error) {
      toast.error(t('errors.validationFailed'));
      console.error(error);
    } finally {
      setValidating(false);
    }
  };

  const toggleItemSelection = (section, index) => {
    setSelectedItems(prev => {
      const current = prev[section] || [];
      const newSelection = current.includes(index)
        ? current.filter(i => i !== index)
        : [...current, index];
      return { ...prev, [section]: newSelection };
    });
  };

  const toggleAllItems = (section, items) => {
    setSelectedItems(prev => {
      const current = prev[section] || [];
      const allSelected = items?.length > 0 && current.length === items.length;
      return {
        ...prev,
        [section]: allSelected ? [] : items.map((_, idx) => idx)
      };
    });
  };

  const getTotalSelectedItems = () => {
    return Object.values(selectedItems).reduce((acc, arr) => acc + arr.length, 0);
  };

  const getSelectedItemsSummary = () => {
    const summary = [];
    if (selectedItems.crm.length > 0) {
      summary.push(`CRM: ${selectedItems.crm.map(i => `#${(hcp.crm?.[i]?.ordem || i + 1)}`).join(', ')}`);
    }
    if (selectedItems.enderecos.length > 0) {
      summary.push(`${t('tabs.addresses')}: ${selectedItems.enderecos.map(i => `#${(hcp.enderecos?.[i]?.ordem || i + 1)}`).join(', ')}`);
    }
    if (selectedItems.telefones.length > 0) {
      summary.push(`${t('tabs.phones')}: ${selectedItems.telefones.map(i => `#${(hcp.telefones?.[i]?.ordem || i + 1)}`).join(', ')}`);
    }
    if (selectedItems.emails.length > 0) {
      summary.push(`${t('tabs.emails')}: ${selectedItems.emails.map(i => `#${(hcp.emails?.[i]?.ordem || i + 1)}`).join(', ')}`);
    }
    if (selectedItems.organizacoes.length > 0) {
      summary.push(`${t('tabs.organizations')}: ${selectedItems.organizacoes.map(i => `#${(hcp.organizacoes?.[i]?.ordem || i + 1)}`).join(', ')}`);
    }
    if (selectedItems.informacao_adicional.length > 0) {
      summary.push(`${t('tabs.additional')}: ${selectedItems.informacao_adicional.map(i => `#${(hcp.informacao_adicional?.[i]?.ordem || i + 1)}`).join(', ')}`);
    }
    return summary;
  };

  // Função para extrair detalhes dos itens selecionados
  const buildItemDetails = () => {
    const details = {
      crm: [],
      enderecos: [],
      telefones: [],
      emails: [],
      organizacoes: [],
      informacao_adicional: []
    };

    // CRM
    selectedItems.crm.forEach(idx => {
      const crm = hcp.crm?.[idx];
      if (crm) {
        details.crm.push({
          index: idx,
          value: `${crm.inscricao}/${crm.estado}`,
          label: `CRM ${crm.inscricao}/${crm.estado}`
        });
      }
    });

    // Endereços
    selectedItems.enderecos.forEach(idx => {
      const end = hcp.enderecos?.[idx];
      if (end) {
        details.enderecos.push({
          index: idx,
          value: end.endereco || `${end.logradouro}, ${end.numero} - ${end.municipio}/${end.estado}`,
          label: `${t('tabs.addresses')} #${end.ordem || idx + 1}`
        });
      }
    });

    // Telefones
    selectedItems.telefones.forEach(idx => {
      const tel = hcp.telefones?.[idx];
      if (tel) {
        details.telefones.push({
          index: idx,
          value: tel.telefone,
          label: `${t('tabs.phones')} #${tel.ordem || idx + 1}: ${tel.telefone}`
        });
      }
    });

    // Emails
    selectedItems.emails.forEach(idx => {
      const email = hcp.emails?.[idx];
      if (email) {
        details.emails.push({
          index: idx,
          value: email.email,
          label: `${t('tabs.emails')} #${email.ordem || idx + 1}: ${email.email}`
        });
      }
    });

    // Organizações
    selectedItems.organizacoes.forEach(idx => {
      const org = hcp.organizacoes?.[idx];
      if (org) {
        details.organizacoes.push({
          index: idx,
          value: org.nome_fantasia || org.nome_razao,
          label: `${t('tabs.organizations')} #${org.ordem || idx + 1}: ${org.nome_fantasia || org.nome_razao}`
        });
      }
    });

    // Info Adicional
    selectedItems.informacao_adicional.forEach(idx => {
      const info = hcp.informacao_adicional?.[idx];
      if (info) {
        details.informacao_adicional.push({
          index: idx,
          value: info.nome || info.origem || '-',
          label: `${t('tabs.additional')} #${info.ordem || idx + 1}: ${info.nome || info.origem || '-'}`
        });
      }
    });

    return details;
  };

  const handleDecision = async (decisionType) => {
    if (decisionType === 'DUPLICADO' && !linkedHcpId) {
      toast.error(t('decision.relatedHcpRequired'));
      return;
    }

    setSavingDecision(true);
    try {
      const itemDetails = buildItemDetails();

      await hcpService.decision(id, {
        decision_type: decisionType,
        linked_hcp_id: linkedHcpId || null,
        comments: decisionComment,
        selected_items: selectedItems,
        item_details: itemDetails
      });

      toast.success(t('messages.decisionSuccess'));
      setDecisionComment('');
      setLinkedHcpId('');
      setSelectedItems({
        crm: [],
        enderecos: [],
        telefones: [],
        emails: [],
        organizacoes: [],
        informacao_adicional: []
      });
      fetchData();
    } catch (error) {
      toast.error(t('errors.decisionFailed'));
      console.error(error);
    } finally {
      setSavingDecision(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await reportService.downloadPdf(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_${id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(t('messages.pdfSuccess'));
    } catch (error) {
      toast.error(t('errors.pdfFailed'));
      console.error(error);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'VALIDADO': 'badge-success',
      'A_REVISAR': 'badge-warning',
      'REJEITADO': 'badge-error',
      'CORRIGIR': 'badge-info',
      'DUPLICADO': 'badge-gray'
    };
    return styles[status] || 'badge-gray';
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

  const getScoreColor = (score) => {
    if (score >= 0.85) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRuleIcon = (status, severity) => {
    if (status === 'PASS') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (severity === 'ERROR') return <XCircle className="h-5 w-5 text-red-500" />;
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!hcp) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">{t('common:errors.notFound')}</h2>
        <button onClick={() => navigate('/search')} className="btn-primary mt-4">
          {t('backToSearch')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/search')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{hcp.nome_medico}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500 font-mono">{hcp.id_hcp}</span>
              <span className={`badge ${getStatusBadge(hcp.status_validacao)}`}>
                {getStatusLabel(hcp.status_validacao)}
              </span>
              <span className={`text-sm font-medium ${getScoreColor(hcp.score_qualidade)}`}>
                {t('common:labels.score')}: {(hcp.score_qualidade * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission('EXPORT_HCP') && (
            <button onClick={handleDownloadPdf} className="btn-secondary">
              <Download className="h-4 w-4 mr-2" />
              {t('pdf.generate')}
            </button>
          )}
          {hasPermission('VALIDATE_HCP') && (
            <button
              onClick={handleValidate}
              disabled={validating}
              className="btn-primary"
            >
              {validating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {t('validation.runValidation')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="card">
            <div className="border-b border-gray-200">
              <nav className="flex overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="card-body">
              {/* Dados Gerais */}
              {activeTab === 'geral' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 uppercase">{t('general.name')}</label>
                      <p className="font-medium">{hcp.nome_medico}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase">{t('general.id')}</label>
                      <p className="font-mono text-sm">{hcp.id_hcp}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase">{t('general.status')}</label>
                      <p>
                        <span className={`badge ${getStatusBadge(hcp.status_validacao)}`}>
                          {getStatusLabel(hcp.status_validacao)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase">{t('general.qualityScore')}</label>
                      <p className={`font-medium ${getScoreColor(hcp.score_qualidade)}`}>
                        {((hcp.score_qualidade || 0) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* CRM */}
              {activeTab === 'crm' && (
                <div className="space-y-4">
                  {hcp.crm?.length > 1 && (
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                      <button
                        onClick={() => toggleAllItems('crm', hcp.crm)}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
                      >
                        {selectedItems.crm.length === hcp.crm.length ? (
                          <CheckSquare className="h-4 w-4 text-primary-600" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                        {t('decision.selectAll')}
                      </button>
                      {selectedItems.crm.length > 0 && (
                        <span className="text-xs text-primary-600 font-medium">
                          {t('decision.selected', { count: selectedItems.crm.length })}
                        </span>
                      )}
                    </div>
                  )}
                  {hcp.crm?.length > 0 ? (
                    hcp.crm.map((crm, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleItemSelection('crm', idx)}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedItems.crm.includes(idx)
                            ? 'bg-primary-50 border-2 border-primary-300'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {selectedItems.crm.includes(idx) ? (
                              <CheckSquare className="h-5 w-5 text-primary-600" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400" />
                            )}
                            <span className="badge badge-gray">#{crm.ordem || idx + 1}</span>
                          </div>
                          {crm.score !== undefined && (
                            <span className={`text-sm font-medium ${crm.score >= 80 ? 'text-green-600' : crm.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {t('common:labels.score')}: {crm.score}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-xs text-gray-500">{t('crm.registration')}</label>
                            <p className="font-medium">{crm.inscricao}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">{t('crm.state')}</label>
                            <p>{crm.estado}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">{t('crm.status')}</label>
                            <p className={crm.situacao?.toUpperCase() === 'ATIVO' ? 'text-green-600' : 'text-red-600'}>
                              {crm.situacao}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">{t('crm.type')}</label>
                            <p>{crm.tipo || '-'}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">{t('crm.graduationYear')}</label>
                            <p>{crm.ano_formatura || '-'}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">{t('crm.institution')}</label>
                            <p>{crm.instituicao_graduacao || '-'}</p>
                          </div>
                        </div>
                        {crm.especialidades?.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <label className="text-xs text-gray-500">{t('crm.specialties')} ({crm.especialidades.length})</label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {crm.especialidades.map((esp, espIdx) => (
                                <span key={espIdx} className="badge badge-info">
                                  {esp.especialidade} (RQE: {esp.rqe})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">{t('crm.empty')}</p>
                  )}
                </div>
              )}

              {/* Endereços */}
              {activeTab === 'enderecos' && (
                <div className="space-y-4">
                  {hcp.enderecos?.length > 1 && (
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                      <button
                        onClick={() => toggleAllItems('enderecos', hcp.enderecos)}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
                      >
                        {selectedItems.enderecos.length === hcp.enderecos.length ? (
                          <CheckSquare className="h-4 w-4 text-primary-600" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                        {t('decision.selectAll')}
                      </button>
                    </div>
                  )}
                  {hcp.enderecos?.length > 0 ? (
                    hcp.enderecos.map((end, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleItemSelection('enderecos', idx)}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedItems.enderecos.includes(idx)
                            ? 'bg-primary-50 border-2 border-primary-300'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {selectedItems.enderecos.includes(idx) ? (
                              <CheckSquare className="h-5 w-5 text-primary-600" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400" />
                            )}
                            <span className="badge badge-gray">#{end.ordem || idx + 1}</span>
                            <span className="badge badge-info">{end.tipo || t('address.type')}</span>
                          </div>
                        </div>
                        {end.endereco ? (
                          <p className="text-sm font-medium">{end.endereco}</p>
                        ) : (
                          <>
                            <p className="mt-2">
                              {end.tipo} {end.logradouro}, {end.numero}
                              {end.complemento && ` - ${end.complemento}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {end.bairro}, {end.municipio}/{end.estado} - {t('address.zipCode')}: {end.cep}
                            </p>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">{t('address.empty')}</p>
                  )}
                </div>
              )}

              {/* Telefones */}
              {activeTab === 'telefones' && (
                <div className="space-y-2">
                  {hcp.telefones?.length > 0 ? (
                    hcp.telefones.map((tel, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleItemSelection('telefones', idx)}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedItems.telefones.includes(idx)
                            ? 'bg-primary-50 border-2 border-primary-300'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {selectedItems.telefones.includes(idx) ? (
                            <CheckSquare className="h-5 w-5 text-primary-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                          <span className="badge badge-gray text-xs">#{tel.ordem || idx + 1}</span>
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="font-mono">{tel.telefone}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">{t('phone.empty')}</p>
                  )}
                </div>
              )}

              {/* E-mails */}
              {activeTab === 'emails' && (
                <div className="space-y-2">
                  {hcp.emails?.length > 0 ? (
                    hcp.emails.map((email, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleItemSelection('emails', idx)}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedItems.emails.includes(idx)
                            ? 'bg-primary-50 border-2 border-primary-300'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {selectedItems.emails.includes(idx) ? (
                            <CheckSquare className="h-5 w-5 text-primary-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                          <span className="badge badge-gray text-xs">#{email.ordem || idx + 1}</span>
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{email.email}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">{t('email.empty')}</p>
                  )}
                </div>
              )}

              {/* Organizações */}
              {activeTab === 'organizacoes' && (
                <div className="space-y-4">
                  {hcp.organizacoes?.length > 0 ? (
                    hcp.organizacoes.map((org, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleItemSelection('organizacoes', idx)}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedItems.organizacoes.includes(idx)
                            ? 'bg-primary-50 border-2 border-primary-300'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {selectedItems.organizacoes.includes(idx) ? (
                              <CheckSquare className="h-5 w-5 text-primary-600" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400" />
                            )}
                            <span className="badge badge-gray">#{org.ordem || idx + 1}</span>
                            <span className="font-medium">{org.nome_fantasia || org.nome_razao}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-sm text-gray-600">
                          <p><span className="text-gray-400">{t('organization.cnes')}:</span> {org.cnes || '-'}</p>
                          <p><span className="text-gray-400">{t('organization.cnpj')}:</span> {org.cnpj || '-'}</p>
                          <p><span className="text-gray-400">{t('organization.bond')}:</span> {org.vinculo || '-'}</p>
                          <p><span className="text-gray-400">{t('organization.activity')}:</span> {org.atuacao || '-'}</p>
                          <p><span className="text-gray-400">{t('organization.status')}:</span> {org.situacao || '-'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">{t('organization.empty')}</p>
                  )}
                </div>
              )}

              {/* Info Adicional */}
              {activeTab === 'info' && (
                <div className="space-y-4">
                  {hcp.informacao_adicional?.length > 0 ? (
                    hcp.informacao_adicional.map((info, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleItemSelection('informacao_adicional', idx)}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedItems.informacao_adicional.includes(idx)
                            ? 'bg-primary-50 border-2 border-primary-300'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          {selectedItems.informacao_adicional.includes(idx) ? (
                            <CheckSquare className="h-5 w-5 text-primary-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                          <span className="badge badge-gray">#{info.ordem || idx + 1}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <label className="text-xs text-gray-500">{t('additional.name')}</label>
                            <p className="font-medium">{info.nome || '-'}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">{t('additional.origin')}</label>
                            <p>{info.origem || '-'}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">{t('additional.laboratory')}</label>
                            <p>{info.laboratorio || '-'}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">{t('additional.closeupId')}</label>
                            <p className="font-mono text-xs">{info.id_closeup || '-'}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">{t('additional.closeupRegion')}</label>
                            <p>{info.regiao_closeup || '-'}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">{t('additional.empty')}</p>
                  )}
                </div>
              )}

              {/* Auditoria */}
              {activeTab === 'auditoria' && (
                <div className="space-y-2">
                  {auditoria.length > 0 ? (
                    auditoria.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                        <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p>
                            <span className="font-medium">{log.user}</span>
                            <span className="text-gray-500"> - {log.action}</span>
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDateTime(log.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">{t('audit.empty')}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Validation Rules */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">{t('validation.title')}</h3>
            </div>
            <div className="card-body space-y-2">
              {validation?.rules_results?.length > 0 ? (
                validation.rules_results.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50">
                    {getRuleIcon(rule.status, rule.severity)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{rule.rule_name}</p>
                      <p className="text-xs text-gray-500 truncate">{rule.details}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  {t('validation.noRules')}
                </p>
              )}
            </div>
          </div>

          {/* Decision Panel */}
          {hasPermission('VALIDATE_HCP') && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold">{t('decision.title')}</h3>
              </div>
              <div className="card-body space-y-4">
                {getTotalSelectedItems() > 0 && (
                  <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
                    <p className="text-sm font-medium text-primary-700 mb-2">
                      {t('decision.selected', { count: getTotalSelectedItems() })}:
                    </p>
                    <ul className="text-xs text-primary-600 space-y-1">
                      {getSelectedItemsSummary().map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <label className="form-label">{t('decision.comments')}</label>
                  <textarea
                    value={decisionComment}
                    onChange={(e) => setDecisionComment(e.target.value)}
                    className="form-input w-full border border-gray-300 rounded-lg p-2 text-sm"
                    rows={3}
                    placeholder={t('decision.commentsPlaceholder')}
                  />
                </div>

                <div>
                  <label className="form-label">{t('decision.relatedHcp')}</label>
                  <input
                    type="text"
                    value={linkedHcpId}
                    onChange={(e) => setLinkedHcpId(e.target.value)}
                    className="form-input w-full border border-gray-300 rounded-lg p-2 text-sm"
                    placeholder={t('decision.relatedHcpPlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {DECISION_TYPES.map((dec) => (
                    <button
                      key={dec.value}
                      onClick={() => handleDecision(dec.value)}
                      disabled={savingDecision}
                      className={`${dec.color} text-sm py-2`}
                    >
                      {dec.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Decision History */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">{t('history.title')}</h3>
            </div>
            <div className="card-body space-y-3">
              {decisions.length > 0 ? (
                decisions.map((dec, idx) => {
                  // Extrai os itens do item_details ou selected_items (legado)
                  const hasItemDetails = dec.item_details && Object.values(dec.item_details).some(arr => arr?.length > 0);
                  const hasSelectedItems = dec.selected_items && Object.values(dec.selected_items).some(arr => arr?.length > 0);

                  return (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center justify-between">
                        <span className={`badge ${getStatusBadge(dec.decision_type === 'VALIDAR' ? 'VALIDADO' : dec.decision_type === 'REJEITAR' ? 'REJEITADO' : dec.decision_type)}`}>
                          {dec.decision_type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(dec.timestamp)}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-600">{t('history.user')}: {dec.user}</p>

                      {/* Mostrar itens validados */}
                      {hasItemDetails && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-500 mb-1">{t('history.items')}:</p>
                          <div className="space-y-1">
                            {dec.item_details.crm?.map((item, i) => (
                              <span key={`crm-${i}`} className="inline-block mr-1 mb-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                {item.label}
                              </span>
                            ))}
                            {dec.item_details.telefones?.map((item, i) => (
                              <span key={`tel-${i}`} className="inline-block mr-1 mb-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                {item.label}
                              </span>
                            ))}
                            {dec.item_details.emails?.map((item, i) => (
                              <span key={`email-${i}`} className="inline-block mr-1 mb-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                {item.label}
                              </span>
                            ))}
                            {dec.item_details.enderecos?.map((item, i) => (
                              <span key={`end-${i}`} className="inline-block mr-1 mb-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                                {item.label}
                              </span>
                            ))}
                            {dec.item_details.organizacoes?.map((item, i) => (
                              <span key={`org-${i}`} className="inline-block mr-1 mb-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                                {item.label}
                              </span>
                            ))}
                            {dec.item_details.informacao_adicional?.map((item, i) => (
                              <span key={`info-${i}`} className="inline-block mr-1 mb-1 px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                                {item.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Legado: mostrar índices se não tiver item_details */}
                      {!hasItemDetails && hasSelectedItems && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-500 mb-1">{t('history.items')}:</p>
                          <div className="text-xs text-gray-600">
                            {dec.selected_items.crm?.length > 0 && <span className="mr-2">CRM: #{dec.selected_items.crm.map(i => i + 1).join(', #')}</span>}
                            {dec.selected_items.telefones?.length > 0 && <span className="mr-2">{t('tabs.phones')}: #{dec.selected_items.telefones.map(i => i + 1).join(', #')}</span>}
                            {dec.selected_items.emails?.length > 0 && <span className="mr-2">{t('tabs.emails')}: #{dec.selected_items.emails.map(i => i + 1).join(', #')}</span>}
                            {dec.selected_items.enderecos?.length > 0 && <span className="mr-2">{t('tabs.addresses')}: #{dec.selected_items.enderecos.map(i => i + 1).join(', #')}</span>}
                            {dec.selected_items.organizacoes?.length > 0 && <span className="mr-2">{t('tabs.organizations')}: #{dec.selected_items.organizacoes.map(i => i + 1).join(', #')}</span>}
                          </div>
                        </div>
                      )}

                      {dec.comments && (
                        <p className="mt-2 text-gray-500 italic">"{dec.comments}"</p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">{t('history.empty')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
