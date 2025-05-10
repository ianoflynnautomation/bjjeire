export const CITIES = [
    'Dublin',
    'Cork',
    'Galway',
    'Limerick',
    'Waterford',
    'Kilkenny',
    'Wexford',
    'Kerry',
    'Tipperary',
    'Clare',
    'Mayo',
    'Donegal',
    'Sligo',
    'Louth',
    'Meath',
    'Kildare',
    'Wicklow',
    'Laois',
    'Offaly',
    'Westmeath',
    'Carlow',
    'Leitrim',
    'Roscommon',
    'Longford',
    'Cavan',
    'Monaghan'
  ] as const;
  

export type City = typeof CITIES[number];

