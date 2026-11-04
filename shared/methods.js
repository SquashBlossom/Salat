/* Calculation methods and prayer list. Owns: data only. */
export const METHODS={
  isna:{name:'ISNA (North America)',fajrAngle:15,ishaAngle:15},
  mwl:{name:'Muslim World League',fajrAngle:18,ishaAngle:17},
  egypt:{name:'Egyptian General Authority',fajrAngle:19.5,ishaAngle:17.5},
  karachi:{name:'Univ. of Islamic Sciences, Karachi',fajrAngle:18,ishaAngle:18},
  makkah:{name:'Umm al-Qura, Makkah',fajrAngle:18.5,ishaAngle:null,ishaMinutes:90},
  dubai:{name:'Dubai',fajrAngle:18.2,ishaAngle:18.2},
  qatar:{name:'Qatar',fajrAngle:18,ishaAngle:null,ishaMinutes:90},
  kuwait:{name:'Kuwait',fajrAngle:18,ishaAngle:17.5},
  singapore:{name:'Singapore (MUIS)',fajrAngle:20,ishaAngle:18},
  turkey:{name:'Diyanet, Turkiye',fajrAngle:18,ishaAngle:17},
  france:{name:'UOIF, France',fajrAngle:12,ishaAngle:12},
  moonsighting:{name:'Moonsighting Committee',fajrAngle:18,ishaAngle:18},
  jafari:{name:'Jaʿfari (Leva Institute)',fajrAngle:16,ishaAngle:14}
};

export const PRAYERS=[
  {k:'fajr',en:'Fajr',ar:'الفجر',icon:'i-fajr',sub:'First light',obl:true},
  {k:'sunrise',en:'Sunrise',ar:'الشروق',icon:'i-sunrise',sub:'Fajr window closes',obl:false},
  {k:'dhuhr',en:'Dhuhr',ar:'الظهر',icon:'i-dhuhr',sub:'Sun past zenith',obl:true},
  {k:'asr',en:'Asr',ar:'العصر',icon:'i-asr',sub:'Afternoon',obl:true},
  {k:'maghrib',en:'Maghrib',ar:'المغرب',icon:'i-maghrib',sub:'Sunset',obl:true},
  {k:'isha',en:'Isha',ar:'العشاء',icon:'i-isha',sub:'Night',obl:true}
];
