export type EmergencyContact = {
  id: string;
  nameKey: string;
  detailKey: string;
  tel?: string;
  sms?: string;
  href?: string;
};

/** Uganda / KyU-oriented crisis contacts for the Emergency page and sidebar. */
export const emergencyContacts: EmergencyContact[] = [
  {
    id: 'police',
    nameKey: 'emergency.contactPolice',
    detailKey: 'emergency.contactPoliceDetail',
    tel: '999',
  },
  {
    id: 'police-alt',
    nameKey: 'emergency.contactPoliceAlt',
    detailKey: 'emergency.contactPoliceAltDetail',
    tel: '112',
  },
  {
    id: 'butabika',
    nameKey: 'emergency.contactButabika',
    detailKey: 'emergency.contactButabikaDetail',
    tel: '+256414504476',
  },
  {
    id: 'kyu-counseling',
    nameKey: 'emergency.contactKyu',
    detailKey: 'emergency.contactKyuDetail',
    tel: '+256414285001',
  },
  {
    id: 'befrienders',
    nameKey: 'emergency.contactBefrienders',
    detailKey: 'emergency.contactBefriendersDetail',
    href: 'https://www.befrienders.org/',
  },
];

export const primaryEmergencyTel = '999';
export const primaryEmergencySms = '999';
