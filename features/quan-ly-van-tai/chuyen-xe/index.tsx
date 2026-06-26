import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { List, ClipboardList } from 'lucide-react';
import TabGroup from '@/components/ui/TabGroup';
import TransportModulePage from '../shared/TransportModulePage';
import { TRANSPORT_MODULES } from '../shared/transport-config';

const tabs = [
  { id: 'danh-sach', label: 'Danh sách', icon: List },
  { id: 'danh-sach-ct', label: 'Danh sách CT', icon: ClipboardList },
];

const ChuyenXePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'danh-sach';
  
  const config = useMemo(
    () => (activeTab === 'danh-sach-ct' ? TRANSPORT_MODULES.tripDetails : TRANSPORT_MODULES.trips),
    [activeTab],
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (!tab || tab === 'thong-ke') {
      setSearchParams({ tab: 'danh-sach' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="flex h-page flex-col">
      <div className="mb-3">
        <TabGroup
          tabs={tabs}
          activeTab={activeTab === 'thong-ke' ? 'danh-sach' : activeTab}
          onChange={(tab) => setSearchParams({ tab })}
          className="max-w-full overflow-x-auto"
        />
      </div>
      <div className="min-h-0 flex-1">
        <TransportModulePage key={config.id} config={config} />
      </div>
    </div>
  );
};

export default ChuyenXePage;
