# Chat Components Structure

Thư mục chat đã được tổ chức lại thành 3 phần chính để dễ dàng phát triển và bảo trì:

## 📁 Cấu trúc thư mục

```
chat/
├── desktop/           # Components dành riêng cho desktop
├── mobile/            # Components dành riêng cho mobile  
├── shared/            # Components dùng chung
├── ResponsiveChatWindow.tsx
├── ResponsiveConversationsList.tsx
├── index.ts
└── README.md
```

## 🖥️ Desktop Components (`/desktop`)

**Đặc điểm:**
- Tối ưu cho màn hình lớn
- Layout phức tạp hơn với sidebar
- Hover effects và interactions phong phú
- Hiển thị nhiều thông tin hơn

**Components:**
- `ChatHeader.tsx` - Header cho desktop chat
- `ChatWindow.tsx` - Cửa sổ chat desktop
- `ConversationsList.tsx` - Danh sách cuộc trò chuyện
- `FollowingUsersList.tsx` - Danh sách người đang theo dõi

## 📱 Mobile Components (`/mobile`)

**Đặc điểm:**
- Tối ưu cho màn hình nhỏ
- Navigation với back button
- Touch-friendly interactions
- Layout đơn giản, tập trung

**Components:**
- `MobileHeader.tsx` - Header với back button
- `MobileChatWindow.tsx` - Cửa sổ chat mobile
- `MobileConversationsList.tsx` - Danh sách cuộc trò chuyện mobile

## 🔄 Shared Components (`/shared`)

**Đặc điểm:**
- Sử dụng chung cho cả desktop và mobile
- Responsive design với Tailwind classes
- Logic nghiệp vụ chung

**Components:**
- `MessagesList.tsx` - Hiển thị danh sách tin nhắn
- `MessageInput.tsx` - Input để gửi tin nhắn
- `MessageBubble.tsx` - Bubble tin nhắn đơn lẻ

## 🎯 Responsive Components

**`ResponsiveChatWindow.tsx`**
```tsx
// Tự động chọn desktop hoặc mobile
<ResponsiveChatWindow 
  conversationId={conversationId}
  onBack={handleBack} // Chỉ dùng cho mobile
/>
```

**`ResponsiveConversationsList.tsx`**
```tsx
// Tự động chọn layout phù hợp
<ResponsiveConversationsList
  conversations={conversations}
  currentUserId={currentUserId}
  selectedConversationId={selectedId}
  onSelectConversation={handleSelect}
  onSwitchToFollowing={handleSwitch}
/>
```

## 📦 Import Examples

```tsx
// Import từ thư mục cụ thể
import { ChatHeader } from '@/components/chat/desktop';
import { MobileHeader } from '@/components/chat/mobile';
import { MessagesList } from '@/components/chat/shared';

// Import responsive components
import { ResponsiveChatWindow } from '@/components/chat/ResponsiveChatWindow';

// Import tất cả từ index
import { 
  ChatHeader, 
  MobileHeader, 
  MessagesList 
} from '@/components/chat';
```

## 🔧 Migration Guide

### Từ components cũ sang mới:

**Before:**
```tsx
import { ChatWindow } from '@/components/chat/ChatWindow';
import { MobileHeader } from '@/components/chat/MobileHeader';
```

**After:**
```tsx
// Option 1: Sử dụng responsive component (khuyến nghị)
import { ResponsiveChatWindow } from '@/components/chat/ResponsiveChatWindow';

// Option 2: Import riêng biệt
import { ChatWindow } from '@/components/chat/desktop';
import { MobileHeader } from '@/components/chat/mobile';
```

## 🎨 Styling Guidelines

### Desktop Styling:
- Sử dụng `hidden md:block` hoặc `hidden md:flex`
- Hover effects: `hover:bg-muted/50`
- Larger paddings: `p-4 md:p-6`

### Mobile Styling:
- Sử dụng `md:hidden`
- Touch targets: minimum 44px
- Safe area: `safe-area-inset-bottom`

### Shared Styling:
- Responsive classes: `p-3 md:p-6`
- Breakpoint-aware: `text-base md:text-sm`

## 🚀 Development Tips

1. **Phát triển Desktop**: Làm việc trong `/desktop` folder
2. **Phát triển Mobile**: Làm việc trong `/mobile` folder  
3. **Logic chung**: Đặt trong `/shared` folder
4. **Testing**: Sử dụng responsive components để test cả hai platform
5. **Performance**: Lazy load components khi cần thiết

## 🔍 File Organization

```
desktop/
├── ChatHeader.tsx      # Desktop-specific header
├── ChatWindow.tsx      # Main desktop chat interface
├── ConversationsList.tsx # Desktop conversations sidebar
├── FollowingUsersList.tsx # Desktop following list
└── index.ts           # Desktop exports

mobile/
├── MobileHeader.tsx    # Mobile header with back button
├── MobileChatWindow.tsx # Mobile chat interface
├── MobileConversationsList.tsx # Mobile conversations
└── index.ts           # Mobile exports

shared/
├── MessagesList.tsx    # Messages display logic
├── MessageInput.tsx    # Message input component
├── MessageBubble.tsx   # Individual message bubble
└── index.ts           # Shared exports
```

## 🚀 Message Status System

### ✅ **Tính năng đã implement:**

**Message Status Types:**
- `sending` - Đang gửi (với loading animation)
- `sent` - Đã gửi (✓ màu xám)
- `delivered` - Đã nhận (✓✓ màu xám)
- `read` - Đã xem (✓✓ màu xanh)
- `failed` - Gửi thất bại (⚠️ màu đỏ)

**Real-time Features:**
- Socket.IO integration cho status updates
- Optimistic UI updates khi gửi tin nhắn
- Auto-retry cho failed messages
- Real-time message delivery notifications

**Conversation Highlighting:**
- Nổi bật conversations có tin nhắn mới
- Blue border và background cho unread messages
- Animated unread count badges
- Online status indicators

### 🔧 **Technical Implementation:**

**Types & Interfaces:**
```typescript
// @/types/chat.ts
interface MessageStatus {
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp?: string;
  readBy?: string[];
}
```

**Hooks:**
- `useMessageStatus` - Message status management
- `useMessageSocket` - Real-time Socket.IO integration

**Components:**
- `MessageBubble` - Shows status icons
- `ConversationItem` - Highlights new messages
- `MessageInput` - Optimistic sending

### 📱 **User Experience:**

**Visual Indicators:**
- ⏳ Clock icon - Sending
- ✓ Single check - Sent
- ✓✓ Double check gray - Delivered
- ✓✓ Double check blue - Read
- ⚠️ Alert icon - Failed

**Conversation List:**
- 🔵 Blue left border - New messages
- 💙 Blue background tint - Unread
- 🔴 Red badge - Unread count
- ✨ Pulse animation - Active notifications

Cấu trúc này giúp:
- ✅ Tách biệt logic desktop/mobile
- ✅ Dễ dàng maintain và debug
- ✅ Code reuse tối đa
- ✅ Performance tốt hơn
- ✅ Developer experience tốt hơn
- ✅ Real-time message status như WhatsApp/Telegram
- ✅ Professional chat experience
