'use client';

import { useEffect, useState, useRef } from 'react';
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
import {
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  UserIcon,
  AcademicCapIcon,
  ClockIcon,
  CheckIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function MessagingPage() {
  const dispatch = useAppDispatch();
  const { threads = [], currentThread, messages = [], messagesCursor, messagesCount, loading, sending } = useAppSelector(
    (state) => state.messaging
  );
  const { user } = useAppSelector((state) => state.auth);
  
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [showClosedThreads, setShowClosedThreads] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // جلب المحادثات عند التحميل
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

  // تحديث تلقائي للمحادثات كل 30 ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchThreads({ is_closed: showClosedThreads ? null : false })).catch((error) => {
        // لا نعرض toast للأخطاء في polling (لتجنب الإزعاج)
        console.error('Failed to refresh threads:', error);
      });
    }, 30000); // 30 ثانية

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
          // إذا لم تكن هناك messages في response، نجلبها بشكل منفصل
          const payload = result.payload;
          if (!payload.messages || !payload.messages.results || payload.messages.results.length === 0) {
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

  // تحديث تلقائي للرسائل عند فتح محادثة (كل 10 ثواني)
  useEffect(() => {
    if (!selectedThreadId) return;

    const interval = setInterval(() => {
      // جلب الرسائل الجديدة فقط (بدون استبدال الرسائل الحالية)
      dispatch(fetchMessages({ threadId: selectedThreadId, limit: 20, cursor: null })).catch((error) => {
        // لا نعرض toast للأخطاء في polling
        console.error('Failed to refresh messages:', error);
      });
    }, 10000); // 10 ثواني

    // تنظيف interval عند إغلاق المحادثة أو تغييرها
    return () => clearInterval(interval);
  }, [selectedThreadId, dispatch]);

  // تعليم الرسائل كمقروءة عند فتح المحادثة
  useEffect(() => {
    if (messages.length > 0 && user?.id && selectedThreadId) {
      // تعليم الرسائل غير المقروءة كمقروءة
      const unreadMessages = messages.filter(
        msg => !msg.is_read && msg.sender_id !== user.id
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

  // التمرير إلى آخر رسالة عند تحميل الرسائل
  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const filteredThreads = threads.filter((thread) => {
    const matchesSearch =
      thread.material?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.student?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.student?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSendMessage = async () => {
    if (!selectedThreadId || !messageContent.trim()) {
      toast.error('يرجى إدخال رسالة');
      return;
    }

    if (currentThread?.is_closed) {
      toast.error('لا يمكن إرسال رسالة في محادثة مغلقة');
      return;
    }

    try {
      const result = await dispatch(sendMessage({
        threadId: selectedThreadId,
        content: messageContent.trim(),
        message_type: 'text',
      }));

      if (sendMessage.fulfilled.match(result)) {
        setMessageContent('');
        toast.success('تم إرسال الرسالة بنجاح');
        // تحديث الرسائل لجلب الرسائل الجديدة
        dispatch(fetchMessages({ threadId: selectedThreadId, limit: 20, cursor: null }));
      } else {
        const errorMessage = result.payload?.message || 
                           result.payload?.error || 
                           result.payload?.detail ||
                           'فشل إرسال الرسالة';
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
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* قائمة المحادثات */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r border-sky-100 bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-sky-100">
          <h2 className="text-xl font-bold text-dark mb-4" style={{ fontFamily: 'inherit' }}>
            المراسلة
          </h2>
          
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
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <AcademicCapIcon className="h-4 w-4 text-sky-500 flex-shrink-0" />
                          <p className="text-sm font-semibold text-dark truncate">
                            {thread.material?.title || 'مادة دراسية'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <UserIcon className="h-4 w-4 text-dark-lighter flex-shrink-0" />
                          <p className="text-xs text-dark-lighter truncate">
                            {thread.student?.first_name} {thread.student?.last_name}
                          </p>
                        </div>
                        {thread.last_message && (
                          <p className="text-xs text-dark-lighter line-clamp-1 mt-1">
                            {thread.last_message.content}
                          </p>
                        )}
                        {thread.last_message?.created_at && (
                          <p className="text-xs text-dark-lighter mt-1">
                            {new Date(thread.last_message.created_at).toLocaleDateString('ar-SA', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {thread.is_closed && (
                          <span className="text-xs text-red-600 font-medium">مغلقة</span>
                        )}
                        {unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-sky-500 text-white text-xs font-semibold">
                            {unreadCount > 9 ? '9+' : unreadCount}
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
      <div className="flex-1 flex flex-col bg-white">
        {selectedThreadId ? (
          <>
            {/* Header المحادثة */}
            <div className="p-4 border-b border-sky-100 bg-sky-50">
              {currentThread ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AcademicCapIcon className="h-5 w-5 text-sky-500" />
                    <h3 className="text-lg font-semibold text-dark">
                      {currentThread.material?.title || 'مادة دراسية'}
                    </h3>
                    {currentThread.is_closed && (
                      <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
                        مغلقة
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-dark-lighter">
                    <div className="flex items-center gap-1">
                      <UserIcon className="h-4 w-4" />
                      <span>
                        {currentThread.student?.first_name} {currentThread.student?.last_name}
                      </span>
                    </div>
                    {currentThread.created_at && (
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>
                          {new Date(currentThread.created_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-20">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-3 border-solid border-sky-500 border-r-transparent"></div>
                </div>
              )}
            </div>

            {/* الرسائل */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
            >
              {loading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
                    <p className="mt-3 text-sm text-dark-lighter">جاري تحميل الرسائل...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-dark-lighter" />
                    <p className="mt-3 text-sm font-semibold text-dark">لا توجد رسائل</p>
                    <p className="mt-1 text-xs text-dark-lighter">ابدأ المحادثة بإرسال رسالة</p>
                  </div>
                </div>
              ) : (
                <>
                  {messagesCursor && (
                    <div className="text-center py-4">
                      <button
                        onClick={handleLoadMoreMessages}
                        disabled={loadingMore}
                        className="inline-flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                  {messages.map((message) => {
                    const isFromCurrentUser = message.sender_id === user?.id;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isFromCurrentUser
                              ? 'bg-sky-500 text-white'
                              : 'bg-white border-2 border-sky-200 text-dark'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                          <div className={`flex items-center gap-2 mt-2 text-xs ${
                            isFromCurrentUser ? 'text-sky-100' : 'text-dark-lighter'
                          }`}>
                            <span>
                              {new Date(message.created_at).toLocaleTimeString('ar-SA', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isFromCurrentUser && message.is_read && (
                              <CheckIcon className="h-3 w-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input إرسال رسالة */}
            {currentThread && !currentThread.is_closed && (
              <div className="p-4 border-t border-sky-100 bg-white">
                <div className="flex gap-2">
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="اكتب رسالتك..."
                    rows={2}
                    className="flex-1 rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200 resize-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim() || sending}
                    className="flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {currentThread?.is_closed && (
              <div className="p-4 border-t border-sky-100 bg-red-50">
                <p className="text-sm text-red-700 text-center">
                  هذه المحادثة مغلقة ولا يمكن إرسال رسائل جديدة
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="mx-auto h-16 w-16 text-dark-lighter" />
              <p className="mt-4 text-lg font-semibold text-dark">اختر محادثة للبدء</p>
              <p className="mt-2 text-sm text-dark-lighter">
                اختر محادثة من القائمة الجانبية لعرض الرسائل
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

