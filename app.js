'use strict';

/* =========================================================================
   SABAQ — Quran lesson tracker (minimalist redesign)
   ========================================================================= */

const BRAND_COLORS = ['#176B52', '#2E8B68', '#3F6C7A', '#6B5CA5', '#C58A32'];

const QURAN_FONTS = {
  amiri:        { label: 'Amiri Quran',        css: "'Amiri Quran', 'Traditional Arabic', serif" },
  indopak:      { label: 'Indo-Pak',           css: "'IndoPak', 'Amiri Quran', 'Traditional Arabic', serif" },
  scheherazade: { label: 'Scheherazade',       css: "'Scheherazade New', 'Scheherazade', 'Traditional Arabic', serif" },
  traditional:  { label: 'Traditional Arabic',  css: "'Traditional Arabic', 'Geeza Pro', serif" },
  naskh:        { label: 'Naskh (Noto)',       css: "'Noto Naskh Arabic', 'Droid Arabic Naskh', 'Naskh', serif" },
  serif:        { label: 'System serif',       css: 'serif' }
};
const UI_FONTS = {
  inter:    { label: 'Inter (default)',   css: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  fraunces: { label: 'Fraunces (serif)',  css: "'Fraunces', Georgia, 'Times New Roman', serif" }
};

function quranFontCss() {
  const f = QURAN_FONTS[state.settings.quranFont];
  return f ? f.css : QURAN_FONTS.amiri.css;
}
function uiFontCss() {
  const f = UI_FONTS[state.settings.uiFont];
  return f ? f.css : UI_FONTS.inter.css;
}
function applyFonts() {
  const root = document.documentElement;
  root.style.setProperty('--font-arabic', quranFontCss());
  root.style.setProperty('--font-ui', uiFontCss());
  root.style.setProperty('--quran-font-size', (state.settings.quranFontSize || 25) + 'px');
}
function quranCanvasFont(size) {
  return `400 ${size}px ${quranFontCss()}`;
}

const STORIES_DATA = [
  { id: 's1', title: 'Creation of Adam (AS)', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '30-39', description: 'Allah creates Adam from clay and teaches him the names of all things.' },
  { id: 's2', title: 'Angels Prostrate to Adam (AS)', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '34', description: 'Allah commands the angels to prostrate to Adam, and they obey.' },
  { id: 's3', title: 'Iblis Refuses to Prostrate', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '34', description: 'Iblis refuses Allah\'s command out of arrogance and is cursed.' },
  { id: 's4', title: 'Adam and Hawwa in Paradise', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '35', description: 'Allah places Adam and Hawwa in Paradise and tells them to enjoy its bounties.' },
  { id: 's5', title: 'Eating from the Forbidden Tree', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '36', description: 'Iblis deceives Adam and Hawwa into eating from the forbidden tree.' },
  { id: 's6', title: 'Adam\'s Repentance', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '37', description: 'Adam prays to Allah and is forgiven for his mistake.' },
  { id: 's7', title: 'Descent to Earth', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '36', description: 'Adam and Hawwa are sent down to Earth as vicegerents of Allah.' },
  { id: 's8', title: 'The First Murder (Cain and Abel)', surahRef: 'Surah Al-Ma\'idah', surahId: 5, ayahRange: '27-31', description: 'Cain kills his brother Abel out of jealousy, teaching the tragedy of envy.' },
  { id: 's9', title: 'Nuh\'s Call to His People', surahRef: 'Surah Hud', surahId: 11, ayahRange: '25-49', description: 'Prophet Nuh calls his people to worship Allah alone, but they reject him.' },
  { id: 's10', title: 'Building the Ark', surahRef: 'Surah Al-Ankabut', surahId: 29, ayahRange: '14-15', description: 'Nuh builds an ark by Allah\'s command to save the believers from the flood.' },
  { id: 's11', title: 'The Flood', surahRef: 'Surah Hud', surahId: 11, ayahRange: '40', description: 'Allah sends a great flood that destroys the disbelievers.' },
  { id: 's12', title: 'Nuh\'s Son Drowning', surahRef: 'Surah Hud', surahId: 11, ayahRange: '42-43', description: 'Nuh\'s son refuses to board the ark and drowns in the flood.' },
  { id: 's13', title: 'The Ark Rests on Mount Judi', surahRef: 'Surah Hud', surahId: 11, ayahRange: '44', description: 'The ark comes to rest on Mount Judi after the flood subsides.' },
  { id: 's14', title: 'Hud Sent to \'Ad', surahRef: 'Surah Hud', surahId: 11, ayahRange: '50-60', description: 'Prophet Hud is sent to the powerful people of \'Ad to call them to Allah.' },
  { id: 's15', title: 'The People Reject Hud', surahRef: 'Surah Hud', surahId: 11, ayahRange: '53-55', description: 'The people of \'Ad reject Hud\'s message and demand a miracle.' },
  { id: 's16', title: 'Destruction of \'Ad', surahRef: 'Surah Hud', surahId: 11, ayahRange: '59', description: 'Allah destroys the people of \'Ad with a fierce wind.' },
  { id: 's17', title: 'Salih Sent to Thamud', surahRef: 'Surah Hud', surahId: 11, ayahRange: '61-68', description: 'Prophet Salih is sent to Thamud to call them to righteousness.' },
  { id: 's18', title: 'The She-Camel Miracle', surahRef: 'Surah Al-A\'raf', surahId: 7, ayahRange: '73', description: 'Allah sends a miraculous she-camel as a sign to the people of Thamud.' },
  { id: 's19', title: 'Thamud Kills the She-Camel', surahRef: 'Surah Al-A\'raf', surahId: 7, ayahRange: '77', description: 'The people of Thamud defiantly kill the she-camel despite Salih\'s warning.' },
  { id: 's20', title: 'Destruction of Thamud', surahRef: 'Surah Hud', surahId: 11, ayahRange: '67', description: 'Allah destroys the people of Thamud with a mighty blast.' },
  { id: 's21', title: 'Ibrahim Debates His Father', surahRef: 'Surah Al-An\'am', surahId: 6, ayahRange: '74', description: 'Ibrahim gently debates his father about the worship of idols.' },
  { id: 's22', title: 'Ibrahim Breaks the Idols', surahRef: 'Surah Al-Anbiya', surahId: 21, ayahRange: '51-70', description: 'Ibrahim smashes the idols of his people to prove their powerlessness.' },
  { id: 's23', title: 'Ibrahim Thrown into the Fire', surahRef: 'Surah Al-Anbiya', surahId: 21, ayahRange: '68-70', description: 'Ibrahim is thrown into a great fire but Allah makes it cool and safe for him.' },
  { id: 's24', title: 'Hajar and Ismail in the Desert', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '158', description: 'Hajar runs between Safa and Marwah searching for water for baby Ismail.' },
  { id: 's25', title: 'Zamzam Well', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '158', description: 'Allah causes the Zamzam spring to gush forth for Hajar and Ismail.' },
  { id: 's26', title: 'Building the Kaaba', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '127', description: 'Ibrahim and Ismail raise the foundations of the Kaaba together.' },
  { id: 's27', title: 'Ibrahim\'s Sacrifice', surahRef: 'Surah Al-Saffat', surahId: 37, ayahRange: '102-113', description: 'Ibrahim is ready to sacrifice his son Ismail, and Allah provides a ram instead.' },
  { id: 's28', title: 'Ibrahim\'s Prayer for His Children', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '128-129', description: 'Ibrahim prays for his descendants to be a nation of submission to Allah.' },
  { id: 's29', title: 'Ibrahim\'s Dream of Sacrifice', surahRef: 'Surah Al-Saffat', surahId: 37, ayahRange: '102-107', description: 'Ibrahim sees a dream commanding him to sacrifice his beloved son.' },
  { id: 's30', title: 'The Kaaba as a Place of Return', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '125', description: 'Allah makes the Kaaba a sanctuary and a place of return for all people.' },
  { id: 's31', title: 'Lut Sent to His People', surahRef: 'Surah Hud', surahId: 11, ayahRange: '69-83', description: 'Prophet Lut is sent to warn his people against immoral behavior.' },
  { id: 's32', title: 'The People of Lut\'s Sin', surahRef: 'Surah Al-A\'raf', surahId: 7, ayahRange: '80-84', description: 'The people of Lut reject his message and commit grave sins.' },
  { id: 's33', title: 'Angels Visiting Ibrahim and Lut', surahRef: 'Surah Al-Hijr', surahId: 15, ayahRange: '51-60', description: 'Angels come to Ibrahim with good news and to warn Lut\'s people.' },
  { id: 's34', title: 'Destruction of Sodom', surahRef: 'Surah Hud', surahId: 11, ayahRange: '82-83', description: 'Allah destroys the city of Sodom with a rain of stones.' },
  { id: 's35', title: 'Lut\'s Wife\'s Fate', surahRef: 'Surah Al-Tahrim', surahId: 66, ayahRange: '10', description: 'Lut\'s wife is destroyed with the disbelievers despite being married to a prophet.' },
  { id: 's36', title: 'Yusuf\'s Dream', surahRef: 'Surah Yusuf', surahId: 12, ayahRange: '4-6', description: 'Young Yusuf dreams of eleven stars and the sun and moon prostrating to him.' },
  { id: 's37', title: 'Yusuf in the Well', surahRef: 'Surah Yusuf', surahId: 12, ayahRange: '15', description: 'Yusuf\'s brothers throw him into a well out of jealousy, and he is later rescued.' },
  { id: 's38', title: 'Yusuf in Egypt', surahRef: 'Surah Yusuf', surahId: 12, ayahRange: '19-21', description: 'Yusuf is sold into slavery in Egypt and raised by a noble family.' },
  { id: 's39', title: 'The Wife of Al-Aziz', surahRef: 'Surah Yusuf', surahId: 12, ayahRange: '23-25', description: 'The wife of Al-Aziz tries to seduce Yusuf, and he flees from her.' },
  { id: 's40', title: 'Yusuf in Prison', surahRef: 'Surah Yusuf', surahId: 12, ayahRange: '33-35', description: 'Yusuf is imprisoned for years after being falsely accused.' },
  { id: 's41', title: 'Yusuf Interprets Dreams', surahRef: 'Surah Yusuf', surahId: 12, ayahRange: '36-42', description: 'Yusuf correctly interprets the dreams of two fellow prisoners.' },
  { id: 's42', title: 'Yusuf Becomes Treasurer', surahRef: 'Surah Yusuf', surahId: 12, ayahRange: '55', description: 'Yusuf is appointed to oversee the land of Egypt during the famine.' },
  { id: 's43', title: 'Yusuf\'s Brothers in Egypt', surahRef: 'Surah Yusuf', surahId: 12, ayahRange: '58', description: 'Yusuf\'s brothers come to Egypt to buy grain during the famine.' },
  { id: 's44', title: 'The Silver Bowl Incident', surahRef: 'Surah Yusuf', surahId: 12, ayahRange: '70-75', description: 'Yusuf\'s brothers are accused of stealing a silver bowl to test their character.' },
  { id: 's45', title: 'Yusuf Reveals Himself', surahRef: 'Surah Yusuf', surahId: 12, ayahRange: '80-90', description: 'After years of separation, Yusuf finally reveals his identity to his brothers.' },
  { id: 's46', title: 'Yaqub\'s Reunion with Yusuf', surahRef: 'Surah Yusuf', surahId: 12, ayahRange: '93-100', description: 'Yaqub is reunited with his beloved son Yusuf after decades of grief.' },
  { id: 's47', title: 'Shu\'aib Sent to Madyan', surahRef: 'Surah Hud', surahId: 11, ayahRange: '84-95', description: 'Prophet Shu\'aib is sent to the people of Madyan to preach justice.' },
  { id: 's48', title: 'The People Reject Shu\'aib', surahRef: 'Surah Hud', surahId: 11, ayahRange: '88-90', description: 'The people of Madyan reject Shu\'aib\'s message and threaten to exile him.' },
  { id: 's49', title: 'Destruction of Madyan', surahRef: 'Surah Hud', surahId: 11, ayahRange: '95', description: 'Allah destroys the people of Madyan for their disbelief and injustice.' },
  { id: 's50', title: 'Musa\'s Birth and Infancy', surahRef: 'Surah Ta-Ha', surahId: 20, ayahRange: '38-40', description: 'Musa is born during a time of persecution and is inspired by Allah.' },
  { id: 's51', title: 'Musa Kills the Egyptian', surahRef: 'Surah Al-Qasas', surahId: 28, ayahRange: '15', description: 'Musa unintentionally kills an Egyptian while defending a Muslim.' },
  { id: 's52', title: 'Musa Flees to Madyan', surahRef: 'Surah Al-Qasas', surahId: 28, ayahRange: '22-28', description: 'Musa flees Egypt and travels to Madyan, where he marries and lives for years.' },
  { id: 's53', title: 'Musa at the Burning Bush', surahRef: 'Surah Ta-Ha', surahId: 20, ayahRange: '9-14', description: 'Allah speaks to Musa from the burning bush on Mount Sinai.' },
  { id: 's54', title: 'Musa Confronts Pharaoh', surahRef: 'Surah Ta-Ha', surahId: 20, ayahRange: '47-48', description: 'Musa and Harun are commanded to go to Pharaoh and invite him to Allah.' },
  { id: 's55', title: 'The Ten Plagues', surahRef: 'Surah Al-A\'raf', surahId: 7, ayahRange: '130-135', description: 'Allah sends ten devastating plagues upon Egypt as a warning to Pharaoh.' },
  { id: 's56', title: 'The Exodus', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '49', description: 'Allah saves the Children of Israel from the oppression of Pharaoh.' },
  { id: 's57', title: 'Crossing the Red Sea', surahRef: 'Surah Ta-Ha', surahId: 20, ayahRange: '77-78', description: 'Musa splits the sea and leads the Children of Israel across safely.' },
  { id: 's58', title: 'Pharaoh\'s Drowning', surahRef: 'Surah Yunus', surahId: 10, ayahRange: '90', description: 'Pharaoh drowns in the sea despite his last-minute declaration of faith.' },
  { id: 's59', title: 'The Golden Calf', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '51-54', description: 'The Children of Israel worship a golden calf while Musa is on the mountain.' },
  { id: 's60', title: 'Musa Receives the Tablets', surahRef: 'Surah Al-A\'raf', surahId: 7, ayahRange: '142-145', description: 'Allah gives Musa the Tablets containing guidance and light.' },
  { id: 's61', title: 'Musa Splits the Sea', surahRef: 'Surah Ash-Shu\'ara', surahId: 26, ayahRange: '63', description: 'Allah splits the Red Sea for Musa and the Children of Israel to cross.' },
  { id: 's62', title: 'Musa Prays for Water', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '60', description: 'Musa strikes a rock and twelve springs of water gush forth for the twelve tribes.' },
  { id: 's63', title: 'Water from the Rock', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '60', description: 'Allah provides water for the Israelites in the wilderness from a rock.' },
  { id: 's64', title: 'The Cow', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '67-73', description: 'Allah commands the Children of Israel to sacrifice a yellow cow to solve a murder mystery.' },
  { id: 's65', title: 'Musa\'s Staff', surahRef: 'Surah An-Naml', surahId: 27, ayahRange: '10', description: 'Musa\'s staff transforms into a serpent and back, a sign from Allah.' },
  { id: 's66', title: 'Musa and Al-Khidr', surahRef: 'Surah Al-Kahf', surahId: 18, ayahRange: '60-82', description: 'Musa travels with Al-Khidr and learns profound lessons about divine wisdom.' },
  { id: 's67', title: 'Bani Israel in the Wilderness', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '57', description: 'The Children of Israel wander in the wilderness for forty years as a punishment.' },
  { id: 's68', title: 'The Table Spread', surahRef: 'Surah Al-Ma\'idah', surahId: 5, ayahRange: '112-115', description: 'Allah sends down a table spread with food as a sign for the disciples of Isa.' },
  { id: 's69', title: 'Dawud Defeats Jalut', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '251', description: 'Prophet Dawud defeats the giant Jalut with Allah\'s help and becomes a king.' },
  { id: 's70', title: 'Dawud as Prophet and King', surahRef: 'Surah Sad', surahId: 38, ayahRange: '20', description: 'Allah gives Dawud kingship, wisdom, and the Psalms.' },
  { id: 's71', title: 'Dawud\'s Psalms', surahRef: 'Surah Al-Isra', surahId: 17, ayahRange: '55', description: 'Dawud is given the Psalms as a source of guidance and worship.' },
  { id: 's72', title: 'Dawud and the Two Disputants', surahRef: 'Surah Sad', surahId: 38, ayahRange: '21-25', description: 'Dawud judges between two disputants and is given wisdom by Allah.' },
  { id: 's73', title: 'Dawud\'s Prayer', surahRef: 'Surah Sad', surahId: 38, ayahRange: '24', description: 'Dawud prays to Allah for forgiveness and guidance.' },
  { id: 's74', title: 'Sulaiman\'s Kingdom', surahRef: 'Surah Saba', surahId: 34, ayahRange: '12-13', description: 'Allah grants Sulaiman an unparalleled kingdom over jinn, humans, and animals.' },
  { id: 's75', title: 'The Ants', surahRef: 'Surah An-Naml', surahId: 27, ayahRange: '18-19', description: 'Sulaiman hears an ant warn its colony of his approaching army.' },
  { id: 's76', title: 'Sulaiman and Queen of Sheba', surahRef: 'Surah An-Naml', surahId: 27, ayahRange: '20-44', description: 'Sulaiman invites the Queen of Sheba to submit to Allah.' },
  { id: 's77', title: 'Sulaiman\'s Jinn', surahRef: 'Surah Saba', surahId: 34, ayahRange: '12', description: 'Sulaiman controls jinn who build him magnificent structures.' },
  { id: 's78', title: 'Sulaiman\'s Wisdom', surahRef: 'Surah Al-Anbiya', surahId: 21, ayahRange: '78-82', description: 'Sulaiman exercises great wisdom in judging disputes among people.' },
  { id: 's79', title: 'Ayyub\'s Patience', surahRef: 'Surah Sad', surahId: 38, ayahRange: '41-44', description: 'Prophet Ayyub remains patient through immense suffering and trials.' },
  { id: 's80', title: 'Ayyub\'s Affliction and Cure', surahRef: 'Surah Al-Anbiya', surahId: 21, ayahRange: '83-84', description: 'Allah relieves Ayyub\'s suffering and restores his health and family.' },
  { id: 's81', title: 'Yunus in the Whale', surahRef: 'Surah As-Saffat', surahId: 37, ayahRange: '139-148', description: 'Yunus is swallowed by a whale after leaving his people in anger.' },
  { id: 's82', title: 'Yunus\'s Prayer', surahRef: 'Surah Al-Anbiya', surahId: 21, ayahRange: '87-88', description: 'Yunus prays from the darkness of the whale\'s belly and is saved.' },
  { id: 's83', title: 'The People of Nineveh', surahRef: 'Surah Yunus', surahId: 10, ayahRange: '98', description: 'The people of Nineveh repent and are saved from Allah\'s punishment.' },
  { id: 's84', title: 'Zakariyya\'s Prayer for a Son', surahRef: 'Surah Al-Imran', surahId: 3, ayahRange: '38', description: 'Zakariyya prays for a son despite his old age, and Allah grants him Yahya.' },
  { id: 's85', title: 'Maryam\'s Birth', surahRef: 'Surah Al-Imran', surahId: 3, ayahRange: '37', description: 'Maryam is born and entrusted to Allah\'s care from a young age.' },
  { id: 's86', title: 'Zakariyya\'s Silence as a Sign', surahRef: 'Surah Al-Imran', surahId: 3, ayahRange: '41', description: 'Zakariyya is given the sign of being unable to speak for three days.' },
  { id: 's87', title: 'Yahya\'s Piety', surahRef: 'Surah Al-Imran', surahId: 3, ayahRange: '39', description: 'Yahya is granted wisdom and piety while still a young boy.' },
  { id: 's88', title: 'Maryam\'s Immaculate Conception', surahRef: 'Surah Al-Imran', surahId: 3, ayahRange: '45', description: 'Allah gives Maryam the glad tidings of a pure son, Isa (AS).' },
  { id: 's89', title: 'Isa Speaking as a Baby', surahRef: 'Surah Maryam', surahId: 19, ayahRange: '27-30', description: 'Baby Isa defends his mother\'s honor and declares his prophethood.' },
  { id: 's90', title: 'Isa\'s Miracles', surahRef: 'Surah Al-Imran', surahId: 3, ayahRange: '49', description: 'Isa performs miracles by Allah\'s permission, including healing the blind and lepers.' },
  { id: 's91', title: 'The Table Spread from Heaven', surahRef: 'Surah Al-Ma\'idah', surahId: 5, ayahRange: '112-115', description: 'Allah sends down a table of food as a sign for the followers of Isa.' },
  { id: 's92', title: 'Isa\'s Disciples', surahRef: 'Surah Al-Imran', surahId: 3, ayahRange: '52-53', description: 'The disciples of Isa believe in his message and help him.' },
  { id: 's93', title: 'Isa\'s Ascension', surahRef: 'Surah An-Nisa', surahId: 4, ayahRange: '157-158', description: 'Allah raises Isa up to Himself and clears him of false claims.' },
  { id: 's94', title: 'The First Revelation', surahRef: 'Surah Al-\'Alaq', surahId: 96, ayahRange: '1-5', description: 'The first verses of the Quran are revealed to Prophet Muhammad (PBUH) in the Cave of Hira.' },
  { id: 's95', title: 'The Night Journey', surahRef: 'Surah Al-Isra', surahId: 17, ayahRange: '1', description: 'The Prophet (PBUH) travels from Makkah to Jerusalem and ascends through the heavens.' },
  { id: 's96', title: 'The Hijrah', surahRef: 'Surah At-Tawbah', surahId: 9, ayahRange: '40', description: 'The Prophet (PBUH) migrates from Makkah to Madinah to establish the Muslim community.' },
  { id: 's97', title: 'The Battle of Badr', surahRef: 'Surah Al-Imran', surahId: 3, ayahRange: '123', description: 'The first major battle in Islam, where the Muslims achieve victory with Allah\'s help.' },
  { id: 's98', title: 'The Treaty of Hudaybiyyah', surahRef: 'Surah Al-Fath', surahId: 48, ayahRange: '1-2', description: 'A peace treaty that paves the way for the peaceful conquest of Makkah.' },
  { id: 's99', title: 'The Conquest of Makkah', surahRef: 'Surah Al-Fath', surahId: 48, ayahRange: '27', description: 'The Prophet (PBUH) enters Makkah peacefully and forgives his former enemies.' },
  { id: 's100', title: 'The Farewell Pilgrimage', surahRef: 'Surah Al-Ma\'idah', surahId: 5, ayahRange: '3', description: 'The Prophet\'s (PBUH) final Hajj, where he delivers the Farewell Sermon.' },
  { id: 's101', title: 'The People of the Cave', surahRef: 'Surah Al-Kahf', surahId: 18, ayahRange: '9-26', description: 'A group of young believers sleep in a cave for 309 years and are miraculously preserved.' },
  { id: 's102', title: 'The Owner of the Two Gardens', surahRef: 'Surah Al-Kahf', surahId: 18, ayahRange: '32-44', description: 'A wealthy man with two beautiful gardens is destroyed for his arrogance and ingratitude.' },
  { id: 's103', title: 'The Man with Two Gardens', surahRef: 'Surah Al-Kahf', surahId: 18, ayahRange: '32-44', description: 'A story about wealth, pride, and the fleeting nature of worldly possessions.' },
  { id: 's104', title: 'The Man Who Passed by a Ruined Town', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '259', description: 'Allah shows a man how He brings the dead to life by reviving a ruined town.' },
  { id: 's105', title: 'The Boy and the King', surahRef: 'Surah Al-Kahf', surahId: 18, ayahRange: '13-20', description: 'A believing boy is martyred for his faith, and Allah revives him.' },
  { id: 's106', title: 'The Story of Khidr and Musa', surahRef: 'Surah Al-Kahf', surahId: 18, ayahRange: '60-82', description: 'Musa learns profound lessons about divine wisdom from the mysterious Al-Khidr.' },
  { id: 's107', title: 'The Story of Dhu al-Qarnayn', surahRef: 'Surah Al-Kahf', surahId: 18, ayahRange: '83-98', description: 'A just ruler travels the world and builds a barrier against Gog and Magog.' },
  { id: 's108', title: 'The Story of the People of the Ditch', surahRef: 'Surah Al-Buruj', surahId: 85, ayahRange: '4-8', description: 'Believers are thrown into a ditch of fire for their faith, and Allah saves them.' },
  { id: 's109', title: 'The Story of the Elephant', surahRef: 'Surah Al-Fil', surahId: 105, ayahRange: '1-5', description: 'Allah sends birds to destroy the army that came to attack the Kaaba with elephants.' },
  { id: 's110', title: 'The Story of Qarun', surahRef: 'Surah Al-Qasas', surahId: 28, ayahRange: '76-82', description: 'Qarun is swallowed by the earth for his arrogance and oppression despite his wealth.' },
  { id: 's111', title: 'The Story of the Sabbath-Breakers', surahRef: 'Surah An-Nisa', surahId: 4, ayahRange: '47', description: 'A community is transformed into apes for violating the Sabbath.' },
  { id: 's112', title: 'The Story of Tubba\'', surahRef: 'Surah Ad-Dukhan', surahId: 44, ayahRange: '37', description: 'A righteous king from Yemen recognizes the truth but his people reject it.' },
  { id: 's113', title: 'The Story of Bal\'am', surahRef: 'Surah Al-A\'raf', surahId: 7, ayahRange: '175-176', description: 'A man given knowledge uses it for evil and is degraded by Allah.' },
  { id: 's114', title: 'The Manna and Quails', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '57', description: 'Allah provides manna and quails as food for the Children of Israel in the wilderness.' },
  { id: 's115', title: 'The Cloud', surahRef: 'Surah Ash-Shu\'ara', surahId: 26, ayahRange: '63', description: 'A cloud provides shade for the Children of Israel during their journey.' },
  { id: 's116', title: 'The Man with Two Gardens (Parable)', surahRef: 'Surah Al-Kahf', surahId: 18, ayahRange: '32-44', description: 'A parable about two men, one wealthy and arrogant, the other humble and grateful.' },
  { id: 's117', title: 'The Story of the Sleepers', surahRef: 'Surah Al-Kahf', surahId: 18, ayahRange: '9-26', description: 'Young believers sleep in a cave for centuries to escape persecution.' },
  { id: 's118', title: 'The People of the Garden', surahRef: 'Surah Al-Qalam', surahId: 68, ayahRange: '17-33', description: 'Wealthy people wrong the poor by destroying their harvest, and Allah punishes them.' },
  { id: 's119', title: 'The Story of the City', surahRef: 'Surah Ya-Sin', surahId: 36, ayahRange: '13-27', description: 'Prophets are sent to a city, but the people reject and kill them.' },
  { id: 's120', title: 'The Story of the Two Messengers', surahRef: 'Surah Ya-Sin', surahId: 36, ayahRange: '13-27', description: 'Two messengers are sent to a city and call its people to Allah.' },
  { id: 's121', title: 'The Story of the Believer', surahRef: 'Surah Ya-Sin', surahId: 36, ayahRange: '20-27', description: 'A single believer defends the prophets and is martyred, entering Paradise.' },
  { id: 's122', title: 'The Story of the Disbeliever', surahRef: 'Surah Ya-Sin', surahId: 36, ayahRange: '28-32', description: 'A disbeliever rejects the truth and is punished by Allah.' },
  { id: 's123', title: 'The Story of the Gardeners', surahRef: 'Surah Al-Qalam', surahId: 68, ayahRange: '17-33', description: 'Wealthy people plot to harvest their garden but are prevented by Allah\'s plan.' },
  { id: 's124', title: 'The Story of the Prophet and the Ant', surahRef: 'Surah An-Naml', surahId: 27, ayahRange: '18-19', description: 'Sulaiman hears an ant warning its colony of his approaching army.' },
  { id: 's125', title: 'The Story of the Jinn', surahRef: 'Surah Ar-Rahman', surahId: 55, ayahRange: '33', description: 'Allah created jinn from smokeless fire, and some of them believe while others reject.' },
  { id: 's126', title: 'The Story of Iblis', surahRef: 'Surah Al-A\'raf', surahId: 7, ayahRange: '11-18', description: 'Iblis is cursed for his arrogance and becomes the enemy of humanity.' },
  { id: 's127', title: 'The Story of the Angels', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '30-34', description: 'Angels question Allah\'s decision to create Adam, then prostrate to him.' },
  { id: 's128', title: 'The Story of the Heavens and Earth', surahRef: 'Surah Fussilat', surahId: 41, ayahRange: '9-12', description: 'Allah creates the heavens and earth in six days.' },
  { id: 's129', title: 'The Story of the Moon', surahRef: 'Surah Al-Qamar', surahId: 54, ayahRange: '1-2', description: 'The moon is split as a sign for the disbelievers.' },
  { id: 's130', title: 'The Story of the Stars', surahRef: 'Surah As-Sajdah', surahId: 32, ayahRange: '3-4', description: 'Allah created the stars as decoration and protection from Satan.' },
  { id: 's131', title: 'The Story of the Sun and Moon', surahRef: 'Surah Ya-Sin', surahId: 36, ayahRange: '38-40', description: 'The sun and moon run their courses by Allah\'s command.' },
  { id: 's132', title: 'The Story of the Day of Judgment', surahRef: 'Surah Al-Qiyamah', surahId: 75, ayahRange: '1-6', description: 'The Day of Judgment will come when the trumpet is blown.' },
  { id: 's133', title: 'The Story of the Resurrection', surahRef: 'Surah Al-Insan', surahId: 76, ayahRange: '1-2', description: 'Allah created man from a drop of mixed fluid and will resurrect him.' },
  { id: 's134', title: 'The Story of Paradise', surahRef: 'Surah Ar-Rahman', surahId: 55, ayahRange: '46-76', description: 'Paradise is described with its rivers, fruits, and eternal bounties.' },
  { id: 's135', title: 'The Story of Hellfire', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '24', description: 'Hellfire is prepared for those who disbelieve and do evil deeds.' },
  { id: 's136', title: 'The Story of the Balance', surahRef: 'Surah Al-Qari\'ah', surahId: 101, ayahRange: '1-11', description: 'On the Day of Judgment, deeds will be weighed on the Balance.' },
  { id: 's137', title: 'The Story of the Bridge', surahRef: 'Surah Ta-Ha', surahId: 20, ayahRange: '75-77', description: 'All people must cross a bridge over Hellfire on the Day of Judgment.' },
  { id: 's138', title: 'The Story of the Pond of Kawsar', surahRef: 'Surah Al-Kawthar', surahId: 108, ayahRange: '1-3', description: 'The Prophet (PBUH) is given a pond in Paradise from which his followers will drink.' },
  { id: 's139', title: 'The Story of the Throne', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '255', description: 'Allah\'s Throne extends over the heavens and the earth.' },
  { id: 's140', title: 'The Story of the Pen', surahRef: 'Surah Al-\'Alaq', surahId: 96, ayahRange: '1-5', description: 'Allah taught man by the pen, the instrument of knowledge and revelation.' },
  { id: 's141', title: 'The Story of the Tablet', surahRef: 'Surah Al-Buruj', surahId: 85, ayahRange: '22', description: 'The Preserved Tablet contains all that has been decreed by Allah.' },
  { id: 's142', title: 'The Story of the Book', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '2', description: 'The Quran is a guidance for the righteous and a criterion between right and wrong.' },
  { id: 's143', title: 'The Story of the Revelation', surahRef: 'Surah An-Najm', surahId: 53, ayahRange: '1-18', description: 'The revelation of the Quran is described as a powerful, luminous inspiration.' },
  { id: 's144', title: 'The Story of the Quran', surahRef: 'Surah Al-Hijr', surahId: 15, ayahRange: '9', description: 'Allah has promised to protect the Quran from corruption forever.' },
  { id: 's145', title: 'The Story of the Prophets', surahRef: 'Surah Al-An\'am', surahId: 6, ayahRange: '84-90', description: 'Allah guided many prophets and gave them the Book and wisdom.' },
  { id: 's146', title: 'The Story of the Messengers', surahRef: 'Surah Al-Mu\'minun', surahId: 23, ayahRange: '23-50', description: 'Messengers were sent to every nation to call people to worship Allah alone.' },
  { id: 's147', title: 'The Story of the People', surahRef: 'Surah Ar-Rum', surahId: 30, ayahRange: '9', description: 'Allah shows signs for those who reflect on the history of previous nations.' },
  { id: 's148', title: 'The Story of the Believers', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '285', description: 'Believers believe in Allah, His angels, His Books, and His messengers.' },
  { id: 's149', title: 'The Story of the Disbelievers', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '6-7', description: 'Allah has sealed the hearts of those who persist in disbelief.' },
  { id: 's150', title: 'The Story of the Hypocrites', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '8-14', description: 'Hypocrites pretend to believe but conceal their disbelief in their hearts.' },
  { id: 's151', title: 'The Story of the Martyrs', surahRef: 'Surah Al-Imran', surahId: 3, ayahRange: '169-173', description: 'Martyrs are not dead but alive with their Lord, receiving their reward.' },
  { id: 's152', title: 'The Story of the Righteous', surahRef: 'Surah Al-Insan', surahId: 76, ayahRange: '5-22', description: 'The righteous are described as those who feed the poor and keep their promises.' },
  { id: 's153', title: 'The Story of the Wicked', surahRef: 'Surah Al-Waqi\'ah', surahId: 56, ayahRange: '41-56', description: 'The wicked are described as those who deny the truth and persist in sin.' },
  { id: 's154', title: 'The Story of the Day of Judgment', surahRef: 'Surah Al-Infitar', surahId: 82, ayahRange: '1-5', description: 'The sky will be split, the stars will fall, and the seas will burst forth.' },
  { id: 's155', title: 'The Story of the Hereafter', surahRef: 'Surah Al-Qiyamah', surahId: 75, ayahRange: '1-40', description: 'On the Day of Resurrection, man will ask what is happening to him.' },
  { id: 's156', title: 'The Story of the Intercession', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '48', description: 'No intercession will avail except by Allah\'s permission on the Day of Judgment.' },
  { id: 's157', title: 'The Story of the Garden', surahRef: 'Surah Ar-Rahman', surahId: 55, ayahRange: '46-76', description: 'Paradise has rivers of milk, honey, and wine, and every kind of fruit.' },
  { id: 's158', title: 'The Story of Hellfire', surahRef: 'Surah Al-Masad', surahId: 111, ayahRange: '1-5', description: 'Abu Lahab and his wife are condemned to the fire of Hell for their rejection of Islam.' },
  { id: 's159', title: 'The Story of the Scales', surahRef: 'Surah Al-Anbiya', surahId: 21, ayahRange: '47', description: 'Deeds will be weighed on the Scales with perfect justice on the Day of Judgment.' },
  { id: 's160', title: 'The Story of the Prophethood', surahRef: 'Surah Al-An\'am', surahId: 6, ayahRange: '84-90', description: 'Allah guided many prophets and perfected their guidance.' },
  { id: 's161', title: 'The Story of the First Humans', surahRef: 'Surah Al-Hijr', surahId: 15, ayahRange: '26-29', description: 'Allah created Adam from clay and breathed into him His spirit.' },
  { id: 's162', title: 'The Story of the Jinn', surahRef: 'Surah Ar-Rahman', surahId: 55, ayahRange: '33', description: 'Jinn were created from smokeless fire and have free will like humans.' },
  { id: 's163', title: 'The Story of the Animals', surahRef: 'Surah Al-An\'am', surahId: 6, ayahRange: '38', description: 'All creatures on earth are communities like humans, and all will be gathered.' },
  { id: 's164', title: 'The Story of the Seven Heavens', surahRef: 'Surah Al-Baqarah', surahId: 2, ayahRange: '29', description: 'Allah created seven heavens in perfect harmony and balance.' },
  { id: 's165', title: 'The Story of the Earth', surahRef: 'Surah Ar-Rahman', surahId: 55, ayahRange: '10', description: 'Allah spread the earth as a place for all His creatures.' },
  { id: 's166', title: 'The Story of the Mountains', surahRef: 'Surah An-Nahl', surahId: 16, ayahRange: '15', description: 'Allah placed mountains to stabilize the earth and provide benefit.' },
  { id: 's167', title: 'The Story of the Seas', surahRef: 'Surah Ar-Rahman', surahId: 55, ayahRange: '24', description: 'The seas are set free to provide bounty and guidance to mankind.' },
  { id: 's168', title: 'The Story of the Stars', surahRef: 'Surah As-Saffat', surahId: 37, ayahRange: '6', description: 'Stars are adornments of the heaven and protection from Satan.' },
  { id: 's169', title: 'The Story of the Night', surahRef: 'Surah Ad-Dukhan', surahId: 44, ayahRange: '1', description: 'The night is a time of peace and rest, a sign of Allah\'s mercy.' },
  { id: 's170', title: 'The Story of the Day', surahRef: 'Surah Al-Layl', surahId: 92, ayahRange: '1-2', description: 'The day is a time for work and striving, a sign of Allah\'s grace.' },
  { id: 's171', title: 'The Story of the Dawn', surahRef: 'Surah Al-Fajr', surahId: 89, ayahRange: '1-2', description: 'The dawn is a sign of Allah\'s power and a time for prayer.' },
  { id: 's172', title: 'The Story of the Night of Power', surahRef: 'Surah Al-Qadr', surahId: 97, ayahRange: '1-5', description: 'Laylat al-Qadr is better than a thousand months, when the Quran was revealed.' },
  { id: 's173', title: 'The Story of the Morning', surahRef: 'Surah Ad-Duha', surahId: 93, ayahRange: '1-2', description: 'The morning brings light and hope, a sign of Allah\'s favor.' },
  { id: 's174', title: 'The Story of the Evening', surahRef: 'Surah Al-Ghashiyah', surahId: 88, ayahRange: '1', description: 'The evening brings rest and reflection, a sign of Allah\'s mercy.' },
  { id: 's175', title: 'The Story of the Fig', surahRef: 'Surah At-Tin', surahId: 95, ayahRange: '1-8', description: 'Allah swore by the fig and olive, signs of His creation.' },
  { id: 's176', title: 'The Story of the Olive', surahRef: 'Surah At-Tin', surahId: 95, ayahRange: '1-8', description: 'The olive is a blessed tree, a sign of Allah\'s wisdom.' },
  { id: 's177', title: 'The Story of the Pomegranate', surahRef: 'Surah Ar-Rahman', surahId: 55, ayahRange: '68', description: 'Pomegranates are among the fruits of Paradise.' },
  { id: 's178', title: 'The Story of the Dates', surahRef: 'Surah Maryam', surahId: 19, ayahRange: '25', description: 'Dates are mentioned as a provision for Maryam during childbirth.' },
  { id: 's179', title: 'The Story of the Honey', surahRef: 'Surah Muhammad', surahId: 47, ayahRange: '15', description: 'Honey is described as a healing for mankind, a sign of Allah\'s mercy.' },
  { id: 's180', title: 'The Story of the Water', surahRef: 'Surah Al-Anbiya', surahId: 21, ayahRange: '30', description: 'Allah created all living things from water, a sign for those who reflect.' },
  { id: 's181', title: 'The Story of the Fire', surahRef: 'Surah Ya-Sin', surahId: 36, ayahRange: '80', description: 'Allah created fire from a green tree, a sign of His power.' },
  { id: 's182', title: 'The Story of the Clay', surahRef: 'Surah Ar-Rahman', surahId: 55, ayahRange: '14', description: 'Allah created man from clay, the same material as pottery.' },
  { id: 's183', title: 'The Story of the Drop', surahRef: 'Surah Al-Qiyamah', surahId: 75, ayahRange: '37', description: 'Man was created from a drop of emitted fluid, a sign of Allah\'s power.' },
  { id: 's184', title: 'The Story of the Clot', surahRef: 'Surah Al-\'Alaq', surahId: 96, ayahRange: '2', description: 'Allah created man from a clinging clot, a sign of His creation.' },
  { id: 's185', title: 'The Story of the Chewed-Like Substance', surahRef: 'Surah Al-Mu\'minun', surahId: 23, ayahRange: '14', description: 'Man is created through stages, from a drop to a chewed-like substance.' },
  { id: 's186', title: 'The Story of the Bones', surahRef: 'Surah Al-Qiyamah', surahId: 75, ayahRange: '3', description: 'Allah created bones and clothed them with flesh, a sign of His creation.' },
  { id: 's187', title: 'The Story of the Flesh', surahRef: 'Surah Al-Qiyamah', surahId: 75, ayahRange: '3', description: 'Allah clothes bones with flesh, creating a living being.' },
  { id: 's188', title: 'The Story of the Spirit', surahRef: 'Surah Al-Hijr', surahId: 15, ayahRange: '29', description: 'Allah breathed His spirit into Adam, giving him life.' },
  { id: 's189', title: 'The Story of the Heart', surahRef: 'Surah Al-Hashr', surahId: 59, ayahRange: '19', description: 'The hearts of believers are humbled by the remembrance of Allah.' },
  { id: 's190', title: 'The Story of the Eyes', surahRef: 'Surah An-Nahl', surahId: 16, ayahRange: '78', description: 'Allah gave man eyes, ears, and hearts, but most are ungrateful.' },
  { id: 's191', title: 'The Story of the Ears', surahRef: 'Surah Al-Isra', surahId: 17, ayahRange: '46', description: 'Allah gave man ears to hear the truth, but many are deaf to it.' },
  { id: 's192', title: 'The Story of the Tongue', surahRef: 'Surah Ar-Rahman', surahId: 55, ayahRange: '1-4', description: 'Allah taught man to speak and express himself clearly.' },
  { id: 's193', title: 'The Story of the Hands', surahRef: 'Surah Al-Balad', surahId: 90, ayahRange: '13', description: 'Man is given hands to work and do good deeds.' },
  { id: 's194', title: 'The Story of the Feet', surahRef: 'Surah Al-Qalam', surahId: 68, ayahRange: '42', description: 'On the Day of Judgment, feet will bear witness to the deeds of men.' },
  { id: 's195', title: 'The Story of the Skin', surahRef: 'Surah Fussilat', surahId: 41, ayahRange: '22', description: 'Even the skin will bear witness to the deeds of the disbelievers.' },
  { id: 's196', title: 'The Story of the Mind', surahRef: 'Surah Al-An\'am', surahId: 6, ayahRange: '91', description: 'Allah gave man intelligence to understand the signs of Allah.' },
  { id: 's197', title: 'The Story of the Soul', surahRef: 'Surah Al-Qiyamah', surahId: 75, ayahRange: '2', description: 'The soul will bear witness against itself on the Day of Judgment.' },
  { id: 's198', title: 'The Story of the Life', surahRef: 'Surah Al-Mulk', surahId: 67, ayahRange: '2', description: 'Allah created life and death to test which of you is best in deeds.' },
  { id: 's199', title: 'The Story of the Death', surahRef: 'Surah Al-Waqi\'ah', surahId: 56, ayahRange: '87-94', description: 'Every soul will taste death, and then return to Allah for judgment.' },
  { id: 's200', title: 'The Story of the Afterlife', surahRef: 'Surah Al-Qiyamah', surahId: 75, ayahRange: '1-40', description: 'On the Day of Resurrection, all people will be resurrected to face Allah.' }
];

function storyById(id) { return STORIES_DATA.find(s => s.id === id); }

const DB_NAME = 'sabaq-db';
const DB_VERSION = 1;
const STORES = ['students', 'lessons', 'settings'];

const state = {
  view: 'students',
  students: [],
  lessons: [],
  settings: { schoolName: '', logoDataUrl: '', brandColorIdx: 0, quranFont: 'amiri', quranFontSize: 25, uiFont: 'inter', readerMode: 'line' },
  quran: [],
  surahIndex: [],
  currentStudentId: null,
  readerSurahId: 1,
  selection: {
    active: false, mode: null, forStudentId: null, surahId: null,
    start: null, end: null, lockedSurah: false, complete: false, editingLessonId: null
  },
  pendingLesson: null,
  shareLessonId: null
};

let pendingContinue = null;

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('students')) db.createObjectStore('students', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('lessons')) db.createObjectStore('lessons', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function dbGetAll(storeName) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(storeName, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDelete(storeName, key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbClearAll() {
  const db = await openDb();
  return Promise.all(STORES.map(s => new Promise((resolve, reject) => {
    const tx = db.transaction(s, 'readwrite');
    tx.objectStore(s).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  })));
}

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function surahById(id) {
  return state.quran.find(s => s.id === id);
}

function surahMeta(id) {
  return state.surahIndex.find(s => s.id === id);
}

function todayIso() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

function formatDateHuman(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatMonthYear(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function lessonsForStudent(studentId) {
  return state.lessons
    .filter(l => l.studentId === studentId)
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
}

function lastLessonFor(studentId) {
  const list = lessonsForStudent(studentId);
  return list.length ? list[0] : null;
}

function dayLabel(iso) {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date(todayIso() + 'T00:00:00');
  const diff = Math.round((today - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str == null ? '' : str;
  return d.innerHTML;
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  void el.offsetWidth;
  el.classList.add('toast-show');
  clearTimeout(toast._t);
  clearTimeout(toast._t2);
  toast._t = setTimeout(() => {
    el.classList.remove('toast-show');
    toast._t2 = setTimeout(() => el.classList.add('hidden'), 240);
  }, 2200);
}

let _confirmResolve = null;

function confirmDialog(opts) {
  opts = opts || {};
  const overlay = document.getElementById('sheet-confirm');
  document.getElementById('confirm-title').textContent = opts.title || 'Are you sure?';
  document.getElementById('confirm-message').textContent = opts.message || '';
  const okBtn = document.getElementById('btn-confirm-ok');
  okBtn.textContent = opts.confirmText || 'Confirm';
  okBtn.className = 'btn ' + (opts.danger ? 'btn-danger' : 'btn-primary');
  document.getElementById('btn-confirm-cancel').textContent = opts.cancelText || 'Cancel';
  return new Promise((resolve) => {
    _confirmResolve = resolve;
    openSheet('sheet-confirm');
  });
}

function _closeConfirm(result) {
  const overlay = document.getElementById('sheet-confirm');
  closeSheet('sheet-confirm');
  if (_confirmResolve) { _confirmResolve(result); _confirmResolve = null; }
}

function nextAyahRef(surahId, ayah) {
  const meta = surahMeta(surahId);
  if (!meta) return null;
  if (ayah < meta.count) return { surahId, ayah: ayah + 1 };
  if (surahId < 114) return { surahId: surahId + 1, ayah: 1 };
  return null;
}

function studentNextStart(student) {
  const last = lastLessonFor(student.id);
  if (student.surahId && student.ayah) {
    return { surahId: student.surahId, ayah: student.ayah };
  }
  if (last) {
    return { surahId: last.surahId, ayah: last.endAyah };
  }
  return null;
}

async function loadQuranData() {
  const [quranRes, indexRes] = await Promise.all([
    fetch('data/quran-data.json'),
    fetch('data/surah-index.json')
  ]);
  state.quran = await quranRes.json();
  state.surahIndex = await indexRes.json();
}

async function loadAppData() {
  const [students, lessons, settingsRows] = await Promise.all([
    dbGetAll('students'),
    dbGetAll('lessons'),
    dbGetAll('settings')
  ]);
  state.students = students.sort((a, b) => a.name.localeCompare(b.name));
  state.lessons = lessons;
  const settingsRow = settingsRows.find(r => r.key === 'app');
  if (settingsRow) state.settings = Object.assign(state.settings, settingsRow.value);
}

function showView(name, direction, animate) {
  if (direction !== 'back') direction = 'forward';
  if (animate === undefined) animate = true;
  state.view = name;
  document.querySelectorAll('.app-view').forEach(v => {
    v.classList.add('hidden');
    v.classList.remove('view-in-forward', 'view-in-back');
  });
  const view = document.getElementById('view-' + name);
  view.classList.remove('hidden');
  void view.offsetWidth;
  if (animate) view.classList.add(direction === 'back' ? 'view-in-back' : 'view-in-forward');
  document.getElementById('bottom-nav').classList.toggle('hidden', name === 'detail');
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', (name === 'students' && b.dataset.tab === 'students') ||
                                 (name === 'reader' && b.dataset.tab === 'reader') ||
                                 (name === 'learn' && b.dataset.tab === 'learn') ||
                                 (name === 'settings' && b.dataset.tab === 'settings'));
  });
  window.scrollTo(0, 0);
}

let _scrollLockY = 0;
function lockBackgroundScroll() {
  if (document.documentElement.classList.contains('scroll-locked')) return;
  _scrollLockY = window.scrollY || document.documentElement.scrollTop || 0;
  document.documentElement.classList.add('scroll-locked');
}
function unlockBackgroundScroll() {
  if (!document.documentElement.classList.contains('scroll-locked')) return;
  document.documentElement.classList.remove('scroll-locked');
  window.scrollTo(0, _scrollLockY);
}
function isAnySheetOpen() {
  return [...document.querySelectorAll('.sheet-overlay')].some(o => !o.classList.contains('hidden'));
}
function openSheet(id) {
  const ov = document.getElementById(id);
  if (ov._closeHandler) { ov.removeEventListener('animationend', ov._closeHandler); ov._closeHandler = null; }
  const sh = ov.querySelector('.sheet');
  if (sh) sh.style.transform = '';
  ov.classList.remove('anim-close', 'anim-open');
  ov.classList.add('hidden');
  void ov.offsetWidth;
  ov.classList.remove('hidden');
  ov.classList.add('anim-open');
  lockBackgroundScroll();
}
function closeSheet(id, skipAnim) {
  const ov = document.getElementById(id);
  if (ov.classList.contains('hidden')) {
    if (!isAnySheetOpen()) unlockBackgroundScroll();
    return;
  }
  if (skipAnim) {
    ov.classList.add('hidden');
    const sh = ov.querySelector('.sheet');
    if (sh) sh.style.transform = '';
    if (!isAnySheetOpen()) unlockBackgroundScroll();
    return;
  }
  ov.classList.remove('anim-open');
  ov.classList.add('anim-close');
  const onEnd = (e) => {
    if (e.target !== ov) return;
    ov.classList.add('hidden');
    ov.classList.remove('anim-close');
    ov.removeEventListener('animationend', onEnd);
    ov._closeHandler = null;
    if (!isAnySheetOpen()) unlockBackgroundScroll();
  };
  ov._closeHandler = onEnd;
  ov.addEventListener('animationend', onEnd);
}

function renderStudents() {
  const list = document.getElementById('student-list');
  const empty = document.getElementById('student-empty');
  const subtitle = document.getElementById('students-subtitle');
  const total = state.students.length;

  subtitle.textContent = `${total} students · Today`;

  let completedToday = 0;
  for (const s of state.students) {
    if (lessonsForStudent(s.id).some(l => l.date === todayIso())) completedToday++;
  }
  document.getElementById('progress-text').textContent = `${completedToday} / ${total}`;
  document.getElementById('progress-fill').style.width =
    total ? (completedToday / total * 100) + '%' : '0%';

  const q = (document.getElementById('input-search-students').value || '').trim().toLowerCase();

  list.innerHTML = '';
  if (!total) {
    empty.classList.remove('hidden');
    list.classList.add('hidden');
    return;
  }

  let rendered = 0;
  for (const student of state.students) {
    if (q && !student.name.toLowerCase().includes(q)) continue;

    const last = lastLessonFor(student.id);
    let sub;
    if (last) {
      const meta = surahMeta(last.surahId);
      sub = `Surah ${meta.translit} · ${last.startAyah}–${last.endAyah}`;
    } else if (student.surahId && student.ayah) {
      const meta = surahMeta(student.surahId);
      sub = `Surah ${meta.translit} · Ayah ${student.ayah}`;
    } else {
      sub = 'No lessons yet';
    }

    const hasToday = lessonsForStudent(student.id).some(l => l.date === todayIso());
    const statusHtml = hasToday
      ? `<div class="status status-completed"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M20 6L9 17l-5-5"/></svg>Completed</div>`
      : `<div class="status status-pending"><span class="dot"></span>Pending</div>`;

    const card = document.createElement('button');
    card.className = 'student-row';
    card.setAttribute('data-student-id', student.id);
    card.innerHTML = `
      <div class="avatar">${initials(student.name)}</div>
      <div class="info">
        <div class="name">${escapeHtml(student.name)}</div>
        <div class="sub">${escapeHtml(sub)}</div>
      </div>
      ${statusHtml}
    `;
    card.addEventListener('click', () => openStudentDetail(student.id));
    list.appendChild(card);
    rendered++;
  }

  if (rendered === 0) {
    empty.classList.remove('hidden');
    list.classList.add('hidden');
  } else {
    empty.classList.add('hidden');
    list.classList.remove('hidden');
  }
}

function openStudentDetail(studentId) {
  state.currentStudentId = studentId;
  renderStudentDetail();
  showView('detail');
}

function renderStudentDetail() {
  const student = state.students.find(s => s.id === state.currentStudentId);
  if (!student) { showView('students'); return; }

  document.getElementById('detail-avatar').textContent = initials(student.name);
  document.getElementById('detail-name').textContent = student.name;
  document.getElementById('detail-meta').textContent =
    student.joinedAt ? `Joined ${formatMonthYear(student.joinedAt)}` : '';

  const continueCard = document.getElementById('continue-card');
  const firstBtn = document.getElementById('btn-first-lesson');
  const base = studentNextStart(student);

  if (!base) {
    continueCard.classList.add('hidden');
    firstBtn.classList.remove('hidden');
    pendingContinue = null;
  } else {
    const next = nextAyahRef(base.surahId, base.ayah);
    const last = lastLessonFor(student.id);
    firstBtn.classList.add('hidden');
    continueCard.classList.remove('hidden');

    const reviewSurah = last ? last.surahId : base.surahId;
    const reviewAyah = last ? last.endAyah : base.ayah;
    const reviewMeta = surahMeta(reviewSurah);
    document.getElementById('continue-surah').textContent = reviewMeta.translit;
    document.getElementById('continue-ayah').textContent =
      last ? `${last.startAyah}–${last.endAyah}` : `${base.ayah}`;
    document.getElementById('continue-desc').textContent =
      next ? (last ? 'Review last lesson · then assign the next'
                    : `Starting from ${reviewMeta.translit} ${base.ayah}`)
           : 'Completed the Quran';
    continueCard.dataset.lastSurah = reviewSurah;
    continueCard.dataset.lastAyah = reviewAyah;
    pendingContinue = next ? { studentId: student.id, surahId: next.surahId, ayah: next.ayah } : null;
    document.getElementById('btn-continue').classList.remove('hidden');
  }

  const lessons = lessonsForStudent(student.id);
  const historyList = document.getElementById('history-list');
  const historyEmpty = document.getElementById('history-empty');
  historyList.innerHTML = '';

  if (!lessons.length) {
    historyEmpty.classList.remove('hidden');
    return;
  }
  historyEmpty.classList.add('hidden');

  const groups = {};
  const order = [];
  for (const lesson of lessons) {
    if (!groups[lesson.date]) { groups[lesson.date] = []; order.push(lesson.date); }
    groups[lesson.date].push(lesson);
  }

  for (const key of order) {
    const groupEl = document.createElement('div');
    groupEl.className = 'history-group';
    groupEl.innerHTML = `<div class="history-date">${dayLabel(key)}</div>`;

    for (const lesson of groups[key]) {
      const meta = surahMeta(lesson.surahId);
      const row = document.createElement('div');
      row.className = 'history-row';
      row.setAttribute('data-lesson-id', lesson.id);
      row.innerHTML = `
        <div class="history-timeline"><div class="node"></div><div class="line"></div></div>
        <div class="history-body">
          <div class="ref-line">
            <span class="surah-name">${escapeHtml(meta.translit)}</span>
            <span class="ayat-range">${lesson.startAyah}–${lesson.endAyah}</span>
          </div>
          <div class="date">${lesson.time ? `Completed · ${escapeHtml(lesson.time)}` : 'Completed'}</div>
        </div>
        <div class="history-actions">
          <button class="icon-btn-sm" data-action="share" aria-label="Share">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>
          </button>
          <button class="icon-btn-sm" data-action="edit" aria-label="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="icon-btn-sm" data-action="delete" aria-label="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      `;
      row.querySelector('[data-action="share"]').addEventListener('click', (e) => { e.stopPropagation(); openShareSheet(lesson.id); });
      row.querySelector('[data-action="edit"]').addEventListener('click', (e) => { e.stopPropagation(); editLesson(lesson.id); });
      row.querySelector('[data-action="delete"]').addEventListener('click', (e) => { e.stopPropagation(); deleteLesson(lesson.id); });
      row.querySelector('.history-body').addEventListener('click', () => openReader(lesson.surahId, lesson.startAyah));
      groupEl.appendChild(row);
    }
    historyList.appendChild(groupEl);
  }
}

function populateSurahSelect() {
  const optsHtml = state.surahIndex.map(s => `<option value="${s.id}">${s.id}. ${s.translit}</option>`).join('');
  document.getElementById('select-surah').innerHTML = optsHtml;
  document.getElementById('manual-surah').innerHTML = optsHtml;
  document.getElementById('select-student-surah').innerHTML = optsHtml;
}

function populateAyahSelect(surahId) {
  const meta = surahMeta(surahId);
  const sel = document.getElementById('select-ayah');
  let opts = '';
  for (let i = 1; i <= meta.count; i++) opts += `<option value="${i}">${i}</option>`;
  sel.innerHTML = opts;
}

function showAssignNextButton(show) {
  document.getElementById('btn-assign-next').classList.toggle('hidden', !show);
}

function highlightRange(surahId, start, end) {
  const sel$ = ayahSelector();
  for (let a = start; a <= end; a++) {
    const el = document.querySelector(`${sel$}[data-ayah="${a}"]`);
    if (el) el.classList.add('in-range');
  }
}

function openReaderReviewLast(studentId, surahId, ayah) {
  resetSelection();
  openReader(surahId, ayah);
  const last = lastLessonFor(studentId);
  if (last) highlightRange(last.surahId, last.startAyah, last.endAyah);
  showAssignNextButton(!!pendingContinue);
}

function openReader(surahId, ayah, opts) {
  opts = opts || {};
  showAssignNextButton(false);
  state.readerSurahId = surahId;
  document.getElementById('select-surah').value = String(surahId);
  populateAyahSelect(surahId);
  document.getElementById('select-ayah').value = String(ayah || 1);
  renderReaderContent(surahId);
  showView('reader', undefined, false);
  document.getElementById('jump-panel').classList.add('hidden');
  document.getElementById('reader-content').classList.remove('hidden');
  document.getElementById('btn-reader-confirm').classList.add('hidden');
  updateSelectionBanner();
  if (ayah) {
    requestAnimationFrame(() => scrollToAyah(ayah, true));
  }
}

function isInlineReaderMode() {
  return state.settings.readerMode === 'inline';
}

function renderReaderContent(surahId) {
  const surah = surahById(surahId);
  const meta = surahMeta(surahId);
  const container = document.getElementById('reader-content');
  container.style.transform = '';
  container.style.transition = '';
  container.innerHTML = '';

  const inline = isInlineReaderMode();
  container.classList.toggle('inline-mode', inline);

  document.getElementById('reader-surah-name').textContent = meta.translit;

  const heading = document.createElement('div');
  heading.className = 'surah-heading';
  heading.innerHTML = `<div class="name-ar">${surah.name}</div><div class="name-translit">${meta.id}. ${meta.translit} · ${meta.count} ayat</div>`;
  container.appendChild(heading);

  if (surahId !== 9) {
    const bismillah = document.createElement('div');
    bismillah.className = 'bismillah';
    bismillah.textContent = 'بسم الله الرحمن الرحيم';
    container.appendChild(bismillah);
  }

  const skipBismillah = (surahId === 1);
  if (inline) {
    const flow = document.createElement('p');
    flow.className = 'ayah-flow';
    surah.verses.forEach((text, idx) => {
      if (skipBismillah && idx === 0) return;
      const ayahNum = skipBismillah ? idx : idx + 1;
      const span = document.createElement('span');
      span.className = 'ayah-inline';
      span.dataset.ayah = String(ayahNum);
      span.innerHTML = `${text}<span class="ayah-badge-inline">${ayahNum}</span>`;
      span.addEventListener('click', () => handleAyahTap(surahId, ayahNum, span));
      flow.appendChild(span);
      flow.appendChild(document.createTextNode(' '));
    });
    container.appendChild(flow);
  } else {
    surah.verses.forEach((text, idx) => {
      if (skipBismillah && idx === 0) return;
      const ayahNum = skipBismillah ? idx : idx + 1;
      const block = document.createElement('div');
      block.className = 'ayah-block';
      block.dataset.ayah = String(ayahNum);
      block.innerHTML = `<div class="ayah-num">${ayahNum}</div><div class="ayah-text">${text}</div>`;
      block.addEventListener('click', () => handleAyahTap(surahId, ayahNum, block));
      container.appendChild(block);
    });
  }

  applySelectionHighlight();
}

function ayahSelector() {
  return isInlineReaderMode() ? '.ayah-inline' : '.ayah-block';
}

function scrollToAyah(ayah, instant) {
  const el = document.querySelector(`${ayahSelector()}[data-ayah="${ayah}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'center' });
  el.classList.add('target-flash');
  setTimeout(() => el.classList.remove('target-flash'), 1400);
}

function applySelectionHighlight() {
  document.querySelectorAll('.ayah-block, .ayah-inline').forEach(b => b.classList.remove('in-range', 'range-start', 'range-end'));
  const sel = state.selection;
  if (!sel.active || !sel.surahId || !sel.start) return;
  const endVal = sel.end || sel.start;
  const lo = Math.min(sel.start, endVal), hi = Math.max(sel.start, endVal);
  const sel$ = ayahSelector();
  for (let a = lo; a <= hi; a++) {
    const el = document.querySelector(`${sel$}[data-ayah="${a}"]`);
    if (el) el.classList.add('in-range');
  }
  const startEl = document.querySelector(`${sel$}[data-ayah="${sel.start}"]`);
  if (startEl) startEl.classList.add('range-start');
  if (sel.end) {
    const endEl = document.querySelector(`${sel$}[data-ayah="${sel.end}"]`);
    if (endEl) endEl.classList.add('range-end');
  }
}

function updateSelectionBanner() {
  const banner = document.getElementById('selecting-banner');
  const text = document.getElementById('selecting-banner-text');
  if (!state.selection.active) { banner.classList.add('hidden'); return; }
  banner.classList.remove('hidden');
  text.textContent = state.selection.mode === 'start'
    ? "Tap the ayah where the lesson starts"
    : "Tap the ayah where the lesson ends";
}

function handleAyahTap(surahId, ayah, blockEl) {
  const sel = state.selection;
  if (!sel.active || sel.complete) return;
  if (sel.lockedSurah && sel.surahId && surahId !== sel.surahId) {
    toast('Lesson range must stay within one surah');
    return;
  }

  if (sel.mode === 'start') {
    sel.surahId = surahId;
    sel.start = ayah;
    sel.lockedSurah = true;
    sel.mode = 'end';
    updateSelectionBanner();
    applySelectionHighlight();
    return;
  }

  if (sel.mode === 'end') {
    if (ayah < sel.start) {
      sel.start = ayah;
      applySelectionHighlight();
      return;
    }
    sel.end = ayah;
    finishSelection();
  }
}

function finishSelection() {
  const sel = state.selection;
  state.pendingLesson = {
    studentId: sel.forStudentId,
    surahId: sel.surahId,
    start: sel.start,
    end: sel.end,
    editingLessonId: sel.editingLessonId
  };
  sel.complete = true;
  showReaderConfirm();
  applySelectionHighlight();
}

function showReaderConfirm() {
  document.getElementById('selecting-banner').classList.add('hidden');
  document.getElementById('btn-reader-confirm').classList.remove('hidden');
}

function resetSelection() {
  state.selection = {
    active: false, mode: null, forStudentId: null, surahId: null,
    start: null, end: null, lockedSurah: false, complete: false, editingLessonId: null
  };
  document.getElementById('selecting-banner').classList.add('hidden');
  document.getElementById('btn-reader-confirm').classList.add('hidden');
  showAssignNextButton(false);
  applySelectionHighlight();
}

function beginContinueLesson(studentId, surahId, ayah) {
  state.selection = {
    active: true, mode: 'end', forStudentId: studentId,
    surahId, start: ayah, end: null, lockedSurah: true, complete: false, editingLessonId: null
  };
  openReader(surahId, ayah);
}

function beginFreshLesson(studentId) {
  state.selection = {
    active: true, mode: 'start', forStudentId: studentId,
    surahId: null, start: null, end: null, lockedSurah: false, complete: false, editingLessonId: null
  };
  openReader(state.readerSurahId || 1, 1);
}

/* ---------------------------- Lesson confirm sheet ---------------------------- */

function openLessonConfirmSheet() {
  const pl = state.pendingLesson;
  if (!pl) return;
  const student = state.students.find(s => s.id === pl.studentId);
  const meta = surahMeta(pl.surahId);
  if (!student) return;

  document.getElementById('lesson-student-name').textContent = `For ${student.name}`;
  document.getElementById('lesson-range-text').textContent = `${meta.translit} · ${pl.start}–${pl.end}`;
  document.getElementById('input-lesson-note').value = '';
  openSheet('sheet-lesson');
}

async function saveLessonFromSheet() {
  const pl = state.pendingLesson;
  if (!pl) return;
  const student = state.students.find(s => s.id === pl.studentId);
  if (!student) return;
  const note = document.getElementById('input-lesson-note').value.trim();
  const time = new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  const lesson = {
    id: pl.editingLessonId || uid(),
    studentId: pl.studentId,
    surahId: pl.surahId,
    startAyah: pl.start,
    endAyah: pl.end,
    date: todayIso(),
    time,
    note,
    createdAt: pl.editingLessonId
      ? (state.lessons.find(l => l.id === pl.editingLessonId) || {}).createdAt || new Date().toISOString()
      : new Date().toISOString()
  };

  if (!pl.editingLessonId) {
    student.surahId = pl.surahId;
    student.ayah = pl.end;
    await dbPut('students', student);
  }

  await dbPut('lessons', lesson);
  const idx = state.lessons.findIndex(l => l.id === lesson.id);
  if (idx >= 0) state.lessons[idx] = lesson; else state.lessons.push(lesson);

  closeSheet('sheet-lesson');
  state.pendingLesson = null;
  state.currentStudentId = pl.studentId;
  renderStudents();
  renderStudentDetail();
  showView('detail');
  toast('Sabaq recorded');

  if (!pl.editingLessonId) openWhatsappForLesson(student, lesson);
}

function editLesson(lessonId) {
  const lesson = state.lessons.find(l => l.id === lessonId);
  if (!lesson) return;
  const student = state.students.find(s => s.id === lesson.studentId);
  state.pendingLesson = {
    studentId: lesson.studentId, surahId: lesson.surahId,
    start: lesson.startAyah, end: lesson.endAyah, editingLessonId: lesson.id
  };
  document.getElementById('lesson-student-name').textContent =
    `For ${student ? student.name : ''}`;
  const meta = surahMeta(lesson.surahId);
  document.getElementById('lesson-range-text').textContent =
    `${meta.translit} · ${lesson.startAyah}–${lesson.endAyah}`;
  document.getElementById('input-lesson-note').value = lesson.note || '';
  openSheet('sheet-lesson');
}

async function deleteLesson(lessonId) {
  if (!await confirmDialog({ title: 'Delete lesson', message: 'Delete this lesson entry?', confirmText: 'Delete', danger: true })) return;
  await dbDelete('lessons', lessonId);
  state.lessons = state.lessons.filter(l => l.id !== lessonId);
  renderStudents();
  renderStudentDetail();
  toast('Lesson deleted');
}

function openManualRangeSheet() {
  const pl = state.pendingLesson;
  if (!pl) return;
  document.getElementById('manual-surah').value = String(pl.surahId);
  document.getElementById('manual-start').value = pl.start;
  document.getElementById('manual-end').value = pl.end;
  openSheet('sheet-manual-range');
}

function applyManualRange() {
  const pl = state.pendingLesson;
  if (!pl) return;
  const surahId = parseInt(document.getElementById('manual-surah').value, 10);
  const meta = surahMeta(surahId);
  let start = parseInt(document.getElementById('manual-start').value, 10);
  let end = parseInt(document.getElementById('manual-end').value, 10);
  if (!start || !end) { toast('Enter both ayah numbers'); return; }
  start = Math.max(1, Math.min(start, meta.count));
  end = Math.max(1, Math.min(end, meta.count));
  if (end < start) { const t = start; start = end; end = t; }

  pl.surahId = surahId;
  pl.start = start;
  pl.end = end;

  document.getElementById('lesson-range-text').textContent = `${meta.translit} · ${start}–${end}`;
  closeSheet('sheet-manual-range');
}

/* ---------------------------- Jump-to-surah search panel ---------------------------- */

function normalizeSearch(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function renderJumpList(filter) {
  const list = document.getElementById('jump-list');
  const q = normalizeSearch((filter || '').trim());
  const items = state.surahIndex.filter(s =>
    !q || normalizeSearch(s.translit).includes(q) || String(s.id) === q
  );
  list.innerHTML = items.map(s => `
    <div class="surah-jump-row" data-surah-id="${s.id}">
      <div class="num">${s.id}</div>
      <div class="translit">${s.translit}</div>
      <div class="ar">${s.name}</div>
    </div>
  `).join('');
  list.querySelectorAll('.surah-jump-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = parseInt(row.dataset.surahId, 10);
      document.getElementById('jump-panel').classList.add('hidden');
      document.getElementById('reader-content').classList.remove('hidden');
      openReaderSurahOnly(id);
    });
  });
}

function openReaderSurahOnly(surahId) {
  state.readerSurahId = surahId;
  document.getElementById('select-surah').value = String(surahId);
  populateAyahSelect(surahId);
  document.getElementById('select-ayah').value = '1';
  renderReaderContent(surahId);
}

/* ---------------------------- Share card (canvas) — minimalist ---------------------------- */

async function ensureFontsReady() {
  const specs = [
    '400 28px Inter', '800 26px Inter', '500 23px Inter', '700 19px Inter',
    '600 23px Inter', '700 20px Inter', '600 25px Inter', '800 64px Inter',
    quranCanvasFont(82), '800 108px Inter', '500 76px Inter', '700 18px Inter',
    '400 24px Inter', '600 21px Inter', '500 20px Inter',
    '700 30px Inter', '800 32px Inter', '600 24px Inter', '700 24px Inter',
    '600 22px Inter', '500 22px Inter', '700 64px Inter', quranCanvasFont(84),
    quranCanvasFont(40), '700 110px Inter', 'italic 400 24px Inter',
    '400 22px Inter', '600 20px Inter', '700 26px Inter',
    '800 38px Inter', '500 25px Inter', '800 62px Inter', '700 23px Inter',
    '800 50px Inter', '700 16px Inter', '500 21px Inter'
  ];
  await Promise.all(specs.map(s => document.fonts.load(s).catch(() => {})));
  await document.fonts.ready;
}

async function drawShareCard(lesson) {
  const canvas = document.getElementById('share-canvas');
  const ctx = canvas.getContext('2d');

  const W = 1080;
  const H = 1350;

  canvas.width = W;
  canvas.height = H;

  await ensureFontsReady();

  const student = state.students.find(s => s.id === lesson.studentId);
  const meta = surahMeta(lesson.surahId);

  const studentName = (student?.name || 'Student').trim() || 'Student';
  const schoolName = (state.settings.schoolName || '').trim() || 'Irshad e Madinah Online';

  const nameInitials = initials(studentName);

  // ---------------------------------------------------------
  // COLORS
  // ---------------------------------------------------------

  const GREEN = '#07563F';
  const GREEN_2 = '#0B684F';
  const GREEN_LIGHT = '#EAF4F0';
  const GREEN_LIGHT_2 = '#DCEDE7';

  const BLACK = '#17211E';
  const GREY = '#68736F';
  const LIGHT_GREY = '#A0AAA6';
  const BORDER = '#DCE6E2';
  const WHITE = '#FFFFFF';
  const BG = '#F5F7F6';

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------

  function reset() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '16px Inter';
    ctx.fillStyle = BLACK;
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
  }

  function roundedRect(x, y, w, h, r) {
    roundRect(ctx, x, y, w, h, r);
  }

  function fillRoundedRect(x, y, w, h, r, color) {
    ctx.save();
    roundedRect(x, y, w, h, r);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function strokeRoundedRect(x, y, w, h, r, color, width = 2) {
    ctx.save();
    roundedRect(x, y, w, h, r);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.restore();
  }

  function drawLine(x1, y1, x2, y2, color = BORDER, width = 2) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawText(value, x, y, font, color, align = 'left') {
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(value, x, y);
    ctx.restore();
  }

  function centerText(value, x, y, font, color) {
    drawText(value, x, y, font, color, 'center');
  }

  // ---------------------------------------------------------
  // SVG -> CANVAS
  // ---------------------------------------------------------

  function svgToImage(svg) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  async function drawSVG(svg, x, y, width, height) {
    const img = await svgToImage(svg);
    ctx.drawImage(img, x, y, width, height);
  }

  // ---------------------------------------------------------
  // LOGO SVG
  // ---------------------------------------------------------

  const logoSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <g fill="none" stroke="${GREEN}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M52 76 V48 Q80 18 108 48 V76"/>
      <path d="M80 45 c-7 8-3 19 6 21 c-9 3-19-4-19-14 c0-8 6-14 13-16" fill="${GREEN}" stroke="none"/>
      <path d="M80 84 C66 75 48 73 31 79 V108 C48 101 65 104 80 115 Z"/>
      <path d="M80 84 C94 75 112 73 129 79 V108 C112 101 95 104 80 115 Z"/>
      <path d="M80 84 V115"/>
      <path d="M31 108 L20 120"/>
      <path d="M129 108 L140 120"/>
    </g>
  </svg>`;

  // ---------------------------------------------------------
  // BOOK / QURAN SVG
  // ---------------------------------------------------------

  const quranSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <g fill="none" stroke="${GREEN}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M50 25 C39 18 25 20 16 26 V64 C27 59 39 60 50 68 Z"/>
      <path d="M50 25 C61 18 75 20 84 26 V64 C73 59 61 60 50 68 Z"/>
      <path d="M50 25 V68"/>
      <path d="M25 72 L42 86"/>
      <path d="M75 72 L58 86"/>
      <path d="M42 86 L58 86"/>
    </g>
  </svg>`;

  // ---------------------------------------------------------
  // CALENDAR SVG
  // ---------------------------------------------------------

  const calendarSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 70 70">
    <g fill="none" stroke="${GREEN}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
      <rect x="10" y="14" width="50" height="46" rx="5"/>
      <path d="M10 27 H60"/>
      <path d="M23 9 V19"/>
      <path d="M47 9 V19"/>
      <path d="M20 37 H26"/>
      <path d="M32 37 H38"/>
      <path d="M44 37 H50"/>
      <path d="M20 47 H26"/>
      <path d="M32 47 H38"/>
      <path d="M44 47 H50"/>
    </g>
  </svg>`;

  // ---------------------------------------------------------
  // CLIPBOARD SVG
  // ---------------------------------------------------------

  const clipboardSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 70 70">
    <g fill="none" stroke="${GREEN}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
      <rect x="15" y="13" width="40" height="50" rx="5"/>
      <rect x="25" y="7" width="20" height="12" rx="4"/>
      <path d="M24 31 H46"/>
      <path d="M24 41 H46"/>
      <path d="M24 51 H40"/>
    </g>
  </svg>`;

  // ---------------------------------------------------------
  // TEACHER / PERSON SVG
  // ---------------------------------------------------------

  const teacherSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 70 70">
    <g fill="none" stroke="${GREEN}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="35" cy="22" r="10"/>
      <path d="M16 61 C16 46 24 39 35 39 C46 39 54 46 54 61"/>
      <path d="M24 45 H46"/>
    </g>
  </svg>`;

  // ---------------------------------------------------------
  // SHIELD SVG
  // ---------------------------------------------------------

  const shieldSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 70 70">
    <circle cx="35" cy="35" r="30" fill="#F4F8F6"/>
    <path d="M35 16 L49 21 V33 C49 43 43 50 35 54 C27 50 21 43 21 33 V21 Z" fill="none" stroke="${GREEN}" stroke-width="3"/>
    <path d="M28 35 L33 40 L43 29" fill="none" stroke="${GREEN}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  // ---------------------------------------------------------
  // ISLAMIC PATTERN SVG
  // ---------------------------------------------------------

  const patternSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
    <defs>
      <pattern id="p" width="90" height="90" patternUnits="userSpaceOnUse">
        <g fill="none" stroke="#FFFFFF" stroke-opacity=".13" stroke-width="2">
          <path d="M45 0 L90 45 L45 90 L0 45 Z"/>
          <path d="M45 18 L72 45 L45 72 L18 45 Z"/>
          <circle cx="45" cy="45" r="8"/>
        </g>
      </pattern>
    </defs>
    <rect width="500" height="500" fill="url(#p)"/>
  </svg>`;

  // ---------------------------------------------------------
  // BACKGROUND
  // ---------------------------------------------------------

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // ---------------------------------------------------------
  // MAIN CARD
  // ---------------------------------------------------------

  const cardX = 30;
  const cardY = 30;
  const cardW = 1020;
  const cardH = 1290;
  const radius = 34;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.10)';
  ctx.shadowBlur = 35;
  ctx.shadowOffsetY = 12;
  fillRoundedRect(cardX, cardY, cardW, cardH, radius, WHITE);
  ctx.restore();

  // Clip card contents
  ctx.save();
  roundedRect(cardX, cardY, cardW, cardH, radius);
  ctx.clip();

  // ---------------------------------------------------------
  // TOP-RIGHT GREEN DIAGONAL
  // ---------------------------------------------------------

  ctx.save();
  ctx.fillStyle = GREEN;
  ctx.beginPath();
  ctx.moveTo(745, 30);
  ctx.lineTo(1050, 30);
  ctx.lineTo(1050, 262);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Pattern over green corner
  await drawSVG(patternSVG, 815, 30, 235, 235);

  // ---------------------------------------------------------
  // HEADER
  // ---------------------------------------------------------

  await drawSVG(logoSVG, 245, 95, 105, 105);

  drawText(schoolName, 360, 167, '800 38px Inter', GREEN);
  drawText('Quran Lesson Report', 430, 207, '500 25px Inter', GREY);

  // ---------------------------------------------------------
  // STUDENT AVATAR
  // ---------------------------------------------------------

  const avatarX = W / 2;
  const avatarY = 338;
  const avatarR = 67;

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
  ctx.fillStyle = '#EEF6F2';
  ctx.fill();
  ctx.strokeStyle = '#C9DED7';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  centerText(nameInitials, avatarX, avatarY + 20, '700 50px Inter', GREEN);

  // ---------------------------------------------------------
  // STUDENT NAME
  // ---------------------------------------------------------

  centerText(studentName, W / 2, 476, '800 62px Inter', BLACK);

  // ---------------------------------------------------------
  // TODAY'S SABAQ
  // ---------------------------------------------------------

  drawLine(305, 532, 400, 532, '#C8DDD6', 2);
  drawLine(680, 532, 775, 532, '#C8DDD6', 2);
  centerText("TODAY'S SABAQ", W / 2, 540, '700 23px Inter', GREEN);

  // ---------------------------------------------------------
  // ARABIC SURAH NAME
  // ---------------------------------------------------------

  ctx.save();
  ctx.font = quranCanvasFont(82);
  ctx.fillStyle = GREEN;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(meta.name, W / 2, 630);
  ctx.restore();

  // ---------------------------------------------------------
  // SURAH NAME
  // ---------------------------------------------------------

  centerText(`SURAH ${meta.id} · ${meta.translit.toUpperCase()}`, W / 2, 762, '700 23px Inter', GREY);

  // ---------------------------------------------------------
  // AYAH RANGE CARD
  // ---------------------------------------------------------

  const rangeX = 235;
  const rangeY = 815;
  const rangeW = 610;
  const rangeH = 214;

  fillRoundedRect(rangeX, rangeY, rangeW, rangeH, 24, GREEN_LIGHT);

  // ---------------------------------------------------------
  // QURAN ICON CIRCLE
  // ---------------------------------------------------------

  ctx.save();
  ctx.beginPath();
  ctx.arc(332, 922, 61, 0, Math.PI * 2);
  ctx.fillStyle = GREEN_LIGHT_2;
  ctx.fill();
  ctx.restore();

  await drawSVG(quranSVG, 282, 872, 100, 100);

  // vertical divider
  drawLine(427, 855, 427, 975, '#C4DCD4', 2);

  // ---------------------------------------------------------
  // AYAH RANGE
  // ---------------------------------------------------------

  centerText(`${lesson.startAyah} – ${lesson.endAyah}`, 625, 930, '800 82px Inter', GREEN);
  centerText('AYAH RANGE', 625, 990, '700 20px Inter', GREEN);

  // ---------------------------------------------------------
  // INFORMATION DIVIDER
  // ---------------------------------------------------------

  drawLine(80, 1090, 1000, 1090, '#D6E1DD', 2);

  // ---------------------------------------------------------
  // DATE
  // ---------------------------------------------------------

  await drawSVG(calendarSVG, 115, 1120, 58, 58);

  drawText('DATE', 192, 1145, '700 16px Inter', GREY);
  drawText(formatDateHuman(lesson.date), 192, 1178, '500 21px Inter', BLACK);

  drawLine(358, 1125, 358, 1192, '#D2DFDA', 2);

  // ---------------------------------------------------------
  // LESSON STATUS
  // ---------------------------------------------------------

  await drawSVG(clipboardSVG, 390, 1120, 58, 58);

  drawText('LESSON RECORDED', 455, 1145, '700 16px Inter', GREY);
  drawText('Sabaq Completed', 455, 1178, '500 21px Inter', BLACK);

  drawLine(670, 1125, 670, 1192, '#D2DFDA', 2);

  // ---------------------------------------------------------
  // TEACHER
  // ---------------------------------------------------------

  await drawSVG(teacherSVG, 700, 1120, 58, 58);

  drawText('TEACHER', 768, 1145, '700 16px Inter', GREY);
  drawText(schoolName, 768, 1178, '500 19px Inter', BLACK);

  // ---------------------------------------------------------
  // FOOTER
  // ---------------------------------------------------------

  const footerY = 1235;
  const footerH = 75;

  ctx.fillStyle = GREEN;
  ctx.fillRect(0, footerY, W, footerH);

  await drawSVG(patternSVG, 815, footerY - 20, 250, 250);

  ctx.save();
  ctx.beginPath();
  ctx.arc(113, footerY + 38, 26, 0, Math.PI * 2);
  ctx.fillStyle = '#F4F8F6';
  ctx.fill();
  ctx.restore();

  await drawSVG(shieldSVG, 87, footerY + 12, 52, 52);

  drawText('Building strong foundations, one sabaq at a time.', 155, footerY + 47, '500 19px Inter', WHITE);

  // ---------------------------------------------------------
  // CLOSE CARD CLIP
  // ---------------------------------------------------------

  ctx.restore();

  // ---------------------------------------------------------
  // OUTER BORDER
  // ---------------------------------------------------------

  strokeRoundedRect(cardX, cardY, cardW, cardH, radius, '#DDE4E1', 2);

  // ---------------------------------------------------------
  // FINAL RESET
  // ---------------------------------------------------------

  reset();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function openShareSheet(lessonId) {
  const lesson = state.lessons.find(l => l.id === lessonId);
  if (!lesson) return;
  state.shareLessonId = lessonId;
  const student = state.students.find(s => s.id === lesson.studentId);
  document.getElementById('share-sub').textContent =
    `For ${student ? student.name : ''} · ${formatDateHuman(lesson.date)}`;
  openSheet('sheet-share');
  await drawShareCard(lesson);
}

function canvasToBlob(canvas) {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
}

async function shareCardDownload() {
  const canvas = document.getElementById('share-canvas');
  const blob = await canvasToBlob(canvas);
  const lesson = state.lessons.find(l => l.id === state.shareLessonId);
  const student = state.students.find(s => s.id === lesson.studentId);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sabaq-${(student ? student.name : 'lesson').replace(/\s+/g, '-').toLowerCase()}-${lesson.date}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast('Image saved');
}

function whatsappLessonText(student, lesson) {
  const meta = surahMeta(lesson.surahId);
  const note = (lesson.note || '').trim();
  const base = `${student ? student.name : ''}'s Quran lesson: ${meta.translit} ${lesson.startAyah}-${lesson.endAyah}`;
  return note ? `${base}\nNote: ${note}` : base;
}

function openWhatsappForLesson(student, lesson) {
  const text = whatsappLessonText(student, lesson);
  const digits = (student.phone || '').replace(/[^0-9]/g, '');
  const waUrl = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank');
}

async function shareCardWhatsapp() {
  const canvas = document.getElementById('share-canvas');
  const blob = await canvasToBlob(canvas);
  const lesson = state.lessons.find(l => l.id === state.shareLessonId);
  const student = state.students.find(s => s.id === lesson.studentId);
  const fileName = `sabaq-${(student ? student.name : 'lesson').replace(/\s+/g, '-').toLowerCase()}.png`;
  const file = new File([blob], fileName, { type: 'image/png' });
  const text = whatsappLessonText(student, lesson);

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Sabaq lesson', text });
      return;
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
  }
  await shareCardDownload();
  toast('Image saved — attach it in WhatsApp');
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank');
}

/* ---------------------------- Touch gestures ---------------------------- */

function attachDrag(el, opts) {
  let active = false, axis = null, startX = 0, startY = 0, curX = 0, curY = 0, dragged = false;
  el.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) { active = false; return; }
    const t = e.touches[0];
    startX = curX = t.clientX; startY = curY = t.clientY;
    active = true; axis = null; dragged = false;
    if (opts.onStart) opts.onStart(t, e);
  }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    if (!active) return;
    const t = e.touches[0];
    curX = t.clientX; curY = t.clientY;
    const dx = curX - startX, dy = curY - startY;
    if (axis === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      dragged = true;
      if (opts.axis && opts.axis !== 'auto' && opts.axis !== axis) { active = false; return; }
    }
    if (axis === 'x') { if (e.cancelable) e.preventDefault(); }
    if (axis === 'x') { if (opts.onMoveX) opts.onMoveX(dx, dy, t, e); }
    else { if (opts.onMoveY) opts.onMoveY(dx, dy, t, e); }
  }, { passive: false });
  function finish(e) {
    if (!active) return;
    active = false;
    const dx = curX - startX, dy = curY - startY;
    if (axis === 'x') { if (opts.onEndX) opts.onEndX(dx, dy, e); }
    else if (axis === 'y') { if (opts.onEndY) opts.onEndY(dx, dy, e); }
    else { if (opts.onTap) opts.onTap(e); }
  }
  el.addEventListener('touchend', finish);
  el.addEventListener('touchcancel', () => { active = false; if (opts.onCancel) opts.onCancel(); });
  el.addEventListener('click', (e) => {
    if (dragged && axis === 'x') { e.stopPropagation(); e.preventDefault(); }
    dragged = false;
  }, true);
}

function attachSheetDismiss(overlay) {
  const sheet = overlay.querySelector('.sheet');
  if (!sheet) return;
  const id = overlay.id;
  attachDrag(overlay, {
    onMoveY(dx, dy, t, e) {
      if (dy <= 0) { sheet.style.transform = 'translateY(0)'; return; }
      if (sheet.scrollHeight > sheet.clientHeight && sheet.scrollTop > 0) return;
      if (e.cancelable) e.preventDefault();
      sheet.style.transition = 'none';
      sheet.style.transform = `translateY(${Math.max(0, dy)}px)`;
    },
    onEndY(dx, dy) {
      sheet.style.transition = '';
      const h = sheet.offsetHeight;
      if (dy > Math.min(130, h * 0.4)) {
        sheet.style.transform = `translateY(${h}px)`;
        setTimeout(() => { closeSheet(id, true); }, 200);
      } else {
        sheet.style.transform = '';
      }
    }
  });
}

function goToSurah(id) {
  if (id < 1 || id > 114) return;
  if (state.selection.active) return;
  const content = document.getElementById('reader-content');
  content.style.transform = '';
  openReaderSurahOnly(id);
}

function attachReaderSwipe() {
  const content = document.getElementById('reader-content');
  let ignore = false;
  attachDrag(content, {
    onStart(t) { ignore = t.clientX < 30; },
    onMoveX(dx) {
      if (ignore || state.selection.active) return;
      if (!document.getElementById('jump-panel').classList.contains('hidden')) return;
      content.style.transition = 'none';
      content.style.transform = `translateX(${dx * 0.35}px)`;
    },
    onEndX(dx) {
      if (ignore) return;
      content.style.transition = 'transform .25s ease';
      const w = content.offsetWidth || window.innerWidth;
      const threshold = Math.min(90, w * 0.25);
      if (dx < -threshold) goToSurah(state.readerSurahId + 1);
      else if (dx > threshold) goToSurah(state.readerSurahId - 1);
      else content.style.transform = '';
      setTimeout(() => { content.style.transform = ''; content.style.transition = ''; }, 280);
    }
  });
}

function attachEdgeBack(viewId, onBack) {
  const view = document.getElementById(viewId);
  let armed = false;
  attachDrag(view, {
    onStart(t) {
      if (state.selection.active) { armed = false; return; }
      if (t.clientX > 24 || t.clientY < 84) { armed = false; return; }
      armed = true;
      view.classList.add('edge-drag');
      view.style.transition = 'none';
    },
    onMoveX(dx) {
      if (!armed) return;
      view.style.transform = `translateX(${Math.max(0, dx)}px)`;
    },
    onEndX(dx) {
      if (!armed) return;
      view.style.transition = 'transform .25s ease';
      view.style.transform = '';
      view.classList.remove('edge-drag');
      armed = false;
      if (dx > 80) onBack();
    },
    onEndY() { if (armed) { armed = false; view.style.transition = ''; view.style.transform = ''; view.classList.remove('edge-drag'); } },
    onCancel() { armed = false; view.style.transition = ''; view.style.transform = ''; view.classList.remove('edge-drag'); }
  });
}

function detailBack() { showView('students', 'back'); }

function readerBack() {
  if (state.selection.active) resetSelection();
  showView(state.currentStudentId ? 'detail' : 'students', 'back');
}

/* ---------------------------- Add / edit student ---------------------------- */

let editingStudentId = null;

function openAddStudentSheet() {
  editingStudentId = null;
  document.getElementById('student-sheet-title').textContent = 'Add student';
  document.getElementById('input-student-name').value = '';
  document.getElementById('input-student-phone').value = '';
  document.getElementById('select-student-surah').value = '1';
  document.getElementById('input-student-ayah').value = '';
  openSheet('sheet-student');
  setTimeout(() => document.getElementById('input-student-name').focus(), 200);
}

function openEditStudentSheet(student) {
  editingStudentId = student.id;
  document.getElementById('student-sheet-title').textContent = 'Edit student';
  document.getElementById('input-student-name').value = student.name;
  document.getElementById('input-student-phone').value = student.phone || '';
  document.getElementById('select-student-surah').value = String(student.surahId || 1);
  document.getElementById('input-student-ayah').value = student.ayah || '';
  openSheet('sheet-student');
}

async function saveStudentFromSheet() {
  const name = document.getElementById('input-student-name').value.trim();
  if (!name) { toast('Enter a name'); return; }
  const phone = document.getElementById('input-student-phone').value.trim();
  const surahIdRaw = document.getElementById('select-student-surah').value;
  const surahId = surahIdRaw ? parseInt(surahIdRaw, 10) : null;
  const ayahRaw = document.getElementById('input-student-ayah').value.trim();
  const ayah = ayahRaw ? parseInt(ayahRaw, 10) : null;

  if (editingStudentId) {
    const student = state.students.find(s => s.id === editingStudentId);
    student.name = name;
    student.phone = phone;
    student.surahId = surahId;
    student.ayah = ayah;
    await dbPut('students', student);
  } else {
    const student = {
      id: uid(), name, phone,
      surahId, ayah,
      joinedAt: todayIso(),
      createdAt: new Date().toISOString()
    };
    await dbPut('students', student);
    state.students.push(student);
  }
  state.students.sort((a, b) => a.name.localeCompare(b.name));
  closeSheet('sheet-student');
  renderStudents();
  if (state.view === 'detail') renderStudentDetail();
  toast('Saved');
}

async function deleteStudentById(id) {
  const student = state.students.find(s => s.id === id);
  if (!student) return;
  if (!await confirmDialog({ title: 'Delete student', message: `Delete ${student.name} and all their lesson history? This cannot be undone.`, confirmText: 'Delete', danger: true })) return;
  await dbDelete('students', id);
  const toDelete = state.lessons.filter(l => l.studentId === id);
  for (const l of toDelete) await dbDelete('lessons', l.id);
  state.students = state.students.filter(s => s.id !== id);
  state.lessons = state.lessons.filter(l => l.studentId !== id);
  closeSheet('sheet-student-options');
  showView('students');
  renderStudents();
  toast('Student deleted');
}

async function deleteCurrentStudent() {
  await deleteStudentById(state.currentStudentId);
}

/* ---------------------------- Settings ---------------------------- */

function renderSettingsView() {
  document.getElementById('input-school-name').value = state.settings.schoolName || '';
  const preview = document.getElementById('logo-preview');
  if (state.settings.logoDataUrl) {
    preview.innerHTML = `<img src="${state.settings.logoDataUrl}" alt="Logo">`;
  } else {
    preview.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="22" height="22"><path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9"/><path d="M3 15l4.5-4.5a2 2 0 0 1 2.83 0L15 15"/><path d="M14 14l1.5-1.5a2 2 0 0 1 2.83 0L21 15"/><circle cx="8.5" cy="8.5" r="1.2"/></svg>`;
  }
  renderBrandColorRow();
  renderFontSelect('select-quran-font', QURAN_FONTS, state.settings.quranFont || 'amiri');
  renderFontSelect('select-ui-font', UI_FONTS, state.settings.uiFont || 'inter');
  renderQuranSizeSelect();
  renderReaderModeSegmented();
}

function renderReaderModeSegmented() {
  const mode = state.settings.readerMode || 'line';
  document.querySelectorAll('#segmented-reader-mode .segmented-opt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === mode);
  });
}

function renderFontSelect(id, map, current) {
  const sel = document.getElementById(id);
  if (!sel) return;
  sel.innerHTML = Object.keys(map).map(k =>
    `<option value="${k}" ${k === current ? 'selected' : ''}>${map[k].label}</option>`
  ).join('');
}

const QURAN_SIZES = [18, 20, 22, 25, 28, 32, 36, 42];

function renderQuranSizeSelect() {
  const sel = document.getElementById('select-quran-size');
  if (!sel) return;
  const current = state.settings.quranFontSize || 25;
  sel.innerHTML = QURAN_SIZES.map(s =>
    `<option value="${s}" ${s === current ? 'selected' : ''}>${s}px</option>`
  ).join('');
}

function renderBrandColorRow() {
  const row = document.getElementById('brand-color-row');
  const selected = state.settings.brandColorIdx || 0;
  row.innerHTML = BRAND_COLORS.map((c, i) =>
    `<div class="color-dot ${i === selected ? 'selected' : ''}" data-idx="${i}" style="background:${c}"></div>`
  ).join('');
  row.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      row.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      saveSettingsField('brandColorIdx', parseInt(dot.dataset.idx, 10));
    });
  });
}

async function saveSettingsField(key, value) {
  state.settings[key] = value;
  await dbPut('settings', { key: 'app', value: state.settings });
}

async function handleLogoUpload(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    const img = await loadImage(reader.result);
    const size = 240;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const scale = Math.max(size / img.width, size / img.height);
    const w = img.width * scale, h = img.height * scale;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    const dataUrl = c.toDataURL('image/png', 0.9);
    await saveSettingsField('logoDataUrl', dataUrl);
    renderSettingsView();
    toast('Logo updated');
  };
  reader.readAsDataURL(file);
}

async function exportBackup() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    students: state.students,
    lessons: state.lessons,
    settings: state.settings
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sabaq-backup-${todayIso()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast('Backup downloaded');
}

async function importBackup(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    if (!payload.students || !payload.lessons) throw new Error('Invalid file');
    if (!await confirmDialog({ title: 'Import backup', message: `Import ${payload.students.length} student(s) and ${payload.lessons.length} lesson(s)? This merges with existing data.`, confirmText: 'Import' })) return;
    for (const s of payload.students) await dbPut('students', s);
    for (const l of payload.lessons) await dbPut('lessons', l);
    if (payload.settings) { state.settings = Object.assign(state.settings, payload.settings); await dbPut('settings', { key: 'app', value: state.settings }); }
    await loadAppData();
    renderStudents();
    renderSettingsView();
    toast('Backup imported');
  } catch (e) {
    toast('Could not read that file');
  }
}

/* ---------------------------- Learn tab (Quranic Stories) ---------------------------- */

function renderLearnView() {
  renderLearnList();
}

function renderLearnList() {
  const list = document.getElementById('learn-list');
  const empty = document.getElementById('learn-empty');
  const q = (document.getElementById('input-search-learn').value || '').trim().toLowerCase();

  const items = STORIES_DATA.filter(s => {
    if (!q) return true;
    return s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.surahRef.toLowerCase().includes(q);
  });

  list.innerHTML = '';
  if (!items.length) {
    empty.classList.remove('hidden');
    list.classList.add('hidden');
    return;
  }
  empty.classList.add('hidden');
  list.classList.remove('hidden');

  for (const story of items) {
    const card = document.createElement('button');
    card.className = 'learn-card';
    card.innerHTML = `
      <div class="learn-card-head">
        <span class="story-ref-badge">${escapeHtml(story.surahRef)}</span>
        <span class="learn-card-title">${escapeHtml(story.title)}</span>
      </div>
      <div class="story-ref-range">${escapeHtml(story.ayahRange)}</div>
    `;
    card.addEventListener('click', () => openStoryDetailSheet(story.id));
    list.appendChild(card);
  }
}

function openStoryDetailSheet(storyId) {
  const story = storyById(storyId);
  if (!story) return;
  document.getElementById('story-detail-surah').textContent = story.surahRef;
  document.getElementById('story-detail-title').textContent = story.title;
  document.getElementById('story-detail-ayah').textContent = story.ayahRange;
  document.getElementById('story-detail-desc').textContent = story.description;
  openSheet('sheet-story-detail');
}

/* ---------------------------- Event wiring ---------------------------- */

function wireEvents() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      resetSelection();
      if (btn.dataset.tab === 'students') showView('students', undefined, false);
      else if (btn.dataset.tab === 'reader') openReader(state.readerSurahId || 1, null);
      else if (btn.dataset.tab === 'learn') { showView('learn', undefined, false); renderLearnView(); }
      else if (btn.dataset.tab === 'settings') { renderSettingsView(); showView('settings', undefined, false); }
    });
  });

  document.getElementById('btn-add-student').addEventListener('click', openAddStudentSheet);
  document.getElementById('btn-open-settings').addEventListener('click', () => { renderSettingsView(); showView('settings'); });
  document.getElementById('select-quran-font').addEventListener('change', async (e) => {
    await saveSettingsField('quranFont', e.target.value);
    applyFonts();
  });
  document.getElementById('select-quran-size').addEventListener('change', async (e) => {
    await saveSettingsField('quranFontSize', parseInt(e.target.value, 10));
    applyFonts();
  });
  document.getElementById('select-ui-font').addEventListener('change', async (e) => {
    await saveSettingsField('uiFont', e.target.value);
    applyFonts();
  });
  document.querySelectorAll('#segmented-reader-mode .segmented-opt').forEach(btn => {
    btn.addEventListener('click', async () => {
      await saveSettingsField('readerMode', btn.dataset.value);
      renderReaderModeSegmented();
      if (state.view === 'reader') renderReaderContent(state.readerSurahId);
    });
  });

  document.getElementById('input-search-learn').addEventListener('input', (e) => {
    e.stopPropagation();
    renderLearnList();
  });
  document.getElementById('btn-story-detail-close').addEventListener('click', () => closeSheet('sheet-story-detail'));
  document.getElementById('input-search-students').addEventListener('input', (e) => {
    e.stopPropagation();
    renderStudents();
  });

  document.getElementById('btn-student-cancel').addEventListener('click', () => closeSheet('sheet-student'));
  document.getElementById('btn-student-save').addEventListener('click', saveStudentFromSheet);

  document.getElementById('btn-detail-back').addEventListener('click', detailBack);
  document.getElementById('btn-detail-menu').addEventListener('click', () => openSheet('sheet-student-options'));
  document.getElementById('btn-edit-student').addEventListener('click', () => {
    closeSheet('sheet-student-options');
    const student = state.students.find(s => s.id === state.currentStudentId);
    if (student) openEditStudentSheet(student);
  });
  document.getElementById('btn-delete-student').addEventListener('click', deleteCurrentStudent);

  document.getElementById('btn-continue').addEventListener('click', () => {
    const card = document.getElementById('continue-card');
    const surahId = parseInt(card.dataset.lastSurah, 10);
    const ayah = parseInt(card.dataset.lastAyah, 10);
    if (!surahId || isNaN(surahId)) { toast('No lesson to review yet'); return; }
    openReaderReviewLast(state.currentStudentId, surahId, ayah);
  });
  document.getElementById('btn-assign-next').addEventListener('click', () => {
    if (!pendingContinue) return;
    const pc = pendingContinue;
    showAssignNextButton(false);
    beginContinueLesson(pc.studentId, pc.surahId, pc.ayah);
  });
  document.getElementById('btn-first-lesson').addEventListener('click', () => {
    beginFreshLesson(state.currentStudentId);
  });

  document.getElementById('btn-reader-back').addEventListener('click', readerBack);
  document.getElementById('select-surah').addEventListener('change', (e) => {
    const id = parseInt(e.target.value, 10);
    if (state.selection.active && state.selection.lockedSurah && id !== state.selection.surahId) {
      toast('Finish or cancel the current selection first');
      e.target.value = String(state.readerSurahId);
      return;
    }
    openReaderSurahOnly(id);
  });
  document.getElementById('select-ayah').addEventListener('change', (e) => {
    scrollToAyah(parseInt(e.target.value, 10));
  });
  document.getElementById('btn-reader-search').addEventListener('click', () => {
    const panel = document.getElementById('jump-panel');
    const content = document.getElementById('reader-content');
    const opening = panel.classList.contains('hidden');
    panel.classList.toggle('hidden');
    content.classList.toggle('hidden', opening);
    if (opening) { renderJumpList(''); document.getElementById('jump-search-input').value = ''; document.getElementById('jump-search-input').focus(); }
  });
  document.getElementById('jump-search-input').addEventListener('input', (e) => renderJumpList(e.target.value));
  document.getElementById('btn-cancel-select').addEventListener('click', () => {
    const hadStudent = !!state.currentStudentId;
    resetSelection();
    showView(hadStudent ? 'detail' : 'students', 'back');
  });
  document.getElementById('btn-reader-confirm').addEventListener('click', openLessonConfirmSheet);

  document.getElementById('btn-lesson-cancel').addEventListener('click', () => { closeSheet('sheet-lesson'); state.pendingLesson = null; });
  document.getElementById('btn-lesson-save').addEventListener('click', saveLessonFromSheet);
  document.getElementById('btn-edit-range').addEventListener('click', openManualRangeSheet);

  document.getElementById('btn-manual-cancel').addEventListener('click', () => closeSheet('sheet-manual-range'));
  document.getElementById('btn-manual-apply').addEventListener('click', applyManualRange);

  document.getElementById('btn-share-download').addEventListener('click', shareCardDownload);
  document.getElementById('btn-share-whatsapp').addEventListener('click', shareCardWhatsapp);
  document.getElementById('sheet-share').addEventListener('click', (e) => { if (e.target.id === 'sheet-share') closeSheet('sheet-share'); });

  document.getElementById('btn-settings-back').addEventListener('click', () => showView('students', 'back'));
  document.getElementById('btn-upload-logo').addEventListener('click', () => document.getElementById('input-logo').click());
  document.getElementById('input-logo').addEventListener('change', (e) => handleLogoUpload(e.target.files[0]));
  document.getElementById('input-school-name').addEventListener('change', (e) => saveSettingsField('schoolName', e.target.value.trim()));
  document.getElementById('btn-export-data').addEventListener('click', exportBackup);
  document.getElementById('btn-import-data').addEventListener('click', () => document.getElementById('input-import').click());
  document.getElementById('input-import').addEventListener('change', (e) => importBackup(e.target.files[0]));

  document.querySelectorAll('.sheet-overlay').forEach(ov => {
    ov.addEventListener('click', (e) => { if (e.target === ov) closeSheet(ov.id); });
  });

  document.getElementById('btn-confirm-ok').addEventListener('click', () => _closeConfirm(true));
  document.getElementById('btn-confirm-cancel').addEventListener('click', () => _closeConfirm(false));
  document.getElementById('sheet-confirm').addEventListener('click', (e) => {
    if (e.target.id === 'sheet-confirm') _closeConfirm(false);
  });
}

/* ---------------------------- Hardware back button (Android) ---------------------------- */
/* Trap the browser back via the History API so the device back button walks one
   step back inside the app (close sheets, then views) instead of closing it. */

let exitToastShown = false;
let exitToastTimer = null;

function doAppBack() {
  const sheets = [...document.querySelectorAll('.sheet-overlay')]
    .filter(o => !o.classList.contains('hidden'));
  if (sheets.length) {
    closeSheet(sheets[sheets.length - 1].id);
    return true;
  }
  const jump = document.getElementById('jump-panel');
  if (!jump.classList.contains('hidden')) {
    jump.classList.add('hidden');
    document.getElementById('reader-content').classList.remove('hidden');
    return true;
  }
  if (state.selection && state.selection.active) {
    resetSelection();
    return true;
  }
  switch (state.view) {
    case 'detail': detailBack(); return true;
    case 'reader': readerBack(); return true;
    case 'settings': showView('students', 'back'); return true;
    case 'learn': showView('students', 'back'); return true;
    case 'students': {
      const search = document.getElementById('input-search-students');
      if (search.value) { search.value = ''; renderStudents(); return true; }
      return false;
    }
  }
  return false;
}

function onHardwareBack() {
  if (doAppBack()) {
    exitToastShown = false;
    if (exitToastTimer) clearTimeout(exitToastTimer);
    history.pushState({ app: 1 }, '');
    return;
  }
  if (!exitToastShown) {
    exitToastShown = true;
    toast('Press back again to exit');
    history.pushState({ app: 1 }, '');
    exitToastTimer = setTimeout(() => { exitToastShown = false; }, 2000);
  }
}

/* ---------------------------- Init ---------------------------- */

async function init() {
  wireEvents();
  document.querySelectorAll('.sheet-overlay').forEach(attachSheetDismiss);
  attachReaderSwipe();
  attachEdgeBack('view-detail', detailBack);
  attachEdgeBack('view-reader', readerBack);
  history.pushState({ app: 1 }, '');
  window.addEventListener('popstate', onHardwareBack);
  await loadQuranData();
  populateSurahSelect();
  await loadAppData();
  applyFonts();
  renderStudents();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);