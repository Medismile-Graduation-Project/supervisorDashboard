'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchThreads,
  fetchThreadById,
  fetchMessages,
  sendMessage,
  markMessageAsRead,
  clearCurrentThread,
} from '@/store/slices/messagingSlice';
import { fetchCaseById } from '@/store/slices/casesSlice';
import {
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  UserIcon,
  FolderIcon,
  ClockIcon,
  CheckIcon,
  ChatBubbleLeftRightIcon,
  Bars3Icon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function MessagingPage() {
  const dispatch = useAppDispatch();
  const { threads = [], currentThread, messages = [], messagesCursor, messagesCount, loading, sending } = useAppSelector(
    (state) => state.messaging
  );
  const { user } = useAppSelector((state) => state.auth);
  const [casesData, setCasesData] = useState({}); // لتخزين بيانات الحالات
  
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [showClosedThreads, setShowClosedThreads] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showThreadsList, setShowThreadsList] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const shouldScrollRef = useRef(true);

  // التمرير إلى آخر رسالة عند تحميل الرسائل
  const scrollToBottom = useCallback((smooth = false) => {
    if (messagesContainerRef.current && shouldScrollRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  // جلب المحادثات والحالات عند التحميل
  useEffect(() => {
    dispatch(fetchThreads({ is_closed: showClosedThreads ? null : false })).then((result) => {
      if (fetchThreads.rejected.match(result)) {
        const errorMessage = result.payload?.message || 
                             result.payload?.error || 
                             'فشل تحميل المحادثات';
        toast.error(errorMessage);
      }
    });
  }, [dispatch, showClosedThreads]);

  // جلب بيانات الحالات لكل thread
  useEffect(() => {
    const fetchCasesForThreads = async () => {
      if (!Array.isArray(threads) || threads.length === 0) {
        return;
      }

      // جمع جميع case IDs الفريدة من threads
      const caseIds = new Set();
      threads.forEach((thread) => {
        if (thread.thread_type === 'case' && (thread.case_id || thread.case)) {
          const caseId = thread.case_id || thread.case;
          caseIds.add(caseId);
        }
      });

      // جلب بيانات الحالات التي لم يتم جلبها بعد
      const fetchedCases = {};
      await Promise.all(
        Array.from(caseIds).map(async (caseId) => {
          // التحقق من أن الحالة لم يتم جلبها بالفعل
          if (casesData[caseId]) {
            return;
          }
          try {
            const result = await dispatch(fetchCaseById(caseId));
            if (fetchCaseById.fulfilled.match(result)) {
              fetchedCases[caseId] = result.payload;
            }
          } catch (error) {
            console.error(`Error fetching case ${caseId}:`, error);
          }
        })
      );

      // تحديث casesData
      if (Object.keys(fetchedCases).length > 0) {
        setCasesData((prev) => ({ ...prev, ...fetchedCases }));
      }
    };

    fetchCasesForThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads, dispatch]);

  // جلب بيانات الحالة للـ currentThread
  useEffect(() => {
    const fetchCaseForCurrentThread = async () => {
      if (!currentThread || currentThread.thread_type !== 'case') {
        return;
      }

      const caseId = currentThread.case_id || currentThread.case;
      if (!caseId || casesData[caseId]) {
        return;
      }

      try {
        const result = await dispatch(fetchCaseById(caseId));
        if (fetchCaseById.fulfilled.match(result)) {
          setCasesData((prev) => ({ ...prev, [caseId]: result.payload }));
        }
      } catch (error) {
        console.error(`Error fetching case ${caseId}:`, error);
      }
    };

    fetchCaseForCurrentThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentThread, dispatch]);

  // تحديث تلقائي للمحادثات كل 30 ثانية (backup)
  // WebSocket سيحدث threads تلقائياً عند وصول رسائل جديدة
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchThreads({ is_closed: showClosedThreads ? null : false })).catch((error) => {
        // لا نعرض toast للأخطاء في polling (لتجنب الإزعاج)
        console.error('Failed to refresh threads:', error);
      });
    }, 30000); // 30 ثانية (backup)

    // تنظيف interval عند إلغاء المكون
    return () => clearInterval(interval);
  }, [dispatch, showClosedThreads]);

  useEffect(() => {
    if (selectedThreadId) {
      // جلب معلومات الـ thread (قد يحتوي على messages أيضاً حسب API)
      dispatch(fetchThreadById(selectedThreadId)).then((result) => {
        if (fetchThreadById.rejected.match(result)) {
          const errorMessage = result.payload?.message || 
                               result.payload?.error || 
                               result.payload?.detail ||
                               'فشل تحميل المحادثة';
          toast.error(errorMessage);
        } else if (fetchThreadById.fulfilled.match(result)) {
          // التحقق من وجود messages في response
          const payload = result.payload;
          const threadData = payload.thread || payload;
          const messagesData = payload.messages || threadData.messages;
          
          // دعم تنسيقين: messages array مباشر أو messages.results
          const hasMessages = messagesData && (
            Array.isArray(messagesData) ? messagesData.length > 0 : 
            (messagesData.results && messagesData.results.length > 0)
          );
          
          // إذا لم تكن هناك messages في response، نجلبها بشكل منفصل
          if (!hasMessages) {
            dispatch(fetchMessages({ threadId: selectedThreadId, limit: 20, cursor: null })).then((msgResult) => {
              if (fetchMessages.rejected.match(msgResult)) {
                const errorMessage = msgResult.payload?.message || 
                                     msgResult.payload?.error || 
                                     msgResult.payload?.detail ||
                                     'فشل تحميل الرسائل';
                toast.error(errorMessage);
              }
            });
          }
        }
      });
    } else {
      dispatch(clearCurrentThread());
    }
  }, [selectedThreadId, dispatch]);

  // تحديث تلقائي للرسائل عند فتح محادثة (كل 30 ثانية)
  useEffect(() => {
    if (!selectedThreadId) return;

    const interval = setInterval(() => {
      // جلب الرسائل الجديدة فقط كـ backup (WebSocket هو الطريقة الأساسية)
      dispatch(fetchMessages({ threadId: selectedThreadId, limit: 20, cursor: null })).catch((error) => {
        // لا نعرض toast للأخطاء في polling
        console.error('Failed to refresh messages:', error);
      });
    }, 30000); // 30 ثانية (backup فقط)

    // تنظيف interval عند إغلاق المحادثة أو تغييرها
    return () => clearInterval(interval);
  }, [selectedThreadId, dispatch]);

  // تعليم الرسائل كمقروءة عند فتح المحادثة
  useEffect(() => {
    if (messages.length > 0 && user?.id && selectedThreadId) {
      // تعليم الرسائل غير المقروءة كمقروءة
      // دعم تنسيقين: sender.id أو sender_id
      const unreadMessages = messages.filter(
        msg => {
          const senderId = msg.sender?.id || msg.sender_id;
          return (msg.is_read === undefined || msg.is_read === false) && senderId !== user.id;
        }
      );
      
      // تعليم الرسائل كمقروءة (بشكل متوازي)
      unreadMessages.forEach((message) => {
        dispatch(markMessageAsRead(message.id)).catch((error) => {
          // لا نعرض toast للأخطاء في تحديث حالة القراءة
          console.error('Failed to mark message as read:', error);
        });
      });
      
      // تحديث unread_count في thread بعد قراءة الرسائل
      if (unreadMessages.length > 0 && currentThread) {
        // سيتم تحديث unread_count تلقائياً في reducer
      }
    }
  }, [messages, user?.id, selectedThreadId, currentThread, dispatch]);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages, scrollToBottom]);

  // اكتشاف التمرير اليدوي
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!container) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      shouldScrollRef.current = isNearBottom;
      setIsScrolling(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [selectedThreadId]);

  // إغلاق قائمة المحادثات على الشاشات الصغيرة عند اختيار محادثة
  useEffect(() => {
    if (selectedThreadId && window.innerWidth < 768) {
      setShowThreadsList(false);
    }
  }, [selectedThreadId]);

  const filteredThreads = threads.filter((thread) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const caseId = thread.case_id || thread.case;
    const caseData = caseId ? casesData[caseId] : null;
    
    const matchesSearch =
      thread.case_id?.toLowerCase().includes(searchLower) ||
      caseData?.title?.toLowerCase().includes(searchLower) ||
      thread.participant_student?.first_name?.toLowerCase().includes(searchLower) ||
      thread.participant_student?.last_name?.toLowerCase().includes(searchLower) ||
      thread.participant_patient?.first_name?.toLowerCase().includes(searchLower) ||
      thread.participant_patient?.last_name?.toLowerCase().includes(searchLower);
    return matchesSearch;
  });

  // التحقق من صلاحيات الإرسال (مرونة أكثر - الـ Backend يقرر الصلاحيات النهائية)
  const canSendMessage = (thread) => {
    // فقط التحقق من الأساسيات: thread موجود وغير مغلق، ومستخدم مسجل دخول
    if (!thread || thread.is_closed) return false;
    if (!user?.id) return false;
    
    // السماح بمحاولة الإرسال دائماً - الـ Backend سيرفض إذا لم يكن له صلاحية (403)
    return true;
  };

  const canSendInCurrentThread = currentThread ? canSendMessage(currentThread) : false;

  const handleSendMessage = async () => {
    if (!selectedThreadId || !messageContent.trim()) {
      toast.error('يرجى إدخال رسالة');
      return;
    }

    if (currentThread?.is_closed) {
      toast.error('لا يمكن إرسال رسالة في محادثة مغلقة');
      return;
    }

    // السماح بمحاولة الإرسال - الـ Backend سيرفض إذا لم يكن له صلاحية (403)
    try {
      const result = await dispatch(sendMessage({
        threadId: selectedThreadId,
        content: messageContent.trim(),
        message_type: 'text',
      }));

      if (sendMessage.fulfilled.match(result)) {
        const content = messageContent.trim();
        setMessageContent('');
        shouldScrollRef.current = true;
        // تحديث الرسائل لجلب الرسائل الجديدة
        setTimeout(() => {
          dispatch(fetchMessages({ threadId: selectedThreadId, limit: 20, cursor: null })).then(() => {
            scrollToBottom(true);
          });
        }, 100);
      } else {
        // معالجة الأخطاء من الـ Backend
        const errorPayload = result.payload;
        const statusCode = errorPayload?.status || errorPayload?.statusCode;
        
        let errorMessage = errorPayload?.detail || 
                           errorPayload?.message || 
                           errorPayload?.error ||
                           'فشل إرسال الرسالة';
        
        // معالجة خاصة لخطأ 403 (Forbidden)
        if (statusCode === 403 || errorPayload?.status_code === 403) {
          errorMessage = 'ليس لديك صلاحية لإرسال رسائل في هذه المحادثة';
        }
        
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إرسال الرسالة');
    }
  };

  const handleLoadMoreMessages = async () => {
    if (messagesCursor && selectedThreadId && !loadingMore) {
      setLoadingMore(true);
      try {
        const result = await dispatch(fetchMessages({ 
          threadId: selectedThreadId, 
          cursor: messagesCursor,
          limit: 20,
        }));
        if (fetchMessages.rejected.match(result)) {
          const errorMessage = result.payload?.message || 
                               result.payload?.error || 
                               'فشل تحميل المزيد من الرسائل';
          toast.error(errorMessage);
        }
      } finally {
        setLoadingMore(false);
      }
    }
  };

  const getUnreadCount = (thread) => {
    // استخدام unread_count من API إذا كان موجوداً
    if (thread.unread_count !== undefined && thread.unread_count !== null) {
      return thread.unread_count;
    }
    // إذا لم يكن موجوداً، نعيد 0 (يجب أن يعيده API)
    return 0;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative">
      {/* Mobile Overlay */}
      {showThreadsList && window.innerWidth < 768 && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowThreadsList(false)}
        />
      )}

      {/* قائمة المحادثات */}
      <div
        className={`absolute md:relative inset-y-0 right-0 w-full md:w-1/3 lg:w-1/4 border-r border-sky-100 bg-white flex flex-col z-50 md:z-auto transition-transform duration-300 ${
          showThreadsList ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-sky-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-dark" style={{ fontFamily: 'inherit' }}>
              المراسلة
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowThreadsList(false)}
                className="md:hidden p-2 rounded-lg hover:bg-sky-100 text-dark-lighter"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-dark-lighter" />
            </div>
            <input
              type="text"
              placeholder="ابحث عن محادثة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 pr-10 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
            />
          </div>

          {/* Filter */}
          <label className="flex items-center gap-2 text-sm text-dark-lighter cursor-pointer">
            <input
              type="checkbox"
              checked={showClosedThreads}
              onChange={(e) => setShowClosedThreads(e.target.checked)}
              className="rounded border-sky-300 text-sky-600 focus:ring-sky-500"
            />
            <span>عرض المحادثات المغلقة</span>
          </label>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-3 border-solid border-sky-500 border-r-transparent"></div>
              <p className="mt-3 text-sm text-dark-lighter">جاري تحميل المحادثات...</p>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-8 text-center">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-dark-lighter" />
              <p className="mt-3 text-sm font-semibold text-dark">لا توجد محادثات</p>
              <p className="mt-1 text-xs text-dark-lighter">
                {searchTerm ? 'لا توجد محادثات تطابق البحث' : 'لم يتم إنشاء أي محادثات بعد'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-sky-100">
              {filteredThreads.map((thread) => {
                const unreadCount = getUnreadCount(thread);
                const isSelected = selectedThreadId === thread.id;
                
                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full text-right p-4 hover:bg-sky-50 transition-colors ${
                      isSelected ? 'bg-sky-100 border-r-2 border-sky-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <FolderIcon className="h-4 w-4 text-sky-500 shrink-0" />
                          <p className="text-sm font-semibold text-dark truncate" style={{ fontFamily: 'inherit' }}>
                            {thread.thread_type === 'case' && (thread.case_id || thread.case)
                              ? (() => {
                                  const caseId = thread.case_id || thread.case;
                                  const caseData = casesData[caseId];
                                  return caseData?.title || 'جاري التحميل...';
                                })()
                              : 'محادثة'}
                          </p>
                        </div>
                        {thread.participant_student && (
                          <div className="flex items-center gap-2 mb-1.5">
                            <UserIcon className="h-4 w-4 text-dark-lighter shrink-0" />
                            <p className="text-xs text-dark-lighter truncate" style={{ fontFamily: 'inherit' }}>
                              الطالب: {thread.participant_student.first_name} {thread.participant_student.last_name}
                            </p>
                          </div>
                        )}
                        {thread.participant_patient && (
                          <div className="flex items-center gap-2 mb-1.5">
                            <UserIcon className="h-4 w-4 text-dark-lighter shrink-0" />
                            <p className="text-xs text-dark-lighter truncate" style={{ fontFamily: 'inherit' }}>
                              المريض: {thread.participant_patient.first_name} {thread.participant_patient.last_name}
                            </p>
                          </div>
                        )}
                        {thread.last_message && (
                          <p className="text-xs text-dark-lighter line-clamp-2 mt-1.5 leading-relaxed" style={{ fontFamily: 'inherit' }}>
                            {thread.last_message.content}
                          </p>
                        )}
                        {thread.last_message && (thread.last_message.sent_at || thread.last_message.created_at) && (
                          <p className="text-xs text-dark-lighter mt-1.5" style={{ fontFamily: 'inherit' }}>
                            {new Date(thread.last_message.sent_at || thread.last_message.created_at).toLocaleDateString('ar-SA', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {thread.is_closed && (
                          <span className="text-xs text-red-600 font-medium px-2 py-0.5 bg-red-50 rounded" style={{ fontFamily: 'inherit' }}>
                            مغلقة
                          </span>
                        )}
                        {unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-sky-500 text-white text-xs font-semibold">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* عرض المحادثة */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {selectedThreadId ? (
          <>
            {/* Header المحادثة */}
            <div className="p-4 border-b border-sky-100 bg-sky-50 shrink-0">
              <div className="flex items-center gap-3 mb-3 md:mb-0">
                <button
                  onClick={() => setShowThreadsList(true)}
                  className="md:hidden p-2 rounded-lg hover:bg-sky-100 text-dark-lighter -mr-2"
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
                {currentThread ? (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <FolderIcon className="h-5 w-5 text-sky-500 shrink-0" />
                      <h3 className="text-base sm:text-lg font-semibold text-dark truncate" style={{ fontFamily: 'inherit' }}>
                        {currentThread.thread_type === 'case' && (currentThread.case_id || currentThread.case)
                          ? (() => {
                              const caseId = currentThread.case_id || currentThread.case;
                              const caseData = casesData[caseId];
                              return caseData?.title || 'جاري التحميل...';
                            })()
                          : 'محادثة'}
                      </h3>
                      {currentThread.is_closed && (
                        <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded whitespace-nowrap" style={{ fontFamily: 'inherit' }}>
                          مغلقة
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-dark-lighter flex-wrap">
                      {currentThread.participant_student && (
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-4 w-4 shrink-0" />
                          <span className="truncate" style={{ fontFamily: 'inherit' }}>
                            الطالب: {currentThread.participant_student.first_name} {currentThread.participant_student.last_name}
                          </span>
                        </div>
                      )}
                      {currentThread.participant_patient && (
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-4 w-4 shrink-0" />
                          <span className="truncate" style={{ fontFamily: 'inherit' }}>
                            المريض: {currentThread.participant_patient.first_name} {currentThread.participant_patient.last_name}
                          </span>
                        </div>
                      )}
                      {currentThread.created_at && (
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4 shrink-0" />
                          <span style={{ fontFamily: 'inherit' }}>
                            {new Date(currentThread.created_at).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center flex-1 h-12">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-sky-500 border-r-transparent"></div>
                  </div>
                )}
              </div>
            </div>

            {/* الرسائل */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gradient-to-b from-gray-50 to-white"
              style={{ scrollBehavior: 'smooth' }}
            >
              {loading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
                    <p className="mt-3 text-sm text-dark-lighter" style={{ fontFamily: 'inherit' }}>جاري تحميل الرسائل...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <div className="text-center px-4">
                    <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-dark-lighter mb-3" />
                    <p className="text-sm font-semibold text-dark mb-1" style={{ fontFamily: 'inherit' }}>لا توجد رسائل</p>
                    <p className="text-xs text-dark-lighter" style={{ fontFamily: 'inherit' }}>ابدأ المحادثة بإرسال رسالة</p>
                  </div>
                </div>
              ) : (
                <>
                  {messagesCursor && (
                    <div className="text-center py-3 sticky top-0 bg-transparent z-10">
                      <button
                        onClick={handleLoadMoreMessages}
                        disabled={loadingMore}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-sky-600 hover:text-sky-700 hover:bg-sky-50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        style={{ fontFamily: 'inherit' }}
                      >
                        {loadingMore ? (
                          <>
                            <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-sky-500 border-r-transparent"></div>
                            جاري التحميل...
                          </>
                        ) : (
                          'تحميل المزيد من الرسائل'
                        )}
                      </button>
                    </div>
                  )}
                  {isScrolling && (
                    <div className="sticky top-0 text-center py-2 z-10 bg-transparent">
                      <button
                        onClick={() => {
                          shouldScrollRef.current = true;
                          scrollToBottom(true);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-white bg-sky-500 hover:bg-sky-600 font-medium shadow-lg transition-colors"
                        style={{ fontFamily: 'inherit' }}
                      >
                        التمرير للأسفل
                        <PaperAirplaneIcon className="h-3 w-3 -rotate-45" />
                      </button>
                    </div>
                  )}
                  {messages.map((message, index) => {
                    // دعم تنسيقين: sender.id أو sender_id
                    const senderId = message.sender?.id || message.sender_id;
                    const isFromCurrentUser = senderId === user?.id;
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    // دعم تنسيقين: sent_at أو created_at
                    const messageDate = message.sent_at || message.created_at;
                    const prevMessageDate = prevMessage ? (prevMessage.sent_at || prevMessage.created_at) : null;
                    const showDateSeparator = !prevMessage || 
                      new Date(messageDate).toDateString() !== new Date(prevMessageDate).toDateString();
                    
                    return (
                      <div key={message.id}>
                        {showDateSeparator && (
                          <div className="flex items-center justify-center my-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-sky-200">
                              <ClockIcon className="h-3 w-3 text-dark-lighter" />
                              <span className="text-xs text-dark-lighter font-medium" style={{ fontFamily: 'inherit' }}>
                                {new Date(message.sent_at || message.created_at).toLocaleDateString('ar-SA', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className={`flex items-end gap-2 ${isFromCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!isFromCurrentUser && (
                            <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0 mb-1">
                              <UserIcon className="h-5 w-5 text-sky-600" />
                            </div>
                          )}
                          <div
                            className={`max-w-[75%] sm:max-w-[70%] rounded-2xl p-3 shadow-sm ${
                              isFromCurrentUser
                                ? 'bg-sky-500 text-white rounded-tr-sm'
                                : 'bg-white border border-sky-200 text-dark rounded-tl-sm'
                            }`}
                          >
                            <p className={`text-sm leading-relaxed whitespace-pre-wrap wrap-break-word ${
                              isFromCurrentUser ? 'text-white' : 'text-dark'
                            }`} style={{ fontFamily: 'inherit' }}>
                              {message.content}
                            </p>
                            <div className={`flex items-center gap-1.5 mt-2 text-xs ${
                              isFromCurrentUser ? 'text-sky-100' : 'text-dark-lighter'
                            }`}>
                              <span style={{ fontFamily: 'inherit' }}>
                                {new Date(message.sent_at || message.created_at).toLocaleTimeString('ar-SA', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isFromCurrentUser && (
                                <span className="flex items-center">
                                  {message.is_read !== undefined && message.is_read !== false ? (
                                    <CheckCircleIcon className="h-3.5 w-3.5" />
                                  ) : (
                                    <CheckIcon className="h-3.5 w-3.5" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} className="h-1" />
                </>
              )}
            </div>

            {/* Input إرسال رسالة */}
            {currentThread && !currentThread.is_closed && (
              <div className="p-3 sm:p-4 border-t border-sky-100 bg-white shrink-0">
                <div className="flex gap-2 sm:gap-3 items-end">
                  <textarea
                    value={messageContent}
                    onChange={(e) => {
                      setMessageContent(e.target.value);
                      // تعديل الارتفاع تلقائياً
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="اكتب رسالتك..."
                    rows={1}
                    maxLength={2000}
                    className="flex-1 rounded-lg border-2 border-sky-200 bg-sky-50 px-3 sm:px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200 resize-none max-h-[120px]"
                    style={{ fontFamily: 'inherit' }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim() || sending}
                    className="flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-3 sm:px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    title="إرسال (Enter)"
                  >
                    {sending ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                    ) : (
                      <PaperAirplaneIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {messageContent.length > 0 && (
                  <p className="text-xs text-dark-lighter mt-2 text-left" style={{ fontFamily: 'inherit' }}>
                    {messageContent.length} / 2000
                  </p>
                )}
              </div>
            )}


            {currentThread?.is_closed && (
              <div className="p-4 border-t border-sky-100 bg-red-50 shrink-0">
                <p className="text-sm text-red-700 text-center" style={{ fontFamily: 'inherit' }}>
                  هذه المحادثة مغلقة ولا يمكن إرسال رسائل جديدة
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <ChatBubbleLeftRightIcon className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-dark-lighter mb-4" />
              <p className="text-lg sm:text-xl font-semibold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
                اختر محادثة للبدء
              </p>
              <p className="text-sm text-dark-lighter" style={{ fontFamily: 'inherit' }}>
                اختر محادثة من القائمة الجانبية لعرض الرسائل
              </p>
              {threads.length === 0 && (
                <button
                  onClick={() => setShowThreadsList(true)}
                  className="mt-6 md:hidden inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 transition-colors"
                  style={{ fontFamily: 'inherit' }}
                >
                  <Bars3Icon className="h-5 w-5" />
                  عرض المحادثات
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

