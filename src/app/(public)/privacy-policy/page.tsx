import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { t } from '@/copy';

import { CONSENT_VERSION } from '@/lib/consent/constants';

export const metadata: Metadata = {
  title: 'Adatvédelmi tájékoztató',
  description: 'Olvassa el, hogyan kezeljük az Ön adatait és biztosítjuk azok védelmét.',
};

type Section = {
  heading: string;
  content: ReactNode;
};

const sections: Section[] = [
  {
    heading: '1. Adatkezelő',
    content: (
      <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
        <p>
          Az adatkezelő a <strong>Propono Labs Kft.</strong> (székhely: 1053 Budapest,
          Magyarország), amely a Vyndi ajánlatkészítő szolgáltatás működtetéséért felel. A
          társaság felelős minden, a szolgáltatás igénybevétele során történő adatkezelési
          műveletért.
        </p>
        <p>
          Kapcsolattartó e-mail:{' '}
          <Link
            href="mailto:privacy@vyndi.hu"
            className="text-primary underline-offset-4 hover:underline"
          >
            privacy@vyndi.hu
          </Link>
        </p>
      </div>
    ),
  },
  {
    heading: '2. Milyen adatokat gyűjtünk?',
    content: (
      <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
        <p>A szolgáltatás használata során az alábbi adatokat kezeljük:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Fiókadatok:</strong> név, e-mail-cím, jelszóval védett hitelesítési adatok és a
            csapattagok jogosultságai.
          </li>
          <li>
            <strong>Üzleti és számlázási adatok:</strong> a megvásárolt csomagokra, számlázási
            címre, cégnévre és adószámra vonatkozó információk, amelyeket a fizetési tranzakciók
            teljesítéséhez használunk.
          </li>
          <li>
            <strong>Kommunikációs adatok:</strong> az ügyfélszolgálatnak küldött üzenetek,
            visszajelzések és támogatási kérések tartalma.
          </li>
          <li>
            <strong>Használati adatok:</strong> a Vyndi felületén végzett műveletek metaadatai,
            például bejelentkezési idők, IP-címek, eszköz- és böngészőinformációk, valamint a
            funkcióhasználat statisztikái.
          </li>
          <li>
            <strong>Sütik és hasonló technológiák:</strong> a bejelentkezési munkamenet
            biztosításához, a biztonsághoz, valamint az Ön hozzájárulásán alapuló analitikai és
            marketing célokra használt sütik. Részletek a sütikezelési tájékoztatóban találhatók.
          </li>
        </ul>
      </div>
    ),
  },
  {
    heading: '3. Jogalapok az adatkezeléshez (GDPR 6. cikk)',
    content: (
      <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
        <p>Az adatkezelés az alábbi jogalapok valamelyikén történik:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>6. cikk (1) bekezdés b) pont:</strong> a szerződés teljesítése vagy az ahhoz
            szükséges lépések megtétele, például a fiók létrehozása, a szolgáltatás biztosítása és a
            számlázás.
          </li>
          <li>
            <strong>6. cikk (1) bekezdés c) pont:</strong> jogi kötelezettségeink teljesítése,
            ideértve a számviteli és adózási előírások szerinti megőrzést.
          </li>
          <li>
            <strong>6. cikk (1) bekezdés a) pont:</strong> az Ön hozzájárulása, például amikor
            analitikai vagy marketing célokra elfogadja a nem szükséges sütiket vagy hírleveleket.
          </li>
          <li>
            <strong>6. cikk (1) bekezdés f) pont:</strong> jogos érdekeink, így a szolgáltatás
            fejlesztése, az incidensek megelőzése és a visszaélések kivizsgálása. Ezekben az
            esetekben mindig mérlegeljük az Ön érdekeit és jogait.
          </li>
        </ul>
      </div>
    ),
  },
  {
    heading: '4. Adatmegőrzés',
    content: (
      <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
        <p>
          Az adatokat csak addig őrizzük meg, ameddig az adott cél teljesítéséhez szükséges, illetve
          ameddig jogszabály írja elő:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            A fiókadatokat és a szolgáltatásban végzett műveletek naplóit a fiók fennállása alatt
            kezeljük, majd töröljük vagy anonimizáljuk azokat legfeljebb 30 napon belül a megszűnést
            követően.
          </li>
          <li>
            A számlázási és könyvelési adatokat a számviteli törvényeknek megfelelően legalább 8
            évig megőrizzük.
          </li>
          <li>
            Az ügyfélszolgálati kommunikációt legfeljebb 24 hónapig tároljuk, hogy nyomon
            követhessük az ügyintézést és javíthassuk a szolgáltatást.
          </li>
          <li>
            A hozzájáruláson alapuló marketingadatokat addig kezeljük, amíg vissza nem vonja a
            hozzájárulását vagy amíg aktív ügyfelünk.
          </li>
          <li>
            A sütiket legfeljebb 180 napig őrizzük meg, kivéve a munkamenet-sütiket, amelyek a
            böngésző bezárásával törlődnek.
          </li>
        </ul>
      </div>
    ),
  },
  {
    heading: '5. Az Ön jogai',
    content: (
      <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
        <p>
          Ön jogosult az alábbi jogok gyakorlására. Kérését a{' '}
          <Link
            href="mailto:privacy@vyndi.hu"
            className="text-primary underline-offset-4 hover:underline"
          >
            privacy@vyndi.hu
          </Link>{' '}
          címen vagy postai úton juttathatja el hozzánk:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>hozzáférés kérése az általunk kezelt személyes adataihoz;</li>
          <li>az adatok helyesbítésének vagy frissítésének kérése;</li>
          <li>
            az adatok törlésének kérése, ha az adatkezelés jogalapja megszűnt vagy a hozzájárulását
            visszavonta;
          </li>
          <li>az adatkezelés korlátozásának kérése, például vitatott adatok esetén;</li>
          <li>
            adatainak hordozhatósága, ha az adatkezelés automatizált módon, hozzájárulás vagy
            szerződés alapján történik;
          </li>
          <li>
            tiltakozás jogos érdeken alapuló adatkezelés ellen, ideértve a közvetlen marketinget is.
          </li>
        </ul>
      </div>
    ),
  },
  {
    heading: '6. Kapcsolatfelvétel',
    content: (
      <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
        <p>
          Ha bármilyen kérdése vagy észrevétele van az adatkezeléssel kapcsolatban, írjon nekünk a{' '}
          <Link
            href="mailto:privacy@vyndi.hu"
            className="text-primary underline-offset-4 hover:underline"
          >
            privacy@vyndi.hu
          </Link>{' '}
          címre, vagy küldjön levelet a Propono Labs Kft. postacímére: 1053 Budapest, Magyarország.
        </p>
        <p>Megkeresésére 30 napon belül válaszolunk.</p>
      </div>
    ),
  },
  {
    heading: '7. Felügyeleti hatóság',
    content: (
      <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
        <p>
          Panaszával a Nemzeti Adatvédelmi és Információszabadság Hatósághoz (NAIH) fordulhat (cím:
          1055 Budapest, Falk Miksa utca 9-11.; levelezési cím: 1363 Budapest, Pf. 9.; telefon: +36
          (1) 391-1400; e-mail: ugyfelszolgalat@naih.hu; web:{' '}
          <Link
            href="https://www.naih.hu"
            className="text-primary underline-offset-4 hover:underline"
            rel="noreferrer"
          >
            naih.hu
          </Link>
          ).
        </p>
      </div>
    ),
  },
  {
    heading: '8. Utolsó frissítés',
    content: (
      <p className="text-base leading-relaxed text-muted-foreground">
        Jelen tájékoztató verziója: <strong>{CONSENT_VERSION}</strong>. A módosításokról a
        weboldalon keresztül tájékoztatjuk.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
      <header className="space-y-4 text-center">
        <p className="text-sm uppercase tracking-widest text-muted">Adatvédelem</p>
        <h1 className="text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
          Adatvédelmi tájékoztató
        </h1>
        <div className="flex justify-center">
          <span className="inline-flex items-center rounded-full border border-muted-foreground/40 bg-muted/40 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Policy version {CONSENT_VERSION}
          </span>
        </div>
        <p className="text-lg text-muted-foreground">
          Az alábbi összefoglaló segít megérteni, hogyan gyűjtjük, használjuk fel és óvjuk az Ön
          adatait.
        </p>
      </header>

      <section className="space-y-12">
        {sections.map((section) => (
          <article key={section.heading} className="space-y-4">
            <h2 className="text-2xl font-semibold text-fg sm:text-3xl">{section.heading}</h2>
            {section.content}
          </article>
        ))}
      </section>

      <footer className="rounded-lg bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        További kérdései vannak?{' '}
        <Link
          href="/cookie-policy"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Tekintse meg a sütikezelési tájékoztatót
        </Link>
        .
      </footer>
    </main>
  );
}
