import { useState, useEffect } from 'react';
import { FileText, Download, Trash2, FileImage, FileSpreadsheet, File } from 'lucide-react';
import { getReports, deleteReport, SavedReport, shareOrDownloadFile } from '../lib/reportUtils';
import { useLanguage } from '../contexts/LanguageContext';

export default function Reports() {
  const { t } = useLanguage();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const saved = await getReports();
      setReports(saved);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (report: SavedReport) => {
    if (!report.blob) return;
    const ext = report.type === 'application/pdf' ? 'pdf' : 
                report.type === 'image/png' ? 'png' : 
                report.type === 'image/jpeg' ? 'jpg' : 'xlsx';
    await shareOrDownloadFile(report.blob, `${report.title}.${ext}`);
  };

  const handleDelete = async (id: string) => {
    if (confirm('តើអ្នកពិតជាចង់លុបរបាយការណ៍នេះមែនទេ?')) {
      await deleteReport(id);
      loadReports();
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('image')) return <FileImage className="w-8 h-8 text-blue-500" />;
    if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (type.includes('spreadsheet')) return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">កំពុងផ្ទុក...</div>;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white font-moul">របាយការណ៍ដែលបានរក្សាទុក</h2>
      {reports.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
          មិនមានរបាយការណ៍ទេ
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(report => (
            <div key={report.id} className="flex items-center p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
              {getIcon(report.type)}
              <div className="ml-4 flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white">{report.title}</h3>
                <p className="text-xs text-gray-500">{new Date(report.date).toLocaleString('en-GB')}</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => handleDownload(report)} className="p-2 text-orange-500 bg-orange-50 rounded-lg hover:bg-orange-100">
                  <Download className="w-5 h-5" />
                </button>
                <button onClick={() => handleDelete(report.id)} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
