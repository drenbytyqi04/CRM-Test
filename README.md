# CRM — klientë dhe shënime

Një aplikacion i thjeshtë ku shton klientë (emër, telefon, email, status) dhe
mban shënime për secilin prej tyre. Pa autentikim — kushdo që e hap adresën e
aplikacionit i sheh të dhënat.

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
| **`.env.local`** | Një skedë me fjalëkalime. Nuk ngarkohet kurrë në internet. |

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

### Hapi 6: Vendos çelësin (i vetmi hap që të mbetet)

1. Hap <https://supabase.com/dashboard> → projekti **crm-test** → **Settings**
   (ikona e ingranazhit) → **API**.
2. Te "Project API keys" gjej rreshtin **`service_role`** dhe kliko **Reveal**.
   Kopjo vargun e gjatë që shfaqet.
3. Në dosjen e projektit, në terminal:

   ```bash
   cp .env.local.example .env.local
   ```

4. Hap skedën `.env.local` me çdo redaktues teksti dhe ngjit çelësin pas
   shenjës `=`:

   ```
   SUPABASE_URL=https://zfdavzndfhsjckvifxur.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   ```

   Adresa është e mbushur tashmë; ti shton vetëm çelësin.

> ⚠️ Çelësi `service_role` është si çelësi kryesor i shtëpisë. Mos ia dërgo
> askujt dhe mos e vendos në asnjë skedë tjetër. `.env.local` nuk ruhet në git,
> prandaj nuk përfundon kurrë në GitHub.

### Hapi 7: Nise aplikacionin

```bash
npm run dev
```

Hap shfletuesin te <http://localhost:3000>. Duhet të shohësh formularin "Shto
klient të ri".

Për ta ndalur serverin: kliko në terminal dhe shtyp **Ctrl + C**.

---

## Pjesa 3 — Si përdoret

- **Shto klient:** plotëso emrin (i detyrueshëm), telefonin, emailin dhe
  statusin, pastaj kliko *Shto klientin*. Klienti shfaqet menjëherë në listë.
- **Shiko një klient:** kliko mbi emrin e tij në listë.
- **Shto shënim:** në faqen e klientit shkruaj në kutinë "Shënim i ri" dhe kliko
  *Ruaj shënimin*. Shënimet renditen nga më i riu te më i vjetri.
- **Statuset:** *I ri* (lead), *Aktiv*, *Joaktiv*.

---

## Pjesa 4 — Ku ndodhet çdo gjë në kod

```
app/
  page.tsx                  Faqja kryesore: lista e klientëve + formulari i shtimit
  client-form.tsx           Formulari për të shtuar klient
  actions.ts                Funksionet që ruajnë të dhënat në Supabase
  setup-notice.tsx          Udhëzimet që shfaqen nëse .env.local mungon
  layout.tsx                Korniza e përbashkët e të gjitha faqeve
  globals.css               Stilet
  clients/[id]/
    page.tsx                Faqja e një klienti të vetëm + shënimet e tij
    note-form.tsx           Formulari për të shtuar shënim
lib/
  supabase.ts               Lidhja me bazën e të dhënave
  types.ts                  Tipat, statuset dhe ndihmësit e vegjël
supabase/
  schema.sql                SQL-i që krijon tabelat
```

Dy koncepte që i ndeshni në kod:

- **Server Component** (`app/page.tsx`) — ekzekutohet vetëm në server dhe mund
  ta pyesë bazën e të dhënave drejtpërdrejt me `await`.
- **Server Action** (`app/actions.ts`) — funksione me `"use server"` lart. Kur
  dërgon një formular, shfletuesi e thërret funksionin në server; kodi dhe
  çelësat nuk zbresin kurrë te vizitori.

---

## Pjesa 5 — Siguria (lexoje para se ta publikosh)

Aplikacioni **nuk ka autentikim**, siç u kërkua. Mbrojtja aktuale është:

- Të gjitha kërkesat drejt Supabase bëhen në server.
- Tabelat kanë **RLS të ndezur pa asnjë rregull**, që do të thotë se askush nuk i
  lexon dot nga jashtë me çelësin publik. Kjo është provuar: një përdorues me
  çelësin publik merr 0 rreshta kur lexon dhe i refuzohet shkrimi.

Prandaj: **mbaje në kompjuterin tënd** derisa të shtosh autentikim. Nëse e
publikon (p.sh. në Vercel), kushdo që e di adresën mund të shtojë, lexojë dhe
ndryshojë të dhëna.

Kur të shtosh autentikim, ndryshimet janë:
1. Aktivizo Supabase Auth dhe kalo nga çelësi `service_role` te çelësi `anon`.
2. Shto kolonën `user_id` te të dyja tabelat.
3. Shto rregulla RLS si shembulli i komentuar në fund të `supabase/schema.sql`.

---

## Pjesa 6 — Kur diçka nuk shkon

| Problemi | Zgjidhja |
| --- | --- |
| Faqja tregon kutinë e verdhë "nuk është konfiguruar" | `.env.local` mungon ose është bosh. Përsërit Hapin 6 dhe rinis serverin. |
| `Nuk u ruajt dot klienti: relation "clients" does not exist` | Je lidhur me një projekt tjetër. Kontrollo që `SUPABASE_URL` te `.env.local` të jetë ai i Hapit 4. |
| `Invalid API key` | Çelësi u kopjua gabim ose është marrë çelësi `anon` në vend të `service_role`. Përsërit Hapin 6. |
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
