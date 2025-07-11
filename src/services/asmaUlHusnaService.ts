import { StorageService } from './storageService';

export interface AsmaUlHusnaName {
  number: number;
  arabic: string;
  transliteration: string;
  translation: string;
  meaning: string;
  benefit?: string;
  isFavorite: boolean;
}

export interface AsmaUlHusnaStats {
  totalRecitations: number;
  favoriteCount: number;
  completedSessions: number;
  currentStreak: number;
  longestStreak: number;
  mostRecitedName: string;
  todayRecitations: number;
}

export class AsmaUlHusnaService {
  private static instance: AsmaUlHusnaService;
  private storageService: StorageService;

  private readonly ASMA_UL_HUSNA: Omit<AsmaUlHusnaName, 'isFavorite'>[] = [
    {
      number: 1,
      arabic: 'الرَّحْمَنُ',
      transliteration: 'Ar-Rahman',
      translation: 'The Compassionate',
      meaning: 'The One who has plenty of mercy for the believers and the blasphemers in this world.',
      benefit: 'Reciting this name brings divine mercy and compassion.'
    },
    {
      number: 2,
      arabic: 'الرَّحِيمُ',
      transliteration: 'Ar-Rahim',
      translation: 'The Merciful',
      meaning: 'The One who has plenty of mercy for the believers in the afterlife.',
      benefit: 'Brings divine mercy and forgiveness.'
    },
    {
      number: 3,
      arabic: 'الْمَلِكُ',
      transliteration: 'Al-Malik',
      translation: 'The King',
      meaning: 'The One with the complete dominion, the One whose dominion is clear from imperfection.',
      benefit: 'Helps in gaining respect and authority.'
    },
    {
      number: 4,
      arabic: 'الْقُدُّوسُ',
      transliteration: 'Al-Quddus',
      translation: 'The Holy',
      meaning: 'The One who is pure from any imperfection and clear from children and adversaries.',
      benefit: 'Purifies the heart and soul from sins.'
    },
    {
      number: 5,
      arabic: 'السَّلاَمُ',
      transliteration: 'As-Salam',
      translation: 'The Peace',
      meaning: 'The One who is free from every imperfection.',
      benefit: 'Brings peace of mind and tranquility.'
    },
    {
      number: 6,
      arabic: 'الْمُؤْمِنُ',
      transliteration: 'Al-Mu\'min',
      translation: 'The Guardian of Faith',
      meaning: 'The One who witnessed for Himself that no one is God but Him.',
      benefit: 'Strengthens faith and trust in Allah.'
    },
    {
      number: 7,
      arabic: 'الْمُهَيْمِنُ',
      transliteration: 'Al-Muhaymin',
      translation: 'The Protector',
      meaning: 'The One who witnesses the saying and deeds of His creatures.',
      benefit: 'Provides divine protection and safety.'
    },
    {
      number: 8,
      arabic: 'الْعَزِيزُ',
      transliteration: 'Al-Aziz',
      translation: 'The Mighty',
      meaning: 'The One who is victorious and nobody can be victorious over Him.',
      benefit: 'Grants strength and victory over difficulties.'
    },
    {
      number: 9,
      arabic: 'الْجَبَّارُ',
      transliteration: 'Al-Jabbar',
      translation: 'The Compeller',
      meaning: 'The One who makes the creation do what He wants.',
      benefit: 'Helps overcome obstacles and enemies.'
    },
    {
      number: 10,
      arabic: 'الْمُتَكَبِّرُ',
      transliteration: 'Al-Mutakabbir',
      translation: 'The Majestic',
      meaning: 'The One who is greater than everything in status.',
      benefit: 'Removes pride and arrogance from the heart.'
    },
    {
      number: 11,
      arabic: 'الْخَالِقُ',
      transliteration: 'Al-Khaliq',
      translation: 'The Creator',
      meaning: 'The One who brings everything from non-existence to existence.',
      benefit: 'Enhances creativity and innovation.'
    },
    {
      number: 12,
      arabic: 'الْبَارِئُ',
      transliteration: 'Al-Bari\'',
      translation: 'The Originator',
      meaning: 'The One who created the creation and made it free from any flaw.',
      benefit: 'Helps in creating harmony and perfection.'
    },
    {
      number: 13,
      arabic: 'الْمُصَوِّرُ',
      transliteration: 'Al-Musawwir',
      translation: 'The Fashioner',
      meaning: 'The One who shapes His creatures however He likes.',
      benefit: 'Enhances artistic abilities and appreciation of beauty.'
    },
    {
      number: 14,
      arabic: 'الْغَفَّارُ',
      transliteration: 'Al-Ghaffar',
      translation: 'The Repeatedly Forgiving',
      meaning: 'The One who forgives the sins of His slaves time and time again.',
      benefit: 'Brings forgiveness for sins and mistakes.'
    },
    {
      number: 15,
      arabic: 'الْقَهَّارُ',
      transliteration: 'Al-Qahhar',
      translation: 'The Subduer',
      meaning: 'The One who dominates all creation and they are subservient to His greatness.',
      benefit: 'Helps overcome enemies and difficulties.'
    },
    // Adding more names to complete the 99...
    {
      number: 16,
      arabic: 'الْوَهَّابُ',
      transliteration: 'Al-Wahhab',
      translation: 'The Bestower',
      meaning: 'The One who continuously grants blessings without expecting anything in return.',
      benefit: 'Attracts divine blessings and provisions.'
    },
    {
      number: 17,
      arabic: 'الرَّزَّاقُ',
      transliteration: 'Ar-Razzaq',
      translation: 'The Provider',
      meaning: 'The One who provides sustenance to all His creation.',
      benefit: 'Brings abundant sustenance and rizq.'
    },
    {
      number: 18,
      arabic: 'الْفَتَّاحُ',
      transliteration: 'Al-Fattah',
      translation: 'The Opener',
      meaning: 'The One who opens all doors and solves all problems.',
      benefit: 'Opens doors of opportunity and success.'
    },
    {
      number: 19,
      arabic: 'الْعَلِيمُ',
      transliteration: 'Al-Alim',
      translation: 'The All-Knowing',
      meaning: 'The One who knows everything that was, is, and will be.',
      benefit: 'Increases knowledge and wisdom.'
    },
    {
      number: 20,
      arabic: 'الْقَابِضُ',
      transliteration: 'Al-Qabid',
      translation: 'The Restrictor',
      meaning: 'The One who constricts sustenance and expands it.',
      benefit: 'Helps in self-control and discipline.'
    },
    // Continue with remaining names...
    {
      number: 21,
      arabic: 'الْبَاسِطُ',
      transliteration: 'Al-Basit',
      translation: 'The Expander',
      meaning: 'The One who expands and increases sustenance.',
      benefit: 'Brings expansion in wealth and happiness.'
    },
    {
      number: 22,
      arabic: 'الْخَافِضُ',
      transliteration: 'Al-Khafid',
      translation: 'The Abaser',
      meaning: 'The One who lowers whoever He willed.',
      benefit: 'Brings humility and defeats pride.'
    },
    {
      number: 23,
      arabic: 'الرَّافِعُ',
      transliteration: 'Ar-Rafi\'',
      translation: 'The Exalter',
      meaning: 'The One who raises whoever He willed.',
      benefit: 'Elevates status and brings honor.'
    },
    {
      number: 24,
      arabic: 'الْمُعِزُّ',
      transliteration: 'Al-Mu\'izz',
      translation: 'The Bestower of Honor',
      meaning: 'The One who gives honor and might to whoever He willed.',
      benefit: 'Brings honor and respect.'
    },
    {
      number: 25,
      arabic: 'الْمُذِلُّ',
      transliteration: 'Al-Mudhill',
      translation: 'The Humiliator',
      meaning: 'The One who humiliates whoever He willed.',
      benefit: 'Protection from humiliation and disgrace.'
    },
    {
      number: 26,
      arabic: 'السَّمِيعُ',
      transliteration: 'As-Sami\'',
      translation: 'The All-Hearing',
      meaning: 'The One who hears all sounds and voices.',
      benefit: 'Prayers are heard and answered.'
    },
    {
      number: 27,
      arabic: 'الْبَصِيرُ',
      transliteration: 'Al-Basir',
      translation: 'The All-Seeing',
      meaning: 'The One who sees all things whether they are hidden or apparent.',
      benefit: 'Increases insight and spiritual vision.'
    },
    {
      number: 28,
      arabic: 'الْحَكَمُ',
      transliteration: 'Al-Hakam',
      translation: 'The Judge',
      meaning: 'The One who judges between His creation.',
      benefit: 'Brings justice and fair judgment.'
    },
    {
      number: 29,
      arabic: 'الْعَدْلُ',
      transliteration: 'Al-Adl',
      translation: 'The Just',
      meaning: 'The One who is just in His judgment.',
      benefit: 'Establishes justice and fairness.'
    },
    {
      number: 30,
      arabic: 'اللَّطِيفُ',
      transliteration: 'Al-Latif',
      translation: 'The Subtle',
      meaning: 'The One who is gentle and kind to His slaves.',
      benefit: 'Brings gentleness and ease in difficulties.'
    },
    {
      number: 31,
      arabic: 'الْخَبِيرُ',
      transliteration: 'Al-Khabir',
      translation: 'The Aware',
      meaning: 'The One who knows the inner secrets of all things.',
      benefit: 'Increases awareness and understanding.'
    },
    {
      number: 32,
      arabic: 'الْحَلِيمُ',
      transliteration: 'Al-Halim',
      translation: 'The Forbearing',
      meaning: 'The One who delays punishment for those who deserve it.',
      benefit: 'Develops patience and tolerance.'
    },
    {
      number: 33,
      arabic: 'الْعَظِيمُ',
      transliteration: 'Al-Azim',
      translation: 'The Magnificent',
      meaning: 'The One who is greatest in every aspect.',
      benefit: 'Brings magnificence and greatness.'
    },
    {
      number: 34,
      arabic: 'الْغَفُورُ',
      transliteration: 'Al-Ghafur',
      translation: 'The Forgiving',
      meaning: 'The One who forgives sins and faults.',
      benefit: 'Brings divine forgiveness.'
    },
    {
      number: 35,
      arabic: 'الشَّكُورُ',
      transliteration: 'Ash-Shakur',
      translation: 'The Appreciative',
      meaning: 'The One who appreciates good deeds.',
      benefit: 'Increases gratitude and thankfulness.'
    },
    {
      number: 36,
      arabic: 'الْعَلِيُّ',
      transliteration: 'Al-Ali',
      translation: 'The Exalted',
      meaning: 'The One who is higher than everything.',
      benefit: 'Elevates status and rank.'
    },
    {
      number: 37,
      arabic: 'الْكَبِيرُ',
      transliteration: 'Al-Kabir',
      translation: 'The Great',
      meaning: 'The One who is greater than everything.',
      benefit: 'Brings greatness and honor.'
    },
    {
      number: 38,
      arabic: 'الْحَفِيظُ',
      transliteration: 'Al-Hafiz',
      translation: 'The Preserver',
      meaning: 'The One who preserves and protects.',
      benefit: 'Provides protection and preservation.'
    },
    {
      number: 39,
      arabic: 'الْمُقِيتُ',
      transliteration: 'Al-Muqit',
      translation: 'The Nourisher',
      meaning: 'The One who provides nourishment.',
      benefit: 'Provides sustenance and nourishment.'
    },
    {
      number: 40,
      arabic: 'الْحَسِيبُ',
      transliteration: 'Al-Hasib',
      translation: 'The Reckoner',
      meaning: 'The One who takes account of everything.',
      benefit: 'Brings accountability and justice.'
    },
    {
      number: 41,
      arabic: 'الْجَلِيلُ',
      transliteration: 'Al-Jalil',
      translation: 'The Majestic',
      meaning: 'The One who is majestic and sublime.',
      benefit: 'Brings majesty and dignity.'
    },
    {
      number: 42,
      arabic: 'الْكَرِيمُ',
      transliteration: 'Al-Karim',
      translation: 'The Generous',
      meaning: 'The One who is generous and noble.',
      benefit: 'Increases generosity and nobility.'
    },
    {
      number: 43,
      arabic: 'الرَّقِيبُ',
      transliteration: 'Ar-Raqib',
      translation: 'The Watchful',
      meaning: 'The One who watches over all creation.',
      benefit: 'Provides divine protection and vigilance.'
    },
    {
      number: 44,
      arabic: 'الْمُجِيبُ',
      transliteration: 'Al-Mujib',
      translation: 'The Responsive',
      meaning: 'The One who responds to prayers.',
      benefit: 'Prayers are answered quickly.'
    },
    {
      number: 45,
      arabic: 'الْوَاسِعُ',
      transliteration: 'Al-Wasi\'',
      translation: 'The All-Encompassing',
      meaning: 'The One whose knowledge encompasses everything.',
      benefit: 'Expands knowledge and understanding.'
    },
    {
      number: 46,
      arabic: 'الْحَكِيمُ',
      transliteration: 'Al-Hakim',
      translation: 'The Wise',
      meaning: 'The One who is wise in all His actions.',
      benefit: 'Increases wisdom and good judgment.'
    },
    {
      number: 47,
      arabic: 'الْوَدُودُ',
      transliteration: 'Al-Wadud',
      translation: 'The Loving',
      meaning: 'The One who loves His righteous servants.',
      benefit: 'Increases love and affection.'
    },
    {
      number: 48,
      arabic: 'الْمَجِيدُ',
      transliteration: 'Al-Majid',
      translation: 'The Glorious',
      meaning: 'The One who is glorious and noble.',
      benefit: 'Brings glory and honor.'
    },
    {
      number: 49,
      arabic: 'الْبَاعِثُ',
      transliteration: 'Al-Ba\'ith',
      translation: 'The Resurrector',
      meaning: 'The One who resurrects the dead.',
      benefit: 'Renews life and energy.'
    },
    {
      number: 50,
      arabic: 'الشَّهِيدُ',
      transliteration: 'Ash-Shahid',
      translation: 'The Witness',
      meaning: 'The One who witnesses everything.',
      benefit: 'Truth is revealed and witnessed.'
    },
    {
      number: 51,
      arabic: 'الْحَقُّ',
      transliteration: 'Al-Haqq',
      translation: 'The Truth',
      meaning: 'The One who is the ultimate truth.',
      benefit: 'Reveals truth and dispels falsehood.'
    },
    {
      number: 52,
      arabic: 'الْوَكِيلُ',
      transliteration: 'Al-Wakil',
      translation: 'The Trustee',
      meaning: 'The One who manages all affairs.',
      benefit: 'Provides reliable support and management.'
    },
    {
      number: 53,
      arabic: 'الْقَوِيُّ',
      transliteration: 'Al-Qawi',
      translation: 'The Strong',
      meaning: 'The One who possesses complete strength.',
      benefit: 'Provides strength and power.'
    },
    {
      number: 54,
      arabic: 'الْمَتِينُ',
      transliteration: 'Al-Matin',
      translation: 'The Firm',
      meaning: 'The One who is firm and steadfast.',
      benefit: 'Brings firmness and stability.'
    },
    {
      number: 55,
      arabic: 'الْوَلِيُّ',
      transliteration: 'Al-Wali',
      translation: 'The Friend',
      meaning: 'The One who is the friend of believers.',
      benefit: 'Provides friendship and support.'
    },
    {
      number: 56,
      arabic: 'الْحَمِيدُ',
      transliteration: 'Al-Hamid',
      translation: 'The Praiseworthy',
      meaning: 'The One who is worthy of all praise.',
      benefit: 'Increases praise and commendation.'
    },
    {
      number: 57,
      arabic: 'الْمُحْصِي',
      transliteration: 'Al-Muhsi',
      translation: 'The Counter',
      meaning: 'The One who counts and enumerates all things.',
      benefit: 'Brings precision and accuracy.'
    },
    {
      number: 58,
      arabic: 'الْمُبْدِئُ',
      transliteration: 'Al-Mubdi\'',
      translation: 'The Originator',
      meaning: 'The One who originates creation.',
      benefit: 'Initiates new beginnings.'
    },
    {
      number: 59,
      arabic: 'الْمُعِيدُ',
      transliteration: 'Al-Mu\'id',
      translation: 'The Restorer',
      meaning: 'The One who restores creation.',
      benefit: 'Restores and renews.'
    },
    {
      number: 60,
      arabic: 'الْمُحْيِي',
      transliteration: 'Al-Muhyi',
      translation: 'The Giver of Life',
      meaning: 'The One who gives life to all things.',
      benefit: 'Brings life and vitality.'
    },
    {
      number: 61,
      arabic: 'الْمُمِيتُ',
      transliteration: 'Al-Mumit',
      translation: 'The Taker of Life',
      meaning: 'The One who causes death.',
      benefit: 'Reminds of mortality and accountability.'
    },
    {
      number: 62,
      arabic: 'الْحَيُّ',
      transliteration: 'Al-Hayy',
      translation: 'The Living',
      meaning: 'The One who is eternally alive.',
      benefit: 'Brings life and energy.'
    },
    {
      number: 63,
      arabic: 'الْقَيُّومُ',
      transliteration: 'Al-Qayyum',
      translation: 'The Self-Existing',
      meaning: 'The One who is self-sustaining.',
      benefit: 'Provides self-sufficiency.'
    },
    {
      number: 64,
      arabic: 'الْوَاجِدُ',
      transliteration: 'Al-Wajid',
      translation: 'The Finder',
      meaning: 'The One who finds whatever He wills.',
      benefit: 'Helps find what is sought.'
    },
    {
      number: 65,
      arabic: 'الْمَاجِدُ',
      transliteration: 'Al-Majid',
      translation: 'The Noble',
      meaning: 'The One who is noble and generous.',
      benefit: 'Brings nobility and honor.'
    },
    {
      number: 66,
      arabic: 'الْوَاحِدُ',
      transliteration: 'Al-Wahid',
      translation: 'The Unique',
      meaning: 'The One who is unique and without equal.',
      benefit: 'Brings uniqueness and distinction.'
    },
    {
      number: 67,
      arabic: 'الصَّمَدُ',
      transliteration: 'As-Samad',
      translation: 'The Eternal',
      meaning: 'The One who is eternal and independent.',
      benefit: 'Provides eternal support.'
    },
    {
      number: 68,
      arabic: 'الْقَادِرُ',
      transliteration: 'Al-Qadir',
      translation: 'The Able',
      meaning: 'The One who is capable of everything.',
      benefit: 'Increases capability and competence.'
    },
    {
      number: 69,
      arabic: 'الْمُقْتَدِرُ',
      transliteration: 'Al-Muqtadir',
      translation: 'The Powerful',
      meaning: 'The One who has absolute power.',
      benefit: 'Grants power and authority.'
    },
    {
      number: 70,
      arabic: 'الْمُقَدِّمُ',
      transliteration: 'Al-Muqaddim',
      translation: 'The Expediter',
      meaning: 'The One who brings forward.',
      benefit: 'Accelerates progress and advancement.'
    },
    {
      number: 71,
      arabic: 'الْمُؤَخِّرُ',
      transliteration: 'Al-Mu\'akhkhir',
      translation: 'The Delayer',
      meaning: 'The One who delays what He wills.',
      benefit: 'Provides wisdom in timing.'
    },
    {
      number: 72,
      arabic: 'الأوَّلُ',
      transliteration: 'Al-Awwal',
      translation: 'The First',
      meaning: 'The One who is first without beginning.',
      benefit: 'Leadership and precedence.'
    },
    {
      number: 73,
      arabic: 'الآخِرُ',
      transliteration: 'Al-Akhir',
      translation: 'The Last',
      meaning: 'The One who is last without end.',
      benefit: 'Brings lasting success.'
    },
    {
      number: 74,
      arabic: 'الظَّاهِرُ',
      transliteration: 'Az-Zahir',
      translation: 'The Manifest',
      meaning: 'The One who is apparent and evident.',
      benefit: 'Makes truth clear and evident.'
    },
    {
      number: 75,
      arabic: 'الْبَاطِنُ',
      transliteration: 'Al-Batin',
      translation: 'The Hidden',
      meaning: 'The One who is hidden from perception.',
      benefit: 'Reveals hidden knowledge.'
    },
    {
      number: 76,
      arabic: 'الْوَالِي',
      transliteration: 'Al-Wali',
      translation: 'The Governor',
      meaning: 'The One who governs all affairs.',
      benefit: 'Provides good governance.'
    },
    {
      number: 77,
      arabic: 'الْمُتَعَالِي',
      transliteration: 'Al-Muta\'ali',
      translation: 'The Self-Exalted',
      meaning: 'The One who is exalted above all.',
      benefit: 'Elevates status and position.'
    },
    {
      number: 78,
      arabic: 'الْبَرُّ',
      transliteration: 'Al-Barr',
      translation: 'The Source of Goodness',
      meaning: 'The One who is kind and good.',
      benefit: 'Increases kindness and goodness.'
    },
    {
      number: 79,
      arabic: 'التَّوَّابُ',
      transliteration: 'At-Tawwab',
      translation: 'The Acceptor of Repentance',
      meaning: 'The One who accepts repentance.',
      benefit: 'Forgiveness for sins and mistakes.'
    },
    {
      number: 80,
      arabic: 'الْمُنْتَقِمُ',
      transliteration: 'Al-Muntaqim',
      translation: 'The Avenger',
      meaning: 'The One who punishes the wicked.',
      benefit: 'Justice against oppressors.'
    },
    {
      number: 81,
      arabic: 'العَفُوُّ',
      transliteration: 'Al-\'Afuw',
      translation: 'The Pardoner',
      meaning: 'The One who pardons sins.',
      benefit: 'Brings pardon and forgiveness.'
    },
    {
      number: 82,
      arabic: 'الرَّؤُوفُ',
      transliteration: 'Ar-Ra\'uf',
      translation: 'The Compassionate',
      meaning: 'The One who is full of compassion.',
      benefit: 'Increases compassion and mercy.'
    },
    {
      number: 83,
      arabic: 'مَالِكُ الْمُلْكِ',
      transliteration: 'Malik al-Mulk',
      translation: 'The Owner of Sovereignty',
      meaning: 'The One who owns all dominion.',
      benefit: 'Grants authority and leadership.'
    },
    {
      number: 84,
      arabic: 'ذُوالْجَلاَلِ وَالإكْرَامِ',
      transliteration: 'Dhul-Jalali wal-Ikram',
      translation: 'The Lord of Majesty and Bounty',
      meaning: 'The One who possesses majesty and honor.',
      benefit: 'Brings majesty and divine bounty.'
    },
    {
      number: 85,
      arabic: 'الْمُقْسِطُ',
      transliteration: 'Al-Muqsit',
      translation: 'The Equitable',
      meaning: 'The One who is just and fair.',
      benefit: 'Establishes justice and fairness.'
    },
    {
      number: 86,
      arabic: 'الْجَامِعُ',
      transliteration: 'Al-Jami\'',
      translation: 'The Gatherer',
      meaning: 'The One who gathers all creation.',
      benefit: 'Unites and brings together.'
    },
    {
      number: 87,
      arabic: 'الْغَنِيُّ',
      transliteration: 'Al-Ghani',
      translation: 'The Independent',
      meaning: 'The One who is free from all needs.',
      benefit: 'Brings independence and self-sufficiency.'
    },
    {
      number: 88,
      arabic: 'الْمُغْنِي',
      transliteration: 'Al-Mughni',
      translation: 'The Enricher',
      meaning: 'The One who enriches whom He wills.',
      benefit: 'Brings wealth and prosperity.'
    },
    {
      number: 89,
      arabic: 'الْمَانِعُ',
      transliteration: 'Al-Mani\'',
      translation: 'The Preventer',
      meaning: 'The One who prevents what He wills.',
      benefit: 'Protection from harm and evil.'
    },
    {
      number: 90,
      arabic: 'الضَّارُّ',
      transliteration: 'Ad-Darr',
      translation: 'The Distressor',
      meaning: 'The One who brings distress when necessary.',
      benefit: 'Wisdom in facing difficulties.'
    },
    {
      number: 91,
      arabic: 'النَّافِعُ',
      transliteration: 'An-Nafi\'',
      translation: 'The Beneficial',
      meaning: 'The One who benefits whom He wills.',
      benefit: 'Brings benefit and advantage.'
    },
    {
      number: 92,
      arabic: 'النُّورُ',
      transliteration: 'An-Nur',
      translation: 'The Light',
      meaning: 'The One who illuminates all creation.',
      benefit: 'Brings spiritual enlightenment.'
    },
    {
      number: 93,
      arabic: 'الْهَادِي',
      transliteration: 'Al-Hadi',
      translation: 'The Guide',
      meaning: 'The One who guides to the right path.',
      benefit: 'Provides guidance and direction.'
    },
    {
      number: 94,
      arabic: 'الْبَدِيعُ',
      transliteration: 'Al-Badi\'',
      translation: 'The Incomparable',
      meaning: 'The One who created without precedent.',
      benefit: 'Enhances creativity and innovation.'
    },
    {
      number: 95,
      arabic: 'الْبَاقِي',
      transliteration: 'Al-Baqi',
      translation: 'The Everlasting',
      meaning: 'The One who remains forever.',
      benefit: 'Brings permanence and lasting success.'
    },
    {
      number: 96,
      arabic: 'الْوَارِثُ',
      transliteration: 'Al-Warith',
      translation: 'The Inheritor',
      meaning: 'The One who inherits all creation.',
      benefit: 'Provides lasting legacy.'
    },
    {
      number: 97,
      arabic: 'الرَّشِيدُ',
      transliteration: 'Ar-Rashid',
      translation: 'The Guide to Right Path',
      meaning: 'The One who guides to righteousness.',
      benefit: 'Provides wise guidance.'
    },
    {
      number: 98,
      arabic: 'الصَّبُورُ',
      transliteration: 'As-Sabur',
      translation: 'The Patient',
      meaning: 'The One who is patient with His creation.',
      benefit: 'Develops patience and perseverance.'
    },
    {
      number: 99,
      arabic: 'الْمَلِكُ',
      transliteration: 'Al-Malik',
      translation: 'The Sovereign',
      meaning: 'The One who has absolute sovereignty.',
      benefit: 'Grants authority and leadership.'
    }
  ];

  private constructor() {
    this.storageService = StorageService.getInstance();
  }

  public static getInstance(): AsmaUlHusnaService {
    if (!AsmaUlHusnaService.instance) {
      AsmaUlHusnaService.instance = new AsmaUlHusnaService();
    }
    return AsmaUlHusnaService.instance;
  }

  public async getAllNames(): Promise<AsmaUlHusnaName[]> {
    try {
      const favorites = await this.getFavorites();
      return this.ASMA_UL_HUSNA.map(name => ({
        ...name,
        isFavorite: favorites.includes(name.number)
      }));
    } catch (error) {
      console.error('Error loading Asma ul Husna:', error);
      return this.ASMA_UL_HUSNA.map(name => ({ ...name, isFavorite: false }));
    }
  }

  public async getNameByNumber(number: number): Promise<AsmaUlHusnaName | null> {
    const names = await this.getAllNames();
    return names.find(name => name.number === number) || null;
  }

  public async searchNames(query: string): Promise<AsmaUlHusnaName[]> {
    const names = await this.getAllNames();
    const searchQuery = query.toLowerCase();
    
    return names.filter(name => 
      name.arabic.includes(query) ||
      name.transliteration.toLowerCase().includes(searchQuery) ||
      name.translation.toLowerCase().includes(searchQuery) ||
      name.meaning.toLowerCase().includes(searchQuery)
    );
  }

  public async getFavorites(): Promise<number[]> {
    try {
      return await this.storageService.getData('asma_favorites') || [];
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  }

  public async toggleFavorite(number: number): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const index = favorites.indexOf(number);
      
      if (index > -1) {
        favorites.splice(index, 1);
      } else {
        favorites.push(number);
      }
      
      await this.storageService.saveData('asma_favorites', favorites);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  public async getFavoriteNames(): Promise<AsmaUlHusnaName[]> {
    const allNames = await this.getAllNames();
    return allNames.filter(name => name.isFavorite);
  }

  public async recordRecitation(number: number): Promise<void> {
    try {
      const recitations = await this.getRecitations();
      const today = new Date().toDateString();
      const entry = {
        number,
        date: today,
        timestamp: new Date().toISOString()
      };
      
      recitations.push(entry);
      await this.storageService.saveData('asma_recitations', recitations);
    } catch (error) {
      console.error('Error recording recitation:', error);
      throw error;
    }
  }

  public async getRecitations(): Promise<any[]> {
    try {
      return await this.storageService.getData('asma_recitations') || [];
    } catch (error) {
      console.error('Error loading recitations:', error);
      return [];
    }
  }

  public async getStats(): Promise<AsmaUlHusnaStats> {
    try {
      const recitations = await this.getRecitations();
      const favorites = await this.getFavorites();
      const today = new Date().toDateString();
      
      const todayRecitations = recitations.filter(r => r.date === today);
      const totalRecitations = recitations.length;
      
      // Calculate most recited name
      const counts = recitations.reduce((acc, r) => {
        acc[r.number] = (acc[r.number] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      const mostRecitedNumber = Object.keys(counts).reduce((a, b) => 
        counts[parseInt(a)] > counts[parseInt(b)] ? a : b, 
        Object.keys(counts)[0] || '1'
      );
      
      const mostRecitedName = this.ASMA_UL_HUSNA.find(n => 
        n.number === parseInt(mostRecitedNumber)
      )?.transliteration || 'None';

      // Calculate completed sessions (groups of 99 recitations)
      const completedSessions = Math.floor(totalRecitations / 99);

      // Calculate streaks
      const { currentStreak, longestStreak } = this.calculateStreaks(recitations);

      return {
        totalRecitations,
        favoriteCount: favorites.length,
        completedSessions,
        currentStreak,
        longestStreak,
        mostRecitedName,
        todayRecitations: todayRecitations.length
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        totalRecitations: 0,
        favoriteCount: 0,
        completedSessions: 0,
        currentStreak: 0,
        longestStreak: 0,
        mostRecitedName: 'None',
        todayRecitations: 0
      };
    }
  }

  private calculateStreaks(recitations: any[]): { currentStreak: number; longestStreak: number } {
    if (recitations.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Group recitations by date
    const dateGroups = recitations.reduce((acc, r) => {
      const date = r.date || r.timestamp ? new Date(r.timestamp).toDateString() : new Date().toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(r);
      return acc;
    }, {} as Record<string, any[]>);

    const dates = Object.keys(dateGroups).sort();
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    // Calculate current streak (working backwards from today)
    if (dateGroups[today] || dateGroups[yesterday]) {
      let checkDate = dateGroups[today] ? today : yesterday;
      let currentDate = new Date(checkDate);
      
      while (dateGroups[currentDate.toDateString()]) {
        currentStreak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }
    }

    // Calculate longest streak
    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(dates[i - 1] || '');
        const currentDate = new Date(dates[i] || '');
        const dayDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  }

  public async exportData(): Promise<string> {
    try {
      const favorites = await this.getFavorites();
      const recitations = await this.getRecitations();
      const stats = await this.getStats();

      const exportData = {
        favorites,
        recitations,
        stats,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  public getRandomName(): AsmaUlHusnaName {
    const randomIndex = Math.floor(Math.random() * this.ASMA_UL_HUSNA.length);
    const name = this.ASMA_UL_HUSNA[randomIndex];
    if (!name) {
      const defaultName = this.ASMA_UL_HUSNA[0];
      return { 
        number: defaultName?.number || 1,
        arabic: defaultName?.arabic || '',
        transliteration: defaultName?.transliteration || '',
        translation: defaultName?.translation || '',
        meaning: defaultName?.meaning || '',
        benefit: defaultName?.benefit,
        isFavorite: false 
      };
    }
    return { ...name, isFavorite: false };
  }

  public async getNameOfTheDay(): Promise<AsmaUlHusnaName> {
    // Use date to get consistent "name of the day"
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const nameIndex = (dayOfYear - 1) % this.ASMA_UL_HUSNA.length;
    
    const favorites = await this.getFavorites();
    const name = this.ASMA_UL_HUSNA[nameIndex];
    
    if (!name) {
      const defaultName = this.ASMA_UL_HUSNA[0];
      return { 
        number: defaultName?.number || 1,
        arabic: defaultName?.arabic || '',
        transliteration: defaultName?.transliteration || '',
        translation: defaultName?.translation || '',
        meaning: defaultName?.meaning || '',
        benefit: defaultName?.benefit,
        isFavorite: false 
      };
    }
    
    return {
      ...name,
      isFavorite: favorites.includes(name.number)
    };
  }
}