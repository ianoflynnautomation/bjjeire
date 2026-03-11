export enum County {
  Dublin = 'Dublin',
  Cork = 'Cork',
  Galway = 'Galway',
  Limerick = 'Limerick',
  Waterford = 'Waterford',
  Kilkenny = 'Kilkenny',
  Wexford = 'Wexford',
  Kerry = 'Kerry',
  Tipperary = 'Tipperary',
  Clare = 'Clare',
  Mayo = 'Mayo',
  Donegal = 'Donegal',
  Sligo = 'Sligo',
  Louth = 'Louth',
  Meath = 'Meath',
  Kildare = 'Kildare',
  Wicklow = 'Wicklow',
  Laois = 'Laois',
  Offaly = 'Offaly',
  Westmeath = 'Westmeath',
  Carlow = 'Carlow',
  Leitrim = 'Leitrim',
  Roscommon = 'Roscommon',
  Longford = 'Longford',
  Cavan = 'Cavan',
  Monaghan = 'Monaghan',
}

export const COUNTIES: { value: County; label: string }[] = Object.values(
  County
).map(city => ({
  value: city,
  label: city,
}))
