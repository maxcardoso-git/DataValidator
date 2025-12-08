import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { hcpService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  GitCompare,
  Check,
  X,
  Link2,
  Unlink,
  Loader2,
  AlertTriangle
} from 'lucide-react';

export default function Compare() {
  const { t } = useTranslation(['compare', 'common']);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const id_a = searchParams.get('id_a');
  const id_b = searchParams.get('id_b');

  const [registroA, setRegistroA] = useState(null);
  const [registroB, setRegistroB] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingDecision, setSavingDecision] = useState(false);

  useEffect(() => {
    if (id_a && id_b) {
      fetchRecords();
    }
  }, [id_a, id_b]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await hcpService.compare(id_a, id_b);
      setRegistroA(response.data.registro_a);
      setRegistroB(response.data.registro_b);
    } catch (error) {
      toast.error(t('errors.loadFailed'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (keepId, decision, linkedId = null) => {
    setSavingDecision(true);
    try {
      await hcpService.decision(keepId, {
        decision_type: decision,
        linked_hcp_id: linkedId,
        comments: `Decision made in comparison with ${linkedId || 'another record'}`
      });
      toast.success(t('messages.decisionSuccess'));
      navigate('/search');
    } catch (error) {
      toast.error(t('errors.decisionFailed'));
      console.error(error);
    } finally {
      setSavingDecision(false);
    }
  };

  const compareValues = (valA, valB) => {
    const strA = JSON.stringify(valA);
    const strB = JSON.stringify(valB);
    return strA === strB;
  };

  const getScoreColor = (score) => {
    if (score >= 0.85) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const CompareField = ({ label, valueA, valueB }) => {
    const isEqual = compareValues(valueA, valueB);
    const displayA = Array.isArray(valueA) ? valueA.join(', ') : (valueA || '-');
    const displayB = Array.isArray(valueB) ? valueB.join(', ') : (valueB || '-');

    return (
      <div className={`compare-field ${!isEqual ? 'compare-diff' : ''}`}>
        <div className="compare-field-label flex items-center gap-2">
          {label}
          {!isEqual && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-1">
          <div className="compare-field-value">{displayA}</div>
          <div className="compare-field-value">{displayB}</div>
        </div>
      </div>
    );
  };

  if (!id_a || !id_b) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">{t('common:empty.noRecords')}</h2>
        <button onClick={() => navigate('/search')} className="btn-primary mt-4">
          {t('common:nav.search')}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!registroA || !registroB) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">{t('messages.notFound')}</h2>
        <button onClick={() => navigate('/search')} className="btn-primary mt-4">
          {t('common:buttons.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/search')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <GitCompare className="h-6 w-6" />
              {t('title')}
            </h1>
            <p className="text-gray-500 mt-1">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Headers dos registros */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-start justify-between">
              <div>
                <span className="badge badge-info">{t('badges.recordA')}</span>
                <h3 className="text-lg font-semibold mt-2">{registroA.nome_medico}</h3>
                <p className="text-sm text-gray-500 font-mono">{registroA.id_hcp}</p>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${getScoreColor(registroA.score_qualidade)}`}>
                  {(registroA.score_qualidade * 100).toFixed(0)}%
                </span>
                <p className="text-xs text-gray-500">{t('common:labels.score')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-start justify-between">
              <div>
                <span className="badge badge-info">{t('badges.recordB')}</span>
                <h3 className="text-lg font-semibold mt-2">{registroB.nome_medico}</h3>
                <p className="text-sm text-gray-500 font-mono">{registroB.id_hcp}</p>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${getScoreColor(registroB.score_qualidade)}`}>
                  {(registroB.score_qualidade * 100).toFixed(0)}%
                </span>
                <p className="text-xs text-gray-500">{t('common:labels.score')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparação de campos */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">{t('sections.fieldComparison')}</h3>
        </div>
        <div className="card-body space-y-1">
          <CompareField
            label={t('fields.name')}
            valueA={registroA.nome_medico}
            valueB={registroB.nome_medico}
          />
          <CompareField
            label={t('fields.primaryCrm')}
            valueA={registroA.crm?.[0] ? `${registroA.crm[0].inscricao}/${registroA.crm[0].estado}` : null}
            valueB={registroB.crm?.[0] ? `${registroB.crm[0].inscricao}/${registroB.crm[0].estado}` : null}
          />
          <CompareField
            label={t('fields.crmStatus')}
            valueA={registroA.crm?.[0]?.situacao}
            valueB={registroB.crm?.[0]?.situacao}
          />
          <CompareField
            label={t('fields.specialties')}
            valueA={registroA.crm?.[0]?.especialidades?.map(e => e.especialidade)}
            valueB={registroB.crm?.[0]?.especialidades?.map(e => e.especialidade)}
          />
          <CompareField
            label={t('fields.phones')}
            valueA={registroA.telefones?.map(t => t.telefone)}
            valueB={registroB.telefones?.map(t => t.telefone)}
          />
          <CompareField
            label={t('fields.emails')}
            valueA={registroA.emails?.map(e => e.email)}
            valueB={registroB.emails?.map(e => e.email)}
          />
          <CompareField
            label={t('fields.city')}
            valueA={registroA.enderecos?.[0]?.municipio}
            valueB={registroB.enderecos?.[0]?.municipio}
          />
          <CompareField
            label={t('fields.state')}
            valueA={registroA.enderecos?.[0]?.estado}
            valueB={registroB.enderecos?.[0]?.estado}
          />
          <CompareField
            label={t('fields.organizations')}
            valueA={registroA.organizacoes?.map(o => o.nome_fantasia || o.nome_razao)}
            valueB={registroB.organizacoes?.map(o => o.nome_fantasia || o.nome_razao)}
          />
        </div>
      </div>

      {/* Ações */}
      {hasPermission('VALIDATE_HCP') && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold">{t('common:labels.actions')}</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => handleDecision(registroA.id_hcp, 'VALIDAR')}
                disabled={savingDecision}
                className="btn-success flex flex-col items-center py-4"
              >
                <Check className="h-6 w-6 mb-1" />
                <span>{t('actions.keepA')}</span>
              </button>

              <button
                onClick={() => handleDecision(registroB.id_hcp, 'VALIDAR')}
                disabled={savingDecision}
                className="btn-success flex flex-col items-center py-4"
              >
                <Check className="h-6 w-6 mb-1" />
                <span>{t('actions.keepB')}</span>
              </button>

              <button
                onClick={() => handleDecision(registroA.id_hcp, 'DUPLICADO', registroB.id_hcp)}
                disabled={savingDecision}
                className="btn-warning flex flex-col items-center py-4"
              >
                <Link2 className="h-6 w-6 mb-1" />
                <span>{t('actions.duplicate')}</span>
              </button>

              <button
                onClick={() => handleDecision(registroA.id_hcp, 'NAO_RELACIONADO', registroB.id_hcp)}
                disabled={savingDecision}
                className="btn-secondary flex flex-col items-center py-4"
              >
                <Unlink className="h-6 w-6 mb-1" />
                <span>{t('actions.notRelated')}</span>
              </button>
            </div>

            <p className="text-sm text-gray-500 text-center mt-4">
              {t('help.duplicateWarning')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
