import React from 'react';
import { SearchUsers } from '@/components/search/SearchUsers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Profile } from '@/store/useAppStore';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();

  const handleUserSelect = (user: Profile) => {
    const userId = user._id || user.id;
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Search className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Tìm kiếm người dùng</h1>
        </div>
        <p className="text-muted-foreground">
          Tìm kiếm và kết nối với những người dùng khác trong cộng đồng
        </p>
      </div>

      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Khám phá người dùng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SearchUsers
            onUserSelect={handleUserSelect}
            showFollowButton={true}
            placeholder="Nhập tên hoặc username để tìm kiếm..."
          />
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">💡 Mẹo tìm kiếm hiệu quả:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Sử dụng tên đầy đủ hoặc username để tìm kiếm chính xác</li>
            <li>• Thử các từ khóa khác nhau nếu không tìm thấy kết quả</li>
            <li>• Kết quả sẽ hiển thị tự động khi bạn nhập</li>
            <li>• Nhấp vào profile để xem thông tin chi tiết</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchPage;
