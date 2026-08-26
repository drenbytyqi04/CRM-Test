# CRM — klientë dhe shënime

Një aplikacion i thjeshtë ku shton klientë (emër, telefon, email, status) dhe
mban shënime për secilin prej tyre. Hyrja bëhet me email dhe fjalëkalim, dhe
secili përdorues sheh vetëm klientët e vet.

---

## Pjesa 1 — Çfarë është secila gjë (shpjegim i shkurtër)

Nëse s'ke programuar kurrë, këta janë emrat që do t'i hasësh:

| Fjala | Çfarë do të thotë këtu |
| --- | --- |
| **Next.js** | Programi që ndërton faqet e internetit. Ai është "aplikacioni" yt. |
| **Supabase** | Baza e të dhënave në internet — aty ruhen klientët dhe shënimet, edhe kur kompjuteri fiket. |
| **Node.js / npm** | Mjetet që e ndezin projektin në kompjuterin tënd. `npm` shkarkon bibliotekat. |
| **Terminali** | Dritarja ku shkruan komanda me tastierë. Në Windows: "PowerShell"; në Mac: "Terminal". |
| **Server** | Kompjuteri (këtu: yti) që përgatit faqen para se ta shohë vizitori. |
| **`.env.local`** | Një skedë me rregullimet e lidhjes me Supabase-in. |
| **RLS** | Roja te dera e tabelës: lejon secilin përdorues të prekë vetëm rreshtat e vet. |

Dy fjalë për strukturën: **klienti** është një rresht në tabelën `clients`, dhe
çdo **shënim** është një rresht në tabelën `notes` që "tregon" me gisht se cilit
klient i përket.

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

Tabelat `clients` dhe `notes` janë krijuar dhe të provuara. Për t'i parë: në
Supabase kliko **Table Editor** në menynë e majtë.

Skeda `supabase/schema.sql` mbetet si dëshmi e asaj që u ekzekutua. Do të të
duhej vetëm nëse një ditë krijon një projekt tjetër: e ngjit atje te **SQL
Editor** → **Run**.

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

### Hapi 8: Krijo llogarinë tënde

Ke dy rrugë — e dyta është më e shpejta:

**A) Nga vetë aplikacioni:** shkruaj emailin dhe një fjalëkalim (të paktën 6
shenja) dhe kliko **Regjistrohu**. Supabase të dërgon një email konfirmimi;
kliko lidhjen brenda tij, pastaj kthehu dhe kliko **Hyr**.

**B) Nga paneli i Supabase-it (pa email):** hyr te
<https://supabase.com/dashboard> → projekti **crm-test** → **Authentication** →
**Users** → **Add user** → shëno emailin, fjalëkalimin dhe zgjidh
**Auto Confirm User**. Pastaj hyr në aplikacion me ato të dhëna.

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

Rregullat që i japin administratorit të drejtën të shkruajë shënime, t'i
ndryshojë ato dhe të redaktojë të dhënat te klientët e të tjerëve janë zbatuar
tashmë (skeda `supabase/admin-edit.sql`).

### Hapi 11: Përcjellja e kohës — E GATSHME ✅

Tabela dhe funksioni që numërojnë kohën aktive janë zbatuar
(skeda `supabase/activity.sql`). Shih **Pjesa 6** për mënyrën e matjes.

### Hapi 12: Takimet — TË GATSHME ✅

Tabela `appointments` dhe fushat e reja te klientët janë krijuar
(skeda `supabase/appointments.sql`). Shih **Pjesa 7** për mënyrën si janë
menduar takimet.

### Hapi 13: Tri rolet — TË GATSHME ✅

Rregullat e roleve `user`, `manager` dhe `admin` janë zbatuar
(skeda `supabase/roles.sql`). Shih tabelën te **Pjesa 3**.

Roli caktohet me një rresht te Supabase → SQL Editor:

```sql
update public.profiles set role = 'manager' where email = 'dikush@shembull.com';
```

---

## Pjesa 3 — Si përdoret

- **Shto klient:** plotëso emrin (i detyrueshëm), telefonin, emailin dhe
  statusin, pastaj kliko *Shto klientin*. Klienti shfaqet menjëherë në listë.
- **Shiko një klient:** kliko mbi emrin e tij në listë.
- **Shto shënim:** në faqen e klientit shkruaj në kutinë "Shënim i ri" dhe kliko
  *Ruaj shënimin*. Shënimet renditen nga më i riu te më i vjetri.
- **Statuset:** *I ri* (lead), *Aktiv*, *Joaktiv*.
- **Dil:** butoni lart djathtas. Të dhënat e tua i sheh vetëm llogaria jote.
- **Aktiv sot:** lart djathtas shfaqet koha që ke kaluar sot brenda CRM-së.
  Këtë numër e sheh secili për vete, dhe administratori për të gjithë.
- **Ndrysho të dhënat:** te faqja e klientit, paneli që hapet me një klikim.
  Aty ndryshon emrin, telefonin, emailin dhe statusin.
- **Ndrysho një shënim:** butoni *Ndrysho* poshtë secilit shënim që ke shkruar
  ti. Pas ndryshimit, te data shfaqet edhe "ndryshuar më".

### Takimet

- **Cakto takim:** te kartela e klientit, paneli *Cakto takim të ri*. Shëno call
  center-in, sigurimin aktual, gjuhën, datën e telefonatës, datën e takimit dhe
  numrin e personave.
- **Lista e takimeve:** butoni *Takimet* lart. Filtro sipas statusit dhe shih
  përmbledhjen: sa takime, sa u mbajtën, sa kontrata u mbyllën.
- **Rezultati:** te faqja e takimit zgjidh **një status të vetëm** (I hapur,
  U mbajt, I anuluar, Nuk u arrit, S'deshi takim, Negativ, S'ishte në shtëpi,
  Adresa s'u gjet, S'u këshillua dot) dhe shëno kontratat e mbyllura. Baza nuk
  lejon më shumë kontrata se persona.
- **Personalia:** numri i klientit, gjinia, kombësia, datëlindja, adresa e plotë
  dhe celulari plotësohen te kartela e klientit dhe shfaqen te çdo takim i tij.

### Kush çfarë mundet

| Veprimi | Përdorues | Menaxher | Admin |
| --- | :---: | :---: | :---: |
| Lexon klientët dhe takimet | ✅ | ✅ | ✅ |
| Shkruan shënime | ✅ | ✅ | ✅ |
| Shton dhe ndryshon klientë | ❌ | ✅ | ✅ |
| Cakton dhe ndryshon takime | ❌ | ✅ | ✅ |
| Faqja *Përdoruesit* dhe *Aktiviteti* | ❌ | ❌ | ✅ |

Përdoruesi i thjeshtë e hap çdo takim dhe çdo kartelë klienti, por i sheh si
tekst — pa formularë. Puna e tij regjistrohet përmes shënimeve.

Nëse je **administrator**, ke edhe:

- **Të gjitha / Të mijat** — çelës lart (edhe menaxheri e ka), për të parë të
  dhënat e krejt përdoruesve ose vetëm të tuat.
- **Përdoruesit** — faqe me të gjitha llogaritë, rolin e secilit, kohën aktive
  sot dhe sa klientë e shënime ka. Rolet ndryshohen vetëm nga paneli i
  Supabase-it.
- **Aktiviteti** — tabelë me kohën e secilit përdorues për 7 ditët e fundit,
  ditë pas dite, me totalin. Pika jeshile do të thotë "aktiv tani".
- **Të gjitha takimet** — te faqja e takimeve, çelësi *Të gjitha / Të mijat*,
  me emailin e agjentit që e ka caktuar secilin.
- **Akses i plotë mbi çdo klient** — hap klientin e kujtdo, shkruaj shënime aty,
  ndrysho shënimet e shkruara nga të tjerët dhe redakto të dhënat e klientit,
  edhe kur e ka krijuar dikush tjetër. Te koka e faqes shfaqet se kujt i përket.

Shënimet që shkruan administratori te klienti i dikujt tjetër i sheh edhe
pronari i atij klienti — pra bashkëpunimi mbetet i dukshëm për të dyja anët.

---

## Pjesa 4 — Ku ndodhet çdo gjë në kod

```
app/
  page.tsx                  Faqja kryesore: lista e klientëve + formulari i shtimit
  client-form.tsx           Formulari për të shtuar klient
  actions.ts                Funksionet që ruajnë klientin dhe shënimin
  sign-out-button.tsx       Butoni "Dil"
  setup-notice.tsx          Udhëzimet nëse .env.local mungon
  layout.tsx                Korniza e përbashkët e faqeve
  globals.css               Stilet
  login/
    page.tsx                Faqja e hyrjes
    login-form.tsx          Formulari "Hyr / Regjistrohu"
    actions.ts              Hyrja, regjistrimi dhe dalja
  auth/confirm/route.ts     Aty bie lidhja e konfirmimit nga emaili
  admin/page.tsx            Faqja e administratorit: të gjithë përdoruesit
  admin/aktiviteti/page.tsx Koha e secilit përdorues, ditë pas dite
  activity-tracker.tsx      Sinjali "jam aktiv" çdo 2 minuta
  takimet/
    page.tsx                Lista e takimeve, me filtra sipas statusit
    appointment-form.tsx    Formulari i takimit (krijim dhe ndryshim)
    [id]/page.tsx           Një takim: personalia, të dhënat teknike, rezultati
  clients/[id]/
    page.tsx                Faqja e një klienti + shënimet e tij
    note-form.tsx           Formulari për të shtuar shënim
    edit-form.tsx           Paneli "Ndrysho të dhënat"
    note-item.tsx           Një shënim, me mundësinë për ta ndryshuar
lib/
  supabase/server.ts        Lidhja me bazën për kodin në server
  supabase/proxy.ts         Mban sesionin e freskët në çdo kërkesë
  auth.ts                   "Kush është i kyçur?" dhe "a është admin?"
  types.ts                  Tipat, statuset dhe ndihmësit e vegjël
proxy.ts                    Ndalon të pakyçurit para se të hapin faqet
supabase/
  schema.sql                SQL-i i tabelave dhe i rregullave RLS
  admin.sql                 SQL-i i roleve dhe i administratorit
  admin-edit.sql            SQL-i i redaktimit dhe i shënimeve të adminit
  activity.sql              SQL-i i përcjelljes së kohës
  appointments.sql          SQL-i i takimeve dhe i personalive
  roles.sql                 SQL-i i tri roleve dhe i lejeve
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

**Leximi është i përbashkët, shkrimi jo.** Që një përdorues t'i shohë takimet e
regjistruara, ai duhet të shohë edhe klientët pas tyre; prandaj të gjithë të
kyçurit i lexojnë klientët, takimet dhe shënimet. Shtimi dhe ndryshimi mbeten
të mbyllura: klientët e takimet i prek vetëm menaxheri, shënimin e vet e ndryshon
vetëm autori (ose admini).

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
- **Kush di adresën, sheh faqen e hyrjes** — por jo të dhënat. Për të hyrë
  duhet llogari; nëse nuk do që të regjistrohet kushdo, mund ta çaktivizosh
  regjistrimin te Supabase → **Authentication** → **Sign In / Providers** →
  fik *Allow new users to sign up*.

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

**Çfarë NUK mat:** punë të bërë me telefon, në takim, në letër, ose në ndonjë
program tjetër. Prandaj kjo tabelë tregon kohën në CRM — jo produktivitetin.
Përdore si tregues, jo si dëshmi.

**Transparenca:** secili përdorues e sheh numrin e vet lart në faqe, po aq sa e
sheh administratori. Kjo është me qëllim: përcjellja e fshehtë e punonjësve
krijon probleme ligjore (rregullat e mbrojtjes së të dhënave kërkojnë që
personi të jetë i informuar) dhe prish besimin. Njoftoji punonjësit para se ta
përdorësh këtë faqe.

## Pjesa 7 — Si janë menduar takimet

Modeli është: **klienti** është kartela e përhershme, **takimi** është një ngjarje
e vetme për atë klient. Një klient mund të ketë shumë takime; çdo takim i përket
një klienti.

Nëse të vjen një telefonatë e ftohtë, krijo së pari klientin (mjafton emri),
pastaj cakto takimin. Kështu të dhënat e personit nuk përsëriten te çdo takim
dhe historiku i tij mbetet i plotë.

**Statusi është një i vetëm, jo disa kuti.** Kjo është me qëllim: me kuti të
pavarura mund të shënohej njëkohësisht "u mbajt" dhe "i anuluar", dhe atëherë
asnjë raport nuk do të ishte i besueshëm. Dy shenjat e pavarura që mbeten —
*kontratë shumëvjeçare* dhe *trajtim* — mund të shoqërojnë çdo status.

**Kontratat nuk fryhen dot:** baza refuzon një numër më të madh se numri i
personave të takimit.

## Pjesa 8 — Kur diçka nuk shkon

| Problemi | Zgjidhja |
| --- | --- |
| Faqja tregon kutinë e verdhë "nuk është konfiguruar" | `.env.local` mungon. Përsërit Hapin 6 dhe rinis serverin. |
| "Email ose fjalëkalim i gabuar" | Llogaria s'është krijuar ende ose emaili s'është konfirmuar. Shih Hapin 8. |
| S'të shfaqet shenja "Admin" | SQL-i i `supabase/admin.sql` s'është ekzekutuar, ose rreshti `update ... set role = 'admin'` ka email tjetër. Shih Hapin 9. |
| Regjistrohesh po s'të vjen emaili | Përdor rrugën B të Hapit 8 (krijo përdoruesin nga paneli me *Auto Confirm*). |
| `Nuk u ruajt dot klienti: relation "clients" does not exist` | Je lidhur me një projekt tjetër. Kontrollo `NEXT_PUBLIC_SUPABASE_URL` te `.env.local`. |
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
