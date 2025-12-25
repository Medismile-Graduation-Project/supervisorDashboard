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
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function ContentPage() {
  const dispatch = useAppDispatch();
  const { pendingContent, loading } = useAppSelector((state) => state.content);
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

  const filteredContent = pendingContent.filter((content) => {
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
  });

  const handleApproveContent = async (contentId) => {
    try {
      const result = await dispatch(approveContent(contentId));
      if (approveContent.fulfilled.match(result)) {
        toast.success('تمت الموافقة على المحتوى بنجاح');
        dispatch(fetchPendingContent());
      } else {
        toast.error(result.payload?.message || 'فشل الموافقة على المحتوى');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الموافقة على المحتوى');
    }
  };

  const handleRejectContent = async () => {
    if (!selectedContent || !rejectionReason.trim()) {
      toast.error('يرجى إدخال سبب الرفض');
      return;
    }

    try {
      const result = await dispatch(
        rejectContent({
          contentId: selectedContent.id,
          rejection_reason: rejectionReason,
        })
      );
      if (rejectContent.fulfilled.match(result)) {
        toast.success('تم رفض المحتوى بنجاح');
        setShowRejectModal(false);
        setSelectedContent(null);
        setRejectionReason('');
        dispatch(fetchPendingContent());
      } else {
        toast.error(result.payload?.message || 'فشل رفض المحتوى');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء رفض المحتوى');
    }
  };

  const stats = {
    total: pendingContent.length,
    posts: pendingContent.filter((c) => c.content_type === 'post').length,
    comments: pendingContent.filter((c) => c.content_type === 'comment').length,
    questions: pendingContent.filter((c) => c.content_type === 'question').length,
    media: pendingContent.filter((c) => c.content_type === 'media').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark">إدارة المحتوى المجتمعي</h1>
        <p className="mt-1 text-sm text-dark-lighter">
          مراجعة وموافقة/رفض المحتوى المجتمعي المعلق
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">إجمالي المعلق</p>
              <p className="mt-1 text-2xl font-bold text-dark">{stats.total}</p>
            </div>
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-sky-500" />
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">منشورات</p>
              <p className="mt-1 text-2xl font-bold text-dark">{stats.posts}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <DocumentTextIcon className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">تعليقات</p>
              <p className="mt-1 text-2xl font-bold text-dark">{stats.comments}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">أسئلة</p>
              <p className="mt-1 text-2xl font-bold text-dark">{stats.questions}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="h-4 w-4 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">وسائط</p>
              <p className="mt-1 text-2xl font-bold text-dark">{stats.media}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <PhotoIcon className="h-4 w-4 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-lg bg-light border border-light-gray p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-dark-lighter" />
            </div>
            <input
              type="text"
              placeholder="بحث في المحتوى..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 pr-10 text-sm text-dark placeholder-dark-lighter focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm font-medium text-dark hover:bg-light-gray transition-colors"
          >
            <FunnelIcon className="h-5 w-5" />
            فلترة
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-light-gray pt-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-dark mb-2">نوع المحتوى</label>
              <select
                value={localFilters.content_type}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, content_type: e.target.value })
                }
                className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
              <label className="block text-sm font-medium text-dark mb-2">الحالة</label>
              <select
                value={localFilters.status}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, status: e.target.value })
                }
                className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
      <div className="rounded-lg bg-light border border-light-gray overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
            <p className="mt-4 text-sm text-dark-lighter">جاري تحميل المحتوى...</p>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="p-8 text-center">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-dark-lighter" />
            <p className="mt-4 text-sm font-medium text-dark">لا يوجد محتوى معلق</p>
            <p className="mt-1 text-sm text-dark-lighter">
              {searchTerm || localFilters.content_type || localFilters.status !== 'pending'
                ? 'لا يوجد محتوى يطابق معايير البحث'
                : 'جميع المحتوى تمت مراجعته'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-light-gray">
            {filteredContent.map((content) => {
              const ContentIcon = contentTypeIcons[content.content_type] || DocumentTextIcon;

              return (
                <div key={content.id} className="p-6 hover:bg-light-gray transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <ContentIcon className="h-5 w-5 text-sky-500" />
                        <h3 className="text-lg font-semibold text-dark">
                          {content.title || contentTypeLabels[content.content_type] || 'محتوى'}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusColors[content.status] || statusColors.pending
                          }`}
                        >
                          {statusLabels[content.status] || content.status}
                        </span>
                        <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800">
                          {contentTypeLabels[content.content_type] || content.content_type}
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-dark whitespace-pre-wrap line-clamp-4">
                          {content.content || content.body || 'لا يوجد محتوى'}
                        </p>
                      </div>

                      {content.media_url && (
                        <div className="mb-3">
                          {content.content_type === 'media' && content.media_type?.startsWith('image') ? (
                            <img
                              src={content.media_url}
                              alt="محتوى وسائط"
                              className="max-w-md rounded-lg border border-light-gray"
                            />
                          ) : content.media_type?.startsWith('video') ? (
                            <video
                              src={content.media_url}
                              controls
                              className="max-w-md rounded-lg border border-light-gray"
                            >
                              متصفحك لا يدعم تشغيل الفيديو
                            </video>
                          ) : (
                            <a
                              href={content.media_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-600 hover:text-sky-700 text-sm"
                            >
                              عرض الملف المرفق
                            </a>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-dark-lighter mt-3">
                        {content.author && (
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span>
                              {content.author?.first_name} {content.author?.last_name} (
                              {content.author?.username})
                            </span>
                          </div>
                        )}
                        {content.created_at && (
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4" />
                            <span>
                              {new Date(content.created_at).toLocaleDateString('ar-SA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        )}
                      </div>

                      {content.rejection_reason && (
                        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-100">
                          <p className="text-xs font-medium text-red-800 mb-1">سبب الرفض:</p>
                          <p className="text-sm text-red-900">{content.rejection_reason}</p>
                        </div>
                      )}
                    </div>

                    {content.status === 'pending' && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleApproveContent(content.id)}
                          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
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
                          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-light p-6">
            <h3 className="text-lg font-semibold text-dark mb-4">رفض المحتوى</h3>

            {/* Content Preview */}
            <div className="mb-4 p-4 rounded-lg bg-light-gray">
              <p className="text-sm font-medium text-dark-lighter mb-2">المحتوى:</p>
              <p className="text-sm text-dark whitespace-pre-wrap line-clamp-5">
                {selectedContent.content || selectedContent.body || 'لا يوجد محتوى'}
              </p>
            </div>

            {/* Rejection Reason */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-dark mb-2">
                سبب الرفض <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={5}
                required
                className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="يرجى توضيح سبب رفض هذا المحتوى..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleRejectContent}
                disabled={!rejectionReason.trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="flex-1 rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm font-medium text-dark hover:bg-light-gray transition-colors"
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

