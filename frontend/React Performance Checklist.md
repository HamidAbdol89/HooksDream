1. Component & Render

 Dùng React.memo cho component thuần tuý (props không đổi).

 Dùng useCallback / useMemo để giữ reference, tránh truyền hàm/obj mới mỗi render.

 Props key phải ổn định (không dùng index trong list động).

 Tránh rerender global khi state chỉ ảnh hưởng local.

2. Lists & Feeds

 Áp dụng virtualization (react-window hoặc react-virtualized) cho list dài.

 Pagination/infinite scroll thay vì load nguyên cục data.

 Dùng skeleton / shimmer loader thay vì để trắng.

3. State & Data

 Giữ global state tối thiểu, ưu tiên local state.

 Normalize data (theo id) để update 1 phần mà không rerender hết.

 Optimistic UI cho action nhanh (like, comment).

 Cache API responses (React Query / SWR).

4. Rendering Priority

 Dùng startTransition cho update không khẩn cấp.

 Suspense + lazy load cho modal, trang ít dùng.

 Code splitting bằng React.lazy / dynamic imports.

 SSR / Streaming SSR cho time-to-first-paint nhanh.

5. Media (Ảnh/Video)

 Ảnh responsive (srcset, sizes).

 Lazy load ảnh & video ngoài viewport (IntersectionObserver).

 Format mới (WebP, AVIF).

 Blur-up / low-quality placeholder cho ảnh.

 CDN resize ảnh theo device.

6. DOM & CSS

 Tránh DOM quá sâu, giảm node count.

 Animation dùng CSS transform (translate3d, opacity), tránh top/left.

 Thêm will-change cho element hay animate.

 Batch DOM reads/writes (không xen kẽ read+write trong loop).

7. Network

 Batch API calls (GraphQL batching, REST combine).

 Cursor-based pagination thay vì offset.

 Prefetch data khi hover/chuẩn bị điều hướng.

 Sử dụng HTTP cache (ETag, Cache-Control).

8. Tooling & Debug

 Dùng React Profiler để xem component nào rerender nhiều.

 Kiểm tra FPS & memory bằng Chrome Performance tab.

 Track Web Vitals (LCP, CLS, INP).

 Log thời gian API (Sentry / Datadog / NewRelic).

9. Anti-pattern cần tránh

 Không pass inline obj/arr vào props mỗi render
(ví dụ: <Comp style={{ color:'red' }} />).

 Không lưu derived state (data có thể tính lại từ props).

 Không fetch data trong render (phải ở effect hoặc prefetch).

 Không block main thread bằng JS nặng (chuyển sang Web Worker).