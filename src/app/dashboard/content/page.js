'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchPendingContent,
  fetchApprovedContent,
  approveContent,
  rejectContent,
  reactToPost,
  fetchPostComments,
  addComment,
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
  HeartIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
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
  const { pendingContent = [], approvedContent = [], loading, creating } = useAppSelector((state) => state.content);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' أو 'approved'
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [commentText, setCommentText] = useState('');
  const [selectedPostForComment, setSelectedPostForComment] = useState(null);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    description: '',
    category: 'general',
    tags: '',
    content_type: 'text',
    is_public: true,
    is_featured: false,
  });
  const [localFilters, setLocalFilters] = useState({
    content_type: '',
    status: '', // إزالة القيمة الافتراضية للسماح بعرض جميع الحالات
  });

  useEffect(() => {
    dispatch(fetchPendingContent());
    dispatch(fetchApprovedContent());
  }, [dispatch]);

  // إعادة جلب البيانات عند تغيير التاب
  useEffect(() => {
    if (activeTab === 'approved') {
      dispatch(fetchApprovedContent());
    }
  }, [activeTab, dispatch]);

  // تحديد المحتوى المعروض حسب التاب النشط
  const displayedContent = activeTab === 'pending' ? pendingContent : approvedContent;

  const filteredContent = Array.isArray(displayedContent) ? displayedContent.filter((content) => {
    const matchesSearch =
      content.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.author_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.university_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (content.author?.first_name && content.author.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (content.author?.last_name && content.author.last_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType =
      !localFilters.content_type || content.content_type === localFilters.content_type;
    // فلترة الحالة - إذا كان التاب "موافق عليه"، نعرض فقط الموافق عليها
    // وإذا كان التاب "معلق"، نعرض فقط المعلق
    const matchesStatus = activeTab === 'approved' 
      ? content.status === 'approved'
      : activeTab === 'pending'
        ? content.status === 'pending'
        : (!localFilters.status || content.status === localFilters.status);

    return matchesSearch && matchesType && matchesStatus;
  }) : [];

  const handleApproveContent = async (contentId) => {
    try {
      const result = await dispatch(approveContent(contentId));
      if (approveContent.fulfilled.match(result)) {
        toast.success('تم اعتماد المحتوى بنجاح');
        dispatch(fetchPendingContent());
        dispatch(fetchApprovedContent()); // إعادة جلب المنشورات الموافق عليها
      } else {
        // تحسين عرض رسائل الخطأ
        const errorPayload = result.payload || {};
        let errorMessage = errorPayload.message || errorPayload.error || 'فشل اعتماد المحتوى';
        
        // معالجة errors إذا كانت موجودة
        if (errorPayload.errors) {
          if (typeof errorPayload.errors === 'string') {
            // إذا كانت errors نصية (مثل: "['Student content must be approved by a supervisor.']")
            try {
              // محاولة استخراج الرسالة من النص
              const errorsMatch = errorPayload.errors.match(/\[(.*?)\]/);
              if (errorsMatch && errorsMatch[1]) {
                errorMessage = errorsMatch[1].replace(/'/g, '').trim();
              } else {
                errorMessage = errorPayload.errors;
              }
            } catch (e) {
              errorMessage = errorPayload.errors;
            }
          } else if (Array.isArray(errorPayload.errors)) {
            // إذا كانت errors مصفوفة
            errorMessage = errorPayload.errors.join(', ');
          } else if (typeof errorPayload.errors === 'object') {
            // إذا كانت errors كائن
            errorMessage = Object.values(errorPayload.errors).flat().join(', ');
          }
        }
        
        toast.error(errorMessage, { duration: 5000 });
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
          reason: rejectionReason || '',
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

  const handleReactToPost = async (postId) => {
    try {
      const result = await dispatch(reactToPost(postId));
      if (reactToPost.fulfilled.match(result)) {
        // تحديث المحتوى المحلي
        if (activeTab === 'pending') {
          dispatch(fetchPendingContent());
        } else {
          dispatch(fetchApprovedContent());
        }
      } else {
        const errorMessage = result.payload?.message || 
                           result.payload?.error || 
                           'فشل الإعجاب بالمنشور';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الإعجاب بالمنشور');
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentText.trim()) {
      toast.error('يرجى إدخال نص التعليق');
      return;
    }

    try {
      const result = await dispatch(addComment({
        postId,
        text: commentText.trim(),
      }));
      if (addComment.fulfilled.match(result)) {
        toast.success('تم إضافة التعليق بنجاح');
        setCommentText('');
        // إعادة جلب التعليقات للمنشور بعد إضافة تعليق جديد
        await dispatch(fetchPostComments(postId));
        // تحديث المحتوى حسب التاب النشط
        if (activeTab === 'pending') {
          dispatch(fetchPendingContent());
        } else {
          dispatch(fetchApprovedContent());
        }
      } else {
        const errorPayload = result.payload || {};
        let errorMessage = errorPayload.message || errorPayload.error || 'فشل إضافة التعليق';
        
        // معالجة errors
        if (errorPayload.errors) {
          if (typeof errorPayload.errors === 'string') {
            errorMessage = errorPayload.errors;
          } else if (Array.isArray(errorPayload.errors)) {
            errorMessage = errorPayload.errors.join(', ');
          } else if (typeof errorPayload.errors === 'object') {
            errorMessage = Object.values(errorPayload.errors).flat().join(', ');
          }
        }
        
        toast.error(errorMessage, { duration: 5000 });
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة التعليق');
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

      {/* Create New Post (Supervisor) */}
      <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-dark mb-3" style={{ fontFamily: 'inherit' }}>
          إنشاء منشور مجتمعي جديد
        </h2>
        <p className="text-sm text-dark-lighter mb-4">
          يمكنك نشر محتوى تعليمي أو نقاشات حالات لطلابك. سيظهر المحتوى في المجتمع بعد الموافقة عليه إذا كانت هناك صلاحيات مراجعة إضافية.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-dark mb-2.5">
              عنوان المنشور
            </label>
            <input
              type="text"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              placeholder="مثال: مناقشة حالة تسوس عميق"
              className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-dark mb-2.5">
              الوصف (مطلوب) <span className="text-sky-600">*</span>
            </label>
            <textarea
              rows={3}
              value={newPost.description}
              onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
              placeholder="اكتب وصفاً مختصراً للمنشور..."
              required
              className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200 resize-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-dark mb-2.5">
              محتوى المنشور
            </label>
            <textarea
              rows={4}
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="اكتب ملخصاً تعليمياً أو وصفاً للحالة..."
              className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2.5">
              التصنيف
            </label>
            <select
              value={newPost.category}
              onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
              className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
            >
              <option value="general">عام</option>
              <option value="educational">تعليمي</option>
              <option value="case_discussion">مناقشة حالة</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2.5">
              الوسوم (Tags)
            </label>
            <input
              type="text"
              value={newPost.tags}
              onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
              placeholder="مثال: endodontics, caries"
              className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-dark">
              <input
                type="checkbox"
                checked={newPost.is_public}
                onChange={(e) =>
                  setNewPost({ ...newPost, is_public: e.target.checked })
                }
                className="h-4 w-4 rounded border-sky-300 text-sky-500 focus:ring-sky-400"
              />
              <span>عرضه بشكل عام ضمن المجتمع</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-dark">
              <input
                type="checkbox"
                checked={newPost.is_featured}
                onChange={(e) =>
                  setNewPost({ ...newPost, is_featured: e.target.checked })
                }
                className="h-4 w-4 rounded border-sky-300 text-sky-500 focus:ring-sky-400"
              />
              <span>تمييزه كمحتوى مميز</span>
            </label>
          </div>
          <button
            type="button"
            disabled={creating || !newPost.title.trim() || !newPost.description.trim()}
            onClick={async () => {
              try {
                const payload = {
                  title: newPost.title.trim(),
                  content: newPost.content.trim() || newPost.description.trim(),
                  description: newPost.description.trim(),
                  content_type: newPost.content_type,
                  category: newPost.category,
                  file: null,
                  url: null,
                  tags: newPost.tags || null,
                  is_public: newPost.is_public,
                  is_featured: newPost.is_featured,
                };
                const { createPost } = await import('@/store/slices/contentSlice');
                const resultAction = await dispatch(createPost(payload));
                if (createPost.fulfilled.match(resultAction)) {
                  toast.success('تم إنشاء المنشور وإرساله للمراجعة');
                  setNewPost({
                    title: '',
                    content: '',
                    description: '',
                    category: 'general',
                    tags: '',
                    content_type: 'text',
                    is_public: true,
                    is_featured: false,
                  });
                  dispatch(fetchPendingContent());
                } else {
                  const errorPayload = resultAction.payload || {};
                  let errorMessage =
                    errorPayload.message ||
                    errorPayload.error ||
                    'فشل إنشاء المنشور';
                  if (errorPayload.errors) {
                    if (typeof errorPayload.errors === 'string') {
                      errorMessage = errorPayload.errors;
                    } else if (Array.isArray(errorPayload.errors)) {
                      errorMessage = errorPayload.errors.join(', ');
                    } else if (typeof errorPayload.errors === 'object') {
                      errorMessage = Object.values(errorPayload.errors)
                        .flat()
                        .join(', ');
                    }
                  }
                  toast.error(errorMessage, { duration: 5000 });
                }
              } catch (error) {
                toast.error('حدث خطأ أثناء إنشاء المنشور');
              }
            }}
            className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-500/30"
          >
            {creating ? 'جاري الإرسال...' : 'نشر المنشور'}
          </button>
        </div>
      </div>

      {/* Tabs للتبديل بين المعلق والموافق عليه */}
      <div className="rounded-lg bg-white border border-sky-100 p-1 shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20 ${
              activeTab === 'pending'
                ? 'bg-sky-500 text-white'
                : 'bg-transparent text-dark hover:bg-sky-50'
            }`}
          >
            معلق ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20 ${
              activeTab === 'approved'
                ? 'bg-sky-500 text-white'
                : 'bg-transparent text-dark hover:bg-sky-50'
            }`}
          >
            موافق عليه ({stats.approved})
          </button>
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
            {activeTab === 'pending' && (
              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">الحالة</label>
                <select
                  value={localFilters.status}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, status: e.target.value })
                  }
                  className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                >
                  <option value="">جميع الحالات</option>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
            <p className="mt-4 text-base font-semibold text-dark leading-relaxed">
              {activeTab === 'pending' ? 'لا يوجد محتوى معلق' : 'لا يوجد محتوى موافق عليه'}
            </p>
            <p className="mt-2 text-sm text-dark-lighter leading-relaxed">
              {searchTerm || localFilters.content_type || localFilters.status !== 'pending'
                ? 'لا يوجد محتوى يطابق معايير البحث'
                : activeTab === 'pending' 
                  ? 'جميع المحتوى تمت مراجعته'
                  : 'لا توجد منشورات موافق عليها بعد'}
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
                          {content.content || content.description || content.body || 'لا يوجد محتوى'}
                        </p>
                      </div>

                      {content.file && (
                        <div className="mb-4">
                          {(() => {
                            const baseUrl = process.env.NEXT_PUBLIC_API_URL 
                              ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
                              : 'https://medismile1-production.up.railway.app';
                            const fileUrl = content.file.startsWith('http') 
                              ? content.file 
                              : `${baseUrl}${content.file}`;
                            
                            if (content.file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                              return (
                                <img
                                  src={fileUrl}
                                  alt="محتوى وسائط"
                                  className="max-w-md rounded-lg border-2 border-sky-200"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              );
                            } else if (content.file.match(/\.(mp4|webm|ogg)$/i)) {
                              return (
                                <video
                                  src={fileUrl}
                                  controls
                                  className="max-w-md rounded-lg border-2 border-sky-200"
                                >
                                  متصفحك لا يدعم تشغيل الفيديو
                                </video>
                              );
                            } else {
                              return (
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sky-600 hover:text-sky-700 text-sm font-semibold transition-colors"
                                >
                                  عرض الملف المرفق
                                </a>
                              );
                            }
                          })()}
                        </div>
                      )}
                      
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
                        {content.author_name && (
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-sky-500 flex-shrink-0" />
                            <span>{content.author_name}</span>
                          </div>
                        )}
                        {!content.author_name && content.author && (
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-sky-500 flex-shrink-0" />
                            <span>
                              {content.author?.first_name} {content.author?.last_name}
                              {content.author?.username && ` (${content.author.username})`}
                            </span>
                          </div>
                        )}
                        {content.university_name && (
                          <div className="flex items-center gap-2">
                            <DocumentTextIcon className="h-4 w-4 text-sky-500 flex-shrink-0" />
                            <span>{content.university_name}</span>
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
                        {content.approved_by_name && (
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4 text-sky-500 flex-shrink-0" />
                            <span>موافق عليه من: {content.approved_by_name}</span>
                          </div>
                        )}
                      </div>

                      {content.rejection_reason && (
                        <div className="mt-4 p-4 rounded-lg bg-sky-50 border-2 border-sky-200">
                          <p className="text-xs font-semibold text-sky-800 mb-1">سبب الرفض:</p>
                          <p className="text-sm text-sky-900 leading-relaxed">{content.rejection_reason}</p>
                        </div>
                      )}

                      {/* قسم الإعجابات والتعليقات - فقط للمنشورات الموافق عليها */}
                      {content.status === 'approved' && (
                        <div className="mt-4 pt-4 border-t border-sky-100">
                          <div className="flex items-center gap-4 mb-3">
                            <button
                              onClick={() => handleReactToPost(content.id)}
                              className="flex items-center gap-2 rounded-lg border-2 border-sky-200 bg-white px-3 py-1.5 text-sm font-semibold text-dark hover:bg-sky-50 hover:border-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                            >
                              {content.liked ? (
                                <HeartIconSolid className="h-5 w-5 text-red-500" />
                              ) : (
                                <HeartIcon className="h-5 w-5 text-dark-lighter" />
                              )}
                              <span>{content.likes_count || 0}</span>
                            </button>
                            <button
                              onClick={async () => {
                                const newSelectedPost = selectedPostForComment === content.id ? null : content.id;
                                setSelectedPostForComment(newSelectedPost);
                                
                                // جلب التعليقات عند فتح قسم التعليقات
                                if (newSelectedPost && (!content.comments || content.comments.length === 0)) {
                                  try {
                                    await dispatch(fetchPostComments(content.id));
                                  } catch (error) {
                                    console.error('Failed to fetch comments:', error);
                                  }
                                }
                              }}
                              className="flex items-center gap-2 rounded-lg border-2 border-sky-200 bg-white px-3 py-1.5 text-sm font-semibold text-dark hover:bg-sky-50 hover:border-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                            >
                              <ChatBubbleLeftRightIcon className="h-5 w-5 text-dark-lighter" />
                              <span>{content.comments_count || content.comments?.length || 0}</span>
                            </button>
                          </div>

                          {/* نموذج إضافة تعليق */}
                          {selectedPostForComment === content.id && (
                            <div className="mb-3 p-3 rounded-lg bg-sky-50 border-2 border-sky-200">
                              <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                rows={3}
                                placeholder="أضف تعليقاً..."
                                className="w-full rounded-lg border-2 border-sky-200 bg-white px-3 py-2 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200 resize-none mb-2"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAddComment(content.id)}
                                  className="flex-1 rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                                >
                                  إرسال
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedPostForComment(null);
                                    setCommentText('');
                                  }}
                                  className="rounded-lg border-2 border-sky-200 bg-white px-3 py-1.5 text-sm font-semibold text-dark hover:bg-sky-50 hover:border-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                                >
                                  إلغاء
                                </button>
                              </div>
                            </div>
                          )}

                          {/* عرض التعليقات */}
                          {selectedPostForComment === content.id && (
                            <>
                              {content.comments && content.comments.length > 0 ? (
                                <div className="space-y-2 mt-3">
                                  <p className="text-sm font-semibold text-dark mb-2">التعليقات ({content.comments.length})</p>
                                  {content.comments.map((comment) => (
                                    <div key={comment.id} className="p-3 rounded-lg bg-white border-2 border-sky-100">
                                      <div className="flex items-start gap-2">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-semibold text-dark">
                                              {comment.author_name || comment.author?.first_name || comment.author?.username || 'مستخدم'}
                                            </p>
                                            {comment.created_at && (
                                              <p className="text-xs text-dark-lighter">
                                                {new Date(comment.created_at).toLocaleDateString('ar-SA', {
                                                  year: 'numeric',
                                                  month: 'short',
                                                  day: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                                })}
                                              </p>
                                            )}
                                          </div>
                                          <p className="text-sm text-dark-lighter leading-relaxed whitespace-pre-wrap">
                                            {comment.text || comment.content || 'لا يوجد نص'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-3 p-4 rounded-lg bg-sky-50 border-2 border-sky-200 text-center">
                                  <p className="text-sm text-dark-lighter">لا توجد تعليقات بعد</p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* أزرار الموافقة/الرفض - فقط للمحتوى المعلق */}
                    {content.status === 'pending' && activeTab === 'pending' && (
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
                          className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30"
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
                {selectedContent.description || selectedContent.content || selectedContent.body || 'لا يوجد محتوى'}
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
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500/30"
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









