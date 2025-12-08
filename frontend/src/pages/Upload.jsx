import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { adminService } from '../services/api';
import { formatDateTime } from '../i18n';
import toast from 'react-hot-toast';
import {
  Upload as UploadIcon,
  File,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Trash2,
  RefreshCw
} from 'lucide-react';

export default function Upload() {
  const { t } = useTranslation(['upload', 'common']);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await adminService.getUploadHistory();
      setHistory(response.data.items || []);
    } catch (error) {
      toast.error(t('errors.loadHistoryFailed'));
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.json')) {
        toast.error(t('errors.onlyJson'));
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.json')) {
        toast.error(t('errors.onlyJson'));
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error(t('errors.selectFile'));
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const response = await adminService.upload(file, (progress) => {
        setUploadProgress(progress);
      });

      toast.success(t('messages.success', { count: response.data.records_processed }));
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchHistory();
    } catch (error) {
      const message = error.response?.data?.error || t('errors.uploadFailed');
      toast.error(message);
      console.error(error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'CONCLUIDO':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'ERRO':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'PROCESSANDO':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'CONCLUIDO': 'badge-success',
      'ERRO': 'badge-error',
      'PROCESSANDO': 'badge-info',
      'RECEBIDO': 'badge-warning'
    };
    return styles[status] || 'badge-gray';
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'CONCLUIDO': t('common:status.concluido'),
      'ERRO': t('common:status.erro'),
      'PROCESSANDO': t('common:status.processando'),
      'RECEBIDO': t('common:status.recebido')
    };
    return statusMap[status] || status;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-500 mt-1">{t('subtitle')}</p>
      </div>

      {/* Upload Area */}
      <div className="card">
        <div className="card-body">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file ? 'border-primary-300 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <File className="h-10 w-10 text-primary-500" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={handleClearFile}
                    className="p-2 hover:bg-gray-100 rounded-full"
                    disabled={uploading}
                  >
                    <Trash2 className="h-5 w-5 text-gray-400" />
                  </button>
                </div>

                {uploading && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="btn-primary"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('buttons.uploading')} {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <UploadIcon className="h-4 w-4 mr-2" />
                      {t('buttons.upload')}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <UploadIcon className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-gray-600">
                    {t('dropzone.dragDrop')}
                  </p>
                  <label className="btn-secondary mt-2 cursor-pointer inline-flex">
                    {t('dropzone.selectFile')}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-400">
                  {t('dropzone.maxSize')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload History */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold">{t('history.title')}</h3>
          <button
            onClick={fetchHistory}
            disabled={loadingHistory}
            className="btn-secondary p-2"
          >
            <RefreshCw className={`h-4 w-4 ${loadingHistory ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="table-container">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {t('empty.noUploads')}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('history.status')}</th>
                  <th>{t('history.file')}</th>
                  <th>{t('history.user')}</th>
                  <th>{t('history.processed')}</th>
                  <th>{t('history.errors')}</th>
                  <th>{t('history.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {history.map((session) => (
                  <tr key={session._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(session.status)}
                        <span className={`badge ${getStatusBadge(session.status)}`}>
                          {getStatusLabel(session.status)}
                        </span>
                      </div>
                    </td>
                    <td className="font-medium">{session.filename}</td>
                    <td>{session.user}</td>
                    <td className="text-green-600 font-medium">
                      {session.records_processed}
                    </td>
                    <td className={session.records_with_error > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>
                      {session.records_with_error}
                    </td>
                    <td className="text-gray-500 text-sm">
                      {formatDateTime(session.started_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">{t('instructions.title')}</h3>
        </div>
        <div className="card-body">
          <p className="text-sm text-gray-600 mb-4" dangerouslySetInnerHTML={{ __html: t('instructions.line1') }} />
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`[
  {
    "_id": "HCP-00000001",
    "nome_medico": "JOAO DA SILVA",
    "score": 100,
    "trilha_auditoria": ["fonte_1", "fonte_2"],
    "crm": [
      {
        "ordem": 1,
        "score": 100,
        "estado": "SP",
        "inscricao": "123456",
        "situacao": "Ativo",
        "tipo": "Principal",
        "ano_formatura": "2005",
        "instituicao_graduacao": "USP",
        "trilha_auditoria": ["CFM"],
        "especialidades": [
          { "rqe": "12345", "especialidade": "Cardiologia" }
        ]
      }
    ],
    "telefones": [
      { "ordem": 1, "score": 100, "telefone": "11999998888", "trilha_auditoria": ["fonte_1"] }
    ],
    "emails": [
      { "ordem": 1, "score": 100, "email": "joao@email.com", "trilha_auditoria": ["fonte_1"] }
    ],
    "enderecos": [
      {
        "ordem": 1,
        "score": 100,
        "endereco": "Av. Paulista, 1000 - São Paulo/SP",
        "trilha_auditoria": ["CNES"]
      }
    ],
    "organizacoes": [
      {
        "ordem": 1,
        "score": 100,
        "cnes": "1234567",
        "nome_fantasia": "Hospital ABC",
        "vinculo": "Autônomo",
        "competencia": "202401",
        "trilha_auditoria": ["CNES"]
      }
    ],
    "informacao_adicional": [
      {
        "ordem": 1,
        "score": 100,
        "nome": "DR JOAO DA SILVA",
        "origem": "LAB_X",
        "laboratorio": "Laboratório X",
        "regiao_closeup": "SP Interior",
        "id_closeup": "12345",
        "trilha_auditoria": ["LAB_X"]
      }
    ]
  }
]`}
          </pre>
        </div>
      </div>
    </div>
  );
}
