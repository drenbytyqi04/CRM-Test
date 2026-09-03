# CRM — termine

Një aplikacion për të regjistruar termine: të dhënat e personit, kur është
caktuar termini, si shkoi dhe sa kontrata u mbyllën. Çdo termin mban shënimet e
veta. Hyrja bëhet me email dhe fjalëkalim, dhe tri role vendosin kush çfarë
mundet.

---

## Pjesa 1 — Çfarë është secila gjë (shpjegim i shkurtër)

Nëse s'ke programuar kurrë, këta janë emrat që do t'i hasësh:

| Fjala | Çfarë do të thotë këtu |
| --- | --- |
| **Next.js** | Programi që ndërton faqet e internetit. Ai është "aplikacioni" yt. |
| **Supabase** | Baza e të dhënave në internet — aty ruhen terminet dhe shënimet, edhe kur kompjuteri fiket. |
| **Node.js / npm** | Mjetet që e ndezin projektin në kompjuterin tënd. `npm` shkarkon bibliotekat. |
| **Terminali** | Dritarja ku shkruan komanda me tastierë. Në Windows: "PowerShell"; në Mac: "Terminal". |
| **Server** | Kompjuteri (këtu: yti) që përgatit faqen para se ta shohë vizitori. |
| **`.env.local`** | Një skedë me rregullimet e lidhjes me Supabase-in. |
| **RLS** | Roja te dera e tabelës: lejon secilin përdorues të prekë vetëm rreshtat e vet. |

Dy fjalë për strukturën: **termini** është një rresht në tabelën `appointments`
dhe mban brenda vetes edhe të dhënat e personit. Çdo **shënim** është një rresht
në tabelën `notes` që "tregon" me gisht se cilit termin i përket. Nuk ka kartelë
klienti veç — termini është njësia e vetme.

---

## Pjesa 2 — Përgatitja (një herë të vetme)

### Hapi 1: Instalo Node.js

Shko te <https://nodejs.org> dhe shkarko versionin **LTS**. Instaloje si çdo
program tjetër (Next → Next → Finish).

Për të parë nëse u instalua, hap terminalin dhe shkruaj:

```bash
node -v
```

Nëse të kthen diçka si `v22.x.x`, gjithçka është në rregull.

### Hapi 2: Hap projektin në terminal

```bash
cd rruga/drejt/CRM-Test
```

`cd` do të thotë "change directory" — hyr në dosje.

### Hapi 3: Shkarko bibliotekat

```bash
npm install
```

Kjo krijon dosjen `node_modules` (kod i shkruar nga të tjerët që projekti e
përdor). Zgjat një-dy minuta dhe bëhet vetëm një herë.

### Hapi 4: Baza e të dhënave — E GATSHME ✅

Projekti në Supabase është krijuar tashmë në llogarinë tënde:

| | |
| --- | --- |
| Emri i projektit | **crm-test** |
| Adresa (URL) | `https://zfdavzndfhsjckvifxur.supabase.co` |
| Rajoni | Frankfurt (eu-central-1) |
| Kostoja | 0 € — plani falas |

Mund ta shohësh te <https://supabase.com/dashboard>.

### Hapi 5: Tabelat — TË GATSHME ✅

Tabelat `appointments` dhe `notes` janë krijuar dhe të provuara. Për t'i parë:
në Supabase kliko **Table Editor** në menynë e majtë.

Skeda `supabase/schema.sql` mbetet si dëshmi e asaj që u ekzekutua. Do të të
duhej vetëm nëse një ditë krijon një projekt tjetër: e ngjit atje te **SQL
Editor** → **Run**. Radha e skedave për një projekt të ri është:
`schema.sql` → `admin.sql` → `roles.sql` → `nr.sql` → `activity.sql` →
`fshirja.sql` → `llogari-pa-humbje.sql`.

> **E ZBATUAR ✅** — `supabase/mbetur.sql` u ekzekutua më 27 gusht 2026 mbi
> projektin `crm-test`: 16 terminet morën numrat 1000–1015 dhe rregulli
> `profiles_select_all` zëvendësoi atë të vjetrin. Skeda ruhet si dëshmi;
> ekzekutohet dot disa herë pa dëm, dhe do të të duhej vetëm për një projekt
> tjetër.

### Hapi 6: Kopjo skedën e rregullimeve

```bash
cp .env.local.example .env.local
```

Kaq. Skeda vjen me të dyja vlerat tashmë të mbushura (adresa e projektit dhe
çelësi publik). Nuk ka më çelës sekret: të dhënat i mbron hyrja me llogari dhe
rregullat e bazës, jo fshehja e një çelësi.

### Hapi 7: Nise aplikacionin

```bash
npm run dev
```

Hap shfletuesin te <http://localhost:3000>. Do të të dalë faqja e hyrjes.

Për ta ndalur serverin: kliko në terminal dhe shtyp **Ctrl + C**.

### Hapi 8: Llogaritë

**Nuk ka regjistrim të lirë.** Faqja e hyrjes ka vetëm butonin *Hyr*.

Llogaritë e reja i hap **administratori** nga faqja **Përdoruesit** →
*Hap llogari të re*: shkruan emailin, një fjalëkalim të parë (të paktën 8
shenja) dhe zgjedh rolin — *Përdorues* ose *Menaxher*. Emaili shënohet i
konfirmuar vetvetiu, prandaj njeriu hyn menjëherë; ti ia jep fjalëkalimin dhe
ai e ndryshon më pas.

Që kjo të punojë, aplikacionit i duhet çelësi `service_role` — shih
**Hapi 6** dhe skedën `.env.local.example`.

Roli **admin** nuk jepet nga aplikacioni. Një admin i dytë caktohet me dorë te
Supabase → **Table Editor** → `profiles`. Kjo është me qëllim: një llogari
admin e vjedhur nuk duhet të krijojë dot të tjera si vetja.

Llogaria e parë (kjo është kryer tashmë) u hap nga paneli:
<https://supabase.com/dashboard> → projekti **crm-test** → **Authentication** →
**Users** → **Add user** → emaili, fjalëkalimi dhe **Auto Confirm User**.

---

### Hapi 9: Administratori — I GATSHËM ✅

Administratori sheh të gjithë përdoruesit dhe të gjitha të dhënat e tyre.
Kjo është kryer tashmë: tabela e roleve u krijua dhe llogaria
**dren.bytyqi19@gmail.com** është vendosur admin. Kur hyn me të, pranë emailit
del shenja **Admin** dhe një lidhje e re, **Përdoruesit**.

Për të ndryshuar ose shtuar një administrator tjetër, një rresht i vetëm te
Supabase → **SQL Editor**:

```sql
update public.profiles set role = 'admin' where email = 'emaili.i.ri@shembull.com';
```

Për ta hequr rolin, po ashtu: `set role = 'user'`. E njëjta gjë bëhet edhe pa
SQL: Table Editor → `profiles` → kliko qelizën `role`.

### Hapi 10: Akses i plotë për administratorin — I GATSHËM ✅

Administratori shkruan dhe ndryshon çdo shënim, edhe ato të shkruara nga të
tjerët. Rregullat janë te `supabase/roles.sql`.

### Hapi 11: Përcjellja e kohës — E GATSHME ✅

Tabela dhe funksioni që numërojnë kohën aktive janë zbatuar
(skeda `supabase/activity.sql`). Shih **Pjesa 6** për mënyrën e matjes.

### Hapi 12: Terminet — TË GATSHME ✅

Termini është njësia e vetme e sistemit; tabela e klientëve u hoq dhe të dhënat
e personit kaluan mbi vetë terminin. Shih **Pjesa 7**.

### Hapi 13: Katër rolet — TË GATSHME ✅

Rregullat e roleve `user`, `manager`, `admin` dhe `expert` janë zbatuar
(skedat `supabase/roles.sql`, `supabase/eksperti.sql` dhe
`supabase/useri.sql`). Shih tabelën te **Pjesa 3**.

Roli caktohet me një rresht te Supabase → SQL Editor:

```sql
update public.profiles set role = 'manager' where email = 'dikush@shembull.com';
```

---

## Pjesa 3 — Si përdoret

- **Cakto termin:** paneli *Cakto termin të ri* në faqen kryesore. Gjashtë
  fusha janë të detyrueshme dhe shënohen me yll të kuq: **Emri dhe mbiemri**,
  **Telefoni**, **Rruga**, **Kodi postar**, **Qyteti**, **Kantoni**. Pa to
  agjenti nuk shkon dot te takimi. Celulari, emaili dhe të tjerat mbeten të
  lira. Shih **Pjesa 10**.
- **Radha e listës:** termini i regjistruar i fundit rri lart, pavarësisht se
  për cilën datë është caktuar. Kështu ai që sapo u shtua gjendet menjëherë.
- **Ora:** shkruhet gjithmonë **0–23**, edhe kur lexohet, edhe kur shkruhet.
  Data dhe ora janë dy fusha veç: fusha e vjetër `datetime-local` e vizatonte
  vetë shfletuesi sipas gjuhës së kompjuterit, dhe te një kompjuter shqip ajo
  shkruante «10:00 PM» në vend të «22:00». Atë pamje faqja nuk e urdhëron dot
  — s'ka as atribut, as stil që ta detyrojë 24-orëshin — prandaj fusha e orës
  u ndërtua vetë: shkruhet `HH:MM`, dhe çdo gjë tjetër nuk pranohet. Shqipja e shkruan
  orën me 12 nëse nuk i thuhet ndryshe, dhe atëherë 14:30 del «02:30 m.d.» —
  numri që lexon agjenti nuk është ora e terminit. Te një sistem terminesh kjo
  nuk është hollësi. Të gjitha datat dhe orët shfaqen me **orën e Beogradit**
  (`Europe/Belgrade`), me orën e verës të llogaritur vetvetiu. Kjo shkruhet
  shprehimisht në kod: serverat e Vercel-it punojnë me orën botërore (UTC),
  prandaj pa këtë ora do të dilte 1–2 orë prapa. Te faqja e terminit shkruhet
  edhe se kur u regjistrua: *Regjistruar më ... · ora e Beogradit*.
- **Lista:** një tabelë e ngjeshur — *Nr · Emri · Data e terminit · Sigurimi ·
  Pers. · Kontr. · Shën. · Statusi* — ku çdo termin zë një rresht të vetëm.
  Në ekran të vogël kolonat dytësore fshihen vetvetiu.
- **Logoja dhe ngjyra:** shenja e Assurance ACC rri te menyja anash, dhe
  logoja e plotë te faqja e hyrjes. Bluja e markës (`#0069C8`) është ngjyra e
  butonave dhe e lidhjes së zgjedhur. Skedat: `public/shenja.png`,
  `public/logo.png`, `app/icon.png` (ikona e skedës së shfletuesit).
- **Gjuha:** CRM-ja flet **gjermanisht** dhe **shqip**. Gjermanishtja është e
  parazgjedhur; çelësi *Deutsch / Shqip* rri poshtë te menyja anash dhe e
  ndryshon gjithë faqen menjëherë. Zgjedhja ruhet te shfletuesi dhe mbetet
  edhe pas daljes.
- **Filtro:** menyja *Statusi* lart. Përmbledhja tregon sa termine, sa u
  mbajtën dhe sa kontrata u mbyllën — për **tërë bazën**, jo vetëm për faqen
  që sheh.
- **Faqet:** lista jep 50 termine për faqe, me butonat ‹ 1 2 … 40 › poshtë.
  Numri i faqes rri te adresa (`/?faqe=7`), prandaj lidhja mund të dërgohet
  ose të ruhet, dhe kthimi nga një termin të lë aty ku ishe.
- **Kërko:** kutia djathtas filtrit gjen sipas emrit (kudo brenda tekstit)
  ose sipas numrit të shkurtër (`2998`). Kërkimi, filtri dhe pamja *Të mijat*
  udhëtojnë bashkë.
- **Hap një termin:** kliko mbi emrin. Faqja ndahet në pesë skeda —
  *Personalia*, *Të dhëna teknike*, *Rezultati*, *Detaje*, *Feedback* — dhe
  duket vetëm njëra njëherësh, që të mos zbresësh gjatë. Butoni *Ruaj
  ndryshimet* i ruan të gjitha skedat njëherësh, jo vetëm atë që sheh.
- **Menyja anash:** shtylla e majtë mban lidhjet, emailin, rolin dhe *Dil*.
  Në telefon shndërrohet në një shirit të hollë sipër.
- **Dashboard:** numrat e përgjithshëm — sa termine, sa u mbajtën, sa kontrata
  dolën, sa janë të ardhshme — plus ndarja sipas statusit, të regjistruarit
  ditë pas dite, dhe terminet e radhës. Admini sheh edhe ndarjen sipas
  agjentit. Numrat llogariten sa herë hapet faqja, nuk ruhen askund.
- **Profili:** koha jote brenda CRM-së (sot, 14 ditët e fundit, mesatarja),
  sa shënime ke shkruar, dhe — për këdo që cakton termine — sa termine ke
  caktuar dhe sa kontrata dolën prej tyre. Poshtë rri lista e asaj që roli yt
  mund e nuk mund të bëjë.
- **Numri i terminit:** çdo termin ka një numër të shkurtër — `#1000`, `#1001`
  e kështu me radhë — që del te lista, te kreu i faqes dhe te adresa. Numri
  jepet nga baza, nuk ndryshohet kurrë, dhe kështu mund ta thuash me gojë ose
  ta shkruash në një mesazh.
- **Adresa sipas rolit:** i njëjti termin hapet nën prefiksin e atij që është
  i kyçur — `/admin/terminet/1001`, `/menager/terminet/1001` ose
  `/user/terminet/1001`. Prefiksi është vetëm emërtim: ai NUK jep asnjë të
  drejtë. Kush hap prefiksin e një roli tjetër kthehet te i veti, dhe lejet
  dalin gjithmonë nga roli te tabela `profiles`.
- **Fshirja e terminit:** poshtë faqes, vetëm për menaxherin dhe adminin.
  Kërkon dy klikime: i pari hap pyetjen dhe tregon sa shënime fshihen bashkë
  me terminin, i dyti e kryen. Nuk kthehet mbrapsht.
- **Rezultati:** një status i vetëm (I hapur, U mbajt, I anuluar, Nuk u arrit,
  S'deshi termin, Negativ, S'ishte në shtëpi, Adresa s'u gjet, S'u këshillua dot)
  plus kontratat e mbyllura. Baza nuk lejon më shumë kontrata se persona.
- **Feedback i terminit:** poshtë terminit rri një tabelë me tri kolona —
  *Përdoruesi*, *Shënimi*, *Data* — njësoj si te TH-CRM. Kutia e shkrimit rri
  gjithmonë e hapur mbi tabelë: shkruaj dhe shtyp **Ctrl+Enter** (ose butonin
  *Shto shënimin*). Shënimin tënd e ndryshon me *Ndrysho* pa dalë nga tabela;
  te kolona *Data* shfaqet edhe "ndryshuar më".
- **Aktiv sot:** lart djathtas, koha që ke kaluar sot brenda CRM-së.
- **Kopja e të dhënave:** vetëm admini, te menyja anash. Shkarkon gjithçka në
  një skedë të vetme, ose tabelat veç për Excel. Shih **Pjesa 12**.

### Kush çfarë mundet

| Veprimi | Ekspert | Përdorues | Menaxher | Admin |
| --- | :---: | :---: | :---: | :---: |
| Lexon **të gjitha** terminet | ❌ | ❌ | ✅ | ✅ |
| Lexon terminet **e veta** | — | ✅ | ✅ | ✅ |
| Lexon terminet **që ia jep admini** | ✅ | — | ✅ | ✅ |
| Shkruan shënime | ✅\* | ✅\*\* | ✅ | ✅ |
| Cakton termine | ❌ | ✅ | ✅ | ✅ |
| Ndryshon termine — edhe të vetat | ❌ | ❌ | ✅ | ✅ |
| Fshin termine | ❌ | ❌ | ✅ | ✅ |
| Jep akses ekspertëve | ❌ | ❌ | ❌ | ✅ |
| Hap llogari dhe heq hyrjen | ❌ | ❌ | ❌ | ✅ |
| Faqja *Përdoruesit* dhe *Aktiviteti* | ❌ | ❌ | ❌ | ✅ |

\* Eksperti shkruan shënime vetëm te terminet që i janë caktuar.
\*\* Përdoruesi i thjeshtë vetëm te terminet e veta.

**Përdoruesi i thjeshtë** cakton terminet e veta dhe shkruan feedback mbi to
— dhe sheh vetëm ato. Terminet e të tjerëve për të nuk ekzistojnë: nuk dalin
te lista, nuk hyjnë te numrat e përmbledhjes as te dashboard-i, dhe adresa e
drejtpërdrejtë kthen 404 — jo «nuk ke leje», që as vetë numri të mos tregojë
nëse ekziston.

**Ndryshimin e bën vetëm menaxheri ose admini** — edhe te terminet që i ka
caktuar vetë useri. Pra useri nuk e mbyll dot terminin e vet: rezultatin
përfundimtar e shënon menaxheri. Fshirja po ashtu i mbetet menaxherit: ajo
merr me vete edhe shënimet e terminit dhe nuk kthehet mbrapsht.

> **KUJDES gjatë kalimit.** Deri para kësaj, përdoruesi i thjeshtë i lexonte
> TË GJITHA terminet dhe nuk caktonte asnjë. Pas `supabase/useri.sql` ai sheh
> vetëm të vetat — pra dikush që dje shihte një listë të plotë, sot e sheh
> bosh derisa të caktojë vetë. Kjo është pikërisht ajo që u kërkua, por s'ka
> si të mos vihet re. Kush duhet t'i shohë të gjitha, bëhet **menaxher**.

**Eksperti** e bën të njëjtën gjë, por **vetëm te terminet që ia jep admini**.
Për të, ato që s'i janë dhënë nuk ekzistojnë fare: nuk dalin te lista, nuk
numërohen te përmbledhja, dhe adresa e drejtpërdrejtë kthen 404 — jo një
mesazh «nuk ke leje», që as vetë numri i terminit të mos tregojë nëse ekziston.

Ky kufi rri te **baza**, jo te faqja. Rregulli i leximit dikur thoshte
`using (true)` — çdo i kyçur i shihte të gjitha. Ai u bë i vetëdijshëm për
rolin te `supabase/eksperti.sql` (dega e ekspertit) dhe pastaj te
`supabase/useri.sql` (dega e userit). E njëjta ndarje vlen edhe për
**shënimet** — ndryshe dikush do të mos e shihte terminin e huaj te lista,
por do t'i lexonte shënimet e tij përmes API-së. Shih **Pjesa 9**.

Një termin mund t'u jepet **disa ekspertëve** njëherësh. Aksesin e jep vetëm
admini, në dy mënyra:

- **Nga lista, disa njëherësh.** Admini sheh kutiza majtas çdo rreshti. Zgjedh
  sa termine të dojë — ose të gjitha me një klikim — zgjedh ekspertin nga
  menyja lart, dhe ia jep me një klikim. Kështu caktohet puna e një dite pa u
  hapur çdo termin veç.
- **Një nga një**, te skeda *Ekspertët me akses* brenda terminit. Aty duket
  edhe kush ia dha aksesin, dhe butoni për ta hequr.

Nëse mes të zgjedhurve ka ndonjë që eksperti e ka tashmë, ai **nuk është
gabim**: thjesht nuk shtohet dy herë, dhe mesazhi thotë sa u shtuan vërtet.
Ndryshe një zgjedhje e gjerë do të dështonte tërësisht sapo njëri prej tyre të
ishte dhënë më parë.

Kur ekspertit i hiqet aksesi, shënimet që ka shkruar **mbeten** — si te heqja
e një llogarie.

Administratori ka edhe:

- **Fjalëkalim i ri** për çdo llogari — user, menaxher, ekspert ose
  admin tjetër. Nuk ka email rikthimi te ky sistem: llogaritë i hap admini,
  prandaj edhe fjalëkalimin e harruar e zëvendëson ai. Fjalëkalimi i vjetër
  as nuk kërkohet, as nuk shfaqet — baza mban vetëm një gjurmë të koduar të
  tij, prandaj askush nuk e "sheh" fjalëkalimin e dikujt, vetëm e zëvendëson.
  **Kujdes:** ndryshimi nuk e nxjerr jashtë atë që është tashmë i kyçur;
  sesioni i hapur vazhdon derisa t'i mbarojë vetë. Kur dikush duhet ndalur
  menjëherë, përdoret *Hiq hyrjen*.
- **Heqjen e hyrjes** — vetëm admini. Vlen **menjëherë**: me klikimin e parë
  personi del nga aplikacioni dhe sheh njoftimin pse. Llogaria fshihet dhe ai
  nuk hyn më, por **asnjë e dhënë e tij nuk humbet**: terminet që ka caktuar,
  shënimet që ka shkruar dhe orët e tij mbeten, dhe vazhdojnë të mbajnë emrin
  e tij. Rreshti mbetet në listë, i shënuar *pa hyrje*. Tri gjëra ndalohen:
  ta heqësh veten, adminin e fundit, ose ta bësh pa qenë admin.
- **Përdoruesit** — të gjitha llogaritë, rolet, koha aktive sot dhe sa termine e
  shënime ka secili.
- **Aktiviteti** — koha e secilit për 7 ditët e fundit, me pikë jeshile për
  "aktiv tani".
- **Ndryshimin e çdo shënimi**, edhe atyre të shkruara nga të tjerët.

---

## Pjesa 4 — Ku ndodhet çdo gjë në kod

```
app/
  page.tsx                  Faqja kryesore: lista e termineve + paneli i caktimit
  actions.ts                Funksionet që ruajnë terminet dhe shënimet
  sign-out-button.tsx       Butoni "Dil"
  activity-tracker.tsx      Sinjali "jam aktiv" çdo 2 minuta
  setup-notice.tsx          Udhëzimet nëse .env.local mungon
  layout.tsx                Korniza e përbashkët e faqeve
  globals.css               Stilet dhe ngjyrat e markës
  icon.png                  Ikona e skedës te shfletuesi
  login/
    page.tsx                Faqja e hyrjes
    login-form.tsx          Formulari i hyrjes (vetëm "Hyr")
    actions.ts              Hyrja, regjistrimi dhe dalja
  auth/confirm/route.ts     Aty bie lidhja e konfirmimit nga emaili
  auth/dil/route.ts         Dalja e detyruar, kur llogarisë i hiqet hyrja
  admin/page.tsx            Faqja e administratorit: të gjithë përdoruesit
  admin/actions.ts          Hapja e llogarive (vetëm admini)
  admin/user-form.tsx       Paneli "Hap llogari të re"
  admin/password-form.tsx   Ndryshimi i fjalëkalimit të një llogarie
  admin/delete-user.tsx     Heqja e hyrjes së një llogarie
  admin/aktiviteti/page.tsx Koha e secilit përdorues, ditë pas dite
  admin/kopja/page.tsx      Kopja e të dhënave: numrat dhe butonat e shkarkimit
  admin/kopja/shkarko/route.ts  Vetë skeda (JSON ose CSV), me rolin e kontrolluar
  dashboard/page.tsx        Dashboard-i: puna e një muaji, numrat dhe grafikët
  dashboard/month-filter.tsx  Zgjedhja e muajit
  profili/page.tsx          Profili im: koha, puna dhe lejet
  stats.tsx                 Kutitë e numrave dhe grafikët (HTML i thjeshtë)
  status-filter.tsx         Menyja e filtrit sipas statusit
  pagination.tsx            Butonat e faqeve: ‹ 1 2 … 40 ›
  search-box.tsx            Kutia e kërkimit mbi listë
  bulk-assign.tsx           Zgjedhja e disa termineve dhe dhënia te një ekspert
  sidebar.tsx               Menyja anash: lidhjet, roli dhe "Dil"
  sidebar-link.tsx          Një lidhje e menysë, që ndriçon te faqja e vet
  language-switcher.tsx     Çelësi Deutsch / Shqip
  language-action.ts        Ruan gjuhën e zgjedhur te cookie-ja
  terminet/
    appointment-page.tsx    Faqja e një termini (e përbashkët për tri rolet)
    tabs.tsx                Skedat e faqes së terminit
    delete-button.tsx       Fshirja e terminit, me konfirmim në dy hapa
    experts.tsx             Paneli i adminit: kush e sheh këtë termin
    expert-actions.ts       Dhënia dhe heqja e aksesit
    appointment-form.tsx    Formulari i terminit (caktim dhe ndryshim)
    note-form.tsx           Kutia e shpejtë për të shtuar shënim
    note-row.tsx            Një rresht i tabelës, me ndryshim brenda rreshtit
    [nr]/page.tsx           Adresa e vjetër pa prefiks -> te ajo e rolit
  admin/terminet/[nr]/page.tsx     Termini siç e sheh admini
  ekspert/terminet/[nr]/page.tsx   Termini siç e sheh eksperti
  menager/terminet/[nr]/page.tsx   Termini siç e sheh menaxheri
  user/terminet/[nr]/page.tsx      Termini siç e sheh përdoruesi
public/
  logo.png                  Logoja e plotë — vetëm te faqja e hyrjes
  shenja.png                Vetëm shenja — te menyja anash
lib/
  supabase/server.ts        Lidhja me bazën për kodin në server
  supabase/proxy.ts         Mban sesionin e freskët në çdo kërkesë
  supabase/admin.ts         Lidhja me çelësin sekret — vetëm për hapjen e llogarive
  auth.ts                   "Kush është i kyçur?" dhe "çfarë roli ka?"
  backup.ts                 Ç'hyn te kopja, dhe shkrimi i CSV-së
  faqet.ts                  Leximi faqe-pas-faqeje: kurthi i 1000 rreshtave
  types.ts                  Tipat, statuset dhe ndihmësit e vegjël
  i18n.ts                   Fjalori: çdo tekst, gjermanisht dhe shqip
  i18n-server.ts            Lexon gjuhën e zgjedhur nga cookie-ja
proxy.ts                    Ndalon të pakyçurit para se të hapin faqet
supabase/
  schema.sql                Tabelat `appointments` dhe `notes`
  admin.sql                 Profilet, roli admin dhe trigger-i
  roles.sql                 Tri rolet dhe lejet
  nr.sql                    Numri i shkurtër i terminit (#1000)
  fshirja.sql               Lejon fshirjen e termineve (menaxher + admin)
  llogari-pa-humbje.sql     Të dhënat mbijetojnë fshirjen e një llogarie
  faqosja.sql               Numrat e përmbledhjes + indekset e listës
  kategorite.sql            Tri kategoritë + arsyeja brenda tyre
  eksperti.sql              Roli i katërt dhe kufiri i leximit
  useri.sql                 Useri cakton terminet e veta, dhe sheh vetëm ato
  numrat.sql                Numërimi për person te baza, jo duke tërhequr tabelën
  ndryshimi-menaxherit.sql  Terminin e ndryshon vetëm menaxheri, as useri të vetin
  hyrja-e-hequr.sql         Llogaria e hequr ndalet menjëherë, edhe me çelësin e vjetër
  rls-shpejtesi.sql         Rregullat: një llogaritje për kërkesë, jo për rresht
  mbetur.sql                Të dyja migrimet e fundit, në një skedë
  activity.sql              Përcjellja e kohës
```

Tri koncepte që i ndeshni në kod:

- **Server Component** (`app/page.tsx`) — ekzekutohet vetëm në server dhe mund
  ta pyesë bazën e të dhënave drejtpërdrejt me `await`.
- **Server Action** (`app/actions.ts`) — funksione me `"use server"` lart. Kur
  dërgon një formular, shfletuesi e thërret funksionin në server.
- **Proxy** (`proxy.ts`) — kod që ekzekutohet para çdo kërkese. Këtu mban
  sesionin e freskët dhe i kthen te faqja e hyrjes ata që s'janë kyçur.
  (Në Next.js 16 kjo skedë quhej më parë `middleware.ts`.)

---

## Pjesa 5 — Siguria

Të dhënat mbrohen në tri shtresa, njëra mbi tjetrën:

1. **Hyrja me llogari.** Çdo faqe e kontrollon kush je para se të tregojë asgjë.
   Kush s'është i kyçur, dërgohet te faqja e hyrjes.
2. **Rregullat e bazës (RLS).** Vetë baza e të dhënave lejon secilin përdorues
   të prekë vetëm rreshtat ku `user_id` është i tiji. Kjo vlen edhe nëse dikush
   e thërret bazën jashtë aplikacionit tonë.
3. **Filtrim i qartë në kod.** Çdo kërkesë e shkruan edhe vetë "vetëm të miat",
   që një gabim i vetëm të mos mjaftojë për të rrjedhur të dhëna.

Çelësi te `.env.local` është **publik me qëllim** (Supabase e quan
"publishable"). Pa llogari, ai çelës nuk hap asgjë.

**Rolet.** Roli ruhet në tabelën `profiles`, e cila ka RLS pa asnjë rregull
ndryshimi — pra askush nuk e bën dot veten admin apo menaxher nga aplikacioni.
Roli ndryshohet vetëm nga paneli i Supabase-it, ku hyn vetëm ti.

**Secili sheh punën e vet; menaxheri sheh të gjitha.** Rregulli i leximit
dikur thoshte `using (true)` — çdo i kyçur i shihte të gjitha terminet. Sot ai
ka tri degë (`supabase/useri.sql`): menaxheri dhe admini gjithçka, eksperti
ato që ia jep admini, përdoruesi i thjeshtë të vetat. E njëjta ndarje vlen
edhe për **shënimet** — pa të, dikush do të mos e shihte terminin e huaj te
lista, por do t'i lexonte shënimet e tij përmes API-së.

Shkrimi është më i ngushtë se leximi: terminin e vet e ndryshon ai që e
caktoi, çdo termin vetëm menaxheri, dhe fshirjen e bën vetëm menaxheri.
`user_id` merret gjithmonë nga sesioni, kurrë nga formulari, dhe rregulli i
shtimit e kërkon `user_id = auth.uid()` — pra askush nuk shkruan dot një
termin në emër të dikujt tjetër, as duke e thirrur bazën jashtë faqes sonë.

Lista e profileve lexohet nga të gjithë (`profiles_select_all`), sepse tabela
e feedback-ut tregon se kush e shkroi secilin shënim — por vetëm lexohet,
roli nuk ndryshohet dot nga aplikacioni.

### Publikimi në Vercel

Tani që ka hyrje me llogari, publikimi është i arsyeshëm:

1. Hyr te <https://vercel.com> me llogarinë e GitHub-it.
2. **Add New → Project** dhe zgjidh depon `CRM-Test`.
3. Te **Environment Variables** shto të njëjtat dy rreshta që ke te
   `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Kliko **Deploy** dhe prit rreth një minutë.
5. Kthehu te Supabase → **Authentication** → **URL Configuration** dhe vendos
   te **Site URL** adresën që të dha Vercel (p.sh. `https://crm-test.vercel.app`),
   që lidhjet e konfirmimit të email-it të çojnë atje e jo te `localhost`.

Dy gjëra për t'i mbajtur mend:

- **Supabase falas pauzohet** pas rreth një jave pa përdorim. Riaktivizohet me
  një klikim nga paneli.
- **Kush di adresën, sheh faqen e hyrjes** — por jo të dhënat.
- **Fike regjistrimin edhe te Supabase.** Butoni *Regjistrohu* është hequr nga
  faqja, por kjo vetëm e fsheh — dera e Supabase-it mbetet e hapur për këdo që
  di ta dërgojë kërkesën vetë. Mbyllet vetëm nga paneli: Supabase →
  **Authentication** → **Sign In / Providers** → **Email** → fik
  *Allow new users to sign up*. Pa këtë hap, kushdo mund të hapë llogari.

## Pjesa 6 — Përcjellja e kohës

Administratori sheh sa kohë ka kaluar secili përdorues brenda CRM-së, ditë pas
dite. Ja si matet, saktësisht:

- Sa kohë faqja është **e hapur dhe e dukshme**, shfletuesi dërgon një sinjal
  çdo 2 minuta. Nëse përdoruesi kalon në një skedë tjetër, sinjalet ndalen.
- Serveri shton kohën që nga sinjali i fundit, por **jo më shumë se 5 minuta
  përnjëherë**. Kështu një pushim i gjatë nuk numërohet si punë.
- Numrat i shkruan vetëm baza e të dhënave (funksioni `record_activity`).
  Asnjë përdorues nuk mund t'i fryjë numrat e vet, as duke i dërguar sinjale pa
  pushim: nëse s'ka kaluar kohë, nuk shtohet asgjë.

**Çfarë NUK mat:** punë të bërë me telefon, në termin, në letër, ose në ndonjë
program tjetër. Prandaj kjo tabelë tregon kohën në CRM — jo produktivitetin.
Përdore si tregues, jo si dëshmi.

**Transparenca:** secili përdorues e sheh numrin e vet lart në faqe, po aq sa e
sheh administratori. Kjo është me qëllim: përcjellja e fshehtë e punonjësve
krijon probleme ligjore (rregullat e mbrojtjes së të dhënave kërkojnë që
personi të jetë i informuar) dhe prish besimin. Njoftoji punonjësit para se ta
përdorësh këtë faqe.

## Pjesa 7 — Si janë menduar terminet

Sistemi ka **një njësi të vetme: terminin**. Të dhënat e personit — emri, numri i
klientit, datëlindja, adresa, telefoni — rrinë mbi vetë terminin, jo në një
kartelë të veçantë.

Kjo është me qëllim: çdo termin është një ngjarje më vete, me gjendjen e personit
ashtu siç ishte atë ditë. Nëse i njëjti person takohet sërish pas gjashtë
muajsh, caktohet një termin i ri me të dhënat e reja, dhe historiku i të parit
mbetet i paprekur.

**Rezultati: tri kategori, jo nëntë statuse.** Çdo termin bie në njërën nga
tri:

| | Kuptimi |
|---|---|
| 🟢 **E suksesshme** | U mbajt **dhe** u nënshkrua kontratë |
| 🟡 **Në bisedim** | Puna vazhdon; mund të provohet sërish |
| 🔴 **E dështuar** | Mbaroi pa gjë |

Kategoria e ngjyros tërë rreshtin te lista, dhe kjo numërohet te raportet.
Nëntë ngjyra nuk lexohen dot me bisht të syrit; tri po.

**Arsyeja rri brenda kategorisë.** Hollësia nuk humbi — thjesht zbriti një
shkallë: *E dështuar → S'deshi termin*, *Në bisedim → S'ishte në shtëpi*.
Secila arsye i përket vetëm një kategorie, dhe atë lidhje e ruan vetë baza
(`supabase/kategorite.sql`): «e suksesshme + i anuluar» nuk hyn dot as me një
kërkesë të drejtpërdrejtë te API-ja, jo vetëm përmes formularit.

**Suksesi kërkon kontratë.** Ky s'është vetëm rregull i formularit: baza e
refuzon një termin të suksesshëm me zero kontrata. Pa këtë, «e suksesshme» do
të ishte thjesht një ngjyrë që kushdo mund ta vendoste.

**Vetëm një rezultat njëherësh.** Me kuti të pavarura mund të shënohej
njëkohësisht «e suksesshme» dhe «e dështuar», dhe atëherë asnjë raport nuk do
të ishte i besueshëm. Dy shenjat e pavarura që mbeten — *kontratë
shumëvjeçare* dhe *trajtim* — mund të shoqërojnë çdo rezultat.

**Kontratat nuk fryhen dot:** baza refuzon një numër më të madh se numri i
personave të terminit.

## Pjesa 8 — Dashboard-i: një muaj, dhe puna e secilit

Dashboard-i tregon **një muaj njëherësh**, jo gjithçka që ka ndodhur ndonjëherë.
Muaji zgjidhet lart dhe rri te adresa (`/dashboard?muaji=2026-07`), prandaj
lidhja mund të dërgohet dhe kthimi mbrapa i shfletuesit punon si pret njeriu.
Shkohet deri 24 muaj prapa.

**Në cilin muaj bie një termin** e vendos **data e vetë terminit**, jo ajo kur
u regjistrua. Një termin i caktuar për 3 tetor numërohet te tetori, edhe nëse u
fut te sistemi në shtator. Kjo i përgjigjet pyetjes «sa punë kam në tetor».

**Kush sheh çfarë:**

| Roli | Dashboard-i tregon |
| --- | --- |
| **Admin** | të gjitha terminet e qendrës — me çelës për t'i ngushtuar te të vetat |
| **Menaxher** | vetëm terminet që ka caktuar vetë |
| **Përdorues** | vetëm terminet që ka caktuar vetë |
| **Ekspert** | vetëm terminet që i janë caktuar |

### Puna e secilit — vetëm te admini

Poshtë dashboard-it, admini ka një tabelë me **një rresht për çdo llogari**:
sa termine ka bërë secili brenda atij muaji, sa dolën të suksesshme, dhe sa
kontrata. Edhe llogaritë pa asnjë termin rrinë aty — pikërisht ato janë të
vështirat për t'u parë, sepse mungojnë nga çdo listë që ndërtohet mbi
terminet.

**Te eksperti kolona «Termine» ka kuptim tjetër, dhe kjo shkruhet te tabela.**
Ai numër do të thotë *sa i janë dhënë*, jo *sa ka caktuar*. Eksperti nuk
cakton asnjë termin: te terminet e tij `user_id` është ai që ia caktoi.
Po ta numëronim si të tjerët, çdo ekspert do të dilte me zero dhe tabela do
të gënjente për tërë punën e tij — prandaj numri i tij vjen nga
`appointment_experts`, dhe pas tij rri një yll që e shpjegon.

Tabela del vetëm kur admini sheh **të gjitha**: te «Të mijat» do të ishte një
rresht i vetëm.

Eksperti është rasti i veçantë. Te terminet e tij, kolona që tregon *kush e
caktoi* mban menaxherin, jo atë. Po ta filtronim sipas asaj kolone, dashboard-i
i tij do të dilte bosh. Për të, kufirin e ka vënë tashmë baza — sheh vetëm ato
që i janë dhënë — prandaj s'i shtohet asnjë filtër tjetër.

**Ndarja e muajit bëhet me orën e Beogradit.** Kërkesa merr një ditë më shumë
nga të dyja anët, dhe ndarja e saktë bëhet pastaj. Ndryshe do të duhej
llogaritur me dorë sa është dallimi i Beogradit nga ora botërore atë ditë — dhe
ai ndryshon me orën e verës. Kështu përgjigjen e jep kalendari, jo ne.

**Emrat e muajve formatohen te serveri**, jo te shfletuesi. Kjo doli gjatë
provës: Chrome-i nuk i ka të njëjtat emra shqip si Node-i, prandaj menyja
shkruante «August 2026» ndërsa gjithë faqja ishte shqip — dhe React-i jepte
gabim sepse serveri e shfletuesi vizatonin tekste të ndryshme.

---

## Pjesa 9 — Useri që punon vetë

Deri para pak, përdoruesi i thjeshtë ishte lexues: i shihte **të gjitha**
terminet e regjistruara, por nuk caktonte dot asnjë. Puna e tij ishte vetëm
feedback-u. Tani është agjent i vogël — cakton terminet e veta, dhe sheh
vetëm ato.

> **E ZBATUAR ✅** — `supabase/useri.sql` u ekzekutua më 30 gusht 2026 mbi
> bazën e vërtetë. Matrica e lejeve u mat aty, me llogaritë reale, dhe doli
> siç pritej; provat u kthyen mbrapsht, baza mbeti me 16 termine e 22 shënime.
> Këshilluesi i Supabase-it nuk shtoi asnjë paralajmërim të ri.

Ndryshimi është një skedë e vetme te baza, `supabase/useri.sql`, dhe prek
katër rregulla:

| Rregulli | Përpara | Tani |
| --- | --- | --- |
| Cakton termin | vetëm menaxheri | kushdo veç ekspertit |
| Lexon terminet | të gjithë i shihnin të gjitha | menaxheri të gjitha, useri të vetat, eksperti të caktuarat |
| Ndryshon terminin | vetëm menaxheri | **vetëm menaxheri** (pa ndryshim) |
| Lexon shënimet | të gjithë i lexonin të gjitha | ashtu si terminet |

Fshirja **nuk** ndryshoi: mbetet te menaxheri dhe admini. Ajo merr me vete
edhe shënimet e terminit (`on delete cascade`) dhe nuk kthehet mbrapsht.

### Ndryshimin e bën vetëm menaxheri

Në fillim useri e ndryshonte terminin që kishte caktuar vetë, që të mund ta
mbyllte. Pastaj kjo u hoq me kërkesë (`supabase/ndryshimi-menaxherit.sql`):
useri e cakton terminin dhe shkruan feedback mbi të, por nuk e prek më pas.

Pasoja duhet ditur: **useri nuk e mbyll dot terminin e vet.** Ai mbetet «në
bisedim» derisa menaxheri t'i shënojë rezultatin. Numrat e raporteve —
«e suksesshme», kontratat — dalin nga rezultati, jo nga feedback-u, prandaj
një termin i mbaruar mirë por i pashënuar nga menaxheri nuk numërohet askund.
Kjo është zgjedhje pune, jo teknike: rezultatin e vendos ai që mban përgjegjësi
për të.

**Përse `not is_expert()` te dega e leximit.** Te terminet e ekspertit,
`user_id` është ai që ia caktoi, jo vetë eksperti. Pa atë kusht, një llogari
që dikur ka caktuar termine dhe më pas u bë ekspert, do t'i shihte ato përjetë
— jashtë listës së aksesit. E njëjta gjë e detyron faqen të mos e filtrojë
ekspertin sipas `user_id`: do t'i dilte bosh. Për të e bën ndarjen vetëm baza.

**Si u provua.** Të gjitha migrimet u riluajtën nga zeroja mbi një Postgres 16
lokal, dhe matrica e plotë e lejeve — kush lexon, kush cakton, kush ndryshon,
kush dorëzon, kush fshin, kush shkruan shënim — u shënua **para** dhe **pas**
skedës, për të pesë llogaritë e provës. Për matjen e `update` dhe `delete`
numërohen rreshtat e prekur, jo gabimet: një ndryshim që rregullat nuk e
lejojnë **nuk jep gabim** — thjesht nuk prek asnjë rresht. Po të kishim matur
gabimet, "useri ndryshon terminin e menaxherit" do të dukej i lejuar.

E njëjta matje u përsërit edhe mbi bazën e vërtetë, me llogaritë e vërteta.
Rezultati:

```
roli      sheh  shënime | cakton  në emër të tjetrit | ndryshon  fshin | shënim te termini i huaj
admin      16     22    |   po           JO         |    po      po   |   po
menaxher   16     22    |   po           JO         |    po      po   |   po
ekspert     5      6    |   JO           JO         |    JO      JO   |   JO (po te i dhëni)
user        0      0    |   po           JO         |    JO      JO   |   JO
```

> Ajo matje u bë kur useri e ndryshonte ende terminin e vet; edhe atëherë
> kolona «ndryshon» i dilte JO, sepse ajo mati terminin e dikujt tjetër. Pas
> `supabase/ndryshimi-menaxherit.sql` i del JO edhe te termini i vet — matur
> sërish mbi bazën e vërtetë më 30 gusht 2026, bashkë me kontrollin se
> feedback-un te termini i vet ende e shkruan.

---

## Pjesa 10 — Fushat e detyrueshme

Një termin është një takim me një person te një adresë. Pa emrin, pa një numër
ku të merret, dhe pa adresën e plotë, agjenti nuk shkon dot atje. Prandaj
gjashtë fusha kërkohen kur caktohet një termin i ri:

**Emri dhe mbiemri · Telefoni · Rruga · Kodi postar · Qyteti · Kantoni**

Te formulari ato mbajnë një yll të kuq. **Celulari** mbetet i lirë me qëllim:
telefoni është numri i kërkuar, dhe kush ka vetëm njërin nuk duhet detyruar
ta shkruajë dy herë.

Rregulli qëndron në tri shtresa, dhe secila kap diçka që tjetra nuk e kap:

1. **Ylli te etiketa** — që të dihet përpara, jo pasi të jetë shtypur *Ruaj*.
2. **Ndalesa e shfletuesit** (`required`) — nuk të lë ta dërgosh bosh.
3. **Kontrolli te serveri** — ai që mban vërtet. `required` hiqet me një
   klikim te mjetet e zhvilluesit; prandaj i njëjti rregull ripërsëritet te
   `app/actions.ts`, dhe provat e verifikojnë pikërisht ashtu: duke ia hequr
   formularit ndalesën dhe duke e dërguar gjithsesi.

### Terminet e vjetra nuk bllokohen

Nga 17 terminet që ekzistonin kur u vendos ky rregull, 6 s'kishin kanton dhe 4
s'kishin adresë. Po t'u kërkonim edhe atyre, kushdo që do vetëm të ndërronte
rezultatin e njërit prej tyre do të bllokohej te një fushë që s'e di.

Prandaj rregulli lexon kështu: **te një termin ekzistues kërkohet vetëm ajo që
e ka pasur tashmë.** Ç'ka është bosh mbetet bosh — por ç'ka është plotësuar
një herë nuk zbrazet dot. Te ata terminet, ylli te fushat bosh as nuk shfaqet.

### E meta që doli bashkë me këtë

Duke provuar rregullin u zbulua diçka më e rëndë: **pas çdo refuzimi,
formulari zbrazej i tëri.** React-i e zbraz vetvetiu një formular sapo veprimi
mbaron — edhe kur ai veprim ktheu gabim. Me një fushë të vetme të detyrueshme
kjo mezi vihej re; me gjashtë do të thoshte se një gabim shtypi te kantoni
fshin edhe emrin, edhe adresën, edhe datën.

Zgjidhja: kur kërkesa refuzohet, serveri i kthen mbrapsht fjalët e shkruara
(`FormState.values`), dhe formulari i vë ato si vlera fillestare. Kështu edhe
zbrazja e React-it i gjen ato aty, dhe puna nuk humbet. Pas një ruajtjeje të
suksesshme formulari zbrazet si më parë, gati për terminin tjetër.

---

## Pjesa 11 — Lista me shumë termine

Deri para pak, lista i merrte **të gjitha** terminet sa herë hapej. Me pak
dhjetëra kjo s'duket. Me 2000 prishet, dhe u mat me 2000 të vërtetë:

| | Më parë | Tani |
|---|---|---|
| Rreshta në faqe | 2000 | 50 |
| Pesha e faqes | 1706 KB | 65 KB |
| Gjatësia | 90 392 px (~100 ekrane) | 2694 px |
| Nyje HTML | 24 198 | 810 |
| Kolona *Shën.* | **0 kudo, gabim** | e saktë |

Gabimi i fundit ishte më i keqi, sepse nuk dukej fare. Shënimet e listës
merreshin me një kërkesë të vetme që i numëronte të gjitha id-të njëherësh.
Me 2000 id, adresa e asaj kërkese arrinte **72 080 shkronja** — serveri e
kthente me `431 Request Header Fields Too Large`. Faqja nuk shfaqte asnjë
gabim; thjesht çdo rresht tregonte `0` shënime, edhe kur kishte tri.

**Zgjidhja.** Lista merr një faqe, 50 rreshta. Shënimet merren vetëm për ato
50. Numrat e përmbledhjes lart nuk dalin më nga rreshtat e ngarkuar, por i
llogarit baza me funksionin `appointments_summary` (te `supabase/faqosja.sql`),
që kthen tre numra në vend të mijëra rreshtave.

**Pse faqe e jo scroll i pafund.** Numri i faqes rri te adresa. Prandaj
lidhja dërgohet e ruhet, dhe kthimi nga një termin të lë aty ku ishe. Scroll-i
i pafund i humb të treja, dhe s'arrin dot kurrë te fundi.

**Siguria e funksionit.** Është `security invoker`, jo `definer` — pra
rregullat e leximit vlejnë njësoj si te çdo kërkesë tjetër. Po ta bënim
`definer`, numri lart do të numëronte edhe termine që përdoruesi s'i sheh
dot te lista poshtë. Kjo është provuar: kur RLS-ja i fsheh rreshtat,
funksioni kthen 0.

**Indekset.** `faqosja.sql` shton indekset e listës dhe një `pg_trgm` për
kërkimin sipas emrit. Të matura me **50 000** termine: faqja e parë 0.06 ms,
faqja e 1000-të 4.3 ms, kërkimi 0.6 ms, përmbledhja 11.6 ms.

Një kurth që u kap vetëm duke e matur: indeksi duhet të përputhet me **radhën
e plotë**, jo vetëm me kolonën e parë. Me indeks mbi `created_at desc` dhe
renditje `created_at desc, nr desc`, baza e lë indeksin dhe skanon gjithçka —
**125 ms** në vend të 0.06 ms. Indeksi tani i mban të dyja kolonat.

**Rregullat e leximit.** `rls-shpejtesi.sql` i rishkruan rregullat e RLS-së
që `auth.uid()` dhe `is_admin()`/`is_manager()` të llogariten **një herë për
kërkesë**, jo një herë për çdo rresht. Kuptimi mbetet fiks i njëjti — të tri
funksionet janë `stable` dhe pa argumente. Meqë këto janë rregulla sigurie,
matrica e lejeve (kush lexon, cakton, ndryshon, fshin — për të tre rolet) u
shënua para ndryshimit dhe u krahasua pas tij: doli identike, rresht për
rresht. E njëjta u ripërsërit edhe te baza e vërtetë, me të shtatë llogaritë,
brenda një transaksioni që u përmbys.

> **Mbetet për t'u bërë:** *Dashboard-i*, *Profili* dhe faqja e *Përdoruesve*
> i lexojnë ende të gjitha terminet për të llogaritur numrat e tyre. Nën 1000
> termine punojnë saktë; mbi atë kufi Supabase i pret rreshtat në heshtje dhe
> numrat dalin më të vegjël se e vërteta. Rregullimi është i njëjti: numrat
> t'i llogarisë baza.

---

## Pjesa 12 — Kopja e të dhënave

> **Kjo është pjesa që të shpëton kur diçka shkon keq.** Kodi rishkruhet;
> terminet e një viti jo.

### Butoni: `/admin/kopja`

Vetëm admini. Jep dy gjëra:

- **Kopja e plotë (JSON)** — një skedë me të pesë tabelat: llogaritë, terminet,
  feedback-un, aksesin e ekspertëve dhe orët e punës. Prej saj të dhënat
  kthehen të plota. Kjo është ajo që ruhet.
- **Tabelat veç (CSV)** — për t'i hapur me Excel, për t'i parë e llogaritur.
  Jo për kthim mbrapsht.

Faqja tregon **sa rreshta ka secila tabelë para se të shkarkosh**. Kjo nuk
është zbukurim: nëse skeda e shkarkuar ka më pak, diçka ka shkuar keq — dhe pa
ata numra askush s'do ta vinte re pa hapur skedën.

### Kurthi që e bën një kopje të gënjejë

PostgREST-i i Supabase-it i pret rreshtat te një kufi i vetin (`max-rows`,
zakonisht **1000**) DHE NUK JEP ASNJË GABIM. Një kërkesë e thjeshtë
`select("*")` mbi 5000 termine kthen 1000, me statusin 200, dhe skeda del e
plotë në dukje. E ke kopjen; thjesht i mungojnë katër të pestat.

Prandaj kopja lexohet **faqe pas faqeje**, dhe numri i rreshtave të marrë
krahasohet me numrin e vërtetë te baza. Nëse s'përputhen, kopja **nuk jepet
fare** — më mirë asnjë kopje sesa një kopje që gënjen.

Kjo provohet, nuk supozohet: te provat mbushen 1200 termine dhe verifikohet se
skeda i ka të 1200-tët, jo 1000. Edhe serveri i provës u bë ta presë te 1000
si Supabase — përndryshe prova s'do të provonte asgjë.

### I njëjti kurth ishte edhe te tri faqe

Sapo serveri i provës nisi t'i priste rreshtat si Supabase, doli se tri faqe
numëronin mbi atë që merrnin — pra mbi 1000 termine do të tregonin numra
**thjesht të gabuar**, më të vegjël se e vërteta, pa asnjë shenjë:

| Faqja | Përpara | Tani |
| --- | --- | --- |
| **Përdoruesit** | tërhiqte TË GJITHA terminet dhe TË GJITHA shënimet për tetë numra | i numëron baza, një rresht për person (`supabase/numrat.sql`) |
| **Profili** | merrte terminet e mia me një kërkesë | faqe pas faqeje (`lib/faqet.ts`) |
| **Dashboard** | merrte terminet e muajit me një kërkesë, plus TË GJITHA shënimet | terminet faqe pas faqeje; shënimet i numëron baza me `head: true` |

`head: true` do të thotë: kthe vetëm numrin, asnjë rresht. Dashboard-i tregon
sa shënime ka gjithsej dhe sa janë të miat; për ata dy numra lexonte më parë
çdo shënim të çdo termini, sa herë hapej faqja.

Nëse `supabase/numrat.sql` nuk është ekzekutuar ende, faqja «Përdoruesit»
shfaq një njoftim të verdhë. Pa të, mungesa e funksionit do të dukej si
«të gjithë kanë zero» — pikërisht numri i gabuar që u desh të hiqej.

> **E ZBATUAR ✅** — `supabase/numrat.sql` u ekzekutua më 30 gusht 2026 mbi
> bazën e vërtetë. U verifikua aty se funksioni i respekton rregullat e
> leximit: admini dhe menaxheri shohin numrat e të gjithëve (18 termine, 22
> shënime gjithsej), eksperti vetëm ata që i takojnë terminet e caktuara, dhe
> përdoruesi i thjeshtë vetëm të vetët. Këshilluesi i Supabase-it nuk shtoi
> asnjë paralajmërim të ri.

### Detaje të vogla që kushtojnë kur mungojnë

- **CSV-ja nis me shenjën UTF-8** (BOM). Pa këto tre bajte, Excel-i te
  Windows-i i lexon shkronjat me kodimin e vet: «Zürich» → «ZÃ¼rich».
- **Vlerat mbështillen me thonjëza dhe thonjëzat brenda dyfishohen.** Te
  terminet ka adresa me presje dhe shënime me rreshta të rinj; pa këtë një
  shënim i vetëm i zhvendos tërë kolonat.
- **Adresa e shkarkimit e kontrollon vetë rolin.** Kush s'është admin merr
  404, jo «nuk ke leje» — as vetë ekzistenca e saj nuk tregohet.

### Kjo NUK mjafton vetëm

Butoni është kopja që bën njeriu. Mbrojtja e plotë ka tri shtresa:

| Shtresa | Kundër çfarë | Ku qëndron |
| --- | --- | --- |
| Kopja e Supabase-it | fshirje aksidentale, prishje e bazës | te Supabase, sipas planit |
| Kopja e shkarkuar | humbje e vetë projektit Supabase | te disku yt |
| Vendi i dytë | djegie, vjedhje, disk i prishur | disk i jashtëm ose dosje në internet |

**Plani i Supabase-it ka rëndësi.** Te plani falas **nuk ka kopje automatike**:
nëse projekti fshihet ose prishet, s'ka ku të kthehesh. Kontrollohet te
Supabase → **Database → Backups**. Nëse aty s'ka asgjë, e vetmja mbrojtje është
skeda që shkarkon vetë.

**Kurrë te një depo publike.** Skeda përmban emra, numra telefoni, adresa dhe
të dhëna shëndetësore (mjekime, trajtime). Depoja `CRM-Test` te GitHub-i është
**publike**; një kopje e futur atje do të ishte e lexueshme nga kushdo në
botë. Kodi nuk përmban çelësa — ata rrinë te `.env.local`, i cili nuk dërgohet
kurrë — por të dhënat janë punë tjetër.

---

## Pjesa 13 — Hyrja e hequr vlen menjëherë

Kur admini i hiqte hyrjen dikujt, ai person vazhdonte të punonte — hapte faqe,
caktonte termine, shkruante shënime. **Deri në një orë.**

Shkaku nuk ishte te fshirja: ajo punonte. Ishte te çelësi. Kur dikush kyçet,
shfletuesi i tij merr një çelës të nënshkruar (JWT) që vlen rreth një orë, dhe
**fshirja e llogarisë nuk e prish atë çelës**. Deri sa t'i mbaronte koha,
`auth.uid()` kthente ende id-në e tij — dhe asnjë rregull i bazës nuk e
pyeste nëse llogaria ishte ende e gjallë. Ato pyesnin vetëm për rolin.

Prandaj shenja `active` te `profiles`, e cila deri tani vinte vetëm një
etiketë te lista e llogarive, u bë kusht i vërtetë, në dy shtresa:

**Te faqja** (`lib/auth.ts`). Roli lexohet te çdo kërkesë; tani lexohet edhe
`active`. Nëse është `false`, personi trajtohet si i pakyçur dhe dërgohet të
dalë. Kjo e nxjerr jashtë me klikimin e parë.

**Te baza** (`supabase/hyrja-e-hequr.sql`). Funksionet `is_admin()`,
`is_manager()` dhe `is_expert()` tani kërkojnë edhe `active` — një menaxher pa
hyrje nuk është më menaxher. Dhe çdo rregull tjetër nis me `eshte_aktiv()`.
Kjo shtresë mbron nga një kërkesë e dërguar drejt te baza, jashtë faqes sonë,
me çelësin që i ka mbetur në dorë. E njëjta shenjë ndalon edhe orën e punës:
`record_activity()` nuk numëron më.

### Dy gjëra që dolën duke e ndërtuar

**Rregulli i ri ia fshihte njeriut vetë profilin.** Nëse `profiles` kërkonte
`eshte_aktiv()`, atëherë një llogari e hequr nuk e lexonte dot as rreshtin e
vet — dhe faqja nuk e mësonte dot se hyrja i ishte hequr, sepse `active`
rri pikërisht aty. Përfundimi ishte se personi mbetej brenda, i trajtuar si
përdorues i zakonshëm. Prandaj rregulli ka një degë të dytë: **secili e sheh
gjithmonë rreshtin e vet**, edhe pa hyrje. Nuk rrjedh asgjë — sheh vetëm
veten, dhe asnjë veprim tjetër nuk i hapet.

> **E ZBATUAR ✅** — `supabase/hyrja-e-hequr.sql` u ekzekutua më 3 shtator 2026
> mbi bazën e vërtetë, dhe u mat aty me llogaritë reale. Nga 10 llogari, 5
> ishin pa hyrje: pas skedës secila prej tyre sheh **0 termine, 0 shënime dhe
> vetëm rreshtin e vet**, dhe nuk cakton e nuk shkruan dot asgjë — përfshirë
> një llogari me rolin `admin` së cilës i ishte hequr hyrja. Të pesë llogaritë
> me hyrje nuk u prekën fare.
>
> Këshilluesi i Supabase-it shtoi një paralajmërim të vetëm: `eshte_aktiv()`
> i bashkohet katër funksioneve të tjera që janë `security definer`. Kjo është
> e qëllimshme — funksioni duhet ta lexojë profilin edhe kur vetë rregullat e
> profileve nuk do ta lejonin — dhe nuk rrjedh asgjë: kthen vetëm nëse ai që
> pyet e ka hyrjen, gjë që ai e merr vesh gjithsesi duke provuar të hyjë.

**Ridrejtimi te `/login` do të bëhej unazë.** Proxy-ja e sheh çelësin ende të
mirë, e quan njeriun të kyçur, dhe e kthen nga `/login` te «/». Prandaj u
shtua `/auth/dil`: aty sesioni fshihet vërtet, dhe pastaj s'ka më ku të
kthehet. Ridrejtimi është me adresë **relative** — `new URL(..., request.url)`
e ndërton adresën nga hosti që sheh serveri brenda, dhe ai jo gjithmonë është
ai që ka shkruar njeriu; te prova doli «localhost» ndërsa shfletuesi ishte te
«127.0.0.1», dhe bashkë me hostin humbte edhe cookie-ja e gjuhës.

---

## Pjesa 14 — Dy gjuhët

Çdo tekst që sheh njeriu rri te `lib/i18n.ts`, jo nëpër faqe. Aty janë dy
fjalorë: `de` (gjermanisht) dhe `sq` (shqip).

**Si punon.** Gjuha ruhet te një cookie e quajtur `gjuha`. Serveri e lexon me
`getI18n()` te `lib/i18n-server.ts` dhe ia jep faqes fjalorin e duhur. Nëse
askush s'ka zgjedhur ende, hyn gjermanishtja.

**Pse kështu dhe jo `/de/...` e `/sq/...`.** Ashtu do të dyfishoheshin të gjitha
adresat, dhe çdo lidhje do të duhej të mbante gjuhën me vete. Me cookie, adresa
mbetet një e vetme.

**Përkthimi nuk harrohet dot.** Tipi `Dict` merr formën e gjermanishtes. Nëse
shtohet një çelës i ri atje dhe shqipja mbetet pa të, `npx tsc --noEmit` ndalet
me gabim — pra mungesa kapet para se të dalë në ekran, jo nga përdoruesi.

**Njëjës dhe shumës.** Numrat kalojnë nga ndihmësi `sasi()`, që zgjedh formën:
*1 Termin* / *2 Termine*, *1 termin* / *2 termine*. Pa të do të dilte
«1 Termine».

**Datat.** Secila gjuhë ka formatin e vet (`de-DE`, `sq-AL`), por zona mbetet
gjithmonë ajo e Beogradit — gjuha ndryshon fjalët e muajve, jo orën.

**Kujdes te komponentët e shfletuesit.** Fjalori përmban funksione, dhe
funksionet nuk kalojnë dot nga serveri te shfletuesi. Prandaj komponentëve
`"use client"` u jepet vetëm kodi i gjuhës (`lang`), dhe ata e marrin fjalorin
vetë me `DICTS[lang]`.

---

## Pjesa 15 — Kur diçka nuk shkon

| Problemi | Zgjidhja |
| --- | --- |
| Faqja tregon kutinë e verdhë "nuk është konfiguruar" | `.env.local` mungon. Përsërit Hapin 6 dhe rinis serverin. |
| "Email ose fjalëkalim i gabuar" | Llogaria s'është krijuar ende ose emaili s'është konfirmuar. Shih Hapin 8. |
| S'të shfaqet shenja "Admin" | SQL-i i `supabase/admin.sql` s'është ekzekutuar, ose rreshti `update ... set role = 'admin'` ka email tjetër. Shih Hapin 9. |
| Regjistrohesh po s'të vjen emaili | Përdor rrugën B të Hapit 8 (krijo përdoruesin nga paneli me *Auto Confirm*). |
| `relation "appointments" does not exist` | Je lidhur me një projekt tjetër. Kontrollo `NEXT_PUBLIC_SUPABASE_URL` te `.env.local`. |
| `Invalid API key` | Vlerat te `.env.local` u ndryshuan. Kopjoje sërish nga `.env.local.example`. |
| `command not found: npm` | Node.js nuk është instaluar. Përsërit Hapin 1. |
| Porta 3000 është e zënë | Nise me `npm run dev -- -p 3001`. |
| Ndryshimet nuk duken | Rifresko faqen; nëse s'mjafton, ndal serverin (Ctrl+C) dhe nise sërish. |

## Komandat kryesore

```bash
npm run dev     # nis serverin për zhvillim (localhost:3000)
npm run build   # ndërton versionin për publikim
npm start       # nis versionin e ndërtuar
npm run lint    # kontrollon stilin e kodit
```
