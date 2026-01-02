'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchPendingContent,
  approveContent,
  rejectContent,
} from '@/store/slices/contentSlice';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const contentTypeLabels = {
  post: 'منشور',
  comment: 'تعليق',
  question: 'سؤال',
  answer: 'إجابة',
  media: 'وسائط',
};

const contentTypeIcons = {
  post: DocumentTextIcon,
  comment: ChatBubbleLeftRightIcon,
  question: ChatBubbleLeftRightIcon,
  answer: ChatBubbleLeftRightIcon,
  media: PhotoIcon,
};

const statusLabels = {
  pending: 'قيد المراجعة',
  approved: 'موافق عليها',
  rejected: 'مرفوضة',
};

const statusColors = {
  pending: 'bg-sky-200 text-sky-800',
  approved: 'bg-sky-500 text-white',
  rejected: 'bg-dark-lighter text-light',
};

export default function ContentPage() {
  const dispatch = useAppDispatch();
  const { pendingContent = [], loading } = useAppSelector((state) => state.content);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [localFilters, setLocalFilters] = useState({
    content_type: '',
    status: 'pending',
  });

  useEffect(() => {
    dispatch(fetchPendingContent());
  }, [dispatch]);

  const filteredContent = Array.isArray(pendingContent) ? pendingContent.filter((content) => {
    const matchesSearch =
      content.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.author?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.author?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.author?.username?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      !localFilters.content_type || content.content_type === localFilters.content_type;
    const matchesStatus =
      !localFilters.status || content.status === localFilters.status;

    return matchesSearch && matchesType && matchesStatus;
  }) : [];

  const handleApproveContent = async (contentId) => {
    try {
      const result = await dispatch(approveContent(contentId));
      if (approveContent.fulfilled.match(result)) {
        toast.success('تم اعتماد المحتوى بنجاح');
        dispatch(fetchPendingContent());
      } else {
        const errorMessage = result.payload?.message || 
                           result.payload?.error || 
                           'فشل اعتماد المحتوى';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء اعتماد المحتوى');
    }
  };

  const handleRejectContent = async () => {
    if (!selectedContent) {
      toast.error('يرجى اختيار المحتوى');
      return;
    }

    try {
      const result = await dispatch(
        rejectContent({
          contentId: selectedContent.id,
          rejection_reason: rejectionReason || '',
        })
      );
      if (rejectContent.fulfilled.match(result)) {
        toast.success('تم رفض المحتوى بنجاح');
        setShowRejectModal(false);
        setSelectedContent(null);
        setRejectionReason('');
        dispatch(fetchPendingContent());
      } else {
        const errorMessage = result.payload?.message || 
                           result.payload?.error || 
                           'فشل رفض المحتوى';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء رفض المحتوى');
    }
  };

  const stats = {
    total: Array.isArray(pendingContent) ? pendingContent.length : 0,
    posts: Array.isArray(pendingContent) ? pendingContent.filter((c) => c.content_type === 'post').length : 0,
    comments: Array.isArray(pendingContent) ? pendingContent.filter((c) => c.content_type === 'comment').length : 0,
    questions: Array.isArray(pendingContent) ? pendingContent.filter((c) => c.content_type === 'question').length : 0,
    media: Array.isArray(pendingContent) ? pendingContent.filter((c) => c.content_type === 'media').length : 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
          إدارة المحتوى المجتمعي
        </h1>
        <p className="text-sm sm:text-base text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
          مراجعة واعتماد/رفض المحتوى المعلق من منشورات طلابك ضمن جامعتك
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-lighter mb-1">إجمالي المعلق</p>
              <p className="text-2xl font-bold text-dark">{stats.total}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-sky-500" />
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-lighter mb-1">منشورات</p>
              <p className="text-2xl font-bold text-dark">{stats.posts}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <DocumentTextIcon className="h-6 w-6 text-sky-500" />
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-lighter mb-1">تعليقات</p>
              <p className="text-2xl font-bold text-dark">{stats.comments}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-sky-200 flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-sky-600" />
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-lighter mb-1">أسئلة</p>
              <p className="text-2xl font-bold text-dark">{stats.questions}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-sky-300 flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-sky-700" />
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-lighter mb-1">وسائط</p>
              <p className="text-2xl font-bold text-dark">{stats.media}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-sky-400 flex items-center justify-center">
                <PhotoIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-dark-lighter" />
            </div>
            <input
              type="text"
              placeholder="ابحث عن محتوى..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 pr-10 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-dark hover:bg-sky-100 hover:border-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
          >
            <FunnelIcon className="h-5 w-5" />
            فلترة
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-5 pt-5 grid grid-cols-1 gap-4 border-t border-sky-100 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-dark mb-2.5">نوع المحتوى</label>
              <select
                value={localFilters.content_type}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, content_type: e.target.value })
                }
                className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
              >
                <option value="">جميع الأنواع</option>
                {Object.entries(contentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2.5">الحالة</label>
              <select
                value={localFilters.status}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, status: e.target.value })
                }
                className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content List */}
      <div className="rounded-lg bg-white border border-sky-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
            <p className="mt-4 text-base font-semibold text-dark-lighter leading-relaxed">جاري تحميل المحتوى...</p>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="p-12 text-center">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-dark-lighter" />
            <p className="mt-4 text-base font-semibold text-dark leading-relaxed">لا يوجد محتوى معلق</p>
            <p className="mt-2 text-sm text-dark-lighter leading-relaxed">
              {searchTerm || localFilters.content_type || localFilters.status !== 'pending'
                ? 'لا يوجد محتوى يطابق معايير البحث'
                : 'جميع المحتوى تمت مراجعته'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-sky-100">
            {filteredContent.map((content) => {
              const ContentIcon = contentTypeIcons[content.content_type] || DocumentTextIcon;

              return (
                <div key={content.id} className="p-5 sm:p-6 hover:bg-sky-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <ContentIcon className="h-5 w-5 text-sky-500 flex-shrink-0" />
                        <h3 className="text-lg font-semibold text-dark leading-relaxed">
                          {content.title || contentTypeLabels[content.content_type] || 'محتوى'}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                            statusColors[content.status] || statusColors.pending
                          }`}
                        >
                          {statusLabels[content.status] || content.status}
                        </span>
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 whitespace-nowrap">
                          {contentTypeLabels[content.content_type] || content.content_type}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-dark whitespace-pre-wrap line-clamp-4 leading-relaxed">
                          {content.content || content.body || 'لا يوجد محتوى'}
                        </p>
                      </div>

                      {content.media_url && (
                        <div className="mb-4">
                          {content.content_type === 'media' && content.media_type?.startsWith('image') ? (
                            <img
                              src={content.media_url}
                              alt="محتوى وسائط"
                              className="max-w-md rounded-lg border-2 border-sky-200"
                            />
                          ) : content.media_type?.startsWith('video') ? (
                            <video
                              src={content.media_url}
                              controls
                              className="max-w-md rounded-lg border-2 border-sky-200"
                            >
                              متصفحك لا يدعم تشغيل الفيديو
                            </video>
                          ) : (
                            <a
                              href={content.media_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-600 hover:text-sky-700 text-sm font-semibold transition-colors"
                            >
                              عرض الملف المرفق
                            </a>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-dark-lighter mt-4 flex-wrap">
                        {content.author && (
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-sky-500 flex-shrink-0" />
                            <span>
                              {content.author?.first_name} {content.author?.last_name} (
                              {content.author?.username})
                            </span>
                          </div>
                        )}
                        {content.created_at && (
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4 text-sky-500 flex-shrink-0" />
                            <span>
                              {new Date(content.created_at).toLocaleDateString('ar-SA', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        )}
                      </div>

                      {content.rejection_reason && (
                        <div className="mt-4 p-4 rounded-lg bg-sky-50 border-2 border-sky-200">
                          <p className="text-xs font-semibold text-sky-800 mb-1">سبب الرفض:</p>
                          <p className="text-sm text-sky-900 leading-relaxed">{content.rejection_reason}</p>
                        </div>
                      )}
                    </div>

                    {content.status === 'pending' && (
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleApproveContent(content.id)}
                          className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                          موافقة
                        </button>
                        <button
                          onClick={() => {
                            setSelectedContent(content);
                            setRejectionReason('');
                            setShowRejectModal(true);
                          }}
                          className="flex items-center gap-2 rounded-lg bg-dark-lighter px-4 py-2 text-sm font-semibold text-white hover:bg-dark transition-colors focus:outline-none focus:ring-2 focus:ring-dark-lighter/30"
                        >
                          <XCircleIcon className="h-5 w-5" />
                          رفض
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white border border-sky-100 p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-dark mb-5" style={{ fontFamily: 'inherit' }}>رفض المحتوى</h3>

            {/* Content Preview */}
            <div className="mb-5 p-4 rounded-lg bg-sky-50 border-2 border-sky-200">
              <p className="text-sm font-semibold text-dark mb-2">المحتوى:</p>
              <p className="text-sm text-dark whitespace-pre-wrap line-clamp-5 leading-relaxed">
                {selectedContent.content || selectedContent.body || 'لا يوجد محتوى'}
              </p>
            </div>

            {/* Rejection Reason */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-dark mb-2.5">
                سبب الرفض <span className="text-sky-600">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={5}
                required
                className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200 resize-none"
                placeholder="يرجى توضيح سبب رفض هذا المحتوى..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleRejectContent}
                disabled={!rejectionReason.trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-dark-lighter px-4 py-2.5 text-sm font-semibold text-white hover:bg-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-dark-lighter/30"
              >
                <XCircleIcon className="h-5 w-5" />
                رفض
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedContent(null);
                  setRejectionReason('');
                }}
                className="flex-1 rounded-lg border-2 border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark hover:bg-sky-50 hover:border-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}









