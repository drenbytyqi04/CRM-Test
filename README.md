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

### Hapi 13: Tri rolet — TË GATSHME ✅

Rregullat e roleve `user`, `manager` dhe `admin` janë zbatuar
(skeda `supabase/roles.sql`). Shih tabelën te **Pjesa 3**.

Roli caktohet me një rresht te Supabase → SQL Editor:

```sql
update public.profiles set role = 'manager' where email = 'dikush@shembull.com';
```

---

## Pjesa 3 — Si përdoret

- **Cakto termin:** paneli *Cakto termin të ri* në faqen kryesore. Plotëso emrin
  (i detyrueshëm), personalinë, të dhënat teknike dhe datën e terminit.
- **Radha e listës:** termini i regjistruar i fundit rri lart, pavarësisht se
  për cilën datë është caktuar. Kështu ai që sapo u shtua gjendet menjëherë.
- **Ora:** të gjitha datat dhe orët shfaqen me **orën e Beogradit**
  (`Europe/Belgrade`), me orën e verës të llogaritur vetvetiu. Kjo shkruhet
  shprehimisht në kod: serverat e Vercel-it punojnë me orën botërore (UTC),
  prandaj pa këtë ora do të dilte 1–2 orë prapa. Te faqja e terminit shkruhet
  edhe se kur u regjistrua: *Regjistruar më ... · ora e Beogradit*.
- **Lista:** një tabelë e ngjeshur — *Nr · Emri · Data e terminit · Sigurimi ·
  Pers. · Kontr. · Shën. · Statusi* — ku çdo termin zë një rresht të vetëm.
  Në ekran të vogël kolonat dytësore fshihen vetvetiu.
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
  sa shënime ke shkruar, dhe — për menaxherin e adminin — sa termine ke
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

### Kush çfarë mundet

| Veprimi | Përdorues | Menaxher | Admin |
| --- | :---: | :---: | :---: |
| Lexon terminet e regjistruara | ✅ | ✅ | ✅ |
| Shkruan shënime | ✅ | ✅ | ✅ |
| Cakton dhe ndryshon termine | ❌ | ✅ | ✅ |
| Fshin termine | ❌ | ✅ | ✅ |
| Hap llogari dhe heq hyrjen | ❌ | ❌ | ✅ |
| Faqja *Përdoruesit* dhe *Aktiviteti* | ❌ | ❌ | ✅ |

Përdoruesi i thjeshtë e hap çdo termin dhe e lexon të plotë — personalinë, të
dhënat teknike, rezultatin dhe detajet — por si tekst, pa formularë. Puna e tij
regjistrohet përmes shënimeve.

Administratori ka edhe:

- **Heqjen e hyrjes** — vetëm admini. Llogaria fshihet dhe personi nuk hyn
  më, por **asnjë e dhënë e tij nuk humbet**: terminet që ka caktuar,
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
  globals.css               Stilet
  login/
    page.tsx                Faqja e hyrjes
    login-form.tsx          Formulari i hyrjes (vetëm "Hyr")
    actions.ts              Hyrja, regjistrimi dhe dalja
  auth/confirm/route.ts     Aty bie lidhja e konfirmimit nga emaili
  admin/page.tsx            Faqja e administratorit: të gjithë përdoruesit
  admin/actions.ts          Hapja e llogarive (vetëm admini)
  admin/user-form.tsx       Paneli "Hap llogari të re"
  admin/delete-user.tsx     Heqja e hyrjes së një llogarie
  admin/aktiviteti/page.tsx Koha e secilit përdorues, ditë pas dite
  dashboard/page.tsx        Dashboard-i: numrat dhe grafikët
  profili/page.tsx          Profili im: koha, puna dhe lejet
  stats.tsx                 Kutitë e numrave dhe grafikët (HTML i thjeshtë)
  status-filter.tsx         Menyja e filtrit sipas statusit
  pagination.tsx            Butonat e faqeve: ‹ 1 2 … 40 ›
  search-box.tsx            Kutia e kërkimit mbi listë
  sidebar.tsx               Menyja anash: lidhjet, roli dhe "Dil"
  sidebar-link.tsx          Një lidhje e menysë, që ndriçon te faqja e vet
  language-switcher.tsx     Çelësi Deutsch / Shqip
  language-action.ts        Ruan gjuhën e zgjedhur te cookie-ja
  terminet/
    appointment-page.tsx    Faqja e një termini (e përbashkët për tri rolet)
    tabs.tsx                Skedat e faqes së terminit
    delete-button.tsx       Fshirja e terminit, me konfirmim në dy hapa
    appointment-form.tsx    Formulari i terminit (caktim dhe ndryshim)
    note-form.tsx           Kutia e shpejtë për të shtuar shënim
    note-row.tsx            Një rresht i tabelës, me ndryshim brenda rreshtit
    [nr]/page.tsx           Adresa e vjetër pa prefiks -> te ajo e rolit
  admin/terminet/[nr]/page.tsx     Termini siç e sheh admini
  menager/terminet/[nr]/page.tsx   Termini siç e sheh menaxheri
  user/terminet/[nr]/page.tsx      Termini siç e sheh përdoruesi
lib/
  supabase/server.ts        Lidhja me bazën për kodin në server
  supabase/proxy.ts         Mban sesionin e freskët në çdo kërkesë
  supabase/admin.ts         Lidhja me çelësin sekret — vetëm për hapjen e llogarive
  auth.ts                   "Kush është i kyçur?" dhe "çfarë roli ka?"
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

**Leximi është i përbashkët, shkrimi jo.** Çdo i kyçur i lexon terminet e
regjistruara dhe shënimet e tyre. Shtimi dhe ndryshimi mbeten të mbyllura:
terminet i prek vetëm menaxheri, shënimin e vet e ndryshon vetëm autori (ose
admini). Lista e profileve lexohet nga të gjithë (`profiles_select_all`),
sepse tabela e feedback-ut tregon se kush e shkroi secilin shënim — por vetëm
lexohet, roli nuk ndryshohet dot nga aplikacioni.

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

**Statusi është një i vetëm, jo disa kuti.** Me kuti të pavarura mund të
shënohej njëkohësisht "u mbajt" dhe "i anuluar", dhe atëherë asnjë raport nuk do
të ishte i besueshëm. Dy shenjat e pavarura që mbeten — *kontratë shumëvjeçare*
dhe *trajtim* — mund të shoqërojnë çdo status.

**Kontratat nuk fryhen dot:** baza refuzon një numër më të madh se numri i
personave të terminit.

## Pjesa 8 — Lista me shumë termine

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

## Pjesa 9 — Dy gjuhët

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

## Pjesa 10 — Kur diçka nuk shkon

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
