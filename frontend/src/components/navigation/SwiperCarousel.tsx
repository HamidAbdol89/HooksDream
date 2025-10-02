import React, { useRef, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Import page components
import { Feed } from '@/pages/FeedPage';
import FriendPage from '@/pages/FriendPage';
import NotificationsPage from '@/pages/NotificationsPage';
import MessagesPage from '@/pages/MessagesPage';

const PAGES = [
  { path: '/feed', component: Feed, title: 'Feed' },
  { path: '/friend', component: FriendPage, title: 'Bạn bè' },
  { path: '/notifications', component: NotificationsPage, title: 'Thông báo' },
  { path: '/messages', component: MessagesPage, title: 'Chat' },
];

export const SwiperCarousel: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const swiperRef = useRef<any>(null);
  
  const currentIndex = PAGES.findIndex(page => page.path === location.pathname);
  const validIndex = currentIndex !== -1 ? currentIndex : 0;

  // Update swiper when location changes
  useEffect(() => {
    if (swiperRef.current && currentIndex !== -1) {
      swiperRef.current.slideTo(currentIndex, 300);
    }
  }, [currentIndex]);

  if (!isMobile || currentIndex === -1) {
    const CurrentComponent = PAGES[validIndex]?.component || Feed;
    return (
      <div className="w-full h-full">
        <CurrentComponent />
      </div>
    );
  }

  const handleSlideChange = (swiper: any) => {
    const newIndex = swiper.activeIndex;
    if (newIndex !== currentIndex && PAGES[newIndex]) {
      navigate(PAGES[newIndex].path);
    }
  };

  return (
    <div className="w-full h-full">
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        initialSlide={validIndex}
        onSlideChange={handleSlideChange}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        className="w-full h-full"
        style={{
          '--swiper-pagination-color': '#ffffff',
          '--swiper-pagination-bullet-inactive-color': 'rgba(255,255,255,0.3)',
        } as React.CSSProperties}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet',
          bulletActiveClass: 'swiper-pagination-bullet-active',
        }}
        speed={300}
        touchRatio={1}
        threshold={10}
        longSwipesRatio={0.5}
        longSwipesMs={300}
      >
        {PAGES.map((page, index) => {
          const PageComponent = page.component;
          return (
            <SwiperSlide key={page.path} className="w-full h-full">
              <div className="w-full h-full">
                <PageComponent />
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
};
