import React from 'react';
import TransportModulePage from '../shared/TransportModulePage';
import { TRANSPORT_MODULES } from '../shared/transport-config';

const BangLuongPage: React.FC = () => <TransportModulePage config={TRANSPORT_MODULES.payroll} />;

export default BangLuongPage;
