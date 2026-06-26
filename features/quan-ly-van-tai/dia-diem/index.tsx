import React from 'react';
import TransportModulePage from '../shared/TransportModulePage';
import { TRANSPORT_MODULES } from '../shared/transport-config';

const DiaDiemPage: React.FC = () => <TransportModulePage config={TRANSPORT_MODULES.locations} />;

export default DiaDiemPage;
