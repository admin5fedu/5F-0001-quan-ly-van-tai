import React from 'react';
import TransportModulePage from '../shared/TransportModulePage';
import { TRANSPORT_MODULES } from '../shared/transport-config';

const DanhSachXePage: React.FC = () => <TransportModulePage config={TRANSPORT_MODULES.vehicles} />;

export default DanhSachXePage;
