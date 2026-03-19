# 🔧 حل مشكلة "Unknown" فوق الرسائل

## المشكلة:
عند عرض الرسائل القديمة، يظهر "Unknown" بدلاً من اسم المرسل.

## السبب:
الرسائل القديمة في قاعدة البيانات تم حفظها بدون `sender_name` أو بقيمة خاطئة.

---

## ✅ الحل:

### الخطوة 1: إصلاح الرسائل القديمة

```bash
fix-messages.bat
```

أو يدوياً:
```bash
cd backend
node fix-messages.js
```

**يجب أن ترى:**
```
✅ Fixed message 1: user-123 → test
✅ Fixed message 2: admin → admin
...
✅ Fixed: X messages
✅ Done!
```

---

### الخطوة 2: أعد تشغيل Backend

```bash
cd backend
npm start
```

---

### الخطوة 3: أعد تحميل المتصفح

```bash
Ctrl+Shift+R
```

---

## ✅ الآن:

- ✅ الرسائل القديمة تعرض اسم المرسل الصحيح
- ✅ الرسائل الجديدة تُحفظ بشكل صحيح
- ✅ لا يظهر "Unknown" بعد الآن

---

## 📝 ملاحظة:

### للرسائل الجديدة:
الآن عند إرسال رسالة جديدة، يتم حفظ:
- `sender_id`: معرف المستخدم
- `sender_name`: اسم المستخدم
- `room_id`: معرف الغرفة
- `room_type`: نوع الدردشة (private/group)

### عند استرجاع الرسائل:
Backend يحول التنسيق من database format (snake_case) إلى frontend format (camelCase):
- `sender_name` → `senderName`
- `sender_id` → `senderId`
- `room_id` → `roomId`
- إلخ...

---

## 🎯 اختبار:

1. شغل `fix-messages.bat`
2. أعد تشغيل Backend
3. افتح محادثة قديمة
4. يجب أن ترى أسماء المرسلين الصحيحة

**تم الإصلاح! ✅**
