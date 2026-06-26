import React from 'react';
import { txt } from '../lib/text';
import { Bell } from 'lucide-react';
import ComingSoonLayout from '../components/placeholder/ComingSoonLayout';

const NotificationPage: React.FC = () => {
  return (
    <ComingSoonLayout
      title={txt('notification.title')}
      description="Tính năng thông báo đang được phát triển và sẽ sớm ra mắt."
      icon={Bell}
      backLabel="Quay lại Trang chủ"
      backTo="/"
    />
  );
};

export default NotificationPage;
