(()=>{
const DICT={
 id:{
  home:'Beranda',physical:'Buku Fisik',digital:'Buku Digital',learn:'Belajar Inggris',community:'Ruang Komunitas',listen:'Mobon Mendengar',admin:'Admin',
  welcomeEyebrow:'RUANG LITERASI · PENGETAHUAN · CERITA',welcomeTitle:'Echo of Mobon',welcomeCopy:'Temukan buku, dengarkan bacaan, belajar bahasa, dan berbagi cerita dalam satu ruang literasi yang tenang dan hidup.',welcomeQuote:'Hening namun menggelegar. Tersembunyi namun memengaruhi.',
  guestEntry:'Masuk sebagai Tamu',guestEntrySub:'Isi buku tamu dan jelajahi ruang literasi.',joinMember:'Daftar Anggota',joinMemberSub:'Buat kartu anggota dan riwayat peminjaman.',scanBook:'Scan Buku',scanBookSub:'Scan ISBN/QR untuk melihat detail buku.',myLibrary:'Rak Saya',myLibrarySub:'Buku yang pernah Anda mulai baca.',
  explore:'Jelajahi Echo of Mobon',exploreSub:'Satu ruang untuk membaca, mendengar, belajar, dan terhubung.',featAudio:'Audiobook & Baca Nyaring',featAudioSub:'Dengarkan bacaan digital dengan suara yang tersedia di perangkat.',featLang:'5 Bahasa Antarmuka',featLangSub:'Indonesia, Inggris, Rusia, Mandarin, dan Korea.',featScan:'Pemindai Buku',featScanSub:'Kenali ISBN dan tampilkan metadata buku dengan cepat.',featCommunity:'Ruang Percakapan',featCommunitySub:'Berbagi ide dan berdiskusi dengan pengunjung lain.',
  myShelf:'Rak Baca Saya',myShelfSub:'Buku otomatis masuk ke sini saat Anda mulai membacanya, meski belum selesai.',emptyShelf:'Belum ada buku di Rak Saya. Mulai baca buku digital untuk menambahkannya otomatis.',
  physicalTitle:'Perpustakaan Fisik',physicalSub:'Cari koleksi fisik, lihat ketersediaan, lalu ajukan peminjaman.',digitalTitle:'Perpustakaan Digital',digitalSub:'Baca PDF atau teks digital yang tersedia secara legal.',
  englishTitle:'English Learning Room',englishSub:'Latihan singkat untuk kosakata, pengucapan, dan kalimat sehari-hari.',speak:'Dengarkan',nextLesson:'Pelajaran Berikutnya',practice:'Latihan Cepat',checkAnswer:'Periksa Jawaban',
  communityTitle:'Ruang Komunitas Echo',communitySub:'Ruang percakapan publik yang santun. Jangan bagikan data pribadi, kata sandi, atau informasi sensitif.',displayName:'Nama Tampil',message:'Pesan',send:'Kirim',refresh:'Muat Ulang',report:'Laporkan',reply:'Balas',communityEmpty:'Belum ada percakapan. Jadilah yang pertama menyapa.',
  listenTitle:'Mobon Mendengar',listenSub:'Ruang untuk menulis pengalaman hidup, keresahan, harapan, atau cerita yang ingin Anda keluarkan dari hati.',privacy:'Cerita dikirim secara privat dan hanya dapat dibaca pengelola. Cerita tidak akan dipublikasikan tanpa pilihan dan persetujuan Anda.',yourNameOptional:'Nama (opsional)',yourStory:'Ceritakan pengalaman Anda',contactOptional:'Kontak (opsional)',wantsResponse:'Saya ingin mendapat tanggapan dari pengelola',shareAnon:'Saya bersedia cerita ini dipertimbangkan untuk dibagikan secara anonim',consent:'Saya memahami dan menyetujui jika kutipan anonim dipublikasikan setelah moderasi',sendStory:'Kirim Cerita Secara Privat',
  integrations:'Sumber Buku Terhubung',integrationsSub:'Echo of Mobon menggunakan sumber metadata resmi/terbuka untuk membantu mengenali buku.',openLibrary:'Open Library',googleBooks:'Google Books',perpusnas:'Perpusnas',perpusnasNote:'Koneksi resmi tertentu memerlukan akun/token penerbit; tidak digunakan tanpa izin.',
  scanTitle:'Scan & Kenali Buku',scanHelp:'Arahkan kamera ke barcode ISBN atau unggah foto barcode. Jika pemindaian tidak didukung perangkat, masukkan ISBN secara manual.',takePhoto:'Ambil / Pilih Foto Barcode',isbnManual:'Masukkan ISBN',lookup:'Cari Detail',scanNoResult:'Belum ada detail buku yang ditemukan.',
  audio:'Dengarkan',stopAudio:'Berhenti',voice:'Suara',language:'Bahasa',
  chooseLanguage:'Pilih Bahasa',chooseLanguageSub:'Bahasa utama Echo of Mobon adalah Indonesia. Anda dapat menggantinya kapan saja.',continue:'Lanjutkan',
  footer:'Echo of Mobon · Literasi Suara Fayfiye'
 },
 en:{
  home:'Home',physical:'Physical Books',digital:'Digital Books',learn:'Learn English',community:'Community',listen:'Mobon Listens',admin:'Admin',
  welcomeEyebrow:'LITERACY · KNOWLEDGE · STORIES',welcomeTitle:'Echo of Mobon',welcomeCopy:'Discover books, listen to readings, learn languages, and share stories in one calm and living literacy space.',welcomeQuote:'Quiet yet resonant. Unseen yet influential.',
  guestEntry:'Enter as Guest',guestEntrySub:'Sign the guest book and explore the literacy space.',joinMember:'Become a Member',joinMemberSub:'Create a member card and borrowing history.',scanBook:'Scan a Book',scanBookSub:'Scan ISBN/QR to view book details.',myLibrary:'My Shelf',myLibrarySub:'Books you have started reading.',
  explore:'Explore Echo of Mobon',exploreSub:'One space to read, listen, learn, and connect.',featAudio:'Audiobook & Read Aloud',featAudioSub:'Listen to digital text using voices available on your device.',featLang:'5 Interface Languages',featLangSub:'Indonesian, English, Russian, Chinese, and Korean.',featScan:'Book Scanner',featScanSub:'Recognize ISBN and display book metadata quickly.',featCommunity:'Conversation Room',featCommunitySub:'Share ideas and discuss with other visitors.',
  myShelf:'My Reading Shelf',myShelfSub:'A book is added automatically when you start reading, even before you finish it.',emptyShelf:'Your shelf is empty. Start reading a digital book to add it automatically.',
  physicalTitle:'Physical Library',physicalSub:'Search physical collections, check availability, and request a loan.',digitalTitle:'Digital Library',digitalSub:'Read legally available PDF or digital text.',
  englishTitle:'English Learning Room',englishSub:'Short practice for vocabulary, pronunciation, and daily phrases.',speak:'Listen',nextLesson:'Next Lesson',practice:'Quick Practice',checkAnswer:'Check Answer',
  communityTitle:'Echo Community Room',communitySub:'A respectful public conversation space. Do not share passwords or sensitive personal information.',displayName:'Display Name',message:'Message',send:'Send',refresh:'Refresh',report:'Report',reply:'Reply',communityEmpty:'No conversation yet. Be the first to say hello.',
  listenTitle:'Mobon Listens',listenSub:'A private space for life experiences, worries, hopes, or stories you need to express.',privacy:'Stories are sent privately and can only be read by the managers. Nothing is published without your choice and consent.',yourNameOptional:'Name (optional)',yourStory:'Tell your story',contactOptional:'Contact (optional)',wantsResponse:'I would like a response from the manager',shareAnon:'I allow this story to be considered for anonymous sharing',consent:'I understand and consent to an anonymous excerpt being published after moderation',sendStory:'Send Story Privately',
  integrations:'Connected Book Sources',integrationsSub:'Echo of Mobon uses official/open metadata sources to help recognize books.',openLibrary:'Open Library',googleBooks:'Google Books',perpusnas:'National Library of Indonesia',perpusnasNote:'Some official connections require publisher credentials and are not used without permission.',
  scanTitle:'Scan & Identify a Book',scanHelp:'Point the camera at an ISBN barcode or upload a barcode photo. If scanning is not supported, enter the ISBN manually.',takePhoto:'Take / Choose Barcode Photo',isbnManual:'Enter ISBN',lookup:'Find Details',scanNoResult:'No book details found yet.',
  audio:'Listen',stopAudio:'Stop',voice:'Voice',language:'Language',chooseLanguage:'Choose Language',chooseLanguageSub:'Indonesian is Echo of Mobon’s primary language. You can change it at any time.',continue:'Continue',footer:'Echo of Mobon · Suara Fayfiye Literacy'
 },
 ru:{
  home:'Главная',physical:'Печатные книги',digital:'Цифровые книги',learn:'Английский',community:'Сообщество',listen:'Mobon слушает',admin:'Админ',
  welcomeEyebrow:'ЧТЕНИЕ · ЗНАНИЯ · ИСТОРИИ',welcomeTitle:'Echo of Mobon',welcomeCopy:'Книги, озвученное чтение, языковое обучение и истории — в одном спокойном пространстве.',welcomeQuote:'Тихое, но звучное. Незаметное, но влияющее.',
  guestEntry:'Войти как гость',guestEntrySub:'Заполните гостевую книгу и начните знакомство.',joinMember:'Стать участником',joinMemberSub:'Создайте карту участника и историю выдачи.',scanBook:'Сканировать книгу',scanBookSub:'ISBN/QR для просмотра данных книги.',myLibrary:'Моя полка',myLibrarySub:'Книги, которые вы начали читать.',
  explore:'Откройте Echo of Mobon',exploreSub:'Читайте, слушайте, учитесь и общайтесь.',featAudio:'Аудио и чтение вслух',featAudioSub:'Слушайте цифровой текст голосами устройства.',featLang:'5 языков интерфейса',featLangSub:'Индонезийский, английский, русский, китайский и корейский.',featScan:'Сканер книг',featScanSub:'Распознавание ISBN и быстрый поиск метаданных.',featCommunity:'Комната общения',featCommunitySub:'Обменивайтесь идеями с другими посетителями.',
  myShelf:'Моя читательская полка',myShelfSub:'Книга добавляется автоматически, как только вы начинаете читать.',emptyShelf:'Полка пуста. Начните читать цифровую книгу.',
  physicalTitle:'Печатная библиотека',physicalSub:'Ищите книги, проверяйте наличие и отправляйте запрос на выдачу.',digitalTitle:'Цифровая библиотека',digitalSub:'Читайте легально доступные PDF и цифровые тексты.',
  englishTitle:'English Learning Room',englishSub:'Короткие упражнения по словам, произношению и повседневным фразам.',speak:'Слушать',nextLesson:'Следующий урок',practice:'Быстрая практика',checkAnswer:'Проверить',
  communityTitle:'Сообщество Echo',communitySub:'Публичное пространство для уважительного общения. Не публикуйте пароли и чувствительные данные.',displayName:'Имя',message:'Сообщение',send:'Отправить',refresh:'Обновить',report:'Пожаловаться',reply:'Ответить',communityEmpty:'Пока сообщений нет.',
  listenTitle:'Mobon слушает',listenSub:'Приватное пространство для жизненных историй, тревог, надежд и переживаний.',privacy:'История отправляется приватно и доступна только менеджерам. Публикация возможна лишь с вашим согласием.',yourNameOptional:'Имя (необязательно)',yourStory:'Ваша история',contactOptional:'Контакт (необязательно)',wantsResponse:'Я хочу получить ответ',shareAnon:'Я разрешаю рассмотреть анонимную публикацию',consent:'Я согласен на публикацию анонимного фрагмента после модерации',sendStory:'Отправить приватно',
  integrations:'Источники книг',integrationsSub:'Echo of Mobon использует официальные/открытые источники метаданных.',openLibrary:'Open Library',googleBooks:'Google Books',perpusnas:'Национальная библиотека Индонезии',perpusnasNote:'Некоторые официальные подключения требуют учётных данных издателя.',
  scanTitle:'Сканировать книгу',scanHelp:'Наведите камеру на ISBN или загрузите фото штрихкода. При необходимости введите ISBN вручную.',takePhoto:'Фото штрихкода',isbnManual:'Введите ISBN',lookup:'Найти',scanNoResult:'Данные книги пока не найдены.',audio:'Слушать',stopAudio:'Стоп',voice:'Голос',language:'Язык',chooseLanguage:'Выберите язык',chooseLanguageSub:'Основной язык — индонезийский. Его можно изменить в любое время.',continue:'Продолжить',footer:'Echo of Mobon · Литература Suara Fayfiye'
 },
 zh:{
  home:'首页',physical:'实体书',digital:'数字图书',learn:'学习英语',community:'社区',listen:'Mobon 倾听',admin:'管理',
  welcomeEyebrow:'阅读 · 知识 · 故事',welcomeTitle:'Echo of Mobon',welcomeCopy:'在一个安静而充满活力的阅读空间里发现书籍、聆听朗读、学习语言并分享故事。',welcomeQuote:'静默，却有回响；隐而不见，却能影响。',
  guestEntry:'游客进入',guestEntrySub:'填写访客簿并探索阅读空间。',joinMember:'注册会员',joinMemberSub:'创建会员卡和借阅记录。',scanBook:'扫描图书',scanBookSub:'扫描 ISBN/QR 查看图书详情。',myLibrary:'我的书架',myLibrarySub:'您已经开始阅读的书。',
  explore:'探索 Echo of Mobon',exploreSub:'阅读、聆听、学习与交流。',featAudio:'有声朗读',featAudioSub:'使用设备可用语音朗读数字文本。',featLang:'5 种界面语言',featLangSub:'印尼语、英语、俄语、中文和韩语。',featScan:'图书扫描器',featScanSub:'识别 ISBN 并快速显示图书信息。',featCommunity:'交流空间',featCommunitySub:'与其他访客分享想法。',
  myShelf:'我的阅读书架',myShelfSub:'开始阅读后，图书会自动加入书架，即使尚未读完。',emptyShelf:'书架还是空的。开始阅读一本数字图书吧。',
  physicalTitle:'实体图书馆',physicalSub:'搜索馆藏、查看可借状态并提交借阅申请。',digitalTitle:'数字图书馆',digitalSub:'阅读合法提供的 PDF 或数字文本。',
  englishTitle:'英语学习室',englishSub:'练习词汇、发音和日常英语。',speak:'听发音',nextLesson:'下一课',practice:'快速练习',checkAnswer:'检查答案',
  communityTitle:'Echo 社区',communitySub:'请友善交流，不要发布密码或敏感个人信息。',displayName:'显示名称',message:'消息',send:'发送',refresh:'刷新',report:'举报',reply:'回复',communityEmpty:'还没有消息，来打个招呼吧。',
  listenTitle:'Mobon 倾听',listenSub:'一个私密空间，用来讲述生活经历、担忧、希望或想表达的故事。',privacy:'故事仅私下发送给管理者。未经您的选择和同意，不会公开。',yourNameOptional:'姓名（可选）',yourStory:'写下您的故事',contactOptional:'联系方式（可选）',wantsResponse:'我希望收到管理者回复',shareAnon:'我同意考虑匿名分享这个故事',consent:'我同意审核后匿名发布故事片段',sendStory:'私密发送',
  integrations:'连接的图书来源',integrationsSub:'Echo of Mobon 使用官方/开放元数据源帮助识别图书。',openLibrary:'Open Library',googleBooks:'Google Books',perpusnas:'印度尼西亚国家图书馆',perpusnasNote:'某些官方连接需要出版者账号/令牌，未经许可不会使用。',
  scanTitle:'扫描并识别图书',scanHelp:'将相机对准 ISBN 条码或上传条码照片。如设备不支持扫描，可手动输入 ISBN。',takePhoto:'拍摄 / 选择条码照片',isbnManual:'输入 ISBN',lookup:'查找详情',scanNoResult:'尚未找到图书信息。',audio:'聆听',stopAudio:'停止',voice:'语音',language:'语言',chooseLanguage:'选择语言',chooseLanguageSub:'Echo of Mobon 默认使用印尼语，您可以随时切换。',continue:'继续',footer:'Echo of Mobon · Suara Fayfiye 阅读空间'
 },
 ko:{
  home:'홈',physical:'실물 도서',digital:'디지털 도서',learn:'영어 학습',community:'커뮤니티',listen:'Mobon이 듣습니다',admin:'관리자',
  welcomeEyebrow:'독서 · 지식 · 이야기',welcomeTitle:'Echo of Mobon',welcomeCopy:'책을 발견하고, 낭독을 듣고, 언어를 배우며 이야기를 나누는 차분한 독서 공간입니다.',welcomeQuote:'조용하지만 울림이 있고, 보이지 않아도 영향을 줍니다.',
  guestEntry:'게스트로 입장',guestEntrySub:'방명록을 작성하고 공간을 둘러보세요.',joinMember:'회원 가입',joinMemberSub:'회원 카드와 대출 기록을 만드세요.',scanBook:'책 스캔',scanBookSub:'ISBN/QR을 스캔해 책 정보를 확인하세요.',myLibrary:'내 서재',myLibrarySub:'읽기 시작한 책을 모아 봅니다.',
  explore:'Echo of Mobon 둘러보기',exploreSub:'읽고, 듣고, 배우고, 연결되는 공간.',featAudio:'오디오북 & 낭독',featAudioSub:'기기에서 제공하는 음성으로 디지털 텍스트를 들으세요.',featLang:'5개 인터페이스 언어',featLangSub:'인도네시아어, 영어, 러시아어, 중국어, 한국어.',featScan:'도서 스캐너',featScanSub:'ISBN을 인식하고 책 정보를 빠르게 표시합니다.',featCommunity:'대화 공간',featCommunitySub:'다른 방문객과 생각을 나누세요.',
  myShelf:'내 독서 서재',myShelfSub:'읽기 시작하면 끝까지 읽지 않아도 자동으로 서재에 추가됩니다.',emptyShelf:'아직 서재가 비어 있습니다. 디지털 도서를 읽어 보세요.',
  physicalTitle:'실물 도서관',physicalSub:'도서를 검색하고 대출 가능 여부를 확인한 뒤 신청하세요.',digitalTitle:'디지털 도서관',digitalSub:'합법적으로 제공되는 PDF와 디지털 텍스트를 읽으세요.',
  englishTitle:'English Learning Room',englishSub:'단어, 발음, 일상 표현을 짧게 연습합니다.',speak:'듣기',nextLesson:'다음 학습',practice:'빠른 연습',checkAnswer:'정답 확인',
  communityTitle:'Echo 커뮤니티',communitySub:'서로 존중하는 공개 대화 공간입니다. 비밀번호나 민감한 개인정보를 공유하지 마세요.',displayName:'표시 이름',message:'메시지',send:'보내기',refresh:'새로고침',report:'신고',reply:'답장',communityEmpty:'아직 대화가 없습니다. 먼저 인사해 보세요.',
  listenTitle:'Mobon이 듣습니다',listenSub:'삶의 경험, 걱정, 희망, 마음속 이야기를 적는 비공개 공간입니다.',privacy:'이야기는 비공개로 전송되며 관리자만 볼 수 있습니다. 사용자의 선택과 동의 없이 공개되지 않습니다.',yourNameOptional:'이름(선택)',yourStory:'이야기를 들려주세요',contactOptional:'연락처(선택)',wantsResponse:'관리자의 답변을 받고 싶습니다',shareAnon:'이 이야기를 익명 공유 대상으로 검토하는 데 동의합니다',consent:'검토 후 익명 인용문이 공개될 수 있음에 동의합니다',sendStory:'비공개로 보내기',
  integrations:'연결된 도서 정보원',integrationsSub:'Echo of Mobon은 공식/공개 메타데이터를 이용해 책을 식별합니다.',openLibrary:'Open Library',googleBooks:'Google Books',perpusnas:'인도네시아 국립도서관',perpusnasNote:'일부 공식 연결은 출판사 자격 증명이 필요하며 허가 없이 사용하지 않습니다.',
  scanTitle:'책 스캔 및 식별',scanHelp:'ISBN 바코드를 촬영하거나 사진을 업로드하세요. 지원되지 않으면 ISBN을 직접 입력할 수 있습니다.',takePhoto:'바코드 촬영 / 선택',isbnManual:'ISBN 입력',lookup:'상세 찾기',scanNoResult:'아직 책 정보를 찾지 못했습니다.',audio:'듣기',stopAudio:'중지',voice:'음성',language:'언어',chooseLanguage:'언어 선택',chooseLanguageSub:'기본 언어는 인도네시아어이며 언제든 변경할 수 있습니다.',continue:'계속',footer:'Echo of Mobon · Suara Fayfiye 독서 공간'
 }
};
const LABELS={id:'Indonesia',en:'English',ru:'Русский',zh:'中文',ko:'한국어'};
let current=localStorage.getItem('eom_language')||'id';if(!DICT[current])current='id';
function t(key){return DICT[current]?.[key]??DICT.id[key]??key}
function apply(root=document){
 root.querySelectorAll('[data-i18n]').forEach(el=>{const v=t(el.dataset.i18n);if(v!=null)el.textContent=v});
 root.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{const v=t(el.dataset.i18nPlaceholder);if(v!=null)el.setAttribute('placeholder',v)});
 document.documentElement.lang=current==='zh'?'zh-CN':current;
 const sel=document.getElementById('languageSelect');if(sel&&sel.value!==current)sel.value=current;
 window.dispatchEvent(new CustomEvent('eom-language-change',{detail:{language:current}}));
}
function setLanguage(lang){if(!DICT[lang])return;current=lang;localStorage.setItem('eom_language',lang);apply()}
function language(){return current}
window.EOMI18N={t,apply,setLanguage,language,labels:LABELS,dict:DICT};
document.addEventListener('DOMContentLoaded',()=>apply());
})();