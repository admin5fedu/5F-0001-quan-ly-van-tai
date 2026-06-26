import React from 'react';
import TransportModulePage from '../shared/TransportModulePage';
import { TRANSPORT_MODULES } from '../shared/transport-config';

const TaiXePage: React.FC = () => <TransportModulePage config={TRANSPORT_MODULES.drivers} />;

export default TaiXePage;
